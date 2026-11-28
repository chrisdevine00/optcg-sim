/**
 * OP18-013 Pell (Red Character, cost 5, 6000, {Alabasta}).
 *
 * Card text (cards/data):
 *   "If your Leader has the {Alabasta} type, this Character gains [Rush].
 *    [On Play] You may trash 1 Character card with 5000 power or less from your hand: Draw 2 cards
 *    and trash up to 1 of your opponent's Characters with 3000 base power or less."
 *
 * Reading: Rush while your Leader has {Alabasta}. The [On Play] cost is exactly 1 Character card
 * (printed power <= 5000) from hand; then draw 2, then trash up to 1 opposing Character whose BASE
 * power is 3000 or less (it is trashed, not K.O.'d).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  canHit,
  cardIds,
  hand,
  kw,
  LC,
  mine,
  n,
  need,
  no,
  none,
  offeredIds,
  payHand,
  pickCards,
  playCard,
  trash,
  unusable,
  VC,
  yes,
} from './kit-c.ts';

const PELL = 'OP18-013';

function begin(handCards: string[], oppChars: string[], leader: string = LC.vivi) {
  const g = mine(leader, { hand: [PELL, ...handCards] }, { characters: oppChars });
  playCard(g, PELL);
  return g;
}

describe('OP18-013 Pell: Rush with an {Alabasta} Leader', () => {
  it('Alabasta Leader: Rush and it can attack when played', () => {
    const g = begin([], [], LC.vivi);
    unusable(g, 'p1');
    const pell = at(g, 'p1', 'characters', PELL);
    expect(kw(g, pell)).toContain('Rush');
    expect(canHit(g, pell, g.leader('p2'))).toBe(true);
  });

  it('non-Alabasta Leader: no Rush', () => {
    const g = begin([], [], LC.luffy);
    unusable(g, 'p1');
    expect(kw(g, at(g, 'p1', 'characters', PELL))).not.toContain('Rush');
  });
});

describe('OP18-013 Pell: [On Play] trash a Character (5000 or less): draw 2 and trash an opposing 3000 base power or less', () => {
  it('pays, draws 2 and trashes a 3000 power opposing Character (boundary)', () => {
    const g = begin([VC.marco3], [VC.mohji1, VC.sai2]);
    yes(g, 'p1');
    payHand(g, [VC.marco3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VC.mohji1]);
    pickCards(g, [VC.mohji1]);
    expect(atMain(g)).toBe(true);
    expect(n(g, 'p1', 'hand')).toBe(2);
    expect(trash(g)).toEqual([VC.marco3]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VC.sai2]);
    expect(trash(g, 'p2')).toEqual([VC.mohji1]);
  });

  it('a 4000 power Character is not a legal target (base power 3000 or less)', () => {
    const g = begin([VC.marco3], [VC.sai2]);
    yes(g, 'p1');
    payHand(g, [VC.marco3]);
    // Nothing to trash: the draw still happens and no target question is left open.
    expect(atMain(g)).toBe(true);
    expect(n(g, 'p1', 'hand')).toBe(2);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VC.sai2]);
  });

  it('"up to 1": the trash may be skipped, the draw still happens', () => {
    const g = begin([VC.marco3], [VC.mohji1]);
    yes(g, 'p1');
    payHand(g, [VC.marco3]);
    none(g);
    expect(n(g, 'p1', 'hand')).toBe(2);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VC.mohji1]);
  });

  it('declining the cost: no draw and no trash of the opposing Character', () => {
    const g = begin([VC.marco3], [VC.mohji1]);
    no(g, 'p1');
    expect(hand(g)).toEqual([VC.marco3]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VC.mohji1]);
  });

  it('cost needs a Character with 5000 power or less: a 6000 Character cannot pay', () => {
    const g = begin([VC.hajrudin4], [VC.mohji1]);
    unusable(g, 'p1');
    expect(hand(g)).toEqual([VC.hajrudin4]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VC.mohji1]);
  });

  it('only one opposing Character is trashed when two qualify', () => {
    const g = begin([VC.marco3], [VC.mohji1, VC.mohji1]);
    yes(g, 'p1');
    payHand(g, [VC.marco3]);
    pickCards(g, [VC.mohji1]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VC.mohji1]);
  });
});
