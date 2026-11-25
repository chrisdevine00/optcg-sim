/** OP10-004 Vergo. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick, mk, PH, settle } from './helpers-a10g1.ts';

const ID = 'OP10-004';
const deck5 = [PH.c2, V.c1, ID, PH.c3, V.c2];

describe('OP10-004 Vergo', () => {
  it('[On Play]: reveals a {Punk Hazard} card to your hand; the other 4 go to the bottom in any order', () => {
    const g = mk({ hand: [ID], deck: [...deck5, V.c3, V.c4] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', PH.c3)]);
    expect(hand(g, 'p1')).toEqual([PH.c3]);
    settle(g);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(6);
    expect(deck.slice(0, 2)).toEqual([V.c3, V.c4]);
    expect(deck.slice(2).sort()).toEqual([PH.c2, V.c1, ID, V.c2].sort());
  });

  it('only {Punk Hazard} cards other than [Vergo] are selectable', () => {
    const g = mk({ hand: [ID], deck: [...deck5, V.c3, ID] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', PH.c2))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', PH.c3))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(false); // [Vergo] has the type but is named Vergo
  });

  it('"up to 1": two {Punk Hazard} cards cannot both be taken', () => {
    const g = mk({ hand: [ID], deck: deck5 });
    play(g, ID);
    expect(() => pick(g, [g.find('p1', 'deck', PH.c2), g.find('p1', 'deck', PH.c3)])).toThrow(
      /can be picked now/,
    );
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const g = mk({ hand: [ID], deck: [...deck5, V.c3] });
    play(g, ID);
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(V.c3);
  });

  it('looks only at the top 5: a {Punk Hazard} card in 6th place is not offered', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, PH.c2] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(dec(g)?.kind).not.toBe('order');
  });
});
