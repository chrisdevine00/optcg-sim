/**
 * Opens the app's store once, at boot (`main.tsx`), and keeps the one status the UI shows
 * (M8 WP5): IndexedDB if the browser has it and it opens, otherwise the in-memory store with one
 * notice, "Saving is off in this browser; Export keeps a copy". A save that hits the quota flips
 * `full`, which shows "Saved games are full. Delete old reviews?" and links to History in delete
 * mode. Nothing is ever deleted without the player's say.
 */
import { useSyncExternalStore } from 'react';
import { IdbStore } from './idb.ts';
import { migrateFromLocalStorage } from './migrate.ts';
import { flushStashed, pendingCount, restoreStashed, watchPending } from './pending.ts';
import { MemoryStore, getStore, setStore } from './index.ts';
import { markStoreReady, resetReadyForTests } from './ready.ts';
import { SyncKv } from './sync.ts';
import { StoreQuotaError } from './types.ts';

export const SAVING_OFF = 'Saving is off in this browser; Export keeps a copy.';
/**
 * M10-R5: the database did not open within the cap but may still be opening. Saving is off for now;
 * a reload finds the saved games (and if it opens while nothing has been written to memory, it is
 * taken at once and `SAVED_LOADED` says so).
 */
export const SAVING_SLOW =
  'Your saved games did not load in time. They will be there after a reload; until then saving is off.';
export const SAVED_LOADED = 'Your saved games have loaded.';
export const SAVED_FULL = 'Saved games are full. Delete old reviews?';
/** History opens in select-and-delete mode on this query (flows G8; History is WP6's page). */
export const DELETE_MODE_PATH = '/reviews?mode=delete';

export interface StoreStatus {
  /** `opening` until `initStore` settles (M10 WP1): no "Saving is off" notice before it is known. */
  kind: 'opening' | 'memory' | 'indexeddb';
  /** Storage is full: the last save failed on the quota or the 200-game cap. */
  full: boolean;
  /** The "Saving is off" notice was dismissed for this page load. */
  dismissed: boolean;
  /** Finished games waiting to be saved (a save failed on the quota or the cap). */
  pending: number;
  /**
   * Why the store is in memory: `unavailable` (no IndexedDB, or it failed) or `slow` (it did not open
   * within the cap and may still open; M10-R5).
   */
  reason: 'unavailable' | 'slow' | null;
  /** The database opened after the cap and was taken: one polite "saved games have loaded" line. */
  lateLoaded: boolean;
  /** Counts late adoptions; gated pages are keyed by it so they read the real store (M10-R5). */
  epoch: number;
}

const FRESH: StoreStatus = {
  kind: 'opening',
  full: false,
  dismissed: false,
  pending: 0,
  reason: null,
  lateLoaded: false,
  epoch: 0,
};
let status: StoreStatus = FRESH;

/** The words of the one memory-mode notice, for the reason (Settings and the notice bar share them). */
export const memoryNotice = (s: Pick<StoreStatus, 'reason'>): string =>
  s.reason === 'slow' ? SAVING_SLOW : SAVING_OFF;
const listeners = new Set<() => void>();
const set = (patch: Partial<StoreStatus>) => {
  status = { ...status, ...patch };
  for (const l of listeners) l();
};

export const storeStatus = (): StoreStatus => status;
export function useStoreStatus(): StoreStatus {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    storeStatus,
    storeStatus,
  );
}
export const dismissStoreNotice = () => set({ dismissed: true });
export const clearStoreFull = () => set({ full: false });
watchPending(() => set({ pending: pendingCount() }));

/**
 * Save the finished games a full store turned away (R3). Call it after a delete, after a save that
 * worked, or from "Save this game". Clears the full notice when nothing is left waiting; a save that
 * fails again keeps the games and the notice. Returns how many were saved.
 */
export async function retryStashed(ls?: Storage | null): Promise<number> {
  const store = getStore();
  if (store.kind !== 'indexeddb' || pendingCount(ls) === 0) return 0;
  const n = await flushStashed(store, ls, reportStoreError);
  if (pendingCount(ls) === 0) clearStoreFull();
  return n;
}

/** Every failed save lands here (`GameSaver`'s `onError`, the resume slot, the small logs). */
export function reportStoreError(e: unknown): void {
  if (e instanceof StoreQuotaError) set({ full: true });
}

/** The synchronous caches of the two small stores; null when the store is not IndexedDB. */
export const synced: { timing: SyncKv | null; progress: SyncKv | null } = {
  timing: null,
  progress: null,
};

export interface InitOptions {
  /** Default `indexedDB`; tests pass fake-indexeddb's, or `null` for a browser without it. */
  factory?: IDBFactory | null;
  /** Default `localStorage`. */
  storage?: Storage | null;
  /** Give up on opening after this long (a blocked database); default 3000. */
  timeoutMs?: number;
}

/** The open outlasted its cap (it may still finish: M10-R5). Any other failure is a failed open. */
class OpenTimeout extends Error {}

function timeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new OpenTimeout('The saved-games database did not open.')),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

let initial: Promise<void> | null = null;

/**
 * Safe to call more than once; later calls wait for the first. Never rejects. When it settles
 * (IndexedDB, or the memory fallback) the store is marked ready (`ready.ts`), which releases every
 * route waiting under `StoreGate`; `main.tsx` does not wait for it before the first render.
 */
