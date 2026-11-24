/** OP11-095 Monkey.D.Garp. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, don, expectDecision, none, pick, play, V } from './helpers.ts';
import {
  canPick,
  COST8,
  COST9,
  finishOrder,
  idsOf,
  mk,
  NAVY_B1,
  NAVY_B3,
  NAVY_B4,
} from './helpers-op11g3.ts';

const ID = 'OP11-095';
const NAVY_TRASH = [NAVY_B1, NAVY_B3, NAVY_B4, V.c1];

describe('OP11-095 Monkey.D.Garp', () => {
  const start = (
    trash: string[] = NAVY_TRASH,
    mine: string[] = [COST9],
    theirs: string[] = [V.c7, V.c3],
  ) =>
    mk(
      { hand: [ID], trash, characters: mine, costArea: { active: 8, rested: 0 } },
      { characters: theirs },
    );
  const paid = (g: ReturnType<typeof start>) => {
    play(g, ID);
    accept(g);
    // With exactly 3 "Navy" cards there is nothing to choose; the order is still asked (any order).
    expect(dec(g)?.kind).toBe('order');
    expect(dec(g)?.player).toBe('p1');
    finishOrder(g);
    // "give up to 1 rested DON!! to 1 of your Leader": the target is asked (min 0, max 1).
    expect(dec(g)?.max).toBe(1);
    pick(g, [g.leader('p1')]);
  };

  it('[On Play]: place 3 "Navy" cards from the trash at the deck bottom: give a rested DON!! to your Leader; with a cost 9+ Character, K.O. a cost 7 or less Character', () => {
    const g = start();
    paid(g);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c1]);
    expect(idsOf(g, 'p1', 'deck').slice(-3).sort()).toEqual([NAVY_B1, NAVY_B3, NAVY_B4].sort());
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 7 });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(true); // cost 7 is the boundary
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c3]);
    expectDecision(g, 'main', 'p1');
  });

  it('"cost of 7 or less": a cost 8 Character is not a candidate', () => {
    const g = start(NAVY_TRASH, [COST9], [COST8, V.c3]);
    paid(g);
    expect(canPick(g, g.find('p2', 'characters', COST8))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    none(g);
  });

  it("without a Character of cost 9 or more nothing is K.O.'d (cost 8 is not enough), but the DON!! is given", () => {
    const g = start(NAVY_TRASH, [COST8], [V.c3]);
    paid(g);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(dec(g)?.kind).toBe('main');
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c3]);
  });

  it("a cost 9+ Character of the opponent's counts too", () => {
    const g = start(NAVY_TRASH, [], [COST9, V.c3]);
    paid(g);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', COST9))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([COST9]);
  });

  it('the cost is optional: declining leaves the trash and does nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(idsOf(g, 'p1', 'trash')).toHaveLength(4);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('fewer than 3 "Navy" cards in the trash: the cost cannot be paid, no prompt', () => {
    const g = start([NAVY_B1, NAVY_B3, V.c1, V.c2]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('with 4 "Navy" cards in the trash you choose which 3 go to the deck bottom', () => {
    const g = start([NAVY_B1, NAVY_B3, NAVY_B4, 'EB02-042', V.c1]);
    play(g, ID);
    accept(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'trash', V.c1))).toBe(false);
    pick(g, [
      g.find('p1', 'trash', NAVY_B1),
      g.find('p1', 'trash', NAVY_B4),
      g.find('p1', 'trash', 'EB02-042'),
    ]);
    finishOrder(g);
    expect(idsOf(g, 'p1', 'trash').sort()).toEqual([NAVY_B3, V.c1].sort());
  });

  it('"up to 1" K.O.: may choose nobody', () => {
    const g = start();
    paid(g);
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
  });
});
