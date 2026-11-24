/**
 * OP16-051 Mohji & Cabaji (Character, Blue, cost 6, 7000, Counter +1000, {Cross Guild}).
 *
 * Card text: "[On Play] If you have 5 or less cards in your hand, draw 2 cards."
 *
 * Rules: CR 8-4-1 (the card has left the hand when its [On Play] resolves), CR 8-1-2 (no "may": it is
 * mandatory), CR 4-5-3 (draw X), CR 8-3-3 (condition).
 */
import { describe, expect, it } from 'vitest';
import {
  backAtMain,
  BLUE,
  deck,
  don,
  fill,
  hand,
  inst,
  kind,
  LDR,
  mine,
  put,
  SCN,
  theirs,
  n,
} from './kit-op16b.ts';

const MC = 'OP16-051';
const TOP = [SCN.c7, SCN.c8, ...fill(BLUE, 8)];

/** Play Mohji & Cabaji from a hand of `others` plus itself. */
function play(others: number) {
  const g = mine(LDR.luffy, { hand: [MC, ...fill(SCN.c1, others)], deck: TOP });
  put(g, MC);
  return g;
}

describe('OP16-051 Mohji & Cabaji: [On Play] if you have 5 or less cards in hand, draw 2', () => {
  it('with 5 other cards in hand (the played card has left): draws 2', () => {
    const g = play(5);
    expect(backAtMain(g)).toBe(true);
    expect(hand(g)).toEqual([...fill(SCN.c1, 5), SCN.c7, SCN.c8].sort());
    expect(deck(g)).toHaveLength(8);
  });

  it('boundary: with 6 other cards in hand it draws nothing', () => {
    const g = play(6);
    expect(backAtMain(g)).toBe(true);
    expect(n(g, 'p1', 'hand')).toBe(6);
    expect(deck(g)).toHaveLength(10);
  });

  it('boundary: 4 other cards (and the played card itself would have made 5): draws 2', () => {
    const g = play(4);
    expect(n(g, 'p1', 'hand')).toBe(6);
  });

  it('an otherwise empty hand: draws 2', () => {
    const g = play(0);
    expect(hand(g)).toEqual([SCN.c7, SCN.c8].sort());
  });

  it('it is mandatory: no question is asked, the draw just happens', () => {
    const g = play(2);
    expect(kind(g)).toBe('main');
    expect(n(g, 'p1', 'hand')).toBe(4);
  });

  it('draws exactly 2 cards, no more, even with a big deck', () => {
    const g = play(0);
    expect(deck(g)).toHaveLength(8);
  });

  it('the cost 6 is paid as normal and the Character is on the field with 7000 power', () => {
    const g = play(0);
    expect(don(g)).toMatchObject({ active: 4, rested: 6 });
    expect(g.power(inst(g, 'p1', 'characters', MC))).toBe(7000);
  });

  it('the condition is checked on resolution against the field hand: a hand of exactly 5 before playing (4 after) draws', () => {
    const g = play(4);
    expect(deck(g)).toHaveLength(8);
    expect(n(g, 'p1', 'hand')).toBe(6);
  });

  it('must-not-happen: the opponent’s hand size is not what is counted (opponent with 9 cards, me with 6 others: no draw)', () => {
    const g = mine(LDR.luffy, { hand: [MC, ...fill(SCN.c1, 6)], deck: TOP }, { hand: [] });
    put(g, MC);
    expect(n(g, 'p1', 'hand')).toBe(6);
    const h = mine(LDR.luffy, { hand: [MC], deck: TOP }, { hand: fill(SCN.c1, 9) });
    put(h, MC);
    expect(n(h, 'p1', 'hand')).toBe(2);
  });

  it('only on play: not drawn when it is on the field already', () => {
    const g = theirs(LDR.luffy, { characters: [MC], deck: TOP }, {});
    expect(n(g, 'p1', 'hand')).toBe(0);
    expect(deck(g)).toHaveLength(10);
  });
});
