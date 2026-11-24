/**
 * OP14-011 Bartolomeo (Character, cost 2, 2000, Counter +2000, {Supernovas}/{Dressrosa}/{Barto Club}).
 *
 * Card text: "[DON!! x2] This Character gains [Blocker]."
 *
 * Rules: [DON!! xX] is a plain state check on BOTH players' turns: it holds whenever X or more DON!!
 * are given to the card (RL-13, CR 8-3-2-3). DON!! in the cost area do not count. [Blocker] (CR
 * 10-1-4): an active Character may rest itself after an attack is declared to become the new target;
 * a rested Character cannot block.
 */
import { describe, expect, it } from 'vitest';
import { attack, at, blockers, kind, kw, LD14, mine, need, S14, theirs, chr } from './kit-op14a.ts';

const BARTO = 'OP14-011';

/** p2's turn: p1 has Bartolomeo with `don` DON!! given (and `active` DON!! in the cost area). */
function defend(don: number, active = 0, rested = false) {
  return theirs(
    LD14.luffy,
    { costArea: { active, rested: 0 }, characters: [{ card: BARTO, don, rested }] },
    { characters: [S14.marco] },
  );
}

describe('OP14-011 Bartolomeo: [DON!! x2] gains [Blocker]', () => {
  it('printed values: cost 2, 2000, Counter +2000, no [Blocker] with no DON!!', () => {
    const g = defend(0);
    const b = at(g, 'p1', 'characters', BARTO);
    expect(g.card(b).cost).toBe(2);
    expect(g.power(b)).toBe(2000);
    expect(g.card(b).counter).toBe(2000);
    expect(kw(g, b)).not.toContain('Blocker');
  });

  it("with exactly 2 DON!! given it has [Blocker] on the opponent's turn", () => {
    const g = defend(2);
    expect(kw(g, at(g, 'p1', 'characters', BARTO))).toContain('Blocker');
  });

  it('boundary: with 1 DON!! given it has no [Blocker] and cannot block', () => {
    const g = defend(1);
    expect(kw(g, at(g, 'p1', 'characters', BARTO))).not.toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', S14.marco), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([]);
  });

  it('with 3 DON!! given (more than x2) it still has [Blocker]', () => {
    const g = defend(3);
    expect(kw(g, at(g, 'p1', 'characters', BARTO))).toContain('Blocker');
  });

  it('DON!! in the cost area do not count: 5 active DON!!, none given, no [Blocker]', () => {
    const g = defend(0, 5);
    expect(kw(g, at(g, 'p1', 'characters', BARTO))).not.toContain('Blocker');
  });

  it('on my own turn the condition holds too (it is not limited to the opponent turn)', () => {
    const g = mine(LD14.luffy, {
      costArea: { active: 8, rested: 0 },
      characters: [{ card: BARTO, don: 2 }],
    });
    expect(kw(g, at(g, 'p1', 'characters', BARTO))).toContain('Blocker');
  });

  it('it can block an attack on my Leader: it is rested, takes the hit, and my Life is untouched', () => {
    const g = defend(2);
    attack(g, at(g, 'p2', 'characters', S14.marco), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', BARTO)]);
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', BARTO) });
    expect(g.card(at(g, 'p1', 'characters', BARTO)).rested).toBe(true);
    // Marco (5000) against Bartolomeo (2000, no DON!! power on the opponent's turn): K.O.
    while (kind(g) === 'counter') g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([]);
  });

  it('a rested Bartolomeo with 2 DON!! cannot block', () => {
    const g = defend(2, 0, true);
    attack(g, at(g, 'p2', 'characters', S14.marco), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([]);
  });

  it('it does not give [Blocker] to another Character', () => {
    const g = theirs(
      LD14.luffy,
      { characters: [{ card: BARTO, don: 2 }, S14.sai] },
      { characters: [S14.marco] },
    );
    expect(kw(g, chr(g, 'p1', S14.sai))).not.toContain('Blocker');
  });
});
