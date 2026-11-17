/**
 * OP16-067 Tsuru (Character, Purple, cost 1, 2000, Counter +2000; Navy).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 {Navy} type card, add
 * it to your hand and place the rest at the bottom of your deck in any order. Then, trash 1 card from
 * your hand."
 *
 * Rules: unlike OP16-064 a card named Koby is allowed (no "other than"); the trash is mandatory and
 * chosen by the owner (CR 8-4-4-1: as many as possible), and may be the card just added; "Then"
 * resolves even when nothing was added (CR 4-10-2); an empty hand trashes nothing (CR 1-3-2).
 * Deck (top first): Komille (Navy), OP15-009 Koby (Navy), Marco, Doberman (Navy), Sai, Yamakaji (6th).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  answerOrders,
  BLUE,
  choiceCards,
  choose,
  chooseNone,
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

const TSURU = 'OP16-067';
const KOBY15 = 'OP15-009';
const TOP5 = [V.komille, KOBY15, VAN.marco, V.doberman, VAN.sai];

function game(p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LD.navy, BLUE, {
      hand: [TSURU, VAN.komachiyo],
      deck: [...TOP5, V.yamakaji, ...rep(BLUE, 8)],
      costArea: { active: 1, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
}

describe('OP16-067 Tsuru [On Play]: look at 5, add up to 1 Navy card, then trash 1 card from hand', () => {
  it('candidates: every Navy card in the top 5, including one named Koby', () => {
    const g = game();
    playFromHand(g, TSURU);
    expect(choiceCards(g)).toEqual([KOBY15, V.komille, V.doberman].sort());
  });

  it('add one, then trash a DIFFERENT hand card: the rest go to the bottom', () => {
    const g = game();
    playFromHand(g, TSURU);
    choose(g, [g.find('p1', 'deck', V.doberman)]);
    answerOrders(g, 'p1');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([V.doberman, VAN.komachiyo].sort());
    choose(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([V.doberman]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.komachiyo]);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(V.yamakaji);
    expect(sorted(zoneCards(g, 'p1', 'deck').slice(-4))).toEqual(
      sorted([V.komille, KOBY15, VAN.marco, VAN.sai]),
    );
    expect(kind(g)).toBe('main');
  });

  it('the trash may be the card just added', () => {
    const g = game();
    playFromHand(g, TSURU);
    choose(g, [g.find('p1', 'deck', V.komille)]);
    answerOrders(g, 'p1');
    choose(g, [g.find('p1', 'hand', V.komille)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.komachiyo]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([V.komille]);
  });

  it('CR 4-10-2: adding nothing, the trash still happens (the only hand card goes)', () => {
    const g = game();
    playFromHand(g, TSURU);
    chooseNone(g);
    answerOrders(g, 'p1');
    if (kind(g) === 'choose') choose(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.komachiyo]);
    expect(g.zone('p1', 'deck')).toHaveLength(14);
  });

  it('the trash is mandatory: exactly 1 card leaves the hand', () => {
    const g = game({ hand: [TSURU, VAN.komachiyo, VAN.sai] });
    playFromHand(g, TSURU);
    choose(g, [g.find('p1', 'deck', V.doberman)]);
    answerOrders(g, 'p1');
    choose(g, [g.find('p1', 'hand', VAN.sai)]);
    expect(g.zone('p1', 'hand')).toHaveLength(2);
    expect(g.zone('p1', 'trash')).toHaveLength(1);
  });

  it('CR 1-3-2: nothing added and an empty hand: nothing to trash', () => {
    const g = game({ hand: [TSURU], deck: [VAN.marco, VAN.sai, ...rep(BLUE, 10)] });
    playFromHand(g, TSURU);
    if (kind(g) === 'choose') chooseNone(g);
    answerOrders(g, 'p1');
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });
});
