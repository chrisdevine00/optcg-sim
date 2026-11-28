/** OP18-069 Sodomu & Gomora. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, payDon, V } from './helpers.ts';
import { koByEffect } from './helpers-a10g1.ts';
import { FF2, mine } from './helpers-op18-g3.ts';

const ID = 'OP18-069';
const start = (chars: (string | { card: string; rested: boolean })[], active = 3) =>
  mine({ characters: chars, costArea: { active, rested: 0 } }, {});
const offered = (g: ReturnType<typeof start>) => g.legal().some((a) => a.type === 'optional');

describe('OP18-069 Sodomu & Gomora', () => {
  it("if your {The Franky Family} Character would be K.O.'d, DON!! −1 and rest this Character instead", () => {
    const g = start([ID, FF2]);
    koByEffect(g, 'p1', FF2);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    payDon(g);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([FF2, ID].sort());
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', FF2)).rested).toBe(false);
    expect(don(g, 'p1').deck).toBe(8);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });

  it('it covers itself too (audit Q4)', () => {
    const g = start([ID]);
    koByEffect(g, 'p1', ID);
    accept(g);
    payDon(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it("declining lets the Character be K.O.'d and keeps the DON!!", () => {
    const g = start([ID, FF2]);
    koByEffect(g, 'p1', FF2);
    decline(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(don(g, 'p1').deck).toBe(7);
  });

  it('a Character that is not {The Franky Family} is not covered', () => {
    const g = start([ID, V.c2]);
    koByEffect(g, 'p1', V.c2);
    expect(offered(g)).toBe(false);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('a rested Sodomu & Gomora cannot pay the rest: not offered', () => {
    const g = start([{ card: ID, rested: true }, FF2]);
    koByEffect(g, 'p1', FF2);
    expect(offered(g)).toBe(false);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('without a DON!! on the field the DON!! −1 cannot be paid: not offered', () => {
    const g = start([ID, FF2], 0);
    koByEffect(g, 'p1', FF2);
    expect(offered(g)).toBe(false);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});
