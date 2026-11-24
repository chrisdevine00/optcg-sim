/** EB03-046 Miss Doublefinger(Zala). */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, play, times, trash, V } from './helpers.ts';
import { koByEffect } from './helpers-op14g4.ts';
import { COST8, costMod, mk } from './helpers-eb03g2.ts';

const ID = 'EB03-046';
const deck = [V.c2, V.c3, ...times(6, BLUE)];

describe('EB03-046 Miss Doublefinger(Zala)', () => {
  it('[On Play]: draws 1 when a Character has a cost of 8 or more (either side)', () => {
    const g = mk({ hand: [ID], deck }, { characters: [COST8] });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    const h = mk({ hand: [ID], deck, characters: [COST8] });
    play(h, ID);
    expect(hand(h, 'p1')).toEqual([V.c2]);
  });

  it('boundary: cost 7 does not count, cost 8 does', () => {
    const g = mk({ hand: [ID], deck }, { characters: [V.c7] });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([]);
    expectDecision(g, 'main', 'p1');
  });

  it('a Character whose cost is 0 counts (current cost); cost 1 does not', () => {
    const g = mk({ hand: [ID], deck }, { characters: [V.c1] });
    costMod(g, g.find('p2', 'characters', V.c1), -1);
    expect(g.card(g.find('p2', 'characters', V.c1)).cost).toBe(0);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    const h = mk({ hand: [ID], deck }, { characters: [V.c1] });
    play(h, ID);
    expect(hand(h, 'p1')).toEqual([]);
  });

  it('with no other Character (herself is cost 4) nothing is drawn', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('a cost raised to 8 counts (current cost, not the printed one)', () => {
    const g = mk({ hand: [ID], deck }, { characters: [V.c7] });
    costMod(g, g.find('p2', 'characters', V.c7), 1);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('[On K.O.]: trashes 2 cards from the top of your deck', () => {
    const g = mk({ characters: [ID], deck });
    koByEffect(g, 'p1', ID);
    expect(trash(g, 'p1')).toEqual([V.c3, V.c2, ID]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[On K.O.] with a 1-card deck trashes it (as many as it holds)', () => {
    const g = mk({ characters: [ID], deck: [V.c2] });
    koByEffect(g, 'p1', ID);
    expect(g.zone('p1', 'deck')).toHaveLength(0);
    expect(trash(g, 'p1')).toContain(V.c2);
  });
});
