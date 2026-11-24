/**
 * OP15-105 Jewelry Bonney (Character, Yellow, cost 1, 2000, Counter +2000, {Bonney Pirates}/{Supernovas}).
 *
 * Card text: "If your Character with 7000 base power or less would be removed from the field by your
 * opponent's effect, you may add 1 card from the top of your Life cards to your hand instead."
 *
 * Rules relied on: CR 8-1-3-4 / RL-31 (optional; impossible with 0 Life, QA-OP12 OP12-061),
 * RL-15, CR 10-2-1-1, RD 104 (Life moved outside damage never activates [Trigger]).
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  at,
  chars,
  describeReplace7000,
  hand,
  koEffect,
  LD15,
  lifeCards,
  offered,
  SC15,
  theirsWith,
  trash,
  BLUE,
} from './kit-op15c.ts';

describeReplace7000({ id: 'OP15-105', cost: 'life' });

describe('OP15-105 Jewelry Bonney: the Life card taken', () => {
  it('it is the TOP Life card that goes to hand, and a [Trigger] on it does not activate', () => {
    const g = theirsWith(LD15.neutral, {
      characters: ['OP15-105', SC15.lola],
      life: [SC15.speed, BLUE, BLUE, BLUE],
    });
    koEffect(g, at(g, 'p1', 'characters', SC15.lola));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(hand(g)).toEqual([SC15.speed]);
    expect(chars(g)).toEqual(['OP15-105', SC15.lola].sort());
    expect(lifeCards(g)).toEqual([BLUE, BLUE, BLUE]);
    expect(trash(g)).toEqual([]);
  });

  it('with exactly 1 Life card it can still be used (Life becomes 0, no game loss)', () => {
    const g = theirsWith(LD15.neutral, {
      characters: ['OP15-105', SC15.lola],
      life: [BLUE],
    });
    koEffect(g, at(g, 'p1', 'characters', SC15.lola));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(g.life('p1')).toBe(0);
    expect(chars(g)).toContain(SC15.lola);
  });
});
