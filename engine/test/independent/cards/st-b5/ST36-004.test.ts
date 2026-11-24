/**
 * ST36-004 Bartolomeo (Yellow Character, cost 1, 2000, Counter +1000, Special, {Supernovas}/{Dressrosa}/{Barto Club}).
 *
 * Card text: "[On Play] You may trash 1 {Supernovas} type card from your hand: Draw 2 cards."
 *
 * Rules: RD 120 (an unpayable cost cannot be paid), exact-N cost, draw after the cost, RL-26.
 */
import { describe, expect, it } from 'vitest';
import { result } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  deck,
  fill,
  hand,
  LDB,
  mayPayHand,
  mine,
  no,
  offeredIds,
  playRaw,
  SB,
  T,
  trash,
  TY,
  unusable,
  yes,
} from './kit-stb5b.ts';

const BARTO = T.barto;
const TOP = [SB.c3p5, SB.c4p6];

function setup(handExtra: string[], deck_: string[] = [...TOP, ...fill(BLUE, 13)]) {
  return mine(LDB.slash, { hand: [BARTO, ...handExtra], deck: deck_ });
}

describe('ST36-004 Bartolomeo: [On Play] may trash 1 Supernovas card from hand: draw 2', () => {
  it('trash a {Supernovas} card: the top 2 cards are drawn', () => {
    const g = setup([TY.supernovas]);
    playRaw(g, BARTO);
    mayPayHand(g, [TY.supernovas]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([TY.supernovas]);
    expect(hand(g)).toEqual([...TOP].sort());
    expect(deck(g)).toHaveLength(13);
  });

  it('only {Supernovas} cards can pay: a card of another type is not offered', () => {
    const g = setup([TY.supernovas, SB.c1p3, SB.c2p4]);
    playRaw(g, BARTO);
    yes(g);
    expect(offeredIds(g)).toEqual([TY.supernovas]);
  });

  it('several {Supernovas} cards in hand: all are offered, one is trashed', () => {
    const g = setup([TY.supernovas, TY.supernovas2, SB.c1p3]);
    playRaw(g, BARTO);
    yes(g);
    expect(offeredIds(g)).toEqual([TY.supernovas, TY.supernovas2].sort());
  });

  it('RD 120: a hand without a {Supernovas} card cannot pay: nothing is drawn', () => {
    const g = setup([SB.c1p3, SB.c2p4]);
    playRaw(g, BARTO);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SB.c1p3, SB.c2p4].sort());
    expect(deck(g)).toHaveLength(15);
  });

  it('RD 120: an empty hand cannot pay', () => {
    const g = setup([]);
    playRaw(g, BARTO);
    unusable(g, 'p1');
    expect(deck(g)).toHaveLength(15);
    expect(hand(g)).toEqual([]);
  });

  it('declining the "you may": nothing is trashed or drawn', () => {
    const g = setup([TY.supernovas]);
    playRaw(g, BARTO);
    no(g);
    expect(hand(g)).toEqual([TY.supernovas]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('exactly 2 cards are drawn, not 1 and not 3', () => {
    const g = setup([TY.supernovas, SB.c1p3]);
    playRaw(g, BARTO);
    mayPayHand(g, [TY.supernovas]);
    expect(hand(g)).toHaveLength(3);
    expect(deck(g)).toHaveLength(13);
  });

  it('a printed {Supernovas} card from the Apoo line pays too (ST36-003)', () => {
    const g = setup([T.apoo]);
    playRaw(g, BARTO);
    mayPayHand(g, [T.apoo]);
    expect(trash(g)).toEqual([T.apoo]);
    expect(hand(g)).toEqual([...TOP].sort());
  });

  it('the cost is paid before the draw: a drawn {Supernovas} card cannot pay', () => {
    const g = setup([SB.c1p3], [TY.supernovas, TY.supernovas2, ...fill(BLUE, 13)]);
    playRaw(g, BARTO);
    unusable(g, 'p1');
    expect(hand(g)).toEqual([SB.c1p3]);
  });

  it('RL-26: drawing the last 2 cards empties the deck and loses the game', () => {
    const g = setup([TY.supernovas], [SB.c3p5, SB.c4p6]);
    playRaw(g, BARTO);
    mayPayHand(g, [TY.supernovas]);
    expect(deck(g)).toHaveLength(0);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });
});
