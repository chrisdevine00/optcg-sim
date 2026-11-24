/**
 * OP15-084 Dr. Hogback (Character, Black, cost 1, 2000, Counter +1000, {Thriller Bark Pirates}).
 *
 * Card text:
 *   "[On Play] If your Leader has the {Thriller Bark Pirates} type, trash 5 cards from the top of your deck.
 *    [On K.O.] If you have 6 or less cards in your hand, draw 1 card."
 *
 * Rules relied on: CR 8-3-3 / RD 122 (a condition gates its effect), CR 10-2-1-1 and RL-15
 * (a battle K.O. and an effect K.O. are both K.O.s; a return to hand is not), RL-15 (trash is not
 * a K.O.), CR 9-2-1-2 (a deck that reaches 0 cards loses at once, milling included).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  battleKo,
  bounceEffect,
  chars,
  deck,
  deckTop,
  hand,
  kind,
  koEffect,
  LD15,
  many,
  mine,
  playIt,
  SC15,
  theirsWith,
  trash,
  anyOrder,
  result,
} from './kit-op15c.ts';

const HOG = 'OP15-084';
const TOP5 = [SC15.red2, SC15.red3, SC15.red4, SC15.red5, SC15.red6];

function play(leader: string, deckCards = deckTop(TOP5)) {
  const g = mine(leader, { hand: [HOG], deck: deckCards });
  playIt(g, HOG);
  anyOrder(g);
  return g;
}

describe('OP15-084 Dr. Hogback [On Play]', () => {
  it('with a {Thriller Bark Pirates} Leader, trashes exactly the top 5 cards of the deck', () => {
    const g = play(LD15.tbp);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([...TOP5].sort());
    expect(deck(g)).toHaveLength(10);
    expect(chars(g)).toEqual([HOG]);
  });

  it('it is not optional: no prompt is asked before the cards are trashed', () => {
    const g = mine(LD15.tbp, { hand: [HOG], deck: deckTop(TOP5) });
    playIt(g, HOG);
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toHaveLength(5);
  });

  it('without the {Thriller Bark Pirates} type on the Leader nothing is trashed', () => {
    const g = play(LD15.shc);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('trashes from the TOP: the deck below the 5 is untouched', () => {
    const g = play(LD15.tbp);
    expect(deck(g)).toEqual(Array.from({ length: 10 }, () => 'OP02-060'));
  });

  it('with only 3 cards in the deck, trashes those 3 and p1 loses by deck-out (CR 9-2-1-2)', () => {
    const g = play(LD15.tbp, [SC15.red2, SC15.red3, SC15.red4]);
    expect(trash(g)).toEqual([SC15.red2, SC15.red3, SC15.red4].sort());
    expect(deck(g)).toEqual([]);
    expect(result(g)).toEqual({ winner: 'p2', reason: 'deck out' });
  });

  it('exactly 5 cards in the deck: all 5 are trashed and p1 has 0 cards in the deck, so loses', () => {
    const g = play(LD15.tbp, [...TOP5]);
    expect(trash(g)).toEqual([...TOP5].sort());
    expect(result(g)).toEqual({ winner: 'p2', reason: 'deck out' });
  });

  it('6 cards in the deck: 5 are trashed and 1 is left, so no loss', () => {
    const g = play(LD15.tbp, [...TOP5, SC15.red7]);
    expect(deck(g)).toEqual([SC15.red7]);
    expect(result(g)).toBeFalsy();
  });
});

describe('OP15-084 Dr. Hogback [On K.O.]', () => {
  const start = (handCards: string[], deckCards = deckTop([SC15.red4])) =>
    theirsWith(LD15.tbp, {
      characters: [{ card: HOG, rested: true }],
      hand: handCards,
      deck: deckCards,
    });

  it('K.O.’d in battle with 6 cards in hand (the boundary): draws 1', () => {
    const g = start(many(SC15.red2, 6));
    battleKo(g, at(g, 'p1', 'characters', HOG));
    expect(hand(g)).toHaveLength(7);
    expect(hand(g)).toContain(SC15.red4);
    expect(trash(g)).toEqual([HOG]);
  });

  it('7 cards in hand: the condition fails, nothing is drawn', () => {
    const g = start(many(SC15.red2, 7));
    battleKo(g, at(g, 'p1', 'characters', HOG));
    expect(hand(g)).toHaveLength(7);
    expect(hand(g)).not.toContain(SC15.red4);
    expect(deck(g)).toHaveLength(11);
  });

  it('an empty hand: draws 1', () => {
    const g = start([]);
    battleKo(g, at(g, 'p1', 'characters', HOG));
    expect(hand(g)).toEqual([SC15.red4]);
  });

  it('K.O.’d by the opponent’s effect also draws', () => {
    const g = start([SC15.red2]);
    koEffect(g, at(g, 'p1', 'characters', HOG));
    expect(hand(g)).toEqual([SC15.red2, SC15.red4].sort());
    expect(trash(g)).toEqual([HOG]);
  });

  it('returned to hand is not a K.O.: nothing is drawn', () => {
    const g = start([SC15.red2]);
    bounceEffect(g, at(g, 'p1', 'characters', HOG));
    expect(hand(g)).toEqual([HOG, SC15.red2].sort());
    expect(deck(g)).toHaveLength(11);
  });

  it('the draw is exactly 1 card', () => {
    const g = start([], deckTop([SC15.red4, SC15.red5]));
    battleKo(g, at(g, 'p1', 'characters', HOG));
    expect(hand(g)).toEqual([SC15.red4]);
  });
});
