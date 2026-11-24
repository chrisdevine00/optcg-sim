/**
 * OP14-085 Miss.Goldenweek(Marianne) (Character, Black, cost 1, 2000, Counter +2000, {Baroque Works}).
 *
 * Card text: "[On K.O.] Draw 2 cards and trash 2 cards from your hand."
 *
 * Rules: [On K.O.] (CR 10-2-17, also after an effect K.O.), the effect is mandatory (no "may"), draw
 * first then trash exactly 2 from the whole hand (the drawn cards included), a player whose deck
 * reaches 0 cards loses at once, even in the middle of an effect (RL-26: "Draw 2" with 1 card left
 * draws 1 and loses).
 */
import { describe, expect, it } from 'vitest';
import { koEffect } from '../op15/kit-op15c.ts';
import {
  at,
  backToMain,
  BLUE,
  chars,
  decision,
  deck,
  hand,
  kind,
  koGame,
  LD14,
  LIGHTNING,
  mine,
  need,
  reachablePickSets,
  pickCards,
  playRaw,
  result,
  SC14,
  theirs,
  trash,
} from './kit-op14c.ts';

const ID = 'OP14-085';
const D1 = SC14.c2;
const D2 = SC14.c3;
const full = [D1, D2, ...Array.from({ length: 10 }, () => BLUE)];

function ko(h: string[], deckCards: string[] = full) {
  return koGame(ID, { p1: { hand: h, deck: deckCards } });
}

describe('OP14-085 Miss.Goldenweek [On K.O.] draw 2 cards, trash 2 cards from my hand', () => {
  it('draws exactly 2 from the top of the deck and asks me to trash exactly 2 from the hand', () => {
    const g = ko([SC14.c1]);
    need(g, 'choose', 'p1');
    expect(decision(g)).toMatchObject({ min: 2, max: 2 });
    expect(deck(g)).toHaveLength(10);
    expect(deck(g)[0]).toBe(BLUE);
  });

  it('the trash pick offers the whole hand, the two drawn cards included', () => {
    const g = ko([SC14.c1]);
    need(g, 'choose', 'p1');
    // Exact-2 picks list only the cards that can start a selection, so read the reachable pairs.
    const pairs = reachablePickSets(g);
    expect(pairs).toEqual(
      new Set(
        [
          [SC14.c1, D1],
          [SC14.c1, D2],
          [D1, D2],
        ].map((p) => [...p].sort().join('+')),
      ),
    );
  });

  it('trashing 2 of the 3 leaves 1 card in hand; both go to the trash with the K.O.d Character', () => {
    const g = ko([SC14.c1]);
    pickCards(g, [SC14.c1, D2]);
    backToMain(g, 'p2');
    expect(hand(g)).toEqual([D1]);
    expect(trash(g)).toEqual([ID, SC14.c1, D2].sort());
  });

  it('draw comes before trash: the two just-drawn cards may be the ones trashed', () => {
    const g = ko([SC14.c1]);
    pickCards(g, [D1, D2]);
    backToMain(g, 'p2');
    expect(hand(g)).toEqual([SC14.c1]);
    expect(trash(g)).toEqual([ID, D1, D2].sort());
  });

  it('with an empty hand the 2 drawn cards are trashed (nothing left to choose)', () => {
    const g = ko([]);
    if (kind(g) === 'choose') pickCards(g, [D1, D2]);
    backToMain(g, 'p2');
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, D1, D2].sort());
  });

  it('with a bigger hand the same 2 are trashed, choosing among 5 cards', () => {
    const g = ko([SC14.c1, SC14.c4, SC14.c5]);
    need(g, 'choose', 'p1');
    // 5 cards in hand: 10 distinct pairs can be trashed.
    expect(reachablePickSets(g).size).toBe(10);
    pickCards(g, [SC14.c4, SC14.c5]);
    backToMain(g, 'p2');
    expect(hand(g)).toEqual([SC14.c1, D1, D2].sort());
  });

  it('it is mandatory: no "use?" question is put to me', () => {
    const g = ko([SC14.c1]);
    expect(kind(g)).not.toBe('optional');
  });

  it('a deck of exactly 2 is emptied by the draw: I lose at once (RL-26)', () => {
    const g = ko([SC14.c1], [D1, D2]);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('a deck of 1 card: "draw 2" draws 1, empties the deck and I lose (RL-26)', () => {
    const g = ko([SC14.c1], [D1]);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('works after an effect K.O. as well', () => {
    const g = theirs(
      LD14.bw,
      { characters: [ID], hand: [SC14.c1], deck: full },
      { hand: [LIGHTNING], costArea: { active: 9, rested: 0 } },
    );
    koEffect(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    pickCards(g, [SC14.c1, D1]);
    expect(hand(g)).toEqual([D2]);
  });

  it('must not fire on play: playing it draws nothing', () => {
    const g = mine(LD14.bw, { hand: [ID], costArea: { active: 3, rested: 0 } });
    playRaw(g, ID);
    backToMain(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(chars(g)).toEqual([ID]);
  });
});
