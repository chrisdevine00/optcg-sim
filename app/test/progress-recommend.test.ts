/**
 * M9 WP6: "what to work on next" (learning-ui §6.1) on five fixtures, with the decay revert check: the
 * fixture built to depend on 0.85 picks another lesson when the decay is 1.0. Plus the concept table.
 */
import { describe, expect, it } from 'vitest';
import { LESSONS } from '../src/learn/lessons.ts';
import {
  CONCEPT_LESSON,
  DECAY,
  DRILL_EVIDENCE,
  drillEvidence,
  nextUnfinished,
  parseConceptTable,
  recommend,
  type RecommendInput,
} from '../src/progress/recommend.ts';
import { EXIT, isDrillRule } from '../src/progress/exit.ts';
import type { FlagSpec, GameSpec } from './progress-support.ts';
import { credit, inputOf, iso, NOW, progressOf, session } from './progress-support.ts';

const severe = (concept: string): FlagSpec => ({ concept, severity: 'severe' });
const moderate = (concept: string): FlagSpec => ({ concept, severity: 'moderate' });
const minor = (concept: string): FlagSpec => ({ concept, severity: 'minor' });
const hindsight = (concept: string): FlagSpec => ({ concept, severity: 'hindsight' });
const clean = (n: number, from = 0): GameSpec[] =>
  Array.from({ length: n }, (_, i) => ({ age: from + i }));
const plan = (specs: Record<number, FlagSpec[]>, games: number): GameSpec[] =>
  Array.from({ length: games }, (_, age) => ({ age, flags: specs[age] ?? [] }));

describe('the concept table', () => {
  it('is read from the curriculum, and every primary lesson resolves to a lesson page', () => {
    expect(Object.keys(CONCEPT_LESSON)).toHaveLength(16);
    for (const [slug, id] of Object.entries(CONCEPT_LESSON))
      expect(
        LESSONS.some((l) => l.id === id),
        slug,
      ).toBe(true);
    expect(CONCEPT_LESSON['counter-or-take']).toBe('L10-counter-or-take');
    expect(
      parseConceptTable(
        '## Concept → primary lesson\n| `a-b` | L01-zones | x |\n## Next\n| `c` | L02-x |',
      ),
    ).toEqual({ 'a-b': 'L01-zones' });
  });

  it('knows every concept id the detectors put in an explanation', () => {
    for (const c of [
      'counter-or-take',
      'counters-and-blockers',
      'lethal-math',
      'mulligan',
      'board-vs-face',
      'don-efficiency',
    ])
      expect(CONCEPT_LESSON[c], c).toBeDefined();
  });
});

