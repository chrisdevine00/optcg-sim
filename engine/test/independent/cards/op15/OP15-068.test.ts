/**
 * OP15-068 Heavenly Warriors (Character, Purple, cost 1, 1000, Counter +1000, {Sky Island}).
 *
 * Card text: "If you have 6 or less DON!! cards on your field, this Character gains [Blocker]."
 *
 * Rules: CR 8-3-3 (condition checked continuously), "DON!! cards on your field" = cost area plus DON!!
 * given to Leader and Characters (rules-digest 86), CR 10-1-4 ([Blocker]: one blocker per battle, rest to
 * block), CR 6-4-1 (the DON!! Phase adds 2 DON!!).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passCounter } from '../../helpers.ts';
import {
  at,
  block,
  BLUE,
  donOnField,
  inst,
  kws,
  LD15,
  mine,
  RED,
  SCN,
  side,
  theirTurn,
  theirs,
  toMyNextMain,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const HW = 'OP15-068';
const hw = (g: TestGame) => at(g, 'p1', 'characters', HW);

function defend(donActive: number, extra: { given?: number } = {}): TestGame {
  return theirs(
    LD15.purple,
    {
      characters: [{ card: HW, ...(extra.given ? { don: extra.given } : {}) }],
      costArea: { active: donActive, rested: 0 },
    },
    { characters: [SCN.c3] },
  );
}

describe('OP15-068 Heavenly Warriors: with 6 or less DON!! on my field it gains [Blocker]', () => {
  it('6 DON!! on my field (boundary): has [Blocker] and may block', () => {
    const g = defend(6);
    expect(kws(g, hw(g))).toContain('Blocker');
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([hw(g)]);
  });

  it('7 DON!! on my field (boundary): no [Blocker]', () => {
    const g = defend(7);
    expect(kws(g, hw(g))).not.toContain('Blocker');
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('0 DON!!: has [Blocker]', () => {
    const g = defend(0);
    expect(kws(g, hw(g))).toContain('Blocker');
  });

  it('given DON!! count as DON!! on my field: 6 in the cost area plus 1 given is 7, so no [Blocker]', () => {
    const g = defend(6, { given: 1 });
    expect(donOnField(g)).toBe(7);
    expect(kws(g, hw(g))).not.toContain('Blocker');
  });

  it('5 in the cost area plus 1 given is 6: [Blocker]', () => {
    const g = defend(5, { given: 1 });
    expect(donOnField(g)).toBe(6);
    expect(kws(g, hw(g))).toContain('Blocker');
  });

  it('the opponent’s DON!! do not count: 10 opposing DON!! and 3 of mine still give [Blocker]', () => {
    const g = theirTurn(
      side(LD15.purple, BLUE, { characters: [HW], costArea: { active: 3, rested: 0 } }),
      side(LD15.neutral, RED, { characters: [SCN.c3], costArea: { active: 10, rested: 0 } }),
    );
    expect(kws(g, hw(g))).toContain('Blocker');
  });

  it('blocking rests it, the Leader takes no damage, and the 5000 attacker K.O.s the 1000 blocker', () => {
    const g = defend(3);
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    block(g, hw(g));
    expect(g.card(hw(g)).rested).toBe(true);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([HW]);
  });

  it('it follows the count: 5 DON!! now, 7 after my next DON!! Phase, so the [Blocker] is lost', () => {
    const g = mine(LD15.purple, { characters: [HW], costArea: { active: 5, rested: 0 } });
    expect(kws(g, hw(g))).toContain('Blocker');
    toMyNextMain(g);
    expect(donOnField(g)).toBe(7);
    expect(kws(g, hw(g))).not.toContain('Blocker');
  });

  it('and it comes back when the count drops to 6 or less', () => {
    const g = mine(LD15.purple, { characters: [HW], costArea: { active: 6, rested: 1 } });
    expect(kws(g, hw(g))).not.toContain('Blocker');
    const low = mine(LD15.purple, { characters: [HW], costArea: { active: 3, rested: 3 } });
    expect(kws(low, hw(low))).toContain('Blocker');
  });

  it('must not: another Character of mine does not gain [Blocker] from it', () => {
    const g = theirs(
      LD15.purple,
      { characters: [HW, SCN.c3], costArea: { active: 3, rested: 0 } },
      { characters: [SCN.c4] },
    );
    expect(kws(g, at(g, 'p1', 'characters', SCN.c3))).not.toContain('Blocker');
    attack(g, inst(g, 'p2', 'characters', SCN.c4), g.leader('p1'));
    expect(blockers(g)).toEqual([hw(g)]);
  });
});
