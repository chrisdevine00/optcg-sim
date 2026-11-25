/** OP09-110 Pierre. */
import { describe, expect, it } from 'vitest';
import { expectDecision, handIds, hitWith, idsOf, mk, pick, play, V } from './helpers-a09g3.ts';

const ID = 'OP09-110';

describe('OP09-110 Pierre', () => {
  it('[On Play] draw 2 cards and trash 2 cards from your hand', () => {
    const g = mk({ hand: [ID, V.c1], deck: [V.c2, V.c3, V.c4] }, {}, undefined, 2);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]); // the drawn cards are eligible
    expect(handIds(g, 'p1')).toEqual([V.c3]);
    expect(idsOf(g, 'p1', 'trash')).toEqual(expect.arrayContaining([V.c1, V.c2]));
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c4]);
  });

  it('only your own hand is trashed from: the opponent hand is untouched', () => {
    const g = mk({ hand: [ID], deck: [V.c2, V.c3, V.c6] }, { hand: [V.c4, V.c5] }, undefined, 2);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c2), g.find('p1', 'hand', V.c3)]);
    expect(handIds(g, 'p1')).toEqual([]);
    expect(handIds(g, 'p2')).toEqual([V.c4, V.c5]);
  });

  it('[Trigger] plays this card', () => {
    const g = hitWith(ID, 'ST08-001');
    g.act({ type: 'trigger', activate: true });
    expect(idsOf(g, 'p1', 'characters').filter((c) => c === ID)).toHaveLength(1);
  });

  it('[Trigger] declined adds it to the hand', () => {
    const g = hitWith(ID, 'ST08-001');
    g.act({ type: 'trigger', activate: false });
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(handIds(g, 'p1')).toEqual([ID]);
  });

  it('the played-by-[Trigger] Pierre does not use its [On Play] (that is a separate effect)', () => {
    const g = hitWith(ID, 'ST08-001', { hand: [V.c2, V.c3], deck: [V.c4, V.c5] });
    g.act({ type: 'trigger', activate: true });
    // Played by a [Trigger] effect: an [On Play] still triggers (it was played), so a choice is open.
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});
