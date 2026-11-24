/**
 * OP14-067 Dellinger (Character, Purple, cost 1, 2000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[On K.O.] Add up to 1 DON!! card from your DON!! deck and rest it, look at 5 cards from
 * the top of your deck; reveal up to 1 {Donquixote Pirates} type card and add it to your hand.
 * Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: "add up to N DON!!" asks a count; a look at the top N reveals only the card added to the
 * hand (CR 11-2-1); "type card" is any category; "up to 1" may add nothing; the rest go to the
 * bottom in the chosen order; a prompt must not depend on the looked-at (hidden) cards.
 */
import { describe, expect, it } from 'vitest';
import {
  addDon,
  backToMain,
  BLUE,
  canFinish,
  deck,
  donOf14,
  hand,
  hasEvent,
  kind,
  koGame,
  mayChooseNone,
  minus,
  need,
  none,
  offeredIds,
  pickCards,
  reachablePickSets,
  SC14,
  settleOrders,
  tail,
} from './kit-op14c.ts';

const ID = 'OP14-067';
/** OP14-076 Ever White: Purple Event, cost 1, types {Donquixote Pirates}/{The Seven Warlords of the Sea}. */
const DP_EVENT = 'OP14-076';
const MISS = SC14.c3; // Marco: no {Donquixote Pirates}
const A = SC14.dp2;
const B = SC14.dp3;

/** Dellinger K.O.'d with this deck (top first); answers the DON!! count with 1. */
function start(top: string[], rest: string[] = Array.from({ length: 10 }, () => BLUE)) {
  const g = koGame(ID, { p1: { deck: [...top, ...rest] } });
  addDon(g, 1);
  return g;
}
const fin = (g: ReturnType<typeof start>) => {
  settleOrders(g, 'p1');
  backToMain(g, 'p2');
};

describe('OP14-067 Dellinger [On K.O.] add a rested DON!!, look at 5, add a {Donquixote Pirates} card', () => {
  it('adds up to 1 DON!! RESTED from the DON!! deck', () => {
    const g = koGame(ID, { p1: { deck: [MISS, MISS, MISS, MISS, MISS, BLUE, BLUE] } });
    const before = donOf14(g);
    addDon(g, 1);
    expect(donOf14(g)).toMatchObject({
      active: before.active,
      rested: before.rested + 1,
      deck: before.deck - 1,
    });
  });

  it('offers exactly the {Donquixote Pirates} cards among the top 5', () => {
    const g = start([A, MISS, B, BLUE, MISS]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([A, B].sort());
  });

  it('the picked card goes to hand, the other four to the bottom, and the deck shrinks by one', () => {
    const top = [A, MISS, B, BLUE, MISS];
    const g = start(top);
    pickCards(g, [B]);
    fin(g);
    expect(hand(g)).toEqual([B]);
    expect(deck(g)).toHaveLength(15 - 1);
    expect(tail(deck(g), 4)).toEqual(minus(top, [B]).sort());
    expect(deck(g)[0]).toBe(BLUE);
  });

  it('only the top 5 are looked at: a {Donquixote Pirates} card in position 6 is not offered', () => {
    const g = start([MISS, MISS, MISS, MISS, MISS, A]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    fin(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(A);
  });

  it('"type card": a {Donquixote Pirates} Event qualifies', () => {
    const g = start([MISS, DP_EVENT, MISS, MISS, MISS]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DP_EVENT]);
    pickCards(g, [DP_EVENT]);
    fin(g);
    expect(hand(g)).toEqual([DP_EVENT]);
  });

  it('the added card is revealed; the others are not', () => {
    const g = start([A, MISS, B, BLUE, MISS]);
    pickCards(g, [A]);
    fin(g);
    expect(hasEvent(g, 'CardRevealed', { card: A })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: MISS })).toBe(false);
  });

  it('"up to 1": may add nothing; all five go to the bottom', () => {
    const top = [A, MISS, B, BLUE, MISS];
    const g = start(top);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    fin(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(tail(deck(g), 5)).toEqual([...top].sort());
  });

  it('adds at most one card even when two qualify', () => {
    const sets = reachablePickSets(start([A, MISS, B, BLUE, MISS]));
    expect(sets.has('')).toBe(true);
    expect(sets.has(A)).toBe(true);
    expect(sets.has(B)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with no match the cards still go to the bottom; the "up to" pick is asked (empty) regardless of the hidden cards', () => {
    const top = [MISS, MISS, BLUE, BLUE, MISS];
    const g = start(top);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
    none(g);
    fin(g);
    expect(deck(g)).toHaveLength(15);
    expect(tail(deck(g), 5)).toEqual([...top].sort());
    expect(kind(g)).toBe('main');
  });
});
