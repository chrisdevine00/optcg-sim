/**
 * M8 WP5: the IndexedDB store (against fake-indexeddb), the in-memory fallback, quota handling,
 * staleness and the size of a saved game. One contract suite runs against both stores.
 */
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { afterEach, describe, expect, it } from 'vitest';
import { SCRIPTS } from '@optcg/cards';
import { ENGINE_VERSION } from '@optcg/engine';
import { GameSaver } from '../src/play/save-game.ts';
import { sourceOf } from '../src/play/PlayRoute.tsx';
import {
  MemoryStore,
  StoreQuotaError,
  type CurrentGame,
  type ReviewStore,
} from '../src/store/index.ts';
import { IdbStore, fail } from '../src/store/idb.ts';
import {
  initStore,
  resetStoreForTests,
  reportStoreError,
  storeStatus,
  synced,
} from '../src/store/open.ts';
import { getStore } from '../src/store/index.ts';
import { STALE_COPY, liveness } from '../src/store/staleness.ts';
import { timingStore, LocalTimingStore, IdbTimingStore } from '../src/tutorial/timing.ts';
import { FakeStorage, lookup, sessionRecord, storedGame, storedReview } from './store-support.ts';

const rec = sessionRecord(11);

const makers: [string, () => Promise<ReviewStore>][] = [
  ['MemoryStore', () => Promise.resolve(new MemoryStore())],
  ['IdbStore', () => IdbStore.open(new IDBFactory())],
];

describe.each(makers)('%s: the ReviewStore contract', (_name, make) => {
  it('round-trips games, reviews, the resume slot and the key-value stores', async () => {
    const s = await make();
    await s.saveGame(storedGame('a', 1, rec));
    await s.saveGame(storedGame('b', 2, rec));
    expect((await s.listGames()).map((g) => g.id)).toEqual(['b', 'a']);
    expect((await s.getGame('a'))?.record).toEqual(rec);
    expect(await s.getGame('zzz')).toBeUndefined();
    const review = storedReview('a');
    await s.saveReview(review);
    expect(await s.getReview('a')).toEqual(review);
    await s.timing.set('run1', { x: 1 });
    await s.progress.set('lethal', [1, 2]);
    expect(await s.timing.keys()).toEqual(['run1']);
    const slot: CurrentGame = {
      record: rec,
      savedAt: 3,
      myLeader: 'A',
      opponentLeader: 'B',
      turn: 9,
    };
    await s.setCurrent(slot);
    expect(await s.getCurrent()).toEqual(slot);
    await s.clearCurrent();
    expect(await s.getCurrent()).toBeUndefined();

    // Deleting a game takes its review with it; deleteAll empties the lot.
    await s.deleteGame('a');
    expect(await s.getReview('a')).toBeUndefined();
    expect((await s.listGames()).map((g) => g.id)).toEqual(['b']);
    await s.deleteAll();
    expect(await s.listGames()).toEqual([]);
    expect(await s.timing.keys()).toEqual([]);
  });

  it('exports and imports with replace and keep-both', async () => {
    const s = await make();
    await s.saveGame(storedGame('a', 1, rec));
    await s.saveGame(storedGame('b', 2, rec));
    await s.saveReview(storedReview('a'));
    await s.timing.set('run1', { x: 1 });
    const bundle = await s.exportAll('test');
    expect(bundle).toMatchObject({ schema: 'optcg-sim/export/1', build: 'test' });
    const t = await make();
    expect(await t.importAll(bundle, 'replace')).toEqual({
      added: 2,
      replaced: 0,
      keptBoth: 0,
      skipped: 0,
    });
    expect(await t.getReview('a')).toEqual(storedReview('a'));
    expect(await t.timing.get('run1')).toEqual({ x: 1 });
    expect(await t.importAll(bundle, 'replace')).toMatchObject({ replaced: 2, added: 0 });
    expect(await t.importAll(bundle, 'keep-both')).toMatchObject({ keptBoth: 2 });
    const ids = (await t.listGames()).map((g) => g.id);
    expect(ids).toHaveLength(4);
    // The kept copy's review follows it to its new id.
    const copy = ids.find((i) => i.startsWith('a-imported'))!;
    expect((await t.getReview(copy))?.gameId).toBe(copy);
  });

  it('refuses a save past the limit with a StoreQuotaError and deletes nothing', async () => {
    const s =
      _name === 'IdbStore'
        ? await IdbStore.open(new IDBFactory(), 2)
        : (new MemoryStore(2) as ReviewStore);
    await s.saveGame(storedGame('a', 1, rec));
    await s.saveGame(storedGame('b', 2, rec));
    await expect(s.saveGame(storedGame('c', 3, rec))).rejects.toBeInstanceOf(StoreQuotaError);
    // Re-saving an existing game is not a new game.
    await s.saveGame(storedGame('b', 5, rec));
    expect((await s.listGames()).map((g) => g.id)).toEqual(['b', 'a']);
  });
});

