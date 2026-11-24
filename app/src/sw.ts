/**
 * Service worker (registered only in production builds; ARCHITECTURE §5).
 *
 * - **Images:** cached from the known image hosts in a bounded LRU store.
 * - **App shell (M6b-6):** every file of this build (pages, chunks, per-set card data and effect
 *   scripts, styles, fonts) is precached into a cache named by the build id, so the app works offline
 *   and an update never mixes two builds' chunks. Pages are network-first with the cached shell as the
 *   offline fallback; hashed files are cache-first.
 * - **Updates:** the first install takes control at once. A later build installs alongside and
 *   **waits**: the app shows an update prompt (never mid-game) and sends `skip-waiting` when the
 *   player accepts. The app never reloads by itself.
 */
import { cacheFirstLru, IMAGE_CACHE } from './art/lru.ts';
import { IMAGE_HOSTS } from './art/sources.ts';

declare const __BUILD_ID__: string;
declare const __SHELL_FILES__: string[];

const sw = self as unknown as ServiceWorkerGlobalScope;
const SHELL = `optcg-shell-${__BUILD_ID__}`;
const scope = new URL(sw.registration.scope);
const shellUrls = __SHELL_FILES__.map((f) => new URL(f, scope).href);
const shellSet = new Set(shellUrls);
const INDEX = new URL('index.html', scope).href;

sw.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // One file failing (a flaky network) must not abort the install; it is fetched on demand later.
      await Promise.allSettled(
        shellUrls.map((u) => cache.add(new Request(u, { cache: 'reload' }))),
      );
      // First install: nothing to wait for. An update waits for the player (the update prompt).
      if (!sw.registration.active) await sw.skipWaiting();
    })(),
  );
});

sw.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'skip-waiting') void sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith('optcg-images-') && name !== IMAGE_CACHE) await caches.delete(name);
        if (name.startsWith('optcg-shell-') && name !== SHELL) await caches.delete(name);
      }
      await sw.clients.claim();
    })(),
  );
});

async function page(req: Request): Promise<Response> {
  try {
    return await fetch(req);
  } catch {
    const cached =
      (await caches.match(INDEX, { cacheName: SHELL, ignoreVary: true })) ??
      (await caches.match(INDEX, { ignoreVary: true }));
    return cached ?? Response.error();
  }
}

async function shellFile(req: Request): Promise<Response> {
  const cache = await caches.open(SHELL);
  // Hashed files never vary; a module script's Origin header must not miss the precached copy.
  const hit = await cache.match(req, { ignoreVary: true, ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) void cache.put(req, res.clone());
  return res;
}

sw.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.destination === 'image' && IMAGE_HOSTS.includes(url.host)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => cacheFirstLru(req, cache, (r) => fetch(r))),
    );
    return;
  }
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  if (req.mode === 'navigate') {
    event.respondWith(page(req));
    return;
  }
  url.search = '';
  if (shellSet.has(url.href)) event.respondWith(shellFile(req));
});
