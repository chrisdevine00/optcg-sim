/**
 * Game review: run the missed-lethal check over a finished game in a worker (PLAN row 13), and read
 * a record's turns for the timeline. `actual` mode runs here, after the game has ended and only
 * there (the L done criterion): in review the hidden cards are no longer hidden.
 */
import type { Card } from '@optcg/cards';
import { reviewMissedLethal, type LethalFlag } from '@optcg/ai';
import type { PlayerId } from '@optcg/engine';
import type { SessionRecord } from '../../session/index.ts';

export interface ReviewInput {
  record: SessionRecord;
  cards: Card[];
  /** Whose turns to check: the human seats. */
  seats: PlayerId[];
  /** Per-search node cap; "Analyse deeper" uses ten times the default. */
  nodes?: number;
}

export type ReviewMessage =
  { type: 'flags'; flags: LethalFlag[] } | { type: 'error'; message: string };

/** The review itself. The worker calls this; tests call it directly. */
export function reviewInline(input: ReviewInput): LethalFlag[] {
  const map = new Map(input.cards.map((c) => [c.id, c]));
  return reviewMissedLethal(input.record, (id) => map.get(id), map, {
    seats: input.seats,
    ...(input.nodes !== undefined ? { cap: { nodes: input.nodes } } : {}),
  });
}

export interface ReviewRun {
  promise: Promise<LethalFlag[]>;
  cancel(): void;
}

/** Start the review in a worker. */
export function startReview(input: ReviewInput): ReviewRun {
  const worker = new Worker(new URL('./review-worker.ts', import.meta.url), { type: 'module' });
  const promise = new Promise<LethalFlag[]>((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<ReviewMessage>) => {
      worker.terminate();
      if (e.data.type === 'flags') resolve(e.data.flags);
      else reject(new Error(e.data.message));
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || 'The review stopped.'));
    };
    worker.postMessage(input);
  });
  return {
    promise,
    cancel: () => {
      worker.terminate();
    },
  };
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
