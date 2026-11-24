/** OP14-100 Absalom. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, PURPLE, V } from './helpers.ts';
import {
  BW5,
  describeTbpTrigger,
  ids,
  koByEffect,
  OTHER_LEADER,
  settle,
  start,
  TBP4,
  TBP4B,
  TBP8,
} from './helpers-op14g4.ts';

const ID = 'OP14-100';
const run = (deck: string[]) => {
  const g = start({ leader: OTHER_LEADER, characters: [ID], deck });
  koByEffect(g, 'p1', ID);
  expectDecision(g, 'choose', 'p1');
  return g;
};

describe('OP14-100 Absalom', () => {
  it('[On K.O.] takes 1 {Thriller Bark Pirates} card of the top 3 (any category); the other 2 go to the bottom', () => {
    const g = run([BLUE, TBP8, V.c1, PURPLE, V.c2]);
    pick(g, [g.find('p1', 'deck', TBP8)]);
    settle(g);
    expect(hand(g, 'p1')).toEqual([TBP8]);
    const deck = ids(g, 'p1', 'deck');
    expect(deck).toHaveLength(4);
    expect(deck.slice(0, 2)).toEqual([PURPLE, V.c2]);
    expect(deck.slice(2).sort()).toEqual([BLUE, V.c1].sort());
  });

  it('only the top 3 are looked at: the 4th card is not offered', () => {
    const g = run([BLUE, V.c1, V.c2, TBP4]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'deck')[0]).toBe(TBP4);
  });

  it('"up to 1": may take nothing; all 3 go to the bottom, in an order the player picks', () => {
    const g = run([TBP4, TBP4B, BW5, V.c1]);
    none(g);
    expect(g.legal().some((a) => a.type === 'order')).toBe(true);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'deck')).toHaveLength(4);
    expect(ids(g, 'p1', 'deck')[0]).toBe(V.c1);
  });

  it('a Baroque Works card is not a {Thriller Bark Pirates} card', () => {
    const g = run([BW5, V.c1, V.c2]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
  });
});

describeTbpTrigger(ID);
