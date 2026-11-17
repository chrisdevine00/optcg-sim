/**
 * EB04-002 Jewelry Bonney (Character, Red, cost 1, 2000, Counter +1000; Bonney Pirates / Egghead).
 *
 * Card text (cards/data):
 *   "[On Play] Look at 4 cards from the top of your deck; reveal up to 1 {Egghead} or {Straw Hat
 *    Crew} type card other than [Jewelry Bonney] and add it to your hand. Then, place the rest at
 *    the bottom of your deck in any order."
 *
 * Rules: CR 8-4-4-1/-2; CR 2-1-2 (exact name [Jewelry Bonney] excludes every card of that name,
 * including OP08-105, which is itself an Egghead). Four cards are looked at, not five.
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import { play } from '../../helpers.ts';
import {
  CH,
  chooseNone,
  choices,
  F,
  finishEmpty,
  LB,
  myTurn,
  offeredCardIds,
  pickCard,
  settleOrder,
  side,
  zoneCards,
} from './kit-b.ts';

const BONNEY = 'EB04-002';
/** OP07-100 Edison: Yellow, Scientist / Egghead (not Straw Hat Crew). */
const EDISON = 'OP07-100';
/** OP08-105 Jewelry Bonney: Yellow, Bonney Pirates / Egghead: excluded by name. */
const OTHER_BONNEY = 'OP08-105';
const TOP: CardId[] = [OTHER_BONNEY, CH.marco, EDISON, CH.robin, CH.franky4];

function game(top: CardId[] = TOP) {
  const g = myTurn(
    side(LB.redShc, F.red, {
      hand: [BONNEY],
      deck: [...top, ...Array.from({ length: 8 }, () => F.red)],
      costArea: { active: 1, rested: 0 },
    }),
    side(LB.opp, F.red),
  );
  play(g, g.find('p1', 'hand', BONNEY));
  return g;
}

describe('EB04-002 Jewelry Bonney: [On Play] look at 4, add up to 1 {Egghead} or {Straw Hat Crew} other than [Jewelry Bonney]', () => {
  it('offers an Egghead card (Edison) and a Straw Hat Crew card (Robin); not Marco, not the other [Jewelry Bonney] (Egghead!), not the 5th card', () => {
    const g = game();
    expect(offeredCardIds(g)).toEqual([EDISON, CH.robin].sort());
  });

  it('happy path: pick the Egghead card → hand, 3 others to the bottom, the 5th card on top', () => {
    const g = game();
    pickCard(g, EDISON);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([EDISON]);
    const deck = zoneCards(g, 'p1', 'deck');
    expect(deck[0]).toBe(CH.franky4);
    expect(deck.slice(-3).sort()).toEqual([OTHER_BONNEY, CH.marco, CH.robin].sort());
    expect(deck).toHaveLength(12);
  });

  it('the Straw Hat Crew branch works too: Robin can be added', () => {
    const g = game();
    pickCard(g, CH.robin);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([CH.robin]);
  });

  it('only one card in total', () => {
    const g = game();
    pickCard(g, EDISON);
    expect(choices(g)).toEqual([]);
  });

  it('only 4 are looked at: an Egghead card in 5th place is not offered', () => {
    const g = game([CH.marco, CH.sai, CH.kingdew, CH.hajrudin, EDISON]);
    expect(choices(g)).toEqual([]);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(EDISON);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([]);
  });

  it('CR 8-4-4-1: choosing nothing sends all 4 to the bottom', () => {
    const g = game();
    chooseNone(g);
    settleOrder(g);
    const deck = zoneCards(g, 'p1', 'deck');
    expect(deck[0]).toBe(CH.franky4);
    expect(deck.slice(-4).sort()).toEqual([OTHER_BONNEY, CH.marco, EDISON, CH.robin].sort());
    expect(zoneCards(g, 'p1', 'hand')).toEqual([]);
  });
});
