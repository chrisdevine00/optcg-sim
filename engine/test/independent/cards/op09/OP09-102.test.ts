/**
 * OP09-102 Professor Clover (Character, Yellow, cost 1, 0 power, Counter +2000, {Ohara}, Wisdom).
 *
 * Card text: "[On Play] If your Leader is [Nico Robin], look at 3 cards from the top of your deck;
 * reveal up to 1 card with a [Trigger] and add it to your hand. Then, place the rest at the bottom
 * of your deck in any order.
 * [Trigger] Activate this card's [On Play] effect."
 *
 * Rules: "[Nico Robin]" is an exact card name (CR 2-1-2). The deck is hidden, so the pick is asked
 * even when nothing in the top 3 has a [Trigger] (max 0). "Up to 1" may be 0. The revealed card is
 * public (CR 11-2-1). An activated [Trigger] runs the [On Play] effect and then trashes the card.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  askedEmpty,
  atMain,
  deck,
  hand,
  LD9,
  mayChooseNone,
  mine,
  minus,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  reachablePickSets,
  SC9,
  settleOrders,
  tail,
  trash,
  triggerGame,
} from './kit-op09c.ts';

const CLOVER = 'OP09-102';
// Cards with a printed [Trigger]: OP01-104 Speed (Purple Character), OP01-009 Carrot (Red Character),
// OP09-100 Karasu (Yellow Character), OP09-077 Gum-Gum Lightning (Purple Event).
const T1 = 'OP01-104';
const T2 = 'OP01-009';
const T3 = 'OP09-100';
const T4 = 'OP09-077';
const MISS = SC9.c2; // no [Trigger]
const BELOW = [T1, ...Array.from({ length: 8 }, () => SC9.mohji)];

function viaPlay(top: string[], leader: string = LD9.robin) {
  const g = mine(leader, { hand: [CLOVER], deck: [...top, ...BELOW] }, {});
  playRaw(g, CLOVER);
  return g;
}

function viaTrigger(top: string[], leader: string = LD9.robin) {
  return triggerGame(CLOVER, { leader, deck: [...top, ...BELOW] });
}

function finish(g: ReturnType<typeof viaPlay>) {
  settleOrders(g);
  expect(atMain(g, g.decider)).toBe(true);
}

describe('OP09-102 Professor Clover: [On Play] if my Leader is [Nico Robin], look at 3, add up to 1 card with a [Trigger]', () => {
  it('printed values: cost 1, 0 power, Counter +2000', () => {
    const g = viaPlay([MISS, MISS, MISS]);
    const c = g.zone('p1', 'characters')[0]!;
    expect(c.cost).toBe(1);
    expect(c.power).toBe(0);
    expect(c.counter).toBe(2000);
  });

  it('offers exactly the cards with a [Trigger] among the top 3 (any category)', () => {
    const g = viaPlay([T4, MISS, T2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([T2, T4].sort());
  });

  it('the pick goes to my hand; the other 2 looked-at cards go to the bottom of the deck', () => {
    const top = [T3, MISS, T2];
    const g = viaPlay(top);
    pickCards(g, [T2]);
    finish(g);
    expect(hand(g)).toEqual([T2]);
    expect(deck(g)).toHaveLength(3 + BELOW.length - 1);
    expect(deck(g)[0]).toBe(T1);
    expect(tail(deck(g), 2)).toEqual(minus(top, [T2]).sort());
  });

  it('"up to 1": adding nothing is allowed; all 3 go to the bottom', () => {
    const top = [T3, MISS, T2];
    const g = viaPlay(top);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(3 + BELOW.length);
    expect(tail(deck(g), 3)).toEqual([...top].sort());
  });

  it('adds at most one card even when several have a [Trigger]', () => {
    const g = viaPlay([T3, T2, T4]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has(T3)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 3 are looked at: a [Trigger] card in 4th position is not offered', () => {
    const g = viaPlay([MISS, MISS, MISS]);
    askedEmpty(g);
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(T1);
  });

  it('a card without a [Trigger] is never offered', () => {
    const g = viaPlay([SC9.c1, SC9.c3, SC9.yc3]);
    askedEmpty(g);
    finish(g);
    expect(hand(g)).toEqual([]);
  });

  it('the chosen card is revealed; the others are not', () => {
    const g = viaPlay([T3, MISS, T2]);
    pickCards(g, [T3]);
    finish(g);
    expect(g.events.some((e) => e.type === 'CardRevealed' && e.card === T3)).toBe(true);
    expect(g.events.some((e) => e.type === 'CardRevealed' && e.card === MISS)).toBe(false);
  });

  it('the second [Nico Robin] Leader (EB05-010) enables it too (the name is what counts)', () => {
    const g = viaPlay([T3, MISS, MISS], LD9.robin2);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([T3]);
  });

  it('a Leader that is not [Nico Robin]: nothing is looked at, the deck is untouched, no prompt', () => {
    const g = viaPlay([T3, T2, T4], LD9.luffy);
    expect(atMain(g, 'p1')).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(3 + BELOW.length);
    expect(deck(g).slice(0, 3)).toEqual([T3, T2, T4]);
  });

  it('[Trigger]: activating it runs the [On Play] effect (look at 3, add a [Trigger] card), then the card is trashed', () => {
    const g = viaTrigger([T4, MISS, T2]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([T2, T4].sort());
    pickCards(g, [T4]);
    settleOrders(g);
    expect(hand(g)).toEqual([T4]);
    expect(trash(g)).toEqual([CLOVER]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('[Trigger] with a Leader that is not [Nico Robin]: the effect does nothing and the card is trashed', () => {
    const g = viaTrigger([T4, MISS, T2], LD9.luffy);
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([CLOVER]);
  });

  it('declining the [Trigger]: Clover goes to my hand and nothing is looked at', () => {
    const g = viaTrigger([T4, MISS, T2]);
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([CLOVER]);
    expect(deck(g).slice(0, 3)).toEqual([T4, MISS, T2]);
  });
});
