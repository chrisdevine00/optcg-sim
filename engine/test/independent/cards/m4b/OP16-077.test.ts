/**
 * OP16-077 "Buddha" Sengoku (Event, Purple, cost 1; Navy).
 *
 * Card text: "[Main] Look at 5 cards from the top of your deck; reveal up to 2 {Navy} type cards, add them
 * to your hand and place the rest at the bottom of your deck in any order. Then, trash 1 card from
 * your hand."
 *
 * Rules: only the top 5 are looked at; "up to 2" means 0, 1 or 2 (CR 8-4-4-1, 8-4-4-2); the trash is
 * mandatory and may be a card just added; the Event itself is not in hand any more; "Then" resolves
 * even if nothing was added (CR 4-10-2). Deck (top first): Komille (Navy), Doberman (Navy), Marco,
 * Yamakaji (Navy), Sai, then Saul (Navy, 6th: not looked at).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  answerOrders,
  BLUE,
  choose,
  chooseNone,
  kind,
  LD,
  LEAD,
  myTurn,
  RED,
  reachablePickSets,
  rep,
  side,
  sorted,
  sortedIds,
  V,
  VAN,
  zoneCards,
} from './kit-d.ts';

const SENGOKU = 'OP16-077';
const TOP5 = [V.komille, V.doberman, VAN.marco, V.yamakaji, VAN.sai];

function game(p1: Partial<PlayerSpec> = {}) {
  const g = myTurn(
    side(LD.navy, BLUE, {
      hand: [SENGOKU, VAN.komachiyo],
      deck: [...TOP5, V.saul, ...rep(BLUE, 8)],
      costArea: { active: 1, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
  act(g, { type: 'playCard', card: g.find('p1', 'hand', SENGOKU) });
  // Pay the 1 DON!! if the engine asks.
  const pay = g
    .legal()
    .find((a) => a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice);
  if (pay) g.act(pay);
  return g;
}

describe('OP16-077 "Buddha" Sengoku [Main]: look at 5, add up to 2 Navy cards, then trash 1', () => {
  it('candidates: the Navy cards among the top 5 only (not the 6th card)', () => {
    const g = game();
    // Every reachable set has 0, 1 or 2 cards, all Navy from the top 5.
    const sets = [...reachablePickSets(g)];
    expect(sets).toContain('');
    for (const s of sets) {
      const cards = s === '' ? [] : s.split('+');
      expect(cards.length).toBeLessThanOrEqual(2);
      for (const c of cards) expect([V.komille, V.doberman, V.yamakaji]).toContain(c);
    }
    expect(sets).toContain([V.komille, V.doberman].sort().join('+'));
    expect(sets).toContain([V.komille, V.yamakaji].sort().join('+'));
    expect(sets).toContain([V.doberman, V.yamakaji].sort().join('+'));
    expect(sets).not.toContain([V.komille, V.doberman, V.yamakaji].sort().join('+'));
  });

  it('adding 2: both go to hand, the other 3 to the bottom, then 1 hand card is trashed', () => {
    const g = game();
    choose(g, [g.find('p1', 'deck', V.komille), g.find('p1', 'deck', V.yamakaji)]);
    answerOrders(g, 'p1');
    expect(g.zone('p1', 'hand')).toHaveLength(3);
    choose(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([V.komille, V.yamakaji].sort());
    expect(sortedIds(g, 'p1', 'trash')).toEqual([SENGOKU, VAN.komachiyo].sort());
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(V.saul);
    expect(sorted(zoneCards(g, 'p1', 'deck').slice(-3))).toEqual(
      sorted([V.doberman, VAN.marco, VAN.sai]),
    );
    expect(g.zone('p1', 'deck')).toHaveLength(12);
    expect(kind(g)).toBe('main');
  });

  it('adding 1 is allowed', () => {
    const g = game();
    choose(g, [g.find('p1', 'deck', V.doberman)]);
    answerOrders(g, 'p1');
    choose(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([V.doberman]);
    expect(g.zone('p1', 'deck')).toHaveLength(13);
  });

  it('CR 4-10-2: adding 0 still trashes 1 card from hand', () => {
    const g = game();
    chooseNone(g);
    answerOrders(g, 'p1');
    if (kind(g) === 'choose') choose(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([SENGOKU, VAN.komachiyo].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(14);
  });

  it('the trashed card may be one of the cards just added', () => {
    const g = game();
    choose(g, [g.find('p1', 'deck', V.komille), g.find('p1', 'deck', V.doberman)]);
    answerOrders(g, 'p1');
    choose(g, [g.find('p1', 'hand', V.komille)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([V.doberman, VAN.komachiyo].sort());
  });
});
