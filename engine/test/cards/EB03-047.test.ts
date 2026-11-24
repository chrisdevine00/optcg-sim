/** EB03-047 Miss.Valentine(Mikita). */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, play, times, trash, V } from './helpers.ts';
import { koByEffect } from './helpers-op14g4.ts';
import { mk } from './helpers-eb03g2.ts';

const ID = 'EB03-047';
const deck = [V.c1, V.c2, V.c3, V.c4, ...times(5, BLUE)];

describe('EB03-047 Miss.Valentine(Mikita)', () => {
  it('[On Play]: trashes 3 cards from the top of your deck', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    expect(trash(g, 'p1')).toEqual([V.c3, V.c2, V.c1]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(V.c4);
    expect(hand(g, 'p1')).toEqual([]);
    expectDecision(g, 'main', 'p1');
  });

  it('[On Play]: a deck of 2 cards is trashed entirely (as many as it holds)', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2] });
    play(g, ID);
    expect(g.zone('p1', 'deck')).toHaveLength(0);
    expect(trash(g, 'p1')).toEqual([V.c2, V.c1]);
  });

  it("[On Play]: only your own deck: the opponent's is untouched", () => {
    const g = mk({ hand: [ID], deck }, { deck: [V.c5, V.c6, V.c7, V.c1] });
    play(g, ID);
    expect(g.zone('p2', 'deck')).toHaveLength(4);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('[On K.O.]: draws 1 card', () => {
    const g = mk({ characters: [ID], deck });
    koByEffect(g, 'p1', ID);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('[On K.O.] draws and does not trash from the deck; [On Play] does not draw', () => {
    const g = mk({ characters: [ID], deck });
    koByEffect(g, 'p1', ID);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });
});
