/**
 * M10 WP1: "the saved-data store has finished opening" as a tiny external store, so the first paint
 * does not wait on IndexedDB. `main.tsx` renders at once and runs `initStore()` in parallel; when it
 * settles (IndexedDB, or the memory fallback after the 3 s cap) `initStore` calls `markStoreReady`.
 * Routes that read or write saved data sit under `StoreGate` and mount only after that; the rest
 * (Home, Cards, Meta, Rules, About, the Learn hub's page) never wait.
 */
import { useSyncExternalStore } from 'react';

let ready = false;
let gateShown = false;
const listeners = new Set<() => void>();
let waiters: (() => void)[] = [];

export const isStoreReady = (): boolean => ready;

/** Called once by `initStore` when the store is open or has fallen back to memory. Idempotent. */
export function markStoreReady(): void {
  if (ready) return;
  ready = true;
  const w = waiters;
  waiters = [];
  for (const f of w) f();
  for (const l of [...listeners]) l();
}

/** A hook: false until the store is ready, then true for the life of the page. */
export function useStoreReady(): boolean {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    isStoreReady,
    isStoreReady,
  );
}

/** Resolves when the store is ready (at once if it already is). Never rejects. */
export function whenStoreReady(): Promise<void> {
  return ready ? Promise.resolve() : new Promise<void>((resolve) => waiters.push(resolve));
}

/** The gate showed its waiting page (M10-R11): the route that follows must hand focus to its own heading. */
export function noteGateShown(): void {
  gateShown = true;
}
export const gateWasShown = (): boolean => gateShown;

/** Tests: back to "not ready". */
export function resetReadyForTests(): void {
  ready = false;
  gateShown = false;
  waiters = [];
}

const norm = (p: string) => p.replace(/\/+$/, '') || '/';

/**
 * Whether a route reads or writes saved data and so waits for the store: Play, Tutorial, Decks,
 * Reviews (the list and a saved game), Progress, Settings, Drills (home, start, run) and the Learn
 * lesson pages (they credit lessons). Home, Cards, Meta, Rules, About and the Learn hub paint
 * without it (the hub's progress card fills in when the store is ready). `App.tsx` mounts the gate
 * on exactly these; a test keeps the two in step.
 */
export function storeWanted(rawPath: string): boolean {
  const seg = norm(rawPath).split('/').filter(Boolean);
  const [head] = seg;
  switch (head) {
    case 'play':
    case 'tutorial':
    case 'progress':
    case 'settings':
      return seg.length === 1;
    case 'decks':
    case 'reviews':
    case 'drills':
      return true;
    case 'learn':
      return seg.length >= 2;
    default:
      return false;
  }
}

/** The page heading the gate shows while the store opens (the page's own h1 replaces it). */
export function gateHeading(rawPath: string): string {
  const [head, second] = norm(rawPath).split('/').filter(Boolean);
  switch (head) {
    case 'play':
      return 'Play';
    case 'tutorial':
      return 'Tutorial';
    case 'decks':
      return 'Decks';
    case 'reviews':
      return second ? 'Review' : 'Reviews';
    case 'progress':
      return 'Progress';
    case 'settings':
      return 'Settings';
    case 'drills':
      return 'Drills';
    case 'learn':
      return 'Lesson';
    default:
      return 'OPTCG Sim';
  }
}
