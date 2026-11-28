/**
 * OP18-106 Doberman (Yellow Character, cost 7, 7000, Counter +2000, {Vice Admiral}/{Navy}, [Double Attack]).
 *
 * Card text: "[Double Attack] (This card deals 2 damage.)"
 *
 * Rules: CR 10-1-2 (Double Attack): a hit on a Leader deals 2 damage (2 Life cards). It has no
 * effect against a Character. A blocked or countered attack deals no damage.
 * Scenery: OP02-006 Kingdew (7000, no keyword) as the control; OP02-060 Mohji for Life.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  cardIds,
  kw,
  need,
  passBlock,
  passCounter,
  takeDamage,
  useCounter,
  LDR,
  CH,
} from './kit-e.ts';
import { mineE } from './kit-e.ts';

const D = 'OP18-106';

describe('OP18-106 Doberman: [Double Attack]', () => {
  it('printed: cost 7, 7000, keyword Double Attack', () => {
    const g = mineE(LDR.luffy, { characters: [D] });
    expect(kw(g, at(g, 'p1', 'characters', D))).toContain('Double Attack');
    expect(g.card(at(g, 'p1', 'characters', D)).power).toBe(7000);
  });

  it('an unblocked, uncountered hit on the Leader takes 2 Life cards into the hand', () => {
    const g = mineE(LDR.luffy, { characters: [D] });
    attack(g, at(g, 'p1', 'characters', D), g.leader('p2'));
    passBlock(g);
    passCounter(g);
    expect(g.life('p2')).toBe(2);
    expect(cardIds(g, 'p2', 'hand')).toHaveLength(2);
  });

  it('control: an attacker without [Double Attack] takes only 1', () => {
    const g = mineE(LDR.luffy, { characters: [CH.kingdew5] });
    attack(g, at(g, 'p1', 'characters', CH.kingdew5), g.leader('p2'));
    passBlock(g);
    passCounter(g);
    expect(g.life('p2')).toBe(3);
  });

  it('a Counter that stops the attack prevents both points', () => {
    const g = mineE(LDR.luffy, { characters: [D] }, { hand: [CH.marco3, CH.hajrudin4] });
    attack(g, at(g, 'p1', 'characters', D), g.leader('p2'));
    passBlock(g);
    need(g, 'counter', 'p2');
    useCounter(g, at(g, 'p2', 'hand', CH.marco3), g.leader('p2'));
    useCounter(g, at(g, 'p2', 'hand', CH.hajrudin4), g.leader('p2'));
    act(g, { type: 'endCounter' });
    expect(g.life('p2')).toBe(4);
  });

  it('against a rested Character it K.O.s it once and no Life is lost', () => {
    const g = mineE(
      LDR.luffy,
      { characters: [D] },
      { characters: [{ card: CH.hajrudin4, rested: true }] },
    );
    attack(g, at(g, 'p1', 'characters', D), at(g, 'p2', 'characters', CH.hajrudin4));
    passBlock(g);
    passCounter(g);
    expect(cardIds(g, 'p2', 'trash')).toEqual([CH.hajrudin4]);
    expect(g.life('p2')).toBe(4);
  });

  it('when blocked there is no damage at all', () => {
    const g = mineE(LDR.luffy, { characters: [D] }, { characters: ['OP09-072'] });
    attack(g, at(g, 'p1', 'characters', D), g.leader('p2'));
    act(g, { type: 'block', blocker: at(g, 'p2', 'characters', 'OP09-072') });
    passCounter(g);
    expect(g.life('p2')).toBe(4);
    takeDamage(g);
  });
});
