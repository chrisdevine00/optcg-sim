/**
 * The AI worker client (ARCHITECTURE §4.1, §5). One worker per game. Requests carry an id; a request
 * that is no longer wanted (rewind, new game) is cancelled. If the worker fails, it is restarted
 * once and the request re-sent (flows G8).
 *
 * The worker receives only public card data (the AI's own deck, its opponent's archetype prior and
 * cards that have become visible) and the AI seat's own view (review M3-09, ADR 0005).
 */
import type { Card } from '@optcg/cards';
import type {
  AiRequest,
  AiResponse,
  AiTier,
  AiTiming,
  Decided,
  GameInfo,
  HintResult,
  LethalResult,
  NotImplemented,
  ScoreTable,
  ThreatResult,
} from '@optcg/ai';
import type { PlayerView, SearchView } from '@optcg/engine';

/**
 * Where one request's time went (M10 WP3), in milliseconds: the message there and back
 * (`transferMs`: structured clone and the event loops on both sides), the wait for the worker to be
 * free (`queueMs`: it reads no message while it runs a search, so a request sent during the turn
 * plan waits for the plan; the card scripts and earlier requests in its queue count here too), the
 * session built on first use (`setupMs`) and the search itself (`searchMs`).
 */
export interface AiParts {
  transferMs: number;
  queueMs: number;
  setupMs: number;
  searchMs: number;
}

export interface AiDecision extends Decided {
  /** Worker time for this decision. */
  ms: number;
  stats?: { rollouts: number; actions: number; planned: boolean };
  /** Where the request's time went; absent from a test double. */
  parts?: AiParts;
}

/** Wall-clock epoch ms on the clock the worker's timing shares (`performance.timeOrigin`). */
const epoch = (): number => performance.timeOrigin + performance.now();

/** The measures `ai:request` kept so far (a long session must not grow without bound). */
let measured = 0;
const MEASURE_CAP = 2000;

/**
 * One request's marks and measure (M10 WP3): `ai:send`, `ai:search-start` (the session is built and
 * the search begins), `ai:search-end` and `ai:recv` as marks on the page's timeline, and an
 * `ai:request` measure from send to recv carrying the parts in its `detail`. They are what
 * `app/e2e/perf-frames.spec.ts` reads and what a performance trace shows.
 */
function recordRequest(
  id: number,
  type: string,
  sent: number,
  recv: number,
  t: AiTiming,
  busyUntil: number,
  rollouts?: number,
): AiParts {
  // The worker answers in order, so it was busy with an earlier request until `busyUntil`; the part
  // of the trip before it read this message is that wait, not transfer.
  const trip = Math.max(0, t.recv - sent);
  const behind = Math.min(trip, Math.max(0, busyUntil - sent));
  const parts: AiParts = {
    transferMs: trip - behind + Math.max(0, recv - t.end),
    queueMs: behind + Math.max(0, t.start - t.recv),
    setupMs: Math.max(0, t.built - t.start),
    searchMs: Math.max(0, t.end - t.built),
  };
  if (measured < MEASURE_CAP && typeof performance.measure === 'function') {
    measured++;
    const at = (e: number) => e - performance.timeOrigin;
    try {
      const detail = { id, type, ...parts, totalMs: recv - sent, rollouts: rollouts ?? null };
      performance.mark('ai:send', { startTime: at(sent), detail: { id } });
      performance.mark('ai:search-start', { startTime: at(t.built), detail: { id } });
      performance.mark('ai:search-end', { startTime: at(t.end), detail: { id } });
      performance.mark('ai:recv', { startTime: at(recv), detail: { id } });
      performance.measure('ai:request', { start: at(sent), end: at(recv), detail });
    } catch {
      // A browser without the User Timing level 3 options: the parts are still returned.
    }
  }
  return parts;
}

type Req = Extract<
  AiRequest,
  { type: 'decide' | 'planTurn' | 'lethal' | 'hint' | 'score' | 'threat' }
>;

/** What the coach asks of a worker (a second `AiClient`, which never sees the AI seat's data). */
export interface LethalPort {
  lethal(
    view: SearchView,
    opts: { priority: 2 | 3 | 4; capMs?: number; nodes?: number },
  ): { id: number; result: Promise<LethalAnswer> };
  reveal(cards: Iterable<Card>): void;
  cancel(id: number): void;
  terminate(): void;
}

