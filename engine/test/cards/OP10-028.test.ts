/** OP10-028 Kouzuki Momonosuke. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, hand, none, pick, trash, V } from './helpers.ts';
import { activate, AKA, canPick, mk, offeredAb, settle } from './helpers-a10g1.ts';

const ID = 'OP10-028';
const deck5 = [AKA.c2, V.c1, AKA.c5, V.c2, AKA.c6];

describe('OP10-028 Kouzuki Momonosuke', () => {
  it('[Activate: Main]: rests 2 DON!! and trashes itself; reveals up to 2 "The Akazaya Nine" cards from the top 5, the rest to the bottom', () => {
    const g = mk({ characters: [ID], costArea: { active: 3, rested: 0 }, deck: [...deck5, V.c3] });
    activate(g, g.find('p1', 'characters', ID), 'search');
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
    expect(trash(g, 'p1')).toEqual([ID]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', AKA.c2), g.find('p1', 'deck', AKA.c6)]);
    expect(hand(g, 'p1').sort()).toEqual([AKA.c2, AKA.c6].sort());
    settle(g);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(4);
    expect(deck[0]).toBe(V.c3);
  });

  it('only "The Akazaya Nine" cards can be taken, and at most 2 of the 3 in the top 5', () => {
    const g = mk({ characters: [ID], deck: deck5 });
    activate(g, g.find('p1', 'characters', ID), 'search');
    expect(canPick(g, g.find('p1', 'deck', AKA.c2))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    expect(() =>
      pick(g, [
        g.find('p1', 'deck', AKA.c2),
        g.find('p1', 'deck', AKA.c5),
        g.find('p1', 'deck', AKA.c6),
      ]),
    ).toThrow(/can be picked now/);
  });

  it('"up to 2": 1 or none may be taken', () => {
    const g = mk({ characters: [ID], deck: deck5 });
    activate(g, g.find('p1', 'characters', ID), 'search');
    pick(g, [g.find('p1', 'deck', AKA.c5)]);
    expect(hand(g, 'p1')).toEqual([AKA.c5]);
    const h = mk({ characters: [ID], deck: deck5 });
    activate(h, h.find('p1', 'characters', ID), 'search');
    none(h);
    expect(hand(h, 'p1')).toEqual([]);
    expect(trash(h, 'p1')).toEqual([ID]);
  });

  it('looks only at the top 5: a 6th-place Akazaya card is not offered', () => {
    const g = mk({ characters: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, AKA.c2] });
    activate(g, g.find('p1', 'characters', ID), 'search');
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  it('is not offered with fewer than 2 active DON!! (the cost cannot be paid); exactly 2 is enough', () => {
    const g = mk({ characters: [ID], costArea: { active: 1, rested: 4 }, deck: deck5 });
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'search')).toBe(false);
    const h = mk({ characters: [ID], costArea: { active: 2, rested: 0 }, deck: deck5 });
    expect(offeredAb(h, h.find('p1', 'characters', ID), 'search')).toBe(true);
  });
});
