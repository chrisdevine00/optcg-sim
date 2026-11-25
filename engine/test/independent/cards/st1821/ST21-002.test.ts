/**
 * ST21-002 Usopp (Red Character, cost 2, 3000, Counter +2000, {Straw Hat Crew}).
 * "[DON!! x2] [Opponent's Turn] This Character gains +2000 power."
 * Rules: [DON!! x2] needs at least 2 DON!! given to this very Character; the bonus is not
 * cumulative with more DON!!; it applies on the opponent's turn only.
 * DON!! given to a card add +1000 power only on their owner's turn.
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../../fixtures/index.ts';
import { attack, BLUE, cost, inst, LD, many, mine, noDefence, SC, theirs } from './kit-st1821a.ts';

const ID = 'ST21-002';

function usoppOnTheirTurn(don: number, rested = false) {
  return theirs(LD.luffy, { characters: [{ card: ID, don, rested }] });
}

describe("ST21-002 Usopp: [DON!! x2] [Opponent's Turn] +2000 power", () => {
  it('with 2 DON!! given, on the opponent turn its power is 5000', () => {
    const g = usoppOnTheirTurn(2);
    expect(g.power(inst(g, 'p1', 'characters', ID))).toBe(5000);
  });

  it('with 1 DON!! given the bonus is missing: power 3000', () => {
    const g = usoppOnTheirTurn(1);
    expect(g.power(inst(g, 'p1', 'characters', ID))).toBe(3000);
  });

  it('with no DON!! given: power 3000', () => {
    const g = usoppOnTheirTurn(0);
    expect(g.power(inst(g, 'p1', 'characters', ID))).toBe(3000);
  });

  it('with 3 DON!! given the bonus is +2000 once, not twice: power 5000', () => {
    const g = usoppOnTheirTurn(3);
    expect(g.power(inst(g, 'p1', 'characters', ID))).toBe(5000);
  });

  it('on my own turn only the +1000 per DON!! applies (3000 + 2000), not the +2000 of the effect', () => {
    const g = mine(LD.luffy, { characters: [{ card: ID, don: 2 }], ...cost(5) });
    // Printed 3000, +1000 per DON!! given on my own turn, and no +2000 from the effect.
    expect(g.power(inst(g, 'p1', 'characters', ID))).toBe(5000);
  });

  it('DON!! given to my Leader do not count for Usopp', () => {
    const g = theirs(LD.luffy, { characters: [ID] });
    expect(g.power(inst(g, 'p1', 'characters', ID))).toBe(3000);
    const h = scenario({
      turn: 4,
      activePlayer: 'p2',
      firstPlayer: 'p1',
      p1: { leader: { card: LD.luffy, don: 2 }, characters: [ID], life: many(BLUE, 4) },
      p2: { leader: LD.luffy, life: many(BLUE, 4), costArea: { active: 10, rested: 0 } },
    });
    expect(h.power(inst(h, 'p1', 'characters', ID))).toBe(3000);
  });

  it('battle: a rested Usopp with 2 DON!! (5000) survives a 4000-power attacker', () => {
    const g = theirs(
      LD.luffy,
      { characters: [{ card: ID, don: 2, rested: true }] },
      { characters: [SC.c2] },
    );
    attack(g, inst(g, 'p2', 'characters', SC.c2), inst(g, 'p1', 'characters', ID));
    noDefence(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('battle: a rested Usopp with only 1 DON!! (3000) is K.O.d by the same 4000-power attacker', () => {
    const g = theirs(
      LD.luffy,
      { characters: [{ card: ID, don: 1, rested: true }] },
      { characters: [SC.c2] },
    );
    attack(g, inst(g, 'p2', 'characters', SC.c2), inst(g, 'p1', 'characters', ID));
    noDefence(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('battle: against a 5000-power attacker a 5000-power Usopp is K.O.d (attacker wins ties)', () => {
    const g = theirs(
      LD.luffy,
      { characters: [{ card: ID, don: 2, rested: true }] },
      { characters: [SC.c3] },
    );
    attack(g, inst(g, 'p2', 'characters', SC.c3), inst(g, 'p1', 'characters', ID));
    noDefence(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
