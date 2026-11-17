/**
 * EB02-017 Nami (Character, Green, cost 1, 2000, Counter +1000; Straw Hat Crew / East Blue).
 *
 * Card text (cards/data):
 *   "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 "Straw Hat Crew" type card
 *    other than [Nami] and add it to your hand. Then, place the rest at the bottom of your deck in
 *    any order."
 *
 * Rules: "up to 1" allows 0 and a search of a hidden area may whiff (CR 8-4-4-1, 8-4-4-2); [Nami]
 * is an exact name (CR 2-1-2), so every card named Nami is excluded; "type card" covers Events and
 * Stages, not only Characters; the cards looked at stay in the deck until moved (CR 11-3-2).
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import { decision, play } from '../../helpers.ts';
import {
  CH,
  chooseNone,
  choices,
  EV,
  F,
  finishEmpty,
  hasEvent,
  kind,
  LB,
  myTurn,
  offeredCardIds,
  outcomes,
  opponentView,
  pickCard,
  settleOrder,
  side,
  zoneCards,
} from './kit-b.ts';

const NAMI = 'EB02-017';
// Top first: Robin (SHC), Nami (excluded by name), Marco (not SHC), Kick (SHC Event), Sai (not SHC),
// then the 6th card Franky (SHC, outside the five looked at), then fillers.
const TOP: CardId[] = [CH.robin, CH.nami5, CH.marco, EV.kick, CH.sai, CH.franky4];

function game(top: CardId[] = TOP) {
  const g = myTurn(
    side(LB.greenShc, F.green, {
      hand: [NAMI],
      deck: [...top, ...Array.from({ length: 8 }, () => F.green)],
      costArea: { active: 1, rested: 0 },
    }),
    side(LB.opp, F.red),
  );
  play(g, g.find('p1', 'hand', NAMI));
  return g;
}

describe('EB02-017 Nami: [On Play] look at 5, add up to 1 other "Straw Hat Crew" card, rest to the bottom', () => {
  it('offers exactly the Straw Hat Crew cards among the top 5 other than [Nami]: Robin and the Event, not Nami, Marco, Sai or the 6th card', () => {
    const g = game();
    expect(kind(g)).toBe('choose');
    expect(offeredCardIds(g)).toEqual([CH.robin, EV.kick].sort());
  });

  it('happy path: pick Robin → Robin in hand, the other 4 at the bottom, the 6th card is now on top', () => {
    const g = game();
    pickCard(g, CH.robin);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([CH.robin]);
    const deck = zoneCards(g, 'p1', 'deck');
    expect(deck[0]).toBe(CH.franky4);
    expect(deck.slice(-4).sort()).toEqual([CH.nami5, CH.marco, EV.kick, CH.sai].sort());
    expect(deck).toHaveLength(8 + 6 - 1);
    expect(decision(g)?.kind).toBe('main');
  });

  it('a Straw Hat Crew Event counts as a "type card" and can be added', () => {
    const g = game();
    pickCard(g, EV.kick);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([EV.kick]);
  });

  it('only 1 card: once one is picked the other candidate is not offered again', () => {
    const g = game();
    pickCard(g, CH.robin);
    expect(choices(g)).toEqual([]);
  });

  it('CR 8-4-4-1: "up to 1" - choosing nothing puts all 5 at the bottom, hand stays empty', () => {
    const g = game();
    chooseNone(g);
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([]);
    const deck = zoneCards(g, 'p1', 'deck');
    expect(deck[0]).toBe(CH.franky4);
    expect(deck.slice(-5).sort()).toEqual([CH.robin, CH.nami5, CH.marco, EV.kick, CH.sai].sort());
    expect(deck).toHaveLength(14);
  });

  it('CR 8-4-4-2: with no legal card among the top 5 nothing can be added and all 5 go to the bottom', () => {
    const g = game([CH.marco, CH.sai, CH.kingdew, CH.nami5, CH.hajrudin, CH.robin]);
    expect(choices(g)).toEqual([]);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([]);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(CH.robin);
  });

  it('CR 11-3-1: the opponent cannot see the cards looked at', () => {
    const g = game();
    expect(decision(g)?.player).toBe('p1');
    const view = opponentView(g, 'p2');
    expect(view).not.toContain(CH.robin);
    expect(view).not.toContain(CH.hajrudin);
  });

  it('"in any order": the owner chooses the order of the 4 cards at the bottom: several different orders are reachable, all with the same 4 cards', () => {
    const g = game();
    pickCard(g, CH.robin);
    const bottoms = outcomes(g, 'p1', (b) => zoneCards(b, 'p1', 'deck').slice(-4).join(','), 12);
    expect(bottoms.size).toBeGreaterThan(1);
    for (const o of bottoms) {
      expect(o.split(',').sort()).toEqual([CH.nami5, CH.marco, EV.kick, CH.sai].sort());
    }
  });

  it('revealing the added card is public (a CardRevealed event is emitted)', () => {
    const g = game();
    pickCard(g, CH.robin);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(hasEvent(g, 'CardRevealed')).toBe(true);
  });
});
