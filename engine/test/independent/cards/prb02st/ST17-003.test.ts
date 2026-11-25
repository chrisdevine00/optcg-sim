/**
 * ST17-003 Buggy (Character, cost 1, 2000, Counter +2000, {Buggy's Delivery}/{The Seven Warlords of
 * the Sea}).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck and place them at the top of your deck
 * in any order."
 *
 * Rules: "look at" is private (the opponent does not see the cards, CR 11-2); the 3 cards go back on
 * top in the order the player chooses, so every permutation is reachable. Nothing leaves the deck.
 * With fewer than 3 cards, all of them are looked at.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMainOf,
  BLUE,
  deck,
  hand,
  hasEvent,
  kind,
  LDP,
  mine,
  outcomes,
  playRaw,
  settleOrders,
  SP,
} from './kit-prb02sta.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const BU = 'ST17-003';
const A = SP.c1p3;
const B = SP.c2p4;
const C = SP.c3p5;
const D = SP.c4p6;
const REST = Array.from({ length: 10 }, () => BLUE);

function play(top: string[], rest: string[] = [D, ...REST]) {
  const g = mine(LDP.neutral, { hand: [BU], deck: [...top, ...rest] });
  playRaw(g, BU);
  return g;
}

const topN = (g: TestGame, n: number) => deck(g).slice(0, n).join('>');

describe('ST17-003 Buggy: [On Play] look at the top 3 and put them back on top in any order', () => {
  it('printed values: cost 1, 2000 power, Counter +2000', () => {
    const g = mine(LDP.neutral, { characters: [BU] });
    const i = at(g, 'p1', 'characters', BU);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([1, 2000, 2000]);
  });

  it("the order is the player's choice: all 6 orders of the top 3 can be reached", () => {
    const g = play([A, B, C]);
    const seen = outcomes(g, 'p1', (game) => topN(game, 3));
    const expected = [
      [A, B, C],
      [A, C, B],
      [B, A, C],
      [B, C, A],
      [C, A, B],
      [C, B, A],
    ].map((p) => p.join('>'));
    expect([...seen].sort()).toEqual(expected.sort());
  });

  it('nothing but the top 3 is touched: the 4th card is still 4th and the deck size is unchanged', () => {
    const g = play([A, B, C]);
    settleOrders(g);
    expect(atMainOf(g)).toBe(true);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[3]).toBe(D);
    expect([...deck(g).slice(0, 3)].sort()).toEqual([A, B, C].sort());
  });

  it('no card goes to the hand and none leaves the deck: the hand is empty after Buggy is played', () => {
    const g = play([A, B, C]);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
  });

  it('looking is private: none of the three cards is revealed', () => {
    const g = play([A, B, C]);
    settleOrders(g);
    for (const c of [A, B, C]) {
      expect(hasEvent(g, 'CardRevealed', { card: c })).toBe(false);
    }
  });

  it("the opponent's deck is not touched", () => {
    const g = mine(
      LDP.neutral,
      { hand: [BU], deck: [A, B, C, ...REST] },
      { deck: [D, C, B, A, ...REST] },
    );
    playRaw(g, BU);
    settleOrders(g);
    expect(
      g
        .zone('p2', 'deck')
        .slice(0, 4)
        .map((c) => c.card),
    ).toEqual([D, C, B, A]);
  });

  it('a deck of only 2 cards: both are looked at and can be put back in either order, nothing breaks', () => {
    const g = mine(LDP.neutral, { hand: [BU], deck: [A, B] });
    playRaw(g, BU);
    const seen = outcomes(g, 'p1', (game) => deck(game).join('>'));
    expect([...seen].sort()).toEqual([[A, B].join('>'), [B, A].join('>')].sort());
  });

  it('two identical cards among the three still give the distinct orders only (A, A, B: 3 distinct orders)', () => {
    const g = play([A, A, B]);
    const seen = outcomes(g, 'p1', (game) => topN(game, 3));
    expect([...seen].sort()).toEqual(
      [
        [A, A, B],
        [A, B, A],
        [B, A, A],
      ]
        .map((p) => p.join('>'))
        .sort(),
    );
  });

  it('the deck below the three is unchanged for the next draws (draw order after the look)', () => {
    const g = play([A, B, C]);
    settleOrders(g);
    expect(deck(g).slice(3, 6)).toEqual([D, BLUE, BLUE]);
    expect(kind(g)).toBe('main');
  });
});
