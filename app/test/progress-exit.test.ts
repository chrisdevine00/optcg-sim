/**
 * M9 WP6: the exit table. Every curriculum lesson has a rule, and every number in a rule is read back
 * out of the curriculum's own "Exit (untimed)" text, so editing a threshold there breaks this test.
 */
import { describe, expect, it } from 'vitest';
import { DRILL_IDS } from '@optcg/ai';
import { DRILL_LESSON } from '../src/drills/types.ts';
import { LESSONS } from '../src/learn/lessons.ts';
import { codeOf, drillPassedAt, EXIT, isDrillRule, sessionPasses } from '../src/progress/exit.ts';
import { iso, NOW, session } from './progress-support.ts';

describe('the exit table', () => {
  it('has one rule for every lesson in the curriculum, and none for a lesson that is not there', () => {
    expect(LESSONS).toHaveLength(27);
    expect(Object.keys(EXIT).sort()).toEqual(LESSONS.map((l) => l.code).sort());
  });

  it('reads its numbers back from the curriculum text', () => {
    const exitOf = (code: string) => LESSONS.find((l) => l.code === code)!.exit;
    for (const l of LESSONS) {
      const r = EXIT[l.code]!;
      if (r.kind === 'drill') {
        const m = /(\d+) of (\d+)/.exec(exitOf(l.code))!;
        expect([r.n, r.of], l.code).toEqual([Number(m[1]), Number(m[2])]);
        const per = /for each of (\d+) archetypes/.exec(exitOf(l.code));
        expect(r.perArchetype, l.code).toBe(per ? Number(per[1]) : undefined);
      } else if (r.kind === 'games') {
        const m = /finish (\d+) complete games and win at least (\d+) against Rookie/.exec(
          exitOf(l.code),
        )!;
        expect([r.finish, r.wins]).toEqual([Number(m[1]), Number(m[2])]);
      }
    }
  });

  it('gives the tutorial lessons L01 to L07, games L08, drills L09 L10 L12 L15, nothing else', () => {
    const kinds = (k: string) =>
      LESSONS.filter((l) => EXIT[l.code]!.kind === k)
        .map((l) => l.code)
        .sort();
    expect(kinds('tutorial')).toEqual(['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07']);
    expect(kinds('games')).toEqual(['L08']);
    expect(kinds('drill')).toEqual(['L09', 'L10', 'L12', 'L15']);
    expect(kinds('none')).toHaveLength(27 - 7 - 1 - 4);
  });

  it('agrees with the drills about which lesson each belongs to', () => {
    for (const d of DRILL_IDS) {
      const rule = EXIT[codeOf(DRILL_LESSON[d])];
      expect(isDrillRule(rule) && rule.drill, d).toBe(d);
    }
  });
});

describe('meeting a drill exit', () => {
  const l10 = EXIT.L10!;
  if (!isDrillRule(l10)) throw new Error('L10 is a drill');
  const t = (d: number) => iso(NOW + d * 1000);

  it('needs the share right over at least the lesson’s ten items', () => {
    expect(sessionPasses(l10, session('counter', 10, 8, t(0)))).toBe(true);
    expect(sessionPasses(l10, session('counter', 10, 7, t(0)))).toBe(false);
    expect(sessionPasses(l10, session('counter', 20, 16, t(0)))).toBe(true);
    expect(sessionPasses(l10, session('counter', 5, 5, t(0)))).toBe(false);
  });

  it('is the date of the first passing session of that drill, and nothing for another drill', () => {
    const ss = [
      session('counter', 10, 5, t(0)),
      session('counter', 10, 9, t(5)),
      session('counter', 10, 10, t(9)),
      session('lethal', 10, 10, t(1)),
    ];
    expect(drillPassedAt(l10, ss)).toBe(t(5));
    expect(drillPassedAt(l10, [ss[3]!])).toBeNull();
  });

  it('counts the timed badge only for a timer at 100% or faster', () => {
    const slow = session('counter', 10, 9, t(1), { factor: 2 });
    const exact = session('counter', 10, 9, t(2), { factor: 1 });
    expect(drillPassedAt(l10, [slow], true)).toBeNull();
    expect(drillPassedAt(l10, [slow, exact], true)).toBe(t(2));
    expect(drillPassedAt(l10, [slow])).toBe(t(1));
  });

  it('wants two different archetypes for the mulligan drill (L12)', () => {
    const l12 = EXIT.L12!;
    if (!isDrillRule(l12)) throw new Error('L12 is a drill');
    const rocks = session('mulligan', 10, 8, t(1), { archetype: 'OP17-039' });
    const rocksAgain = session('mulligan', 10, 9, t(2), { archetype: 'OP17-039' });
    const kaido = session('mulligan', 10, 8, t(3), { archetype: 'OP17-058' });
    const noArchetype = session('mulligan', 10, 10, t(4));
    expect(drillPassedAt(l12, [rocks, rocksAgain, noArchetype])).toBeNull();
    expect(drillPassedAt(l12, [rocks, rocksAgain, kaido])).toBe(t(3));
  });
});
