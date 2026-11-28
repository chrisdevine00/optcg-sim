/**
 * OP18-007 Smoker (Red Character, cost 4, 5000, {Alabasta}/{Navy}).
 *
 * Card text (cards/data):
 *   "If your Leader has the {Navy} type, this Character gains [Banish] and +1000 power.
 *    (When this card deals damage, the target card is trashed without activating its Trigger.)"
 *
 * Reading: the condition is on your Leader's type only (Smoker's own {Navy} type does not matter).
 * Scenery: ST06-001 Sakazuki (Navy Leader), ST01-001 Luffy (no Navy), OP15-016 Fullbody (Navy Character).
 */
import { describe, expect, it } from 'vitest';
import { at, cardIds, endBattle, hand, kw, LC, mine, trash, VC } from './kit-c.ts';
import { attack } from '../../helpers.ts';

const SMOKER = 'OP18-007';

describe('OP18-007 Smoker: with a {Navy} Leader, Banish and +1000', () => {
  it('Navy Leader: 6000 power and Banish', () => {
    const g = mine(LC.navy, { characters: [SMOKER] });
    const s = at(g, 'p1', 'characters', SMOKER);
    expect(g.power(s)).toBe(6000);
    expect(kw(g, s)).toContain('Banish');
  });

  it('non-Navy Leader: 5000 power and no Banish', () => {
    const g = mine(LC.luffy, { characters: [SMOKER] });
    const s = at(g, 'p1', 'characters', SMOKER);
    expect(g.power(s)).toBe(5000);
    expect(kw(g, s)).not.toContain('Banish');
  });

  it('a {Navy} Character (not the Leader) does not satisfy the condition', () => {
    const g = mine(LC.luffy, { characters: [SMOKER, VC.fullbody] });
    expect(g.power(at(g, 'p1', 'characters', SMOKER))).toBe(5000);
  });

  it('the opponent’s {Navy} Leader does not satisfy the condition', () => {
    const g = mine(LC.luffy, { characters: [SMOKER] }, {}, LC.navy);
    expect(g.power(at(g, 'p1', 'characters', SMOKER))).toBe(5000);
  });

  it('Banish in play: a hit takes the Life card to the trash, not to the opponent’s hand', () => {
    const g = mine(LC.navy, { characters: [SMOKER] });
    const lifeBefore = g.life('p2');
    attack(g, at(g, 'p1', 'characters', SMOKER), g.leader('p2'));
    endBattle(g);
    expect(g.life('p2')).toBe(lifeBefore - 1);
    expect(cardIds(g, 'p2', 'trash')).toHaveLength(1);
    expect(hand(g, 'p2')).toHaveLength(0);
  });

  it('without the Navy Leader a hit adds the Life card to the opponent’s hand', () => {
    const g = mine(LC.luffy, { characters: [SMOKER] });
    attack(g, at(g, 'p1', 'characters', SMOKER), g.leader('p2'));
    endBattle(g);
    expect(hand(g, 'p2')).toHaveLength(1);
    expect(trash(g, 'p2')).toHaveLength(0);
  });
});
