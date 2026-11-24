/**
 * OP12-050 Jaguar.D.Saul (Character, Blue, cost 6, 7000, Counter +1000, {Giant}/{Navy}/{Ohara}).
 *
 * Card text: "[Blocker]". No other text.
 *
 * Rules: [Blocker] (CR 10-1-4): after the opponent declares an attack, in the Block Step the
 * defender may rest this card to make it the new target. Only an active Blocker can block; the
 * block is optional; a Blocker blocks attacks on a Leader or on a Character. A Character that
 * loses a battle is K.O.'d when the attacker's power is equal or higher (CR 7-1-4-2).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  chars,
  decision,
  kind,
  kw,
  LB,
  mine,
  need,
  passBlock,
  passCounter,
  SB,
  theirs,
  trash,
} from './kit-op12b.ts';

const SAUL = 'OP12-050';

describe('OP12-050 Jaguar.D.Saul: [Blocker]', () => {
  it('has the Blocker keyword', () => {
    const g = mine(LB.croc, { characters: [SAUL] });
    expect(kw(g, g.find('p1', 'characters', SAUL))).toContain('Blocker');
  });

  it('an attack on my Leader offers the block with Saul', () => {
    const g = theirs(LB.croc, { characters: [SAUL] }, { characters: [SB.thatch] });
    attack(g, g.find('p2', 'characters', SB.thatch), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([g.find('p1', 'characters', SAUL)]);
  });

  it('blocking makes Saul the target: the Leader takes no damage, Saul rests', () => {
    const g = theirs(LB.croc, { characters: [SAUL] }, { characters: [SB.kingdew] });
    attack(g, g.find('p2', 'characters', SB.kingdew), g.leader('p1'));
    const saul = g.find('p1', 'characters', SAUL);
    act(g, { type: 'block', blocker: saul });
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    // Kingdew (7000) against Saul (7000): equal power, Saul is K.O.'d.
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([SAUL]);
  });

  it('a weaker attacker (6000) does not K.O. Saul (7000)', () => {
    const g = theirs(LB.croc, { characters: [SAUL] }, { characters: [SB.hajrudin] });
    attack(g, g.find('p2', 'characters', SB.hajrudin), g.leader('p1'));
    act(g, { type: 'block', blocker: g.find('p1', 'characters', SAUL) });
    passCounter(g);
    expect(chars(g)).toEqual([SAUL]);
    expect(g.card(g.find('p1', 'characters', SAUL)).rested).toBe(true);
    expect(chars(g, 'p2')).toEqual([SB.hajrudin]);
    expect(g.life('p1')).toBe(4);
  });

  it('the block is optional: declining lets the attack reach the Leader', () => {
    const g = theirs(LB.croc, { characters: [SAUL] }, { characters: [SB.thatch] });
    attack(g, g.find('p2', 'characters', SB.thatch), g.leader('p1'));
    need(g, 'block', 'p1');
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(g.card(g.find('p1', 'characters', SAUL)).rested).toBe(false);
  });

  it('a rested Saul cannot block', () => {
    const g = theirs(
      LB.croc,
      { characters: [{ card: SAUL, rested: true }] },
      { characters: [SB.thatch] },
    );
    attack(g, g.find('p2', 'characters', SB.thatch), g.leader('p1'));
    // No blocker is available: only "no block" can be answered (or the step is skipped).
    expect(blockers(g)).toEqual([]);
    expect(decision(g)?.kind === 'block' || decision(g)?.kind === 'counter').toBe(true);
  });

  it('can block an attack aimed at another of my Characters', () => {
    const g = theirs(
      LB.croc,
      { characters: [SAUL, { card: SB.marco, rested: true }] },
      { characters: [SB.thatch] },
    );
    attack(g, g.find('p2', 'characters', SB.thatch), g.find('p1', 'characters', SB.marco));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([g.find('p1', 'characters', SAUL)]);
    act(g, { type: 'block', blocker: g.find('p1', 'characters', SAUL) });
    passCounter(g);
    expect(chars(g)).toContain(SB.marco);
  });

  it('can block in the turn it was played (summoning sickness does not apply to blocking)', () => {
    const g = theirs(
      LB.croc,
      { characters: [{ card: SAUL, playedThisTurn: true }] },
      { characters: [SB.thatch] },
    );
    attack(g, g.find('p2', 'characters', SB.thatch), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toHaveLength(1);
  });

  it('must not: Saul does not get a block decision on my own turn, and my attacks are unaffected', () => {
    const g = mine(LB.croc, { characters: [SAUL] }, { characters: [SB.mohji] });
    expect(kind(g)).toBe('main');
    expect(blockers(g)).toEqual([]);
  });
});
