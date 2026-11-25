/**
 * The review pool (M8 WP1): `min(3, hardwareConcurrency - 1)` workers (at least one), each running
 * a slice of the same plan (`shard`), so the search phases share the cores. Every worker plans the
 * record the same way, so the items are dealt without the main thread planning anything; results are
 * keyed by item id, so a result is never counted twice. Progress is summed over the workers.
 *
 * The pool is built over a worker factory so tests can run it with in-process workers.
 */
import type { Card } from '@optcg/cards';
import type {
  ReviewMarker,
  ReviewRecord,
  ReviewRequest,
  ReviewResponse,
  TurnResult,
} from '@optcg/ai';
import type { PlayerId } from '@optcg/engine';

/** What the pool needs from a worker. */
export interface WorkerLike {
  postMessage(m: ReviewRequest): void;
  terminate(): void;
  onmessage: ((e: { data: ReviewResponse }) => void) | null;
  onerror: ((e: { message?: string }) => void) | null;
}

export interface PoolInput {
  record: ReviewRecord;
  cards: Card[];
  seats?: PlayerId[];
  /** Per-search node cap and no clock (tests, "Analyse deeper" of the L-slice screen). */
  nodes?: number;
  deadlineMs?: number;
}

export interface PoolHandlers {
  /** Results as they arrive (merge by `itemId`; a later result for an id replaces the earlier). */
  onItems?: (results: TurnResult[]) => void;
  onProgress?: (p: { done: number; total: number; turn: number; turns: number }) => void;
  /** Every worker is idle: the markers of the whole review. */
  onDone?: (markers: ReviewMarker[]) => void;
  onError?: (message: string) => void;
}

export function poolSize(hardwareConcurrency?: number): number {
  const cores = hardwareConcurrency ?? globalThis.navigator?.hardwareConcurrency ?? 2;
  return Math.max(1, Math.min(3, cores - 1));
}

export class ReviewPool {
  private readonly workers: WorkerLike[] = [];
  private readonly idle: boolean[] = [];
  private readonly progress: { done: number; total: number; turn: number; turns: number }[] = [];
  private readonly markers: ReviewMarker[][] = [];
  private stopped = false;

  constructor(
    input: PoolInput,
    private readonly handlers: PoolHandlers,
    createWorker: () => WorkerLike,
    size: number = poolSize(),
  ) {
    for (let i = 0; i < size; i++) {
      const w = createWorker();
      this.workers.push(w);
      this.idle.push(false);
      this.progress.push({ done: 0, total: 0, turn: 1, turns: 0 });
      this.markers.push([]);
      w.onmessage = (e) => this.receive(i, e.data);
      w.onerror = (e) => this.fail(e.message || 'The review stopped.');
      w.postMessage({
        type: 'start',
        record: input.record,
        cards: input.cards,
        ...(input.seats ? { seats: input.seats } : {}),
        ...(input.nodes !== undefined ? { nodes: input.nodes } : {}),
        ...(input.deadlineMs !== undefined ? { deadlineMs: input.deadlineMs } : {}),
        shard: { index: i, count: size },
      });
    }
  }

  get size(): number {
    return this.workers.length;
  }

  private receive(i: number, m: ReviewResponse): void {
    if (this.stopped) return;
    if (m.type === 'items') this.handlers.onItems?.(m.results);
    else if (m.type === 'progress') {
      this.progress[i] = { done: m.done, total: m.total, turn: m.turn, turns: m.turns };
      const sum = this.progress.reduce(
        (t, p) => ({ done: t.done + p.done, total: t.total + p.total }),
        {
          done: 0,
          total: 0,
        },
      );
      this.handlers.onProgress?.({
        ...sum,
        turn: m.turn,
        turns: Math.max(...this.progress.map((p) => p.turns)),
      });
    } else if (m.type === 'done') {
      this.markers[i] = m.markers;
      this.idle[i] = true;
      if (this.idle.every(Boolean)) this.handlers.onDone?.(this.markers.flat());
    } else this.fail(m.message);
  }

  private fail(message: string): void {
    if (this.stopped) return;
    this.cancel();
    this.handlers.onError?.(message);
  }

  /** "Analyse now": this turn's items run next on every worker. */
  prioritise(turn: number): void {
    for (const w of this.workers) w.postMessage({ type: 'prioritise', turn });
  }

  /** Re-run items with `factor` times the cap; `onDone` fires again when they are done. */
  deeper(itemIds: string[], factor: number): void {
    this.idle.fill(false);
    for (const w of this.workers) w.postMessage({ type: 'deeper', itemIds, factor });
  }

  /** Stop: tell each worker, then end it. Nothing more is reported. */
  cancel(): void {
    if (this.stopped) return;
    this.stopped = true;
    for (const w of this.workers) {
      w.postMessage({ type: 'cancel' });
      w.terminate();
    }
  }
}
