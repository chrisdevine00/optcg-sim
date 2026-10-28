import { describe, expect, it } from 'vitest';
import type { Artwork } from '@optcg/cards';
import { cacheFirstLru, type CacheLike } from '../src/art/lru.ts';
import { IMAGE_HOSTS, IMAGE_SOURCES, imageCandidates } from '../src/art/sources.ts';

const art = (over: Partial<Artwork> = {}): Artwork => ({
  artworkId: 'OP17-005_p1',
  imageUrls: { full: 'OP17-005_p1_abc.jpg' },
  source: 'optcgapi',
  product: 'OP-17',
  rarity: 'SR',
  ...over,
});

describe('image sources (ADR 0007 fallback order)', () => {
  it('tries optcgapi first, with the base URL owned by the art module', () => {
    expect(imageCandidates(art())).toEqual([
      'https://optcgapi.com/media/static/Card_Images/OP17-005_p1_abc.jpg',
    ]);
  });

  it('keeps arjunkai wired in but disabled until its maintainer approves', () => {
    expect(IMAGE_SOURCES.arjunkai.enabled).toBe(false);
    expect(imageCandidates(art({ imageUrls: {} }))).toEqual([]);
  });

  it('returns no candidates for a missing artwork, so the text card is drawn', () => {
    expect(imageCandidates(undefined)).toEqual([]);
  });

  it('lists the hosts the service worker may cache', () => {
    expect(IMAGE_HOSTS).toEqual(['optcgapi.com', 'optcg-api.arjunbansal-ai.workers.dev']);
  });
});

/** An in-memory Cache API double that keeps insertion order, like the real one. */
class FakeCache implements CacheLike {
  entries = new Map<string, Response>();
  async match(r: Request) {
    return this.entries.get(r.url)?.clone();
  }
  async put(r: Request, res: Response) {
    this.entries.delete(r.url);
    this.entries.set(r.url, res);
  }
  async delete(r: Request) {
    return this.entries.delete(r.url);
  }
  async keys() {
    return [...this.entries.keys()].map((u) => new Request(u));
  }
}

describe('bounded LRU image cache', () => {
  const req = (n: number) => new Request(`https://optcgapi.com/media/static/Card_Images/${n}.jpg`);
  let fetches = 0;
  const fetcher = async () => {
    fetches++;
    return new Response('img', { status: 200 });
  };

  it('serves hits from the cache and evicts the least recently used above the cap', async () => {
    const cache = new FakeCache();
    fetches = 0;
    for (const n of [1, 2, 3]) await cacheFirstLru(req(n), cache, fetcher, 3);
    expect(fetches).toBe(3);
    await cacheFirstLru(req(1), cache, fetcher, 3); // hit: 1 becomes most recent
    expect(fetches).toBe(3);
    await cacheFirstLru(req(4), cache, fetcher, 3); // evicts 2, the least recently used
    expect([...cache.entries.keys()].map((u) => u.match(/(\d)\.jpg/)![1])).toEqual(['3', '1', '4']);
  });

  it('never stores failed responses', async () => {
    const cache = new FakeCache();
    await cacheFirstLru(req(9), cache, async () => new Response('', { status: 404 }), 3);
    expect(cache.entries.size).toBe(0);
  });
});
