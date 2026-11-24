/**
 * OP16-087 Shinobu (Character, Black, cost 2, 1000, Counter +2000, {Land of Wano}).
 *
 * Card text: "[On Play] You may trash this Character: If your Leader has the {Land of Wano} type, draw
 * 1 card and up to 1 of your [Kouzuki Momonosuke] gains +20 cost during this turn."
 *
 * Rules: CR 8-3-1-3 (cost), CR 8-4-4-1 ("up to"), CR 6-6-1-3 ("during this turn"), RD 122 (a failed
 * "If" ends the effect; the cost stays paid).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  cardIds,
  chars,
  deck,
  deckOf,
  hand,
  kind,
  LD16,
  need,
  no,
  none,
  offeredIds,
  p1main,
  pickCards,
  playIt,
  SC16,
  toMyNextMain,
  trash,
  yes,
} from './kit-op16c.ts';

const ID = 'OP16-087';
const MOMO = SC16.momo6; // [Kouzuki Momonosuke], cost 6

function start(o: { leader?: string; field?: string[]; opp?: string[]; hand?: string[] } = {}) {
  const g = p1main(
    o.leader ?? LD16.wano,
    { hand: [ID, ...(o.hand ?? [])], characters: o.field ?? [MOMO], deck: deckOf([SC16.wano3]) },
    { characters: o.opp ?? [] },
  );
  playIt(g, ID);
  return g;
}

describe('OP16-087 Shinobu: [On Play] may trash this: draw 1, a [Kouzuki Momonosuke] gains +20 cost', () => {
  it('yes: Shinobu is trashed, I draw 1 and the chosen [Kouzuki Momonosuke] has cost 26', () => {
    const g = start();
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickCards(g, [MOMO]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([SC16.wano3]);
    expect(g.card(at(g, 'p1', 'characters', MOMO)).cost).toBe(26);
    expect(chars(g)).toEqual([MOMO]);
  });

  it('declining: Shinobu stays on the field, nothing is drawn, the cost is unchanged', () => {
    const g = start();
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(chars(g).sort()).toEqual([ID, MOMO].sort());
    expect(hand(g)).toEqual([]);
    expect(g.card(at(g, 'p1', 'characters', MOMO)).cost).toBe(6);
  });

  it('only [Kouzuki Momonosuke] is a candidate: other Characters (and the other Momonosuke of the opponent) are not offered', () => {
    const g = start({ field: [MOMO, SC16.wano3, SC16.momo2], opp: [SC16.momo6] });
    yes(g, 'p1');
    expect(offeredIds(g)).toEqual([MOMO, SC16.momo2].sort());
  });

  it('"up to 1": exactly one Momonosuke gains the cost even with two on the field', () => {
    const g = start({ field: [MOMO, SC16.momo2] });
    yes(g, 'p1');
    pickCards(g, [SC16.momo2]);
    expect(g.card(at(g, 'p1', 'characters', SC16.momo2)).cost).toBe(22);
    expect(g.card(at(g, 'p1', 'characters', MOMO)).cost).toBe(6);
  });

  it('"up to 1": choosing nobody still draws the card', () => {
    const g = start();
    yes(g, 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC16.wano3]);
    expect(g.card(at(g, 'p1', 'characters', MOMO)).cost).toBe(6);
  });

  it('with no [Kouzuki Momonosuke] on the field the draw still happens', () => {
    const g = start({ field: [SC16.wano5] });
    yes(g, 'p1');
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC16.wano3]);
  });

  it('condition: without a {Land of Wano} Leader the cost is paid (Shinobu trashed) but nothing is drawn or raised', () => {
    const g = start({ leader: LD16.plain });
    yes(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(11);
    expect(g.card(at(g, 'p1', 'characters', MOMO)).cost).toBe(6);
  });

  it('+20 cost lasts only during this turn', () => {
    const g = start();
    yes(g, 'p1');
    pickCards(g, [MOMO]);
    toMyNextMain(g);
    expect(g.card(at(g, 'p1', 'characters', MOMO)).cost).toBe(6);
  });

  it('the trash cost is a trash, not a K.O., and Shinobu is gone from the field afterwards', () => {
    const g = start();
    yes(g, 'p1');
    pickCards(g, [MOMO]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([MOMO]);
  });
});
