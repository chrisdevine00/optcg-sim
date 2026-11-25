/**
 * OP11-074 Streusen (Character, Purple, cost 3, 3000, Counter +2000, {Big Mom Pirates}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] DON!! −1, You may rest this Character: Choose a cost and
 * reveal 1 card from the top of your opponent's deck. If the revealed card has the chosen cost,
 * rest up to 1 of your opponent's Characters with a cost of 4 or less."
 *
 * Rules: DON!! −1 returns one DON!! card from your field to the DON!! deck (CR 2-9); both costs are
 * paid at activation; the Once Per Turn is spent by activating; "cost of 4 or less" is the current
 * cost; "up to 1" may be skipped.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  at,
  atMain,
  chars,
  chooseCost,
  COST,
  deckWith,
  don,
  donChoices,
  hasEvent,
  LW,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  payDon,
  pickCards,
  askingCost,
  useAbility,
  type Place,
} from './kit-w5b.ts';

const STREU = 'OP11-074';

function board(top: string, p2chars: Place[], over = {}) {
  return mine(
    LW.luffy,
    { characters: [STREU], costArea: { active: 3, rested: 0 }, ...over },
    { deck: deckWith(top), characters: p2chars },
  );
}

const restedOf = (g: ReturnType<typeof board>, card: string) =>
  g.card(at(g, 'p2', 'characters', card)).rested;

function fire(g: ReturnType<typeof board>, n: number) {
  useAbility(g, at(g, 'p1', 'characters', STREU));
  payDon(g, 1);
  chooseCost(g, n);
}

describe('OP11-074 Streusen: DON!! −1, rest this, choose a cost, on a match rest a cost 4 or less Character', () => {
  it('printed values: cost 3, 3000 power, Counter +2000', () => {
    const g = board(COST.c3, []);
    const c = g.card(at(g, 'p1', 'characters', STREU));
    expect(c.cost).toBe(3);
    expect(g.power(c.instance)).toBe(3000);
    expect(c.counter).toBe(2000);
  });

  it('activating pays both costs at once: one DON!! goes back to the DON!! deck and Streusen rests, before the number is named', () => {
    const g = board(COST.c3, [COST.c2]);
    useAbility(g, at(g, 'p1', 'characters', STREU));
    payDon(g, 1);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0, deck: 8 });
    expect(g.card(at(g, 'p1', 'characters', STREU)).rested).toBe(true);
    expect(askingCost(g)).toBe(true);
    expect(hasEvent(g, 'CardRevealed')).toBe(false);
  });

  it("a match rests the picked opposing Character (it is not K.O.'d)", () => {
    const g = board(COST.c3, [COST.c2, COST.c5]);
    fire(g, 3);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([COST.c2]);
    pickCards(g, [COST.c2]);
    expect(atMain(g)).toBe(true);
    expect(restedOf(g, COST.c2)).toBe(true);
    expect(restedOf(g, COST.c5)).toBe(false);
    expect(chars(g, 'p2')).toEqual([COST.c2, COST.c5].sort());
  });

  it('boundary: cost 4 is offered, cost 5 is not', () => {
    const g = board(COST.c3, [COST.c4, COST.c5]);
    fire(g, 3);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([COST.c4]);
    pickCards(g, [COST.c4]);
    expect(restedOf(g, COST.c4)).toBe(true);
    expect(restedOf(g, COST.c5)).toBe(false);
  });

  it('a miss rests nothing; the DON!! and the rest stay paid', () => {
    const g = board(COST.c3, [COST.c2]);
    fire(g, 6);
    expect(atMain(g)).toBe(true);
    expect(restedOf(g, COST.c2)).toBe(false);
    expect(don(g, 'p1').deck).toBe(8);
    expect(g.card(at(g, 'p1', 'characters', STREU)).rested).toBe(true);
  });

  it('"up to 1": may rest none; at most one of two qualifying Characters is rested', () => {
    const g = board(COST.c3, [COST.c1, COST.c2]);
    fire(g, 3);
    need(g, 'choose', 'p1');
    none(g);
    expect(restedOf(g, COST.c1) || restedOf(g, COST.c2)).toBe(false);
    const h = board(COST.c3, [COST.c1, COST.c2]);
    fire(h, 3);
    pickCards(h, [COST.c1]);
    expect(restedOf(h, COST.c1)).toBe(true);
    expect(restedOf(h, COST.c2)).toBe(false);
  });

  it('[Once Per Turn]: not offered again this turn, even with DON!! left and another Character able to pay', () => {
    const g = board(COST.c3, [COST.c2], { characters: [STREU, STREU] });
    fire(g, 6);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', STREU, 0))).toEqual([]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', STREU, 1))).toHaveLength(1);
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBeGreaterThan(0);
  });

  it('cannot be activated without a DON!! card on my field (DON!! −1 is a cost) or with Streusen rested', () => {
    const none0 = board(COST.c3, [COST.c2], { costArea: { active: 0, rested: 0 } });
    expect(offeredAbilities(none0, at(none0, 'p1', 'characters', STREU))).toEqual([]);
    const tired = board(COST.c3, [COST.c2], { characters: [{ card: STREU, rested: true }] });
    expect(offeredAbilities(tired, at(tired, 'p1', 'characters', STREU))).toEqual([]);
  });

  it('DON!! given to a Character can pay DON!! −1 when the cost area is empty', () => {
    const g = board(COST.c3, [COST.c2], {
      characters: [STREU, { card: COST.c1, don: 1 }],
      costArea: { active: 0, rested: 0 },
    });
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0, given: 1 });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', STREU))).toHaveLength(1);
  });

  it('with active and rested DON!! the player may return the rested one', () => {
    const g = board(COST.c3, [COST.c2], { costArea: { active: 2, rested: 1 } });
    useAbility(g, at(g, 'p1', 'characters', STREU));
    if (donChoices(g).length) {
      payDon(g, 1, 'costRested');
      expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
    } else {
      payDon(g, 1);
    }
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(2);
    chooseCost(g, 0);
  });

  it('must not: my own Characters and the opposing Leader are never offered', () => {
    const g = board(COST.c3, [COST.c2], { characters: [STREU, COST.c1] });
    fire(g, 3);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([COST.c2]);
    expect(offeredIds(g)).not.toContain(g.leader('p2'));
    act(g, { type: 'done' });
    expect(g.card(at(g, 'p1', 'characters', COST.c1)).rested).toBe(false);
  });
});
