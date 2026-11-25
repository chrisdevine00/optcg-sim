/**
 * OP10-015 Mocha (Character, Red, cost 3, 3000, Counter +2000, {Punk Hazard}).
 *
 * Card text: "[On Play] Give up to 1 of your opponent's Characters -1000 power during this turn."
 *
 * Rules: "up to 1" may be none; only opposing Characters; the change is to current power and ends
 * with the turn (RL-09); it is not applied to the Leader.
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
  VAN,
} from './kit-op10a.ts';

const MOCHA = 'OP10-015';

function start(opp: Parameters<typeof mine>[2], mineSpec: Parameters<typeof mine>[1] = {}) {
  const g = mine('ST01-001', { hand: [MOCHA], ...mineSpec }, opp);
  playRaw(g, MOCHA);
  return g;
}

describe('OP10-015 Mocha: [On Play] give up to 1 opposing Character -1000 power during this turn', () => {
  it('printed values: cost 3, 3000, Counter +2000', () => {
    const g = mine('ST01-001', { hand: [MOCHA] });
    const c = g.find('p1', 'hand', MOCHA);
    expect(g.card(c).cost).toBe(3);
    expect(g.card(c).counter).toBe(2000);
    expect(g.power(c)).toBe(3000);
  });

  it('the chosen opposing Character gets -1000 power', () => {
    const g = start({ characters: [VAN.kingdew, VAN.marco] });
    need(g, 'choose', 'p1');
    pickCards(g, [VAN.kingdew]);
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(6000);
    expect(g.power(at(g, 'p2', 'characters', VAN.marco))).toBe(5000);
    expect(kind(g)).toBe('main');
  });

  it('only one Character is affected', () => {
    const g = start({ characters: [VAN.kingdew, VAN.kingdew] });
    pickCards(g, [VAN.kingdew]);
    const powers = [0, 1].map((n) => g.power(at(g, 'p2', 'characters', VAN.kingdew, n)));
    expect(powers.sort()).toEqual([6000, 7000]);
  });

  it('only opposing Characters are offered: not my own Characters, not a Leader', () => {
    const g = start({ characters: [VAN.kingdew, VAN.sai] }, { characters: [VAN.marco] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VAN.kingdew, VAN.sai].sort());
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('"up to 1": may choose nobody', () => {
    const g = start({ characters: [VAN.kingdew] });
    none(g);
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(7000);
  });

  it('boundary in battle this turn: a 4000 attacker K.O.s a rested 5000 Character weakened to 4000, but not an untouched one', () => {
    const g = mine(
      'ST01-001',
      { hand: [MOCHA], characters: [VAN.sai, VAN.sai] },
      {
        characters: [
          { card: VAN.marco, rested: true },
          { card: VAN.marco, rested: true },
        ],
      },
    );
    playRaw(g, MOCHA);
    pickCards(g, [VAN.marco]);
    const weakened = [0, 1].find((n) => g.power(at(g, 'p2', 'characters', VAN.marco, n)) === 4000)!;
    const intact = 1 - weakened;
    attack(g, at(g, 'p1', 'characters', VAN.sai, 0), at(g, 'p2', 'characters', VAN.marco, intact));
    noDefence(g);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
    attack(
      g,
      at(g, 'p1', 'characters', VAN.sai, 1),
      at(g, 'p2', 'characters', VAN.marco, weakened),
    );
    noDefence(g);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(1);
  });

  it('"during this turn": the power is back when the opponent\'s turn starts', () => {
    const g = start({ characters: [VAN.kingdew] });
    pickCards(g, [VAN.kingdew]);
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(6000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(7000);
  });

  it('with no opposing Character nothing happens and the game continues', () => {
    const g = start({});
    if (kind(g) === 'choose') none(g);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toEqual([MOCHA]);
  });

  it('must not happen: the effect is [On Play] only, so a Mocha already on the field gives nothing', () => {
    const g = mine('ST01-001', { characters: [MOCHA] }, { characters: [VAN.kingdew] });
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(7000);
    expect(kind(g)).toBe('main');
  });
});
