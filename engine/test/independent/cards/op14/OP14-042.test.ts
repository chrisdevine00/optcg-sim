/**
 * OP14-042 Arlong (Character, Blue, cost 1, 3000, {Fish-Man}/{The Sun Pirates}).
 *
 * Card text: "[On Play] If your Leader has the {Fish-Man} type, look at 4 cards from the top of your
 * deck; reveal up to 1 card with a cost of 2 or more and add it to your hand. Then, place the rest
 * at the bottom of your deck in any order."
 *
 * Rules: CR 2-4-3 (a {Type} reference is an exact type), CR 4-8-1 ("up to"), CR 11-2-1 (revealed
 * cards are shown), CR 8-3-3 (text after a failed "if" does not resolve).
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import { act } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  atMain,
  BLUE,
  C14,
  canFinish,
  choices,
  deck,
  hand,
  hasEvent,
  L14,
  mine,
  need,
  offeredIds,
  pickCards,
  put,
  reachablePickSets,
  settleOrders,
  tail,
} from './kit-op14b.ts';

const ARL = 'OP14-042';
/** Cost 1: BLUE, Camie. Cost 2: Sai. Cost 5: Kingdew. Cost 6: Thatch. */
const TOP4: CardId[] = [BLUE, C14.sai, C14.kingdew, C14.camie];
const BELOW: CardId[] = [C14.thatch, BLUE, BLUE, BLUE, BLUE, BLUE, BLUE, BLUE];

function start(leader: string, top: CardId[] = TOP4) {
  return mine(leader, { hand: [ARL], deck: [...top, ...BELOW] });
}
/** Finish whatever ordering the engine asks and require the Main Phase. */
function settle(g: TestGame) {
  settleOrders(g);
  expect(atMain(g)).toBe(true);
}

describe('OP14-042 Arlong: [On Play] with a {Fish-Man} Leader, look at 4, add up to 1 card of cost 2 or more, rest to the bottom', () => {
  it('offers exactly the cards of cost 2 or more among the top 4; the pick goes to hand and the other three go to the bottom', () => {
    const g = start(L14.fish);
    put(g, ARL);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C14.kingdew, C14.sai].sort());
    pickCards(g, [C14.kingdew]);
    settle(g);
    expect(hand(g)).toEqual([C14.kingdew]);
    expect(deck(g)).toHaveLength(TOP4.length + BELOW.length - 1);
    expect(deck(g)[0]).toBe(C14.thatch);
    expect(tail(deck(g), 3)).toEqual([BLUE, C14.camie, C14.sai].sort());
  });

  it('boundary: a card of cost 2 (Sai) is offered; cards of cost 1 (Mohji, Camie) are not', () => {
    const g = start(L14.fish);
    put(g, ARL);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(C14.sai);
    expect(offeredIds(g)).not.toContain(C14.camie);
    expect(offeredIds(g)).not.toContain(BLUE);
  });

  it('only the top 4 are looked at: a card of cost 6 in 5th position is not offered and stays on top', () => {
    const g = start(L14.fish);
    put(g, ARL);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(C14.thatch);
    pickCards(g, [C14.sai]);
    settle(g);
    expect(deck(g)[0]).toBe(C14.thatch);
  });

  it('"up to 1": may add nothing; all 4 looked-at cards go to the bottom', () => {
    const g = start(L14.fish);
    put(g, ARL);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    settle(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(TOP4.length + BELOW.length);
    expect(deck(g)[0]).toBe(C14.thatch);
    expect(tail(deck(g), 4)).toEqual([...TOP4].sort());
  });

  it('adds at most one card even when two qualify', () => {
    const g = start(L14.fish);
    put(g, ARL);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has(C14.kingdew)).toBe(true);
    expect(sets.has(C14.sai)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('the chosen card is revealed (CR 11-2-1); the cards not chosen are not', () => {
    const g = start(L14.fish);
    put(g, ARL);
    pickCards(g, [C14.kingdew]);
    settle(g);
    expect(hasEvent(g, 'CardRevealed', { card: C14.kingdew })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: C14.sai })).toBe(false);
  });

  it('with no card of cost 2 or more in the top 4 nothing is added and the 4 cards still go to the bottom', () => {
    const top = [BLUE, C14.camie, BLUE, C14.camie];
    const g = start(L14.fish, top);
    put(g, ARL);
    // The top cards are hidden, so the "up to 1" pick is asked even though nothing qualifies.
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(0);
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    settle(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(C14.thatch);
    expect(tail(deck(g), 4)).toEqual([...top].sort());
  });

  it('must not look when the Leader lacks {Fish-Man} (a Straw Hat Crew Leader): the deck is untouched and nothing is asked', () => {
    const g = start(L14.luffy);
    put(g, ARL);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toEqual([...TOP4, ...BELOW]);
  });

  it('any Leader with {Fish-Man} among its types works (OP14-040 Jinbe)', () => {
    const g = start(L14.jinbe);
    put(g, ARL);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C14.kingdew, C14.sai].sort());
  });

  it('a {Fish-Man} Character on the field does not stand in for the Leader (Arlong is itself a {Fish-Man})', () => {
    const g = start(L14.merfolk);
    put(g, ARL);
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toEqual([...TOP4, ...BELOW]);
  });
});
