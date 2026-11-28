/** OP18-020 Stop Fighting!!! OP-18 wave G4. */
import { describe, expect, it } from 'vitest';
import { accept, decline, hand, V } from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { VIVI_LEADER } from './helpers-op18-w2.ts';
import { PLAIN_PURPLE } from './helpers-op18.ts';

const ID = 'OP18-020';
const step = (leader = VIVI_LEADER, life = [V.c1, V.c2]) =>
  counterStep(
    { leader, hand: [ID], life, costArea: { active: 1, rested: 0 } },
    { characters: [V.c3] },
  );

describe('OP18-020 Stop Fighting!!!', () => {
  it('[Counter] with a [Nefeltari Vivi] Leader: all Life to hand, opponent Leader and Characters −5000', () => {
    const g = step();
    useCounter(g, ID);
    accept(g);
    expect(g.zone('p1', 'life')).toEqual([]);
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
    expect(g.power(g.leader('p2'))).toBe(0);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(0);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(4000);
  });

  it('with another Leader the Life cards still go to the hand, and nothing else happens', () => {
    const g = step(PLAIN_PURPLE);
    useCounter(g, ID);
    accept(g);
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('declining the cost keeps the Life cards and does nothing', () => {
    const g = step();
    useCounter(g, ID);
    decline(g);
    expect(g.zone('p1', 'life')).toHaveLength(2);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('with no Life cards the cost is still paid and the effect resolves (M6b-Q97)', () => {
    const g = step(VIVI_LEADER, []);
    useCounter(g, ID);
    accept(g);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(4000);
  });
});