/**
 * What the coach asks of its worker (M7). The three new answers are the result, or a typed
 * `not-implemented` until WP1 to WP3 build them; the panel treats that as "no answer yet".
 */
export interface CoachPort extends LethalPort {
  hint(view: SearchView, opts: { budgetMs: number }): { id: number; result: Promise<HintAnswer> };
  score(view: SearchView, opts: { budgetMs: number }): { id: number; result: Promise<ScoreAnswer> };
  threat(
    view: SearchView,
    opts: { capMs: number; ownDeck?: string[]; priority?: 2 | 4 },
  ): { id: number; result: Promise<ThreatAnswer> };
  /** Start the worker afresh (a stopped hint may still be running); optional, tests omit it. */
  restart?(): void;
}

export interface HintAnswer {
  result: HintResult | NotImplemented;
  ms: number;
}
export interface ScoreAnswer {
  result: ScoreTable | NotImplemented;
  ms: number;
}
export interface ThreatAnswer {
  result: ThreatResult | NotImplemented;
  ms: number;
}

export interface LethalAnswer {
  result: LethalResult;
  ms: number;
}

interface Pending {
  resolve: (r: AiResponse) => void;
  reject: (e: Error) => void;
  req: Req;
  retried: boolean;
  /** When the request was posted (epoch ms), for the transfer time. */
  sentAt: number;
}

export class AiClient implements CoachPort {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private cards: Card[];
  private readonly game: GameInfo | undefined;
  /** Card ids the worker holds (all public). */
  private readonly sent = new Set<string>();

  constructor(cards: Card[], game?: GameInfo) {
    this.cards = cards;
    this.game = game;
    this.worker = this.spawn();
  }

  private wire(w: Worker): Worker {
    w.onmessage = (e: MessageEvent<AiResponse>) => this.receive(e.data);
    w.onerror = () => this.crashed();
    return w;
  }

  private spawn(): Worker {
    const w = this.wire(new Worker(new URL('./ai-worker.ts', import.meta.url), { type: 'module' }));
    const init = {
      type: 'init',
      cards: this.cards,
      ...(this.game ? { game: this.game } : {}),
    } satisfies AiRequest;
    w.postMessage(init);
    for (const c of this.cards) this.sent.add(c.id);
    return w;
  }

  private receive(r: AiResponse): void {
    const p = this.pending.get(r.id);
    if (!p) return;
    this.pending.delete(r.id);
    if (r.type === 'error') p.reject(new Error(r.message));
    else {
      if ((r.type === 'decision' || r.type === 'planned') && r.t) {
        this.parts.set(
          r.id,
          recordRequest(
            r.id,
            p.req.type,
            p.sentAt,
            epoch(),
            r.t,
            this.busyUntil,
            r.type === 'planned' ? r.rollouts : r.stats?.rollouts,
          ),
        );
        this.busyUntil = Math.max(this.busyUntil, r.t.end);
      }
      p.resolve(r);
    }
  }

  /** When the worker last finished a request (epoch ms): it was busy until then. */
  private busyUntil = 0;
  /** The parts of the answers just received, by request id; `decide` collects its own. */
  private readonly parts = new Map<number, AiParts>();

  private crashed(): void {
    this.worker.terminate();
    this.sent.clear();
    this.worker = this.spawn();
    for (const [id, p] of this.pending) {
      if (p.retried) {
        this.pending.delete(id);
        p.reject(new Error('The AI stopped responding.'));
      } else {
        p.retried = true;
        this.worker.postMessage(p.req);
      }
    }
  }

  /** Public card data for cards that have become visible to the AI seat (by card id). */
  reveal(cards: Iterable<Card>): void {
    const fresh = [...cards].filter((c) => !this.sent.has(c.id));
    if (fresh.length === 0) return;
    for (const c of fresh) this.sent.add(c.id);
    this.cards = [...this.cards, ...fresh];
    this.worker.postMessage({ type: 'cards', cards: fresh } satisfies AiRequest);
  }

  private send(req: Req): Promise<AiResponse> {
    const result = new Promise<AiResponse>((resolve, reject) => {
      this.pending.set(req.id, { resolve, reject, req, retried: false, sentAt: epoch() });
    });
    this.worker.postMessage(req satisfies AiRequest);
    return result;
  }

