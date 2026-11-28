/**
 * OP18-092 Roronoa Zoro (Black Character, cost 2, 2000, Counter +1000, {Elbaph}/{Straw Hat Crew}).
 *
 * Card text: "If there is a Character with a cost of 12 or more, this Character gains +3000 power.
 *             If you have 10 or more cards in your trash, this Character gains [Rush]."
 *
 * Reading: "there is a Character" counts every Character on the field, either player's. The two
 * lines are independent. 12 is the boundary (P-041 has cost 10, no printed Character has 12);
 * 10 is the trash boundary.
 * Scenery: OP18-089 Dorry (cost 4+12 = 16), P-041 Monkey.D.Luffy (cost 10), vanilla OP02-060
 * Mohji as trash filler.
 */
import { describe, expect, it } from 'vitest';
import { at, canHit, kw, LDR } from './kit-e.ts';
import { mineE, X } from './kit-e.ts';

const Z = X.zoro;
const DORRY = X.dorry;
const TEN = 'P-041';
const fill = (n: number) => Array.from({ length: n }, () => 'OP02-060');

describe('OP18-092 Roronoa Zoro: +3000 power if there is a Character with cost 12 or more', () => {
  it('alone: printed 2000', () => {
    const g = mineE(LDR.luffy, { characters: [Z] });
    expect(g.power(at(g, 'p1', 'characters', Z))).toBe(2000);
  });

  it('with my own Giant (cost 16) on the field: 5000', () => {
    const g = mineE(LDR.luffy, { characters: [Z, DORRY] });
    expect(g.power(at(g, 'p1', 'characters', Z))).toBe(5000);
  });

  it('with the opponent’s Giant on the field: 5000 ("there is a Character", not "you have")', () => {
    const g = mineE(LDR.luffy, { characters: [Z] }, { characters: [DORRY] });
    expect(g.power(at(g, 'p1', 'characters', Z))).toBe(5000);
  });

  it('boundary: a cost 10 Character (either side) does not switch it on', () => {
    const g = mineE(LDR.luffy, { characters: [Z, TEN] }, { characters: [TEN] });
    expect(g.power(at(g, 'p1', 'characters', Z))).toBe(2000);
  });

  it('a Giant in the hand or trash does not count (only the field; its +12 is a field effect)', () => {
    const g = mineE(LDR.luffy, { characters: [Z], hand: [DORRY], trash: [DORRY] });
    expect(g.power(at(g, 'p1', 'characters', Z))).toBe(2000);
  });
});

describe('OP18-092 Roronoa Zoro: [Rush] if you have 10 or more cards in your trash', () => {
  it('10 cards: Zoro has [Rush] and can attack the turn it is played', () => {
    const g = mineE(LDR.luffy, {
      characters: [{ card: Z, playedThisTurn: true }],
      trash: fill(10),
    });
    expect(kw(g, at(g, 'p1', 'characters', Z))).toContain('Rush');
    expect(canHit(g, at(g, 'p1', 'characters', Z), g.leader('p2'))).toBe(true);
  });

  it('boundary: 9 cards: no [Rush], and a Character played this turn cannot attack', () => {
    const g = mineE(LDR.luffy, { characters: [{ card: Z, playedThisTurn: true }], trash: fill(9) });
    expect(kw(g, at(g, 'p1', 'characters', Z))).not.toContain('Rush');
    expect(canHit(g, at(g, 'p1', 'characters', Z), g.leader('p2'))).toBe(false);
  });

  it('only my own trash counts: 10 cards in the opponent’s trash give nothing', () => {
    const g = mineE(
      LDR.luffy,
      { characters: [{ card: Z, playedThisTurn: true }], trash: fill(3) },
      { trash: fill(10) },
    );
    expect(kw(g, at(g, 'p1', 'characters', Z))).not.toContain('Rush');
  });

  it('the two lines are independent: [Rush] without a Giant keeps 2000 power', () => {
    const g = mineE(LDR.luffy, { characters: [Z], trash: fill(12) });
    expect(kw(g, at(g, 'p1', 'characters', Z))).toContain('Rush');
    expect(g.power(at(g, 'p1', 'characters', Z))).toBe(2000);
  });

  it('both lines together: 5000 power and [Rush]', () => {
    const g = mineE(LDR.luffy, { characters: [Z, DORRY], trash: fill(10) });
    expect(kw(g, at(g, 'p1', 'characters', Z))).toContain('Rush');
    expect(g.power(at(g, 'p1', 'characters', Z))).toBe(5000);
  });
});
