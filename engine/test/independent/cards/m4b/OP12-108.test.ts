/**
 * OP12-108 Donquixote Rosinante (Character, Yellow, cost 1, 2000, Counter +1000; Donquixote Pirates / Navy).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 [Trafalgar Law] and add
 * it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: "[Trafalgar Law]" is a card NAME (CR 2-1-2): other Heart Pirates are not it; a card whose text
 * says "Also treat this card's name as [Trafalgar Law]" (EB04-038 Rosinante & Law) counts as that name
 * for every game purpose (CR 2-1-2-2 style "under the rules of this game"); only the top 5 are looked
 * at; "up to 1" and a search of a hidden zone may find nothing (CR 8-4-4-1, 8-4-4-2).
 * Deck (top first): OP04-087 Trafalgar Law, OP09-069 Trafalgar Law is not used; OP02-107 Doberman,
 * OP01-023 Marco, OP05-069 Trafalgar Law (cost 3), OP14-001 Trafalgar Law is a Leader (not used), then
 * a 6th card, OP12-106 Trafalgar Law, which is not looked at.
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

const ROSI = 'OP12-108';
const LAW_A = V.law5; // OP04-087
const LAW_B = 'OP05-069';
const LAW_6TH = V.law6blocker; // OP12-106, sixth from the top
const TOP5 = [LAW_A, V.doberman, VAN.marco, LAW_B, VAN.sai];

function game(p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LD.navy, BLUE, {
      hand: [ROSI],
      deck: [...TOP5, LAW_6TH, ...rep(BLUE, 8)],
      costArea: { active: 1, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
}

describe('OP12-108 Rosinante [On Play]: look at 5, add up to 1 [Trafalgar Law], rest to the bottom', () => {
  it('candidates: only cards named Trafalgar Law in the top 5 (not other cards, not the 6th card)', () => {
    const g = game();
    playFromHand(g, ROSI);
    expect(choiceCards(g)).toEqual([LAW_A, LAW_B].sort());
  });

  it('adding one Law: it goes to hand, the other 4 go to the bottom, the 6th card is on top', () => {
    const g = game();
    playFromHand(g, ROSI);
    choose(g, [g.find('p1', 'deck', LAW_B)]);
    answerOrders(g, 'p1');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([LAW_B]);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(LAW_6TH);
    expect(sorted(zoneCards(g, 'p1', 'deck').slice(-4))).toEqual(
      sorted([LAW_A, V.doberman, VAN.marco, VAN.sai]),
    );
    expect(g.zone('p1', 'deck')).toHaveLength(13);
    expect(kind(g)).toBe('main');
  });

  it('CR 8-4-4-2: the player may add nothing; all 5 go to the bottom', () => {
    const g = game();
    playFromHand(g, ROSI);
    chooseNone(g);
    answerOrders(g, 'p1');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(sorted(zoneCards(g, 'p1', 'deck').slice(-5))).toEqual(sorted(TOP5));
  });

  it('no Law in the top 5: nothing to add', () => {
    const g = game({
      deck: [V.doberman, VAN.marco, VAN.sai, V.komille, V.yamakaji, LAW_A, ...rep(BLUE, 8)],
    });
    playFromHand(g, ROSI);
    if (kind(g) === 'choose') chooseNone(g);
    answerOrders(g, 'p1');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('a card that is also treated as [Trafalgar Law] (EB04-038 Rosinante & Law) is a legal candidate', () => {
    const g = game({
      deck: ['EB04-038', V.doberman, VAN.marco, VAN.sai, V.komille, ...rep(BLUE, 8)],
    });
    playFromHand(g, ROSI);
    expect(choiceCards(g)).toEqual(['EB04-038']);
  });
});
