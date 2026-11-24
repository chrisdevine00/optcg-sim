/** OP17-066 Kurozumi Orochi. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  game,
  hand,
  payDon,
  PLAIN_BLUE,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import { OTHER_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-066';
const COST10 = 'P-041';

describe('OP17-066 Kurozumi Orochi', () => {
  const start = (characters: string[]) =>
    game(
      {
        leader: OTHER_LEADER,
        hand: [ID, V.c1],
        characters,
        deck: [BLUE, V.c2, V.c3, V.c4],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );

  it('[On Play] DON!! -1: with a Character with a cost of 10 or more, draw 2 cards and trash 1 card from your hand', () => {
    const g = start([COST10]);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1, deck: 8 });
    // Hand: V.c1 plus the two drawn cards; trash any 1.
    expect(hand(g, 'p1')).toHaveLength(3);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([BLUE, V.c2]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('may trash a card just drawn', () => {
    const g = start([COST10]);
    play(g, ID);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c1, BLUE]);
  });

  it('with no Character with a cost of 10 or more the DON!! is still returned (cost) but nothing is drawn', () => {
    const g = start([V.c7]);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(8);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('the cost is optional: declining returns no DON!! and draws nothing', () => {
    const g = start([COST10]);
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, deck: 7 });
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('a Character with a cost of 8 does not count', () => {
    const g = start(['EB02-004']);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('a Character with a cost of 9 does not count (the threshold is 10, not 9)', () => {
    const g = start(['OP01-070']); // Dracule Mihawk, cost 9
    play(g, ID);
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([]);
  });
});
