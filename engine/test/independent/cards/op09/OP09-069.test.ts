/**
 * OP09-069 Trafalgar Law (Character, Purple, cost 1, 2000, Counter +1000, {Heart Pirates}).
 *
 * Card text: "[On Play] Look at 4 cards from the top of your deck; reveal up to 1 "Straw Hat Crew" or
 * "Heart Pirates" type card with a cost of 2 or more and add it to your hand. Then, place the rest
 * at the bottom of your deck in any order."
 *
 * Rules: CR 8-4-4 ("up to"), CR 11-2-1 (reveal), CR 2-4-3-1 (quoted types match types that include
 * them). The cost filter is "2 or more": a cost-1 card of the right type is not eligible.
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  deckTop,
  describeLookBottom,
  hand,
  L9,
  mine,
  need,
  offeredIds,
  pickCards,
  playId,
  settleOrders,
  V9,
} from './kit-op09b.ts';

const LAW = 'OP09-069';

const start = (top: string[]) => {
  const g = mine(L9.neutral, { hand: [LAW], deck: top });
  playId(g, LAW);
  return g;
};

describeLookBottom({
  id: LAW,
  n: 4,
  after: 'main',
  start,
  match: [V9.shc2, V9.heart4],
  multi: V9.shc3,
  miss: V9.c5,
});

describe('OP09-069 Trafalgar Law: {Straw Hat Crew} or {Heart Pirates} with cost 2 or more', () => {
  it('boundary: cost 1 cards of both types (Sunny-Kun, Bepo) are not offered; cost 2 and above are', () => {
    const g = start(deckTop([V9.c1, V9.heart1, V9.shc2, V9.heart4, V9.shc3]));
    need(g, 'choose', 'p1');
    // Only the top 4 are looked at (the cost 3 {Straw Hat Crew} card is the 5th).
    expect(offeredIds(g)).toEqual([V9.shc2, V9.heart4].sort());
  });

  it('with only cost-1 cards of the right types in the top 4 nothing qualifies (the pick is still asked, max 0)', () => {
    const g = start(deckTop([V9.c1, V9.heart1, V9.c5, V9.c6, V9.shc2]));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
  });

  it('a card of another type with a high cost (Kingdew {Whitebeard Pirates}) is not offered', () => {
    const g = start(deckTop([V9.c5, V9.c6, V9.c7, V9.heart4]));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.heart4]);
  });

  it('Law himself (cost 1, {Heart Pirates}) in the deck would not qualify either', () => {
    const g = start(deckTop([LAW, V9.c5, V9.c6, V9.c7]));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
  });

  it('the picked card goes to hand, there is no trash step, and Law stays on the field', () => {
    const g = start(deckTop([V9.heart4, V9.c5, V9.c6, V9.c7, V9.c8]));
    pickCards(g, [V9.heart4]);
    settleOrders(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([V9.heart4]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([LAW]);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });
});
