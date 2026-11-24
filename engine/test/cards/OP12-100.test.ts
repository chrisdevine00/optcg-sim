/** OP12-100 Sabo. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { cardsIn, mk, rep } from './helpers-op12g3.ts';

const ID = 'OP12-100';

describe('OP12-100 Sabo', () => {
  it('with 3 or less Life: [Blocker] and +3 cost (5 becomes 8)', () => {
    const g = mk({ characters: [ID], life: rep(3, V.c1) });
    const c = g.card(g.find('p1', 'characters', ID));
    expect(c.keywords).toContain('Blocker');
    expect(c.cost).toBe(8);
  });

  it('boundary: 4 Life: no [Blocker], cost stays 5; it follows the Life count live', () => {
    const g = mk({ characters: [ID], life: rep(4, V.c1) });
    const c = g.card(g.find('p1', 'characters', ID));
    expect(c.keywords).not.toContain('Blocker');
    expect(c.cost).toBe(5);
  });

  it('[On Play] add the top Life card to your hand: draws 2 cards, then trashes 1 card from the hand', () => {
    const g = mk({ hand: [ID, V.c1], life: [V.c5, V.c6, V.c7], deck: [V.c2, V.c3, V.c4] });
    play(g, ID);
    accept(g);
    expect(g.life('p1')).toBe(2);
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c5, V.c2, V.c3].sort());
    pick(g, [g.find('p1', 'hand', V.c5)]);
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c2, V.c3].sort());
    expect(trash(g, 'p1')).toEqual([V.c5]);
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c4]);
  });

  it('declining the cost: Life, hand and deck are untouched', () => {
    const g = mk({ hand: [ID, V.c1], life: [V.c5, V.c6, V.c7], deck: [V.c2, V.c3, V.c4] });
    play(g, ID);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(cardsIn(g, 'p1', 'deck')).toHaveLength(3);
  });

  it('with no Life cards the cost cannot be paid and nothing is offered', () => {
    const g = mk({ hand: [ID], life: [], deck: [V.c2, V.c3] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toHaveLength(0);
  });
});
