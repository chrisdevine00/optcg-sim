/** The app's review store. WP5 swaps the in-memory store for IndexedDB here, and nowhere else. */
import { MemoryStore } from './memory.ts';
import type { ReviewStore } from './types.ts';

let store: ReviewStore | null = null;

export function getStore(): ReviewStore {
  return (store ??= new MemoryStore());
}

/** Tests, and WP5's opener once IndexedDB is up. */
export function setStore(next: ReviewStore | null): void {
  store = next;
}

export { MemoryStore } from './memory.ts';
export * from './types.ts';
