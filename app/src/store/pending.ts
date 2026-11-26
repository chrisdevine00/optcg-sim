/**
 * The finished game's safety copy (M8 WP7 fix). An IndexedDB write is a few asynchronous hops; a
 * player who reloads or closes the tab in that window lost the game they had just finished. So the
 * seam writes the game to localStorage synchronously first, removes it once IndexedDB has committed,
 * and the next start (`open.ts`) finishes any copy that is still there. Saving is idempotent by id,
 * so doing it twice changes nothing. A copy too big for localStorage is skipped: the IndexedDB write
 * is then the only one, as before.
 */
import { sanitizeGame } from './validate.ts';
import type { ReviewStore, StoredGame } from './types.ts';

export const PENDING_PREFIX = 'optcg-sim.pending-save.';

function storage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

/** Synchronous; never throws. */
export function stashGame(game: StoredGame, ls: Storage | null = storage()): void {
  try {
    ls?.setItem(PENDING_PREFIX + game.id, JSON.stringify(game));
  } catch {
    /* over the localStorage quota, or storage off: the IndexedDB write stands alone */
  }
}

export function unstashGame(id: string, ls: Storage | null = storage()): void {
  try {
    ls?.removeItem(PENDING_PREFIX + id);
  } catch {
    /* nothing to do */
  }
}

/** At start: save every stashed game into the store, then remove its copy. Returns how many. */
export async function flushStashed(
  store: ReviewStore,
  ls: Storage | null = storage(),
): Promise<number> {
  if (!ls) return 0;
  const keys: string[] = [];
  try {
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k?.startsWith(PENDING_PREFIX)) keys.push(k);
    }
  } catch {
    return 0;
  }
  let saved = 0;
  for (const k of keys) {
    try {
      const raw = ls.getItem(k);
      if (raw === null) continue;
      let game: StoredGame | null = null;
      try {
        game = sanitizeGame(JSON.parse(raw));
      } catch {
        game = null; // unreadable: drop it, it could not be shown anyway
      }
      if (game) {
        await store.saveGame(game);
        saved++;
      }
      ls.removeItem(k);
    } catch {
      /* the copy stays for the next start (full store, or the store failed) */
    }
  }
  return saved;
}
