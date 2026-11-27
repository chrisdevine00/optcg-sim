/**
 * The drill shell's pure parts (M9 WP4): the timer on a fake clock, the session's order and filters,
 * the score against the lesson's exit, and what is written to progress.
 */
import { describe, expect, it } from 'vitest';
import {
  BASE_SECONDS,
  clockWords,
  factorOfPercent,
  ItemTimer,
  limitSeconds,
  TIMER_CHOICES,
} from '../src/drills/timer.ts';
import {
  filterEntries,
  neededFor,
  pickItems,
  recordSafely,
  seedOfSession,
  setProgressSink,
  summarise,
  toDrillSession,
  type DrillEntry,
} from '../src/drills/session.ts';
import type { AnswerResult, DrillItem } from '../src/drills/types.ts';

const clock = () => {
  let t = 0;
  return { now: () => t, tick: (s: number) => (t += s * 1000) };
};

describe('timer', () => {
  it('lists exactly Untimed, 50%, 100%, 200%, 400%, 1000%', () => {
    expect(TIMER_CHOICES.map((c) => c.label)).toEqual([
      'Untimed',
      '50%',
      '100%',
      '200%',
      '400%',
      '1000%',
    ]);
    expect(factorOfPercent(1000)).toBe(10);
    expect(factorOfPercent(300)).toBeNull();
  });

  it('a 1000% factor multiplies the base time: 600 s for a lethal puzzle', () => {
    expect(BASE_SECONDS.lethal).toBe(60);
    expect(limitSeconds('lethal', 10)).toBe(600);
    expect(limitSeconds('lethal', 0.5)).toBe(30);
    expect(limitSeconds('mulligan', null)).toBeNull();
  });

  it('warns once at 10 s left, says "over" once, and still accepts the answer afterwards', () => {
    const c = clock();
    const t = new ItemTimer('lethal', 1, c.now);
    t.start();
    c.tick(49);
    expect(t.tick()).toEqual([]);
    c.tick(1);
    expect(t.tick()).toEqual(['ten-left']);
    expect(t.tick()).toEqual([]);
    c.tick(11);
    expect(t.tick()).toEqual(['over']);
    expect(t.over).toBe(true);
    expect(t.remaining()).toBe(0);
    // Over time never ends the item: the answer is simply not "within time".
    expect(t.withinTime()).toBe(false);
    expect(t.elapsedMs()).toBe(61_000);
  });

  it('pausing stops the clock, and a longer factor mid-item keeps the time already spent', () => {
    const c = clock();
    const t = new ItemTimer('counter', 1, c.now);
    t.start();
    c.tick(20);
    t.pause();
    c.tick(500);
    expect(t.elapsedMs()).toBe(20_000);
    t.start();
    c.tick(15);
    expect(t.over).toBe(true);
    t.setFactor(4);
    expect(t.over).toBe(false);
    expect(t.remaining()).toBe(85);
  });

  it('untimed has no events and is always within time', () => {
    const c = clock();
    const t = new ItemTimer('don', null, c.now);
    t.start();
    c.tick(10_000);
    expect(t.tick()).toEqual([]);
    expect(t.withinTime()).toBe(true);
    expect(clockWords(42.2)).toBe('0:43');
  });
});

const item = (id: string, over: Partial<DrillItem> & Record<string, unknown> = {}): DrillItem =>
  ({
    id,
    drill: 'mulligan',
    lesson: 'L12-mulligan',
    source: { kind: 'bank', seed: 1 },
    mine: 'OP17-039',
    theirs: null,
    first: true,
    certainty: 'any-hand',
    label: 'guide',
    hand: [],
    archetypeId: 'OP17-039',
    ...over,
  }) as DrillItem;

const entries: DrillEntry[] = [
  ...Array.from({ length: 12 }, (_, i) => ({ item: item(`b${i}`, { first: i % 2 === 0 }) })),
  {
    item: item('flag:g:f1', { source: { kind: 'flag', gameId: 'g', flagId: 'f1', turn: 9 } }),
  },
];

