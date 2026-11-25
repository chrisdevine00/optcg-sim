/** OP09-069 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { BLACK_EVENT, canPick, HP1, HP4, mk, SH1, SH3, settle } from './helpers-a09g2.ts';

const ID = 'OP09-069';
/** {Straw Hat Crew} vanilla with cost 2 (FILM, Fish-Man). */
const SH2 = 'OP02-033';

describe('OP09-069 Trafalgar Law', () => {
  it('[On Play]: adds a {Heart Pirates} card with cost 2 or more; the other 3 go to the bottom in any order', () => {
    const g = mk({ hand: [ID], deck: [V.c1, HP4, V.c2, V.c3, V.c4, V.c5] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', HP4)]);
    expect(hand(g, 'p1')).toEqual([HP4]);
    settle(g);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 2)).toEqual([V.c4, V.c5]);
    expect(deck.slice(2).sort()).toEqual([V.c1, V.c2, V.c3].sort());
  });

  it('selectable: {Straw Hat Crew} or {Heart Pirates} with cost 2 or more (inclusive), any category', () => {
    const g = mk({ hand: [ID], deck: [HP4, HP1, SH1, SH2] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', HP4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', SH2))).toBe(true); // boundary: cost 2
    expect(canPick(g, g.find('p1', 'deck', HP1))).toBe(false); // cost 1
    expect(canPick(g, g.find('p1', 'deck', SH1))).toBe(false); // cost 1
    const e = mk({ hand: [ID], deck: [BLACK_EVENT, SH3, V.c3, V.c4] });
    play(e, ID);
    expect(canPick(e, e.find('p1', 'deck', BLACK_EVENT))).toBe(true); // a {Straw Hat Crew} Event, cost 3
    expect(canPick(e, e.find('p1', 'deck', SH3))).toBe(true);
    expect(canPick(e, e.find('p1', 'deck', V.c3))).toBe(false); // right cost, wrong type
  });

  it('looks only at the top 4: a matching card in 5th place is not offered', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4, HP4] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  it('"up to 1": two cards cannot both be taken', () => {
    const g = mk({ hand: [ID], deck: [HP4, SH3, V.c1, V.c2, V.c3] });
    play(g, ID);
    expect(() => pick(g, [g.find('p1', 'deck', HP4), g.find('p1', 'deck', SH3)])).toThrow(
      /can be picked now/,
    );
  });

  it('"up to 1": may take nothing; all 4 go to the bottom', () => {
    const g = mk({ hand: [ID], deck: [HP4, V.c1, V.c2, V.c3, V.c4] });
    play(g, ID);
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(V.c4);
  });
});
