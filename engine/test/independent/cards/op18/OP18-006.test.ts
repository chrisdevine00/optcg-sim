/**
 * OP18-006 Koza (Red Character, cost 3, 4000, {Alabasta}).
 *
 * Card text (cards/data):
 *   "If you have [Nefeltari Vivi], this Character gains [Rush] and +1000 power."
 *
 * Reading (m6b-audit Q2): a card named [Nefeltari Vivi] on your field counts, a Character (ST01-009)
 * or the Leader (OP04-001). Only your own field.
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import { at, canHit, cardIds, endBattle, kw, LC, mine, playCard, theirs, VC } from './kit-c.ts';

const KOZA = 'OP18-006';

describe('OP18-006 Koza: with [Nefeltari Vivi], Rush and +1000', () => {
  it('with a [Nefeltari Vivi] Character: 5000 power and Rush, and it can attack the turn it is played', () => {
    const g = mine(LC.luffy, { characters: [VC.vivi2], hand: [KOZA] });
    playCard(g, KOZA);
    const koza = at(g, 'p1', 'characters', KOZA);
    expect(g.power(koza)).toBe(5000);
    expect(kw(g, koza)).toContain('Rush');
    expect(canHit(g, koza, g.leader('p2'))).toBe(true);
  });

  it('with a [Nefeltari Vivi] Leader: the same bonus', () => {
    const g = mine(LC.vivi, { hand: [KOZA] });
    playCard(g, KOZA);
    const koza = at(g, 'p1', 'characters', KOZA);
    expect(g.power(koza)).toBe(5000);
    expect(kw(g, koza)).toContain('Rush');
  });

  it('without [Nefeltari Vivi]: 4000 power, no Rush, cannot attack when played', () => {
    const g = mine(LC.luffy, { hand: [KOZA] });
    playCard(g, KOZA);
    const koza = at(g, 'p1', 'characters', KOZA);
    expect(g.power(koza)).toBe(4000);
    expect(kw(g, koza)).not.toContain('Rush');
    expect(canHit(g, koza, g.leader('p2'))).toBe(false);
  });

  it('a different {Alabasta} card does not count (Cobra, Sanji)', () => {
    const g = mine(LC.luffy, { characters: [KOZA, VC.cobra5, VC.sanji1] });
    expect(g.power(at(g, 'p1', 'characters', KOZA))).toBe(4000);
  });

  it('the opponent’s [Nefeltari Vivi] does not count', () => {
    const g = mine(LC.luffy, { characters: [KOZA] }, { characters: [VC.vivi2] });
    expect(g.power(at(g, 'p1', 'characters', KOZA))).toBe(4000);
    const g2 = mine(LC.luffy, { characters: [KOZA] }, {}, LC.vivi);
    expect(g2.power(at(g2, 'p1', 'characters', KOZA))).toBe(4000);
  });

  it('the bonus follows the condition: once Vivi is K.O.’d Koza is back to 4000', () => {
    const g = theirs(
      LC.luffy,
      { characters: [KOZA, { card: VC.vivi2, rested: true }] },
      { characters: [VC.kingdew5] },
    );
    expect(g.power(at(g, 'p1', 'characters', KOZA))).toBe(5000);
    attack(g, at(g, 'p2', 'characters', VC.kingdew5), at(g, 'p1', 'characters', VC.vivi2));
    endBattle(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([KOZA]);
    expect(g.power(at(g, 'p1', 'characters', KOZA))).toBe(4000);
  });

  it('the Vivi in your hand or trash does not count', () => {
    const g = mine(LC.luffy, { characters: [KOZA], hand: [VC.vivi2], trash: [VC.vivi2] });
    expect(g.power(at(g, 'p1', 'characters', KOZA))).toBe(4000);
  });
});
