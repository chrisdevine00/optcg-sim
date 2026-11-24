/**
 * OP13-009 Curly.Dadan (Character, Red, cost 1, 2000, Counter +1000, {Mountain Bandits}, Slash).
 *
 * Card text: "If you have a "Mountain Bandits" type Character other than this card, this Character
 * gains [Double Attack]."
 *
 * Rules: a permanent effect applies while its condition holds (CR 8-1-3-3); [Double Attack] makes
 * damage to the opponent's Leader from this card's attack 2 (CR 10-1-2-1). "Other than this card"
 * excludes the card itself, but a second copy of Dadan counts. Only my Characters on the field.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  endTurn,
  kw,
  L13,
  mine,
  need,
  noDefence,
  opponentKOs,
  SC2,
  theirs,
  V13,
} from './kit-op13a.ts';

const DADAN = 'OP13-009';
const MB = V13.higumaB; // ST08-008 Higuma: {Mountain Bandits}, 2000, inert on the field

function hasDA(g: ReturnType<typeof mine>, nth = 0) {
  return kw(g, at(g, 'p1', 'characters', DADAN, nth)).includes('Double Attack');
}

describe('OP13-009 Curly.Dadan: [Double Attack] while I have another {Mountain Bandits} Character', () => {
  it('printed values: cost 1, 2000, Counter +1000, no keyword by itself', () => {
    const g = mine(L13.luffy, { characters: [DADAN] });
    const c = g.card(at(g, 'p1', 'characters', DADAN));
    expect(c.cost).toBe(1);
    expect(c.power).toBe(2000);
    expect(c.counter).toBe(1000);
    expect(hasDA(g)).toBe(false);
  });

  it('alone it has no [Double Attack] (the card itself does not count)', () => {
    const g = mine(L13.luffy, { characters: [DADAN, V13.marco] });
    expect(hasDA(g)).toBe(false);
  });

  it('with another {Mountain Bandits} Character it gains [Double Attack]', () => {
    const g = mine(L13.luffy, { characters: [DADAN, MB] });
    expect(hasDA(g)).toBe(true);
  });

  it('a second copy of Curly.Dadan counts as "other than this card": both gain it', () => {
    const g = mine(L13.luffy, { characters: [DADAN, DADAN] });
    expect(hasDA(g, 0)).toBe(true);
    expect(hasDA(g, 1)).toBe(true);
  });

  it('a rested {Mountain Bandits} Character still counts', () => {
    const g = mine(L13.luffy, { characters: [DADAN, { card: MB, rested: true }] });
    expect(hasDA(g)).toBe(true);
  });

  it('a {Mountain Bandits} card in my hand, or on the opponent field, does not count', () => {
    const inHand = mine(L13.luffy, { characters: [DADAN], hand: [MB] });
    expect(hasDA(inHand)).toBe(false);
    const theirField = mine(L13.luffy, { characters: [DADAN] }, { characters: [MB] });
    expect(hasDA(theirField)).toBe(false);
  });

  it('a Character of another type does not count', () => {
    const g = mine(L13.luffy, { characters: [DADAN, V13.koala, V13.sunny1] });
    expect(hasDA(g)).toBe(false);
  });

  it('with the keyword, a hit on the Leader deals 2 damage; without it, 1', () => {
    const withDA = mine(L13.luffy, { characters: [DADAN, MB] });
    const without = mine(L13.luffy, { characters: [DADAN] });
    for (const g of [withDA, without]) {
      const d = at(g, 'p1', 'characters', DADAN);
      for (let i = 0; i < 3; i++) act(g, { type: 'giveDon', target: d });
      expect(g.power(d)).toBe(5000);
      attack(g, d, g.leader('p2'));
      noDefence(g);
      need(g, 'main', 'p1');
    }
    expect(withDA.life('p2')).toBe(2);
    expect(without.life('p2')).toBe(3);
  });

  it('the keyword is lost when the other {Mountain Bandits} Character leaves the field', () => {
    const g = theirs(L13.luffy, { characters: [DADAN, MB] }, { hand: [SC2.lightning] });
    expect(hasDA(g)).toBe(true);
    opponentKOs(g, at(g, 'p1', 'characters', MB));
    expect(hasDA(g)).toBe(false);
  });

  it("the keyword is not turn-limited: it is still there in the opponent's turn", () => {
    const g = mine(L13.luffy, { characters: [DADAN, MB] });
    expect(hasDA(g)).toBe(true);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(hasDA(g)).toBe(true);
  });
});
