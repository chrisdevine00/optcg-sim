/** OP10-111 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  expectDecision,
  finishOrder,
  hand,
  idsOf,
  KID2,
  LUFFY_S,
  mk,
  none,
  pick,
  play,
  SUPER5,
  SUPER6,
  SUPER_RED3,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-111';
// Top 5: Luffy (excluded by name), Supernovas x3, a non-Supernovas; the 6th card is Supernovas but not looked at.
const DECK = [LUFFY_S, V.c1, SUPER5, SUPER_RED3, KID2, SUPER6];
const start = (deck: string[] = DECK) => mk({ hand: [ID], deck });

describe('OP10-111 Monkey.D.Luffy', () => {
  it('[On Play] look at 5, add a Supernovas card other than [Monkey.D.Luffy], the rest to the bottom', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', SUPER5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', SUPER_RED3))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', LUFFY_S))).toBe(false); // named [Monkey.D.Luffy]
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false); // not Supernovas
    expect(canPick(g, g.find('p1', 'deck', KID2))).toBe(false); // Kid Pirates only
    expect(canPick(g, g.find('p1', 'deck', SUPER6))).toBe(false); // 6th card: not looked at
    pick(g, [g.find('p1', 'deck', SUPER5)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SUPER5]);
    const deck = idsOf(g, 'p1', 'deck');
    expect(deck[0]).toBe(SUPER6);
    expect(deck).toHaveLength(5);
    expect([...deck.slice(1)].sort()).toEqual([LUFFY_S, V.c1, SUPER_RED3, KID2].sort());
  });

  it('the 5th card is still looked at (boundary)', () => {
    const g = start([V.c1, V.c2, V.c3, V.c4, SUPER5, SUPER6]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', SUPER5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', SUPER6))).toBe(false);
    pick(g, [g.find('p1', 'deck', SUPER5)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SUPER5]);
  });

  it('"up to 1": may add nothing; all 5 go to the bottom', () => {
    const g = start();
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(SUPER6);
    expect(idsOf(g, 'p1', 'deck')).toHaveLength(6);
  });

  it('a deck with only [Monkey.D.Luffy] as a Supernovas card offers no pick', () => {
    const g = start([LUFFY_S, V.c1, V.c2, V.c3, V.c4]);
    play(g, ID);
    // no eligible card: the pick (if asked) can only be empty
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    if (g.legal().some((a) => a.type === 'done')) none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
