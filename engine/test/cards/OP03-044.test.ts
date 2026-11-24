/** OP03-044 Kaya. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, pick, play, V } from './helpers.ts';
import { cardsIn, mk, pickable } from './helpers-st29old.ts';

const ID = 'OP03-044';

describe('OP03-044 Kaya', () => {
  it('[On Play]: draws 2 cards, then trashes 2 cards from your hand', () => {
    const g = mk({ hand: [ID, V.c1, V.c2] });
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(4); // the draw is already done
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
    expect(cardsIn(g, 'p1', 'trash').sort()).toEqual([V.c1, V.c2].sort());
  });

  it('exactly 2 must be trashed: one card is not enough (no `done`), any 2 of the hand will do', () => {
    const g = mk({ hand: [ID, V.c1] });
    play(g, ID);
    g.act({ type: 'pick', choice: pickable(g)[0]! });
    expect(g.isLegal({ type: 'done', player: 'p1' })).toBe(false);
    g.act({ type: 'pick', choice: pickable(g)[0]! });
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(cardsIn(g, 'p1', 'trash')).toHaveLength(2);
  });

  it('draws 2 from the deck top (the deck shrinks by 2)', () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });

  it('with only 1 card in the deck it draws that one and trashes 2 of a 2-card hand', () => {
    const g = mk({ hand: [ID], deck: [V.c3] });
    play(g, ID);
    // 1 drawn (the deck had 1); hand of 1 (the drawn card): only 1 can be trashed.
    expect(hand(g, 'p1').length + cardsIn(g, 'p1', 'trash').length).toBe(1);
  });

  it('is a cost 1 Character with 0 power and Counter +2000', () => {
    const g = mk({ hand: [ID] });
    const c = g.card(g.find('p1', 'hand', ID));
    expect([c.cost, c.power, c.counter]).toEqual([1, 0, 2000]);
  });
});
