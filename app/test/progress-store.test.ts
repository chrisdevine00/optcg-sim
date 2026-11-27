/**
 * M9 WP6: the progress store and its validator. Writes credit a lesson once and keep the earliest date,
 * the timed badge needs a timer at 100% or faster, two quick writes do not clobber each other, damaged
 * data reads as empty, and an export and import through the real store (memory and IndexedDB) returns
 * the same progress; an import merges rather than replaces. The validator is held to the hostile cases
 * the store-import tests use for the rest of the bundle.
 */
import { IDBFactory } from 'fake-indexeddb';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { IdbStore } from '../src/store/idb.ts';
import { exportEverything } from '../src/store/data.ts';
import { MemoryStore, type ExportBundle, type ReviewStore } from '../src/store/index.ts';
import {
  MAX_PROGRESS_SESSIONS,
  PROGRESS_KEY,
  parseExport,
  sanitizeProgress,
  sanitizeSession,
  validateExport,
} from '../src/store/validate.ts';
import {
  emptyProgress,
  exportProgressOnly,
  importWithProgress,
  progressStore,
  readable,
} from '../src/progress/store.ts';
import type { ProgressV1 } from '../src/progress/types.ts';
import { iso, NOW, session } from './progress-support.ts';

const t = (n: number) => iso(NOW + n * 1000);

describe('recording a session', () => {
  it('credits the lesson when the exit is met, once, and keeps the first date', async () => {
    const kv = new MemoryStore().progress;
    const p = progressStore(kv, () => t(0));
    await p.recordSession(session('counter', 10, 6, t(1)));
    expect((await p.get()).lessons.L10).toBeUndefined();
    await p.recordSession(session('counter', 10, 9, t(2)));
    await p.recordSession(session('counter', 10, 10, t(3)));
    const got = await p.get();
    expect(got.sessions).toHaveLength(3);
    expect(got.lessons.L10).toEqual({ source: 'drill', passedAt: t(2) });
  });

  it('gives the timed badge only to a session run at 100% or faster', async () => {
    const p = progressStore(new MemoryStore().progress);
    await p.recordSession(session('don', 10, 9, t(1), { factor: 4, timedOk: 9 }));
    expect((await p.get()).lessons.L09).toEqual({ source: 'drill', passedAt: t(1) });
    await p.recordSession(session('don', 10, 9, t(2), { factor: 0.5, timedOk: 9 }));
    expect((await p.get()).lessons.L09).toEqual({
      source: 'drill',
      passedAt: t(1),
      passedTimedAt: t(2),
    });
  });

  it('does not lose a session when two are recorded at once', async () => {
    const p = progressStore(new MemoryStore().progress);
    await Promise.all(
      Array.from({ length: 20 }, (_, i) => p.recordSession(session('lethal', 10, i % 10, t(i)))),
    );
    expect((await p.get()).sessions).toHaveLength(20);
  });

  it('refuses a session that could not be real, and keeps what it had', async () => {
    const p = progressStore(new MemoryStore().progress);
    await p.recordSession(session('lethal', 10, 5, t(1)));
    await expect(p.recordSession(session('lethal', 10, 11, t(2)))).rejects.toThrow();
    expect((await p.get()).sessions).toHaveLength(1);
  });

  it('marks a lesson read and unmarks it; read is never passed', async () => {
    const p = progressStore(new MemoryStore().progress, () => t(7));
    await p.markRead('L18');
    expect((await p.get()).lessons.L18).toEqual({ source: 'manual', readAt: t(7) });
    await p.markRead('L18', t(99));
    expect((await p.get()).lessons.L18!.readAt).toBe(t(7));
    await p.unmarkRead('L18');
    expect((await p.get()).lessons.L18).toBeUndefined();
  });

  it('reads a damaged value as empty and never throws', async () => {
    const store = new MemoryStore();
    for (const bad of ['not json', 42, null, [], { v: 2 }, { v: 1, lessons: 5, sessions: [] }]) {
      await store.progress.set(PROGRESS_KEY, bad);
      expect(await progressStore(store.progress).get()).toEqual(emptyProgress());
    }
    expect(readable(undefined)).toEqual(emptyProgress());
    // ... and the next write starts from empty rather than failing.
    await progressStore(store.progress).recordSession(session('lethal', 10, 5, t(1)));
    expect((await progressStore(store.progress).get()).sessions).toHaveLength(1);
  });
});

