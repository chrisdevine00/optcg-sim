/**
 * M10-R12 and R1: `loadVersion` remembers a version and forgets a failure, and reads the commit.
 * Revert: put `cached ??= ...catch(() => null)` back (the second test then never calls the fetcher again).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadVersion, parseVersion, resetVersionCache } from '../src/about/version.ts';

const body = {
  release: '1.0.0',
  build: 'abc123def456',
  commit: '0123456789abcdef0123456789abcdef01234567',
  builtAt: '2026-11-27T09:30:00.000Z',
  cardsThrough: 'OP-17',
  cardCount: 3654,
  metaAsOf: '2026-10-28',
  engine: '0.5.16',
};
const ok = () => Promise.resolve({ ok: true, json: () => Promise.resolve(body) }) as never;

describe('loadVersion', () => {
  afterEach(resetVersionCache);

  it('reads the commit the build was made from, and an old file without one as empty', () => {
    expect(parseVersion(body)?.commit).toBe(body.commit);
    const { commit: _c, ...old } = body;
    expect(parseVersion(old)?.commit).toBe('');
  });

  it('does not keep a failed load: the next call asks again', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockImplementation(ok);
    expect(await loadVersion(fetcher, '/')).toBeNull();
    expect((await loadVersion(fetcher, '/'))?.build).toBe('abc123def456');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not keep an HTML 404 body either', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve('<!doctype html>') } as never)
      .mockImplementation(ok);
    expect(await loadVersion(fetcher, '/')).toBeNull();
    expect((await loadVersion(fetcher, '/'))?.release).toBe('1.0.0');
  });

  it('keeps a version for the page’s life: one fetch for many callers', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(ok);
    const [a, b] = await Promise.all([loadVersion(fetcher, '/'), loadVersion(fetcher, '/')]);
    await loadVersion(fetcher, '/');
    expect(a).toEqual(b);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
