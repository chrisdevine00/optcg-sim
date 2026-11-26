/**
 * M8 fix round R3 and R11: a finished game is never dropped. When the store is full (the browser's
 * quota, or the 200-game cap) the game stays in its safety copy and is saved after a delete, after a
 * later successful save, or from "Save this game". With no IndexedDB a localStorage copy survives a
 * reload, bounded.
 */
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { afterEach, describe, expect, it } from 'vitest';
import { GameSaver, type SaveSource } from '../src/play/save-game.ts';
import { IdbStore } from '../src/store/idb.ts';
import {
  MEMORY_MODE_KEEP,
  MEMORY_MODE_MAX_CHARS,
  pendingCount,
  resetPendingForTests,
} from '../src/store/pending.ts';
import { MemoryStore, StoreQuotaError, getStore, setStore } from '../src/store/index.ts';
import { initStore, resetStoreForTests, retryStashed, storeStatus } from '../src/store/open.ts';
import { FakeStorage, sessionRecord } from './store-support.ts';

const rec = sessionRecord(21);
const src: SaveSource = {
  mode: 'ai',
  me: 'p1',
  tier: 'rookie',
  result: { winner: 'p2' } as never,
  record: () => rec,
  leaderOf: () => 'OP01-001',
  turn: () => 3,
};

afterEach(() => {
  resetPendingForTests();
  resetStoreForTests();
});

describe('a full store keeps the finished game (R3)', () => {
  it('the 200-game cap: the game stays stashed, a delete saves it', async () => {
    const ls = new FakeStorage();
    const store = await IdbStore.open(new IDBFactory(), 1);
    setStore(store);
    // Fill the one slot, then finish another game.
    const errors: unknown[] = [];
    const first = new GameSaver(
      () => store,
      () => 1000,
      (e) => errors.push(e),
      ls,
    );
    const id1 = await first.observe({}, src);
    expect(id1).not.toBeNull();
    expect(ls.length).toBe(0);

    const second = new GameSaver(
      () => store,
      () => 2000,
      (e) => errors.push(e),
      ls,
    );
    const id2 = await second.observe({}, src);
    expect(id2).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(StoreQuotaError);
    // The finished game is still there: a stash key, one waiting game.
    expect(ls.length).toBe(1);
    expect(pendingCount(ls)).toBe(1);
    expect((await store.listGames()).map((g) => g.id)).toEqual([id1]);

    // The player deletes the old one; the waiting game is saved.
    await store.deleteGame(id1!);
    expect(await retryStashed(ls)).toBe(1);
    const games = await store.listGames();
    expect(games).toHaveLength(1);
    expect(games[0]!.meta.endedAt).toBe(2000);
    expect(ls.length).toBe(0);
    expect(pendingCount(ls)).toBe(0);
  });

  it('a browser QuotaExceededError keeps the game, and "Save this game" saves it once there is room', async () => {
    const ls = new FakeStorage();
    const store = await IdbStore.open(new IDBFactory());
    setStore(store);
    let full = true;
    const real = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...a: Parameters<typeof real>) {
      if (full) throw new DOMException('full', 'QuotaExceededError');
      return real.apply(this, a);
    };
    try {
      const errors: unknown[] = [];
      const id = await new GameSaver(
        () => store,
        () => 3000,
        (e) => errors.push(e),
        ls,
      ).observe({}, src);
      expect(id).toBeNull();
      expect(errors[0]).toBeInstanceOf(StoreQuotaError);
      expect(ls.length).toBe(1);
      // Still full: the retry saves nothing and keeps the copy.
      expect(await retryStashed(ls)).toBe(0);
      expect(pendingCount(ls)).toBe(1);
      expect(storeStatus().full).toBe(true);
      expect(storeStatus().pending).toBeGreaterThan(0);
      // Room appears (a delete): the button's retry saves the game and clears the notice.
      full = false;
      expect(await retryStashed(ls)).toBe(1);
      expect((await store.listGames()).map((g) => g.meta.endedAt)).toEqual([3000]);
      expect(ls.length).toBe(0);
      expect(storeStatus().full).toBe(false);
    } finally {
      IDBObjectStore.prototype.put = real;
    }
  });

  it('a later successful save also saves the waiting game', async () => {
    const ls = new FakeStorage();
    const store = await IdbStore.open(new IDBFactory(), 2);
    setStore(store);
    let reject = true;
    const flaky = Object.assign(Object.create(store) as IdbStore, {
      saveGame: (g: Parameters<IdbStore['saveGame']>[0]) =>
        reject ? Promise.reject(new StoreQuotaError('max-games')) : store.saveGame(g),
    });
    expect(
      await new GameSaver(
        () => flaky,
        () => 1000,
        () => undefined,
        ls,
      ).observe({}, src),
    ).toBeNull();
    reject = false;
    const ok = await new GameSaver(
      () => flaky,
      () => 2000,
      () => undefined,
      ls,
    ).observe({}, src);
    expect(ok).not.toBeNull();
    await new Promise((r) => setTimeout(r, 50));
    expect((await store.listGames()).map((g) => g.meta.endedAt).sort()).toEqual([1000, 2000]);
    expect(ls.length).toBe(0);
  });
});

describe('with no IndexedDB a finished game survives a reload (R11)', () => {
  it('keeps a localStorage copy, restores it into History at the next start, and is bounded', async () => {
    const ls = new FakeStorage();
    const mem = new MemoryStore();
    const save = (at: number, s: SaveSource = src) =>
      new GameSaver(
        () => mem,
        () => at,
        () => undefined,
        ls,
      ).observe({}, s);
    expect(await save(1000)).not.toBeNull();
    expect(ls.length).toBe(1);

    // The reload: a new page with no IndexedDB, the same localStorage.
    resetStoreForTests();
    await initStore({ factory: null, storage: ls });
    expect(storeStatus().kind).toBe('memory');
    const listed = await getStore().listGames();
    expect(listed).toHaveLength(1);
    expect(listed[0]!.meta.endedAt).toBe(1000);

    // Bounded: only the newest MEMORY_MODE_KEEP copies stay.
    for (let i = 2; i <= MEMORY_MODE_KEEP + 3; i++) await save(i * 1000);
    expect(ls.length).toBe(MEMORY_MODE_KEEP);
  });

  it('keeps no copy of a game over the size cap', async () => {
    const ls = new FakeStorage();
    const big: SaveSource = {
      ...src,
      record: () => ({ ...rec, padding: 'x'.repeat(MEMORY_MODE_MAX_CHARS) }) as never,
    };
    await new GameSaver(
      () => new MemoryStore(),
      () => 5000,
      () => undefined,
      ls,
    ).observe({}, big);
    expect(ls.length).toBe(0);
  });
});
