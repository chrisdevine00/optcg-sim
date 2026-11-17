/**
 * OP16-064 Koby (Character, Purple, cost 1, 2000, Counter +1000; Navy).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 {Navy} type card other
 * than [Koby] and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: only the top 5 are looked at (CR 3-1 / "look at"); "other than [Koby]" excludes any card
 * NAMED Koby (CR 2-1-2) even if it is Navy; "up to 1" and a hidden-zone search may find nothing
 * (CR 8-4-4-1, 8-4-4-2); the revealed card is shown to the opponent (CR 8-4-3 style); the rest go to
 * the bottom, so the deck keeps its size minus the card taken.
 * Deck (top first): OP02-097 Komille (Navy), OP15-009 Koby (Navy, named Koby), OP01-023 Marco (not
 * Navy), OP02-107 Doberman (Navy), OP01-012 Sai (not Navy), then OP02-116 Yamakaji (Navy, 6th card).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  answerOrders,
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  hasEvent,
  kind,
  LD,
  LEAD,
  myTurn,
  playFromHand,
  RED,
  rep,
  side,
  sorted,
  sortedIds,
  V,
  VAN,
  zoneCards,
} from './kit-d.ts';

const KOBY = 'OP16-064';
const OTHER_KOBY = 'OP15-009';
const TOP5 = [V.komille, OTHER_KOBY, VAN.marco, V.doberman, VAN.sai];

function game(p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LD.navy, BLUE, {
      hand: [KOBY],
      deck: [...TOP5, V.yamakaji, ...rep(BLUE, 8)],
      costArea: { active: 1, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
}

describe('OP16-064 Koby [On Play]: look at 5, add up to 1 Navy card other than Koby, rest to the bottom', () => {
  it('candidates: Navy cards in the top 5 other than a card named Koby; the 6th card is not looked at', () => {
    const g = game();
    playFromHand(g, KOBY);
    expect(choiceCards(g)).toEqual([V.komille, V.doberman].sort());
  });

  it('adding one: it goes to hand, the other 4 looked-at cards go to the bottom, the 6th card is now on top', () => {
    const g = game();
    playFromHand(g, KOBY);
    choose(g, [g.find('p1', 'deck', V.doberman)]);
    answerOrders(g, 'p1');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([V.doberman]);
    expect(g.zone('p1', 'deck')).toHaveLength(13);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(V.yamakaji);
    expect(sorted(zoneCards(g, 'p1', 'deck').slice(-4))).toEqual(
      sorted([V.komille, OTHER_KOBY, VAN.marco, VAN.sai]),
    );
    expect(kind(g)).toBe('main');
  });

  it('the revealed card is revealed (an event is emitted)', () => {
    const g = game();
    playFromHand(g, KOBY);
    choose(g, [g.find('p1', 'deck', V.komille)]);
    expect(hasEvent(g, 'CardRevealed')).toBe(true);
  });

  it('CR 8-4-4-2: the player may add nothing even though matches exist; all 5 go to the bottom', () => {
    const g = game();
    playFromHand(g, KOBY);
    chooseNone(g);
    answerOrders(g, 'p1');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.zone('p1', 'deck')).toHaveLength(14);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(V.yamakaji);
    expect(sorted(zoneCards(g, 'p1', 'deck').slice(-5))).toEqual(sorted(TOP5));
  });

  it('at most 1: after one pick no second Navy card is offered', () => {
    const g = game();
    playFromHand(g, KOBY);
    choose(g, [g.find('p1', 'deck', V.komille)]);
    answerOrders(g, 'p1');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([V.komille]);
  });

  it('with no Navy card (other than Koby) in the top 5 nothing can be added', () => {
    const g = game({ deck: [VAN.marco, VAN.sai, OTHER_KOBY, ...rep(BLUE, 10)] });
    playFromHand(g, KOBY);
    if (kind(g) === 'choose') chooseNone(g);
    answerOrders(g, 'p1');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.zone('p1', 'deck')).toHaveLength(13);
  });
});
