/** OP10-025 Enel. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { ids, mk, NAVY, rested } from './helpers-a10g1.ts';

const ID = 'OP10-025';
const deck = [V.c2, V.c3, V.c4, V.c5, V.c6];
const two = [rested(V.c1), rested(NAVY.c1)];

describe('OP10-025 Enel', () => {
  it('[On Play]: with 2 rested Characters, draws 3 cards and trashes 2 cards from your hand', () => {
    const g = mk({ hand: [ID, V.c7], characters: two, deck });
    play(g, ID);
    expect(hand(g, 'p1').sort()).toEqual([V.c2, V.c3, V.c4, V.c7].sort());
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c7), g.find('p1', 'hand', V.c2)]);
    expect(trash(g, 'p1').sort()).toEqual([V.c2, V.c7].sort());
    expect(hand(g, 'p1').sort()).toEqual([V.c3, V.c4].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(2);
  });

  it('exactly 2 must be trashed: a drawn card may be trashed too', () => {
    const g = mk({ hand: [ID], characters: two, deck });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c3), g.find('p1', 'hand', V.c4)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('must not draw or trash with only 1 rested Character', () => {
    const g = mk({ hand: [ID, V.c7], characters: [rested(V.c1), V.c2], deck });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([V.c7]);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });

  it('Enel is not rested when played, so he does not count toward the 2', () => {
    const g = mk({ hand: [ID], characters: [rested(V.c1)], deck });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([V.c1, ID]);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
