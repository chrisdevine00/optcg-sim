/** OP10-067 Senor Pink. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  expectDecision,
  game,
  hand,
  KAIDO,
  payDon,
  pick,
  play,
} from './helpers.ts';
import { PLAIN_BLUE } from './helpers-rgl-penel.ts';

/** Purple Events: cost 2 (Sheep's Horn), cost 6 (Conquest of the Sea); Blue Event cost 1 (Desert Spada). */
const P2 = 'OP01-117';
const P6 = 'OP08-077';
const B1 = 'OP01-088';

describe('OP10-067 Senor Pink', () => {
  const start = (trash: string[]) =>
    game(
      { leader: KAIDO, hand: ['OP10-067'], trash, costArea: { active: 5, rested: 2 } },
      { leader: PLAIN_BLUE },
    );

  it('[On Play] DON!! -1: adds a purple Event with a cost of 5 or less from the trash to the hand, then sets 1 DON!! active', () => {
    const g = start([P6, B1, P2]);
    play(g, 'OP10-067');
    accept(g);
    payDon(g);
    // Only the cost-2 purple Event is offered.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'trash', P2)]);
    expect(hand(g, 'p1')).toEqual([P2]);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 5, deck: 4 });
    expectDecision(g, 'main', 'p1');
  });

  it('with no valid Event in the trash the DON!! is still set active ("Then")', () => {
    const g = start([P6, B1]);
    play(g, 'OP10-067');
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(don(g, 'p1').active).toBe(1);
  });

  it('may be declined: nothing is returned or added', () => {
    const g = start([P2]);
    play(g, 'OP10-067');
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(3);
  });
});
