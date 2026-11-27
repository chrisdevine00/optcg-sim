/**
 * Items from the player's own games (M9 WP4; learning-ui §7.3 "From your game, turn 9"). Stored
 * reviews hold flags; a flag with a practice judge becomes a drill item once, through the review
 * worker's `puzzle` message (`puzzleFromFlag` runs there, on the whole record), and the result is
 * kept in the `progress` KvStore under `drills.flagItems`, keyed by game and flag, so the next
 * session needs no worker. A mulligan flag is the player's own opening hand: it becomes a
 * `MulliganItem` here, with no worker. A game that has been deleted drops its items, and `dropped`
 * counts them ("2 puzzles came from games you deleted").
 */
import type { Card } from '@optcg/cards';
import type { BoardItem, ReviewFlag, ReviewRecord, ReviewResponse } from '@optcg/ai';
import type { KvStore, ReviewStore, StoredGame } from '../store/types.ts';
import type { DrillEntry, RunItem } from './session.ts';

export const FLAG_ITEMS_KEY = 'drills.flagItems';

export type IntakeStore = Pick<ReviewStore, 'listGames' | 'getGame' | 'getReview'> & {
  progress: KvStore;
};

/** One request to the review worker: the item of a flag, or why it has none. */
export type PuzzleRequester = (
  record: ReviewRecord,
  flag: ReviewFlag,
  cards: Card[],
) => Promise<{ item: BoardItem | null; reason?: string }>;

export interface IntakeDeps {
  loadCards(ids: string[]): Promise<ReadonlyMap<string, Card>>;
  /** The card ids a game needs (`cardIdsOf` of the restore module). */
  cardIdsOf(record: ReviewRecord): string[];
  request: PuzzleRequester;
  /** Ends the requester's worker, when it has one. */
  close?: () => void;
  /** `mulliganItemFromFlag` of `@optcg/ai`. */
  mulliganItem(
    record: ReviewRecord,
    flag: ReviewFlag,
    cards: ReadonlyMap<string, Card>,
    gameId: string,
  ): RunItem | null;
}

interface Cached {
  gameId: string;
  flagId: string;
  /** Null: this flag has no puzzle (`reason` says why); remembered so the worker is not asked again. */
  entry: DrillEntry | null;
  reason?: string;
}
interface CacheFile {
  v: 1;
  items: Record<string, Cached>;
}

const keyOf = (gameId: string, flagId: string): string => `${gameId}:${flagId}`;

async function readCache(kv: KvStore): Promise<CacheFile> {
  const raw = (await kv.get(FLAG_ITEMS_KEY)) as CacheFile | undefined;
  return raw && raw.v === 1 && raw.items ? raw : { v: 1, items: {} };
}

/** The flags of a stored review that can be practised: a practice judge, or a mulligan. */
export function practisableFlags(
  review: { results: Record<string, { flags: ReviewFlag[] }> } | undefined,
): ReviewFlag[] {
  if (!review) return [];
  const out: ReviewFlag[] = [];
  const seen = new Set<string>();
  for (const r of Object.values(review.results))
    for (const f of r.flags) {
      if (seen.has(f.id) || !(f.practice || f.kind === 'mulligan')) continue;
      seen.add(f.id);
      out.push(f);
    }
  return out;
}

const recordOf = (g: StoredGame): ReviewRecord => g.record as unknown as ReviewRecord;

