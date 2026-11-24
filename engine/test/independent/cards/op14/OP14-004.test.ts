/**
 * OP14-004 Cavendish (Character, cost 2, 2000, Counter +1000, {Beautiful Pirates}/{Supernovas}/{Dressrosa}).
 *
 * Card text: "If this Character has 5000 power or more, this Character gains [Rush]."
 *
 * Rules: a permanent effect applies while its condition holds and stops the moment it does not
 * (CR 8-1-3-3, rulings RL-12). Each DON!! given to a Character is +1000 power during its owner's
 * turn only (RL-13). [Rush] lets a Character attack the turn it is played (CR 10-1-1); a Character
 * played this turn without it cannot attack (CR 3-7-4).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attackers,
  canAttackAny,
  chr,
  kw,
  LD14,
  mine,
  need,
  S14,
  swing,
  theirs,
} from './kit-op14a.ts';

const CAV = 'OP14-004';

/** p1's Main Phase: Cavendish (played this turn) with `don` DON!! given, 7-`don`+3 spare in the cost area. */
function board(don: number, extra: (string | { card: string; playedThisTurn?: boolean })[] = []) {
  return mine(LD14.luffy, {
    costArea: { active: 10 - don, rested: 0 },
    characters: [{ card: CAV, don, playedThisTurn: true }, ...extra],
  });
}

describe('OP14-004 Cavendish: [Rush] while it has 5000 power or more', () => {
  it('printed values: cost 2, 2000, Counter +1000; no [Rush] with no DON!!', () => {
    const g = board(0);
    const c = at(g, 'p1', 'characters', CAV);
    expect(g.card(c).cost).toBe(2);
    expect(g.power(c)).toBe(2000);
    expect(g.card(c).counter).toBe(1000);
    expect(kw(g, c)).not.toContain('Rush');
  });

  it('at exactly 5000 power (3 DON!!) it has [Rush] and may attack the turn it was played', () => {
    const g = board(3);
    const c = at(g, 'p1', 'characters', CAV);
    expect(g.power(c)).toBe(5000);
    expect(kw(g, c)).toContain('Rush');
    expect(canAttackAny(g, c)).toBe(true);
    swing(g, CAV);
    need(g, 'block', 'p2');
  });

  it('boundary: at 4000 power (2 DON!!) there is no [Rush] and it cannot attack this turn', () => {
    const g = board(2);
    const c = at(g, 'p1', 'characters', CAV);
    expect(g.power(c)).toBe(4000);
    expect(kw(g, c)).not.toContain('Rush');
    expect(canAttackAny(g, c)).toBe(false);
    expect(attackers(g)).not.toContain(c);
  });

  it('above 5000 power (4 DON!! = 6000) it still has [Rush]', () => {
    const g = board(4);
    const c = at(g, 'p1', 'characters', CAV);
    expect(g.power(c)).toBe(6000);
    expect(kw(g, c)).toContain('Rush');
  });

  it('the condition is live: giving it a third DON!! mid-turn grants [Rush] at once', () => {
    const g = mine(LD14.luffy, {
      costArea: { active: 6, rested: 0 },
      characters: [{ card: CAV, don: 2, playedThisTurn: true }],
    });
    const c = at(g, 'p1', 'characters', CAV);
    expect(kw(g, c)).not.toContain('Rush');
    expect(canAttackAny(g, c)).toBe(false);
    act(g, { type: 'giveDon', target: c });
    expect(g.power(c)).toBe(5000);
    expect(kw(g, c)).toContain('Rush');
    expect(canAttackAny(g, c)).toBe(true);
  });

  it('[Rush] does not spread: another Character played this turn still cannot attack', () => {
    const g = board(3, [{ card: S14.marco, playedThisTurn: true }]);
    expect(canAttackAny(g, at(g, 'p1', 'characters', CAV))).toBe(true);
    expect(canAttackAny(g, chr(g, 'p1', S14.marco))).toBe(false);
    expect(kw(g, chr(g, 'p1', S14.marco))).not.toContain('Rush');
  });

  it("on the opponent's turn the DON!! give no power: 2000, so no [Rush]", () => {
    const g = theirs(LD14.luffy, {
      costArea: { active: 0, rested: 0 },
      characters: [{ card: CAV, don: 3 }],
    });
    const c = at(g, 'p1', 'characters', CAV);
    expect(g.power(c)).toBe(2000);
    expect(kw(g, c)).not.toContain('Rush');
  });

  it('a Cavendish not played this turn attacks normally at any power', () => {
    const g = mine(LD14.luffy, { characters: [CAV] });
    expect(canAttackAny(g, at(g, 'p1', 'characters', CAV))).toBe(true);
  });

  it('a rested Cavendish with [Rush] still cannot attack (Rush ignores summoning sickness only)', () => {
    const g = mine(LD14.luffy, {
      costArea: { active: 7, rested: 0 },
      characters: [{ card: CAV, don: 3, playedThisTurn: true, rested: true }],
    });
    const c = at(g, 'p1', 'characters', CAV);
    expect(kw(g, c)).toContain('Rush');
    expect(canAttackAny(g, c)).toBe(false);
  });
});
