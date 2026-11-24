/** OP16-051 Mohji & Cabaji. */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, hand, play } from './helpers.ts';
import { mine } from './helpers-op16g2.ts';

const ID = 'OP16-051';

describe('OP16-051 Mohji & Cabaji', () => {
  const start = (others: number) =>
    mine({
      hand: [ID, ...Array.from({ length: others }, () => PURPLE)],
      deck: Array(6).fill(BLUE),
    });

  it('[On Play] with 5 or less cards in hand (after playing it): draws 2', () => {
    const g = start(5); // 5 left in hand once it is played
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(7);
    expect(hand(g, 'p1').filter((c) => c === BLUE)).toHaveLength(2);
  });

  it('with 6 cards in hand it does not draw', () => {
    const g = start(6);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(6);
    expect(hand(g, 'p1')).not.toContain(BLUE);
  });

  it('with an empty hand it draws 2', () => {
    const g = start(0);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
  });

  it('draws exactly 2, not more', () => {
    const g = start(2);
    play(g, ID);
    expect(g.zone('p1', 'deck')).toHaveLength(4);
  });
});
