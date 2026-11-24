/** OP16-092 Nico Robin. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { COST8, names } from './helpers-op16g4.ts';

const ID = 'OP16-092';
const BIG12 = 'P-041'; // Purple Character, cost 10
const EVENT8 = 'OP16-116'; // an Event with cost 8: not a Character card

const start = (h: string[]) =>
  game(
    {
      leader: PLAIN_BLUE,
      hand: [ID, ...h],
      deck: [V.c1, V.c2, V.c3, V.c4],
      costArea: { active: 1, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );

describe('OP16-092 Nico Robin', () => {
  it('[On Play] trash a Character with cost 8 or more from hand: draw 2', () => {
    const g = start([COST8]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', COST8)]);
    expect(trash(g, 'p1')).toEqual([COST8]);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
  });

  it('cost 10 qualifies as "8 or more"', () => {
    const g = start([BIG12]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BIG12)]);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('must not fire: a cost 7 Character or a cost 8 Event cannot pay the cost', () => {
    const g = start([V.c7, EVENT8]);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(hand(g, 'p1')).toEqual([V.c7, EVENT8]);
    expect(names(g, 'p1', 'deck')).toHaveLength(4);
  });

  it('declining keeps the card and draws nothing', () => {
    const g = start([COST8]);
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([COST8]);
    expect(trash(g, 'p1')).toEqual([]);
  });
});
