/**
 * EB04-006 Moda (Character, cost 1, 0 power, Counter +2000, {Lulucia Kingdom}).
 *
 * Card text: "[On Play] Look at 7 cards from the top of your deck; reveal up to 1 [Lulucia Kingdom] and
 * add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: [Lulucia Kingdom] in square brackets is a card NAME (CR 2-? "[Name]"), here the Stage
 * EB04-010; Moda herself has the type {Lulucia Kingdom} but not the name. "up to 1" (CR 8-4-4-1).
 * Looking at fewer cards than 7 is fine when the deck is short.
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  cardIds,
  choices,
  fill,
  hand,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  settleOrders,
  SN,
} from './kit-eb04a.ts';

const MODA = 'EB04-006';
const STAGE = 'EB04-010';

/** p1 plays Moda from hand with this deck (top first); the engine is at the first prompt. */
function start(deck: string[]) {
  const g = mine(LE.minks, { hand: [MODA], deck }, {});
  playRaw(g, MODA);
  return g;
}
const instOf = (g: ReturnType<typeof start>, card: string) =>
  choices(g).find((i) => g.card(i).card === card)!;

describe('EB04-006 Moda: look at 7, reveal up to 1 [Lulucia Kingdom], rest to the bottom in any order', () => {
  it('printed values: cost 1, 0 power, Counter +2000', () => {
    const g = mine(LE.minks, { hand: [MODA] }, {});
    const c = g.card(g.find('p1', 'hand', MODA));
    expect(c.cost).toBe(1);
    expect(c.power).toBe(0);
    expect(c.counter).toBe(2000);
  });

  it('adds [Lulucia Kingdom] from the top 7 to hand; the other 6 go to the bottom, the rest of the deck is untouched', () => {
    const deck = [SN.c1, STAGE, SN.c2, SN.c3, BLUE, SN.c4, SN.c5, ...fill(BLUE, 8)];
    const g = start(deck);
    need(g, 'choose');
    pickInst(g, [instOf(g, STAGE)]);
    settleOrders(g);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([STAGE]);
    const after = cardIds(g, 'p1', 'deck');
    expect(after).toHaveLength(14);
    expect(after.slice(0, 8)).toEqual(deck.slice(7));
    expect([...after.slice(8)].sort()).toEqual([SN.c1, SN.c2, SN.c3, BLUE, SN.c4, SN.c5].sort());
  });

  it('only the card NAMED [Lulucia Kingdom] is offered: Moda ({Lulucia Kingdom} type) and other cards are not', () => {
    const g = start([SN.c1, MODA, STAGE, SN.c2, MODA, BLUE, BLUE, ...fill(BLUE, 8)]);
    expect(offeredIds(g)).toEqual([STAGE]);
    none(g);
    settleOrders(g);
  });

  it('only 7 cards are looked at: a copy in 8th position is not offered', () => {
    const g = start([...fill(BLUE, 7), STAGE, ...fill(BLUE, 7)]);
    expect(kind(g)).toBe('choose');
    expect(choices(g)).toEqual([]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
  });

  it('the 7th card is looked at: a copy in 7th position is offered', () => {
    const g = start([...fill(BLUE, 6), STAGE, ...fill(BLUE, 8)]);
    expect(offeredIds(g)).toEqual([STAGE]);
    pickInst(g, [instOf(g, STAGE)]);
    settleOrders(g);
    expect(hand(g)).toEqual([STAGE]);
  });

  it('"up to 1": choosing nothing sends all 7 to the bottom and adds nothing to hand', () => {
    const deck = [STAGE, SN.c1, SN.c2, SN.c3, SN.c4, SN.c5, SN.c6, ...fill(BLUE, 8)];
    const g = start(deck);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    const after = cardIds(g, 'p1', 'deck');
    expect(after).toHaveLength(15);
    expect(after.slice(0, 8)).toEqual(deck.slice(7));
    expect([...after.slice(8)].sort()).toEqual([...deck.slice(0, 7)].sort());
  });

  it('two copies in the top 7: only one may be added, the other goes to the bottom', () => {
    const g = start([STAGE, STAGE, SN.c1, SN.c2, SN.c3, SN.c4, SN.c5, ...fill(BLUE, 8)]);
    pickInst(g, [choices(g)[0]!]);
    settleOrders(g);
    expect(hand(g)).toEqual([STAGE]);
    const after = cardIds(g, 'p1', 'deck');
    expect(after.filter((c) => c === STAGE)).toHaveLength(1);
    expect(after).toHaveLength(14);
  });

  it('no [Lulucia Kingdom] in the top 7: nothing can be picked and all 7 go to the bottom', () => {
    const deck = [SN.c1, SN.c2, SN.c3, SN.c4, SN.c5, SN.c6, SN.c7, ...fill(BLUE, 8)];
    const g = start(deck);
    expect(choices(g)).toEqual([]);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(15);
    expect(cardIds(g, 'p1', 'deck').slice(0, 8)).toEqual(deck.slice(7));
  });

  it('a deck with fewer than 7 cards: all of it is looked at, the stage can be taken', () => {
    const g = start([SN.c1, STAGE, SN.c2]);
    expect(offeredIds(g)).toEqual([STAGE]);
    pickInst(g, [instOf(g, STAGE)]);
    settleOrders(g);
    expect(hand(g)).toEqual([STAGE]);
    expect([...cardIds(g, 'p1', 'deck')].sort()).toEqual([SN.c1, SN.c2].sort());
  });
});