describe('items of a session', () => {
  it('the same session id gives the same order, another id another', () => {
    const a = pickItems(entries, { count: 10, sid: 'abc' }).map((e) => e.item.id);
    expect(pickItems(entries, { count: 10, sid: 'abc' }).map((e) => e.item.id)).toEqual(a);
    expect(pickItems(entries, { count: 10, sid: 'abd' }).map((e) => e.item.id)).not.toEqual(a);
    expect(seedOfSession('abc')).toBe(seedOfSession('abc'));
  });

  it('"from my games" puts the player’s own items first, and the bank fills the rest', () => {
    const picked = pickItems(entries, { count: 5, sid: 'x', source: 'mine' });
    expect(picked[0]!.item.id).toBe('flag:g:f1');
    expect(picked).toHaveLength(5);
  });

  it('filters by seat, source and archetype', () => {
    const arch = (l: string) => (l === 'OP17-039' ? 'OP17-039' : 'other');
    expect(filterEntries(entries, { seat: 'first' }, arch).every((e) => e.item.first)).toBe(true);
    expect(
      filterEntries(entries, { source: 'bank' }, arch).some((e) => e.item.id.startsWith('flag')),
    ).toBe(false);
    expect(filterEntries(entries, { archetype: 'nope' }, arch)).toHaveLength(0);
  });
});

const rs = (right: number, n: number, ms: number | null = 5000): AnswerResult[] =>
  Array.from({ length: n }, (_, i) => ({
    itemId: `i${i}`,
    correct: i < right,
    shownAnswer: false,
    ms,
  }));

describe('summary against the lesson’s exit', () => {
  it('8 of 10 passes, 7 of 10 does not (L10, L12, L15)', () => {
    for (const d of ['mulligan', 'lethal', 'counter'] as const) {
      expect(summarise(d, rs(8, 10), 10, null).headline).toBe('8 of 10: passed');
      expect(summarise(d, rs(7, 10), 10, null).headline).toBe('7 of 10: not yet');
    }
    // L09 asks 7 of 10.
    expect(summarise('don', rs(7, 10), 10, null).passed).toBe(true);
    expect(summarise('don', rs(6, 10), 10, null).passed).toBe(false);
  });

  it('a shown answer is not correct, and a set shorter than ten cannot pass the lesson', () => {
    const shown = rs(10, 10).map((r, i) => (i < 3 ? { ...r, shownAnswer: true } : r));
    const s = summarise('lethal', shown, 10, null);
    expect(s.correct).toBe(7);
    expect(s.shown).toBe(3);
    expect(s.passed).toBe(false);
    const short = summarise('lethal', rs(5, 5), 5, null);
    expect(short.passed).toBeNull();
    expect(short.headline).toContain('not counted for the lesson');
    expect(neededFor('lethal', 20)).toBe(16);
  });

  it('timed results are separate: only 100% or less with a full set earns the badge', () => {
    const fast = summarise('lethal', rs(9, 10, 30_000), 10, 1);
    expect(fast.timed).toMatchObject({ within: 9, earns: true, passed: true });
    const slow = summarise('lethal', rs(9, 10, 90_000), 10, 1);
    expect(slow.timed).toMatchObject({ within: 0, passed: false });
    const generous = summarise('lethal', rs(9, 10, 90_000), 10, 2);
    expect(generous.timed).toMatchObject({ within: 9, earns: false, passed: false });
    expect(summarise('lethal', rs(9, 10), 10, null).timed).toBeNull();
  });
});

describe('progress', () => {
  it('writes the session in the shape the store accepts, with the archetype of a mulligan session', () => {
    const s = toDrillSession({
      sid: 'abc.1',
      drill: 'mulligan',
      at: '2026-11-26T10:00:00.000Z',
      results: rs(8, 10).map((r, i) => ({ ...r, shownAnswer: i === 9 })),
      factor: null,
      archetype: 'OP17-039',
    });
    expect(s).toMatchObject({
      id: 'abc.1',
      drill: 'mulligan',
      lesson: 'L12-mulligan',
      n: 10,
      correct: 8,
      shown: 1,
      factor: null,
      archetype: 'OP17-039',
    });
    expect(s.correct + s.shown).toBeLessThanOrEqual(s.n);
  });

  it('goes through the injected sink, and a sink that throws never crashes the drill', async () => {
    const got: string[] = [];
    setProgressSink({
      recordSession: (s) => {
        got.push(s.id);
        return Promise.resolve();
      },
    });
    const s = toDrillSession({ sid: 'a', drill: 'don', at: 'x', results: rs(1, 1), factor: null });
    expect(await recordSafely(s)).toBe(true);
    expect(got).toEqual(['a']);
    setProgressSink({
      recordSession: () => {
        throw new Error('impossible session');
      },
    });
    expect(await recordSafely(s)).toBe(false);
    setProgressSink(null);
  });
});
