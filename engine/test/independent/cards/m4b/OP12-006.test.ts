/**
 * OP12-006 Shakuyaku (Character, Red, cost 1, 2000, Counter +1000; Amazon Lily).
 *
 * Card text (cards/data):
 *   "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 [Monkey.D.Luffy] or 1 red
 *    Event and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Reading: "up to 1 A or 1 B and add it" is one card in total (the singular "it"); each option is a
 * separate filter: a card named exactly [Monkey.D.Luffy] of any color (CR 2-1-2), or an Event whose
 * color is red. The card to find can be any category with that name, so green P-061 Luffy counts.
 * Note: the printed text could be read as one of each; "it" and the usual "or" meaning (choose one
 * of the alternatives) make one card the better reading.
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import { play } from '../../helpers.ts';
import {
  CH,
  chooseNone,
  choices,
  EV,
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

const SHAKU = 'OP12-006';
// Luffy (red), Asura (green Event: wrong color), Kick (red Event), Thatch (red Character, not Luffy),
// Luffy (green P-061); the 6th card is another Luffy outside the five.
const TOP: CardId[] = [CH.luffy4, EV.asura, EV.kick, CH.thatch, CH.luffyG8, CH.luffy7];

function game(top: CardId[] = TOP) {
  const g = myTurn(
    side(LB.redShc, F.red, {
      hand: [SHAKU],
      deck: [...top, ...Array.from({ length: 8 }, () => F.red)],
      costArea: { active: 1, rested: 0 },
    }),
    side(LB.opp, F.red),
  );
  play(g, g.find('p1', 'hand', SHAKU));
  return g;
}

describe('OP12-006 Shakuyaku: [On Play] look at 5, add up to 1 [Monkey.D.Luffy] or red Event', () => {
  it('offers both Luffys (any color) and the red Event; not the green Event, not a red non-Luffy Character, not the 6th card', () => {
    const g = game();
    expect(offeredCardIds(g)).toEqual([CH.luffy4, EV.kick, CH.luffyG8].sort());
  });

  it('happy path: pick the red Event → hand; the other four to the bottom; the 6th card on top', () => {
    const g = game();
    pickCard(g, EV.kick);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([EV.kick]);
    const deck = zoneCards(g, 'p1', 'deck');
    expect(deck[0]).toBe(CH.luffy7);
    expect(deck.slice(-4).sort()).toEqual([CH.luffy4, EV.asura, CH.thatch, CH.luffyG8].sort());
  });

  it('CR 2-1-2: the green [Monkey.D.Luffy] (P-061) is a legal pick; the color restriction belongs only to the Event', () => {
    const g = game();
    pickCard(g, CH.luffyG8);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([CH.luffyG8]);
  });

  it('one card in total: after picking a Luffy the red Event is no longer offered', () => {
    const g = game();
    pickCard(g, CH.luffy4);
    expect(choices(g)).toEqual([]);
  });

  it('only non-red Events and non-Luffy cards in the top 5: nothing to add, all go to the bottom', () => {
    const g = game([EV.asura, CH.thatch, CH.marco, EV.rashomon, CH.sai, CH.luffy4]);
    expect(choices(g)).toEqual([]);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([]);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(CH.luffy4);
  });

  it('CR 8-4-4-1: adding nothing is allowed even when candidates exist', () => {
    const g = game();
    chooseNone(g);
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([]);
    expect(zoneCards(g, 'p1', 'deck').slice(-5).sort()).toEqual(
      [CH.luffy4, EV.asura, EV.kick, CH.thatch, CH.luffyG8].sort(),
    );
  });
});