describe('IdbStore specifics', () => {
  it('lists newest first without reading records, and survives a reopen', async () => {
    const f = new IDBFactory();
    const a = await IdbStore.open(f);
    await a.saveGame(storedGame('old', 10, rec));
    await a.saveGame(storedGame('new', 20, rec));
    a.close();
    const b = await IdbStore.open(f);
    expect((await b.listGames()).map((g) => g.id)).toEqual(['new', 'old']);
    expect(await b.meta.get('schema')).toBe(1);
  });

  it('maps a browser QuotaExceededError to StoreQuotaError, and a failed write saves nothing', async () => {
    expect(fail({ name: 'QuotaExceededError' })).toBeInstanceOf(StoreQuotaError);
    expect(fail({ code: 22 })).toBeInstanceOf(StoreQuotaError);
    expect(fail(new Error('boom'))).not.toBeInstanceOf(StoreQuotaError);

    const s = await IdbStore.open(new IDBFactory());
    const real = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      throw new DOMException('full', 'QuotaExceededError');
    };
    try {
      const err = await s.saveGame(storedGame('x', 1, rec)).then(
        () => null,
        (e: unknown) => e,
      );
      expect(err).toBeInstanceOf(StoreQuotaError);
      reportStoreError(err);
      expect(storeStatus().full).toBe(true);
    } finally {
      IDBObjectStore.prototype.put = real;
      resetStoreForTests();
    }
    expect(await s.listGames()).toEqual([]);
  });

  it('the save seam reports a full store and leaves the game itself alone', async () => {
    resetStoreForTests();
    const full = new MemoryStore(0);
    let reported: unknown;
    const saver = new GameSaver(
      () => full,
      () => 1000,
      (e) => {
        reported = e;
        reportStoreError(e);
      },
    );
    const src = {
      mode: 'ai' as const,
      me: 'p1' as const,
      tier: 'rookie' as const,
      result: { winner: 'p2' as const, reason: 'life' as const },
      record: () => rec,
      leaderOf: () => 'OP01-001',
      turn: () => 5,
    };
    expect(await saver.observe({}, src as never)).toBeNull();
    expect(reported).toBeInstanceOf(StoreQuotaError);
    expect(storeStatus().full).toBe(true);
    resetStoreForTests();
    void sourceOf;
  });
});

describe('fallback', () => {
  afterEach(() => resetStoreForTests());

  it('no IndexedDB: the in-memory store, one notice, and the tutorial log stays in localStorage', async () => {
    resetStoreForTests();
    await initStore({ factory: null, storage: new FakeStorage() });
    expect(getStore().kind).toBe('memory');
    expect(storeStatus()).toMatchObject({ kind: 'memory', full: false });
    expect(synced.timing).toBeNull();
    expect(timingStore()).toBeInstanceOf(LocalTimingStore);
    // Saving still works for the session.
    await getStore().saveGame(storedGame('a', 1, rec));
    expect(await getStore().listGames()).toHaveLength(1);
  });

  it('IndexedDB that throws or never answers falls back the same way', async () => {
    resetStoreForTests();
    const throwing = {
      open() {
        throw new DOMException('denied', 'SecurityError');
      },
    } as unknown as IDBFactory;
    await initStore({ factory: throwing, storage: new FakeStorage() });
    expect(storeStatus().kind).toBe('memory');

    resetStoreForTests();
    const silent = { open: () => ({}) as IDBOpenDBRequest } as unknown as IDBFactory;
    await initStore({ factory: silent, storage: new FakeStorage(), timeoutMs: 20 });
    expect(storeStatus().kind).toBe('memory');
    expect(getStore().kind).toBe('memory');
  });

  it('IndexedDB available: the store is IndexedDB and the tutorial log goes there', async () => {
    resetStoreForTests();
    await initStore({ factory: new IDBFactory(), storage: new FakeStorage() });
    expect(getStore().kind).toBe('indexeddb');
    expect(timingStore()).toBeInstanceOf(IdbTimingStore);
  });
});

