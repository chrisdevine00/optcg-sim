/**
 * OP18-008 Chaka (Red Character, cost 5, 6000, {Alabasta}).
 *
 * Card text (cards/data):
 *   "If your Leader has the {Alabasta} type, this Character gains [Rush].
 *    [On Play] You may trash 1 Character card with 5000 power or less from your hand: Draw 2 cards
 *    and this Character gains [Banish] during this turn."
 *
 * Reading: Rush is continuous while your Leader has {Alabasta} (OP04-001 here). The [On Play] cost is
 * exactly 1 Character card with printed power <= 5000 from hand (not Events); after paying, draw 2
 * and Chaka gains Banish until end of turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  canHit,
  hand,
  kw,
  LC,
  mine,
  n,
  need,
  no,
  offeredIds,
  payHand,
  playCard,
  toMyNextMain,
  trash,
  unusable,
  VC,
  yes,
} from './kit-c.ts';

const CHAKA = 'OP18-008';
const EVENT = 'OP18-018';

function begin(handCards: string[], leader: string = LC.vivi) {
  const g = mine(leader, { hand: [CHAKA, ...handCards] });
  playCard(g, CHAKA);
  return g;
}

describe('OP18-008 Chaka: Rush with an {Alabasta} Leader', () => {
  it('Alabasta Leader: Rush, and it can attack the turn it is played', () => {
    const g = begin([], LC.vivi);
    unusable(g, 'p1');
    const chaka = at(g, 'p1', 'characters', CHAKA);
    expect(kw(g, chaka)).toContain('Rush');
    expect(canHit(g, chaka, g.leader('p2'))).toBe(true);
  });

  it('non-Alabasta Leader: no Rush', () => {
    const g = begin([], LC.luffy);
    unusable(g, 'p1');
    const chaka = at(g, 'p1', 'characters', CHAKA);
    expect(kw(g, chaka)).not.toContain('Rush');
    expect(canHit(g, chaka, g.leader('p2'))).toBe(false);
  });
});

describe('OP18-008 Chaka: [On Play] trash a Character with 5000 power or less: draw 2 and Banish', () => {
  it('pays with a 5000 power Character (boundary), draws 2 and gains Banish this turn', () => {
    const g = begin([VC.marco3]);
    yes(g, 'p1');
    payHand(g, [VC.marco3]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([VC.marco3]);
    expect(n(g, 'p1', 'hand')).toBe(2);
    expect(kw(g, at(g, 'p1', 'characters', CHAKA))).toContain('Banish');
  });

  it('a Character with more than 5000 power or a non-Character cannot pay', () => {
    const g = begin([VC.hajrudin4, EVENT, VC.sanji1]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VC.sanji1]);
    payHand(g, [VC.sanji1]);
    expect(hand(g)).toContain(VC.hajrudin4);
  });

  it('cannot be used with only ineligible cards in hand: no draw, no Banish', () => {
    const g = begin([VC.hajrudin4, EVENT]);
    unusable(g, 'p1');
    expect(n(g, 'p1', 'hand')).toBe(2);
    expect(kw(g, at(g, 'p1', 'characters', CHAKA))).not.toContain('Banish');
  });

  it('declining: no draw, nothing trashed, no Banish', () => {
    const g = begin([VC.marco3]);
    no(g, 'p1');
    expect(hand(g)).toEqual([VC.marco3]);
    expect(trash(g)).toEqual([]);
    expect(kw(g, at(g, 'p1', 'characters', CHAKA))).not.toContain('Banish');
  });

  it('Banish lasts only during this turn', () => {
    const g = begin([VC.marco3]);
    yes(g, 'p1');
    payHand(g, [VC.marco3]);
    toMyNextMain(g);
    expect(kw(g, at(g, 'p1', 'characters', CHAKA))).not.toContain('Banish');
  });

  it('without an {Alabasta} Leader the effect still draws 2 and grants Banish', () => {
    const g = begin([VC.marco3], LC.luffy);
    yes(g, 'p1');
    payHand(g, [VC.marco3]);
    expect(n(g, 'p1', 'hand')).toBe(2);
    expect(kw(g, at(g, 'p1', 'characters', CHAKA))).toContain('Banish');
  });
});
