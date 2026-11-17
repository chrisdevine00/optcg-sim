/** EB01-056 Charlotte Flampe: [On Play] add 1 card from the top or bottom of your Life to your hand: draw 1. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  option,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { ENEL, ids } from './helpers-robin.ts';

const FLAMPE = 'EB01-056';

const setup = (life: string[]) =>
  game(
    {
      leader: ENEL,
      hand: [FLAMPE],
      life,
      deck: [PURPLE, BLUE],
      costArea: { active: 1, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );

describe('EB01-056 Charlotte Flampe', () => {
  it('[On Play] top Life card to hand: draw 1', () => {
    const g = setup([V.c1, PURPLE, BLUE]);
    play(g, FLAMPE);
    accept(g);
    option(g, 'top');
    expect(hand(g, 'p1')).toEqual([V.c1, PURPLE]);
    expect(ids(g, 'p1', 'life')).toEqual([PURPLE, BLUE]);
  });

  it('[On Play] bottom Life card to hand: draw 1', () => {
    const g = setup([V.c1, PURPLE, BLUE]);
    play(g, FLAMPE);
    accept(g);
    option(g, 'bottom');
    expect(hand(g, 'p1')).toEqual([BLUE, PURPLE]);
    expect(ids(g, 'p1', 'life')).toEqual([V.c1, PURPLE]);
  });

  it('the cost may be declined: nothing is drawn', () => {
    const g = setup([V.c1]);
    play(g, FLAMPE);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.life('p1')).toBe(1);
    expectDecision(g, 'main', 'p1');
  });

  it('with 0 Life the cost cannot be paid', () => {
    const g = setup([]);
    play(g, FLAMPE);
    expectDecision(g, 'main', 'p1'); // the cost is not even offered
    expect(hand(g, 'p1')).toEqual([]);
  });
});
