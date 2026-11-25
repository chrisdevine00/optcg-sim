/**
 * OP09-020 Come On!! We'll Fight You!! (Event, Red, cost 1, {The Four Emperors}/{Red-Haired Pirates}).
 *
 * Card text: "[Main] Look at 5 cards from the top of your deck; reveal up to 1 "Red-Haired Pirates" type
 * card other than [Come On!! We'll Fight You!!] and add it to your hand. Then, place the rest at the
 * bottom of your deck in any order.
 * [Trigger] Draw 1 card."
 *
 * Rules: CR 11-2-1 (reveal), CR 8-4-4 ("up to"), no prompt may depend on hidden cards.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  C9,
  deck,
  describeLook,
  hand,
  hitLeader,
  L9,
  mine,
  need,
  offeredIds,
  pickCards,
  playId,
  settleOrders,
  theirs,
  trash,
} from './kit-op09d.ts';

const ID = 'OP09-020';

describeLook({
  id: ID,
  n: 5,
  main: 'p1',
  rest: 'bottom',
  start: (top) => {
    const g = mine(L9.neutral, { hand: [ID], deck: top });
    playId(g, ID);
    return g;
  },
  match: [C9.rhp5, C9.rhp4],
  multi: C9.rhpMulti,
  excluded: ID,
  miss: C9.c2,
});

describe("OP09-020 Come On!! We'll Fight You!!: more on the filter", () => {
  const begin = (top: string[]) => {
    const g = mine(L9.neutral, { hand: [ID], deck: [...top, ...Array(10).fill(BLUE)] });
    playId(g, ID);
    return g;
  };

  it('any category of {Red-Haired Pirates} card qualifies: an Event (OP09-019) and a Stage (OP09-021) are offered', () => {
    const g = begin(['OP09-019', 'OP09-021', C9.c2, C9.c2, C9.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual(['OP09-019', 'OP09-021'].sort());
  });

  it('the Leader needs no type: the effect works with a Leader that is not {Red-Haired Pirates}', () => {
    const g = begin([C9.rhp5, C9.c2, C9.c2, C9.c2, C9.c2]);
    pickCards(g, [C9.rhp5]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C9.rhp5]);
  });

  it('the Event itself is trashed after use and is not part of the looked-at cards', () => {
    const g = begin([C9.rhp5, C9.c2, C9.c2, C9.c2, C9.c2]);
    pickCards(g, [C9.rhp5]);
    settleOrders(g);
    expect(trash(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(10 + 4);
  });

  it('a copy of itself sitting in the deck top is not offered even beside a legal card', () => {
    const g = begin([ID, C9.rhp4, C9.c2, C9.c2, C9.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.rhp4]);
  });
});

describe('OP09-020 [Trigger] draw 1 card', () => {
  it('activating draws exactly 1 card; the Event is trashed', () => {
    const g = theirs(L9.neutral, {
      life: [ID, BLUE, BLUE, BLUE],
      deck: [C9.c4, C9.c5, ...Array(10).fill(BLUE)],
    });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(hand(g)).toEqual([C9.c4]);
    expect(trash(g)).toEqual([ID]);
  });

  it('declining adds the Event to my hand', () => {
    const g = theirs(L9.neutral, {
      life: [ID, BLUE, BLUE, BLUE],
      deck: [C9.c4, ...Array(10).fill(BLUE)],
    });
    hitLeader(g);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
  });
});
