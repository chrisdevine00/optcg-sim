/**
 * OP17-002 Atmos (Character, Red, cost 4, 6000, no Counter, {Whitebeard Pirates}).
 *
 * Card text: "[Opponent's Turn] This Character gains +3000 power."
 *
 * Rules: CR 8-3-2-5 / 10-2-12-1 ([Opponent's Turn] is a condition that holds on the opponent's
 * turn), CR 6-5-5-2 (given DON!! add power only on their owner's turn), CR 7-1-4 (the attacker wins
 * the Damage Step when its power is equal or higher).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  attack,
  BLUE,
  charsOf,
  cp,
  endTurn,
  expectMain,
  lp,
  LD,
  mine,
  noDefence,
  theirs,
  WB,
} from './kit-op17a.ts';

const ATMOS = 'OP17-002';

/** p2's turn; p1 has a rested Atmos (optionally with DON!! given). */
function opp(chars: string[] = [], atmos: { don?: number } = {}) {
  return theirs(
    LD.luffy,
    { characters: [{ card: ATMOS, rested: true, ...atmos }], life: fill(BLUE, 4) },
    { characters: chars },
  );
}

describe('OP17-002 Atmos: [Opponent’s Turn] +3000 power', () => {
  it('has its printed 6000 power on my own turn', () => {
    const g = mine(LD.luffy, { characters: [ATMOS] });
    expect(cp(g, 'p1', ATMOS)).toBe(6000);
  });

  it('has 9000 power during the opponent’s turn', () => {
    expect(cp(opp(), 'p1', ATMOS)).toBe(9000);
  });

  it('boundary: an 8000 attacker does not K.O. the rested 9000 Atmos', () => {
    const g = opp([WB.thatch]);
    attack(g, g.find('p2', 'characters', WB.thatch), g.find('p1', 'characters', ATMOS));
    noDefence(g);
    expect(charsOf(g, 'p1')).toEqual([ATMOS]);
  });

  it('boundary: a 9000 attacker ties and K.O.s it (equal power wins for the attacker)', () => {
    const g = opp([WB.littleOars]);
    attack(g, g.find('p2', 'characters', WB.littleOars), g.find('p1', 'characters', ATMOS));
    noDefence(g);
    expect(charsOf(g, 'p1')).toEqual([]);
  });

  it('control: the same 8000 attack K.O.s a plain 6000 rested Character, so the bonus is what saves Atmos', () => {
    const g = theirs(
      LD.luffy,
      { characters: [{ card: WB.jil, rested: true }] },
      { characters: [WB.thatch] },
    );
    attack(g, g.find('p2', 'characters', WB.thatch), g.find('p1', 'characters', WB.jil));
    noDefence(g);
    expect(charsOf(g, 'p1')).toEqual([]);
  });

  it('the bonus goes away again on my own turn', () => {
    const g = opp();
    endTurn(g);
    expectMain(g, 'p1');
    expect(cp(g, 'p1', ATMOS)).toBe(6000);
  });

  it('CR 6-5-5-2: a DON!! given on my turn adds no power on the opponent’s turn (6000 + 3000 only)', () => {
    expect(cp(opp([], { don: 1 }), 'p1', ATMOS)).toBe(9000);
  });

  it('CR 6-5-5-2: on my own turn the given DON!! does count (7000, no [Opponent’s Turn] bonus)', () => {
    const g = mine(LD.luffy, {
      characters: [{ card: ATMOS, don: 1 }],
      costArea: { active: 9, rested: 0 },
    });
    expect(cp(g, 'p1', ATMOS)).toBe(7000);
  });

  it('only this Character gains it: my Leader and another Character stay at their own power', () => {
    const g = theirs(LD.luffy, { characters: [ATMOS, WB.jil] }, {});
    expect(lp(g, 'p1')).toBe(5000);
    expect(cp(g, 'p1', WB.jil)).toBe(6000);
  });

  it('two copies each gain +3000', () => {
    const g = theirs(LD.luffy, { characters: [ATMOS, ATMOS] }, {});
    expect(cp(g, 'p1', ATMOS, 0)).toBe(9000);
    expect(cp(g, 'p1', ATMOS, 1)).toBe(9000);
  });

  it('"Opponent’s Turn" is relative to the owner: the opposing Atmos is 9000 on my turn and 6000 on its own', () => {
    const g = mine(LD.luffy, {}, { characters: [ATMOS] });
    expect(cp(g, 'p2', ATMOS)).toBe(9000);
    endTurn(g);
    expect(cp(g, 'p2', ATMOS)).toBe(6000);
  });
});
