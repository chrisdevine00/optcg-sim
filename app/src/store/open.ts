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
import { flushStashed } from './pending.ts';
import { MemoryStore, getStore, setStore } from './index.ts';
import { SyncKv } from './sync.ts';
import { StoreQuotaError } from './types.ts';

export const SAVING_OFF = 'Saving is off in this browser; Export keeps a copy.';
export const SAVED_FULL = 'Saved games are full. Delete old reviews?';
/** History opens in select-and-delete mode on this query (flows G8; History is WP6's page). */
export const DELETE_MODE_PATH = '/reviews?mode=delete';

export interface StoreStatus {
  kind: 'memory' | 'indexeddb';
  /** Storage is full: the last save failed on the quota or the 200-game cap. */
  full: boolean;
  /** The "Saving is off" notice was dismissed for this page load. */
  dismissed: boolean;
}

let status: StoreStatus = { kind: 'memory', full: false, dismissed: false };
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

function timeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('The saved-games database did not open.')), ms);
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

/** Safe to call more than once; later calls wait for the first. Never rejects. */
export function initStore(opts: InitOptions = {}): Promise<void> {
  return (initial ??= open(opts));
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
  synced.timing = await SyncKv.hydrate(store.timing, reportStoreError);
  synced.progress = await SyncKv.hydrate(store.progress, reportStoreError);
}

/** Tests: forget the boot so `initStore` runs again. */
export function resetStoreForTests(): void {
  initial = null;
  synced.timing = null;
  synced.progress = null;
  setStore(null);
  status = { kind: 'memory', full: false, dismissed: false };
}

async function open(opts: InitOptions): Promise<void> {
  const factory = opts.factory === undefined ? safe(() => indexedDB) : opts.factory;
  const storage = opts.storage === undefined ? safe(() => localStorage) : opts.storage;
  if (factory) {
    try {
      const store = await timeout(IdbStore.open(factory), opts.timeoutMs ?? 3000);
      if (storage) {
        try {
          await migrateFromLocalStorage(store, storage);
        } catch {
          // The keys stay where they are and the copy is idempotent: the next start finishes it.
        }
      }
      try {
        // A game finished just before the last page closed, whose write did not commit.
        await flushStashed(store, storage);
      } catch {
        // The copies stay; the next start tries again.
      }
      synced.timing = await SyncKv.hydrate(store.timing, reportStoreError);
      synced.progress = await SyncKv.hydrate(store.progress, reportStoreError);
      setStore(store);
      set({ kind: 'indexeddb' });
      return;
    } catch {
      synced.timing = synced.progress = null;
    }
  }
  if (!(getStore() instanceof MemoryStore)) setStore(null);
  set({ kind: 'memory' });
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
