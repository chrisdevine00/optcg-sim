/** EB03-058 Lilith. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, play, trash, V } from './helpers.ts';
import { damageWith } from './triggers.ts';
import { cardsIn, mk, VEGAPUNK_LEADER } from './helpers-eb03g2.ts';

const ID = 'EB03-058';
const deck = [V.c2, V.c3, BLUE, BLUE];

describe('EB03-058 Lilith', () => {
  it('[Your Turn] [On Play]: with 2 or less Life cards, draws 1', () => {
    const g = mk({ hand: [ID], life: [V.c1, V.c1], deck });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('boundary: 3 Life cards draw nothing, 0 Life cards draw', () => {
    const g = mk({ hand: [ID], life: [V.c1, V.c1, V.c1], deck });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([]);
    expectDecision(g, 'main', 'p1');
    const h = mk({ hand: [ID], life: [], deck });
    play(h, ID);
    expect(hand(h, 'p1')).toEqual([V.c2]);
  });

  it('[Trigger] with [Vegapunk] as Leader: plays this card (on the opponent turn, so no draw)', () => {
    const g = damageWith(ID, { leader: VEGAPUNK_LEADER, deck });
    g.act({ type: 'trigger', activate: true });
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([]); // [Your Turn] [On Play] does not fire on the opponent's turn
    expect(g.life('p1')).toBe(1);
  });

  it('[Trigger] with another Leader: nothing is played and the card is trashed', () => {
    const g = damageWith(ID, { deck });
    g.act({ type: 'trigger', activate: true });
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('[Trigger] may be declined: the card goes to the hand', () => {
    const g = damageWith(ID, { leader: VEGAPUNK_LEADER, deck });
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
  });
});
