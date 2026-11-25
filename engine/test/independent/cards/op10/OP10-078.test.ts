/**
 * OP10-078 I Do Not Forgive Those Who Laugh at My Family!!! (Event, Purple, cost 1,
 * {Donquixote Pirates}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[Main]/[Counter] Look at 3 cards from the top of your deck; reveal up to 1
 * {Donquixote Pirates} type card other than [I Do Not Forgive Those Who Laugh at My Family!!!] and
 * add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 8-4-4 ("look at", "up to"), CR 11-2-1 (reveal), "other than [name]" is by name.
 */
import { describe, expect, it } from 'vitest';
import { act, passCounter } from '../../helpers.ts';
import {
  activateCounter,
  askedEmpty,
  atMain,
  BLUE,
  canCounterNow,
  deck,
  deckTop,
  defend,
  describeLook,
  hand,
  kind,
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
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-078';
const DP_EVENT = 'OP10-079'; // {Donquixote Pirates}/{Warlords} Event
const DP_EVENT2 = 'OP10-080'; // {Donquixote Pirates} Event
const DP_MULTI = 'ST03-009'; // Doflamingo: {Donquixote Pirates}/{Warlords} Character (type "including")
const MISS = SC10.c2;

function start(top: string[]) {
  const g = mine(LD10.neutral, { hand: [ID], deck: top });
  playId(g, ID);
  return g;
}

describeLook({
  id: ID,
  n: 3,
  main: 'p1',
  rest: 'bottom',
  start,
  match: [DP_EVENT, DP_EVENT2],
  multi: DP_MULTI,
  excluded: ID,
  miss: MISS,
});

describe('OP10-078 [Main] further checks', () => {
  it('any card category qualifies: both an Event and a Character with the type are offered', () => {
    const g = start(deckTop([DP_EVENT, DP_MULTI, MISS]));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DP_EVENT, DP_MULTI].sort());
  });

  it('a card with only the {The Seven Warlords of the Sea} type is not offered', () => {
    const g = start(deckTop([SC10.wl4, MISS, MISS]));
    askedEmpty(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
  });

  it('with no {Donquixote Pirates} card in the top 3 the pick is still asked and the three go to the bottom', () => {
    const g = start(deckTop([MISS, SC10.c3, SC10.c4]));
    askedEmpty(g);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(tail(deck(g), 3)).toEqual([MISS, SC10.c3, SC10.c4].sort());
    expect(trash(g)).toEqual([ID]);
  });
});

describe('OP10-078 [Counter]: the same look, used during a battle', () => {
  function counterGame(top: string[]) {
    const g = defend({ hand: [ID], active: 1, deck: top });
    activateCounter(g, g.find('p1', 'hand', ID));
    return g;
  }

  it('offers the {Donquixote Pirates} cards of the top 3 and adds the chosen one to my hand', () => {
    const g = counterGame(deckTop([DP_EVENT, MISS, DP_MULTI]));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DP_EVENT, DP_MULTI].sort());
    pickCards(g, [DP_MULTI]);
    settleOrders(g);
    expect(hand(g)).toEqual([DP_MULTI]);
    expect(kind(g)).toBe('counter');
  });

  it('it gives no power: the 5000 attack on my 5000 Leader connects after the Counter Step', () => {
    const g = counterGame(deckTop([DP_EVENT, MISS, MISS]));
    pickCards(g, [DP_EVENT]);
    settleOrders(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('"up to 1": may add nothing', () => {
    const g = counterGame(deckTop([DP_EVENT, MISS, MISS]));
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(BLUE);
    act(g, { type: 'endCounter' });
  });

  it('cost 1: with 0 active DON!! it cannot be used as a Counter', () => {
    const g = defend({ hand: [ID], active: 0 });
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
  });
});
