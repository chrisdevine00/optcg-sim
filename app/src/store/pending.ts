/**
 * The finished game's safety copy (M8 WP7 fix, M8 fix round R3 and R11). A finished game is never
 * dropped. The seam writes it to localStorage synchronously first (and keeps it in memory for the
 * session), removes the copy once IndexedDB has committed, and keeps it when the save failed (the
 * store is full, or at the 200-game cap): the copy is saved again after a delete, after a later
 * successful save, from "Save this game", or at the next start. Saving is idempotent by id, so doing
 * it twice changes nothing. A copy too big for localStorage is skipped, and the in-memory copy
 * stands for the session.
 *
 * With no IndexedDB (the in-memory store) the copy is the only thing that survives a reload, so it is
 * kept after the save, bounded: the newest `MEMORY_MODE_KEEP` games, none over `MEMORY_MODE_MAX_CHARS`.
 */
import { sanitizeGame } from './validate.ts';
import type { ReviewStore, StoredGame } from './types.ts';

export const PENDING_PREFIX = 'optcg-sim.pending-save.';
/** With no IndexedDB: how many finished games keep a localStorage copy. */
export const MEMORY_MODE_KEEP = 3;
/** With no IndexedDB: a game bigger than this (as JSON characters) keeps no copy. */
export const MEMORY_MODE_MAX_CHARS = 600_000;

function storage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

/** This session's games that have not reached the store (a failed save, or storage too full to copy). */
const held = new Map<string, StoredGame>();
let listener: (() => void) | null = null;
const notify = () => listener?.();

/** Tests: forget this session's waiting games. */
export function resetPendingForTests(): void {
  held.clear();
}

/** `open.ts` shows the count ("Save this game"). */
export function watchPending(fn: (() => void) | null): void {
  listener = fn;
}

function keysOf(ls: Storage | null): string[] {
  const keys: string[] = [];
  try {
    if (ls)
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k?.startsWith(PENDING_PREFIX)) keys.push(k);
      }
  } catch {
    /* storage off */
  }
  return keys;
}

/** How many finished games are waiting for the store. */
export function pendingCount(ls: Storage | null = storage()): number {
  const ids = new Set(held.keys());
  for (const k of keysOf(ls)) ids.add(k.slice(PENDING_PREFIX.length));
  return ids.size;
}

/** Synchronous; never throws. `maxChars` skips the localStorage copy of a bigger game. */
export function stashGame(
  game: StoredGame,
  ls: Storage | null = storage(),
  maxChars = Infinity,
): void {
  held.set(game.id, game);
  try {
    const text = JSON.stringify(game);
    if (text.length <= maxChars) ls?.setItem(PENDING_PREFIX + game.id, text);
  } catch {
    /* over the localStorage quota, or storage off: the in-memory copy stands for the session */
  }
  notify();
}

export function unstashGame(id: string, ls: Storage | null = storage()): void {
  held.delete(id);
  try {
    ls?.removeItem(PENDING_PREFIX + id);
  } catch {
    /* nothing to do */
  }
  notify();
}

/** Keep the newest `keep` copies in storage (and in memory), drop the rest. */
export function pruneStash(keep: number, ls: Storage | null = storage()): void {
  const items: { key: string; at: number }[] = keysOf(ls).map((key) => {
    let at: number;
    try {
      at =
        (JSON.parse(ls?.getItem(key) ?? 'null') as { meta?: { endedAt?: number } } | null)?.meta
          ?.endedAt ?? 0;
    } catch {
      at = 0;
    }
    return { key, at };
  });
  items.sort((a, b) => b.at - a.at);
  for (const { key } of items.slice(keep)) unstashGame(key.slice(PENDING_PREFIX.length), ls);
}

/** Every waiting game: this session's own, then any copy another page left in storage. */
function readAll(ls: Storage | null, withHeld = true): { id: string; game: StoredGame | null }[] {
  const out = new Map<string, StoredGame | null>();
  if (withHeld) for (const [id, g] of held) out.set(id, g);
  for (const k of keysOf(ls)) {
    const id = k.slice(PENDING_PREFIX.length);
    if (out.has(id)) continue;
    let game: StoredGame | null;
    try {
      const raw = ls?.getItem(k);
      game = raw ? sanitizeGame(JSON.parse(raw)) : null; // unreadable: dropped, it could not be shown
    } catch {
      game = null;
    }
    out.set(id, game);
  }
  return [...out].map(([id, game]) => ({ id, game }));
}

/**
 * Save every waiting game into the store and remove its copy. Returns how many were saved. A failed
 * save keeps the copy and is passed to `onError`; the first failure ends the pass (the store is full).
 */
export async function flushStashed(
  store: ReviewStore,
  ls: Storage | null = storage(),
  onError: (e: unknown) => void = () => undefined,
): Promise<number> {
  let saved = 0;
  for (const { id, game } of readAll(ls)) {
    if (!game) {
      unstashGame(id, ls);
      continue;
    }
    try {
      await store.saveGame(game);
      saved++;
      unstashGame(id, ls);
    } catch (e) {
      onError(e);
      break;
    }
  }
  return saved;
}

/** Memory mode: put the kept copies into the in-memory store so History lists them. */
export async function restoreStashed(
  store: ReviewStore,
  ls: Storage | null = storage(),
): Promise<number> {
  let n = 0;
  for (const { game } of readAll(ls, false)) {
    if (!game) continue;
    try {
      await store.saveGame(game);
      n++;
    } catch {
      break;
    }
  }
  return n;
}
