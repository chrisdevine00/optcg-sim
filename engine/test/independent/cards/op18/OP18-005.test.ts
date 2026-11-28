/**
 * OP18-005 Kung Fu Jugon (Red Character, cost 1, 0 power, {Animal}/{Alabasta}).
 *
 * Card text (cards/data):
 *   "[Your Turn] This Character gains +1000 power for every [Kung Fu Jugon]."
 *
 * Reading (m6b-audit Q1): copies on your own field, this Character included (a lone one is +1000).
 * Only during your own turn.
 */
import { describe, expect, it } from 'vitest';
import { at, LC, mine, playCard, theirs, VC } from './kit-c.ts';

const JUGON = 'OP18-005';

describe('OP18-005 Kung Fu Jugon: [Your Turn] +1000 for every [Kung Fu Jugon]', () => {
  it('a lone Jugon counts itself: 1000 power on your turn', () => {
    const g = mine(LC.luffy, { characters: [JUGON] });
    expect(g.power(at(g, 'p1', 'characters', JUGON))).toBe(1000);
  });

  it('two Jugons: each has 2000', () => {
    const g = mine(LC.luffy, { characters: [JUGON, JUGON] });
    expect(g.power(at(g, 'p1', 'characters', JUGON, 0))).toBe(2000);
    expect(g.power(at(g, 'p1', 'characters', JUGON, 1))).toBe(2000);
  });

  it('three Jugons: each has 3000', () => {
    const g = mine(LC.luffy, { characters: [JUGON, JUGON, JUGON] });
    for (let i = 0; i < 3; i++) expect(g.power(at(g, 'p1', 'characters', JUGON, i))).toBe(3000);
  });

  it('playing a second Jugon raises the first one at once', () => {
    const g = mine(LC.luffy, { characters: [JUGON], hand: [JUGON] });
    playCard(g, JUGON);
    expect(g.power(at(g, 'p1', 'characters', JUGON, 0))).toBe(2000);
    expect(g.power(at(g, 'p1', 'characters', JUGON, 1))).toBe(2000);
  });

  it('only on your turn: on the opponent’s turn the base 0 power remains', () => {
    const g = theirs(LC.luffy, { characters: [JUGON, JUGON] });
    expect(g.power(at(g, 'p1', 'characters', JUGON, 0))).toBe(0);
  });

  it('cards with other names do not count', () => {
    const g = mine(LC.luffy, { characters: [JUGON, VC.karoo1, VC.sanji1] });
    expect(g.power(at(g, 'p1', 'characters', JUGON))).toBe(1000);
  });

  it('the opponent’s Jugons do not count for yours', () => {
    const g = mine(LC.luffy, { characters: [JUGON] }, { characters: [JUGON, JUGON] });
    expect(g.power(at(g, 'p1', 'characters', JUGON))).toBe(1000);
  });

  it('a Jugon in hand or trash does not count', () => {
    const g = mine(LC.luffy, { characters: [JUGON], hand: [JUGON], trash: [JUGON] });
    expect(g.power(at(g, 'p1', 'characters', JUGON))).toBe(1000);
  });
});
