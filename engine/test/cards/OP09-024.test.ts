/** OP09-024 Usopp. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { ids, mk, rested } from './helpers-a09g1.ts';

const ID = 'OP09-024';
const deck = [V.c2, V.c3, V.c4, V.c5, V.c6];
const two = [rested(V.c1), rested(V.c2)];

describe('OP09-024 Usopp', () => {
  it('[On Play]: with 2 rested Characters, draws 2 cards and trashes 2 cards from your hand', () => {
    const g = mk({ hand: [ID, V.c7], characters: two, deck });
    play(g, ID);
    expect(hand(g, 'p1').sort()).toEqual([V.c2, V.c3, V.c7].sort());
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c7), g.find('p1', 'hand', V.c2)]);
    expect(trash(g, 'p1').sort()).toEqual([V.c2, V.c7].sort());
    expect(hand(g, 'p1')).toEqual([V.c3]);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('exactly 2 are trashed, drawn cards included', () => {
    const g = mk({ hand: [ID], characters: two, deck });
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c2), g.find('p1', 'hand', V.c3)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1').sort()).toEqual([V.c2, V.c3].sort());
  });

  it('must not draw or trash with only 1 rested Character', () => {
    const g = mk({ hand: [ID, V.c7], characters: [rested(V.c1), V.c2], deck });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([V.c7]);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });

  it('Usopp is active when played, so he does not count toward the 2', () => {
    const g = mk({ hand: [ID], characters: [rested(V.c1)], deck });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([V.c1, ID]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('only your own rested Characters count: not a rested Leader, not the opponent rested Characters', () => {
    const g = mk(
      { leader: { card: 'ST01-001', rested: true }, hand: [ID], characters: [rested(V.c1)], deck },
      { characters: [rested(V.c1), rested(V.c2)] },
    );
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });
});
