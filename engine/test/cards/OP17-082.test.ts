/** OP17-082 Sanji. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { expectBigCondition } from './helpers-sabo.ts';

describe('OP17-082 Sanji', () => {
  it('+3000 power while a Character with a cost of 12 or more exists', () => {
    expectBigCondition('OP17-082', (g, id) => g.power(id), 2000, 5000);
  });

  it('[On Play]: draw 2, then trash 2 cards from your hand (the drawn cards may be chosen)', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP17-082', V.c1, V.c2],
        deck: [PURPLE, BLUE, BLUE],
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP17-082');
    expect(hand(g, 'p1')).toHaveLength(4);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', PURPLE), g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1').sort()).toEqual([PURPLE, V.c1].sort());
    expect(hand(g, 'p1').sort()).toEqual([BLUE, V.c2].sort());
  });
});
