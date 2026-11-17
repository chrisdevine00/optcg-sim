/**
 * OP14-019 I Have a Plan to Take Down One of the Four Emperors!! (Event, Red, cost 1; Heart Pirates /
 * Supernovas / The Seven Warlords of the Sea).
 *
 * Card text (cards/data):
 *   "[Main] Look at 4 cards from the top of your deck; reveal up to 1 {Supernovas} or {Straw Hat
 *    Crew} type Character card and add it to your hand. Then, place the rest at the bottom of your
 *    deck in any order.
 *    [Trigger] Draw 1 card."
 *
 * Rules: CR 8-4-4-1/-2 (up to, whiffing); only Character cards qualify (an Event of the type does
 * not); a [Trigger] does not cost the printed cost (CR 10-1-5-1, digest Q8).
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import { act, decision, passBlock } from '../../helpers.ts';
import {
  CH,
  chooseNone,
  choices,
  donOf,
  EV,
  F,
  finishEmpty,
  hitAndTrigger,
  LB,
  myTurn,
  offeredCardIds,
  pickCard,
  settleOrder,
  side,
  theirTurn,
  zoneCards,
} from './kit-b.ts';

const PLAN = EV.plan;
/** OP07-028 Scratchmen Apoo: Green, 6/8000, On-Air Pirates / Supernovas (no Straw Hat Crew). */
const APOO = 'OP07-028';
const TOP: CardId[] = [EV.kick, CH.marco, APOO, CH.robin, CH.thatch];

function mainGame(top: CardId[] = TOP) {
  const g = myTurn(
    side(LB.redShc, F.red, {
      hand: [PLAN],
      deck: [...top, ...Array.from({ length: 8 }, () => F.red)],
      costArea: { active: 2, rested: 0 },
    }),
    side(LB.opp, F.red),
  );
  act(g, { type: 'playCard', card: g.find('p1', 'hand', PLAN) });
  return g;
}

describe('OP14-019 [Main]: look at 4, add up to 1 {Supernovas} or {Straw Hat Crew} Character', () => {
  it('offers the Supernovas Character and the Straw Hat Crew Character; not the SHC Event, Marco, or the 5th card', () => {
    const g = mainGame();
    expect(offeredCardIds(g)).toEqual([APOO, CH.robin].sort());
  });

  it('happy path: add Apoo (Supernovas only); others go to the bottom; the 5th card is on top; the Event is trashed after paying 1', () => {
    const g = mainGame();
    pickCard(g, APOO);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([APOO]);
    const deck = zoneCards(g, 'p1', 'deck');
    expect(deck[0]).toBe(CH.thatch);
    expect(deck.slice(-3).sort()).toEqual([EV.kick, CH.marco, CH.robin].sort());
    expect(zoneCards(g, 'p1', 'trash')).toEqual([PLAN]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
  });

  it('the Straw Hat Crew branch works: Robin can be added', () => {
    const g = mainGame();
    pickCard(g, CH.robin);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([CH.robin]);
  });

  it('an Event of the type (OP04-016, Straw Hat Crew) alone is not a legal pick: Characters only', () => {
    const g = mainGame([EV.kick, EV.asura, CH.marco, CH.sai, CH.robin]);
    expect(choices(g)).toEqual([]);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([]);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(CH.robin);
  });

  it('one card only', () => {
    const g = mainGame();
    pickCard(g, APOO);
    expect(choices(g)).toEqual([]);
  });

  it('CR 8-4-4-1: choosing nothing sends all 4 to the bottom', () => {
    const g = mainGame();
    chooseNone(g);
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([]);
    const deck = zoneCards(g, 'p1', 'deck');
    expect(deck[0]).toBe(CH.thatch);
    expect(deck.slice(-4).sort()).toEqual([EV.kick, CH.marco, APOO, CH.robin].sort());
  });
});

describe('OP14-019 [Trigger]: draw 1 card', () => {
  function triggerGame() {
    return theirTurn(
      side(LB.redShc, F.red, {
        life: [PLAN, F.red, F.red, F.red],
        deck: [CH.thatch, CH.marco, ...Array.from({ length: 10 }, () => F.red)],
      }),
      side(LB.opp, F.red),
    );
  }

  it('activating the revealed Life card draws 1 card (the top of the deck)', () => {
    const g = triggerGame();
    hitAndTrigger(g, g.leader('p2'), g.leader('p1'), true);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([CH.thatch]);
    expect(g.life('p1')).toBe(3);
    expect(zoneCards(g, 'p1', 'trash')).toEqual([PLAN]);
    expect(decision(g)?.kind).toBe('main');
  });

  it('declining the [Trigger] adds the Life card to hand and draws nothing', () => {
    const g = triggerGame();
    hitAndTrigger(g, g.leader('p2'), g.leader('p1'), false);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([PLAN]);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(CH.thatch);
  });

  it('no printed cost is paid for a [Trigger]: p1 has no active DON!! and it still works', () => {
    const g = triggerGame();
    expect(donOf(g, 'p1').active).toBe(0);
    passBlock(g);
    hitAndTrigger(g, g.leader('p2'), g.leader('p1'), true);
    expect(zoneCards(g, 'p1', 'hand')).toHaveLength(1);
  });
});
