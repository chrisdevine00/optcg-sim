/** OP09-002 Uta. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick, cardsOf, finishOrder, mk, RHP } from './helpers-a09g1.ts';

const ID = 'OP09-002';
// Top 5: a {Red-Haired Pirates} 6000, a vanilla, a {Red-Haired Pirates} 7000, two vanillas; 6th: vanilla.
const deck = [RHP.c4, V.c1, RHP.c5, V.c2, V.c3, V.c4];

describe('OP09-002 Uta', () => {
  it('[On Play]: look at 5, reveal up to 1 {Red-Haired Pirates} card and add it to your hand, the rest go to the bottom', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', RHP.c4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', RHP.c5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'deck', RHP.c5)]);
    expect(hand(g, 'p1')).toEqual([RHP.c5]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(RHP.c5);
    finishOrder(g);
    expectDecision(g, 'main', 'p1');
    const after = cardsOf(g, 'p1', 'deck');
    expect(after).toHaveLength(deck.length - 1);
    expect(after[0]).toBe(V.c4); // the 6th card was not looked at: it is now on top
    expect([...after.slice(1)].sort()).toEqual([RHP.c4, V.c1, V.c2, V.c3].sort());
  });

  it('may take nothing even with a match in the 5 cards (CR 8-4-4-2)', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    const after = cardsOf(g, 'p1', 'deck');
    expect(after).toHaveLength(deck.length);
    expect(after[0]).toBe(V.c4);
  });

  it('only the top 5 are looked at: a {Red-Haired Pirates} card in 6th place is not offered', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, RHP.c4] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', RHP.c4))).toBe(false);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(RHP.c4);
  });

  it('takes at most 1 card although both {Red-Haired Pirates} cards are in the 5', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    pick(g, [g.find('p1', 'deck', RHP.c4), g.find('p1', 'deck', RHP.c5)].slice(0, 1));
    finishOrder(g);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('needs no Leader type: it works with a Leader that is not {Red-Haired Pirates}', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', RHP.c4))).toBe(true);
  });
});
