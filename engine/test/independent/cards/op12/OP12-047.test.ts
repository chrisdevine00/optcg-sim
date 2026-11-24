/**
 * OP12-047 Sengoku (Character, Blue, cost 3, 3000, Counter +1000, {Navy}).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: Look at 5 cards from the top of your deck;
 * reveal up to 2 "Navy" type cards other than [Sengoku] and add them to your hand. Then, place the
 * rest at the bottom of your deck in any order."
 *
 * Rules: "other than [Sengoku]" excludes every card with that NAME (any set), "Navy" type matches
 * Characters, Events and Stages alike. "Up to 2" may be 0, 1 or 2. The cost is optional; unpaid
 * means no effect (CR 8-3-1-4). The rest, looked at and not taken, go to the bottom.
 */
import { describe, expect, it } from 'vitest';
import {
  cast,
  deck,
  hand,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  offeredIds,
  payHand,
  pickInst,
  SB,
  settleOrders,
  tail,
  trash,
  yes,
} from './kit-op12b.ts';

const SENGOKU = 'OP12-047';
/** OP06-049 Sengoku: Blue {Navy} Character, vanilla. Named [Sengoku], so excluded. */
const SENGOKU_OTHER = SB.navyBlue5;
/** OP12-057 Ice Block Pheasant Peck: Blue {Navy} Event. */
const NAVY_EVENT = 'OP12-057';
const rest = (n: number) => Array.from({ length: n }, () => SB.mohji);

const TOP5 = [SB.navyBlue4, SB.navyBlue6, SB.marco, SENGOKU_OTHER, SB.navyBlue7];

/** p1 plays Sengoku, pays Sai, and `top` is the top of the deck. Stops at the look. */
function looking(top: string[]) {
  const g = mine(LB.croc, { hand: [SENGOKU, SB.sai], deck: [...top, ...rest(15 - top.length)] });
  cast(g, SENGOKU);
  yes(g, 'p1');
  payHand(g, [SB.sai]);
  return g;
}

describe('OP12-047 Sengoku: [On Play] trash 1: look at 5, add up to 2 Navy cards other than [Sengoku]', () => {
  it('offers exactly the {Navy} cards that are not named [Sengoku] among the top 5', () => {
    const g = looking(TOP5);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.navyBlue4, SB.navyBlue6, SB.navyBlue7].sort());
  });

  it('adds the 2 chosen cards and puts the other 3 at the bottom of the deck', () => {
    const g = looking(TOP5);
    pickInst(g, [g.find('p1', 'deck', SB.navyBlue4), g.find('p1', 'deck', SB.navyBlue7)]);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([SB.navyBlue4, SB.navyBlue7].sort());
    expect(deck(g)).toHaveLength(13);
    expect(tail(deck(g), 3)).toEqual([SB.navyBlue6, SB.marco, SENGOKU_OTHER].sort());
    expect(deck(g)[0]).toBe(SB.mohji);
    expect(trash(g)).toEqual([SB.sai]);
  });

  it('"up to 2": 1 card may be taken, the other 4 go to the bottom', () => {
    const g = looking(TOP5);
    pickInst(g, [g.find('p1', 'deck', SB.navyBlue6)]);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([SB.navyBlue6]);
    expect(tail(deck(g), 4)).toEqual([SB.navyBlue4, SB.marco, SENGOKU_OTHER, SB.navyBlue7].sort());
  });

  it('"up to 2": may take none; all 5 go to the bottom', () => {
    const g = looking(TOP5);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(tail(deck(g), 5)).toEqual([...TOP5].sort());
  });

  it('at most 2 can be taken when 3 Navy cards qualify', () => {
    const g = looking(TOP5);
    pickInst(g, [g.find('p1', 'deck', SB.navyBlue4), g.find('p1', 'deck', SB.navyBlue6)]);
    settleOrders(g, 'p1');
    // The third qualifying card is not offered once 2 are taken: it went to the bottom.
    expect(hand(g)).toHaveLength(2);
    expect(tail(deck(g), 3)).toContain(SB.navyBlue7);
  });

  it('must not: a card named [Sengoku] (OP06-049, Navy) is never offered, even if it is the only Navy card', () => {
    const g = looking([SENGOKU_OTHER, SB.marco, SB.kingdew, SB.thatch, SB.oars]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([]);
  });

  it('a Navy Event qualifies as a "Navy type card"', () => {
    const g = looking([NAVY_EVENT, SB.marco, SB.kingdew, SB.thatch, SB.oars]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([NAVY_EVENT]);
    pickInst(g, [g.find('p1', 'deck', NAVY_EVENT)]);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([NAVY_EVENT]);
  });

  it('only the top 5 are looked at: a Navy card in 6th place stays on top', () => {
    const g = looking([SB.marco, SB.kingdew, SB.thatch, SB.oars, SB.hajrudin, SB.navyBlue4]);
    if (kind(g) === 'choose') none(g);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(SB.navyBlue4);
  });

  it('"you may": declining the cost does nothing (nothing trashed, deck untouched)', () => {
    const g = mine(LB.croc, { hand: [SENGOKU, SB.sai], deck: [...TOP5, ...rest(10)] });
    cast(g, SENGOKU);
    no(g, 'p1');
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([SB.sai]);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(SB.navyBlue4);
  });

  it('unpayable cost (empty hand): the effect cannot be used and the deck is untouched', () => {
    const g = mine(LB.croc, { hand: [SENGOKU], deck: [...TOP5, ...rest(10)] });
    cast(g, SENGOKU);
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      no(g, 'p1');
    }
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(SB.navyBlue4);
  });
});
