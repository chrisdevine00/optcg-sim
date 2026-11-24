/** OP12-047 Sengoku. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  dec,
  expectDecision,
  hand,
  none,
  pick,
  play,
  times,
  trash,
  V,
} from './helpers.ts';
import { finishOrder } from './helpers-luffyace.ts';
import { BN, ids, mine, NAVY_PURPLE, offered } from './helpers-op12g2.ts';

const ID = 'OP12-047';
const SENGOKU = BN.c5; // another [Sengoku], {Navy}: excluded by name

// Top 5: three {Navy} cards other than [Sengoku], [Sengoku] and a non-Navy card; then 5 more.
const top5 = [BN.c4, NAVY_PURPLE, BN.c6, SENGOKU, V.c1];

describe('OP12-047 Sengoku', () => {
  const onPlay = (deckTop: string[] = top5) => {
    const g = mine({ hand: [ID, V.c2], deck: [...deckTop, ...times(5, BLUE)] });
    play(g, ID);
    return g;
  };

  it('You may trash 1 card: look at 5, add up to 2 {Navy} cards other than [Sengoku], the rest to the bottom', () => {
    const g = onPlay();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    pick(g, [g.find('p1', 'deck', BN.c4), g.find('p1', 'deck', BN.c6)]);
    finishOrder(g);
    expect(hand(g, 'p1').sort()).toEqual([BN.c4, BN.c6].sort());
    const deck = ids(g, 'p1', 'deck');
    expect(deck).toHaveLength(8);
    expect(deck.slice(5).sort()).toEqual([NAVY_PURPLE, SENGOKU, V.c1].sort());
  });

  it('candidates: {Navy} only, [Sengoku] excluded by name, and at most 2 may be taken', () => {
    const g = onPlay();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expectDecision(g, 'choose', 'p1');
    const cands = offered(g);
    expect(cands).toContain(g.find('p1', 'deck', BN.c4));
    expect(cands).toContain(g.find('p1', 'deck', NAVY_PURPLE));
    expect(cands).toContain(g.find('p1', 'deck', BN.c6));
    expect(cands).not.toContain(g.find('p1', 'deck', SENGOKU));
    expect(cands).not.toContain(g.find('p1', 'deck', V.c1));
    // Take two (the canonical order lets the earliest candidates be chosen first).
    g.act(g.legal().find((x) => x.type === 'pick')!);
    g.act(g.legal().find((x) => x.type === 'pick')!);
    // The pick is full: a third Navy card cannot be taken.
    finishOrder(g);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('"up to 2": 1 card, or none, is allowed (CR 8-4-4-2)', () => {
    const g = onPlay();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    pick(g, [g.find('p1', 'deck', NAVY_PURPLE)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([NAVY_PURPLE]);
    const h = onPlay();
    accept(h);
    pick(h, [h.find('p1', 'hand', V.c2)]);
    none(h);
    finishOrder(h);
    expect(hand(h, 'p1')).toEqual([]);
    expect(ids(h, 'p1', 'deck')).toHaveLength(10);
  });

  it('boundary: the 6th card of the deck is not looked at', () => {
    const g = onPlay([V.c1, V.c3, V.c4, V.c5, V.c6, BN.c4]);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(offered(g)).toHaveLength(0);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('declining the cost: nothing is trashed or looked at', () => {
    const g = onPlay();
    decline(g);
    expect(dec(g)?.kind).toBe('main');
    expect(trash(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'deck')).toHaveLength(10);
    expect(ids(g, 'p1', 'deck').slice(0, 5)).toEqual(top5);
  });
});
