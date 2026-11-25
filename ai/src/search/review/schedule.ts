/**
 * The review scheduler and job (M8 WP1).
 *
 * `ReviewScheduler` is pure bookkeeping: it orders the plan's items by phase (A cheap, B missed
 * lethal, C lost-turn searches, D attack values), hands out the next item with a search cap, takes
 * `prioritise` ("Analyse now": one turn's items first) and `deeper` (re-run items with a larger cap),
 * and turns every item that never ran into a "Not fully checked" marker.
 *
 * Caps. With a `nodes` option (tests, CI) a search gets exactly that node cap and no clock is read
 * for it: results are deterministic. Without it a search gets `nodes` 150,000 and `ms = min(kindCap,
 * (deadline - now) / itemsLeft)`, so a slow early item cannot starve the later ones, and the whole
 * review ends by the deadline (default 55 s: the 60 s done criterion with a margin). An item that
 * would start after the deadline does not run.
 *
 * `ReviewJob` is the worker's body without the worker: it handles the `ReviewRequest`s, plans, runs
 * item by item, and yields a macrotask between items so a `cancel`, `prioritise` or `deeper` that
 * arrived in the meantime is seen before the next item.
 */
import type { Card } from '@optcg/cards';
import type { CardLookup } from '@optcg/engine';
import type { Cap } from '../lethal/search.ts';
import { phaseOf, planReview, type Phase, type ReviewPlan } from './plan.ts';
import { makeRunContext, runItem, type RunContext } from './run.ts';
import type {
  FlagKind,
  ReviewItem,
  ReviewMarker,
  ReviewRequest,
  ReviewResponse,
  TurnResult,
} from './types.ts';

export const DEFAULT_DEADLINE_MS = 55_000;
export const DEFAULT_NODES = 150_000;

/** The most wall-clock time one search of each kind may take (the app only). */
export const KIND_CAP_MS: Readonly<Record<FlagKind, number>> = {
  mulligan: 500,
  'don-unused': 500,
  'counter-wasted': 500,
  'missed-lethal': 6000,
  'should-counter': 4000,
  'given-away': 4000,
  target: 1500,
};

const PHASE_ORDER: Record<Phase, number> = { A: 0, B: 1, C: 2, D: 3 };

export interface ScheduleOptions {
  /** Per-search node cap and no clock (tests). */
  nodes?: number;
  /** Whole-review deadline in ms; default 55,000. Read from `now`. */
  deadlineMs?: number;
  /** The clock; default `performance.now`. Tests inject one. */
  now?: () => number;
  /** This worker's slice of the plan (a pool). */
  shard?: { index: number; count: number };
}

export class ReviewScheduler {
  private queue: ReviewItem[];
  private readonly all: ReviewItem[];
  private readonly finished = new Set<string>();
  private readonly results = new Map<string, TurnResult>();
  private readonly factor = new Map<string, number>();
  private readonly t0: number;
  private readonly now: () => number;
  private lastTurn = 1;
  /** `deeper` items run outside the deadline: the owner asked for more time on them. */
  private readonly deeperIds = new Set<string>();

  constructor(
    readonly plan: ReviewPlan,
    private readonly opts: ScheduleOptions = {},
  ) {
    this.now = opts.now ?? (() => performance.now());
    this.t0 = this.now();
    const ordered = plan.items
      .map((it, i) => ({ it, i }))
      .sort((a, b) => PHASE_ORDER[phaseOf(a.it)] - PHASE_ORDER[phaseOf(b.it)] || a.i - b.i)
      .map((x) => x.it);
    const sh = opts.shard;
    this.all = sh ? ordered.filter((_, k) => k % sh.count === sh.index) : ordered;
    this.queue = this.all.slice();
  }

  get total(): number {
    return this.all.length;
  }
  get done(): number {
    return this.finished.size;
  }
  get pending(): number {
    return this.queue.length;
  }
  get turn(): number {
    return this.lastTurn;
  }
  get deadlineAt(): number {
    return this.t0 + (this.opts.deadlineMs ?? DEFAULT_DEADLINE_MS);
  }

  /** The items this scheduler owns, in the order they will run (phase, then game order). */
  items(): readonly ReviewItem[] {
    return this.all;
  }