describe('recommend', () => {
  // Fixture 1: the learning-ui §6.1 example, its text equal.
  it('1. says "5 flags in your last 6 games, 2 of them severe. Your counter-or-take drill: 6 of 10."', () => {
    const input = inputOf(
      plan(
        {
          0: [severe('counter-or-take')],
          1: [moderate('counter-or-take')],
          2: [minor('counter-or-take')],
          4: [severe('counter-or-take')],
          5: [moderate('counter-or-take')],
        },
        8,
      ),
      { progress: progressOf([session('counter', 10, 6, iso(NOW - 1000))]) },
    );
    const r = recommend(input, NOW);
    expect(r.kind).toBe('flags');
    expect(r.lesson).toBe('L10');
    expect(r.lessonId).toBe('L10-counter-or-take');
    expect(r.reason).toBe(
      '5 flags in your last 6 games, 2 of them severe. Your counter-or-take drill: 6 of 10.',
    );
  });

  // Fixture 2: fewer than 3 reviewed games.
  it('2. with fewer than 3 reviewed games names the next unfinished lesson and says so', () => {
    const lessons: Record<string, { source: 'manual'; readAt: string }> = {};
    for (const l of LESSONS)
      if (!['L18', 'L10', 'L09', 'L11', 'L12', 'L13', 'L14'].includes(l.code) && l.code !== 'L01')
        lessons[l.code] = { source: 'manual', readAt: iso(NOW) };
    const prog = progressOf([], lessons);
    const base = { progress: prog, credit: credit(NOW - DAYS(30)) };
    const input = inputOf(
      [
        { age: 0, flags: [severe('counter-or-take')] },
        { age: 1, flags: [severe('counter-or-take')] },
        { age: 2, review: 'none' },
        { age: 3, review: 'partial', flags: [severe('counter-or-take')] },
        { age: 4, tags: ['Tutorial'], flags: [severe('counter-or-take')] },
      ],
      base,
    );
    expect(nextUnfinished(input)[0]!.code).toBe('L18');
    const r = recommend(input, NOW);
    expect(r.kind).toBe('course');
    expect(r.lesson).toBe('L18');
    expect(r.reason).toBe('Not enough games yet: next in the course is L18.');
    expect(r.others.map((o) => o.lesson)).toEqual(['L10', 'L09']);
    // The third reviewed game flips it to the flags.
    const three = inputOf(
      [
        { age: 0, flags: [severe('counter-or-take')] },
        { age: 1, flags: [severe('counter-or-take')] },
        { age: 2, flags: [] },
      ],
      base,
    );
    expect(recommend(three, NOW).kind).toBe('flags');
  });

  // Fixture 3: a passed exit removes the concept.
  it('3. drops a concept whose exit was passed in the last 5 games with no flag since', () => {
    const games = plan(
      {
        3: [severe('counter-or-take')],
        4: [severe('counter-or-take')],
        5: [severe('counter-or-take')],
        1: [moderate('lethal-math')],
      },
      7,
    );
    // The drill was passed after game 3 ended (age 3 days) and before game 2: inside the last 5 games.
    const passedAt = iso(NOW - 2.5 * 86_400_000);
    const without = recommend(inputOf(games), NOW);
    expect(without.lesson).toBe('L10');
    const withPass = recommend(
      inputOf(games, { progress: progressOf([session('counter', 10, 9, passedAt)]) }),
      NOW,
    );
    expect(withPass.lesson).toBe('L15');
    // A flag of the concept after the pass puts it back.
    const flaggedSince = plan(
      {
        0: [minor('counter-or-take')],
        3: [severe('counter-or-take')],
        4: [severe('counter-or-take')],
        5: [severe('counter-or-take')],
        1: [moderate('lethal-math')],
      },
      7,
    );
    expect(
      recommend(
        inputOf(flaggedSince, { progress: progressOf([session('counter', 10, 9, passedAt)]) }),
        NOW,
      ).lesson,
    ).toBe('L10');
    // Passed longer ago than the last 5 games: not removed.
    const old = iso(NOW - 6.5 * 86_400_000);
    expect(
      recommend(inputOf(games, { progress: progressOf([session('counter', 10, 9, old)]) }), NOW)
        .lesson,
    ).toBe('L10');
  });

  // Fixture 4: a tie goes to the earlier lesson in teaching order.
  it('4. breaks a tie by teaching order, not by the order the flags were found', () => {
    const a = recommend(
      inputOf(plan({ 0: [moderate('lethal-math'), moderate('counter-or-take')] }, 4)),
      NOW,
    );
    const b = recommend(
      inputOf(plan({ 0: [moderate('counter-or-take'), moderate('lethal-math')] }, 4)),
      NOW,
    );
    // L10 is taught in Stage 2, L15 in Stage 3.
    expect([a.lesson, b.lesson]).toEqual(['L10', 'L10']);
    expect(a.others.map((o) => o.lesson)).toEqual(['L15']);
    expect(LESSONS.findIndex((l) => l.code === 'L10')).toBeLessThan(
      LESSONS.findIndex((l) => l.code === 'L15'),
    );
  });

  // Fixture 5: Hindsight weighs half.
  it('5. weighs a Hindsight flag at half a minor', () => {
    // Three Hindsight (1.5) lose to one moderate (2); five (2.5) beat it.
    const lose = recommend(
      inputOf(
        plan(
          {
            0: [
              hindsight('lethal-math'),
              hindsight('lethal-math'),
              hindsight('lethal-math'),
              moderate('counter-or-take'),
            ],
          },
          3,
        ),
      ),
      NOW,
    );
    expect(lose.lesson).toBe('L10');
    const win = recommend(
      inputOf(
        plan(
          {
            0: [
              ...Array.from({ length: 5 }, () => hindsight('lethal-math')),
              moderate('counter-or-take'),
            ],
          },
          3,
        ),
      ),
      NOW,
    );
    expect(win.lesson).toBe('L15');
    // Equal weight to a minor: 2 Hindsight = 1 minor, a tie, so teaching order picks L10.
    const tie = recommend(
      inputOf(
        plan(
          { 0: [hindsight('lethal-math'), hindsight('lethal-math'), minor('counter-or-take')] },
          3,
        ),
      ),
      NOW,
    );
    expect(tie.lesson).toBe('L10');
    expect(tie.others[0]!.lesson).toBe('L15');
  });

  // The revert check: the decay is part of the answer.
  it('depends on the 0.85 decay: with 1.0 the same games pick another lesson', () => {
    // Lethal math: one severe and one moderate flag in the newest games. Counter or take: two severe
    // flags in the two oldest games. With the decay, recent evidence wins; without it, the older pile does.
    const input = inputOf(
      plan(
        {
          0: [severe('lethal-math')],
          1: [moderate('lethal-math')],
          8: [severe('counter-or-take')],
          9: [severe('counter-or-take')],
        },
        10,
      ),
    );
    expect(DECAY).toBe(0.85);
    expect(recommend(input, NOW).lesson).toBe('L15');
    expect(recommend(input, NOW, { decay: 0.85 }).lesson).toBe('L15');
    expect(recommend(input, NOW, { decay: 1 }).lesson).toBe('L10');
  });

  it('adds 2 for a drill under its exit even with no flag, and says how far under', () => {
    const input = inputOf(clean(4), {
      progress: progressOf([session('mulligan', 10, 3, iso(NOW - 1000))]),
    });
    const r = recommend(input, NOW);
    expect(r.lesson).toBe('L12');
    expect(r.reason).toBe(
      'Your mulligan drill: 3 of 10. That is under the 8 of 10, for each of 2 archetypes to pass L12.',
    );
    // A drill at or over the exit adds nothing: with no flags the card falls back to the course.
    const fine = inputOf(clean(4), {
      progress: progressOf([
        session('mulligan', 10, 8, iso(NOW - 1000), { archetype: 'OP17-039' }),
      ]),
    });
    expect(recommend(fine, NOW).kind).toBe('course');
  });

  it('only looks at the last 10 reviewed games, and ignores tutorial games', () => {
    const specs: GameSpec[] = [
      ...clean(10),
      { age: 11, flags: [severe('counter-or-take')] },
      { age: 12, tags: ['Tutorial'], flags: [severe('lethal-math')] },
    ];
    expect(recommend(inputOf(specs), NOW).kind).toBe('course');
  });

  it('gives lethal tiers only as a supporting line', () => {
    const input = inputOf(plan({ 0: [severe('lethal-math')] }, 3));
    const lethal: RecommendInput['lethal'] = [
      { game: 1, turn: 2, furthest: 'tier3' },
      { game: 2, turn: 2, furthest: 'tier1' },
    ];
    const a = recommend({ ...input, lethal }, NOW);
    const b = recommend(input, NOW);
    expect(a.supporting).toEqual([
      'You asked the lethal coach about 2 chances: the full line was needed on 1.',
    ]);
    expect(a.reason).toBe(b.reason);
    expect(b.supporting).toEqual([]);
  });

  it('says so when every lesson is finished and there is nothing to fix', () => {
    const lessons: Record<string, { source: 'manual'; readAt: string }> = {};
    for (const l of LESSONS) lessons[l.code] = { source: 'manual', readAt: iso(NOW) };
    const r = recommend(inputOf(clean(2), { progress: progressOf([], lessons) }), NOW);
    expect(r.kind).toBe('done');
    expect(r.lesson).toBeNull();
  });
});

