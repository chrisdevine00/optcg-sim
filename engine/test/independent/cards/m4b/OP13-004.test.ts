/**
 * OP13-004 Sabo (Leader, Red/Black, 5000, 5 Life, {Revolutionary Army}/{Dressrosa}).
 *
 * Card text (override textPatch restores the dropped sign):
 *   "If you have 4 or more Life cards, give this Leader −1000 power.
 *    [DON!! x1] If you have a Character with a cost of 8 or more, your Leader and all of your
 *    Characters gain +1000 power."
 *
 * Rules: RL-51 (no per-card Q&A; both parts are permanent effects re-checked at every state
 * change, CR 8-1-3-3); RL-13 / CR 8-3-2-3 ([DON!! x1] holds on either turn while a DON!! is given);
 * CR 6-5-5-2 (given DON!! add +1000 only on their owner's turn); CR 2-7-6 (current cost).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { attack, fill, noDefence } from '../../helpers.ts';
import { myTurn, theirTurn } from '../kit.ts';
import { C, FILLER, leaderDon, side, V } from './kit-c.ts';

const ID = 'OP13-004';

function opp(
  life: number,
  chars: NonNullable<Partial<PlayerSpec>['characters']> = [],
  don = 0,
  spec: Parameters<typeof side>[2] = {},
) {
  const base = side(ID, FILLER, { life: fill(FILLER, life), characters: chars, ...spec });
  return don ? leaderDon(base, don) : base;
}

describe('OP13-004 Sabo: 4 or more Life → this Leader gets −1000 power', () => {
  it.each([
    [5, 4000],
    [4, 4000],
    [3, 5000],
    [1, 5000],
  ])("with %i Life the Leader has %i power (opponent's turn, no DON!!)", (life, power) => {
    const g = theirTurn(opp(life), side(C.luffy, FILLER));
    expect(g.power(g.leader('p1'))).toBe(power);
  });

  it('it is a −1000 (not +1000): 5 Life Leader is below its printed 5000', () => {
    const g = theirTurn(opp(5), side(C.luffy, FILLER));
    expect(g.power(g.leader('p1'))!).toBeLessThan(5000);
  });

  it('the condition is re-checked live: taking a damage from 4 Life to 3 restores 5000 at once', () => {
    const g = theirTurn(opp(4), side(C.luffy, FILLER));
    expect(g.power(g.leader('p1'))).toBe(4000);
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefence(g);
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('on my own turn the same −1000 applies (permanent, not tied to a turn)', () => {
    const g = myTurn(opp(4), side(C.luffy, FILLER));
    expect(g.power(g.leader('p1'))).toBe(4000);
  });
});

describe('OP13-004 Sabo: [DON!! x1] with a cost 8+ Character, Leader and Characters get +1000', () => {
  it("opponent's turn, 3 Life, DON!! given to the Leader, an 8-cost Character: Leader 5000 + 1000, Character +1000", () => {
    const g = theirTurn(opp(3, [V.shiki8, V.marco], 1), side(C.luffy, FILLER));
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', V.shiki8))).toBe(11000);
    expect(g.power(g.find('p1', 'characters', V.marco))).toBe(6000);
  });

  it('without a DON!! given to the Leader nothing is added', () => {
    const g = theirTurn(opp(3, [V.shiki8, V.marco]), side(C.luffy, FILLER));
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.marco))).toBe(5000);
  });

  it('boundary: a cost 7 Character is not enough', () => {
    const g = theirTurn(opp(3, [V.littleOars, V.marco], 1), side(C.luffy, FILLER));
    expect(g.power(g.leader('p1'))).toBe(5000 + 0);
    expect(g.power(g.find('p1', 'characters', V.marco))).toBe(5000);
  });

  it('the opponent\'s cost 8 Character does not count ("you have a Character")', () => {
    const g = theirTurn(opp(3, [V.marco], 1), side(C.luffy, FILLER, { characters: [V.shiki8] }));
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.marco))).toBe(5000);
  });

  it("both parts together: 4 Life (−1000) and the DON!! bonus (+1000) cancel on the opponent's turn", () => {
    const g = theirTurn(opp(4, [V.shiki8], 1), side(C.luffy, FILLER));
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.shiki8))).toBe(11000);
  });

  it('on my own turn the given DON!! also adds its own +1000: 3 Life, 1 DON!!, 8-cost → 7000', () => {
    const g = myTurn(opp(3, [V.shiki8], 1), side(C.luffy, FILLER));
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it("the bonus ends at once when the only cost-8 Character leaves the field (K.O.'d by a 12000 attacker)", () => {
    const g = theirTurn(
      opp(3, [{ card: V.shiki8, rested: true }, V.marco], 1),
      side(C.luffy, FILLER, { characters: [C.cost10] }),
    );
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', V.marco))).toBe(6000);
    attack(g, g.find('p2', 'characters', C.cost10), g.find('p1', 'characters', V.shiki8));
    noDefence(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.marco]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.marco))).toBe(5000);
  });

  it("[DON!! x1] is a threshold, not a count: 2 DON!! given still add only +1000 (opponent's turn)", () => {
    const g = theirTurn(opp(3, [V.shiki8], 2), side(C.luffy, FILLER));
    expect(g.power(g.leader('p1'))).toBe(6000);
  });
});
