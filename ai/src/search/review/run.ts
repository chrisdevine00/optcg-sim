/**
 * The review runner (M8 WP1): a replay cache and `runItem`. Detectors never replay on their own; they
 * ask `ctx.stateAt(index)`, which starts from the nearest checkpoint (one every 20 actions, the same
 * spacing as the session's) and reduces forward, so an item costs at most 19 reductions to reach.
 */
import type { Card } from '@optcg/cards';
import { queries, reduce, replay, type CardLookup, type GameState } from '@optcg/engine';
import { CapReached, type Cap } from '../lethal/search.ts';
import { runDetector } from './registry.ts';
import type { DetectorContext, ReviewItem, ReviewRecord, TurnResult } from './types.ts';

export const CHECKPOINT_EVERY = 20;

/** `stateAt(i)`: the state after `i` actions, from checkpoints. Throws on a record that cannot replay. */
export class ReplayCache {
  private readonly checkpoints = new Map<number, GameState>();
  private lastIndex = -1;
  private last: GameState | null = null;

  constructor(
    private readonly record: ReviewRecord,
    lookup: CardLookup,
  ) {
    this.checkpoints.set(0, replay(record, lookup, 0).state);
  }

  stateAt = (index: number): GameState => {
    const i = Math.max(0, Math.min(index, this.record.actions.length));
    const hit = this.checkpoints.get(i);
    if (hit) return hit;
    let from = Math.floor(i / CHECKPOINT_EVERY) * CHECKPOINT_EVERY;
    while (!this.checkpoints.has(from)) from -= CHECKPOINT_EVERY;
    let at = from;
    let state = this.checkpoints.get(from)!;
    // The most recent answer is nearer when it is behind the target (items run in order).
    if (this.last && this.lastIndex > at && this.lastIndex <= i) {
      at = this.lastIndex;
      state = this.last;
    }
    for (; at < i; at++) {
      state = reduce(state, this.record.actions[at]!).state;
      if ((at + 1) % CHECKPOINT_EVERY === 0) this.checkpoints.set(at + 1, state);
    }
    this.lastIndex = i;
    this.last = state;
    return state;
  };

  /** Checkpoints held (for the cache test). */
  get size(): number {
    return this.checkpoints.size;
  }
}

export interface RunContext {
  record: ReviewRecord;
  cards: ReadonlyMap<string, Card>;
  lookup: CardLookup;
  cache: ReplayCache;
  result: DetectorContext['result'];
}

export function makeRunContext(
  record: ReviewRecord,
  cards: ReadonlyMap<string, Card>,
  lookup: CardLookup,
): RunContext {
  const cache = new ReplayCache(record, lookup);
  return {
    record,
    cards,
    lookup,
    cache,
    result: queries.result(cache.stateAt(record.actions.length)),
  };
}

/**
 * Run one item with `cap`. A detector's own marker (a search that did not finish) passes through; a
 * cap that escapes a detector, or an error, becomes a marker too: never a clean turn.
 */
export function runItem(item: ReviewItem, rc: RunContext, cap: Cap): TurnResult | null {
  const ctx: DetectorContext = {
    record: rc.record,
    cards: rc.cards,
    lookup: rc.lookup,
    cap,
    result: rc.result,
    stateAt: rc.cache.stateAt,
  };
  try {
    const r = runDetector(item, ctx);
    return r ? { ...r, itemId: item.id } : null;
  } catch (e) {
    return {
      itemId: item.id,
      turn: item.turn,
      flags: [],
      notes: [],
      marker: {
        turn: item.turn,
        kind: item.kind,
        reason: e instanceof CapReached ? 'search-incomplete' : 'not-run',
      },
    };
  }
}