export function initStore(opts: InitOptions = {}): Promise<void> {
  return (initial ??= open(opts)
    .catch(() => undefined)
    .then(markStoreReady));
}

/** Writes to the small stores are behind memory; wait for them before exporting or deleting. */
export async function settleStore(): Promise<void> {
  await Promise.all([synced.timing?.flush(), synced.progress?.flush()]);
}

/** After an import or a delete-all wrote to the store directly: read the small stores again. */
export async function rehydrateStore(): Promise<void> {
  const store = getStore();
  if (store.kind !== 'indexeddb') return;
  await settleStore();
  synced.timing = await SyncKv.hydrate(store.timing, reportStoreError, 'timing');
  synced.progress = await SyncKv.hydrate(store.progress, reportStoreError, 'progress');
}

/** Tests: forget the boot so `initStore` runs again. */
export function resetStoreForTests(): void {
  initial = null;
  resetReadyForTests();
  synced.timing = null;
  synced.progress = null;
  setStore(null);
  status = FRESH;
}

/** Brings a freshly opened store up to date: the old localStorage copies, then the small stores' caches. */
async function prepare(store: IdbStore, storage: Storage | null): Promise<void> {
  if (storage) {
    try {
      await migrateFromLocalStorage(store, storage);
    } catch {
      // The keys stay where they are and the copy is idempotent: the next start finishes it.
    }
  }
  try {
    // A game finished just before the last page closed, whose write did not commit.
    await flushStashed(store, storage, reportStoreError);
  } catch {
    // The copies stay; the next start tries again.
  }
  synced.timing = await SyncKv.hydrate(store.timing, reportStoreError, 'timing');
  synced.progress = await SyncKv.hydrate(store.progress, reportStoreError, 'progress');
}

/** Makes an opened store the app's store; on the way out, settle what is in flight. */
function adopt(store: IdbStore): void {
  setStore(store);
  try {
    addEventListener('pagehide', () => void settleStore());
  } catch {
    /* no window (tests) */
  }
}

/**
 * M10-R5: the database finished opening after the cap. If nothing has been written to the memory store
 * it is taken (the gated pages are re-keyed so they read it, and one line says so). If the player has
 * already done something that lives only in memory it is not taken, and the notice keeps saying that
 * the saved games did not load in time and will be there after a reload.
 */
async function lateOpen(opening: Promise<IdbStore>, storage: Storage | null): Promise<void> {
  let store: IdbStore;
  try {
    store = await opening;
  } catch {
    return; // it never opened: the notice stands
  }
  const memory = getStore();
  const untouched = () =>
    memory instanceof MemoryStore && getStore() === memory && memory.written === 0;
  if (!untouched()) return;
  try {
    await prepare(store, storage);
  } catch {
    synced.timing = synced.progress = null;
    return;
  }
  if (!untouched()) {
    synced.timing = synced.progress = null;
    return;
  }
  adopt(store);
  set({
    kind: 'indexeddb',
    reason: null,
    lateLoaded: true,
    dismissed: false,
    epoch: status.epoch + 1,
  });
}

async function open(opts: InitOptions): Promise<void> {
  const factory = opts.factory === undefined ? safe(() => indexedDB) : opts.factory;
  const storage = opts.storage === undefined ? safe(() => localStorage) : opts.storage;
  let reason: 'unavailable' | 'slow' = 'unavailable';
  let late: Promise<IdbStore> | null = null;
  if (factory) {
    let opening: Promise<IdbStore> | null = null;
    try {
      opening = IdbStore.open(factory);
      const store = await timeout(opening, opts.timeoutMs ?? 3000);
      await prepare(store, storage);
      adopt(store);
      set({ kind: 'indexeddb' });
      return;
    } catch (e) {
      synced.timing = synced.progress = null;
      if (e instanceof OpenTimeout && opening) {
        reason = 'slow';
        late = opening;
      }
    }
  }
  if (!(getStore() instanceof MemoryStore)) setStore(null);
  // No IndexedDB: the games finished before the last reload come back from their localStorage copy.
  try {
    await restoreStashed(getStore(), storage);
  } catch {
    /* nothing to restore */
  }
  // That copy is the last visit's, not the player's: it does not count as a write (M10-R5).
  const mem = getStore();
  if (mem instanceof MemoryStore) mem.markClean();
  set({ kind: 'memory', reason });
  if (late) void lateOpen(late, storage);
}

function safe<T>(f: () => T): T | null {
  try {
    return f() ?? null;
  } catch {
    return null;
  }
}

/** "Keep my saved games": ask the browser not to evict this site's storage. Never automatic. */
export async function persistence(): Promise<'unsupported' | 'persisted' | 'not-persisted'> {
  const s = safe(() => navigator.storage);
  if (!s || typeof s.persisted !== 'function') return 'unsupported';
  try {
    return (await s.persisted()) ? 'persisted' : 'not-persisted';
  } catch {
    return 'unsupported';
  }
}

export async function requestPersistence(): Promise<boolean> {
  const s = safe(() => navigator.storage);
  if (!s || typeof s.persist !== 'function') return false;
  try {
    return await s.persist();
  } catch {
    return false;
  }
}
