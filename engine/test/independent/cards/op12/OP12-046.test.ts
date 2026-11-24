/**
 * OP12-046 Zephyr(Navy) (Character, Blue, cost 5, 5000, Counter +2000, {FILM}/{Navy}).
 *
 * Card text: "[On Play] Trash 2 cards from your hand. [Activate: Main] You may trash this Character:
 * Return up to 1 Character with a cost of 5 or less to the owner's hand."
 *
 * Rules: [On Play] is mandatory and exact: it trashes 2 cards, or as many as the hand holds
 * (CR 8-4-1: do as much as possible). The cost "trash this Character" is paid when the effect is
 * activated; it cannot then be a target. "Up to 1" may be none. Either player's Character can be
 * returned, and it goes to its owner's hand. The cost limit reads the current cost (CR 4-9).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  cast,
  chars,
  hand,
  kind,
  LB,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickCards,
  pickInst,
  SB,
  trash,
} from './kit-op12b.ts';

const ZEPHYR = 'OP12-046';

function activateZephyr(g: ReturnType<typeof mine>): void {
  const z = g.find('p1', 'characters', ZEPHYR);
  act(g, { type: 'activate', card: z, ability: offeredAbilities(g, z)[0]! });
}

describe('OP12-046 Zephyr(Navy): [On Play] trash 2 from hand; [Activate: Main] trash this: return a cost 5 or less Character', () => {
  it('[On Play] trashes the 2 cards I pick from my hand', () => {
    const g = mine(LB.croc, { hand: [ZEPHYR, SB.sai, SB.marco, SB.kingdew] });
    cast(g, ZEPHYR);
    const d = need(g, 'choose', 'p1');
    expect([d.min, d.max]).toEqual([2, 2]);
    // Unordered picks are listed in canonical order, so the last card is not offered as a first pick.
    expect(offeredIds(g).length).toBeGreaterThanOrEqual(2);
    pickCards(g, [SB.sai, SB.kingdew]);
    expect(trash(g)).toEqual([SB.kingdew, SB.sai].sort());
    expect(hand(g)).toEqual([SB.marco]);
    expect(chars(g)).toEqual([ZEPHYR]);
  });

  it('the trash is not optional: there is no way to trash fewer than 2 when 2 are available', () => {
    const g = mine(LB.croc, { hand: [ZEPHYR, SB.sai, SB.marco] });
    cast(g, ZEPHYR);
    need(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('boundary: with only 1 other card in hand, that 1 is trashed', () => {
    const g = mine(LB.croc, { hand: [ZEPHYR, SB.sai] });
    cast(g, ZEPHYR);
    if (kind(g) === 'choose') pickCards(g, [SB.sai]);
    expect(trash(g)).toEqual([SB.sai]);
    expect(hand(g)).toEqual([]);
  });

  it('boundary: with no other card in hand nothing is trashed and Zephyr stays', () => {
    const g = mine(LB.croc, { hand: [ZEPHYR] });
    cast(g, ZEPHYR);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(trash(g)).toEqual([]);
    expect(chars(g)).toEqual([ZEPHYR]);
  });

  it("[Activate: Main] trashes Zephyr and returns the chosen cost 5 Character of the opponent to its owner's hand", () => {
    const g = mine(LB.croc, { characters: [ZEPHYR] }, { characters: [SB.kingdew, SB.thatch] });
    activateZephyr(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(SB.kingdew);
    pickInst(g, [g.find('p2', 'characters', SB.kingdew)]);
    expect(trash(g)).toEqual([ZEPHYR]);
    expect(chars(g)).toEqual([]);
    expect(hand(g, 'p2')).toEqual([SB.kingdew]);
    expect(chars(g, 'p2')).toEqual([SB.thatch]);
    expect(hand(g)).toEqual([]);
  });

  it('boundary: a cost 6 Character is not offered, cost 5 and lower are, my own included', () => {
    const g = mine(
      LB.croc,
      { characters: [ZEPHYR, SB.mohji] },
      { characters: [SB.kingdew, SB.thatch, SB.oars] },
    );
    activateZephyr(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.kingdew, SB.mohji].sort());
  });

  it('Zephyr paid itself as the cost, so it is never offered as the target; returning my own Character works', () => {
    const g = mine(LB.croc, { characters: [ZEPHYR, SB.marco] });
    activateZephyr(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(ZEPHYR);
    pickInst(g, [g.find('p1', 'characters', SB.marco)]);
    expect(hand(g)).toEqual([SB.marco]);
    expect(trash(g)).toEqual([ZEPHYR]);
  });

  it('"up to 1": the target may be left empty; the cost is already paid, so Zephyr is trashed', () => {
    const g = mine(LB.croc, { characters: [ZEPHYR] }, { characters: [SB.kingdew] });
    activateZephyr(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(trash(g)).toEqual([ZEPHYR]);
    expect(chars(g, 'p2')).toEqual([SB.kingdew]);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('can be activated in the turn it was played (no Rush needed)', () => {
    const g = mine(LB.croc, { hand: [ZEPHYR, SB.sai, SB.marco] }, { characters: [SB.kingdew] });
    cast(g, ZEPHYR);
    pickCards(g, [SB.sai, SB.marco]);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, g.find('p1', 'characters', ZEPHYR))).toHaveLength(1);
  });
});
