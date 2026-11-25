/**
 * OP09-117 Dereshi! (Event, Yellow, cost 3, {Ohara}).
 *
 * Card text: "[Main] Look at 5 cards from the top of your deck; reveal up to 2 cards with a [Trigger]
 * other than [Dereshi!] and add them to your hand. Then, place the rest at the bottom of your deck in
 * any order.
 * [Trigger] Draw 1 card."
 *
 * Rules: CR 11-2-1 (reveal), CR 8-4-4 ("up to"), a hidden zone's "up to" pick is asked even with no
 * candidate. "A [Trigger]" means the card has a [Trigger] ability; the Events and Characters below do.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  askedEmpty,
  atMain,
  BLUE,
  C9,
  deck,
  E9,
  hand,
  hasEvent,
  hitLeader,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playId,
  reachablePickSets,
  settleOrders,
  tail,
  theirs,
  trash,
} from './kit-op09d.ts';

const ID = 'OP09-117';
// Trigger cards: Speed (Character), Carrot (Character), Gum-Gum Lightning (Event). No Trigger: Sai, Marco.
const T1 = C9.speed;
const T2 = C9.carrot;
const T3 = E9.lightning;

function begin(top: string[]) {
  const g = mine(L9.neutral, { hand: [ID], deck: [...top, C9.c4, ...Array(8).fill(BLUE)] });
  playId(g, ID);
  return g;
}

describe('OP09-117 Dereshi!: [Main] look at 5, add up to 2 cards with a [Trigger], rest to the bottom', () => {
  it('offers exactly the cards with a [Trigger] among the top 5 (Characters and Events alike)', () => {
    const g = begin([T1, C9.c2, T3, C9.c3, T2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([T1, T2, T3].sort());
  });

  it('adding 2: both go to my hand, the other 3 and nothing else are placed at the bottom', () => {
    const g = begin([T1, C9.c2, T3, C9.c3, T2]);
    pickCards(g, [T1, T3]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([T1, T3].sort());
    expect(deck(g)).toHaveLength(14 - 2);
    expect(deck(g)[0]).toBe(C9.c4);
    expect(tail(deck(g), 3)).toEqual([C9.c2, C9.c3, T2].sort());
    expect(trash(g)).toEqual([ID]);
  });

  it('"up to 2": adding exactly 1 is allowed, and so is adding none', () => {
    const g = begin([T1, C9.c2, T3, C9.c3, T2]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has(T1)).toBe(true);
    expect(sets.has([T1, T3].sort().join('+'))).toBe(true);
  });

  it('at most 2 cards can be added even when 3 qualify', () => {
    const g = begin([T1, C9.c2, T3, C9.c3, T2]);
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    }
  });

  it('adding none: all 5 looked-at cards go to the bottom', () => {
    const g = begin([T1, C9.c2, T3, C9.c3, T2]);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(C9.c4);
    expect(tail(deck(g), 5)).toEqual([T1, C9.c2, T3, C9.c3, T2].sort());
  });

  it('"other than [Dereshi!]": a copy of Dereshi! (which has a [Trigger]) is not offered', () => {
    const g = begin([ID, T1, C9.c2, C9.c3, C9.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([T1]);
  });

  it('only the top 5 are looked at: a [Trigger] card in 6th place is not offered; the empty pick is still asked', () => {
    const g = mine(L9.neutral, {
      hand: [ID],
      deck: [C9.c2, C9.c2, C9.c2, C9.c2, C9.c2, T1, ...Array(8).fill(BLUE)],
    });
    playId(g, ID);
    askedEmpty(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(T1);
  });

  it('the added cards are revealed (CR 11-2-1); the cards that stay are not', () => {
    const g = begin([T1, C9.c2, T3, C9.c3, T2]);
    pickCards(g, [T1, T3]);
    settleOrders(g);
    expect(hasEvent(g, 'CardRevealed', { card: T1 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: T3 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: C9.c2 })).toBe(false);
  });

  it('a Character without a [Trigger] (cost-3 Marco) is not a candidate', () => {
    const g = begin([C9.c3, C9.c2, C9.c1, C9.c4, C9.c5]);
    askedEmpty(g);
  });
});

describe('OP09-117 Dereshi! [Trigger] draw 1 card', () => {
  function hit() {
    const g = theirs(L9.neutral, {
      life: [ID, BLUE, BLUE, BLUE],
      deck: [C9.c4, C9.c5, ...Array(10).fill(BLUE)],
    });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('activating draws exactly 1 card; the Event is trashed', () => {
    const g = hit();
    activateTrigger(g);
    expect(hand(g)).toEqual([C9.c4]);
    expect(trash(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(11);
  });

  it('declining puts the Event in my hand', () => {
    const g = hit();
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
  });
});
