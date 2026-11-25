/**
 * M8 WP5: the localStorage -> IndexedDB migration, the tutorial timing store on IndexedDB behind
 * `TimingStore`, and lethal progress on the `progress` store.
 */
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, describe, expect, it } from 'vitest';
import { KEEP_RUNS, TIMING_KEY, IdbTimingStore, TimingTracker } from '../src/tutorial/timing.ts';
import * as migrate from '../src/store/migrate.ts';
import { IdbStore } from '../src/store/idb.ts';
import { getStore } from '../src/store/index.ts';
import { initStore, resetStoreForTests, synced } from '../src/store/open.ts';
import { SyncKv } from '../src/store/sync.ts';
import { readLethalProgress } from '../src/play/coach/profile.ts';
import type { TutorialTimingLog } from '../src/tutorial/types.ts';
import { FakeStorage } from './store-support.ts';

const run = (
  id: string,
  at: number,
  extra: Partial<TutorialTimingLog> = {},
): TutorialTimingLog => ({
  schema: 'tutorial-timing/1',
  runId: id,
  appVersion: '0.0.0',
  engineVersion: '0.5.18',
  tutorialVersion: '1',
  startedAt: new Date(at).toISOString(),
  settings: {
    reducedMotion: false,
    aiPace: '2x',
    singleKeyShortcuts: true,
    cardAnnouncements: 'standard',
  },
  steps: [
    {
      stepId: 't1-zones',
      enteredMs: 0,
      completedMs: 10,
      activeMs: 10,
      hiddenMs: 0,
      idleMs: 0,
      blockedAttempts: 0,
      hintsOpened: 0,
      explainOpened: 0,
      rewinds: 0,
      inputs: { pointer: 1, keyboard: 0 },
      exits: 0,
    },
  ],
  completedMs: 10,
  totalActiveMs: 10,
  totalWallMs: 10,
  ...extra,
});

const PROGRESS = migrate.PROGRESS_KEY;
const lethal = [
  { game: 7, turn: 3, furthest: 'tier1' },
  { game: 8, turn: 5, furthest: 'tier3' },
];

afterEach(() => resetStoreForTests());

describe('migration from localStorage', () => {
  it('pins the keys and the run limit to the tutorial module', () => {
    expect(migrate.TIMING_KEY).toBe(TIMING_KEY);
    expect(migrate.KEEP_RUNS).toBe(KEEP_RUNS);
    expect(PROGRESS).toBe('optcg.progress.lethal.v1');
  });

  it('copies both logs, then deletes the keys; a second run changes nothing', async () => {
    const ls = new FakeStorage();
    ls.setItem(TIMING_KEY, JSON.stringify([run('a', 1000), run('b', 2000)]));
    ls.setItem(PROGRESS, JSON.stringify(lethal));
    ls.setItem('optcg.coach.v1', '{"keep":"me"}');
    const s = await IdbStore.open(new IDBFactory());
    const r = await migrate.migrateFromLocalStorage(s, ls);
    expect(r).toMatchObject({ timingRuns: 2, progressEntries: 2 });
    expect(r.removed.sort()).toEqual([TIMING_KEY, PROGRESS].sort());
    expect(ls.getItem(TIMING_KEY)).toBeNull();
    expect(ls.getItem(PROGRESS)).toBeNull();
    // Decks, coach settings and tutorial progress stay in localStorage.
    expect(ls.getItem('optcg.coach.v1')).toBe('{"keep":"me"}');
    expect((await s.timing.keys()).sort()).toEqual(['a', 'b']);
    expect(await s.progress.get('lethal')).toEqual(lethal);

    // Run again with the keys restored (a second tab wrote them back): same result, no duplicates.
    ls.setItem(TIMING_KEY, JSON.stringify([run('a', 1000), run('b', 2000)]));
    ls.setItem(PROGRESS, JSON.stringify(lethal));
    await migrate.migrateFromLocalStorage(s, ls);
    expect((await s.timing.keys()).sort()).toEqual(['a', 'b']);
    expect(await s.progress.get('lethal')).toEqual(lethal);
    // Nothing to do once the keys are gone.
    expect(await migrate.migrateFromLocalStorage(s, ls)).toMatchObject({
      timingRuns: 0,
      removed: [],
    });
  });

  it('keeps the keys when a write fails, so the next start can finish', async () => {
    const ls = new FakeStorage();
    ls.setItem(TIMING_KEY, JSON.stringify([run('a', 1000)]));
    ls.setItem(PROGRESS, JSON.stringify(lethal));
    const s = await IdbStore.open(new IDBFactory());
    const real = s.progress.set;
    s.progress.set = () => Promise.reject(new Error('disk'));
    await expect(migrate.migrateFromLocalStorage(s, ls)).rejects.toThrow('disk');
    expect(ls.getItem(TIMING_KEY)).not.toBeNull();
    expect(ls.getItem(PROGRESS)).not.toBeNull();
    s.progress.set = real;
    await migrate.migrateFromLocalStorage(s, ls);
    expect(ls.getItem(TIMING_KEY)).toBeNull();
    expect(await s.progress.get('lethal')).toEqual(lethal);
  });

  it('merges lethal progress by game and turn, keeping the furthest step, and drops damage', async () => {
    const ls = new FakeStorage();
    const s = await IdbStore.open(new IDBFactory());
    await s.progress.set('lethal', [{ game: 7, turn: 3, furthest: 'count' }]);
    ls.setItem(PROGRESS, JSON.stringify(lethal));
    await migrate.migrateFromLocalStorage(s, ls);
    expect(await s.progress.get('lethal')).toEqual([
      { game: 7, turn: 3, furthest: 'count' },
      { game: 8, turn: 5, furthest: 'tier3' },
    ]);
    ls.setItem(
      TIMING_KEY,
      JSON.stringify([run('ok', 1), { schema: 'tutorial-timing/1' }, 'junk', null]),
    );
    await migrate.migrateFromLocalStorage(s, ls);
    expect(await s.timing.keys()).toEqual(['ok']);
    ls.setItem(PROGRESS, '{not json');
    await expect(migrate.migrateFromLocalStorage(s, ls)).resolves.toBeTruthy();
    expect(ls.getItem(PROGRESS)).toBeNull();
  });

  it('initStore migrates at boot and the app reads the result synchronously', async () => {
    const ls = new FakeStorage();
    ls.setItem(TIMING_KEY, JSON.stringify([run('a', 1000)]));
    ls.setItem(PROGRESS, JSON.stringify(lethal));
    resetStoreForTests();
    await initStore({ factory: new IDBFactory(), storage: ls });
    expect(getStore().kind).toBe('indexeddb');
    expect(ls.getItem(TIMING_KEY)).toBeNull();
    expect(synced.timing!.keys()).toEqual(['a']);
    const kept = new IdbTimingStore(synced.timing!).load();
    expect(kept.map((r) => r.runId)).toEqual(['a']);
  });
});

