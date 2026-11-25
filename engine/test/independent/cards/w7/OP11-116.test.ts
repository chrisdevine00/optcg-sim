/**
 * OP11-116 Merman Combat Ultramarine (Event, Yellow, cost 6, {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "[Main] Add up to 1 Character with a cost of 6 or less to the top or bottom of the
 * owner's Life cards face-up.
 * [Trigger] Add up to 1 of your opponent's Characters with a cost of 4 or less to the top or
 * bottom of the owner's Life cards face-up."
 *
 * Rules: CR 4-8-1 ("up to 1"), rules-digest 107 (top or bottom of Life; into an empty Life area
 * it simply goes in), CR 3-10-2-1 (face-up Life), the card goes to its OWNER's Life, the
 * controller of the effect chooses the end, a Character placed in Life is not K.O.'d (no [On
 * K.O.]), DON!! given to it return to its owner's cost area (CR 6-5-5-3), CR 10-1-5 ([Trigger]:
 * activated instead of adding the card to the hand, then trashed), CR 2-7-3 (Event trashed after
 * use). Scenery (printed): OP01-010 (cost 1) / OP01-012 (2) / OP01-018 (4) / OP02-006 (5) /
 * OP02-007 (6) / OP02-020 (7) vanilla Red Characters; OP01-080 Zala ([On K.O.] Draw a card).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { decision, isLegal, noDefence } from '../../helpers.ts';
import { myTurn, side, theirTurn } from '../kit.ts';
import {
  anomalies,
  asksOption,
  BLUE,
  donTotal,
  handOf,
  L7,
  lifeFaces,
  lifeOf,
  mayEnd,
  need,
  none,
  offeredIds,
  ofZone,
  optionIds,
  pickCards,
  pickOption,
  put,
  RED,
  S7,
} from './kit-w7a.ts';

const ID = 'OP11-116';
const [A, B] = [S7.c1, S7.c2];

function start(o: Partial<PlayerSpec> = {}, opp: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(L7.luffy, BLUE, {
      hand: [ID],
      life: [A, B],
      characters: [S7.c4],
      costArea: { active: 6, rested: 0 },
      ...o,
    }),
    side(L7.crocodile, RED, {
      life: [S7.c3, S7.c5],
      characters: [S7.c6, S7.c7, S7.c5],
      ...opp,
    }),
  );
}

describe("OP11-116 Merman Combat Ultramarine: [Main] add up to 1 Character (cost 6 or less) to the top or bottom of its owner's Life face-up", () => {
  it("printed effect: the opponent's cost-6 Character goes on top of THEIR Life, face-up", () => {
    const g = start();
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [S7.c6]);
    pickOption(g, 'top');
    expect(decision(g)?.kind).toBe('main');
    expect(lifeOf(g, 'p2')).toEqual([S7.c6, S7.c3, S7.c5]);
    expect(lifeFaces(g, 'p2')).toEqual([true, false, false]);
    expect(ofZone(g, 'p2', 'characters')).toEqual([S7.c5, S7.c7].sort());
    expect(lifeOf(g, 'p1')).toEqual([A, B]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([ID]);
    expect(anomalies(g)).toBe(0);
  });

  it('the Event is played for its cost of 6: with 5 active DON!! it cannot be played', () => {
    const g = start({ costArea: { active: 5, rested: 0 } });
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', ID) })).toBe(false);
  });

  it("my own Character is a legal choice and goes to MY Life (the owner's), face-up", () => {
    const g = start();
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(S7.c4);
    pickCards(g, [S7.c4]);
    pickOption(g, 'top');
    expect(lifeOf(g, 'p1')).toEqual([S7.c4, A, B]);
    expect(lifeFaces(g, 'p1')).toEqual([true, false, false]);
    expect(g.life('p2')).toBe(2);
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
  });

  it('"bottom": I choose the end, even for the opponent\'s Life', () => {
    const g = start();
    put(g, ID);
    pickCards(g, [S7.c5]);
    pickOption(g, 'bottom');
    expect(lifeOf(g, 'p2')).toEqual([S7.c3, S7.c5, S7.c5]);
    expect(lifeFaces(g, 'p2')).toEqual([false, false, true]);
    expect(g.life('p2')).toBe(3);
  });

  it('cost boundary: every Character of cost 6 or less (either side) is offered; the cost-7 one is not', () => {
    const g = start();
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([S7.c4, S7.c5, S7.c6].sort());
  });

  it('"up to 1": choosing none moves nothing, and the Event is still used up', () => {
    const g = start();
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    none(g);
    expect(decision(g)?.kind).toBe('main');
    expect(g.life('p1')).toBe(2);
    expect(g.life('p2')).toBe(2);
    expect(ofZone(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('into an empty Life area: the Character simply goes in, face-up', () => {
    const g = start({}, { life: [] });
    put(g, ID);
    pickCards(g, [S7.c6]);
    if (asksOption(g, 'p1')) pickOption(g, 'top');
    expect(lifeOf(g, 'p2')).toEqual([S7.c6]);
    expect(lifeFaces(g, 'p2')).toEqual([true]);
  });

  it("the Character is not K.O.'d: its [On K.O.] does not fire and it is not in the trash", () => {
    const g = start({}, { characters: [S7.zala], hand: [S7.c1] });
    put(g, ID);
    pickCards(g, [S7.zala]);
    pickOption(g, 'top');
    expect(handOf(g, 'p2')).toEqual([S7.c1]);
    expect(ofZone(g, 'p2', 'trash')).toEqual([]);
    expect(lifeOf(g, 'p2')[0]).toBe(S7.zala);
  });

  it('DON!! given to the placed Character return to its owner: their DON!! total is unchanged', () => {
    const g = start(
      {},
      { characters: [{ card: S7.c6, don: 2 }], costArea: { active: 1, rested: 0 } },
    );
    const before = donTotal(g, 'p2');
    put(g, ID);
    pickCards(g, [S7.c6]);
    pickOption(g, 'top');
    expect(donTotal(g, 'p2')).toBe(before);
    expect(ofZone(g, 'p2', 'characters')).toEqual([]);
  });

  it('both Life areas are named by the card: the end question is the only option question', () => {
    const g = start();
    put(g, ID);
    pickCards(g, [S7.c6]);
    need(g, 'choose', 'p1');
    expect(optionIds(g).sort()).toEqual(['bottom', 'top']);
  });
});

describe("OP11-116 Merman Combat Ultramarine: [Trigger] add up to 1 opposing Character (cost 4 or less) to the top or bottom of the owner's Life face-up", () => {
  /** p2's Leader hits my Leader; my top Life card is the Event; I stop at the [Trigger] decision. */
  function struck(opp: Partial<PlayerSpec> = {}, mine: Partial<PlayerSpec> = {}) {
    const g = theirTurn(
      side(L7.luffy, BLUE, { life: [ID, B, A], characters: [S7.c1], ...mine }),
      side(L7.crocodile, RED, { life: [S7.c3, S7.c5], characters: [S7.c4, S7.c5, S7.c2], ...opp }),
    );
    g.act({ type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    noDefence(g);
    return g;
  }

  it("printed effect: only the opponent's Characters of cost 4 or less are offered; the chosen one goes face-up into their Life", () => {
    const g = struck();
    need(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([S7.c2, S7.c4].sort());
    pickCards(g, [S7.c4]);
    pickOption(g, 'top');
    expect(lifeOf(g, 'p2')).toEqual([S7.c4, S7.c3, S7.c5]);
    expect(lifeFaces(g, 'p2')).toEqual([true, false, false]);
    expect(ofZone(g, 'p2', 'characters')).toEqual([S7.c2, S7.c5].sort());
    // My own Character stays, my Life paid one card for the damage, the Event is trashed.
    expect(ofZone(g, 'p1', 'characters')).toEqual([S7.c1]);
    expect(g.life('p1')).toBe(2);
    expect(ofZone(g, 'p1', 'trash')).toEqual([ID]);
    expect(anomalies(g)).toBe(0);
  });

  it('"bottom" puts it at the bottom of the opponent\'s Life', () => {
    const g = struck();
    g.act({ type: 'trigger', activate: true });
    pickCards(g, [S7.c2]);
    pickOption(g, 'bottom');
    expect(lifeOf(g, 'p2')).toEqual([S7.c3, S7.c5, S7.c2]);
    expect(lifeFaces(g, 'p2')).toEqual([false, false, true]);
  });

  it('"up to 1": choosing none changes nothing', () => {
    const g = struck();
    g.act({ type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    none(g);
    expect(g.life('p2')).toBe(2);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it("cost 5 is above the Trigger's limit of 4 (it is only within the [Main]'s limit of 6)", () => {
    const g = struck({ characters: [S7.c5] });
    g.act({ type: 'trigger', activate: true });
    // No legal target: nothing to choose (an "up to" pick with no candidate may still be asked).
    while (decision(g)?.kind === 'choose') none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(g.life('p2')).toBe(2);
  });

  it('declining the [Trigger]: the Event card goes to my hand and nothing is placed', () => {
    const g = struck();
    g.act({ type: 'trigger', activate: false });
    expect(handOf(g, 'p1')).toEqual([ID]);
    expect(g.life('p2')).toBe(2);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });
});
