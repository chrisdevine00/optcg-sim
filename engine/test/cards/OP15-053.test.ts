/** OP15-053 Rebecca. */
import { describe, expect, it } from 'vitest';
import { dec, hand, none, pick, play, V } from './helpers.ts';
import { DRESS2, DRESS3, mine, orderAll, OTHER_LEADER } from './helpers-op15g2.ts';

const ID = 'OP15-053';

describe('OP15-053 Rebecca', () => {
  it('[DON!! x1] gains [Blocker] with 1 DON!! given, not with 0', () => {
    const g = mine(OTHER_LEADER, { characters: [{ card: ID, don: 1 }, ID] });
    const [a, b] = g.zone('p1', 'characters');
    expect(g.card(a!.instance).keywords).toContain('Blocker');
    expect(g.card(b!.instance).keywords).not.toContain('Blocker');
  });

  const start = (deck: string[]) => mine(OTHER_LEADER, { hand: [ID], deck });

  it('[On Play] look at 3, reveal up to 1 {Dressrosa} card to hand, the rest at the bottom in any order', () => {
    const g = start([V.c1, DRESS2, V.c2, V.c3, V.c4]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', DRESS2)]);
    // The owner orders the two cards going to the bottom: here V.c2 first.
    g.act({ type: 'order', first: g.find('p1', 'deck', V.c2) });
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([DRESS2]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 2)).toEqual([V.c3, V.c4]);
    expect(deck.slice(2)).toEqual([V.c2, V.c1]);
  });

  it('only the top 3 are looked at: a {Dressrosa} card in 4th place is not available', () => {
    const g = start([V.c1, V.c2, V.c3, DRESS2, V.c4]);
    play(g, ID);
    // No {Dressrosa} card among the 3: nothing to take, only the order of the rest.
    expect(
      dec(g)?.kind === 'choose' ? g.legal().filter((a) => a.type === 'pick') : [],
    ).toHaveLength(0);
    orderAll(g);
    if (dec(g)?.kind === 'choose') none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')[0]?.card).toBe(DRESS2);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });

  it('up to 1: with two {Dressrosa} cards only one can be taken, the other goes to the bottom', () => {
    const g = start([DRESS2, DRESS3, V.c1, V.c2]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', DRESS3)]);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([DRESS3]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck[0]).toBe(V.c2);
    expect([...deck.slice(1)].sort()).toEqual([DRESS2, V.c1].sort());
  });

  it('may take nothing: all 3 go to the bottom', () => {
    const g = start([DRESS2, V.c1, V.c2, V.c3]);
    play(g, ID);
    none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck').at(-1)?.card).not.toBe(V.c3);
    expect(g.zone('p1', 'deck')[0]?.card).toBe(V.c3);
  });
});
