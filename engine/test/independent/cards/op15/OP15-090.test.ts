/**
 * OP15-090 Perona (Character, Black, cost 1, 2000, Counter +2000, {Thriller Bark Pirates}).
 *
 * Card text: "If your Character with 7000 base power or less would be removed from the field by your
 * opponent's effect, you may trash 1 card from your hand instead."
 *
 * Rules relied on: CR 8-1-3-4 / RL-31 (optional replacement, impossible replacement cannot be
 * applied), RL-15 (removal covers K.O., return to hand, bottom of deck), CR 10-2-1-1 (a battle K.O.
 * is not an effect), CR 4-9-2 (base power is the printed power).
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  at,
  describeReplace7000,
  hand,
  koEffect,
  LD15,
  need,
  offered,
  pickAny,
  SC15,
  theirsWith,
  trash,
} from './kit-op15c.ts';

describeReplace7000({ id: 'OP15-090', cost: 'hand' });

describe('OP15-090 Perona: the cost is a card from hand of my choice', () => {
  it('I choose which card to trash; the other stays in hand', () => {
    const g = theirsWith(LD15.neutral, {
      characters: ['OP15-090', SC15.lola],
      hand: [SC15.red3, SC15.red2],
    });
    koEffect(g, at(g, 'p1', 'characters', SC15.lola));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    need(g, 'choose', 'p1');
    pickAny(g, [SC15.red2]);
    expect(trash(g)).toEqual([SC15.red2]);
    expect(hand(g)).toEqual([SC15.red3]);
  });
});