describe('the progress.v1 validator', () => {
  const good = (): Record<string, unknown> => ({
    v: 1,
    lessons: { L10: { source: 'drill', passedAt: t(1), extra: 'dropped' } },
    sessions: [{ ...session('counter', 10, 8, t(1)), unknown: 'dropped' }],
  });

  it('accepts the shape, drops unknown fields and keeps the numbers', () => {
    const got = sanitizeProgress(good());
    expect(got.lessons.L10).toEqual({ source: 'drill', passedAt: t(1) });
    expect(got.sessions[0]).not.toHaveProperty('unknown');
    expect(got.sessions[0]!.correct).toBe(8);
  });

  it('timedOk is additive (M9-R4): old sessions stay valid, a good one is kept, an impossible one is left out', () => {
    const base = session('counter', 10, 8, t(1), { factor: 1 });
    const dropped: string[] = [];
    const got = sanitizeProgress(
      {
        v: 1,
        lessons: {},
        sessions: [
          { ...base, id: 'old' },
          { ...base, id: 'good', timedOk: 7 },
          { ...base, id: 'more-than-correct', timedOk: 9 },
          { ...base, id: 'negative', timedOk: -1 },
          { ...base, id: 'untimed', factor: null, timedOk: 3 },
        ],
      },
      (w) => dropped.push(w),
    );
    expect(Object.fromEntries(got.sessions.map((s) => [s.id, s.timedOk]))).toEqual({
      old: undefined,
      good: 7,
    });
    expect(dropped).toHaveLength(3);
  });

  it('a session whose lesson is not its drill’s is left out; every real drill’s own lesson passes (M9-R12)', () => {
    const forged = {
      ...session('lethal', 10, 8, t(1)),
      id: 'forged',
      lesson: 'L10-counter-or-take',
    };
    const dropped: string[] = [];
    const got = sanitizeProgress({ v: 1, lessons: {}, sessions: [forged] }, (w) => dropped.push(w));
    expect(got.sessions).toEqual([]);
    expect(dropped[0]).toMatch(/does not belong to its drill/);
    for (const drill of ['mulligan', 'lethal', 'counter', 'don'] as const)
      expect(() => sanitizeSession(session(drill, 10, 8, t(1)))).not.toThrow();
    expect(() => sanitizeSession({ ...session('don', 10, 8, t(1)), lesson: 'L10-x' })).toThrow();
  });

  it('refuses the wrong envelope, too many sessions, and a non-object', () => {
    for (const bad of [null, [], 'x', 1, { v: 2, lessons: {}, sessions: [] }, { v: 1 }])
      expect(() => sanitizeProgress(bad)).toThrow();
    const tooMany = Array.from({ length: MAX_PROGRESS_SESSIONS + 1 }, (_, i) =>
      session('lethal', 10, 5, t(i), { id: `s${i}` }),
    );
    expect(() => sanitizeProgress({ v: 1, lessons: {}, sessions: tooMany })).toThrow();
  });

  it('leaves out a session that could not be real, and says so', () => {
    const base = session('counter', 10, 8, t(1));
    const hostile = [
      { ...base, id: 'a', n: 201 },
      { ...base, id: 'b', correct: 11 },
      { ...base, id: 'c', correct: 6, shown: 6 },
      { ...base, id: 'd', at: 'yesterday' },
      { ...base, id: 'e', drill: 'chess' },
      { ...base, id: 'f', factor: 99 },
      { ...base, id: 'g', lesson: '../../etc' },
      { ...base, id: 'h'.repeat(500) },
      { ...base, id: 'i', itemIds: Array.from({ length: 201 }, () => 'x') },
      { ...base, id: 'j', archetype: 'z'.repeat(200) },
      { ...base, id: 'k', n: 1.5 },
      'a string',
      null,
      { ...base, id: 'ok' },
      { ...base, id: 'ok' },
    ];
    const dropped: string[] = [];
    const got = sanitizeProgress({ v: 1, lessons: {}, sessions: hostile }, (w) => dropped.push(w));
    expect(got.sessions.map((s) => s.id)).toEqual(['ok']);
    expect(dropped).toHaveLength(14);
  });

  it('drops a date that is not ISO, a record with no source, a lesson code that is not one', () => {
    const dropped: string[] = [];
    const got = sanitizeProgress(
      {
        v: 1,
        lessons: {
          L10: { source: 'drill', passedAt: 'last tuesday', readAt: t(1) },
          L11: { source: 'bogus', passedAt: t(1) },
          L12: 'x',
          __proto__: { source: 'manual' },
          constructor: { source: 'manual' },
          'L1; drop table': { source: 'manual' },
        },
        sessions: [],
      },
      (w) => dropped.push(w),
    );
    expect(got.lessons).toEqual({ L10: { source: 'drill', readAt: t(1) } });
    expect(Object.getPrototypeOf(got.lessons)).toBe(Object.prototype);
    expect(dropped.length).toBeGreaterThanOrEqual(3);
  });

  it('keeps the newest 200 sessions of a drill', () => {
    const ss = Array.from({ length: 230 }, (_, i) =>
      session('counter', 10, 5, t(i), { id: `c${i}` }),
    );
    expect(sanitizeProgress({ v: 1, lessons: {}, sessions: ss }).sessions).toHaveLength(200);
  });

  it('is read out of an export file, and a bad one is skipped with a reason, not the file', () => {
    const file = (v: unknown) =>
      JSON.stringify({
        schema: 'optcg-sim/export/1',
        exportedAt: 1,
        build: 'x',
        games: [],
        reviews: [],
        timing: {},
        progress: { [PROGRESS_KEY]: v },
      });
    const ok = parseExport(file(good()));
    expect(ok.ok && ok.bundle.progress[PROGRESS_KEY]).toEqual(sanitizeProgress(good()));
    const bad = parseExport(file({ v: 9 }));
    expect(bad.ok && bad.skipped.join()).toMatch(/progress/);
    expect(bad.ok && bad.bundle.progress[PROGRESS_KEY]).toBeUndefined();
    const half = parseExport(file({ ...good(), sessions: [null, ...(good().sessions as [])] }));
    expect(half.ok && half.skipped.join()).toMatch(/progress/);
    expect(half.ok && (half.bundle.progress[PROGRESS_KEY] as ProgressV1).sessions).toHaveLength(1);
    expect(validateExport({ schema: 'optcg-sim/export/1', progress: { v1: 'x' } }).ok).toBe(true);
  });
});

