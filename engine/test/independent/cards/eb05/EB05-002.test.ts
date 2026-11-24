/**
 * EB05-002 Doll (Character, Red, cost 1, 2000, Counter +1000, {Navy}, Strike).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 2 {Navy} type cards with
 * a cost of 2 or more and add them to your hand, then place the rest at the bottom of your deck in
 * any order. Then, trash 1 card from your hand."
 *
 * Rules: CR 8-4-4-1/-2 ("up to" allows 0, even with matching cards), CR 11-2-1 (reveal when moving
 * deck to hand), CR 11-3-3, CR 4-10-2 (a "Then" clause still resolves), CR 10-2-14 (Trash from hand).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  BLUE,
  choose,
  chooseNone,
  choiceCards,
  count,
  deck,
  EC,
  EL,
  finishEmpty,
  finishOrders,
  hand,
  kind,
  mine,
  offeredInstance,
  playCard,
  reachablePickSets,
  tail,
  trash,
  VAN,
  chooseCards,
} from './kit-eb05a.ts';

const DOLL = 'EB05-002';

/** Top 5 of the deck, then a Navy cost-5 card in 6th place, then filler. */
function played(top: string[], inHand: string[] = []) {
  const g = mine(EL.croc, {
    hand: [DOLL, ...inHand],
    deck: [...top, EC.sengoku, ...fill(BLUE, 10)],
  });
  playCard(g, DOLL);
  return g;
}

const TOP = [EC.doberman2, EC.komille1, EC.fullbody, BLUE, BLUE];

describe('EB05-002 Doll: [On Play] look at 5, add up to 2 {Navy} cost 2+, rest to the bottom, then trash 1', () => {
  it('offers exactly the {Navy} cards with cost 2 or more (cost 1 and non-Navy are not offered)', () => {
    const g = played([...TOP.slice(0, 3), VAN.kingdew, BLUE]);
    expect(choiceCards(g)).toEqual([EC.doberman2, EC.fullbody].sort());
  });

  it('adds both chosen cards, bottoms the other 3 and then trashes 1 card from hand', () => {
    const g = played(TOP);
    chooseCards(g, [EC.doberman2, EC.fullbody]);
    finishOrders(g);
    expect(kind(g)).toBe('choose');
    choose(g, [offeredInstance(g, EC.fullbody)]);
    expect(hand(g)).toEqual([EC.doberman2]);
    expect(trash(g)).toEqual([EC.fullbody]);
    expect(deck(g)).toHaveLength(14);
    expect(tail(deck(g), 3)).toEqual([EC.komille1, BLUE, BLUE].sort());
  });

  it('CR 8-4-4-1: "up to 2": cannot add 3 even when 3 qualify, and 1 or 0 is allowed', () => {
    const g = played([EC.doberman2, EC.fullbody, EC.sengoku, EC.komille1, BLUE]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it('CR 8-4-4-2: may add nothing; with an empty hand nothing is trashed and all 5 go to the bottom', () => {
    const g = played(TOP);
    chooseNone(g);
    finishOrders(g);
    finishEmpty(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(16);
    expect(tail(deck(g), 5)).toEqual([...TOP].sort());
  });

  it('"Then, trash 1 card from your hand" may choose a card that was already in hand', () => {
    const g = played(TOP, [VAN.mohji]);
    chooseCards(g, [EC.doberman2]);
    finishOrders(g);
    expect(choiceCards(g)).toEqual([EC.doberman2, VAN.mohji].sort());
    choose(g, [offeredInstance(g, VAN.mohji)]);
    expect(hand(g)).toEqual([EC.doberman2]);
    expect(trash(g)).toEqual([VAN.mohji]);
  });

  it('the trash is mandatory: after adding one card with an empty hand that card is trashed', () => {
    const g = played(TOP);
    chooseCards(g, [EC.fullbody]);
    finishOrders(g);
    if (kind(g) === 'choose') choose(g, [offeredInstance(g, EC.fullbody)]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([EC.fullbody]);
  });

  it('CR 4-10-2: the trash still happens when no card was added and the hand has a card', () => {
    const g = played(TOP, [VAN.mohji]);
    chooseNone(g);
    finishOrders(g);
    if (kind(g) === 'choose') choose(g, [offeredInstance(g, VAN.mohji)]);
    expect(trash(g)).toEqual([VAN.mohji]);
    expect(hand(g)).toEqual([]);
  });

  it('only the top 5 are looked at: a Navy cost 2+ card in 6th place is not offered', () => {
    const g = played(fill(BLUE, 5));
    expect(choiceCards(g)).toEqual([]);
    chooseNone(g);
    finishOrders(g);
    finishEmpty(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(EC.sengoku);
  });

  it('Doll herself stays on the field and the rest of the deck is untouched', () => {
    const g = played(TOP);
    chooseNone(g);
    finishOrders(g);
    finishEmpty(g);
    expect(count(g, 'p1', 'characters')).toBe(1);
    expect(count(g, 'p2', 'hand')).toBe(0);
  });
});
