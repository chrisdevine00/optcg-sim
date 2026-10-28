/** The subset of the Cache API the image cache uses, so the LRU logic can be unit-tested. */
export interface CacheLike {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
  delete(request: Request): Promise<boolean>;
  keys(): Promise<readonly Request[]>;
}

export const IMAGE_CACHE = 'optcg-images-v1';
export const IMAGE_CACHE_MAX = 300;

/**
 * Cache-first with a bounded LRU (ARCHITECTURE §5 "Images"). Cache API keys keep insertion order, so a hit
 * is re-inserted to mark it recently used, and the oldest keys are evicted above `max`. Opaque responses
 * (no-cors `<img>` loads) carry quota padding, which is why the store is capped. Above the cap the
 * browser's HTTP cache still applies.
 */
export async function cacheFirstLru(
  request: Request,
  cache: CacheLike,
  fetcher: (r: Request) => Promise<Response>,
  max = IMAGE_CACHE_MAX,
): Promise<Response> {
  const hit = await cache.match(request);
  if (hit) {
    await cache.delete(request);
    await cache.put(request, hit.clone());
    return hit;
  }
  const res = await fetcher(request);
  // Opaque responses report status 0; anything else must be OK to be stored.
  if (res.type === 'opaque' || res.ok) {
    await cache.put(request, res.clone());
    const keys = await cache.keys();
    for (const k of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(k);
  }
  return res;
}
