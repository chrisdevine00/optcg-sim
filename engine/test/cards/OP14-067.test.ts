/** OP14-067 Dellinger. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, hand, none, pick, V } from './helpers.ts';
import { finishOrder } from './helpers-luffyace.ts';
import { canPick, DP3, DP5, DP_LEADER, idsOf, koedInBattle } from './helpers-op14g3.ts';

const ID = 'OP14-067';

describe('OP14-067 Dellinger', () => {
  const ko = (deck: string[]) =>
    koedInBattle(ID, { leader: DP_LEADER, deck, costArea: { active: 0, rested: 0 } });

  it('[On K.O.] add up to 1 DON!! rested, look at 5, add up to 1 {Donquixote Pirates} card to hand, the rest to the bottom', () => {
    const g = ko([V.c1, DP3, V.c2, V.c3, V.c4, V.c5, V.c6]);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', DP3))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'deck', DP3)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([DP3]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(6);
    expect(deck.slice(0, 2)).toEqual([V.c5, V.c6]);
    expect(deck.slice(2).sort()).toEqual([V.c1, V.c2, V.c3, V.c4].sort());
  });

  it('only the top 5 are looked at: a {Donquixote Pirates} card in 6th place is not offered', () => {
    const g = ko([V.c1, V.c2, V.c3, V.c4, V.c5, DP3, V.c6]);
    addMost(g);
    expect(g.legal().some((a) => a.type === 'pick' && a.choice === g.find('p1', 'deck', DP3))).toBe(
      false,
    );
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const g = ko([DP3, DP5, V.c2, V.c3, V.c4, V.c5]);
    addMost(g);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(V.c5);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
  });

  it('the DON!! add is "up to 1": declining it still lets you look', () => {
    const g = ko([DP3, V.c1, V.c2, V.c3, V.c4]);
    const d = expectDecision(g, 'choose');
    g.act({ type: 'pick', choice: { option: d.options!.at(-1)!.id } });
    expect(don(g, 'p1').rested).toBe(0);
    pick(g, [g.find('p1', 'deck', DP3)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([DP3]);
  });

  it('a deck of fewer than 5 cards looks at all of them', () => {
    const g = ko([V.c1, DP5]);
    addMost(g);
    pick(g, [g.find('p1', 'deck', DP5)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([DP5]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c1]);
  });
});
