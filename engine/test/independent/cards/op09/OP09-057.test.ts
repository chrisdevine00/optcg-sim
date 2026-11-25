/**
 * OP09-057 Cross Guild (Event, Blue, cost 1, {Cross Guild}).
 *
 * Card text: "[Main] Look at 4 cards from the top of your deck; reveal up to 1 "Cross Guild" type card
 * and add it to your hand. Then, place the rest at the bottom of your deck in any order.
 * [Trigger] Activate this card's [Main] effect."
 *
 * Note the filter has NO "other than [Cross Guild]": another copy of itself is a legal pick.
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

const ID = 'OP09-057';

describeLook({
  id: ID,
  n: 4,
  main: 'p1',
  rest: 'bottom',
  start: (top) => {
    const g = mine(L9.cg, { hand: [ID], deck: top });
    playId(g, ID);
    return g;
  },
  match: [C9.cg5b, C9.cg5],
  multi: C9.cg6,
  miss: C9.c2,
});

describe('OP09-057 Cross Guild: [Main] details', () => {
  const begin = (top: string[], leader: string = L9.cg) => {
    const g = mine(leader, { hand: [ID], deck: [...top, ...Array(10).fill(BLUE)] });
    playId(g, ID);
    return g;
  };

  it('no exclusion by name: another [Cross Guild] Event in the top 4 is offered and can be added', () => {
    const g = begin([ID, C9.c2, C9.c2, C9.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ID]);
    pickCards(g, [ID]);
    settleOrders(g);
    expect(hand(g)).toEqual([ID]);
    expect(trash(g)).toEqual([ID]);
  });

  it('the Leader needs no type: a Leader that is not {Cross Guild} still looks and adds', () => {
    const g = begin([C9.cg5, C9.c2, C9.c2, C9.c2], L9.neutral);
    need(g, 'choose', 'p1');
    pickCards(g, [C9.cg5]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C9.cg5]);
  });

  it('the Event is trashed and the deck keeps 14 cards less the one added (4 looked at go to the bottom)', () => {
    const g = begin([C9.cg5, C9.c2, C9.c2, C9.c2]);
    pickCards(g, [C9.cg5]);
    settleOrders(g);
    expect(trash(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(13);
  });
});

describe("OP09-057 [Trigger] activate this card's [Main] effect", () => {
  function hit(top: string[]) {
    const g = theirs(L9.cg, {
      life: [ID, BLUE, BLUE, BLUE],
      deck: [...top, ...Array(10).fill(BLUE)],
    });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('activating looks at 4 cards, offers the {Cross Guild} ones, adds the pick and bottoms the rest', () => {
    const g = hit([C9.c2, C9.cg5, C9.cg6, C9.c2]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.cg5, C9.cg6].sort());
    pickCards(g, [C9.cg6]);
    settleOrders(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([C9.cg6]);
    expect(trash(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(13);
  });

  it('only the top 4 are looked at: a match as the 5th card is not offered', () => {
    const g = hit([C9.c2, C9.c2, C9.c2, C9.c2, C9.cg5]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
  });

  it('declining the [Trigger] adds the Event to my hand and looks at nothing', () => {
    const g = hit([C9.cg5, C9.c2, C9.c2, C9.c2]);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(14);
    expect(atMain(g, 'p2')).toBe(true);
  });
});
