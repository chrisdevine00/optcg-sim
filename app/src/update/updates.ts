/**
 * App updates (ARCHITECTURE §5, PLAN M6b-6): registers the service worker and reports when a new build
 * is installed and waiting. The app never reloads by itself: `applyUpdate` runs only when the player
 * accepts the prompt, and the prompt is never shown on the game screen.
 */
const listeners = new Set<() => void>();
let waiting: ServiceWorker | null = null;

const set = (w: ServiceWorker | null) => {
  waiting = w;
  for (const fn of listeners) fn();
};

export const waitingUpdate = (): ServiceWorker | null => waiting;

export function subscribeUpdates(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Tell the waiting worker to take over, then reload once it controls the page. */
export function applyUpdate(): void {
  const w = waiting;
  if (!w) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
    once: true,
  });
  w.postMessage({ type: 'skip-waiting' });
}

/** Watch a registration for a build that finished installing while an older one controls the page. */
export function watch(reg: ServiceWorkerRegistration): void {
  const consider = (w: ServiceWorker | null) => {
    if (w && w.state === 'installed' && navigator.serviceWorker.controller) set(w);
  };
  consider(reg.waiting);
  reg.addEventListener('updatefound', () => {
    const w = reg.installing;
    w?.addEventListener('statechange', () => consider(w));
  });
}

export function registerServiceWorker(base: string): void {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .then((reg) => {
        watch(reg);
        // A tab left open checks for a new deploy now and then (and on every navigation, by the browser).
        setInterval(() => void reg.update().catch(() => undefined), 60 * 60 * 1000);
      })
      .catch(() => undefined);
  });
}
