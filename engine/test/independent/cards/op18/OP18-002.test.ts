/**
 * OP18-002 Igaram (Red Character, cost 1, 2000, {Alabasta}).
 *
 * Card text (cards/data):
 *   "[On Play] You may trash 1 {Alabasta} type card from your hand: Draw 2 cards."
 *
 * Reading: optional cost (trash exactly 1 card with the {Alabasta} type from hand, any category),
 * then draw 2. Not payable with no such card in hand.
 *
 * Scenery: OP04-007 Sanji (Alabasta, Character), OP18-018 Let's Go, Karoo!! (Alabasta Event),
 * OP01-023 Marco (no type), OP13-011 Cobra (Alabasta).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  cardIds,
  hand,
  LC,
  mine,
  n,
  no,
  offeredIds,
  need,
  payHand,
  playCard,
  trash,
  unusable,
  VC,
  yes,
} from './kit-c.ts';

const IGARAM = 'OP18-002';
const EVENT = 'OP18-018';

function begin(handCards: string[]) {
  const g = mine(LC.luffy, { hand: [IGARAM, ...handCards] });
  playCard(g, IGARAM);
  return g;
}

describe('OP18-002 Igaram: [On Play] you may trash 1 {Alabasta} card: draw 2', () => {
  it('pays with an {Alabasta} card and draws 2', () => {
    const g = begin([VC.sanji1, VC.marco3]);
    yes(g, 'p1');
    payHand(g, [VC.sanji1]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([VC.sanji1]);
    expect(n(g, 'p1', 'hand')).toBe(3);
    expect(hand(g)).toContain(VC.marco3);
    expect(n(g, 'p1', 'deck')).toBe(13);
    expect(cardIds(g, 'p1', 'characters')).toEqual([IGARAM]);
  });

  it('only {Alabasta} cards can pay: a card without the type is not offered', () => {
    const g = begin([VC.marco3, VC.cobra5, VC.sanji1]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VC.cobra5, VC.sanji1].sort());
    payHand(g, [VC.cobra5]);
    expect(trash(g)).toEqual([VC.cobra5]);
  });

  it('any category counts: an {Alabasta} Event card can be trashed as the cost', () => {
    const g = begin([EVENT, VC.marco3]);
    yes(g, 'p1');
    expect(offeredIds(g)).toEqual([EVENT]);
    payHand(g, [EVENT]);
    expect(trash(g)).toEqual([EVENT]);
    expect(n(g, 'p1', 'hand')).toBe(3);
  });

  it('declining the cost draws nothing and trashes nothing', () => {
    const g = begin([VC.sanji1]);
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([VC.sanji1]);
    expect(trash(g)).toEqual([]);
    expect(n(g, 'p1', 'deck')).toBe(15);
  });

  it('cannot be used with no {Alabasta} card in hand', () => {
    const g = begin([VC.marco3, VC.kingdew5]);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([VC.kingdew5, VC.marco3].sort());
    expect(n(g, 'p1', 'deck')).toBe(15);
  });

  it('an empty hand cannot pay either', () => {
    const g = begin([]);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(n(g, 'p1', 'hand')).toBe(0);
  });

  it('only one card is trashed even when several {Alabasta} cards are in hand', () => {
    const g = begin([VC.sanji1, VC.cobra5, EVENT]);
    yes(g, 'p1');
    payHand(g, [VC.sanji1]);
    expect(trash(g)).toEqual([VC.sanji1]);
    expect(n(g, 'p1', 'hand')).toBe(4);
  });
});
