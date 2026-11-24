/**
 * OP12-086 Koala (Character, Black, cost 1, 2000, Counter +1000, {Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "[On Play] If your Leader has the "Revolutionary Army" type, look at 3 cards from the top
 * of your deck; reveal up to 1 "Revolutionary Army" type card other than [Koala] or up to 1
 * [Nico Robin] and add it to your hand. Then, trash the rest."
 *
 * Rules: CR 4-8-1 ("up to" allows 0), CR 11-2 (revealing shows the card to both players), the rest is
 * trashed (not placed at the bottom). OPEN: whether "up to 1 A or up to 1 B" is one card in total or
 * one of each is not settled on file (cf. M6b-Q26); the tests only add ONE card and finish the pick,
 * which every reading allows.
 */
import { describe, expect, it } from 'vitest';
import { hasEvent } from '../kit.ts';
import {
  atMain,
  canFinish,
  deck,
  hand,
  kind,
  LDR,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SC3,
  SCN,
  fin,
  topDeck,
  trash,
} from './kit-op12c.ts';

const ID = 'OP12-086';
/** An RA card, [Koala] (RA, excluded by name), [Nico Robin] (not RA), and a non-RA card. */
const TOP3 = [SC3.ra3, SC3.koala2, SC3.robin6];

function played(leader: string, top: string[] = TOP3) {
  const g = mine(leader, { hand: [ID], deck: topDeck(top.length > 3 ? top : [...top, SCN.c6]) });
  playRaw(g, ID);
  return g;
}

/** Pick one card, then finish the pick if the same decision is still open. */
function takeOne(g: ReturnType<typeof played>, card: string) {
  pickCards(g, [card]);
  if (kind(g) === 'choose' && canFinish(g)) fin(g);
}

describe('OP12-086 Koala: [On Play] look at 3, add 1 RA card (not Koala) or 1 Nico Robin, trash the rest', () => {
  it('candidates: an RA card and [Nico Robin]; [Koala] is excluded even though it is RA', () => {
    const g = played(LDR.ra);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC3.ra3, SC3.robin6].sort());
  });

  it('a non-RA, non-Robin card among the three is not offered', () => {
    const g = played(LDR.ra, [SCN.c4, SC3.ra5, SC3.koala2]);
    expect(offeredIds(g)).toEqual([SC3.ra5]);
  });

  it('adding the RA card: it goes to hand and the other two are TRASHED (not put at the bottom)', () => {
    const g = played(LDR.ra);
    takeOne(g, SC3.ra3);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC3.ra3]);
    expect(trash(g)).toEqual([SC3.koala2, SC3.robin6].sort());
    expect(deck(g)).toHaveLength(11);
    expect(deck(g)[0]).toBe(SCN.c6);
  });

  it('adding [Nico Robin] instead works the same way', () => {
    const g = played(LDR.ra);
    takeOne(g, SC3.robin6);
    expect(hand(g)).toEqual([SC3.robin6]);
    expect(trash(g)).toEqual([SC3.ra3, SC3.koala2].sort());
  });

  it('"up to": taking nothing trashes all three', () => {
    const g = played(LDR.ra);
    need(g, 'choose');
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([...TOP3].sort());
    expect(atMain(g)).toBe(true);
  });

  it('the added card is revealed (CR 11-2); the ones that are not added are not', () => {
    const g = played(LDR.ra);
    takeOne(g, SC3.ra3);
    expect(hasEvent(g, 'CardRevealed', { card: SC3.ra3 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: SC3.koala2 })).toBe(false);
  });

  it('only the top 3 are looked at: a candidate in 4th place stays in the deck', () => {
    const g = played(LDR.ra, [SCN.c4, SCN.c5, SCN.c3, SC3.ra5]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(trash(g)).toEqual([SCN.c3, SCN.c4, SCN.c5].sort());
    expect(deck(g)[0]).toBe(SC3.ra5);
  });

  it('without a Revolutionary Army Leader nothing is looked at, added or trashed', () => {
    const g = played(LDR.luffy);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)[0]).toBe(SC3.ra3);
    expect(deck(g)).toHaveLength(14);
  });

  it('a multi-type Leader that includes Revolutionary Army (Koala) qualifies', () => {
    const g = played(LDR.koala);
    expect(offeredIds(g)).toEqual([SC3.ra3, SC3.robin6].sort());
  });
});
