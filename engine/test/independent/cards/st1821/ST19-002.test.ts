/**
 * ST19-002 Sengoku (Black Character, cost 1, 1000, Counter +1000, {Navy}).
 * "[On Play] You may trash 2 black "Navy" type cards from your hand: If your Leader has the "Navy"
 * type, draw 3 cards."
 * Rules: "If" after the cost colon is an effect condition: the cost is paid first, and the draw only
 * happens when the Leader has {Navy} (also as one of several types). The cost needs 2 cards that are
 * both black and {Navy}; an unpayable optional cost over the hidden hand is still offered.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  atMain,
  BLUE,
  cost,
  deck,
  hand,
  LD,
  many,
  mine,
  need,
  no,
  offeredIds,
  offeredUnpayable,
  payHand,
  playId,
  reachablePickSets,
  SC,
  trash,
  yes,
} from './kit-st1821a.ts';

const ID = 'ST19-002';
const N1 = SC.bnavy1; // black {Navy}
const N2 = SC.bnavy2; // black {Navy}
const N3 = SC.bnavy3; // black {Navy}
const TOP = [SC.c2, SC.c3, SC.c4, SC.c5, ...many(BLUE, 8)];

function start(leader: string, h: string[], extra: Partial<PlayerSpec> = {}) {
  return mine(leader, { hand: [ID, ...h], deck: TOP, ...cost(10), ...extra });
}

describe('ST19-002 Sengoku: [On Play] trash 2 black {Navy} cards: if my Leader is {Navy}, draw 3', () => {
  it('pays 2 black {Navy} cards and, with a {Navy} Leader, draws exactly 3', () => {
    const g = start(LD.navy, [N1, N2]);
    playId(g, ID);
    yes(g, 'p1');
    payHand(g, [N1, N2]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([N1, N2].sort());
    expect(hand(g)).toEqual([SC.c2, SC.c3, SC.c4].sort());
    expect(deck(g)).toHaveLength(9);
  });

  it('only black {Navy} cards are offered for the cost', () => {
    const g = start(LD.navy, [N1, N2, N3, SC.navyBlue5, SC.bplain2, SC.c3]);
    playId(g, ID);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    // Unordered picks are listed in canonical order, so read the reachable selections instead.
    const used = new Set([...reachablePickSets(g)].flatMap((k) => k.split('+')).filter(Boolean));
    expect([...used].sort()).toEqual([N1, N2, N3].sort());
  });

  it('exactly 2 are trashed: a third black {Navy} card stays in hand', () => {
    const g = start(LD.navy, [N1, N2, N3]);
    playId(g, ID);
    yes(g, 'p1');
    payHand(g, [N1, N3]);
    expect(trash(g)).toEqual([N1, N3].sort());
    expect(hand(g)).toContain(N2);
    expect(hand(g)).toHaveLength(4);
  });

  it('a Leader without {Navy}: the cost is still paid but nothing is drawn', () => {
    const g = start(LD.luffy, [N1, N2]);
    playId(g, ID);
    yes(g, 'p1');
    payHand(g, [N1, N2]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([N1, N2].sort());
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(12);
  });

  it('a Leader with {Navy} among several types counts (Donquixote Rosinante, {Donquixote Pirates}/{Navy})', () => {
    const g = start('OP05-022', [N1, N2]);
    playId(g, ID);
    yes(g, 'p1');
    payHand(g, [N1, N2]);
    expect(hand(g)).toHaveLength(3);
  });

  it('with only 1 black {Navy} card (and a blue {Navy} one) the cost is offered but cannot be accepted', () => {
    const g = start(LD.navy, [N1, SC.navyBlue5]);
    playId(g, ID);
    offeredUnpayable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([N1, SC.navyBlue5].sort());
    expect(trash(g)).toEqual([]);
  });

  it('with an empty hand the optional cost is still offered (accept illegal): the prompt does not reveal the hand', () => {
    const g = start(LD.navy, []);
    playId(g, ID);
    offeredUnpayable(g, 'p1');
    expect(atMain(g)).toBe(true);
  });

  it('declining the cost: nothing is trashed, nothing is drawn', () => {
    const g = start(LD.navy, [N1, N2]);
    playId(g, ID);
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([N1, N2].sort());
    expect(deck(g)).toHaveLength(12);
  });

  it('Sengoku itself is not a candidate for the cost (it is on the field) and stays there', () => {
    const g = start(LD.navy, [N1, N2]);
    playId(g, ID);
    yes(g, 'p1');
    expect(offeredIds(g)).not.toContain(ID);
    payHand(g, [N1, N2]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});
