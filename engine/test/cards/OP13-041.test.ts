/** OP13-041 Izo. */
import { describe, expect, it } from 'vitest';
import { hand, play } from './helpers.ts';
import { expectDecision, koBy, mk, V } from './helpers-op13g2.ts';

const ID = 'OP13-041';

describe('OP13-041 Izo', () => {
  it('[On Play]: draws 2 cards, with no choice asked', () => {
    const g = mk({ hand: [ID, V.c1] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });

  it('draws exactly 2, not more, from a deck of any size', () => {
    const g = mk({ hand: [ID], deck: Array.from({ length: 2 }, () => V.c1) });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c1]);
    expect(g.zone('p1', 'deck')).toHaveLength(0);
  });

  it('must not draw when K.O.ed (it has no [On K.O.])', () => {
    const g = mk({ characters: [ID], hand: [V.c1] });
    koBy(g, 'p1', ID, 'p2');
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it("must not draw for the opponent's Izo: the player who plays it draws", () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    expect(hand(g, 'p2')).toHaveLength(0);
  });
});
