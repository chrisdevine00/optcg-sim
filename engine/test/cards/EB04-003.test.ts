/** EB04-003 Smoker & Tashigi. */
import { describe, expect, it } from 'vitest';
import { play } from './helpers.ts';
import { boost } from './helpers-op15g1.ts';
import { at, canAttack, MINK1, mk, NAVY_LEADER, oppTurn, RED_LEADER, V } from './helpers-eb04g1.ts';

const ID = 'EB04-003';

describe('EB04-003 Smoker & Tashigi', () => {
  it("[Opponent's Turn]: your {Navy} Leader's base power becomes 7000 (5000 printed)", () => {
    const g = mk({ leader: NAVY_LEADER, characters: [ID] }, {}, oppTurn);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('on your own turn the Leader stays at its printed 5000', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [ID] });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Leader that is not {Navy} is unchanged', () => {
    const g = mk({ leader: RED_LEADER, characters: [ID] }, {}, oppTurn);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it is the BASE power that changes: a +1000 effect still adds on top (8000)', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [ID] }, {}, oppTurn);
    boost(g, g.leader('p1'), 1000, 4);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('without this Character the Leader is 5000; the effect ends when it leaves the field', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [MINK1] }, {}, oppTurn);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('prints [Rush]: a Character played this turn can attack at once', () => {
    const g = mk({ leader: NAVY_LEADER, hand: [ID] }, { characters: [V.c1] });
    play(g, ID);
    expect(canAttack(g, at(g, 'p1', 'characters', ID), g.leader('p2'))).toBe(true);
  });
});
