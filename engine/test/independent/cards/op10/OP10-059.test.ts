/**
 * OP10-059 Fo...llow...Me...and...I...Will...Gui...de...You (Event, Blue, cost 1, {Straw Hat Crew}/
 * {Dressrosa}).
 *
 * Card text: "[Main] Look at 5 cards from the top of your deck; reveal up to 1 {Dressrosa} type
 * Character card and add it to your hand. Then, place the rest at the bottom of your deck in any
 * order.
 * [Trigger] Activate this card's [Main] effect."
 *
 * Rules: CR 8-4-4 ("look at", "up to"), CR 11-2-1 (reveal), CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  askedEmpty,
  atMain,
  BLUE,
  declineTrigger,
  deck,
  deckTop,
  describeLook,
  hand,
  hitLeader,
  LD10,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playId,
  SC10,
  settleOrders,
  tail,
  theirs,
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-059';

function start(top: string[]) {
  const g = mine(LD10.neutral, { hand: [ID], deck: top });
  playId(g, ID);
  return g;
}

describeLook({
  id: ID,
  n: 5,
  main: 'p1',
  rest: 'bottom',
  start,
  match: [SC10.dr3, SC10.dr5],
  multi: SC10.sn6dr, // {Beautiful Pirates}/{Supernovas}/{Dressrosa}
  miss: SC10.c2,
});

describe('OP10-059 further checks', () => {
  it('only Characters: a {Dressrosa} Event (another copy of this card) is not offered', () => {
    const g = start([ID, SC10.dr3, SC10.c2, SC10.c2, SC10.c2, ...deckTop([]).slice(0, 8)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC10.dr3]);
  });

  it('no {Dressrosa} Character in the top 5: the pick is still asked (never depends on hidden cards) and the cards go to the bottom', () => {
    const g = start(deckTop([SC10.c2, SC10.c3, SC10.c4, SC10.c5, SC10.c6]));
    askedEmpty(g);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual([SC10.c2, SC10.c3, SC10.c4, SC10.c5, SC10.c6].sort());
  });

  it('cost 1: the Event is trashed after resolving and only one Character is added', () => {
    const g = start(deckTop([SC10.dr3, SC10.dr5, SC10.c2, SC10.c2, SC10.c2]));
    pickCards(g, [SC10.dr5]);
    settleOrders(g);
    expect(hand(g)).toEqual([SC10.dr5]);
    expect(trash(g)).toEqual([ID]);
  });
});

describe("OP10-059 [Trigger]: activate this card's [Main] effect", () => {
  function trig(top: string[]) {
    const g = theirs(LD10.neutral, { life: [ID, BLUE, BLUE, BLUE], deck: top });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('runs the look: offers the {Dressrosa} Characters of the top 5 and adds the chosen one', () => {
    const g = trig(deckTop([SC10.dr3, SC10.c2, SC10.dr5, SC10.c2, SC10.c2]));
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC10.dr3, SC10.dr5].sort());
    pickCards(g, [SC10.dr3]);
    settleOrders(g);
    expect(hand(g)).toEqual([SC10.dr3]);
    expect(trash(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(14);
  });

  it('"up to 1": may add nothing; the five cards go to the bottom', () => {
    const g = trig(deckTop([SC10.dr3, SC10.c2, SC10.dr5, SC10.c2, SC10.c2]));
    activateTrigger(g);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(tail(deck(g), 5)).toEqual([SC10.dr3, SC10.dr5, SC10.c2, SC10.c2, SC10.c2].sort());
  });

  it('declining the [Trigger]: nothing is looked at and the Event goes to my hand', () => {
    const g = trig(deckTop([SC10.dr3, SC10.c2, SC10.c2, SC10.c2, SC10.c2]));
    declineTrigger(g);
    expect(hand(g)).toContain(ID);
    expect(deck(g)[0]).toBe(SC10.dr3);
  });
});