describe('the drill evidence weight (M9-R8, M9-R9)', () => {
  // Lethal math flagged severe in all 10 games: 3 * (1 - 0.85^10) / 0.15 / 10 = 1.61, the most flags can say.
  const everyGame = Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [i, [severe('lethal-math')]]),
  );
  const flagged = plan(everyGame, 10);
  const failing = (n: number, correct: number) =>
    progressOf([session('counter', n, correct, iso(NOW - 1000))]);

  it('is 2, and a full failing session counts in full (pinned: 0.5 would lose to the flags below)', () => {
    expect(DRILL_EVIDENCE).toBe(2);
    expect(recommend(inputOf(flagged, { progress: failing(10, 5) }), NOW).lesson).toBe('L10');
    expect(recommend(inputOf(flagged, { progress: failing(20, 10) }), NOW).lesson).toBe('L10');
  });

  it('a session of one item, answered wrong, does not outrank severe flags in every game', () => {
    expect(recommend(inputOf(flagged, { progress: failing(1, 0) }), NOW).lesson).toBe('L15');
    expect(recommend(inputOf(flagged, { progress: failing(5, 1) }), NOW).lesson).toBe('L15');
  });

  it('scales by the session size up to the exit’s ten items', () => {
    const rule = EXIT.L10!;
    if (!isDrillRule(rule)) throw new Error('L10 is a drill');
    expect(drillEvidence(rule, 1)).toBeCloseTo(0.2);
    expect(drillEvidence(rule, 5)).toBeCloseTo(1);
    expect(drillEvidence(rule, 10)).toBe(2);
    expect(drillEvidence(rule, 40)).toBe(2);
  });

  it('with no flags at all, a failing short session still suggests its lesson, without claiming it is under the exit', () => {
    const r = recommend(inputOf(clean(4), { progress: failing(1, 0) }), NOW);
    expect(r.lesson).toBe('L10');
    expect(r.reason).toBe('Your counter-or-take drill: 0 of 1.');
  });
});

function DAYS(n: number): number {
  return n * 86_400_000;
}
