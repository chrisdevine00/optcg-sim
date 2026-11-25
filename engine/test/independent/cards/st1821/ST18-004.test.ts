/**
 * ST18-004 Zoro-Juurou (Purple Character, cost 4, 6000, no Counter, {Straw Hat Crew}).
 * "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 purple "Straw Hat Crew"
 * type card and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 * Rules: both the colour (purple) and the type ({Straw Hat Crew}) must match; the pick is revealed;
 * the prompt is asked even when nothing in the top 5 qualifies (it must not depend on hidden cards).
 */
import { describe, expect, it } from 'vitest';
import {
  askedEmpty,
  atMain,
  BLUE,
  cost,
  deck,
  hand,
  hasEvent,
  LD,
  many,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playId,
  reachablePickSets,
  SC,
  settleOrders,
  tail,
} from './kit-st1821a.ts';

const ID = 'ST18-004';
const P1 = SC.pshc4; // purple {Straw Hat Crew}
const P2 = 'ST18-001'; // purple {Straw Hat Crew}
const RED_SHC = SC.shc4; // {Straw Hat Crew} but red
const PURPLE_OTHER = SC.gordon; // purple but {FILM}
const MISS = SC.c2;
const BEYOND = SC.pshc6; // purple {Straw Hat Crew}, 6th from the top: never looked at

function begin(top: string[]) {
  const g = mine(LD.shanks, {
    hand: [ID],
    deck: [...top, BEYOND, ...many(BLUE, 9)],
    ...cost(10),
  });
  playId(g, ID);
  return g;
}

function finish(g: ReturnType<typeof begin>) {
  settleOrders(g);
  expect(atMain(g)).toBe(true);
}

describe('ST18-004 Zoro-Juurou: look at 5, add up to 1 purple {Straw Hat Crew}, rest to the bottom', () => {
  it('offers exactly the purple {Straw Hat Crew} cards among the top 5', () => {
    const g = begin([P1, RED_SHC, PURPLE_OTHER, P2, MISS]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([P1, P2].sort());
  });

  it('colour matters: a red {Straw Hat Crew} card is not offered; type matters: a purple non-{Straw Hat Crew} is not', () => {
    const g = begin([RED_SHC, PURPLE_OTHER, MISS, MISS, SC.c3]);
    askedEmpty(g);
    finish(g);
    expect(hand(g)).toEqual([]);
  });

  it('the pick goes to the hand; the other four go to the bottom, the card below the top 5 is now on top', () => {
    const g = begin([P1, RED_SHC, PURPLE_OTHER, P2, MISS]);
    pickCards(g, [P2]);
    finish(g);
    expect(hand(g)).toEqual([P2]);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(BEYOND);
    expect(tail(deck(g), 4)).toEqual([P1, RED_SHC, PURPLE_OTHER, MISS].sort());
  });

  it('the chosen card is revealed; the others are not', () => {
    const g = begin([P1, RED_SHC, PURPLE_OTHER, P2, MISS]);
    pickCards(g, [P1]);
    finish(g);
    expect(hasEvent(g, 'CardRevealed', { card: P1 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: RED_SHC })).toBe(false);
  });

  it('"up to 1": may add nothing; all 5 cards go to the bottom', () => {
    const g = begin([P1, RED_SHC, PURPLE_OTHER, P2, MISS]);
    none(g);
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(BEYOND);
    expect(tail(deck(g), 5)).toEqual([P1, RED_SHC, PURPLE_OTHER, P2, MISS].sort());
  });

  it('at most 1 card is added even when two qualify', () => {
    const sets = reachablePickSets(begin([P1, P2, MISS, MISS, SC.c3]));
    expect(sets.has('')).toBe(true);
    expect(sets.has(P1)).toBe(true);
    expect(sets.has(P2)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 5 are looked at: a purple {Straw Hat Crew} card in 6th place is not offered', () => {
    const g = begin([MISS, MISS, SC.c3, SC.c4, SC.c5]);
    askedEmpty(g);
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(BEYOND);
  });

  it('with no match the prompt is still asked (empty, done allowed) and the 5 cards go to the bottom', () => {
    const g = begin([MISS, MISS, SC.c3, SC.c4, SC.c5]);
    askedEmpty(g);
    finish(g);
    expect(tail(deck(g), 5)).toEqual([MISS, MISS, SC.c3, SC.c4, SC.c5].sort());
  });

  it('Zoro-Juurou itself stays on the field and the hand gains only the picked card', () => {
    const g = begin([P1, MISS, MISS, MISS, MISS]);
    pickCards(g, [P1]);
    finish(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(hand(g)).toEqual([P1]);
  });
});