describe('the tutorial timing store on IndexedDB', () => {
  it('a TimingTracker writes through IdbTimingStore and a later page load reads it back', async () => {
    const idb = new IDBFactory();
    const s = await IdbStore.open(idb);
    const kv = await SyncKv.hydrate(s.timing);
    let t = 0;
    const clock = { now: () => t };
    const env = {
      appVersion: '0.0.0',
      engineVersion: '0.5.18',
      tutorialVersion: '1',
      settings: {
        reducedMotion: false,
        aiPace: '2x',
        singleKeyShortcuts: true,
        cardAnnouncements: 'standard',
      },
    };
    const tr = TimingTracker.start(clock, new IdbTimingStore(kv), env);
    tr.enterStep('t1-zones');
    t = 4000;
    tr.completeStep();
    tr.enterStep('t2-first-turn');
    t = 9000;
    tr.blocked();
    await kv.flush();

    // A new page load: hydrate from the database, resume the run.
    const kv2 = await SyncKv.hydrate(s.timing);
    const store2 = new IdbTimingStore(kv2);
    const runs = store2.load();
    expect(runs).toHaveLength(1);
    expect(runs[0]!.steps.map((x) => x.stepId)).toEqual(['t1-zones', 't2-first-turn']);
    expect(runs[0]!.steps[0]!.completedMs).toBe(4000);
    const resumed = TimingTracker.resume(clock, store2, tr.runId);
    expect(resumed?.runId).toBe(tr.runId);
  });

  it('keeps the last 20 runs and deletes older ones, and tolerates a damaged entry', async () => {
    const s = await IdbStore.open(new IDBFactory());
    const kv = await SyncKv.hydrate(s.timing);
    const store = new IdbTimingStore(kv);
    store.save(Array.from({ length: 25 }, (_, i) => run(`r${i}`, 1000 + i)));
    await kv.flush();
    expect(await s.timing.keys()).toHaveLength(KEEP_RUNS);
    expect((await s.timing.keys()).includes('r0')).toBe(false);
    await s.timing.set('bad', { schema: 'nope' });
    const kv2 = await SyncKv.hydrate(s.timing);
    expect(new IdbTimingStore(kv2).load()).toHaveLength(KEEP_RUNS);
  });

  it('a failed write is reported, not thrown, and the in-memory log still works', async () => {
    const s = await IdbStore.open(new IDBFactory());
    const errors: unknown[] = [];
    const kv = await SyncKv.hydrate(s.timing, (e) => errors.push(e));
    s.timing.set = () => Promise.reject(new Error('full'));
    kv.set('a', run('a', 1));
    await kv.flush();
    expect(errors).toHaveLength(1);
    expect((kv.get('a') as TutorialTimingLog).runId).toBe('a');
  });
});

describe('lethal progress on the store', () => {
  it('reads and writes through the progress store once the app opened it', async () => {
    resetStoreForTests();
    const ls = new FakeStorage();
    ls.setItem(PROGRESS, JSON.stringify(lethal));
    await initStore({ factory: new IDBFactory(), storage: ls });
    expect(readLethalProgress()).toEqual(lethal);
  });
});