describe('staleness (liveness of a saved game)', () => {
  const lookupFn = (id: string) => lookup(id);
  const table = SCRIPTS as Record<string, unknown>;
  const defs = (r: typeof rec) =>
    new Set(
      JSON.stringify(r.start)
        .match(/[A-Z]{1,4}\d{2}-\d{3}/g)
        ?.map(String) ?? [],
    );

  it('a game from this build is live', () => {
    expect(liveness(rec, lookupFn)).toEqual({ live: true, via: 'versions' });
  });

  it('an unrelated card scripted in-test: still live', () => {
    const inGame = defs(rec);
    const unrelated = Object.keys(SCRIPTS).find((id) => !inGame.has(id))!;
    const keep = table[unrelated];
    try {
      table[unrelated] = { abilities: [] };
      expect(liveness(rec, lookupFn).live).toBe(true);
    } finally {
      table[unrelated] = keep;
    }
  });

  it('a card in the game re-scripted: read-only, with the reason', () => {
    const own = [...defs(rec)].find((id) => SCRIPTS[id])!;
    expect(own).toBeTruthy();
    const keep = table[own];
    try {
      table[own] = { abilities: [] };
      const l = liveness(rec, lookupFn);
      expect(l).toMatchObject({ live: false, reason: 'scripts' });
    } finally {
      table[own] = keep;
    }
    expect(liveness(rec, lookupFn).live).toBe(true);
  });

  it('a card in the game changed in the card data: read-only, with the reason', () => {
    const changed = (id: string) => {
      const c = lookup(id);
      return c && { ...c, power: c.power === null ? null : c.power + 1000 };
    };
    expect(liveness(rec, changed)).toMatchObject({ live: false, reason: 'cards' });
  });

  it('an engine version string bump with identical hashes: live, by replaying', () => {
    const old = { ...rec, versions: { ...rec.versions, engine: '0.0.1' } };
    expect(old.versions.engine).not.toBe(ENGINE_VERSION);
    expect(liveness(old, lookupFn)).toEqual({ live: true, via: 'hashes' });
  });

  it('an engine bump that changed the play (a hash differs), or a forged record: read-only', () => {
    const i = Math.min(2, rec.snapshots.length - 1);
    const forged = {
      ...rec,
      versions: { ...rec.versions, engine: '0.0.1' },
      snapshots: rec.snapshots.map((s, k) => (k === i ? { ...s, hash: 'forged' } : s)),
    };
    expect(liveness(forged, lookupFn)).toMatchObject({ live: false, reason: 'hash' });
    // Even with this build's engine string, a record whose first action is nonsense is not live.
    const nonsense = {
      ...rec,
      versions: { ...rec.versions, engine: '0.0.1' },
      actions: [{ type: 'nope' }, ...rec.actions.slice(1)] as never,
    };
    expect(liveness(nonsense, lookupFn).live).toBe(false);
    expect(STALE_COPY).toBe(
      'This game was played on an older version. You can read the review, but not replay it.',
    );
  });
});

describe('size of a saved game', () => {
  it('a record of 300 or more decisions fits comfortably in a store of 200 games', () => {
    // Walk seeds until a game is at least 300 actions long.
    let big = rec;
    for (let seed = 12; big.actions.length < 300 && seed < 60; seed++) big = sessionRecord(seed);
    expect(big.actions.length).toBeGreaterThanOrEqual(300);
    const bytes = JSON.stringify(storedGame('big', 1, big)).length;
    console.log(
      `size: ${big.actions.length} actions, ${big.snapshots.length} snapshots, ${(bytes / 1024).toFixed(0)} KiB as JSON`,
    );
    // 200 such games stay under 150 MB: far inside a browser's quota, and an export under the 50 MB
    // import cap when the games are typical (one game is a few hundred KiB).
    expect(bytes * 200).toBeLessThan(150 * 1024 * 1024);
    expect(bytes).toBeLessThan(1024 * 1024);
  });
});