  /** "Analyse now": this turn's pending items run next, in phase order. */
  prioritise(turn: number): void {
    const first = this.queue.filter((x) => x.turn === turn);
    this.queue = [...first, ...this.queue.filter((x) => x.turn !== turn)];
  }

  /** Re-run items this scheduler owns with `factor` times the cap (outside the deadline). */
  deeper(ids: readonly string[], factor: number): ReviewItem[] {
    const mine = this.all.filter((x) => ids.includes(x.id));
    for (const x of mine) {
      this.factor.set(x.id, factor);
      this.deeperIds.add(x.id);
      this.finished.delete(x.id);
      if (!this.queue.includes(x)) this.queue.unshift(x);
    }
    return mine;
  }

  /** The next item with its cap, or null when none is left or the deadline has passed. */
  next(): { item: ReviewItem; cap: Cap } | null {
    const item = this.queue[0];
    if (!item) return null;
    const timed = this.opts.nodes === undefined;
    const outside = this.deeperIds.has(item.id);
    if (timed && !outside && this.now() >= this.deadlineAt) return null;
    this.queue.shift();
    return { item, cap: this.capFor(item) };
  }

  /** The cap an item gets now. */
  capFor(item: ReviewItem): Cap {
    const f = this.factor.get(item.id) ?? 1;
    if (this.opts.nodes !== undefined) return { nodes: this.opts.nodes * f };
    const kindMs = KIND_CAP_MS[item.kind] * f;
    if (this.deeperIds.has(item.id)) return { nodes: DEFAULT_NODES * f, ms: kindMs };
    const left = this.queue.filter((x) => x.cost !== 'cheap').length + 1;
    const share = (this.deadlineAt - this.now()) / left;
    return { nodes: DEFAULT_NODES * f, ms: Math.max(1, Math.min(kindMs, share)) };
  }

  /** Record an item's result; true when it replaced an earlier one (a `deeper` re-run). */
  complete(item: ReviewItem, result: TurnResult | null): boolean {
    this.finished.add(item.id);
    this.lastTurn = item.turn;
    const replaced = this.results.has(item.id);
    if (result) this.results.set(item.id, result);
    else this.results.delete(item.id);
    return replaced;
  }

  /** Every result so far. */
  resultList(): TurnResult[] {
    return [...this.results.values()];
  }

  /**
   * The "Not fully checked" markers: those the detectors raised, and one for each turn with items
   * that never ran (`deadline`; `not-run` when `cancelled`). One per turn and kind; a turn whose
   * unrun items are of several kinds gets one marker with `kind: null`.
   */
  markers(cancelled = false): ReviewMarker[] {
    const out: ReviewMarker[] = [];
    for (const r of this.results.values()) if (r.marker) out.push(r.marker);
    const unrun = this.all.filter((x) => !this.finished.has(x.id));
    const byTurn = new Map<number, Set<FlagKind>>();
    for (const x of unrun) {
      const kinds = byTurn.get(x.turn) ?? new Set<FlagKind>();
      kinds.add(x.kind);
      byTurn.set(x.turn, kinds);
    }
    for (const [turn, kinds] of byTurn)
      out.push({
        turn,
        kind: kinds.size === 1 ? [...kinds][0]! : null,
        reason: cancelled ? 'not-run' : 'deadline',
      });
    return out;
  }
}

// ---------------------------------------------------------------------------------------------
// The job: the worker's body
// ---------------------------------------------------------------------------------------------

export type StartRequest = Extract<ReviewRequest, { type: 'start' }>;

export interface JobOptions {
  /** Awaited between items; default a macrotask (so queued messages are delivered). */
  yieldFn?: () => Promise<void>;
  now?: () => number;
}

const macrotask = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

export class ReviewJob {
  private sched: ReviewScheduler | null = null;
  private rc: RunContext | null = null;
  private running = false;
  private cancelled = false;
  private readonly yieldFn: () => Promise<void>;

  constructor(
    private readonly post: (r: ReviewResponse) => void,
    private readonly opts: JobOptions = {},
  ) {
    this.yieldFn = opts.yieldFn ?? macrotask;
  }

