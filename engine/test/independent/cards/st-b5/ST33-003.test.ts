/**
 * ST33-003 Smoker (Blue Character, cost 2, 3000, Counter +2000, Special, {Navy}).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: Place up to 2 of your opponent's Characters
 * with a cost of 2 or less at the bottom of the owner's deck."
 *
 * Rules: CR 8-4-4-1 ("up to"), RD 120 (a cost that cannot be paid cannot be paid at all), CR 3-1-7
 * (several cards entering a deck at once: their owner orders them).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  cardIds,
  decision,
  hand,
  LDB,
  mine,
  mayPayHand,
  need,
  no,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SB,
  T,
  trash,
  unusable,
  nChars,
  deck,
  act,
  kind,
} from './kit-stb5b.ts';

function setup(opp: string[] = [SB.c2p4, SB.c1p2], handExtra: string[] = [SB.c1p3]) {
  return mine(LDB.strike, { hand: [T.smoker, ...handExtra] }, { characters: opp });
}

/** Answer the owner's order decisions (if any) with the first listed order. */
function settleOrder(g: ReturnType<typeof setup>): void {
  for (let i = 0; i < 5 && kind(g) === 'order'; i++) {
    act(
      g,
      g.legal().find((a) => a.type === 'order')!,
    );
  }
}

describe('ST33-003 Smoker: [On Play] may trash 1: place up to 2 opposing cost-2-or-less Characters at the bottom of their deck', () => {
  it('trash 1: both chosen Characters leave the field and go to the bottom of their owner deck', () => {
    const g = setup();
    playRaw(g, T.smoker);
    mayPayHand(g, [SB.c1p3]);
    pickCards(g, [SB.c2p4, SB.c1p2]);
    settleOrder(g);
    expect(atMain(g)).toBe(true);
    expect(nChars(g, 'p2')).toBe(0);
    const d2 = cardIds(g, 'p2', 'deck');
    expect(d2).toHaveLength(17);
    expect(d2.slice(-2).sort()).toEqual([SB.c2p4, SB.c1p2].sort());
    expect(trash(g, 'p1')).toEqual([SB.c1p3]);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('the cards go to the OWNER deck, not the effect controller deck', () => {
    const g = setup();
    playRaw(g, T.smoker);
    mayPayHand(g, [SB.c1p3]);
    pickCards(g, [SB.c2p4, SB.c1p2]);
    settleOrder(g);
    expect(deck(g, 'p1')).toHaveLength(15);
    expect(deck(g, 'p2')).toHaveLength(17);
    expect(hand(g, 'p2')).toHaveLength(0);
  });

  it('cost boundary: cost 2 and cost 0 qualify, cost 3 does not', () => {
    const g = setup([SB.c2p4, SB.c2p0, SB.c3p5]);
    playRaw(g, T.smoker);
    mayPayHand(g, [SB.c1p3]);
    expect(offeredIds(g)).toEqual([SB.c2p0, SB.c2p4].sort());
  });

  it('"up to 2": one target is enough', () => {
    const g = setup();
    playRaw(g, T.smoker);
    mayPayHand(g, [SB.c1p3]);
    pickCards(g, [SB.c2p4]);
    settleOrder(g);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SB.c1p2]);
    expect(cardIds(g, 'p2', 'deck').at(-1)).toBe(SB.c2p4);
  });

  it('"up to 2": choosing nobody still pays the cost and places nothing', () => {
    const g = setup();
    playRaw(g, T.smoker);
    mayPayHand(g, [SB.c1p3]);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(nChars(g, 'p2')).toBe(2);
    expect(trash(g, 'p1')).toEqual([SB.c1p3]);
  });

  it('never more than 2 even with three eligible Characters', () => {
    const g = setup([SB.c2p4, SB.c1p2, SB.c2p0]);
    playRaw(g, T.smoker);
    mayPayHand(g, [SB.c1p3]);
    const d = need(g, 'choose');
    expect(d.max).toBe(2);
  });

  it('declining the "you may" trash: nothing is trashed and nothing is placed', () => {
    const g = setup();
    playRaw(g, T.smoker);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(nChars(g, 'p2')).toBe(2);
    expect(hand(g)).toEqual([SB.c1p3]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('RD 120: with an empty hand the cost cannot be paid and nothing is placed', () => {
    const g = mine(LDB.strike, { hand: [T.smoker] }, { characters: [SB.c2p4] });
    playRaw(g, T.smoker);
    unusable(g, 'p1');
    expect(decision(g)?.kind).toBe('main');
    expect(nChars(g, 'p2')).toBe(1);
  });

  it('only opposing Characters are candidates (own Characters of cost 2 are not)', () => {
    const g = mine(
      LDB.strike,
      { hand: [T.smoker, SB.c1p3], characters: [SB.c2p4] },
      { characters: [SB.c1p2] },
    );
    playRaw(g, T.smoker);
    mayPayHand(g, [SB.c1p3]);
    expect(offeredIds(g)).toEqual([SB.c1p2]);
  });

  it('the owner (p2) orders two Characters placed together: both bottom orders are reachable', () => {
    const results = new Set<string>();
    for (const firstCard of [SB.c2p4, SB.c1p2]) {
      const g = setup();
      playRaw(g, T.smoker);
      mayPayHand(g, [SB.c1p3]);
      pickCards(g, [SB.c2p4, SB.c1p2]);
      const d = need(g, 'order', 'p2');
      expect(d.options?.length).toBe(2);
      const pick = g.legal().find((a) => a.type === 'order' && g.card(a.first).card === firstCard);
      expect(pick).toBeDefined();
      act(g, pick!);
      settleOrder(g);
      results.add(cardIds(g, 'p2', 'deck').slice(-2).join('+'));
    }
    expect(results.size).toBe(2);
  });
});
