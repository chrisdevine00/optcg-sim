/** ST36-004 Bartolomeo. */
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
  PURPLE,
  trash,
} from './helpers.ts';
import { canAccept, offers, SUPERNOVA } from './helpers-stg2.ts';

const ID = 'ST36-004';
const start = (handCards: string[]) =>
  game(
    {
      leader: PLAIN_BLUE,
      hand: [ID, ...handCards],
      deck: [PURPLE, PURPLE, BLUE],
      costArea: { active: 1, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );

describe('ST36-004 Bartolomeo', () => {
  it('[On Play] trash 1 {Supernovas} card from your hand: draw 2 cards', () => {
    const g = start([SUPERNOVA, BLUE]);
    play(g, ID);
    accept(g);
    expect(offers(g)).toEqual([g.find('p1', 'hand', SUPERNOVA)]);
    pick(g, [g.find('p1', 'hand', SUPERNOVA)]);
    expect(trash(g, 'p1')).toEqual([SUPERNOVA]);
    expect(hand(g, 'p1')).toEqual([BLUE, PURPLE, PURPLE]);
    expect(g.zone('p1', 'deck')).toHaveLength(1);
    expectDecision(g, 'main', 'p1');
  });

  it('a hand without a {Supernovas} card cannot pay the cost', () => {
    const g = start([BLUE]);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(canAccept(g)).toBe(false);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('the cost may be declined: no card is trashed or drawn', () => {
    const g = start([SUPERNOVA]);
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([SUPERNOVA]);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('draws exactly 2, not 1 per trashed card or 3', () => {
    const g = start([SUPERNOVA, SUPERNOVA]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', SUPERNOVA)]);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('with a deck of 1 card it draws that card (it cannot draw 2)', () => {
    const g = game(
      {
        leader: PLAIN_BLUE,
        hand: [ID, SUPERNOVA],
        deck: [BLUE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', SUPERNOVA)]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });
});
