/**
 * One exit rule (M9 WP7): the drill summary's "passed" is Progress's credit. The summary reads
 * WP6's table (`progress/exit.ts`, whose thresholds a test reads out of curriculum.md), so the two
 * cannot disagree: this checks they do not, for the sets the spec names, on every drill.
 */
import { describe, expect, it } from 'vitest';
import {
  codeOf,
  drillPassedAt,
  EXIT as RULES,
  isDrillRule,
  sessionPasses,
} from '../src/progress/exit.ts';
import { EXIT, ruleOf, summarise, toDrillSession } from '../src/drills/session.ts';
import { DRILL_LESSON, DRILL_SLUGS, type AnswerResult } from '../src/drills/types.ts';

const rs = (right: number, n: number): AnswerResult[] =>
  Array.from({ length: n }, (_, i) => ({
    itemId: `i${i}`,
    correct: i < right,
    shownAnswer: false,
    ms: null,
  }));

describe('the summary and Progress apply one rule', () => {
  it('the drills’ table is WP6’s table, not a copy', () => {
    for (const d of DRILL_SLUGS) {
      const r = RULES[codeOf(DRILL_LESSON[d])]!;
      expect(isDrillRule(r)).toBe(true);
      if (!isDrillRule(r)) continue;
      expect(ruleOf(d)).toBe(r);
      expect(EXIT[d]).toEqual({ needed: r.n, of: r.of, perArchetype: r.perArchetype ?? null });
    }
  });

  const SETS: [number, number][] = [
    [8, 10],
    [7, 10],
    [16, 20],
    [5, 5],
    [6, 10],
    [14, 20],
    [10, 10],
  ];
  for (const drill of DRILL_SLUGS)
    for (const [right, n] of SETS)
      it(`${drill}: ${right}/${n} is passed in the summary exactly when Progress credits it`, () => {
        const results = rs(right, n);
        const s = summarise(drill, results, n, null);
        const session = toDrillSession({
          sid: 's',
          drill,
          at: '2026-11-26T00:00:00.000Z',
          results,
          factor: null,
          archetype: drill === 'mulligan' ? 'a' : undefined,
        });
        const rule = ruleOf(drill);
        const credit = sessionPasses(rule, session);
        // A short set is "not counted": neither passes it.
        expect(s.passed === true).toBe(credit);
        if (n < rule.of) expect(s.passed).toBeNull();
        // And the stored credit: for a per-archetype exit one session is not yet the lesson.
        const earned = drillPassedAt(rule, [session]) !== null;
        expect(earned).toBe(credit && !rule.perArchetype);
      });

  it('the named cases: 8/10 passes, 7/10 does not, 16/20 passes, 5/5 is not counted (L10, L15)', () => {
    for (const d of ['counter', 'lethal'] as const) {
      expect(summarise(d, rs(8, 10), 10, null).passed).toBe(true);
      expect(summarise(d, rs(7, 10), 10, null).passed).toBe(false);
      expect(summarise(d, rs(16, 20), 20, null).passed).toBe(true);
      expect(summarise(d, rs(5, 5), 5, null).passed).toBeNull();
    }
    // L09 asks 7 of 10.
    expect(summarise('don', rs(7, 10), 10, null).passed).toBe(true);
  });
});
