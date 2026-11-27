/**
 * Game review: run the review pipeline over a finished game (PLAN rows 13 and 19) and read a
 * record's turns for the timeline. `actual` mode runs here, after the game has ended and only there
 * (the L done criterion): in review the hidden cards are no longer hidden.
 *
 * M8 WP1: the pipeline (`@optcg/ai` `planReview`, `ReviewScheduler`, `ReviewJob`) runs in a pool of
 * workers (`pool.ts`). `startReview` keeps the L-slice screen's shape (a promise of its
 * missed-lethal flags) on top of it; WP6's screen reads `startReviewStream` for the full results,
 * progress, `prioritise` and `deeper`.
 */
import type { Card } from '@optcg/cards';
import type { LethalFlag, ReviewFlag, TurnResult } from '@optcg/ai';
import { reviewRecord } from '@optcg/ai/review';
import type { PlayerId } from '@optcg/engine';
import type { SessionRecord } from '../../session/index.ts';
import { ReviewPool, type PoolHandlers, type WorkerLike } from './pool.ts';

export interface ReviewInput {
  record: SessionRecord;
  cards: Card[];
  /** Whose turns to check: the human seats. */
  seats: PlayerId[];
  /** Per-search node cap and no clock; "Analyse deeper" of the L-slice screen uses ten times 150,000. */
  nodes?: number;
}

/** The L-slice flags of a set of results: the missed-lethal flags and the unfinished checks. */
export function toLethalFlags(results: readonly TurnResult[]): LethalFlag[] {
  const out: LethalFlag[] = [];
  const from = (f: ReviewFlag): LethalFlag | null => {
    if (f.kind !== 'missed-lethal' || !f.lethal) return null;
    return {
      kind: 'missed-lethal',
      turn: f.turn,
      player: f.player,
      actionIndex: f.decisionIndex,
      severity: f.severity === 'severe' ? 'severe' : 'hindsight',
      explanation: f.explanation,
      public: f.lethal.public,
      actual: f.lethal.actual,
    };
  };
  for (const r of results)
    for (const f of r.flags) {
      const l = from(f);
      if (l) out.push(l);
    }
  for (const m of results.flatMap((r) => (r.marker ? [r.marker] : []))) {
    if (m.kind !== 'missed-lethal' || !m.lethal || !m.explanation) continue;
    out.push({
      kind: 'not-fully-checked',
      turn: m.turn,
      player: m.lethal.player,
      actionIndex: m.lethal.actionIndex,
      severity: 'marker',
      explanation: m.explanation,
      public: m.lethal.public,
      actual: m.lethal.actual,
    });
  }
  return out.sort((a, b) => a.actionIndex - b.actionIndex);
}

/** The review itself, in this thread (tests; the app uses the pool). Node-capped, so deterministic. */
export function reviewInline(input: ReviewInput): LethalFlag[] {
  const r = reviewRecord(input.record, input.cards, {
    seats: input.seats,
    nodes: input.nodes ?? 150_000,
  });
  return toLethalFlags(r.results);
}

export interface ReviewRun {
  promise: Promise<LethalFlag[]>;
  cancel(): void;
}

const newWorker = (): WorkerLike =>
  new Worker(new URL('./review-worker.ts', import.meta.url), {
    type: 'module',
  }) as unknown as WorkerLike;

export interface StreamRun {
  /** "Analyse now": this turn's items run next. */
  prioritise(turn: number): void;
  /** Re-run these items with `factor` times the cap. */
  deeper(itemIds: string[], factor: number): void;
  cancel(): void;
}

/** Start the review in a pool of workers; WP6's screen reads results, progress and markers as they come. */
export function startReviewStream(
  input: ReviewInput & { deadlineMs?: number },
  handlers: PoolHandlers,
  createWorker: () => WorkerLike = newWorker,
  size?: number,
): StreamRun {
  const pool = new ReviewPool(
    {
      record: input.record,
      cards: input.cards,
      seats: input.seats,
      ...(input.nodes !== undefined ? { nodes: input.nodes } : {}),
      ...(input.deadlineMs !== undefined ? { deadlineMs: input.deadlineMs } : {}),
    },
    handlers,
    createWorker,
    size,
  );
  return {
    prioritise: (t) => pool.prioritise(t),
    deeper: (ids, f) => pool.deeper(ids, f),
    cancel: () => pool.cancel(),
  };
}

/** Start the review and resolve with its missed-lethal flags (the L-slice screen's contract). */
export function startReview(
  input: ReviewInput,
  createWorker: () => WorkerLike = newWorker,
  size?: number,
): ReviewRun {
  let run: StreamRun | null = null;
  const promise = new Promise<LethalFlag[]>((resolve, reject) => {
    const byItem = new Map<string, TurnResult>();
    run = startReviewStream(
      input,
      {
        onItems: (rs) => rs.forEach((r) => byItem.set(r.itemId, r)),
        onDone: () => {
          resolve(toLethalFlags([...byItem.values()]));
          run?.cancel();
        },
        onError: (m) => reject(new Error(m)),
      },
      createWorker,
      size,
    );
  });
  return { promise, cancel: () => run?.cancel() };
}

/** The record's first `n` actions: the position a flag is cut at (rewinds and auto marks trimmed). */
export function prefixOf(record: SessionRecord, n: number): SessionRecord {
  return {
    ...record,
    actions: record.actions.slice(0, n),
    snapshots: record.snapshots.filter((s) => s.actionIndex <= n),
    rewinds: [],
    auto: record.auto.filter((i) => i < n),
  };
}
