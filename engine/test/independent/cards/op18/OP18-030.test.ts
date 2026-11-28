/**
 * OP18-030 Nami (Green Character, cost 4, 6000, Counter 2000, {Water Seven}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "[Opponent's Turn] If this Character is rested, give this Character -2000 power."
 *
 * Reading: only during the opponent's turn and only while Nami is rested: -2000 power.
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import { at, cardIds, endBattle, LC, mine, theirs, VC } from './kit-c.ts';

const NAMI = 'OP18-030';

describe('OP18-030 Nami: [Opponent’s Turn] if rested, -2000 power', () => {
  it('rested on the opponent’s turn: 4000', () => {
    const g = theirs(LC.luffy, { characters: [{ card: NAMI, rested: true }] });
    expect(g.power(at(g, 'p1', 'characters', NAMI))).toBe(4000);
  });

  it('active on the opponent’s turn: 6000', () => {
    const g = theirs(LC.luffy, { characters: [NAMI] });
    expect(g.power(at(g, 'p1', 'characters', NAMI))).toBe(6000);
  });

  it('rested on your own turn: 6000 (not the opponent’s turn)', () => {
    const g = mine(LC.luffy, { characters: [{ card: NAMI, rested: true }] });
    expect(g.power(at(g, 'p1', 'characters', NAMI))).toBe(6000);
  });

  it('active on your own turn: 6000', () => {
    const g = mine(LC.luffy, { characters: [NAMI] });
    expect(g.power(at(g, 'p1', 'characters', NAMI))).toBe(6000);
  });

  it('it matters in battle: a rested Nami (4000) is K.O.’d by a 5000 attacker', () => {
    const g = theirs(
      LC.luffy,
      { characters: [{ card: NAMI, rested: true }] },
      { characters: [VC.marco3] },
    );
    attack(g, at(g, 'p2', 'characters', VC.marco3), at(g, 'p1', 'characters', NAMI));
    endBattle(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('control: a rested 6000 power Character without the penalty survives the same 5000 attacker', () => {
    const g = theirs(
      LC.luffy,
      { characters: [{ card: VC.hajrudin4, rested: true }] },
      { characters: [VC.marco3] },
    );
    attack(g, at(g, 'p2', 'characters', VC.marco3), at(g, 'p1', 'characters', VC.hajrudin4));
    endBattle(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VC.hajrudin4]);
  });

  it('DON!! given add power only on your turn: rested Nami with 2 DON!! on the opponent’s turn is 4000', () => {
    const g = theirs(LC.luffy, { characters: [{ card: NAMI, rested: true, don: 2 }] });
    expect(g.power(at(g, 'p1', 'characters', NAMI))).toBe(4000);
  });

  it('boundary: a 4000 attacker ties the 4000 power rested Nami and K.O.s it', () => {
    const g = theirs(
      LC.luffy,
      { characters: [{ card: NAMI, rested: true }] },
      { characters: [VC.sai2] },
    );
    // A 4000 attacker ties the 4000 power Nami: attacker power >= defender power K.O.s.
    attack(g, at(g, 'p2', 'characters', VC.sai2), at(g, 'p1', 'characters', NAMI));
    endBattle(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });
});
