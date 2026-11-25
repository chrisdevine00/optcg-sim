/**
 * OP10-009 Smiley (Character, Red, cost 5, 6000, Counter +1000, {Biological Weapon}/{Punk Hazard}).
 *
 * Card text: "[On Play] If your Leader has the "Punk Hazard" type, give up to 1 of your opponent's
 * Characters -3000 power during this turn."
 *
 * Rules: the "If" has no colon: an effect condition on my Leader's types. "Up to 1" may be none. A
 * -3000 "during this turn" lasts to the end of this turn (RL-09), is a current-power change, and
 * only Characters (not the Leader) can be chosen.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  cardIds,
  endTurn,
  kind,
  mine,
  need,
  none,
  noDefence,
  offeredIds,
  pickCards,
  playRaw,
  V10,
  VAN,
} from './kit-op10a.ts';

const SMILEY = 'OP10-009';
/** OP10-002 Caesar Clown: Leader, {Punk Hazard}/{Scientist}. [DON!! x2][When Attacking] only. */
const PH_LEADER = 'OP10-002';
/** OP10-001 Smoker: Leader, {Navy}/{Punk Hazard}. */
const PH_LEADER_2 = 'OP10-001';

function start(leader: string, opp: Parameters<typeof mine>[2]) {
  const g = mine(leader, { hand: [SMILEY] }, opp);
  playRaw(g, SMILEY);
  return g;
}

describe('OP10-009 Smiley: [On Play] with a {Punk Hazard} Leader, give up to 1 opposing Character -3000 power this turn', () => {
  it('printed values: cost 5, 6000, Counter +1000', () => {
    const g = mine('ST01-001', { hand: [SMILEY] });
    const c = g.find('p1', 'hand', SMILEY);
    expect(g.card(c).cost).toBe(5);
    expect(g.card(c).counter).toBe(1000);
    expect(g.power(c)).toBe(6000);
  });

  it('with a {Punk Hazard} Leader the chosen opposing Character gets -3000 power', () => {
    const g = start(PH_LEADER, { characters: [VAN.kingdew, VAN.sai] });
    need(g, 'choose', 'p1');
    pickCards(g, [VAN.kingdew]);
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(4000);
    expect(g.power(at(g, 'p2', 'characters', VAN.sai))).toBe(4000);
    expect(kind(g)).toBe('main');
  });

  it('a Leader that has {Punk Hazard} as one of two types also qualifies', () => {
    const g = start(PH_LEADER_2, { characters: [VAN.kingdew] });
    need(g, 'choose', 'p1');
    pickCards(g, [VAN.kingdew]);
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(4000);
  });

  it('boundary: without the {Punk Hazard} type on the Leader nothing is asked and nothing changes', () => {
    const g = start('ST01-001', { characters: [VAN.kingdew] });
    expect(kind(g)).toBe('main');
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(7000);
  });

  it("only the Leader's types count: a {Punk Hazard} Character on my field does not enable it", () => {
    const g = mine(
      'ST01-001',
      { hand: [SMILEY], characters: [V10.mochaPh4] },
      { characters: [VAN.kingdew] },
    );
    playRaw(g, SMILEY);
    expect(kind(g)).toBe('main');
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(7000);
  });

  it('only opposing Characters are offered: not my own Characters, not either Leader', () => {
    const g = mine(
      PH_LEADER,
      { hand: [SMILEY], characters: [VAN.marco] },
      { characters: [VAN.kingdew, VAN.sai] },
    );
    playRaw(g, SMILEY);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VAN.kingdew, VAN.sai].sort());
  });

  it('"up to 1": may choose nobody', () => {
    const g = start(PH_LEADER, { characters: [VAN.kingdew] });
    none(g);
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(7000);
  });

  it('the -3000 matters in battle this turn: a 5000 attacker K.O.s the weakened 7000 Character', () => {
    const g = mine(
      PH_LEADER,
      { hand: [SMILEY], characters: [VAN.marco] },
      { characters: [{ card: VAN.kingdew, rested: true }] },
    );
    playRaw(g, SMILEY);
    pickCards(g, [VAN.kingdew]);
    attack(g, at(g, 'p1', 'characters', VAN.marco), at(g, 'p2', 'characters', VAN.kingdew));
    noDefence(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
  });

  it('"during this turn": the power is back at the start of the opponent\'s turn', () => {
    const g = start(PH_LEADER, { characters: [VAN.kingdew] });
    pickCards(g, [VAN.kingdew]);
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(4000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(7000);
  });

  it('with no opposing Character nothing is changed', () => {
    const g = start(PH_LEADER, {});
    if (kind(g) === 'choose') none(g);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toEqual([SMILEY]);
  });
});
