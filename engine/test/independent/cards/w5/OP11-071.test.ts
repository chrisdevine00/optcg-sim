/**
 * OP11-071 Charlotte Perospero (Character, Purple, cost 5, 7000, no Counter, {Big Mom Pirates}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] You may trash 1 card from your hand: Choose a cost and
 * reveal 1 card from the top of your opponent's deck. If the revealed card has the chosen cost, draw
 * 1 card and add up to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules: the trash is a cost paid at activation; the Once Per Turn is spent by activating, hit or
 * miss; an optional cost paid from the hidden hand is offered even when unpayable, with "use"
 * illegal (so the opponent cannot tell an empty hand from a full one); "choose a cost" is a number
 * named before the reveal (M6b-Q67).
 */
import { describe, expect, it } from 'vitest';
import { act, decision } from '../../helpers.ts';
import {
  at,
  atMain,
  chooseCost,
  COST,
  deck,
  deckWith,
  don,
  hand,
  hasEvent,
  LW,
  mine,
  need,
  offeredAbilities,
  payHand,
  askingCost,
  takeMost,
  trash,
  useAbility,
  V13,
  type Spec,
} from './kit-w5b.ts';

const PERO = 'OP11-071';

function board(top: string, over: Spec = {}) {
  return mine(
    LW.luffy,
    {
      characters: [PERO],
      hand: [V13.sai, V13.marco],
      deck: [V13.hajrudin, V13.kingdew, V13.thatch, V13.mohji],
      costArea: { active: 3, rested: 2 },
      ...over,
    },
    { deck: deckWith(top) },
  );
}

/** Activate and pay with `pay` (a hand card id), stopping at the cost prompt. */
function fire(g: ReturnType<typeof board>, pay: string, n: number) {
  useAbility(g, at(g, 'p1', 'characters', PERO));
  payHand(g, [pay]);
  chooseCost(g, n);
  takeMost(g);
}

describe('OP11-071 Charlotte Perospero: trash 1, choose a cost, on a match draw 1 and add an active DON!!', () => {
  it('printed values: cost 5, 7000 power, no Counter', () => {
    const g = board(COST.c3);
    const c = g.card(at(g, 'p1', 'characters', PERO));
    expect(c.cost).toBe(5);
    expect(g.power(c.instance)).toBe(7000);
    expect(c.counter ?? null).toBeNull();
  });

  it('asks which hand card to trash first, then the cost; nothing is revealed before the number is named', () => {
    const g = board(COST.c3);
    useAbility(g, at(g, 'p1', 'characters', PERO));
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('cost');
    payHand(g, [V13.sai]);
    expect(trash(g)).toEqual([V13.sai]);
    expect(askingCost(g)).toBe(true);
    expect(hasEvent(g, 'CardRevealed')).toBe(false);
  });

  it('a match draws 1 card and adds 1 DON!! card from the DON!! deck, set active', () => {
    const g = board(COST.c3);
    fire(g, V13.sai, 3);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([V13.sai]);
    expect(hand(g)).toEqual([V13.marco, V13.hajrudin].sort());
    expect(deck(g)).toHaveLength(3);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 2, deck: 4 });
  });

  it('a miss: the trashed card stays trashed, nothing is drawn, no DON!! is added', () => {
    const g = board(COST.c3);
    fire(g, V13.sai, 5);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([V13.sai]);
    expect(hand(g)).toEqual([V13.marco]);
    expect(deck(g)).toHaveLength(4);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2, deck: 5 });
  });

  it('[Once Per Turn]: after a miss the ability is no longer offered this turn', () => {
    const g = board(COST.c3);
    fire(g, V13.sai, 5);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', PERO))).toEqual([]);
  });

  it('[Once Per Turn]: after a hit the ability is no longer offered either, and it is offered again next turn', () => {
    const g = board(COST.c3, { hand: [V13.sai, V13.marco, V13.kingdew] });
    fire(g, V13.sai, 3);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', PERO))).toEqual([]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, at(g, 'p1', 'characters', PERO))).toHaveLength(1);
  });

  it('the trash is a real cost: with an empty hand nothing is revealed, drawn or spent', () => {
    const g = board(COST.c3, { hand: [] });
    const [ability] = offeredAbilities(g, at(g, 'p1', 'characters', PERO));
    if (ability) {
      act(g, { type: 'activate', card: at(g, 'p1', 'characters', PERO), ability });
      // Either the cost is refused outright, or "use" is shown but unavailable.
      const d = decision(g);
      if (d?.kind === 'optional') {
        expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
        act(g, { type: 'optional', accept: false });
      } else {
        expect(d?.kind).toBe('main');
      }
    }
    expect(hasEvent(g, 'CardRevealed')).toBe(false);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(4);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2, deck: 5 });
  });

  it('the DON!! card comes in active (the 2 rested ones stay rested) and the DON!! deck shrinks by 1', () => {
    const g = board(COST.c3);
    fire(g, V13.marco, 3);
    const d = don(g, 'p1');
    expect(d.active).toBe(4);
    expect(d.rested).toBe(2);
    expect(d.deck).toBe(4);
  });

  it('with an empty DON!! deck the draw still happens on a match', () => {
    const g = board(COST.c3, { costArea: { active: 8, rested: 2 } });
    expect(don(g, 'p1').deck).toBe(0);
    fire(g, V13.sai, 3);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([V13.marco, V13.hajrudin].sort());
    expect(don(g, 'p1')).toMatchObject({ active: 8, rested: 2, deck: 0 });
  });

  it('the opponent deck is untouched: the revealed card stays on top and no card of theirs moves', () => {
    const g = board(COST.c3);
    fire(g, V13.sai, 3);
    expect(deck(g, 'p2')).toHaveLength(10);
    expect(deck(g, 'p2')[0]).toBe(COST.c3);
    expect(hand(g, 'p2')).toEqual([]);
  });
});
