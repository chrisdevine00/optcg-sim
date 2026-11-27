/**
 * M9 WP6: what the pages derive. Lesson status by exit kind, the tutorial's credit (L01 to L07 passed,
 * L08 not), win rates that leave out Rewound, From review and Tutorial games and say how many, flag
 * frequency, accuracy series, the lethal log, and a lesson id check against `/learn` rows.
 */
import { describe, expect, it } from 'vitest';
import {
  accuracySeries,
  excludedNote,
  flagFrequency,
  lessonInfo,
  lessonStatus,
  lethalFoundAlone,
  ratePercent,
  winRates,
  type LessonStatus,
} from '../src/progress/derive.ts';
import { LESSONS } from '../src/learn/lessons.ts';
import { credit, inputOf, iso, NOW, progressOf, session } from './progress-support.ts';

const t = (n: number) => iso(NOW + n * 1000);

describe('lessonStatus', () => {
  const table: [string, string, ReturnType<typeof inputOf>, LessonStatus][] = [
    ['nothing at all', 'L10', inputOf([]), 'not-started'],
    [
      'a drill session under the exit',
      'L10',
      inputOf([], { progress: progressOf([session('counter', 10, 6, t(1))]) }),
      'in-progress',
    ],
    [
      'a drill session over the exit, untimed',
      'L10',
      inputOf([], { progress: progressOf([session('counter', 10, 8, t(1))]) }),
      'passed',
    ],
    [
      'a drill session over the exit at 100%',
      'L10',
      inputOf([], { progress: progressOf([session('counter', 10, 8, t(1), { factor: 1 })]) }),
      'passed-timed',
    ],
    [
      'a drill session over the exit at 400% is passed but not timed',
      'L10',
      inputOf([], { progress: progressOf([session('counter', 10, 9, t(1), { factor: 4 })]) }),
      'passed',
    ],
    [
      'a passed date that outlived its sessions',
      'L09',
      inputOf([], { progress: progressOf([], { L09: { source: 'drill', passedAt: t(1) } }) }),
      'passed',
    ],
    [
      'the mulligan drill passed for one archetype only',
      'L12',
      inputOf([], {
        progress: progressOf([session('mulligan', 10, 9, t(1), { archetype: 'OP17-039' })]),
      }),
      'in-progress',
    ],
    [
      'the mulligan drill passed for two archetypes',
      'L12',
      inputOf([], {
        progress: progressOf([
          session('mulligan', 10, 9, t(1), { archetype: 'OP17-039' }),
          session('mulligan', 10, 8, t(2), { archetype: 'OP17-058' }),
        ]),
      }),
      'passed',
    ],
    [
      'a lesson with no drill, marked read',
      'L18',
      inputOf([], { progress: progressOf([], { L18: { source: 'manual', readAt: t(1) } }) }),
      'read',
    ],
    ['a lesson with no drill, untouched', 'L18', inputOf([]), 'not-started'],
    ['the tutorial done: L01', 'L01', inputOf([], { credit: credit(NOW) }), 'passed'],
    ['the tutorial not done: L01', 'L01', inputOf([]), 'not-started'],
    [
      'the tutorial done does not pass L08',
      'L08',
      inputOf([], { credit: credit(NOW) }),
      'not-started',
    ],
    [
      'one Rookie game is in progress for L08',
      'L08',
      inputOf([{ age: 1, tier: 'rookie', result: 'won' }]),
      'in-progress',
    ],
    [
      'three Rookie games, two won: L08 passed',
      'L08',
      inputOf([
        { age: 3, tier: 'rookie', result: 'won' },
        { age: 2, tier: 'rookie', result: 'lost' },
        { age: 1, tier: 'rookie', result: 'won' },
      ]),
      'passed',
    ],
    [
      'three Rookie games, one won: not yet',
      'L08',
      inputOf([
        { age: 3, tier: 'rookie', result: 'won' },
        { age: 2, tier: 'rookie', result: 'lost' },
        { age: 1, tier: 'rookie', result: 'lost' },
      ]),
      'in-progress',
    ],
    [
      'Rewound and tutorial Rookie wins do not count for L08',
      'L08',
      inputOf([
        { age: 3, tier: 'rookie', result: 'won', tags: ['Rewound'] },
        { age: 2, tier: 'rookie', result: 'won', tags: ['Tutorial'] },
        { age: 1, tier: 'rookie', result: 'won' },
      ]),
      'in-progress',
    ],
  ];
  it.each(table)('%s', (_name, code, input, want) => {
    expect(lessonStatus(code, input)).toBe(want);
  });

  it('shows the tutorial credit as L01 to L07 passed and L08 not', () => {
    const input = inputOf([], { credit: credit(NOW) });
    const done = LESSONS.filter((l) => lessonStatus(l.code, input) === 'passed').map((l) => l.code);
    expect(done.sort()).toEqual(['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07']);
    expect(lessonStatus('L08', input)).not.toBe('passed');
  });

  it('says what the row should say after the status', () => {
    const input = inputOf([], {
      progress: progressOf([session('counter', 10, 6, t(1)), session('counter', 10, 7, t(2))]),
    });
    expect(lessonInfo('L10', input).detail).toBe('drill: best 7 of 10');
    expect(lessonInfo('L10', input).last).toEqual({ correct: 7, n: 10 });
    expect(lessonInfo('L18', input).detail).toBe('Lesson only: no drill yet');
  });
});

