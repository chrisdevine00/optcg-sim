/**
 * OP01-016 Nami (Character, Red, cost 1, 2000, Counter +1000; Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 "Straw Hat Crew" type card
 *    other than [Nami] and add it to your hand. Then, place the rest at the bottom of your deck in
 *    any order."
 *
 * Rules: CR 8-4-4-1/-2 ("up to", whiffing a search), CR 2-1-2 (exact name [Nami]), CR 11-3-1/-2
 * (looked-at cards stay in the deck, private). QA-OP01 OP01-016: looking does not empty the deck
 * (RL-26), so this works with exactly 5 cards in the deck and the game goes on.
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import { decision, play, result } from '../../helpers.ts';
import {
  CH,
  chooseNone,
  choices,
  EV,
  F,
  finishEmpty,
  kind,
  LB,
  myTurn,
  offeredCardIds,
  outcomes,
  pickCard,
  settleOrder,
  side,
  zoneCards,
} from './kit-b.ts';

const NAMI = 'OP01-016';
const TOP: CardId[] = [CH.marco, CH.usopp5, CH.nami5, CH.sai, EV.kick, CH.robin];

function game(top: CardId[] = TOP, fillerCount = 8) {
  const g = myTurn(
    side(LB.redShc, F.red, {
      hand: [NAMI],
      deck: [...top, ...Array.from({ length: fillerCount }, () => F.red)],
      costArea: { active: 1, rested: 0 },
    }),
    side(LB.opp, F.red),
  );
  play(g, g.find('p1', 'hand', NAMI));
  return g;
}

describe('OP01-016 Nami: [On Play] look at 5, add up to 1 other "Straw Hat Crew" card', () => {
  it('candidates among the top 5: Usopp and the SHC Event; not Marco, Sai, the other [Nami], or the 6th card', () => {
    const g = game();
    expect(offeredCardIds(g)).toEqual([CH.usopp5, EV.kick].sort());
  });

  it('happy path: Usopp goes to hand; the other four go to the bottom; the 6th card is the new top', () => {
    const g = game();
    pickCard(g, CH.usopp5);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([CH.usopp5]);
    const deck = zoneCards(g, 'p1', 'deck');
    expect(deck[0]).toBe(CH.robin);
    expect(deck.slice(-4).sort()).toEqual([CH.marco, CH.nami5, CH.sai, EV.kick].sort());
    expect(deck).toHaveLength(13);
  });

  it('CR 8-4-4-1: adding nothing is allowed; all five go to the bottom', () => {
    const g = game();
    chooseNone(g);
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([]);
    const deck = zoneCards(g, 'p1', 'deck');
    expect(deck[0]).toBe(CH.robin);
    expect(deck.slice(-5).sort()).toEqual([CH.marco, CH.usopp5, CH.nami5, CH.sai, EV.kick].sort());
  });

  it('only a Straw Hat Crew card named [Nami]: nothing is offered and the cards still go to the bottom', () => {
    const g = game([CH.nami5, CH.marco, CH.sai, CH.kingdew, CH.hajrudin, CH.robin]);
    expect(choices(g)).toEqual([]);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([]);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(CH.robin);
  });

  it('only one card can be added', () => {
    const g = game();
    pickCard(g, EV.kick);
    expect(choices(g)).toEqual([]);
  });

  it('"in any order": several different bottom orders are reachable, all with the same 4 cards', () => {
    const g = game();
    pickCard(g, CH.usopp5);
    const bottoms = outcomes(g, 'p1', (b) => zoneCards(b, 'p1', 'deck').slice(-4).join(','), 12);
    expect(bottoms.size).toBeGreaterThan(1);
    for (const o of bottoms) {
      expect(o.split(',').sort()).toEqual([CH.marco, CH.nami5, CH.sai, EV.kick].sort());
    }
  });

  it('RL-26 / QA-OP01 OP01-016: looking does not empty the deck. With exactly 5 cards, the game continues', () => {
    const g = game([CH.marco, CH.usopp5, CH.nami5, CH.sai, EV.kick], 0);
    expect(kind(g)).toBe('choose');
    chooseNone(g);
    settleOrder(g);
    expect(result(g)).toBeNull();
    expect(decision(g)?.kind).toBe('main');
    expect(zoneCards(g, 'p1', 'deck')).toHaveLength(5);
  });
});