  /** Plan and run the whole review; resolves when it is done or cancelled. */
  async start(req: StartRequest): Promise<void> {
    // A job runs once: a `cancel` that arrives before `start` (while the worker loads scripts) holds.
    if (this.cancelled) return;
    try {
      const cards = new Map(req.cards.map((c: Card) => [c.id, c] as const));
      const lookup: CardLookup = (id) => cards.get(id);
      const plan = planReview(req.record, lookup, cards, req.seats ? { seats: req.seats } : {});
      this.rc = makeRunContext(req.record, cards, lookup);
      this.sched = new ReviewScheduler(plan, {
        ...(req.nodes !== undefined ? { nodes: req.nodes } : {}),
        ...(req.deadlineMs !== undefined ? { deadlineMs: req.deadlineMs } : {}),
        ...(req.shard ? { shard: req.shard } : {}),
        ...(this.opts.now ? { now: this.opts.now } : {}),
      });
      this.post({ type: 'progress', done: 0, total: this.sched.total, turn: 1, turns: plan.turns });
      await this.pump();
    } catch (e) {
      this.post({ type: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }

  /** `cancel`, `prioritise` and `deeper` (a `start` goes through `start`). */
  handle(req: Exclude<ReviewRequest, { type: 'start' }>): void {
    const s = this.sched;
    if (req.type === 'cancel') {
      this.cancelled = true;
      return;
    }
    if (!s) return;
    if (req.type === 'prioritise') s.prioritise(req.turn);
    else if (req.type === 'deeper') {
      const mine = s.deeper(req.itemIds, req.factor);
      // Every worker of a pool answers a `deeper` with a `done`, even one that owns none of the items.
      if (mine.length === 0) this.post({ type: 'done', markers: s.markers() });
      else if (!this.running) void this.pump().catch((e: unknown) => this.fail(e));
    }
  }

  private fail(e: unknown): void {
    this.post({ type: 'error', message: e instanceof Error ? e.message : String(e) });
  }

  private async pump(): Promise<void> {
    const s = this.sched!;
    const rc = this.rc!;
    if (this.running) return;
    this.running = true;
    try {
      for (;;) {
        if (this.cancelled) return;
        const n = s.next();
        if (!n) break;
        const r = runItem(n.item, rc, n.cap);
        const replaced = s.complete(n.item, r);
        // A re-run that now finds nothing clears what the first run found: an empty result says so.
        if (r) this.post({ type: 'items', results: [r] });
        else if (replaced)
          this.post({
            type: 'items',
            results: [{ itemId: n.item.id, turn: n.item.turn, flags: [], notes: [] }],
          });
        this.post({
          type: 'progress',
          done: s.done,
          total: s.total,
          turn: s.turn,
          turns: s.plan.turns,
        });
        await this.yieldFn();
      }
      this.post({ type: 'done', markers: s.markers() });
    } finally {
      this.running = false;
    }
  }
}

// ---------------------------------------------------------------------------------------------
// The whole review in one call (tests, the bench, the L-slice `reviewInline`)
// ---------------------------------------------------------------------------------------------

export interface SyncReview {
  plan: ReviewPlan;
  results: TurnResult[];
  markers: ReviewMarker[];
  /** Milliseconds each phase took, summed over its items. */
  phaseMs: Record<Phase, number>;
  /** Items run per phase. */
  phaseItems: Record<Phase, number>;
}

/** Plan and run every item in turn, with no yielding. Same caps and deadline rules as the worker. */
export function reviewRecord(
  record: StartRequest['record'],
  cards: readonly Card[],
  opts: ScheduleOptions & { seats?: StartRequest['seats'] } = {},
): SyncReview {
  const map = new Map(cards.map((c) => [c.id, c] as const));
  const lookup: CardLookup = (id) => map.get(id);
  const { seats, ...sched } = opts;
  const plan = planReview(record, lookup, map, seats ? { seats } : {});
  const s = new ReviewScheduler(plan, sched);
  const rc = makeRunContext(record, map, lookup);
  const phaseMs: Record<Phase, number> = { A: 0, B: 0, C: 0, D: 0 };
  const phaseItems: Record<Phase, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (let n = s.next(); n; n = s.next()) {
    const t = performance.now();
    s.complete(n.item, runItem(n.item, rc, n.cap));
    const ph = phaseOf(n.item);
    phaseMs[ph] += performance.now() - t;
    phaseItems[ph]++;
  }
  return { plan, results: s.resultList(), markers: s.markers(), phaseMs, phaseItems };
}
