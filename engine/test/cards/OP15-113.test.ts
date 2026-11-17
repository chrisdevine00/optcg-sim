/** OP15-113 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
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
import { HANCOCK } from './helpers-hancock-rosi.ts';

describe('OP15-113 Roronoa Zoro', () => {
  const start = (handCards: string[]) => {
    const g = game(
      {
        leader: HANCOCK,
        hand: ['OP15-113', ...handCards],
        deck: [V.c1, BLUE],
        costArea: { active: 4, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP15-113');
    return g;
  };

  it('[On Play] trash 1 card from hand: adds the top card of your deck to the top of your Life', () => {
    const g = start([BLUE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    accept(g);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p1', 'life').map((c) => c.card)[0]).toBe(V.c1);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'deck')).toHaveLength(1);
  });

  it('the cost may be declined: nothing is trashed or added', () => {
    const g = start([BLUE]);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.life('p1')).toBe(3);
  });

  it('the Life card may be declined ("up to 1") after the cost is paid', () => {
    const g = start([BLUE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    decline(g);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(g.life('p1')).toBe(3);
  });

  it('cannot be used with no other card in hand', () => {
    const g = start([]);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });
});
