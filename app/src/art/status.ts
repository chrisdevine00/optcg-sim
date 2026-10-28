import { useSyncExternalStore } from 'react';

/**
 * Shared image state: how many artworks failed every source, and a retry epoch. Retrying (the button, or
 * the browser coming back online) bumps the epoch, so every face restarts its fallback chain.
 */
let state = { epoch: 0, failures: 0 };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function reportArtFailure() {
  state = { ...state, failures: state.failures + 1 };
  emit();
}

export function retryArt() {
  state = { epoch: state.epoch + 1, failures: 0 };
  emit();
}

if (typeof window !== 'undefined') window.addEventListener('online', retryArt);

export function useArtStatus() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}
