/**
 * M10 WP6: a quiet line while the browser says it is offline. The element is always in the page (a
 * live region must exist before its text does); its text appears once when the connection drops and is
 * never changed or repeated, so a screen reader says it once. Nothing is announced when it comes back.
 */
import { useSyncExternalStore } from 'react';
import '../styles/about.css';

export const OFFLINE_TEXT =
  'You are offline. Everything works; card art you have not seen yet shows as text.';

export function subscribe(fn: () => void): () => void {
  window.addEventListener('online', fn);
  window.addEventListener('offline', fn);
  return () => {
    window.removeEventListener('online', fn);
    window.removeEventListener('offline', fn);
  };
}

export const isOffline = () => navigator.onLine === false;

/** The line for a given state (tested without a DOM). */
export function OfflineView({ offline }: { offline: boolean }) {
  return (
    <div className="offline-line" role="status" data-testid="offline-line">
      {offline ? OFFLINE_TEXT : null}
    </div>
  );
}

export function OfflineLine() {
  return <OfflineView offline={useSyncExternalStore(subscribe, isOffline, () => false)} />;
}
