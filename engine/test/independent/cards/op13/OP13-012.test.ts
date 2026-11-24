/**
 * OP13-012 Nefeltari Vivi (Character, Red, cost 1, 2000, Counter +1000, {Alabasta}, Wisdom).
 *
 * Card text: "[On Play] Look at 4 cards from the top of your deck; reveal up to 1 "Alabasta" or
 * "Straw Hat Crew" type card with a cost of 2 or more and add it to your hand. Then, place the
 * rest at the bottom of your deck in any order."
 *
 * Rules: CR 8-1-2 ("up to"), CR 11-2-1 (revealing), the rest go to the bottom in any order.
 * Scenery: ST01-008 Nico Robin (SHC, cost 3), EB02-001 Karoo (Alabasta, cost 5), ST01-009 Nefeltari
 * Vivi (Alabasta, cost 2), ST01-003 Karoo (Alabasta, cost 1), P-015 Sunny-Kun (SHC, cost 1),
 * OP01-023 Marco (neither type, cost 3).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  describeLook13,
  hand,
  kind,
  L13,
  mine,
  need,
  offeredIds,
  pickCards,
  playRaw,
  settleOrders,
  V13,
} from './kit-op13a.ts';

const VIVI = 'OP13-012';

function start(deckTopFirst: string[]) {
  const g = mine(L13.luffy, {
    hand: [VIVI],
    deck: deckTopFirst,
    costArea: { active: 10, rested: 0 },
  });
  playRaw(g, VIVI);
  return g;
}

describe('OP13-012 Nefeltari Vivi: printed values', () => {
  it('cost 1, 2000, Counter +1000', () => {
    const g = mine(L13.luffy, { hand: [VIVI] });
    const c = g.card(at(g, 'p1', 'hand', VIVI));
    expect(c.cost).toBe(1);
    expect(c.counter).toBe(1000);
    playRaw(g, VIVI);
    expect(g.power(at(g, 'p1', 'characters', VIVI))).toBe(2000);
  });
});

describeLook13({
  id: 'OP13-012',
  n: 4,
  start,
  match: [V13.robin3, V13.karoo5], // a Straw Hat Crew card (cost 3) and an Alabasta card (cost 5)
  miss: V13.marco, // neither type
  edgeHit: V13.vivi2, // Alabasta, cost exactly 2
  edgeMiss: V13.karoo1, // Alabasta, cost 1
});

describe('OP13-012 Nefeltari Vivi: type and cost filters', () => {
  const deckWith = (top: string[]) => [...top, ...Array.from({ length: 12 }, () => V13.mohji)];

  it('a "Straw Hat Crew" card with cost 1 is not offered, one with cost 3 is', () => {
    const g = start(deckWith([V13.sunny1, V13.robin3, V13.marco, V13.marco]));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.robin3]);
  });

  it('both types are accepted: Alabasta and Straw Hat Crew qualify together, other types never', () => {
    const g = start(deckWith([V13.robin3, V13.karoo5, V13.marco, V13.thatch]));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.karoo5, V13.robin3].sort());
  });

  it('the pick can be the Alabasta card; the Straw Hat Crew card goes to the bottom', () => {
    const g = start(deckWith([V13.robin3, V13.karoo5, V13.marco, V13.thatch]));
    pickCards(g, [V13.karoo5]);
    settleOrders(g);
    expect(hand(g)).toEqual([V13.karoo5]);
  });

  it('with only cost-1 cards of the right types in the top 4, nothing can be added', () => {
    const g = start(deckWith([V13.sunny1, V13.karoo1, V13.marco, V13.thatch]));
    if (kind(g) === 'choose') expect(offeredIds(g)).toEqual([]);
    expect(hand(g)).toEqual([]);
  });
});
