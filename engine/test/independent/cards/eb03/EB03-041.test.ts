/**
 * EB03-041 Kujyaku (Character, Black, cost 4, 6000, no Counter, {Navy}/{SWORD}).
 *
 * Card text: "[Opponent's Turn] All of your {SWORD} type Characters with a cost of 6 or less gain
 * +2000 power.
 * [On Play] You may trash 1 {Navy} type card from your hand: Draw 2 cards."
 *
 * Rules: CR 8-1-3 (permanent effects with a timing header apply only in that turn), CR 2-4-3
 * (exact type: {Neo Navy} is not {Navy}), CR 8-3-1 ("you may" cost, all or nothing).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  answerMay,
  atMain,
  BLUE,
  C14,
  canFinish,
  chars,
  hand,
  LB,
  mine,
  mustBeUnpayable,
  need,
  offeredIds,
  deck,
  payHand,
  put,
  theirs,
  trash,
} from './kit-eb03b.ts';

const ID = 'EB03-041';
const DRAKE6 = 'OP11-017'; // {Drake Pirates}/{Navy}/{SWORD}, cost 6, 7000, Counter +2000, vanilla
const KOBY7 = 'P-092'; // {Navy}/{SWORD}, cost 7, 7000
const KOBY8 = 'OP11-119'; // {Navy}/{SWORD}, cost 8, 9000
const KOMILLE = 'OP02-097'; // {Navy}, cost 1, 3000, vanilla (not SWORD)
const DOBERMAN = 'OP02-107'; // {Navy}, cost 2, 4000, vanilla
const BINS = 'ST05-013'; // {FILM}/{Neo Navy}, cost 4, vanilla: not {Navy}
const MARCO = C14.marco;

describe("EB03-041 Kujyaku: [Opponent's Turn] my {SWORD} Characters of cost 6 or less gain +2000; [On Play] trash a {Navy} card: draw 2", () => {
  it("on the opponent's turn Kujyaku itself has +2000 (8000); on my turn it has its printed 6000", () => {
    const mineTurn = mine(LB.luffy, { characters: [ID] });
    expect(mineTurn.power(mineTurn.find('p1', 'characters', ID))).toBe(6000);
    const theirTurn = theirs(LB.luffy, { characters: [ID] });
    expect(theirTurn.power(theirTurn.find('p1', 'characters', ID))).toBe(8000);
  });

  it("another {SWORD} Character with cost exactly 6 gets +2000 on the opponent's turn, and not on mine", () => {
    const t = theirs(LB.luffy, { characters: [ID, DRAKE6] });
    expect(t.power(t.find('p1', 'characters', DRAKE6))).toBe(7000 + 2000);
    const m = mine(LB.luffy, { characters: [ID, DRAKE6] });
    expect(m.power(m.find('p1', 'characters', DRAKE6))).toBe(7000);
  });

  it('with Kujyaku in play the cost-6 {SWORD} Character is boosted; the same Character alone is not', () => {
    const alone = theirs(LB.luffy, { characters: [DRAKE6] });
    expect(alone.power(alone.find('p1', 'characters', DRAKE6))).toBe(7000);
    const together = theirs(LB.luffy, { characters: [ID, DRAKE6] });
    expect(together.power(together.find('p1', 'characters', DRAKE6))).toBe(9000);
  });

  it('a {SWORD} Character with cost 7 or 8 is not boosted', () => {
    const g = theirs(LB.luffy, { characters: [ID, KOBY7, KOBY8] });
    expect(g.power(g.find('p1', 'characters', KOBY8))).toBe(9000);
    // P-092's own printed power is 7000; whatever it does on its own, Kujyaku adds nothing.
    expect(g.power(g.find('p1', 'characters', KOBY7))).toBeLessThanOrEqual(7000);
  });

  it('a non-{SWORD} Character (a {Navy} one, and an unrelated one) is not boosted', () => {
    const g = theirs(LB.luffy, { characters: [ID, KOMILLE, MARCO] });
    expect(g.power(g.find('p1', 'characters', KOMILLE))).toBe(3000);
    expect(g.power(g.find('p1', 'characters', MARCO))).toBe(5000);
  });

  it('the opponent\'s {SWORD} Characters are not boosted ("your")', () => {
    const g = theirs(LB.luffy, { characters: [ID] }, { characters: [DRAKE6] });
    expect(g.power(g.find('p2', 'characters', DRAKE6))).toBe(7000);
  });

  it('[On Play]: trash a {Navy} card from hand, draw 2 cards', () => {
    const g = mine(LB.luffy, { hand: [ID, KOMILLE, MARCO] });
    const deckBefore = deck(g).length;
    put(g, ID);
    answerMay(g, true);
    payHand(g, [KOMILLE]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([KOMILLE]);
    expect(hand(g).sort()).toEqual([BLUE, BLUE, MARCO].sort());
    expect(deck(g)).toHaveLength(deckBefore - 2);
  });

  it('the cost offers {Navy} cards only: not {Neo Navy}, not other cards', () => {
    const g = mine(LB.luffy, { hand: [ID, KOMILLE, DOBERMAN, BINS, MARCO] });
    put(g, ID);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DOBERMAN, KOMILLE].sort());
  });

  it('with no {Navy} card in hand (only a {Neo Navy} and an unrelated card) the cost cannot be paid: nothing is drawn', () => {
    const g = mine(LB.luffy, { hand: [ID, BINS, MARCO] });
    const deckBefore = deck(g).length;
    put(g, ID);
    mustBeUnpayable(g);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(deckBefore);
    expect(hand(g)).toEqual([BINS, MARCO].sort());
  });

  it('declining the cost: nothing is trashed and nothing is drawn', () => {
    const g = mine(LB.luffy, { hand: [ID, KOMILLE] });
    const deckBefore = deck(g).length;
    put(g, ID);
    answerMay(g, false);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([KOMILLE]);
    expect(deck(g)).toHaveLength(deckBefore);
    expect(chars(g)).toEqual([ID]);
    void act;
    void canFinish;
  });
});
