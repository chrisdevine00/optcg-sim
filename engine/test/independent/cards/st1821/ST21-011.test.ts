/**
 * ST21-011 Franky (Red Character, cost 3, 4000, Counter +1000, {Straw Hat Crew}).
 * "[DON!! x2] [Opponent's Turn] All of your {Straw Hat Crew} type Characters with 4000 base power
 * or less gain +1000 power."
 * Rules: needs at least 2 DON!! given to Franky; Characters only (not the Leader); the limit is on
 * BASE power; Franky himself qualifies (4000, {Straw Hat Crew}); opponent's turn only.
 */
import { describe, expect, it } from 'vitest';
import { attack, cost, inst, LD, mine, noDefence, SC, theirs } from './kit-st1821a.ts';

const ID = 'ST21-011';
const JINBE = SC.shc2; // {Straw Hat Crew}, base 4000
const ROBIN = SC.shc3; // {Straw Hat Crew}, base 5000
const SAI = SC.c2; // not {Straw Hat Crew}, base 4000
const SUNNY = SC.shc1; // {Straw Hat Crew}, base 3000

function pos(don: number) {
  return theirs(LD.luffy, { characters: [{ card: ID, don }, JINBE, ROBIN, SAI, SUNNY] });
}

describe("ST21-011 Franky: [DON!! x2] [Opponent's Turn] my {Straw Hat Crew} Characters with 4000 base power or less gain +1000", () => {
  it('with 2 DON!! given, on the opponent turn a 4000-base {Straw Hat Crew} Character has 5000', () => {
    const g = pos(2);
    expect(g.power(inst(g, 'p1', 'characters', JINBE))).toBe(5000);
  });

  it('a 3000-base {Straw Hat Crew} Character gets it too: 4000', () => {
    const g = pos(2);
    expect(g.power(inst(g, 'p1', 'characters', SUNNY))).toBe(4000);
  });

  it('Franky himself (base 4000, {Straw Hat Crew}) gains +1000: 5000', () => {
    const g = pos(2);
    expect(g.power(inst(g, 'p1', 'characters', ID))).toBe(5000);
  });

  it('base power boundary: a {Straw Hat Crew} Character with base 5000 gets nothing', () => {
    const g = pos(2);
    expect(g.power(inst(g, 'p1', 'characters', ROBIN))).toBe(5000);
  });

  it('the type matters: a 4000-base Character that is not {Straw Hat Crew} gets nothing', () => {
    const g = pos(2);
    expect(g.power(inst(g, 'p1', 'characters', SAI))).toBe(4000);
  });

  it('with only 1 DON!! given there is no bonus for anyone', () => {
    const g = pos(1);
    expect(g.power(inst(g, 'p1', 'characters', JINBE))).toBe(4000);
    expect(g.power(inst(g, 'p1', 'characters', ID))).toBe(4000);
  });

  it('the bonus is not cumulative with more DON!!: 3 DON!! still give +1000', () => {
    const g = pos(3);
    expect(g.power(inst(g, 'p1', 'characters', JINBE))).toBe(5000);
  });

  it('Characters only: my Leader keeps its 5000', () => {
    const g = pos(2);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('on my own turn there is no bonus (only the +1000 per DON!! given to Franky himself)', () => {
    const g = mine(LD.luffy, { characters: [{ card: ID, don: 2 }, JINBE], ...cost(5) });
    expect(g.power(inst(g, 'p1', 'characters', JINBE))).toBe(4000);
  });

  it('battle: a rested 4000-base Jinbe (5000 now) survives a 4000-power attacker', () => {
    const g = theirs(
      LD.luffy,
      {
        characters: [
          { card: ID, don: 2 },
          { card: JINBE, rested: true },
        ],
      },
      { characters: [SAI] },
    );
    attack(g, inst(g, 'p2', 'characters', SAI), inst(g, 'p1', 'characters', JINBE));
    noDefence(g);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([ID, JINBE].sort());
  });
});