describe('win rates', () => {
  const games = inputOf([
    { age: 1, result: 'won', tier: 'pirate', leader: 'OP17-039', deck: 'Rocks' },
    { age: 2, result: 'lost', tier: 'pirate', leader: 'OP17-039', deck: 'Rocks' },
    { age: 3, result: 'won', tier: 'rookie', leader: 'OP17-058', deck: 'Kaido' },
    { age: 4, result: 'won', tier: 'warlord', tags: ['Rewound'] },
    { age: 5, result: 'won', tier: 'warlord', tags: ['Rewound'] },
    { age: 6, result: 'won', tier: 'warlord', tags: ['Rewound'] },
    { age: 7, result: 'lost', tier: 'rookie', tags: ['From review'] },
    { age: 8, result: 'won', tier: 'rookie', tags: ['Tutorial'] },
  ]);

  it('leaves out Rewound, From review and Tutorial games and counts them', () => {
    const r = winRates(games);
    expect(r.counted).toBe(3);
    expect(r.excluded).toEqual({ rewound: 3, 'from-review': 1, tutorial: 1 });
    expect(r.excludedNote).toBe(
      '3 rewound games, 1 game started from a review, 1 tutorial game not counted',
    );
    const rocks = r.byArchetype.find((x) => x.key === 'OP17-039')!;
    expect([rocks.games, rocks.wins, rocks.losses, ratePercent(rocks)]).toEqual([2, 1, 1, 50]);
    expect(r.byArchetype.map((x) => x.label)).toEqual(['Rocks', 'Kaido']);
    expect(r.byTier.map((x) => [x.label, x.games])).toEqual([
      ['Rookie', 1],
      ['Pirate', 2],
    ]);
  });

  it('says nothing when nothing was left out', () => {
    expect(winRates(inputOf([{ age: 1 }])).excludedNote).toBe('');
    expect(excludedNote({ rewound: 1, 'from-review': 0, tutorial: 0 })).toBe(
      '1 rewound game not counted',
    );
  });
});

describe('flag frequency, accuracy and lethal', () => {
  it('counts flags by kind over the last 20 reviewed non-tutorial games', () => {
    const specs = Array.from({ length: 22 }, (_, i) => ({
      age: i,
      flags: [{ concept: 'counter-or-take', severity: 'minor' as const }],
    }));
    specs.push({ age: 30, flags: [{ concept: 'lethal-math', severity: 'minor' as const }] });
    const f = flagFrequency(inputOf(specs), 20);
    expect(f.games).toBe(20);
    expect(f.byKind).toEqual({ 'should-counter': 20 });
    const tutorial = inputOf([
      { age: 0, tags: ['Tutorial'], flags: [{ concept: 'mulligan', severity: 'minor' }] },
    ]);
    expect(flagFrequency(tutorial).total).toBe(0);
    const unfinished = inputOf([
      { age: 0, review: 'partial', flags: [{ concept: 'mulligan', severity: 'minor' }] },
    ]);
    expect(flagFrequency(unfinished).games).toBe(0);
  });

  it('splits drill accuracy into untimed and timed series, oldest first', () => {
    const s = accuracySeries(
      progressOf([
        session('don', 10, 9, t(3)),
        session('don', 10, 5, t(1)),
        session('don', 10, 8, t(2), { factor: 2 }),
        session('lethal', 10, 1, t(1)),
      ]),
      'don',
    );
    expect(s.untimed.map((p) => p.percent)).toEqual([50, 90]);
    expect(s.timed.map((p) => [p.percent, p.factor])).toEqual([[80, 2]]);
  });

  it('summarises how far the player needed to go on lethal chances', () => {
    const l = lethalFoundAlone([
      { game: 1, turn: 3, furthest: 'tier1' },
      { game: 1, turn: 5, furthest: 'tier3' },
      { game: 2, turn: 4, furthest: 'tier3' },
      { game: 3, turn: 2, furthest: 'count' },
    ]);
    expect(l).toEqual({ total: 4, needed: { tier1: 1, tier2: 0, count: 1, tier3: 2 } });
  });

  it('uses the injected data only: games a day apart are ordered by their end time', () => {
    const f = flagFrequency(
      inputOf([
        { age: 1, flags: [{ concept: 'mulligan', severity: 'minor' }] },
        { age: 0, flags: [] },
      ]),
      1,
    );
    expect(f.total).toBe(0);
  });
});
