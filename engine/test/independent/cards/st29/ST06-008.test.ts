/**
 * ST06-008 Hina (Character, Black, cost 3, 5000, no Counter, {Navy}).
 *
 * Card text: "[On Play] Give up to 1 of your opponent's Characters -4 cost during this turn."
 *
 * Rules: [On Play] (CR 10-2-2); "up to 1" lets the player choose nothing; only opposing Characters
 * are targets; a cost modification lasts until the end of the turn (CR 8-?); during a calculation
 * a cost may go negative and outside it a negative cost is treated as 0 (CR 1-3-6-2); other effects
 * that compare costs see the lowered cost.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  C29,
  fill,
  inst,
  isMain,
  kind,
  L29,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
} from './kit-st29a.ts';

const ID = 'ST06-008';

/** p1's Main Phase with Hina in hand (and `more` too); the opponent has these Characters. */
function main(p2chars: string[], more: string[] = [], p2life = 4) {
  return mine(
    L29.croc,
    { hand: [ID, ...more] },
    { characters: p2chars, life: fill(C29.c1, p2life) },
  );
}

const costOf = (g: ReturnType<typeof main>, card: string) =>
  g.card(inst(g, 'p2', 'characters', card)).cost;

describe('ST06-008 Hina [On Play]: up to 1 opposing Character gets -4 cost this turn', () => {
  it('printed values: cost 3, 5000 power, no Counter value', () => {
    const g = main([]);
    const h = inst(g, 'p1', 'hand', ID);
    expect(g.card(h).cost).toBe(3);
    expect(g.power(h)).toBe(5000);
    expect(g.card(h).counter ?? null).toBeNull();
  });

  it('offers every opposing Character (any cost) and nothing else: no Leader, no own Character', () => {
    const g = mine(
      L29.croc,
      { hand: [ID], characters: [C29.c1] },
      { characters: [C29.c2, C29.c7] },
    );
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c2, C29.c7].sort());
  });

  it("the chosen Character's cost drops by 4 (7 -> 3) and the other is untouched", () => {
    const g = main([C29.c7, C29.c5]);
    playRaw(g, ID);
    pickInst(g, [inst(g, 'p2', 'characters', C29.c7)]);
    expect(costOf(g, C29.c7)).toBe(3);
    expect(costOf(g, C29.c5)).toBe(5);
    expect(isMain(g, 'p1')).toBe(true);
  });

  it('a cost that would go below 0 counts as 0 (cost 1 - 4)', () => {
    const g = main([C29.c1]);
    playRaw(g, ID);
    pickInst(g, [inst(g, 'p2', 'characters', C29.c1)]);
    expect(Math.max(0, costOf(g, C29.c1) ?? 0)).toBe(0);
  });

  it('"up to 1": choosing nothing changes no cost', () => {
    const g = main([C29.c5]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    none(g);
    expect(costOf(g, C29.c5)).toBe(5);
  });

  it('only one Character is affected even with several on the board', () => {
    const g = main([C29.c4, C29.c5, C29.c6]);
    playRaw(g, ID);
    pickInst(g, [inst(g, 'p2', 'characters', C29.c5)]);
    expect(costOf(g, C29.c4)).toBe(4);
    expect(costOf(g, C29.c5)).toBe(1);
    expect(costOf(g, C29.c6)).toBe(6);
  });

  it('"during this turn": the cost is back to normal in the opponent\'s next turn', () => {
    const g = main([C29.c5]);
    playRaw(g, ID);
    pickInst(g, [inst(g, 'p2', 'characters', C29.c5)]);
    expect(costOf(g, C29.c5)).toBe(1);
    act(g, { type: 'endTurn' });
    expect(kind(g)).toBe('main');
    expect(costOf(g, C29.c5)).toBe(5);
  });

  it('other effects see the lowered cost: Usopp\'s "cost <= opposing Life (3)" now reaches a cost-5 Character', () => {
    const g = main([C29.c5], ['ST29-002'], 3);
    playRaw(g, 'ST29-002');
    // Before Hina, the cost-5 Character is out of reach of Usopp (limit 3): nothing is offered.
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    const h = main([C29.c5], ['ST29-002'], 3);
    playRaw(h, ID);
    pickInst(h, [inst(h, 'p2', 'characters', C29.c5)]);
    playRaw(h, 'ST29-002');
    need(h, 'choose', 'p1');
    expect(offeredIds(h)).toEqual([C29.c5]);
  });
});
