/** EB03-028 Yu. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, pick, play, times, trash, V } from './helpers.ts';
import { activate, cardsIn, mk } from './helpers-eb03g1.ts';

const ID = 'EB03-028';

describe('EB03-028 Yu', () => {
  it('[On Play]: trashes 1 card from your hand (your choice)', () => {
    const g = mk({ hand: [ID, V.c1, V.c2] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('[On Play] is mandatory: with a 1-card hand after playing it, that card is trashed', () => {
    const g = mk({ hand: [ID, V.c1] });
    play(g, ID);
    if (g.legal().some((a) => a.type === 'pick')) pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[On Play] with an empty hand: nothing happens', () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('[Activate: Main] trashes itself, then with 4 or less cards in hand draws 2', () => {
    const g = mk({ characters: [ID], hand: times(4, V.c1) });
    const deck = g.zone('p1', 'deck').length;
    activate(g, g.find('p1', 'characters', ID), 'draw');
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(hand(g, 'p1')).toHaveLength(6);
    expect(g.zone('p1', 'deck')).toHaveLength(deck - 2);
  });

  it('[Activate: Main] boundary: with 5 cards in hand it trashes itself and draws nothing', () => {
    const g = mk({ characters: [ID], hand: times(5, V.c1) });
    activate(g, g.find('p1', 'characters', ID), 'draw');
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(hand(g, 'p1')).toHaveLength(5);
  });

  it('[Activate: Main] with an empty hand draws 2', () => {
    const g = mk({ characters: [ID] });
    activate(g, g.find('p1', 'characters', ID), 'draw');
    expect(hand(g, 'p1')).toHaveLength(2);
  });
});
