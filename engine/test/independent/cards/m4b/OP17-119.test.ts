/**
 * OP17-119 Loki (Character, Black, cost 6, 8000, no Counter, {Giant}/{Elbaph}).
 *
 * Card text:
 *   "This Character gains +12 cost, and if it is your opponent's turn, this Character gains
 *    +3000 power.
 *    [On Play] K.O. your opponent's Characters with a total cost of 4 or less."
 *
 * Rules: QA-OP17 (self "+12 cost" applies on the field only); CR 8-3-2-5 / 10-2-12 ("if it is
 * your opponent's turn"); CR 10-2-1 (K.O.); a chosen set must have total current cost 4 or less
 * (every pick is legal only while the set stays within the budget); only the opponent's
 * Characters.
 */
import { describe, expect, it } from 'vitest';
import { donOf, kind, myTurn, reachablePickSets, theirTurn } from '../kit.ts';
import { C, drive, FILLER, ids, offeredCards, playCard, side, sorted, V } from './kit-c.ts';

const ID = 'OP17-119';

describe("OP17-119 Loki: +12 cost on the field, +3000 power on the opponent's turn", () => {
  it('in hand cost 6 (paid 6), on the field cost 18', () => {
    const g = myTurn(
      side(C.luffy, FILLER, { hand: [ID], costArea: { active: 6, rested: 0 } }),
      side(C.shanks, FILLER),
    );
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(6);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 6 });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(18);
  });

  it("power is 8000 on my turn and 11000 on the opponent's turn", () => {
    const mine = myTurn(side(C.luffy, FILLER, { characters: [ID] }), side(C.shanks, FILLER));
    expect(mine.power(mine.find('p1', 'characters', ID))).toBe(8000);
    const theirs = theirTurn(side(C.luffy, FILLER, { characters: [ID] }), side(C.shanks, FILLER));
    expect(theirs.power(theirs.find('p1', 'characters', ID))).toBe(11000);
  });

  it('the cost 18 makes it a "Character with a cost of 12 or more" (Usopp OP17-080 gets +3000)', () => {
    const g = myTurn(
      side(C.luffy, FILLER, { characters: [ID, 'OP17-080'] }),
      side(C.shanks, FILLER),
    );
    expect(g.power(g.find('p1', 'characters', 'OP17-080'))).toBe(5000);
  });
});

describe("OP17-119 Loki: [On Play] K.O. the opponent's Characters with a total cost of 4 or less", () => {
  function game(theirs: string[], mine: string[] = []) {
    return myTurn(
      side(C.luffy, FILLER, { hand: [ID], characters: mine, costArea: { active: 6, rested: 0 } }),
      side(C.shanks, FILLER, { characters: theirs }),
    );
  }

  it("cost 1 + cost 3 (total exactly 4) can both be K.O.'d", () => {
    const g = game([V.sunny, V.marco, V.kingdew]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {
      targets: [g.find('p2', 'characters', V.marco), g.find('p2', 'characters', V.sunny)],
    });
    expect(sorted(ids(g, 'p2', 'trash'))).toEqual(sorted([V.sunny, V.marco]));
    expect(ids(g, 'p2', 'characters')).toEqual([V.kingdew]);
  });

  it('a cost 5 Character is never a candidate (over the budget alone)', () => {
    const g = game([V.kingdew, V.sunny]);
    playCard(g, 'p1', ID);
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual([V.sunny]);
  });

  it('no reachable selection exceeds a total cost of 4 (cost 2 + cost 3 = 5 is never allowed together)', () => {
    const g = game([V.sai, V.marco, V.sunny]);
    playCard(g, 'p1', ID);
    const sets = reachablePickSets(g);
    const cost: Record<string, number> = { [V.sai]: 2, [V.marco]: 3, [V.sunny]: 1 };
    for (const set of sets) {
      const picked = set === '' ? [] : set.split('+');
      expect(picked.reduce((n, c) => n + cost[c]!, 0)).toBeLessThanOrEqual(4);
    }
    // The two valid maximal selections are both reachable.
    expect(sets.has(sorted([V.marco, V.sunny]).join('+'))).toBe(true);
    expect(sets.has(sorted([V.sai, V.sunny]).join('+'))).toBe(true);
    expect(sets.has(sorted([V.sai, V.marco]).join('+'))).toBe(false);
  });

  it("only the opponent's Characters are candidates, not mine", () => {
    const g = game([V.sunny], [V.sai]);
    playCard(g, 'p1', ID);
    expect(offeredCards(g)).toEqual([V.sunny]);
  });

  it('with no opponent Characters the effect does nothing and Loki is still played', () => {
    const g = game([]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it("K.O.'d Characters go to their owner's trash", () => {
    const g = game([V.sunny]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p2', 'characters', V.sunny)] });
    expect(ids(g, 'p2', 'trash')).toEqual([V.sunny]);
    expect(ids(g, 'p1', 'trash')).toEqual([]);
  });
});
