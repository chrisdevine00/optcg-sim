/** OP09-060 Emptee Bluffs Island (Stage, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  activate,
  BLUE,
  CG_LEADER,
  expectDecision,
  finishOrder,
  hand,
  idsOf,
  mk,
  offeredAb,
  OTHER_LEADER,
  pick,
  times,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-060';
const DECK = [V.c4, V.c5, V.c6, ...times(5, BLUE)];

describe('OP09-060 Emptee Bluffs Island: [Activate: Main]', () => {
  const start = (leader: string, handCards = [V.c1, V.c2, V.c3]) =>
    mk({ leader, stage: ID, hand: handCards, deck: DECK });
  const stage = (g: ReturnType<typeof start>) => g.find('p1', 'stage', ID);

  it('place 2 cards from your hand at the bottom of your deck and rest this Stage: with a Cross Guild Leader, draw 2 cards', () => {
    const g = start(CG_LEADER);
    activate(g, stage(g), 'activate');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    finishOrder(g); // "in any order": the owner orders the two cards
    expect(g.card(stage(g)).rested).toBe(true);
    // The two cards are at the bottom; the 2 cards drawn come from the top (they were not shuffled in).
    expect(idsOf(g, 'p1', 'deck').slice(-2).sort()).toEqual([V.c1, V.c2].sort());
    expect(hand(g, 'p1').sort()).toEqual([V.c3, V.c4, V.c5].sort());
    expect(idsOf(g, 'p1', 'deck')).toHaveLength(DECK.length + 2 - 2);
  });

  it('with another Leader the cost is paid (cards placed, Stage rested) and nothing is drawn', () => {
    const g = start(OTHER_LEADER);
    activate(g, stage(g), 'activate');
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    finishOrder(g);
    expect(g.card(stage(g)).rested).toBe(true);
    expect(hand(g, 'p1')).toEqual([V.c3]);
    expect(idsOf(g, 'p1', 'deck')).toHaveLength(DECK.length + 2);
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(V.c4);
  });

  it('boundary: needs 2 cards in hand; with 1 it is not offered, with 2 it is', () => {
    const one = start(CG_LEADER, [V.c1]);
    expect(offeredAb(one, one.find('p1', 'stage', ID), 'activate')).toBe(false);
    const two = start(CG_LEADER, [V.c1, V.c2]);
    expect(offeredAb(two, two.find('p1', 'stage', ID), 'activate')).toBe(true);
  });

  it('with exactly 2 cards in hand both are placed and 2 are drawn', () => {
    const g = start(CG_LEADER, [V.c1, V.c2]);
    activate(g, stage(g), 'activate');
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    finishOrder(g);
    expect(hand(g, 'p1').sort()).toEqual([V.c4, V.c5].sort());
  });

  it('cannot be activated while it is rested', () => {
    const g = mk({
      leader: CG_LEADER,
      stage: { card: ID, rested: true },
      hand: [V.c1, V.c2],
      deck: DECK,
    });
    expect(offeredAb(g, g.find('p1', 'stage', ID), 'activate')).toBe(false);
  });
});
