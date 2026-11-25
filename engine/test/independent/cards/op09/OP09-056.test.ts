/**
 * OP09-056 Mr.3(Galdino) (Character, Blue, cost 1, 2000, Counter +1000, {Former Baroque Works}/{Cross Guild}).
 *
 * Card text: "[On Play] Look at 4 cards from the top of your deck; reveal up to 1 "Cross Guild" type card
 * or card with a type including "Baroque Works" other than [Mr.3(Galdino)] and add it to your hand.
 * Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 8-4-4 ("up to"), CR 11-2-1 (reveal), CR 2-4-3-1 (a quoted type matches types that
 * include it), "other than [name]" excludes every card with that name (also a different printing).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  deckTop,
  describeLookBottom,
  E9,
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

const MR3 = 'OP09-056';
const MR3_PRB = 'PRB02-009';

const start = (top: string[]) => {
  const g = mine(L9.neutral, { hand: [MR3], deck: top });
  playId(g, MR3);
  return g;
};

describeLookBottom({
  id: MR3,
  n: 4,
  after: 'main',
  start,
  match: [V9.mr1, V9.mr9],
  multi: V9.croc5,
  excluded: MR3_PRB,
  miss: V9.c4,
});

describe('OP09-056 Mr.3(Galdino): the filter is {Cross Guild} or a type including "Baroque Works", other than [Mr.3(Galdino)]', () => {
  it('offers {Cross Guild} (Richie, the Event Cross Guild), {Baroque Works} and {Former Baroque Works} cards, not other types', () => {
    const g = start(deckTop([V9.richie, V9.mr9, V9.c3, E9.blueEvent, V9.c5]));
    need(g, 'choose', 'p1');
    // Only the top 4 are looked at: the Event is the 4th card, the Kingdew the 5th.
    expect(offeredIds(g)).toEqual([E9.blueEvent, V9.mr9, V9.richie].sort());
  });

  it('a card of another name with the same types is offered (Mr.1 {Former Baroque Works}/{Cross Guild})', () => {
    const g = start(deckTop([V9.mr1, V9.c4, V9.c4, V9.c4]));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.mr1]);
  });

  it('the played Mr.3 is on the field, and the added card goes to hand', () => {
    const g = start(deckTop([V9.mr9, V9.c4, V9.c4, V9.c4, V9.c5]));
    pickCards(g, [V9.mr9]);
    settleOrders(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([V9.mr9]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([MR3]);
  });

  it('there is no trash step: with a card added the hand is exactly that card', () => {
    const g = mine(L9.neutral, {
      hand: [MR3, V9.c2],
      deck: deckTop([V9.mr9, V9.c4, V9.c4, V9.c4]),
    });
    playId(g, MR3);
    pickCards(g, [V9.mr9]);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([V9.c2, V9.mr9].sort());
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });
});
