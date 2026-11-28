/**
 * OP18-110 Blueno (Yellow Character, cost 1, 2000, Counter +1000, {CP9}).
 *
 * Card text: "[On Play] Look at 4 cards from the top of your deck; reveal up to 1 card with a type
 *             including "CP" other than [Blueno] and add it to your hand. Then, place the rest at
 *             the bottom of your deck in any order.
 *             [Trigger] Draw 1 card and K.O. up to 1 of your opponent's Characters with a cost of 2
 *             or less."
 *
 * The [Trigger] has no CP condition. Scenery: CP cards OP03-082 Kumadori, OP03-087 Nero, OP03-084
 * Jerry (CP6), OP08-091 (Former CP9); other [Blueno] cards OP03-090 (CP9) and a second OP18-110
 * (excluded by name); OP02-060 Mohji (non-CP); OP01-012 Sai (cost 2), OP01-023 Marco (cost 3).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  cardIds,
  hasEvent,
  need,
  none,
  offeredIds,
  pickCards,
  play,
  settleOrders,
  LDR,
} from './kit-e.ts';
import { LE, mineE, triggerHit, X, CPHAND } from './kit-e.ts';

const B = 'OP18-110';
const OTHER_BLUENO = 'OP03-090';
const MISS = 'OP02-060';
const SAI = 'OP01-012';
const MARCO = 'OP01-023';

function look(top: string[], leader: string = LE.cp) {
  const deck = [...top, X.cp5, ...Array.from({ length: 9 }, () => MISS)];
  const g = mineE(leader, { hand: [B], deck, costArea: { active: 1, rested: 0 } });
  play(g, at(g, 'p1', 'hand', B));
  return g;
}
const done = (g: ReturnType<typeof look>) => {
  settleOrders(g);
  expect(atMain(g, 'p1')).toBe(true);
};

describe('OP18-110 Blueno: [On Play] look at 4, add up to 1 CP card other than [Blueno]', () => {
  it('offers CP cards of the top 4 (any CP type, "Former CP9" too); not Mohji, not another [Blueno]', () => {
    const g = look([X.cp4, CPHAND.former, OTHER_BLUENO, MISS]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([X.cp4, CPHAND.former].sort());
    pickCards(g, [CPHAND.former]);
    done(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([CPHAND.former]);
  });

  it('the other three go to the bottom of the deck; the 5th card (a CP card) is now on top and was not looked at', () => {
    const g = look([X.cp4, MISS, X.cp3, MISS]);
    pickCards(g, [X.cp3]);
    done(g);
    const d = cardIds(g, 'p1', 'deck');
    expect(d).toHaveLength(13);
    expect(d[0]).toBe(X.cp5);
    expect(d.slice(-3).sort()).toEqual([X.cp4, MISS, MISS].sort());
  });

  it('"up to 1": may take nothing; all four go to the bottom', () => {
    const g = look([X.cp4, X.cp3, MISS, MISS]);
    need(g, 'choose', 'p1');
    none(g);
    done(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'deck').slice(-4).sort()).toEqual([X.cp4, X.cp3, MISS, MISS].sort());
  });

  it('adds at most 1 even when two CP cards qualify', () => {
    const g = look([X.cp4, X.cp3, MISS, MISS]);
    pickCards(g, [X.cp4]);
    done(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([X.cp4]);
  });

  it('only the top 4: a CP card in 5th place is not offered', () => {
    const g = look([MISS, MISS, MISS, MISS]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    done(g);
    expect(cardIds(g, 'p1', 'deck')[0]).toBe(X.cp5);
  });

  it('the revealed card is shown, the rest are not', () => {
    const g = look([X.cp4, MISS, MISS, MISS]);
    pickCards(g, [X.cp4]);
    done(g);
    expect(hasEvent(g, 'CardRevealed', { card: X.cp4 })).toBe(true);
  });
});

describe('OP18-110 Blueno: [Trigger] draw 1 card and K.O. up to 1 opposing Character with cost 2 or less', () => {
  const deck = [X.cp4, MISS, MISS, MISS, MISS];

  it('draws, then K.O.s a cost-2 Character; a cost-3 Character is not offered (boundary 2 / 3)', () => {
    const g = triggerHit(B, LE.cp, { deck }, { characters: [SAI, MARCO] });
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([X.cp4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SAI]);
    pickCards(g, [SAI]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([SAI]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([MARCO]);
  });

  it('works with a Leader that is not CP (no condition on the Trigger)', () => {
    const g = triggerHit(B, LDR.luffy, { deck }, { characters: [SAI] });
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([X.cp4]);
    pickCards(g, [SAI]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([SAI]);
  });

  it('"up to 1": the draw still happens when no Character is K.O.’d', () => {
    const g = triggerHit(B, LE.cp, { deck }, { characters: [SAI] });
    act(g, { type: 'trigger', activate: true });
    none(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([X.cp4]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SAI]);
  });

  it('only opposing Characters: my own cost-1 Character is not offered', () => {
    const g = triggerHit(B, LE.cp, { deck, characters: [MISS] }, { characters: [SAI] });
    act(g, { type: 'trigger', activate: true });
    expect(offeredIds(g)).toEqual([SAI]);
  });
});
