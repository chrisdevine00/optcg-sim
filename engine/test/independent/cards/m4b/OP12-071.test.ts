/**
 * OP12-071 Charlotte Pudding (Character, Purple, cost 1, 2000, Counter +1000).
 *
 * Card text:
 *   "[On Play] Look at 4 cards from the top of your deck; reveal up to 1 [Sanji] or Event card
 *    and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 8-4-4-2 (choosing from hidden cards by a requirement: may choose none);
 * CR 8-4-4-4 (look at the faces); "[Sanji]" in brackets is a card NAME; Event is a category.
 */
import { describe, expect, it } from 'vitest';
import { myTurn } from '../kit.ts';
import {
  C,
  deckCards,
  deckOf,
  drive,
  FILLER,
  ids,
  offeredCards,
  playCard,
  side,
  sorted,
  V,
} from './kit-c.ts';
import { kind } from '../kit.ts';

const ID = 'OP12-071';
const TOP4 = [V.sai, C.sanjiVanilla, V.marco, C.purpleEvent0];

function game(top: string[]) {
  return myTurn(
    side(C.shanks, FILLER, {
      hand: [ID],
      costArea: { active: 1, rested: 0 },
      deck: deckOf([...top, V.hajrudin]),
    }),
    side(C.luffy, FILLER),
  );
}

describe('OP12-071 Charlotte Pudding: [On Play] look at 4, add up to 1 [Sanji] or Event, rest to the bottom', () => {
  it('adds the [Sanji] card, puts the other 3 at the bottom in some order, and the 5th card is now on top', () => {
    const g = game(TOP4);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'deck', C.sanjiVanilla)] });
    expect(ids(g, 'p1', 'hand')).toEqual([C.sanjiVanilla]);
    const deck = deckCards(g, 'p1');
    expect(deck).toHaveLength(14);
    expect(deck[0]).toBe(V.hajrudin);
    expect(sorted(deck.slice(-3))).toEqual(sorted([V.sai, V.marco, C.purpleEvent0]));
  });

  it('adds an Event card instead', () => {
    const g = game(TOP4);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'deck', C.purpleEvent0)] });
    expect(ids(g, 'p1', 'hand')).toEqual([C.purpleEvent0]);
    expect(sorted(deckCards(g, 'p1').slice(-3))).toEqual(sorted([V.sai, V.marco, C.sanjiVanilla]));
  });

  it('only [Sanji] and Event cards are offered (not Characters of other names)', () => {
    const g = game(TOP4);
    playCard(g, 'p1', ID);
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted([C.sanjiVanilla, C.purpleEvent0]));
  });

  it('"up to 1": with a [Sanji] and an Event both in the top 4, only 1 is added', () => {
    const g = game(TOP4);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {
      targets: [g.find('p1', 'deck', C.sanjiVanilla), g.find('p1', 'deck', C.purpleEvent0)],
    });
    expect(ids(g, 'p1', 'hand')).toHaveLength(1);
    expect(sorted(deckCards(g, 'p1').slice(-3))).toHaveLength(3);
  });

  it('CR 8-4-4-2: may add nothing even when a match exists; all 4 go to the bottom', () => {
    const g = game(TOP4);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [] });
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    const deck = deckCards(g, 'p1');
    expect(deck[0]).toBe(V.hajrudin);
    expect(sorted(deck.slice(-4))).toEqual(sorted(TOP4));
  });

  it('only the top 4 are looked at: a [Sanji] in 5th place is not offered and stays on top', () => {
    const g = myTurn(
      side(C.shanks, FILLER, {
        hand: [ID],
        costArea: { active: 1, rested: 0 },
        deck: deckOf([V.sai, V.marco, V.hajrudin, V.kingdew, C.sanjiVanilla]),
      }),
      side(C.luffy, FILLER),
    );
    playCard(g, 'p1', ID);
    // No [Sanji] / Event among the 4 looked at: nothing to pick, all 4 go to the bottom.
    drive(g, 'p1', {});
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    const deck = deckCards(g, 'p1');
    expect(deck[0]).toBe(C.sanjiVanilla);
    expect(sorted(deck.slice(-4))).toEqual(sorted([V.sai, V.marco, V.hajrudin, V.kingdew]));
  });
});
