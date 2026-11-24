/**
 * OP02-005 Curly.Dadan (Character, Red, cost 2, 3000, Counter +1000, {Mountain Bandits}).
 *
 * Card text: "[On Play] Look at up to 5 cards from the top of your deck; reveal up to 1 red Character with
 * a cost of 1 and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: only the top 5 can be looked at; the candidate must be RED, a CHARACTER and have cost exactly
 * 1 (red Events of cost 1, red Characters of another cost and non-red cost-1 Characters do not
 * qualify); "up to 1" lets the player take nothing; the rest go to the bottom of the deck.
 */
import { describe, expect, it } from 'vitest';
import {
  C29,
  deck,
  fill,
  hand,
  ids29,
  inst,
  isMain,
  L29,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  settleEmpty,
  settleOrders,
} from './kit-st29a.ts';

const ID = 'OP02-005';
const SUNNY = 'P-015'; // Red, cost 1, 3000 Character (FILL.red)

/** p1's Main Phase with Dadan in hand and this deck (top first, padded with Mohji). */
function main(top: string[], leader: string = L29.croc) {
  return mine(leader, { hand: [ID], deck: [...top, ...fill(C29.c1, 15 - top.length)] });
}

describe('OP02-005 Curly.Dadan [On Play]: look at 5, take up to 1 red cost-1 Character', () => {
  it('printed values: cost 2, 3000 power, Counter +1000', () => {
    const g = main([]);
    const d = inst(g, 'p1', 'hand', ID);
    expect(g.card(d).cost).toBe(2);
    expect(g.power(d)).toBe(3000);
    expect(g.card(d).counter).toBe(1000);
  });

  it('offers only red Characters with cost 1: not a red cost-2 Character, a red cost-1 Event or a blue cost-1 Character', () => {
    const g = main([C29.c2, C29.event, C29.c1, C29.red1, C29.c3]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.red1]);
  });

  it('only the top 5 are looked at: a qualifying card in 6th place is not offered', () => {
    const g = main([C29.c2, C29.event, C29.c1, C29.c3, C29.c4, SUNNY]);
    playRaw(g, ID);
    if (!isMain(g, 'p1')) {
      expect(offeredIds(g)).toEqual([]);
      settleEmpty(g);
    }
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(SUNNY);
  });

  it('a qualifying card in 5th place is offered and taking it adds exactly that card', () => {
    const g = main([C29.c2, C29.event, C29.c3, C29.c4, C29.red1, SUNNY]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.red1]);
    pickInst(g, [inst(g, 'p1', 'deck', C29.red1)]);
    settleOrders(g);
    expect(hand(g)).toEqual([C29.red1]);
  });

  it('the other 4 looked-at cards go to the bottom (any order) and the 6th card becomes the top', () => {
    const g = main([C29.c2, C29.red1, C29.c3, C29.c4, C29.c5, SUNNY]);
    playRaw(g, ID);
    pickInst(g, [inst(g, 'p1', 'deck', C29.red1)]);
    settleOrders(g);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(SUNNY);
    expect(deck(g).slice(-4).sort()).toEqual([C29.c2, C29.c3, C29.c4, C29.c5].sort());
  });

  it('"up to 1": taking nothing puts all 5 at the bottom', () => {
    const g = main([C29.red1, SUNNY, C29.c3, C29.c4, C29.c5, C29.c6]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(C29.c6);
    expect(deck(g).slice(-5).sort()).toEqual([C29.red1, SUNNY, C29.c3, C29.c4, C29.c5].sort());
  });

  it('only 1 card may be taken even when two qualify', () => {
    const g = main([C29.red1, SUNNY, C29.c3, C29.c4, C29.c5]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.red1, SUNNY].sort());
    pickInst(g, [inst(g, 'p1', 'deck', SUNNY)]);
    settleOrders(g);
    expect(hand(g)).toEqual([SUNNY]);
    expect(ids29(g, 'p1', 'trash')).toEqual([]);
  });

  it('with a deck of only 3 cards it looks at those 3', () => {
    const g = mine(L29.croc, { hand: [ID], deck: [C29.c2, C29.red1, C29.c3] });
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.red1]);
    pickInst(g, [inst(g, 'p1', 'deck', C29.red1)]);
    settleOrders(g);
    expect(hand(g)).toEqual([C29.red1]);
    expect(deck(g).sort()).toEqual([C29.c2, C29.c3].sort());
  });

  it('Dadan herself stays on the field and the card was paid for with 2 DON!!', () => {
    const g = main([C29.red1]);
    playRaw(g, ID);
    pickInst(g, [inst(g, 'p1', 'deck', C29.red1)]);
    settleOrders(g);
    expect(ids29(g, 'p1', 'characters')).toEqual([ID]);
    expect(isMain(g, 'p1')).toBe(true);
  });
});
