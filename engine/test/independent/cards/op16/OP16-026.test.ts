/**
 * OP16-026 Emporio.Ivankov (Character, Green, cost 4, 4000, Counter +1000, {Revolutionary Army}/
 * {Impel Down}, Special).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck; reveal up to 1 {Impel Down} type card,
 * add it to your hand and place the rest at the bottom of your deck in any order. Then, play up to 1
 * Character card with a cost of 2 or less from your hand."
 *
 * Rules: CR 8-4-4 ("look at", "up to"), CR 11-2-1 (revealing shows the card), playing by an effect
 * pays no cost (CR 8-5-1), "Then" sequences the second step after the first (CR 8-3-3).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  charIds,
  choose,
  deck,
  finishEmpty,
  fill,
  hand,
  mayChooseNone,
  mine,
  need,
  none,
  OL,
  OV,
  offeredIds,
  pickInst,
  playCard,
  reachablePickSets,
  restedChar,
  revealedByEffects,
  settleOrders,
  tail,
  don,
} from './kit-op16a.ts';

const IVANKOV = 'OP16-026';
const SALDEATH = 'OP11-064'; // {Impel Down}, cost 6, 8000, vanilla
const BLUGORI = 'OP02-084'; // {Animal}/{Impel Down}, cost 1, 3000, vanilla
const JINBE_ID = 'OP16-023'; // Arlong: {Fish-Man}/{The Sun Pirates}/{Impel Down}, cost 1, 3000
const MISS = OV.thatch; // no Impel Down type
const BEYOND = BLUGORI;
const REST = [BEYOND, ...fill(BLUE, 8)];

function start(top: string[], inHand: string[] = []) {
  const g = mine(OL.impel, { hand: [IVANKOV, ...inHand], deck: [...top, ...REST] });
  playCard(g, IVANKOV);
  return g;
}

/** No {Impel Down} card in the top 3: the look is an empty "up to 1" that ends with `done`; the 3 go to the bottom. */
function skipLook(g: ReturnType<typeof start>): void {
  need(g, 'choose', 'p1');
  expect(offeredIds(g)).toEqual([]);
  none(g);
  settleOrders(g);
}

describe('OP16-026 Emporio.Ivankov: look at 3, reveal up to 1 {Impel Down}, then play a cost-2-or-less Character', () => {
  it('offers exactly the {Impel Down} cards among the top 3', () => {
    const g = start([SALDEATH, MISS, BLUGORI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BLUGORI, SALDEATH].sort());
  });

  it('the chosen card is revealed and added to hand; the other two go to the bottom', () => {
    const g = start([SALDEATH, MISS, JINBE_ID]);
    choose(g, [g.zone('p1', 'deck').find((c) => c.card === SALDEATH)!.instance]);
    settleOrders(g);
    expect(revealedByEffects(g)).toEqual([SALDEATH]);
    expect(hand(g)).toEqual([SALDEATH]);
    expect(deck(g)).toHaveLength(3 + REST.length - 1);
    expect(deck(g)[0]).toBe(BEYOND);
    expect(tail(deck(g), 2)).toEqual([MISS, JINBE_ID].sort());
  });

  it('"up to 1": may add nothing; all 3 go to the bottom', () => {
    const g = start([SALDEATH, MISS, JINBE_ID]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(BEYOND);
    expect(tail(deck(g), 3)).toEqual([SALDEATH, MISS, JINBE_ID].sort());
  });

  it('adds at most one card even when two qualify', () => {
    const sets = reachablePickSets(start([SALDEATH, MISS, BLUGORI]));
    expect(sets.has('')).toBe(true);
    expect(sets.has(SALDEATH)).toBe(true);
    expect(sets.has(BLUGORI)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 3 are looked at: an {Impel Down} card in 4th position is not offered', () => {
    const g = start([MISS, MISS, MISS]);
    expect(offeredIds(g)).toEqual([]);
  });

  it('"Then" play up to 1: the cost 2 or less Character in hand is offered (cost 3 is not), played free and active', () => {
    const g = start([MISS, MISS, MISS], [OV.sai4, OV.marco5]);
    skipLook(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([OV.sai4]);
    pickInst(g, [g.find('p1', 'hand', OV.sai4)]);
    expect(charIds(g, 'p1')).toEqual([IVANKOV, OV.sai4].sort());
    expect(restedChar(g, 'p1', OV.sai4)).toBe(false);
    expect(hand(g)).toEqual([OV.marco5]);
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 4 });
    expect(atMain(g)).toBe(true);
  });

  it('the card just added may be played at once if its cost is 2 or less', () => {
    const g = start([BLUGORI, MISS, MISS]);
    choose(g, [g.zone('p1', 'deck').find((c) => c.card === BLUGORI)!.instance]);
    settleOrders(g);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([BLUGORI]);
    pickInst(g, [g.find('p1', 'hand', BLUGORI)]);
    expect(charIds(g, 'p1')).toEqual([BLUGORI, IVANKOV].sort());
    expect(hand(g)).toEqual([]);
  });

  it('the card just added with cost 6 is not offered to be played', () => {
    const g = start([SALDEATH, MISS, MISS]);
    choose(g, [g.zone('p1', 'deck').find((c) => c.card === SALDEATH)!.instance]);
    settleOrders(g);
    finishEmpty(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SALDEATH]);
  });

  it('"Then" happens even when nothing was added', () => {
    const g = start([SALDEATH, MISS, MISS], [OV.sai4]);
    none(g);
    settleOrders(g);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.sai4]);
  });

  it('"up to 1": may play nothing; plays only one when two qualify', () => {
    const g = start([MISS, MISS, MISS], [OV.sai4, OV.komachiyo3]);
    skipLook(g);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    pickInst(g, [g.find('p1', 'hand', OV.komachiyo3)]);
    expect(charIds(g, 'p1')).toEqual([IVANKOV, OV.komachiyo3].sort());
    expect(hand(g)).toEqual([OV.sai4]);
    const h = start([MISS, MISS, MISS], [OV.sai4]);
    skipLook(h);
    none(h);
    expect(charIds(h, 'p1')).toEqual([IVANKOV]);
  });

  it('an Event with cost 0 in hand is not a Character card and is never offered', () => {
    const g = start([MISS, MISS, MISS], ['OP16-020']);
    skipLook(g);
    finishEmpty(g);
    expect(atMain(g)).toBe(true);
  });
});
