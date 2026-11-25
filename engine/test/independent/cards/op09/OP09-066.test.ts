/**
 * OP09-066 Jean Bart (Character, Purple, cost 4, 6000, no Counter, {Heart Pirates}).
 *
 * Card text: "[On Play] If your opponent has more DON!! cards on their field than you, K.O. up to 1 of
 * your opponent's Characters with a cost of 3 or less."
 *
 * Rules: "DON!! cards on their field" counts active and rested DON!! in the cost area and DON!!
 * given to Leaders and Characters (not the DON!! deck). A colon-less "If" is an effect condition,
 * CR 8-4-4 ("up to"). Playing Jean Bart only rests DON!! (they stay on the field).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playId,
  reachablePickSets,
  V9,
} from './kit-op09b.ts';

const BART = 'OP09-066';

type Don = { active: number; rested: number };

function play(
  mineDon: Don,
  oppDon: Don,
  o: { leaderDon?: number; opp?: (string | { card: string; don?: number })[] } = {},
) {
  const g = mine(
    o.leaderDon ? { card: L9.neutral, don: o.leaderDon } : L9.neutral,
    { hand: [BART], costArea: mineDon },
    { characters: o.opp ?? [V9.c1, V9.c3], costArea: oppDon },
  );
  playId(g, BART);
  return g;
}

describe('OP09-066 Jean Bart: [On Play] if the opponent has more DON!! on their field than I do, K.O. up to 1 of their Characters with cost 3 or less', () => {
  it('opponent 6 DON!! vs my 5: offers the opposing Characters with cost 3 or less, and the pick is K.O.d', () => {
    const g = play(
      { active: 5, rested: 0 },
      { active: 6, rested: 0 },
      { opp: [V9.c1, V9.c3, V9.c4] },
    );
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c1, V9.c3].sort());
    pickInst(g, [at(g, 'p2', 'characters', V9.c3)]);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V9.c3]);
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([V9.c1, V9.c4].sort());
  });

  it('boundary: equal DON!! (5 vs 5) is not "more": nothing is asked and nothing is K.O.d', () => {
    const g = play({ active: 5, rested: 0 }, { active: 5, rested: 0 });
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });

  it('the opponent has fewer DON!! (3 vs 5): nothing is asked and nothing is K.O.d', () => {
    const g = play({ active: 5, rested: 0 }, { active: 3, rested: 0 });
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it("rested DON!! count: the opponent's 2 active + 4 rested (6) beat my 5", () => {
    const g = play({ active: 5, rested: 0 }, { active: 2, rested: 4 });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c1, V9.c3].sort());
  });

  it("DON!! given to the opponent's Characters count as on their field: 4 in the cost area + 2 given = 6 beat my 5", () => {
    const g = play(
      { active: 5, rested: 0 },
      { active: 4, rested: 0 },
      { opp: [{ card: V9.c3, don: 2 }, V9.c1] },
    );
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c1, V9.c3].sort());
  });

  it("DON!! given to my own Leader count on my side: 5 in the cost area + 1 given = 6 ties the opponent's 6 (no K.O.)", () => {
    const g = play({ active: 5, rested: 0 }, { active: 6, rested: 0 }, { leaderDon: 1 });
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it("paying Jean Bart's cost 4 does not lower my count: 4 rested + 1 active is still 5 DON!! on my field", () => {
    const g = play({ active: 5, rested: 0 }, { active: 5, rested: 0 });
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('boundary: cost 3 is a legal target and cost 4 is not', () => {
    const g = play({ active: 5, rested: 0 }, { active: 6, rested: 0 }, { opp: [V9.c3, V9.c4] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c3]);
  });

  it('"up to 1": choosing nothing K.O.s nothing', () => {
    const g = play({ active: 5, rested: 0 }, { active: 6, rested: 0 });
    need(g, 'choose', 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('K.O.s at most 1 Character', () => {
    const g = play(
      { active: 5, rested: 0 },
      { active: 6, rested: 0 },
      { opp: [V9.c1, V9.c3, V9.c2] },
    );
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('the condition holds but no opposing Character has cost 3 or less: nothing is K.O.d (a prompt, if any, offers nothing)', () => {
    const g = play({ active: 5, rested: 0 }, { active: 6, rested: 0 }, { opp: [V9.c4, V9.c5] });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });
});
