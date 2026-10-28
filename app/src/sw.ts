/**
 * Service worker (registered only in production builds): caches card images from the known image hosts in
 * a bounded LRU store. Everything else goes straight to the network.
 */
import { cacheFirstLru, IMAGE_CACHE } from './art/lru.ts';
import { IMAGE_HOSTS } from './art/sources.ts';

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('install', () => {
  void sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith('optcg-images-') && name !== IMAGE_CACHE) await caches.delete(name);
      }
      await sw.clients.claim();
    })(),
  );
});

sw.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.destination !== 'image') return;
  if (!IMAGE_HOSTS.includes(new URL(req.url).host)) return;
  event.respondWith(
    caches.open(IMAGE_CACHE).then((cache) => cacheFirstLru(req, cache, (r) => fetch(r))),
  );
});
