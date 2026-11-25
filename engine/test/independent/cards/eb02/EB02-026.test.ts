/**
 * EB02-026 Nefeltari Vivi (Character, Blue, cost 3, 2000, Counter +1000, {Alabasta}).
 *
 * Card text: "[On Play] If your Leader is multicolored and you have 5 or less cards in your hand,
 * draw 2 cards."
 *
 * Rules: a multicolored Leader has two colors; the hand is counted when the effect resolves, after
 * Vivi has left it (CR 2-7-2: the card is played before its effect resolves). No "up to": the draw
 * is mandatory when the condition holds.
 */
import { describe, expect, it } from 'vitest';
import { deck, decision, E2C, E2L, fill, hand, mine, playRaw } from './kit-eb02a.ts';

const VIVI = 'EB02-026';
/** EB02-010 Monkey.D.Luffy: Green/Purple Leader (multicolored). */
const MULTI_B = 'EB02-010';

function start(leader: string, others: number, deckSize = 14) {
  const g = mine(leader, {
    hand: [VIVI, ...fill(E2C.mohji, others)],
    deck: fill(E2C.sai, deckSize),
  });
  playRaw(g, VIVI);
  return g;
}

describe('EB02-026 Vivi: [On Play] with a multicolored Leader and 5 or less cards in hand, draw 2', () => {
  it('multicolored Leader and 5 other cards in hand: draws 2', () => {
    const g = start(E2L.multi, 5);
    expect(hand(g)).toHaveLength(7);
    expect(deck(g)).toHaveLength(12);
  });

  it('boundary: with 6 other cards in hand (6 after Vivi is played) nothing is drawn', () => {
    const g = start(E2L.multi, 6);
    expect(hand(g)).toHaveLength(6);
    expect(deck(g)).toHaveLength(14);
  });

  it('boundary: 4 other cards also draw', () => {
    const g = start(E2L.multi, 4);
    expect(hand(g)).toHaveLength(6);
  });

  it('Vivi alone in hand: she is played, then 0 cards are in hand, so 2 are drawn', () => {
    const g = start(E2L.multi, 0);
    expect(hand(g)).toHaveLength(2);
  });

  it('another multicolored Leader (EB02-010, green and purple) qualifies as well', () => {
    const g = start(MULTI_B, 3);
    expect(hand(g)).toHaveLength(5);
  });

  it('a single-color Leader does not draw, even with an empty hand', () => {
    const g = start(E2L.shc, 0);
    expect(hand(g)).toHaveLength(0);
    expect(deck(g)).toHaveLength(14);
  });

  it('exactly 2 cards are drawn (not more)', () => {
    const g = start(E2L.multi, 2);
    expect(hand(g)).toHaveLength(4);
    expect(deck(g)).toHaveLength(12);
  });

  it('the draw is mandatory: no prompt is asked, play ends in the Main Phase', () => {
    const g = start(E2L.multi, 2);
    expect(decision(g)?.kind).toBe('main');
  });

  it('a failed condition asks nothing either, and Vivi stays on the field', () => {
    const g = start(E2L.shc, 6);
    expect(decision(g)?.kind).toBe('main');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([VIVI]);
  });
});
