/**
 * OP12-094 Monkey.D.Dragon (Character, Black, cost 8, 8000, no Counter, {Revolutionary Army}).
 *
 * Card text: "[On Play] You may place 3 "Revolutionary Army" type cards from your trash at the bottom of
 * your deck in any order: If your Leader has the "Revolutionary Army" type, play up to 1 Character card
 * with a cost of 6 or less from your trash."
 *
 * Rules: CR 8-3-1-4 ("you may" cost, paid before the effect), CR 4-8-1 ("up to" allows 0). The cards
 * placed as the cost have left the trash by the time the play is chosen. A played Character enters
 * active (CR 3-7-4: it just cannot attack that turn).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  chars,
  deck,
  hand,
  kind,
  LDR,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  offeredIds,
  payHand,
  pickCards,
  playRaw,
  SC3,
  SCN,
  settleOrders,
  trash,
  unusable,
  yes,
} from './kit-op12c.ts';

const ID = 'OP12-094';
const RA3 = [SC3.ra3, SC3.ra5, SC3.ra6];
/** Three RA cards (the cost) plus Characters of cost 6, 7 and 1. */
const TRASH = [...RA3, SCN.c6, SCN.c7, SCN.c1];

function played(leader: string, trashCards: string[] = TRASH) {
  const g = mine(leader, { hand: [ID], trash: trashCards });
  playRaw(g, ID);
  return g;
}

/** Say yes and pay with the three RA cards, as far as the engine asks. */
function pay(g: ReturnType<typeof played>, cards: string[] = RA3) {
  need(g, 'optional', 'p1');
  yes(g);
  if (kind(g) === 'choose') payHand(g, cards);
  settleOrders(g);
}

describe('OP12-094 Monkey.D.Dragon: [On Play] place 3 RA cards from the trash at the bottom: play a Character (cost <= 6)', () => {
  it('the cost moves exactly those 3 RA cards from the trash to the bottom of the deck', () => {
    const g = played(LDR.ra);
    pay(g);
    expect(deck(g).slice(-3).sort()).toEqual([...RA3].sort());
    expect(deck(g)).toHaveLength(18);
    for (const c of RA3) expect(trash(g)).not.toContain(c);
  });

  it('candidates: Characters in the trash with cost <= 6 (6 in, 7 out); the placed cards and an RA Event are not offered', () => {
    const g = played(LDR.ra, [...TRASH, SCN.c5, 'OP05-020']);
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c1, SCN.c5, SCN.c6].sort());
  });

  it('the chosen Character is played from the trash, active; the others stay in the trash', () => {
    const g = played(LDR.ra);
    pay(g);
    pickCards(g, [SCN.c6]);
    expect(chars(g)).toEqual([ID, SCN.c6].sort());
    expect(g.card(at(g, 'p1', 'characters', SCN.c6)).rested).toBe(false);
    expect(trash(g)).toEqual([SCN.c1, SCN.c7].sort());
    expect(atMain(g)).toBe(true);
  });

  it('"up to 1": the play may be skipped after the cost is paid (the 3 cards stay at the bottom)', () => {
    const g = played(LDR.ra);
    pay(g);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(18);
  });

  it('"you may": declining keeps the trash and the deck as they were', () => {
    const g = played(LDR.ra);
    need(g, 'optional', 'p1');
    no(g);
    expect(trash(g)).toEqual([...TRASH].sort());
    expect(deck(g)).toHaveLength(15);
    expect(atMain(g)).toBe(true);
  });

  it('only 2 RA cards in the trash: the cost cannot be paid', () => {
    const g = played(LDR.ra, [SC3.ra3, SC3.ra5, SCN.c6]);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toHaveLength(3);
  });

  it('the cost needs RA-type cards: an RA Event in the trash counts as one of the 3', () => {
    const g = played(LDR.ra, [SC3.ra3, SC3.ra5, 'OP05-020', SCN.c6]);
    need(g, 'optional', 'p1');
    yes(g);
    if (kind(g) === 'choose') payHand(g, [SC3.ra3, SC3.ra5, 'OP05-020']);
    settleOrders(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c6]);
  });

  it('without a Revolutionary Army Leader the cost may be paid but nothing is played', () => {
    const g = played(LDR.luffy);
    need(g, 'optional', 'p1');
    yes(g);
    if (kind(g) === 'choose') payHand(g, RA3);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
  });

  it('a Character with cost 7 or more alone in the trash gives nothing to play', () => {
    const g = played(LDR.ra, [...RA3, SCN.c7]);
    pay(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g)).toEqual([ID]);
  });

  it('a Character played from the trash by the effect has its own [On Play] (OP12-084 trashes 3 from the top of my deck)', () => {
    const g = played(LDR.ra, [...RA3, 'OP12-084']);
    pay(g);
    pickCards(g, ['OP12-084']);
    expect(chars(g)).toEqual([ID, 'OP12-084'].sort());
    expect(trash(g)).toHaveLength(3);
    expect(deck(g)).toHaveLength(15);
  });
});