  /** Plan the AI's turn ahead (the worker keeps the plan for the decisions that follow). */
  planTurn(view: SearchView, seed: number): { id: number; result: Promise<void> } {
    const id = this.nextId++;
    const result = this.send({ type: 'planTurn', id, view, seed }).then(() => {
      this.parts.delete(id);
    });
    return { id, result };
  }

  decide(
    view: PlayerView | SearchView,
    tier: AiTier,
    seed: number,
  ): { id: number; result: Promise<AiDecision> } {
    const id = this.nextId++;
    const result = this.send({ type: 'decide', id, view, tier, seed, budgetMs: 400 }).then((r) => {
      if (r.type !== 'decision') throw new Error('The AI answered the wrong request.');
      const parts = this.parts.get(id);
      this.parts.delete(id);
      return {
        action: r.action,
        explanation: r.explanation,
        alternatives: [],
        ms: r.ms,
        ...(r.stats ? { stats: r.stats } : {}),
        ...(parts ? { parts } : {}),
      };
    });
    return { id, result };
  }

  /**
   * Can the viewing seat win this turn (`public` mode: only its own `SearchView`)? Used by the
   * coach's worker, a second client holding only the player's own data and the public prior.
   */
  lethal(
    view: SearchView,
    opts: { priority: 2 | 3 | 4; capMs?: number; nodes?: number },
  ): { id: number; result: Promise<LethalAnswer> } {
    const id = this.nextId++;
    const req = {
      type: 'lethal',
      id,
      mode: 'public',
      view,
      priority: opts.priority,
      ...(opts.capMs !== undefined ? { capMs: opts.capMs } : {}),
      ...(opts.nodes !== undefined ? { nodes: opts.nodes } : {}),
    } satisfies Req;
    const result = this.send(req).then((r) => {
      if (r.type !== 'lethal') throw new Error('The worker answered the wrong request.');
      return { result: r.result, ms: r.ms };
    });
    return { id, result };
  }

  /** A line to play now (the coach's worker; the asking seat's own view only). */
  hint(view: SearchView, opts: { budgetMs: number }): { id: number; result: Promise<HintAnswer> } {
    const id = this.nextId++;
    const result = this.send({ type: 'hint', id, view, budgetMs: opts.budgetMs }).then((r) => {
      if (r.type !== 'hint') throw new Error('The worker answered the wrong request.');
      return { result: r.result, ms: r.ms };
    });
    return { id, result };
  }

  /** Every legal action valued, for the blunder warning. */
  score(
    view: SearchView,
    opts: { budgetMs: number },
  ): { id: number; result: Promise<ScoreAnswer> } {
    const id = this.nextId++;
    const result = this.send({ type: 'score', id, view, budgetMs: opts.budgetMs }).then((r) => {
      if (r.type !== 'score') throw new Error('The worker answered the wrong request.');
      return { result: r.result, ms: r.ms };
    });
    return { id, result };
  }

  /** Does the opponent's board threaten lethal on their turn. */
  threat(
    view: SearchView,
    opts: { capMs: number; ownDeck?: string[]; priority?: 2 | 4 },
  ): { id: number; result: Promise<ThreatAnswer> } {
    const id = this.nextId++;
    const result = this.send({
      type: 'threat',
      id,
      view,
      capMs: opts.capMs,
      ...(opts.ownDeck ? { ownDeck: opts.ownDeck } : {}),
      ...(opts.priority ? { priority: opts.priority } : {}),
    }).then((r) => {
      if (r.type !== 'threat') throw new Error('The worker answered the wrong request.');
      return { result: r.result, ms: r.ms };
    });
    return { id, result };
  }

  /** Terminate and respawn: pending requests are re-sent (the coach's worker, after a stopped hint). */
  restart(): void {
    this.crashed();
  }

  cancel(id: number): void {
    const p = this.pending.get(id);
    if (!p) return;
    this.pending.delete(id);
    this.worker.postMessage({ type: 'cancel', id } satisfies AiRequest);
    p.reject(new Error('cancelled'));
  }

  /** Forget the turn plan and battle memory (a rewind). */
  reset(): void {
    this.worker.postMessage({ type: 'reset' } satisfies AiRequest);
  }

  terminate(): void {
    for (const id of [...this.pending.keys()]) this.cancel(id);
    this.worker.terminate();
  }
}
