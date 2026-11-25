/**
 * OP10-094 Ryuma (Character, Black, cost 4, 6000, no Counter, {Land of Wano}/{Thriller Bark
 * Pirates}).
 *
 * Card text: "[DON!! x1] This Character gains [Double Attack]."
 *
 * Rules: [DON!! xN] is active while at least N DON!! are given to the card (CR 10-2-?); [Double
 * Attack] deals 2 damage to a Leader instead of 1 (CR 10-1-4); it changes nothing in a battle with
 * a Character.
 */
import { describe, expect, it } from 'vitest';
import { act, at, attack, kw, LD10, mine, noDefence, need, SC14, theirs } from './kit-op10c.ts';

const ID = 'OP10-094';

function game(don: number, p2chars: (string | { card: string; rested: boolean })[] = []) {
  return mine(
    LD10.plain,
    { characters: [{ card: ID, don }], costArea: { active: 3, rested: 0 } },
    { characters: p2chars },
  );
}

const double = (g: ReturnType<typeof game>) =>
  kw(g, at(g, 'p1', 'characters', ID)).includes('Double Attack');

describe('OP10-094 Ryuma [DON!! x1] gains [Double Attack]', () => {
  it('with 1 DON!! given it has [Double Attack]', () => {
    expect(double(game(1))).toBe(true);
  });

  it('boundary: with no DON!! given it does not', () => {
    expect(double(game(0))).toBe(false);
  });

  it('"x1" is a minimum: with 3 DON!! it still has it', () => {
    expect(double(game(3))).toBe(true);
  });

  it('giving the first DON!! this turn switches it on', () => {
    const g = game(0);
    expect(double(g)).toBe(false);
    act(g, { type: 'giveDon', target: at(g, 'p1', 'characters', ID) });
    expect(double(g)).toBe(true);
  });

  it('with 1 DON!!, an unblocked, uncountered attack on the Leader takes 2 Life cards', () => {
    const g = game(1);
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    noDefence(g);
    need(g, 'main', 'p1');
    expect(g.life('p2')).toBe(2);
    expect(g.zone('p2', 'hand')).toHaveLength(2);
  });

  it('without DON!! the same attack takes 1 Life card', () => {
    const g = game(0);
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('with 2 DON!! it still deals exactly 2 (not more)', () => {
    const g = game(2);
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(2);
  });

  it('attacking a rested Character takes no Life (Double Attack only matters for damage)', () => {
    const g = game(1, [{ card: SC14.c1, rested: true }]);
    attack(g, at(g, 'p1', 'characters', ID), g.find('p2', 'characters', SC14.c1));
    noDefence(g);
    expect(g.life('p2')).toBe(4);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it("the keyword also shows on the opponent's turn while the DON!! stays given", () => {
    const g = theirs(LD10.plain, { characters: [{ card: ID, don: 1 }] }, {});
    expect(kw(g, at(g, 'p1', 'characters', ID))).toContain('Double Attack');
  });
});
