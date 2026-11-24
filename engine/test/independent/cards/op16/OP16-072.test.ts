/**
 * OP16-072 Hannyabal (Character, Purple, cost 2, 3000, Counter +1000, {Impel Down}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 {Impel Down} type card
 * and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 11-3 (looking at the deck), CR 11-2-1 (a card moved from the deck to hand is revealed),
 * CR 8-4-4-2 (may choose none), CR 3-1-7 (order), CR 2-4-3 ({Type} is exact), CR 8-4-4-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import {
  describeLookAdd,
  backAtMain,
  BLUE,
  deck,
  fill,
  hand,
  hasEvent,
  ID,
  inst,
  LDR,
  mine,
  need,
  offeredNow,
  pickCards,
  put,
  settleOrders,
  SCN,
  none,
} from './kit-op16b.ts';

const HANNY = 'OP16-072';
/** OP16-057 Captain Buggy's Our Savior!!: an Event of type {Impel Down}. */
const ID_EVENT = 'OP16-057';

describeLookAdd({
  id: HANNY,
  title: '[On Play] look at 5, reveal up to 1 {Impel Down}',
  n: 5,
  leader: LDR.luffy,
  match: [ID.blugori, ID.sphinx],
  miss: SCN.c3,
  beyond: ID.blugori,
});

describe('OP16-072 Hannyabal: further checks', () => {
  const start = (top: string[]) => {
    const g = mine(LDR.luffy, { hand: [HANNY], deck: [...top, ...fill(BLUE, 8)] });
    put(g, HANNY);
    return g;
  };

  it('"{Impel Down} type card" is any category: an {Impel Down} Event is offered as well as Characters', () => {
    const g = start([ID_EVENT, ID.sphinx, SCN.c3, SCN.c4, SCN.c5]);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([ID_EVENT, ID.sphinx].sort());
    pickCards(g, [ID_EVENT]);
    settleOrders(g);
    expect(hand(g)).toEqual([ID_EVENT]);
  });

  it('a card whose types merely include other words is not enough: a Navy-only card is not offered', () => {
    const g = start([SCN.c3, 'OP16-066', SCN.c4, SCN.c5, SCN.c6]);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([]);
  });

  it('the added card is revealed (CR 11-2-1)', () => {
    const g = start([ID.sphinx, SCN.c3, SCN.c4, SCN.c5, SCN.c6]);
    pickCards(g, [ID.sphinx]);
    settleOrders(g);
    expect(hasEvent(g, 'CardRevealed', { card: ID.sphinx })).toBe(true);
    expect(backAtMain(g)).toBe(true);
  });

  it('a Hannyabal already on the field does nothing', () => {
    const g = mine(LDR.luffy, { characters: [HANNY], deck: [ID.sphinx, ...fill(BLUE, 14)] });
    expect(deck(g)[0]).toBe(ID.sphinx);
    expect(hand(g)).toEqual([]);
    void inst;
    void none;
  });
});
