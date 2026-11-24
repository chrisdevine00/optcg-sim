/**
 * OP16-101 Mahoroba (Event, Black, cost 2, {Land of Wano}).
 *
 * Card text: "[Main] Up to 1 of your Leader or Character cards gains +3000 power during this turn.
 * Then, if you have 10 or more cards in your trash, K.O. up to 1 of your opponent's Characters with
 * a cost of 2 or less. [Trigger] Add up to 1 [Yamato] from your trash to your hand."
 *
 * Rules: CR 2-7-3 / CR 8-4-2 (an Event is trashed BEFORE its effect resolves, so Mahoroba itself is
 * one of the cards in the trash that the condition counts), CR 8-4-4-1 ("up to"), CR 6-6-1-3,
 * RD 101-102 (a [Trigger] card is in no area while it resolves, then trashed).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMain,
  BLUE,
  cardIds,
  chars,
  choices,
  declineTrigger,
  fill,
  hand,
  hitLeader,
  kind,
  LD16,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  pickInst,
  playCard,
  SC16,
  SCN,
  theirs,
  toMyNextMain,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-101';
const YAMATO6 = 'OP16-098';
const YAMATO5 = 'ST09-013';

function main(trashN: number, opp: string[] = [SCN.c2], field: string[] = [SCN.c4]) {
  return mine(
    LD16.wano,
    { hand: [ID], characters: field, trash: fill(BLUE, trashN) },
    { characters: opp },
  );
}

describe('OP16-101 Mahoroba: [Main] +3000 power this turn, then with 10+ trash cards K.O. a cost-2-or-less Character', () => {
  it('gives my Leader +3000 and (10 cards in trash counting Mahoroba) K.O.s the chosen opposing cost-2 Character', () => {
    const g = main(9);
    playCard(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c2]);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([SCN.c2]);
  });

  it('the +3000 may go to one of my Characters instead', () => {
    const g = main(9);
    playCard(g, ID);
    pickCards(g, [SCN.c4]);
    pickCards(g, [SCN.c2]);
    expect(g.power(at(g, 'p1', 'characters', SCN.c4))).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("only my own Leader and Characters can receive the +3000 (not the opponent's)", () => {
    const g = main(9);
    playCard(g, ID);
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).toEqual([SCN.c4, LD16.wano].sort()); // my Character and my Leader
  });

  it('condition boundary: 9 cards in trash after Mahoroba (8 before) means no K.O. and no K.O. prompt', () => {
    const g = main(8);
    playCard(g, ID);
    pickInst(g, [g.leader('p1')]);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c2]);
  });

  it('condition boundary: 10 cards in trash after Mahoroba (9 before) does K.O.', () => {
    const g = main(9);
    playCard(g, ID);
    pickInst(g, [g.leader('p1')]);
    expect(offeredIds(g)).toEqual([SCN.c2]);
  });

  it('K.O. cost boundary: cost 2 is offered, cost 3 is not', () => {
    const g = main(9, [SCN.c2, SCN.c3]);
    playCard(g, ID);
    pickInst(g, [g.leader('p1')]);
    expect(offeredIds(g)).toEqual([SCN.c2]);
  });

  it('"up to 1": the +3000 may be skipped and the K.O. still happens', () => {
    const g = main(9);
    playCard(g, ID);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    pickCards(g, [SCN.c2]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
  });

  it('"up to 1": the K.O. may be skipped', () => {
    const g = main(9);
    playCard(g, ID);
    pickInst(g, [g.leader('p1')]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c2]);
  });

  it('K.O.s at most one of two eligible Characters', () => {
    const g = main(9, [SCN.c2, SCN.c1]);
    playCard(g, ID);
    pickInst(g, [g.leader('p1')]);
    pickCards(g, [SCN.c1]);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c2]);
  });

  it('+3000 lasts this turn only', () => {
    const g = main(9);
    playCard(g, ID);
    pickInst(g, [g.leader('p1')]);
    pickCards(g, [SCN.c2]);
    toMyNextMain(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with no opposing cost-2-or-less Character the effect ends after the +3000', () => {
    const g = main(9, [SCN.c5]);
    playCard(g, ID);
    pickInst(g, [g.leader('p1')]);
    if (kind(g) === 'choose') none(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([SCN.c5]);
  });
});

describe('OP16-101 Mahoroba: [Trigger] add up to 1 [Yamato] from my trash to my hand', () => {
  function hit(tr: string[]) {
    const g = theirs(LD16.wano, { life: [ID, BLUE, BLUE, BLUE], trash: tr }, {});
    hitLeader(g);
    return g;
  }

  it('activating adds the chosen [Yamato] to hand; Mahoroba is trashed afterwards', () => {
    const g = hit([YAMATO6, SC16.wano3]);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickCards(g, [YAMATO6]);
    expect(hand(g)).toContain(YAMATO6);
    expect(hand(g)).not.toContain(ID);
    expect(trash(g)).toEqual([ID, SC16.wano3].sort());
  });

  it('only cards named [Yamato] are candidates (any cost); another Character is not', () => {
    const g = hit([YAMATO6, YAMATO5, 'OP16-097', SC16.wano3]);
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([YAMATO6, YAMATO5, 'OP16-097'].sort());
  });

  it('"up to 1": may add nothing', () => {
    const g = hit([YAMATO6]);
    activateTrigger(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(hand(g)).not.toContain(YAMATO6);
    expect(trash(g)).toEqual([ID, YAMATO6].sort());
  });

  it('adds at most one when two [Yamato] are in the trash', () => {
    const g = hit([YAMATO6, YAMATO5]);
    activateTrigger(g);
    pickCards(g, [YAMATO5]);
    expect(hand(g).filter((c) => c === YAMATO6 || c === YAMATO5)).toEqual([YAMATO5]);
  });

  it('the [Trigger] does not give +3000 (that is the [Main] effect)', () => {
    const g = hit([YAMATO6]);
    activateTrigger(g);
    pickCards(g, [YAMATO6]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining the [Trigger]: Mahoroba goes to my hand and the trash is unchanged', () => {
    const g = hit([YAMATO6]);
    declineTrigger(g);
    expect(hand(g)).toContain(ID);
    expect(trash(g)).toEqual([YAMATO6]);
  });
});
