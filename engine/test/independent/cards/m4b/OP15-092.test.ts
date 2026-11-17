/**
 * OP15-092 Monkey.D.Luffy (Character, Black, cost 7, 7000, Counter +1000, {Straw Hat Crew}).
 *
 * Card text:
 *   "Apply each of the following effects based on the number of cards in your trash:
 *    • If there are 10 or more cards, this Character's base power becomes 9000 and it gains +10
 *      cost.
 *    • If you have 20 or more cards, during your opponent's turn, your Leader's base power
 *      becomes 7000.
 *    • If you have 30 or more cards, this Character gains +1000 power."
 *
 * Rules: CR 8-1-3-3 (permanent effects, re-checked live); "base power becomes" replaces the
 * printed power before modifiers; the tiers are cumulative ("each of the following"); CR 8-3-2-5
 * (opponent's turn condition); the count is the size of YOUR trash only.
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import { myTurn, theirTurn } from '../kit.ts';
import { C, FILLER, leaderDon, side } from './kit-c.ts';

const ID = 'OP15-092';

function mine(trash: number, turn: 'mine' | 'theirs' = 'mine', theirTrash = 0) {
  const p1 = side(C.luffy, FILLER, { characters: [ID], trash: fill('OP02-060', trash) });
  const p2 = side(C.shanks, FILLER, { trash: fill('OP02-060', theirTrash) });
  return turn === 'mine' ? myTurn(p1, p2) : theirTurn(p1, p2);
}

describe('OP15-092 Luffy: 10 or more cards in trash → base power 9000 and +10 cost', () => {
  it.each([
    [0, 7000, 7],
    [9, 7000, 7],
    [10, 9000, 17],
    [19, 9000, 17],
  ])('%i cards in trash → power %i, cost %i', (n, power, cost) => {
    const g = mine(n);
    const l = g.find('p1', 'characters', ID);
    expect(g.power(l)).toBe(power);
    expect(g.card(l).cost).toBe(cost);
  });

  it("the base-power change also applies on the opponent's turn", () => {
    const g = mine(10, 'theirs');
    expect(g.power(g.find('p1', 'characters', ID))).toBe(9000);
  });

  it("only MY trash counts: 10 cards in the opponent's trash do nothing", () => {
    const g = mine(2, 'mine', 12);
    const l = g.find('p1', 'characters', ID);
    expect(g.power(l)).toBe(7000);
    expect(g.card(l).cost).toBe(7);
  });

  it('with 10 cards its cost is 17 (12 or more), so OP17-080 Usopp gets +3000', () => {
    const g = myTurn(
      side(C.luffy, FILLER, { characters: [ID, 'OP17-080'], trash: fill('OP02-060', 10) }),
      side(C.shanks, FILLER),
    );
    expect(g.power(g.find('p1', 'characters', 'OP17-080'))).toBe(5000);
  });
});

describe("OP15-092 Luffy: 20 or more cards → on the opponent's turn the Leader's base power is 7000", () => {
  it.each([
    [19, 'theirs', 5000],
    [20, 'theirs', 7000],
    [20, 'mine', 5000],
    [25, 'theirs', 7000],
  ] as const)('%i cards, %s turn → Leader %i', (n, turn, power) => {
    const g = mine(n, turn);
    expect(g.power(g.leader('p1'))).toBe(power);
  });

  it("it is the base power: the Leader with 1 given DON!! is 7000 on the opponent's turn (given DON!! add no power then)", () => {
    const g = theirTurn(
      leaderDon(side(C.luffy, FILLER, { characters: [ID], trash: fill('OP02-060', 20) }), 1),
      side(C.shanks, FILLER),
    );
    expect(g.power(g.leader('p1'))).toBe(7000);
  });
});

describe('OP15-092 Luffy: 30 or more cards → this Character gains +1000 power', () => {
  it.each([
    [29, 9000],
    [30, 10000],
    [35, 10000],
  ])('%i cards → power %i', (n, power) => {
    const g = mine(n);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(power);
  });

  it("on the opponent's turn too (base 9000 + 1000)", () => {
    const g = mine(30, 'theirs');
    expect(g.power(g.find('p1', 'characters', ID))).toBe(10000);
  });

  it('modifiers stack on the replaced base: a given DON!! on my turn adds +1000 to the 9000 base (and to 10000 at 30 cards)', () => {
    for (const [n, power] of [
      [10, 10000],
      [30, 11000],
    ] as const) {
      const g = myTurn(
        side(C.luffy, FILLER, { characters: [{ card: ID, don: 1 }], trash: fill('OP02-060', n) }),
        side(C.shanks, FILLER),
      );
      expect(g.power(g.find('p1', 'characters', ID))).toBe(power);
    }
  });
});