export async function flagBank(
  store: IntakeStore,
  deps: IntakeDeps,
): Promise<{ items: DrillEntry[]; dropped: number }> {
  const games = await store.listGames();
  const live = new Set(games.map((g) => g.id));
  const cache = await readCache(store.progress);
  let dirty = false;

  // Items whose game is gone are dropped (and forgotten).
  let dropped = 0;
  for (const [k, c] of Object.entries(cache.items))
    if (!live.has(c.gameId)) {
      if (c.entry) dropped++;
      delete cache.items[k];
      dirty = true;
    }

  const items: DrillEntry[] = [];
  for (const g of games) {
    const review = await store.getReview(g.id);
    const flags = practisableFlags(review);
    if (flags.length === 0) continue;
    let game: StoredGame | undefined;
    let cards: ReadonlyMap<string, Card> | undefined;
    const ready = async (): Promise<{
      record: ReviewRecord;
      cards: ReadonlyMap<string, Card>;
    } | null> => {
      game ??= await store.getGame(g.id);
      if (!game) return null;
      const record = recordOf(game);
      cards ??= await deps.loadCards(deps.cardIdsOf(record));
      return { record, cards };
    };
    for (const flag of flags) {
      const k = keyOf(g.id, flag.id);
      let hit = cache.items[k];
      if (!hit) {
        const r = await ready();
        if (!r) continue;
        let entry: DrillEntry | null = null;
        let reason: string | undefined;
        if (flag.kind === 'mulligan') {
          const item = deps.mulliganItem(r.record, flag, r.cards, g.id);
          if (item) entry = { item };
          else reason = 'This hand cannot be rebuilt.';
        } else {
          const res = await deps.request(r.record, flag, [...r.cards.values()]);
          if (res.item && flag.practice) {
            // The worker does not know the game's id: the item's id and source carry it here.
            const item: BoardItem = {
              ...res.item,
              id: `flag:${g.id}:${flag.id}`,
              source: { kind: 'flag', gameId: g.id, flagId: flag.id, turn: flag.turn },
            };
            entry = {
              item,
              judge: flag.practice.judge,
              explanation: flag.explanation,
              ...(flag.practice.expect ? { expect: flag.practice.expect } : {}),
            };
          } else reason = res.reason;
        }
        hit = { gameId: g.id, flagId: flag.id, entry, ...(reason ? { reason } : {}) };
        // A flag with no puzzle yet is asked again next time (the builder may have changed).
        if (entry) {
          cache.items[k] = hit;
          dirty = true;
        }
      }
      if (hit.entry) items.push(hit.entry);
    }
  }
  if (dirty) await store.progress.set(FLAG_ITEMS_KEY, cache);
  deps.close?.();
  return { items, dropped };
}

/** "2 puzzles came from games you deleted." */
export const droppedNote = (n: number): string | null =>
  n === 0 ? null : `${n} ${n === 1 ? 'puzzle' : 'puzzles'} came from games you deleted.`;

/**
 * The default requester: one review worker (`review-worker.ts`, the review screen's) answers the
 * `puzzle` messages of a session's flags one after another and is ended by `close`. WP7 wires
 * `puzzleFromFlag` behind the message; until then it answers "not built yet", which is not kept.
 */
export function workerRequester(): PuzzleRequester & { close(): void } {
  let w: Worker | null = null;
  const waiting = new Map<string, (v: { item: BoardItem | null; reason?: string }) => void>();
  const open = (): Worker => {
    if (w) return w;
    const worker = new Worker(new URL('../play/review/review-worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (e: MessageEvent<ReviewResponse>) => {
      const m = e.data;
      if (m.type === 'puzzle')
        waiting.get(m.flagId)?.({ item: m.item, ...(m.reason ? { reason: m.reason } : {}) });
      else if (m.type === 'error')
        for (const f of waiting.values()) f({ item: null, reason: m.message });
    };
    worker.onerror = () => {
      for (const f of waiting.values()) f({ item: null, reason: 'The puzzle could not be built.' });
    };
    return (w = worker);
  };
  const request: PuzzleRequester = (record, flag, cards) =>
    new Promise((resolve) => {
      waiting.set(flag.id, (v) => {
        waiting.delete(flag.id);
        resolve(v);
      });
      open().postMessage({ type: 'puzzle', flagId: flag.id, record, cards });
    });
  return Object.assign(request, {
    close: () => {
      w?.terminate();
      w = null;
    },
  });
}
