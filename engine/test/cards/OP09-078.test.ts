/** OP09-078 Gum-Gum Giant. [Counter] DON!! -2, trash 1: Straw Hat Crew Leader gives +4000, then draw 2. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  hand,
  PLAIN_PURPLE,
  passBlock,
  payDon,
  pick,
  PURPLE,
} from './helpers.ts';
import { ids, oppTurn, ROBIN } from './helpers-robin.ts';

const EV = 'OP09-078';
const counter = (leader: string, handCards: string[], characters: string[] = []) => {
  const g = oppTurn({
    leader,
    hand: handCards,
    characters,
    costArea: { active: 4, rested: 0 },
    deck: [PURPLE, PURPLE, PURPLE, BLUE],
  });
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', 'OP01-092'),
    target: g.leader('p1'),
  });
  passBlock(g);
  g.act({ type: 'activate', card: g.find('p1', 'hand', EV), ability: 'counter' });
  return g;
};

describe('OP09-078 Gum-Gum Giant', () => {
  it('with a Straw Hat Crew Leader: DON!! -2 and trash 1, +4000 power this battle, then draw 2', () => {
    const g = counter(ROBIN, [EV, BLUE]);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(hand(g, 'p1')).toEqual([PURPLE, PURPLE]);
    expect(ids(g, 'p1', 'trash').sort()).toEqual([BLUE, EV].sort());
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('a non-Straw Hat Crew Leader: the costs are paid but there is neither the boost nor the draw (CR 4-10-1)', () => {
    const g = counter(PLAIN_PURPLE, [EV, BLUE]);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g, 'p1')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('the cost may be declined: no effect, nothing is paid', () => {
    const g = counter(ROBIN, [EV, BLUE]);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(don(g, 'p1').deck).toBe(6);
  });

  it('the boost may go to a Character instead of the Leader', () => {
    const g = counter(ROBIN, [EV, BLUE], [PURPLE]);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    const c = g.find('p1', 'characters', PURPLE);
    pick(g, [c]);
    expect(g.power(c)).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expectDecision(g, 'counter', 'p1');
  });
});
