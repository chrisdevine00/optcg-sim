/**
 * OP09-017 Wire (Character, Red, cost 4, 4000, Counter +2000, {Kid Pirates}).
 *
 * Card text: "[DON!! x1] If your Leader has 7000 power or more and the "Kid Pirates" type, this
 * Character gains [Rush]."
 *
 * Scenery Leader: ST02-001 Eustass"Captain"Kid (5000, {Supernovas}/{Kid Pirates}); each DON!!
 * given to it is +1000 on my turn only (RL-13), so 2 DON!! make it 7000. ST01-001 Luffy (5000) is a
 * Leader without the type. Rules: [DON!! xN] is a state check (needs N DON!! given to this card,
 * RL-13); the power is the Leader's current power; [Rush] lets a Character attack on the turn it
 * is played (CR 10-1-1) but only the Leader or rested Characters can be attacked.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { at, kind, L9, mine, S9, theirs } from './kit-op09a.ts';

const WIRE = 'OP09-017';

/** My turn: Wire (played this turn) with `wireDon` DON!!, Leader `leader` with `leaderDon` DON!!. */
function board(leader: string, leaderDon: number, wireDon: number): TestGame {
  return mine(
    { card: leader, don: leaderDon },
    {
      characters: [{ card: WIRE, don: wireDon, playedThisTurn: true }],
      costArea: { active: 10 - leaderDon - wireDon, rested: 0 },
    },
    { characters: [S9.c3] },
  );
}

function canAttackLeader(g: TestGame): boolean {
  const w = at(g, 'p1', 'characters', WIRE);
  return g
    .legal()
    .some((a) => a.type === 'attack' && a.attacker === w && a.target === g.leader('p2'));
}

describe('OP09-017 Wire: [DON!! x1] with a 7000+ {Kid Pirates} Leader, this Character gains [Rush]', () => {
  it('printed values: cost 4, 4000, Counter +2000; no [Rush] of its own', () => {
    const g = board(L9.kid, 0, 0);
    const w = at(g, 'p1', 'characters', WIRE);
    expect(g.card(w).cost).toBe(4);
    expect(g.power(w)).toBe(4000);
    expect(g.card(w).counter).toBe(2000);
    expect(g.card(w).keywords).not.toContain('Rush');
  });

  it('all conditions met (1 DON!! on Wire, Leader {Kid Pirates} at 7000): it has [Rush] and can attack the turn it was played', () => {
    const g = board(L9.kid, 2, 1);
    const w = at(g, 'p1', 'characters', WIRE);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.card(w).keywords).toContain('Rush');
    expect(canAttackLeader(g)).toBe(true);
    act(g, { type: 'attack', attacker: w, target: g.leader('p2') });
    expect(kind(g)).toBe('block');
  });

  it('boundary: Leader at 6000 (1 DON!!) is not enough: no [Rush], no attack this turn', () => {
    const g = board(L9.kid, 1, 1);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.card(at(g, 'p1', 'characters', WIRE)).keywords).not.toContain('Rush');
    expect(canAttackLeader(g)).toBe(false);
  });

  it('a Leader above 7000 (3 DON!! = 8000) still counts', () => {
    const g = board(L9.kid, 3, 1);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(g.card(at(g, 'p1', 'characters', WIRE)).keywords).toContain('Rush');
  });

  it('[DON!! x1]: with no DON!! on Wire there is no [Rush] even with a 7000 Leader', () => {
    const g = board(L9.kid, 2, 0);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.card(at(g, 'p1', 'characters', WIRE)).keywords).not.toContain('Rush');
    expect(canAttackLeader(g)).toBe(false);
  });

  it('the Leader needs the "Kid Pirates" type: a 7000 Leader without it gives no [Rush]', () => {
    const g = board(L9.luffy, 2, 1);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.card(at(g, 'p1', 'characters', WIRE)).keywords).not.toContain('Rush');
    expect(canAttackLeader(g)).toBe(false);
  });

  it('more DON!! on Wire is fine (2 DON!! on Wire, 2 on the Leader)', () => {
    const g = board(L9.kid, 2, 2);
    expect(g.card(at(g, 'p1', 'characters', WIRE)).keywords).toContain('Rush');
    expect(canAttackLeader(g)).toBe(true);
  });

  it('on the opponent’s turn the given DON!! add no power to the Leader (5000), so [Rush] is not there', () => {
    const g = theirs(L9.luffy, { characters: [{ card: WIRE, don: 1 }] }, {});
    expect(g.card(at(g, 'p1', 'characters', WIRE)).keywords).not.toContain('Rush');
    const h = theirs(
      L9.kid,
      { characters: [{ card: WIRE, don: 1 }], leader: { card: L9.kid, don: 2 } },
      {},
    );
    expect(h.power(h.leader('p1'))).toBe(5000);
    expect(h.card(at(h, 'p1', 'characters', WIRE)).keywords).not.toContain('Rush');
  });

  it('must not happen: [Rush] does not let it attack an ACTIVE opposing Character', () => {
    const g = board(L9.kid, 2, 1);
    const w = at(g, 'p1', 'characters', WIRE);
    const t = at(g, 'p2', 'characters', S9.c3);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === w && a.target === t)).toBe(
      false,
    );
  });

  it('must not happen: a Wire that was not played this turn but has no DON!! gains nothing from the Leader alone', () => {
    const g = mine(
      { card: L9.kid, don: 2 },
      { characters: [WIRE], costArea: { active: 8, rested: 0 } },
      {},
    );
    expect(g.card(at(g, 'p1', 'characters', WIRE)).keywords).not.toContain('Rush');
  });
});
