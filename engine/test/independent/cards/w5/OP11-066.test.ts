/**
 * OP11-066 Charlotte Oven (Character, Purple, cost 4, 5000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[Activate: Main] You may rest this Character: Choose a cost and reveal 1 card from the
 * top of your opponent's deck. If the revealed card has the chosen cost, K.O. up to 1 of your
 * opponent's Characters with a base cost of 3 or less. Then, add up to 1 DON!! card from your DON!!
 * deck and rest it."
 *
 * Rules: "choose a cost" is a number named before the reveal (M6b-Q67); a "Then" after a failed
 * "If" does not resolve (M4b-5); "up to 1" may be skipped (CR 8-1-2); the "You may rest this
 * Character" cost is paid at activation (an already-rested Character cannot pay it).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  at,
  chars,
  chooseCost,
  COST,
  deckWith,
  don,
  hasEvent,
  LW,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickCards,
  takeMost,
  trace,
  useAbility,
  atMain,
  askingCost,
  deck,
  type Spec,
} from './kit-w5b.ts';

const OVEN = 'OP11-066';

function board(top: string, p2chars: string[], over: Spec = {}) {
  return mine(
    LW.luffy,
    { characters: [OVEN], costArea: { active: 5, rested: 0 }, ...over },
    { deck: deckWith(top), characters: p2chars },
  );
}

/** Activate Oven and name `n`; stops at the next prompt. */
function fire(g: ReturnType<typeof board>, n: number) {
  useAbility(g, at(g, 'p1', 'characters', OVEN));
  chooseCost(g, n);
}

describe('OP11-066 Charlotte Oven: rest, choose a cost, K.O. a base cost 3 or less, add a rested DON!!', () => {
  it('printed values: cost 4, 5000 power, Counter +1000; one [Activate: Main] is offered', () => {
    const g = board(COST.c3, []);
    const c = g.card(at(g, 'p1', 'characters', OVEN));
    expect(c.cost).toBe(4);
    expect(g.power(c.instance)).toBe(5000);
    expect(c.counter).toBe(1000);
    expect(offeredAbilities(g, c.instance)).toHaveLength(1);
  });

  it('activating rests Oven (the cost) and asks for a cost 0 to 10 before anything is revealed', () => {
    const g = board(COST.c3, [COST.c2]);
    useAbility(g, at(g, 'p1', 'characters', OVEN));
    expect(g.card(at(g, 'p1', 'characters', OVEN)).rested).toBe(true);
    expect(askingCost(g)).toBe(true);
    expect(hasEvent(g, 'CardRevealed')).toBe(false);
    chooseCost(g, 3);
    expect(hasEvent(g, 'CardRevealed', { card: COST.c3 })).toBe(true);
  });

  it('a match K.O.s the picked opposing Character and adds one DON!! card, rested', () => {
    const g = board(COST.c3, [COST.c2, COST.c5]);
    fire(g, 3);
    need(g, 'choose', 'p1');
    pickCards(g, [COST.c2]);
    takeMost(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([COST.c5]);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 1, deck: 4 });
  });

  it('a miss does nothing more: no K.O., no DON!! (a "Then" after a failed "If" does not resolve), the cost stays paid', () => {
    const g = board(COST.c3, [COST.c2]);
    fire(g, 4);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([COST.c2]);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 0, deck: 5 });
    expect(g.card(at(g, 'p1', 'characters', OVEN)).rested).toBe(true);
  });

  it('boundary: a base cost of exactly 3 is offered, a base cost of 4 is not', () => {
    const g = board(COST.c3, [COST.c3, COST.c4]);
    fire(g, 3);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([COST.c3]);
    pickCards(g, [COST.c3]);
    takeMost(g);
    expect(chars(g, 'p2')).toEqual([COST.c4]);
  });

  it('"up to 1": the K.O. may be skipped, and only one Character falls even when two qualify', () => {
    const g = board(COST.c3, [COST.c1, COST.c2]);
    fire(g, 3);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([COST.c1, COST.c2].sort());
    none(g);
    takeMost(g);
    expect(chars(g, 'p2').sort()).toEqual([COST.c1, COST.c2].sort());
    const h = board(COST.c3, [COST.c1, COST.c2]);
    fire(h, 3);
    pickCards(h, [COST.c1]);
    takeMost(h);
    expect(chars(h, 'p2')).toEqual([COST.c2]);
  });

  it('must not: only opposing Characters are offered, never my own Characters or either Leader', () => {
    const g = board(COST.c3, [COST.c2], { characters: [OVEN, COST.c1] });
    fire(g, 3);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([COST.c2]);
    none(g);
    takeMost(g);
    expect(chars(g, 'p1').sort()).toEqual([COST.c1, OVEN].sort());
  });

  it('the revealed card stays on top of the opponent deck and the deck keeps its size', () => {
    const g = board(COST.c3, []);
    fire(g, 7);
    expect(atMain(g)).toBe(true);
    expect(deck(g, 'p2')).toHaveLength(10);
    expect(deck(g, 'p2')[0]).toBe(COST.c3);
  });

  it('a cost 0 Event on top matches the chosen 0 (the base cost of the revealed card is compared)', () => {
    const g = board(COST.c0, [COST.c1]);
    fire(g, 0);
    need(g, 'choose', 'p1');
    pickCards(g, [COST.c1]);
    takeMost(g);
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('a rested Oven cannot be activated (the rest cost cannot be paid)', () => {
    const g = board(COST.c3, [COST.c2], { characters: [{ card: OVEN, rested: true }] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', OVEN))).toEqual([]);
  });

  it('with no DON!! left in the DON!! deck the K.O. still happens and nothing is added', () => {
    const g = board(COST.c3, [COST.c2], { costArea: { active: 10, rested: 0 } });
    expect(don(g, 'p1').deck).toBe(0);
    fire(g, 3);
    need(g, 'choose', 'p1');
    pickCards(g, [COST.c2]);
    takeMost(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([]);
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0, deck: 0 });
  });

  it('the number is asked every time, with or without a target, and is not changed by the top card', () => {
    const g = board(COST.c3, []);
    useAbility(g, at(g, 'p1', 'characters', OVEN));
    expect(askingCost(g)).toBe(true);
    act(g, { type: 'pick', choice: { option: '9' } });
    expect(atMain(g)).toBe(true);
  });
  it('no prompt depends on the hidden top card: two decks that differ only in it ask the same thing', () => {
    const a = board(COST.c3, [COST.c2]);
    const b = board(COST.c7, [COST.c2]);
    useAbility(a, at(a, 'p1', 'characters', OVEN));
    useAbility(b, at(b, 'p1', 'characters', OVEN));
    expect(trace(a)).toBe(trace(b));
  });

  it("an empty opposing deck reveals nothing: the number is still asked, nothing is K.O.'d and no DON!! is added", () => {
    const g = mine(
      LW.luffy,
      { characters: [OVEN], costArea: { active: 5, rested: 0 } },
      { deck: [], characters: [COST.c2] },
    );
    useAbility(g, at(g, 'p1', 'characters', OVEN));
    chooseCost(g, 0);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([COST.c2]);
    expect(don(g, 'p1')).toMatchObject({ rested: 0, deck: 5 });
  });
});
