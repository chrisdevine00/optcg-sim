/**
 * OP12-106 Trafalgar Law (Character, Yellow, cost 6, 7000, Counter +1000, {Heart Pirates}/{Supernovas}/{Dressrosa}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the new
 * target of the attack.)" No other effect.
 *
 * Rules: CR 10-2-6 ([Blocker]): only an active Character may block, blocking rests it, a Character
 * attacked wins or loses the battle on power (the attacker is K.O.'d never; the defender is K.O.'d when
 * the attacker's power is equal or higher), CR 7-1-3 (Counter).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  blockers,
  chars,
  decision,
  hand,
  LDR,
  mine,
  need,
  passCounter,
  playRaw,
  SCN,
  theirs,
  trash,
} from './kit-op12c.ts';

const ID = 'OP12-106';

function defend(oppChar: string, mineChars: (string | { card: string; rested: boolean })[] = [ID]) {
  const g = theirs(LDR.neutral, { characters: mineChars as never }, { characters: [oppChar] });
  attack(g, at(g, 'p2', 'characters', oppChar), g.leader('p1'));
  return g;
}

describe('OP12-106 Trafalgar Law: a vanilla [Blocker] with 7000 power', () => {
  it('has [Blocker] and it is the only legal blocker', () => {
    const g = defend(SCN.c3, [ID, SCN.c4]);
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('blocking rests Law and my Leader loses no Life', () => {
    const g = defend(SCN.c3);
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    passCounter(g);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: an attacker with 7000 power K.O.s Law (7000 vs 7000)', () => {
    const g = defend(SCN.c5);
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    passCounter(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('a 6000-power attacker does not K.O. Law', () => {
    const g = defend(SCN.c4);
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    passCounter(g);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([]);
  });

  it('an 8000-power attacker K.O.s Law', () => {
    const g = defend(SCN.c6);
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    passCounter(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('a rested Law cannot block', () => {
    const g = defend(SCN.c3, [{ card: ID, rested: true }]);
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([]);
  });

  it('as a Counter from hand it adds +1000 to my Leader', () => {
    const g = theirs(
      LDR.neutral,
      { hand: [ID], costArea: { active: 0, rested: 0 } },
      { characters: [SCN.c3] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    g.act({ type: 'block', blocker: null });
    act(g, { type: 'counter', card: g.find('p1', 'hand', ID), target: g.leader('p1') });
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(hand(g)).toEqual([]);
  });

  it('played from hand it has no [On Play] (nothing asked) and no [Rush]', () => {
    const g = mine(LDR.neutral, { hand: [ID] }, { characters: [SCN.c3] });
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).not.toContain('Rush');
    expect(
      g.legal().some((a) => a.type === 'attack' && a.attacker === at(g, 'p1', 'characters', ID)),
    ).toBe(false);
  });

  it('it is not a blocker for the opponent: the attacker side has no block decision of its own', () => {
    const g = mine(LDR.neutral, { characters: [ID] }, {});
    expect(decision(g)?.kind).toBe('main');
    act(g, { type: 'endTurn' });
    expect(g.decider).toBe('p2');
  });
});
