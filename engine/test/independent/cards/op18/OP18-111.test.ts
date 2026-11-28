/**
 * OP18-111 Momonga (Yellow Character, cost 7, 7000, Counter +2000, {Vice Admiral}/{Navy}, [Rush]).
 *
 * Card text: "[Rush] (This card can attack on the turn in which it is played.)"
 *
 * Rules: CR 10-1-1 / 3-7-4: a Character cannot attack on the turn it is played unless it has [Rush].
 * Scenery: OP02-006 Kingdew (Red, cost 5, no keyword) as the control; Mohji for Life.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  canHit,
  canAttackAnything,
  endTurn,
  kw,
  need,
  passBlock,
  passCounter,
  play,
  toMyNextMain,
  LDR,
  CH,
} from './kit-e.ts';
import { mineE } from './kit-e.ts';

const M = 'OP18-111';

describe('OP18-111 Momonga: [Rush]', () => {
  it('printed: cost 7, 7000, keyword Rush', () => {
    const g = mineE(LDR.luffy, { characters: [M] });
    expect(kw(g, at(g, 'p1', 'characters', M))).toContain('Rush');
    expect(g.card(at(g, 'p1', 'characters', M)).cost).toBe(7);
  });

  it('played from hand (7 DON!!) it can attack the Leader the same turn', () => {
    const g = mineE(LDR.luffy, { hand: [M], costArea: { active: 7, rested: 0 } });
    play(g, at(g, 'p1', 'hand', M));
    const m = at(g, 'p1', 'characters', M);
    expect(canHit(g, m, g.leader('p2'))).toBe(true);
    attack(g, m, g.leader('p2'));
    passBlock(g);
    passCounter(g);
    expect(g.life('p2')).toBe(3);
  });

  it('control: a Character without [Rush] played this turn has no attack', () => {
    const g = mineE(LDR.luffy, { hand: [CH.kingdew5], costArea: { active: 5, rested: 0 } });
    play(g, at(g, 'p1', 'hand', CH.kingdew5));
    expect(canAttackAnything(g, at(g, 'p1', 'characters', CH.kingdew5))).toBe(false);
  });

  it('it can also attack a rested opposing Character the turn it is played', () => {
    const g = mineE(
      LDR.luffy,
      { characters: [{ card: M, playedThisTurn: true }] },
      { characters: [{ card: CH.hajrudin4, rested: true }] },
    );
    const m = at(g, 'p1', 'characters', M);
    expect(canHit(g, m, at(g, 'p2', 'characters', CH.hajrudin4))).toBe(true);
  });

  it('after attacking it is rested and cannot attack again; it is active again next turn', () => {
    const g = mineE(LDR.luffy, { characters: [{ card: M, playedThisTurn: true }] });
    const m = at(g, 'p1', 'characters', M);
    attack(g, m, g.leader('p2'));
    passBlock(g);
    passCounter(g);
    expect(canAttackAnything(g, m)).toBe(false);
    toMyNextMain(g);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', M))).toBe(true);
    void act;
    void need;
    void endTurn;
  });
});
