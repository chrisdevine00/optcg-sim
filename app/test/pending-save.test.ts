/**
 * M8 WP7 fix: a finished game survives a reload that beats the IndexedDB commit. The seam keeps a
 * synchronous localStorage copy until the store has committed; the next start finishes it.
 */
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, describe, expect, it } from 'vitest';
import { GameSaver, type SaveSource } from '../src/play/save-game.ts';
import { IdbStore } from '../src/store/idb.ts';
import { PENDING_PREFIX, flushStashed, resetPendingForTests } from '../src/store/pending.ts';
import { MemoryStore, StoreQuotaError, type ReviewStore } from '../src/store/index.ts';
import { initStore, resetStoreForTests } from '../src/store/open.ts';
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
const noop = () => undefined;
afterEach(() => resetPendingForTests());

/** A store whose write never commits: the page unloaded first. */
function neverCommits(real: IdbStore): ReviewStore {
  return Object.assign(Object.create(real) as IdbStore, {
    saveGame: () => new Promise<void>(() => undefined),
  });
}

describe('the finished game safety copy', () => {
  it('is kept while the write is in flight, and the next start saves it', async () => {
    const factory = new IDBFactory();
    const ls = new FakeStorage();
    const first = await IdbStore.open(factory);
    new GameSaver(
      () => neverCommits(first),
      () => 1000,
      noop,
      ls,
    ).observe({}, src);
    expect(ls.length).toBe(1);
    expect(await first.listGames()).toHaveLength(0);
    first.close();

    resetStoreForTests();
    await initStore({ factory, storage: ls });
    const second = await IdbStore.open(factory);
    expect(await second.listGames()).toHaveLength(1);
    expect(ls.length).toBe(0);
  });

  it('is removed once IndexedDB has committed, and kept on a failure the page saw (R3)', async () => {
    const factory = new IDBFactory();
    const ls = new FakeStorage();
    const store = await IdbStore.open(factory);
    const id = await new GameSaver(
      () => store,
      () => 1000,
      noop,
      ls,
    ).observe({}, src);
    expect(id).not.toBeNull();
    expect(ls.length).toBe(0);
    const failing = Object.assign(Object.create(store) as IdbStore, {
      saveGame: () => Promise.reject(new StoreQuotaError('browser')),
    });
    const errors: unknown[] = [];
    await new GameSaver(
      () => failing,
      () => 2000,
      (e) => errors.push(e),
      ls,
    ).observe({}, src);
    expect(errors).toHaveLength(1);
    // A failed save keeps the finished game: it is saved again after room is made.
    expect(ls.length).toBe(1);
    expect(await flushStashed(store, ls)).toBe(1);
    expect(ls.length).toBe(0);
  });

  it('stays for the in-memory store (R11), and saving twice changes nothing', async () => {
    const ls = new FakeStorage();
    await new GameSaver(
      () => new MemoryStore(),
      () => 1000,
      noop,
      ls,
    ).observe({}, src);
    // No IndexedDB: the copy is what survives a reload, so it stays (bounded).
    expect(ls.length).toBe(1);
    const store = await IdbStore.open(new IDBFactory());
    new GameSaver(
      () => neverCommits(store),
      () => 1000,
      noop,
      ls,
    ).observe({}, src);
    await flushStashed(store, ls);
    await flushStashed(store, ls);
    expect(await store.listGames()).toHaveLength(1);
  });

  it('drops an unreadable copy instead of failing every start', async () => {
    const ls = new FakeStorage();
    ls.setItem(PENDING_PREFIX + 'bad', '{not json');
    const store = await IdbStore.open(new IDBFactory());
    expect(await flushStashed(store, ls)).toBe(0);
    expect(ls.length).toBe(0);
  });
});