async function seeded(store: ReviewStore, n: number, offset = 0): Promise<ProgressV1> {
  const p = progressStore(store.progress);
  for (let i = 0; i < n; i++)
    await p.recordSession(session('counter', 10, 6 + (i % 4), t(offset + i)));
  await p.markRead('L18', t(offset));
  return p.get();
}

describe('export and import', () => {
  for (const [name, open] of [
    ['memory', () => Promise.resolve(new MemoryStore() as ReviewStore)],
    ['IndexedDB', () => IdbStore.open(new IDBFactory()) as Promise<ReviewStore>],
  ] as const)
    it(`round-trips the progress through ${name}: equal after exportAll then importAll into a fresh store`, async () => {
      const a = await open();
      const before = await seeded(a, 12);
      await a.progress.set('lethal', [{ game: 1, turn: 3, furthest: 'tier2' }]);
      const parsed = parseExport(await exportEverything(a));
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) return;
      expect(parsed.skipped).toEqual([]);
      const b = await open();
      await importWithProgress(b, parsed.bundle, 'replace');
      expect(await progressStore(b.progress).get()).toEqual(before);
      expect(await b.progress.get('lethal')).toEqual([{ game: 1, turn: 3, furthest: 'tier2' }]);
    });

  it('merges an import into what is here, and importing the same file twice changes nothing', async () => {
    const a = new MemoryStore();
    const fromA = await seeded(a, 5, 0);
    const b = new MemoryStore();
    const fromB = await seeded(b, 5, 100);
    await progressStore(b.progress).markRead('L19', t(500));
    const bundle = parseExport(await exportEverything(a));
    if (!bundle.ok) throw new Error('export did not parse');
    await importWithProgress(b, bundle.bundle, 'replace');
    const once = await progressStore(b.progress).get();
    expect(once.sessions).toHaveLength(10);
    expect(once.sessions.map((s) => s.id)).toEqual(
      expect.arrayContaining([...fromA.sessions, ...fromB.sessions].map((s) => s.id)),
    );
    expect(once.lessons.L19).toEqual({ source: 'manual', readAt: t(500) });
    expect(once.lessons.L18!.readAt).toBe(t(0));
    await importWithProgress(b, bundle.bundle, 'replace');
    expect(await progressStore(b.progress).get()).toEqual(once);
  });

  it('"Export progress only" is a bundle with no games and no reviews that imports cleanly', async () => {
    const a = new MemoryStore();
    const before = await seeded(a, 3);
    const text = await exportProgressOnly(a);
    const parsed = JSON.parse(text) as ExportBundle;
    expect(parsed.games).toEqual([]);
    expect(parsed.reviews).toEqual([]);
    expect(parsed.timing).toEqual({});
    const b = await parseExport(text);
    if (!b.ok) throw new Error('progress-only export did not parse');
    expect(b.bundle.progress[PROGRESS_KEY]).toEqual(before);
  });

  it('Settings → Data imports through the merge, and says progress is included', () => {
    const src = readFileSync(new URL('../src/settings/DataSection.tsx', import.meta.url), 'utf8');
    expect(src).toContain('importWithProgress(getStore(), bundle, how)');
    expect(src).not.toMatch(/getStore\(\)\.importAll\(/);
    expect(src).toContain('Progress is included');
  });
});
