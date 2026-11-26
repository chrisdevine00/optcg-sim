import { describe, expect, it } from 'vitest';
import { SyncKv, JOURNAL_PREFIX } from '../src/store/sync.ts';
import { FakeStorage } from './store-support.ts';
import type { KvStore } from '../src/store/types.ts';

/** A KvStore that records when each write was issued, and settles it later. */
function slowKv(initial: Record<string, unknown> = {}) {
  const data = new Map(Object.entries(initial));
  const issued: string[] = [];
  const kv: KvStore = {
    get: (k) => Promise.resolve(data.get(k)),
    keys: () => Promise.resolve([...data.keys()]),
    set: (k, v) => {
      issued.push(`set:${k}`);
      return new Promise<void>((r) =>
        setTimeout(() => {
          data.set(k, v);
          r();
        }, 5),
      );
    },
    delete: (k) => {
      issued.push(`delete:${k}`);
      return new Promise<void>((r) =>
        setTimeout(() => {
          data.delete(k);
          r();
        }, 5),
      );
    },
  };
  return { kv, issued, data };
}

describe('SyncKv durability (M8-R4)', () => {
  it('issues the store write inside set and delete, not a microtask later', async () => {
    const { kv, issued } = slowKv({ a: 1 });
    const s = await SyncKv.hydrate(kv);
    s.set('b', 2);
    s.delete('a');
    // Nothing awaited: a reload at this point must already have both transactions open.
    expect(issued).toEqual(['set:b', 'delete:a']);
    await s.flush();
  });

  it('flush waits for every write, and a failed one is reported, not thrown', async () => {
    const errors: unknown[] = [];
    const { kv, data } = slowKv();
    const failing: KvStore = {
      ...kv,
      set: (k, v) => (k === 'bad' ? Promise.reject(new Error('quota')) : kv.set(k, v)),
    };
    const s = await SyncKv.hydrate(failing, (e) => errors.push(e));
    s.set('ok', 1);
    s.set('bad', 2);
    await s.flush();
    expect(data.get('ok')).toBe(1);
    expect(errors).toHaveLength(1);
  });
});

describe('SyncKv survives a reload that beats the commit (M8-R4)', () => {
  /** A store whose writes never commit: the page went away first. */
  const aborted = (initial: Record<string, unknown>): KvStore => ({
    get: (k) => Promise.resolve(initial[k]),
    keys: () => Promise.resolve(Object.keys(initial)),
    set: () => new Promise<void>(() => undefined),
    delete: () => new Promise<void>(() => undefined),
  });

  it('a delete whose transaction was aborted does not come back', async () => {
    const ls = new FakeStorage();
    const first = await SyncKv.hydrate(aborted({ run: { id: 1 } }), undefined, 'timing', ls);
    first.delete('run');
    expect(ls.getItem(`${JOURNAL_PREFIX}timing.run`)).toBe('{"del":true}');
    // The next page: IndexedDB still holds the run, the journal says it was deleted.
    const { kv, data, issued } = slowKv({ run: { id: 1 } });
    const second = await SyncKv.hydrate(kv, undefined, 'timing', ls);
    expect(second.keys()).toEqual([]);
    expect(issued).toEqual(['delete:run']);
    await second.flush();
    expect(data.has('run')).toBe(false);
    expect(ls.length).toBe(0);
  });

  it('a set whose transaction was aborted is applied and written again', async () => {
    const ls = new FakeStorage();
    const first = await SyncKv.hydrate(aborted({}), undefined, 'progress', ls);
    first.set('lethal', { n: 3 });
    const { kv, data } = slowKv();
    const second = await SyncKv.hydrate(kv, undefined, 'progress', ls);
    expect(second.get('lethal')).toEqual({ n: 3 });
    await second.flush();
    expect(data.get('lethal')).toEqual({ n: 3 });
    expect(ls.length).toBe(0);
  });

  it('a committed write leaves no journal entry', async () => {
    const ls = new FakeStorage();
    const { kv } = slowKv();
    const s = await SyncKv.hydrate(kv, undefined, 'timing', ls);
    s.set('a', 1);
    expect(ls.length).toBe(1);
    await s.flush();
    expect(ls.length).toBe(0);
  });
});
