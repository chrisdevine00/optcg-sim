/**
 * OP16-078 Marineford (Stage, Purple, cost 1; Navy).
 *
 * Card text:
 *   "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 {Navy} type card and add it to
 *    your hand. Then, place the rest at the bottom of your deck in any order.
 *    [Activate: Main] DON!! −1, You may rest this Stage: Draw 1 card and trash 1 card from your hand."
 *
 * Rules: CR 8-3-1-3 costs that cannot be paid make the effect unusable (DON!! −1 needs a DON!! on the
 * field; "rest this Stage" needs an active Stage); DON!! −1 returns a DON!! to the DON!! deck (CR
 * 8-3-1-6); the trash after the draw is mandatory (CR 8-4-4-1). Deck for On Play: Komille (Navy),
 * Marco, Doberman (Navy), Sai, Yamakaji (Navy), then Saul (6th).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  activate,
  answerOrders,
  BLUE,
  canActivate,
  choiceCards,
  choose,
  chooseNone,
  donOf,
  kind,
  LD,
  LEAD,
  myTurn,
  payDon,
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

const MARINE = 'OP16-078';
const TOP5 = [V.komille, VAN.marco, V.doberman, VAN.sai, V.yamakaji];

describe('OP16-078 Marineford [On Play]: look at 5, add up to 1 Navy card, rest to the bottom', () => {
  function played(p1: Partial<PlayerSpec> = {}) {
    const g = myTurn(
      side(LD.navy, BLUE, {
        hand: [MARINE],
        deck: [...TOP5, V.saul, ...rep(BLUE, 8)],
        costArea: { active: 1, rested: 0 },
        ...p1,
      }),
      side(LEAD.luffy, RED),
    );
    playFromHand(g, MARINE);
    return g;
  }

  it('candidates are the Navy cards among the top 5; the chosen one goes to hand and the rest to the bottom', () => {
    const g = played();
    // Picks are made in canonical order, so the last candidate is not offered first.
    for (const c of choiceCards(g)) expect([V.komille, V.doberman, V.yamakaji]).toContain(c);
    expect(choiceCards(g)).not.toContain(VAN.marco);
    expect(choiceCards(g)).not.toContain(V.saul);
    choose(g, [g.find('p1', 'deck', V.doberman)]);
    answerOrders(g, 'p1');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([V.doberman]);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(V.saul);
    expect(sorted(zoneCards(g, 'p1', 'deck').slice(-4))).toEqual(
      sorted([V.komille, VAN.marco, VAN.sai, V.yamakaji]),
    );
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([MARINE]);
    expect(kind(g)).toBe('main');
  });

  it('CR 8-4-4-2: up to 1 may be none; all 5 go to the bottom', () => {
    const g = played();
    chooseNone(g);
    answerOrders(g, 'p1');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(sorted(zoneCards(g, 'p1', 'deck').slice(-5))).toEqual(sorted(TOP5));
  });
});

describe('OP16-078 Marineford [Activate: Main]: DON!! −1, rest this Stage: draw 1, trash 1', () => {
  function onField(p1: Partial<PlayerSpec> = {}) {
    return myTurn(
      side(LD.navy, BLUE, {
        stage: MARINE,
        hand: [VAN.komachiyo, VAN.sai],
        deck: [VAN.marco, ...rep(BLUE, 10)],
        costArea: { active: 2, rested: 0 },
        ...p1,
      }),
      side(LEAD.luffy, RED),
    );
  }

  it('happy path: one DON!! goes back to the DON!! deck, the Stage rests, draw 1 then trash 1', () => {
    const g = onField();
    const deckBefore = donOf(g, 'p1').deck;
    activate(g, g.find('p1', 'stage', MARINE));
    payDon(g, 1);
    // draw 1 (Marco) then trash any 1 of the 3 cards in hand
    choose(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    expect(donOf(g, 'p1').deck).toBe(deckBefore + 1);
    expect(donOf(g, 'p1').active + donOf(g, 'p1').rested).toBe(1);
    expect(g.card(g.find('p1', 'stage', MARINE)).rested).toBe(true);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.marco, VAN.sai].sort());
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.komachiyo]);
    expect(kind(g)).toBe('main');
  });

  it('the card just drawn may be the one trashed', () => {
    const g = onField();
    activate(g, g.find('p1', 'stage', MARINE));
    payDon(g, 1);
    choose(g, [g.find('p1', 'hand', VAN.marco)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.komachiyo, VAN.sai].sort());
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.marco]);
  });

  it('the Stage is rested by the cost, so it cannot be used again this turn', () => {
    const g = onField({ costArea: { active: 3, rested: 0 } });
    activate(g, g.find('p1', 'stage', MARINE));
    payDon(g, 1);
    choose(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    expect(canActivate(g, g.find('p1', 'stage', MARINE))).toBe(false);
  });

  it('CR 8-3-1-3: with no DON!! on the field the DON!! −1 cannot be paid', () => {
    const g = onField({ costArea: { active: 0, rested: 0 } });
    expect(canActivate(g, g.find('p1', 'stage', MARINE))).toBe(false);
  });

  it('CR 8-3-1-3: an already rested Stage cannot pay "rest this Stage"', () => {
    const g = onField({ stage: { card: MARINE, rested: true } });
    expect(canActivate(g, g.find('p1', 'stage', MARINE))).toBe(false);
  });
});
