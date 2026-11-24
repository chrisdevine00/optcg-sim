/**
 * EB04-037 Porche (Character, Purple, cost 1, 2000, Counter +1000, {Foxy Pirates}).
 *
 * Card text: "[On Play] If your Leader has the {Foxy Pirates} type, look at 5 cards from the top of
 * your deck; reveal up to 1 {Foxy Pirates} type card and add it to your hand. Then, place the rest
 * at the bottom of your deck in any order."
 *
 * Rules: only the top 5 are looked at; a Character or Event with the type qualifies; the chosen card
 * is revealed (CR 11-2-1); "up to 1" may be none; the rest go to the bottom in any order (an `order`
 * decision may be asked and is answered with the first order).
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  deck,
  fill,
  hand,
  hasEvent,
  kind,
  LB,
  mine,
  need,
  none,
  offeredIds,
  pickRaw,
  playRaw,
  settleOrders,
  tail,
  trash,
  atMain,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-037';
/** EB02-034 Komei: Purple, cost 4, 6000, {Navy}/{Foxy Pirates}. Vanilla. */
const KOMEI = 'EB02-034';
/** OP07-066 Tony Tony.Chopper: Purple, {Animal}/{Foxy Pirates}. */
const CHOPPER = 'OP07-066';
/** OP07-076 Slow-Slow Beam Sword: Purple Event with the {Foxy Pirates} type. */
const FOXY_EVENT = 'OP07-076';
/** OP01-012 Sai: Red, 4000, vanilla, no Foxy Pirates type. */
const SAI = 'OP01-012';

function start(top: string[], leader: string = LB.foxy): TestGame {
  const g = mine(leader, { hand: [ID], deck: [...top, KOMEI, ...fill(BLUE, 8)] });
  playRaw(g, ID);
  return g;
}

const TOP = [KOMEI, SAI, CHOPPER, BLUE, BLUE];
const TOTAL = 14;

describe('EB04-037 Porche: [On Play] Foxy Pirates Leader: look at 5, add up to 1 {Foxy Pirates}, rest to the bottom', () => {
  it('offers exactly the {Foxy Pirates} cards of the top 5; the pick goes to hand, the rest to the bottom', () => {
    const g = start(TOP);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CHOPPER, KOMEI].sort());
    pickRaw(g, g.find('p1', 'deck', CHOPPER));
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([CHOPPER]);
    expect(deck(g)).toHaveLength(TOTAL - 1);
    expect(deck(g)[0]).toBe(KOMEI);
    expect(tail(deck(g), 4)).toEqual([KOMEI, SAI, BLUE, BLUE].sort());
  });

  it('the chosen card is revealed, the others are not', () => {
    const g = start(TOP);
    pickRaw(g, g.find('p1', 'deck', KOMEI));
    settleOrders(g);
    expect(hasEvent(g, 'CardRevealed', { card: KOMEI })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: SAI })).toBe(false);
  });

  it('"up to 1": may add nothing; all five go to the bottom', () => {
    const g = start(TOP);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(TOTAL);
    expect(deck(g)[0]).toBe(KOMEI);
    expect(tail(deck(g), 5)).toEqual([...TOP].sort());
  });

  it('adds at most one card even when two qualify', () => {
    const g = start(TOP);
    pickRaw(g, g.find('p1', 'deck', KOMEI));
    settleOrders(g);
    expect(hand(g)).toHaveLength(1);
  });

  it('only the top 5 are looked at: a {Foxy Pirates} card in 6th place is not offered', () => {
    const g = start([SAI, SAI, SAI, SAI, SAI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    settleOrders(g);
    expect(deck(g)[0]).toBe(KOMEI);
    expect(hand(g)).toEqual([]);
  });

  it('an Event card with the {Foxy Pirates} type qualifies', () => {
    const g = start([FOXY_EVENT, SAI, SAI, SAI, SAI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([FOXY_EVENT]);
    pickRaw(g, g.find('p1', 'deck', FOXY_EVENT));
    settleOrders(g);
    expect(hand(g)).toEqual([FOXY_EVENT]);
  });

  it('with no {Foxy Pirates} card in the top 5 nothing is added and all five go to the bottom', () => {
    const top = [SAI, SAI, BLUE, BLUE, SAI];
    const g = start(top);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    settleOrders(g);
    expect(tail(deck(g), 5)).toEqual([...top].sort());
    expect(hand(g)).toEqual([]);
  });

  it('without a {Foxy Pirates} Leader nothing is looked at and the deck is untouched', () => {
    const g = start(TOP, LB.neutral);
    expect(atMain(g)).toBe(true);
    expect(kind(g)).toBe('main');
    expect(deck(g)).toHaveLength(TOTAL);
    expect(deck(g).slice(0, 5)).toEqual(TOP);
    expect(hand(g)).toEqual([]);
  });

  it('Porche herself stays on the field and the trash is empty', () => {
    const g = start(TOP);
    pickRaw(g, g.find('p1', 'deck', KOMEI));
    settleOrders(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(trash(g)).toEqual([]);
  });
});
