/**
 * OP15-051 Monkey.D.Luffy (Character, Blue, cost 3, 4000, Counter +2000, {Straw Hat Crew}/{Dressrosa}).
 *
 * Card text: "[Opponent's Turn] If your Leader has the "Dressrosa" type, this Character gains +3000 power."
 *
 * Rules: CR 8-3-2-5 / 10-2-12-1 ([Opponent's Turn] holds during the opponent's turn), CR 8-3-3 (a
 * condition), CR 6-5-5-2 (given DON!! add power on the owner's turn only), CR 7-1-4 (the attacker wins
 * a power tie).
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import { at, BLUE, inst, LD15, mine, RED, SCN, side, theirTurn, theirs } from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const LUFFY = 'OP15-051';
const luffy = (g: TestGame, n = 0) => at(g, 'p1', 'characters', LUFFY, n);

/** p2 attacks p1's rested Luffy with `attacker`; no block, no counter. Returns whether Luffy survived. */
function survives(leader: string, attacker: string): boolean {
  const g = theirTurn(
    side(leader, BLUE, { characters: [{ card: LUFFY, rested: true }] }),
    side(LD15.neutral, RED, { characters: [attacker] }),
  );
  attack(g, inst(g, 'p2', 'characters', attacker), luffy(g));
  passBlock(g);
  passCounter(g);
  return g.zone('p1', 'characters').some((c) => c.card === LUFFY);
}

describe('OP15-051 Monkey.D.Luffy: [Opponent’s Turn] if my Leader has "Dressrosa", +3000 power', () => {
  it('opponent’s turn with a {Dressrosa} Leader: 4000 + 3000 = 7000', () => {
    const g = theirs(LD15.dressrosa, { characters: [LUFFY] }, {});
    expect(g.power(luffy(g))).toBe(7000);
  });

  it('a Leader with several types, one of them {Dressrosa} (OP15-002 Lucy), qualifies', () => {
    const g = theirs(LD15.lucy, { characters: [LUFFY] }, {});
    expect(g.power(luffy(g))).toBe(7000);
  });

  it('opponent’s turn with a Leader without the type: stays 4000', () => {
    const g = theirs(LD15.shc, { characters: [LUFFY] }, {});
    expect(g.power(luffy(g))).toBe(4000);
  });

  it('my own turn with a {Dressrosa} Leader: stays 4000 (the bonus is [Opponent’s Turn] only)', () => {
    const g = mine(LD15.dressrosa, { characters: [LUFFY] });
    expect(g.power(luffy(g))).toBe(4000);
  });

  it('the opponent’s Leader type does not matter: only mine', () => {
    const g = theirs(LD15.shc, { characters: [LUFFY] }, {}, LD15.dressrosa);
    expect(g.power(luffy(g))).toBe(4000);
  });

  it('boundary: 7000 power survives a 6000 attacker but not a 7000 one (the attacker wins ties)', () => {
    expect(survives(LD15.dressrosa, SCN.c4)).toBe(true);
    expect(survives(LD15.dressrosa, SCN.c5)).toBe(false);
  });

  it('without the {Dressrosa} Leader a 6000 attacker already K.O.s it (4000)', () => {
    expect(survives(LD15.shc, SCN.c4)).toBe(false);
  });

  it('two Luffys each get +3000, not more', () => {
    const g = theirs(LD15.dressrosa, { characters: [LUFFY, LUFFY] }, {});
    expect(g.power(luffy(g, 0))).toBe(7000);
    expect(g.power(luffy(g, 1))).toBe(7000);
  });

  it('given DON!! add nothing on the opponent’s turn, so a Luffy with 2 DON!! is 7000', () => {
    const g = theirs(
      LD15.dressrosa,
      { characters: [{ card: LUFFY, don: 2 }], costArea: { active: 0, rested: 0 } },
      {},
    );
    expect(g.power(luffy(g))).toBe(7000);
  });

  it('the bonus is gone again on my next turn', () => {
    const g = theirs(LD15.dressrosa, { characters: [LUFFY] }, {});
    expect(g.power(luffy(g))).toBe(7000);
    g.act({ type: 'endTurn' });
    expect(g.power(luffy(g))).toBe(4000);
  });
});
