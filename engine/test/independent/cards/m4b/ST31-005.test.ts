/**
 * ST31-005 Thousand Sunny (Stage, Red, cost 1; Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 {Straw Hat Crew} type card
 *    and add it to your hand. Then, place the rest at the bottom of your deck in any order.
 *    [Activate: Main] You may rest this Stage: Give up to 1 rested DON!! card to 1 of your
 *    [Monkey.D.Luffy] cards."
 *
 * Rules: [Monkey.D.Luffy] is an exact name (CR 2-1-2), so P-022 and the Leader ST01-001 qualify and
 * [Nami] does not; only a rested cost-area DON!! can be given (CR 6-5-5, RL-35); an Activate cost
 * of "rest this" needs the Stage active (CR 8-3-1-5); a Stage's "On Play" fires when it is played.
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import { play } from '../../helpers.ts';
import {
  abilities,
  activate,
  CH,
  chooseNone,
  chooseIfAsked,
  choiceCards,
  choose,
  donOf,
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
  canActivate,
} from './kit-b.ts';

const SUNNY = 'ST31-005';
const TOP: CardId[] = [CH.marco, CH.nami5, EV.kick, CH.sai, CH.robin, CH.franky4];

describe('ST31-005 Thousand Sunny: [On Play] look at 5, add up to 1 {Straw Hat Crew} card', () => {
  function playGame(top: CardId[] = TOP) {
    const g = myTurn(
      side(LB.redShc, F.red, {
        hand: [SUNNY],
        deck: [...top, ...Array.from({ length: 8 }, () => F.red)],
        costArea: { active: 1, rested: 0 },
      }),
      side(LB.opp, F.red),
    );
    play(g, g.find('p1', 'hand', SUNNY));
    return g;
  }

  it('offers every Straw Hat Crew card among the top 5, with no name exclusion: Nami, the Event, Robin; not Marco, Sai or the 6th card', () => {
    const g = playGame();
    expect(offeredCardIds(g)).toEqual([CH.nami5, EV.kick, CH.robin].sort());
  });

  it('happy path: add Nami; the other four go to the bottom; the 6th card is the new top; the Stage is in play', () => {
    const g = playGame();
    pickCard(g, CH.nami5);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([CH.nami5]);
    const deck = zoneCards(g, 'p1', 'deck');
    expect(deck[0]).toBe(CH.franky4);
    expect(deck.slice(-4).sort()).toEqual([CH.marco, EV.kick, CH.sai, CH.robin].sort());
    expect(zoneCards(g, 'p1', 'stage')).toEqual([SUNNY]);
  });

  it('up to 1: choosing nothing puts all five at the bottom', () => {
    const g = playGame();
    chooseNone(g);
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([]);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(CH.franky4);
  });

  it('with no Straw Hat Crew card among the five, nothing can be added', () => {
    const g = playGame([CH.marco, CH.sai, CH.kingdew, CH.hajrudin, CH.thatch, CH.robin]);
    expect(offeredCardIds(g)).toEqual([]);
    finishEmpty(g, 'p1');
    settleOrder(g);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([]);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(CH.robin);
  });
});

describe('ST31-005 Thousand Sunny: [Activate: Main] rest this Stage: give up to 1 rested DON!! to a [Monkey.D.Luffy]', () => {
  function stageGame(over: { rested?: boolean; leader?: string; restedDon?: number } = {}) {
    return myTurn(
      side(over.leader ?? LB.redShc, F.red, {
        stage: { card: SUNNY, rested: over.rested ?? false },
        characters: [CH.luffy4, CH.robin, CH.nami5],
        costArea: { active: 1, rested: over.restedDon ?? 2 },
      }),
      side(LB.opp, F.red),
    );
  }

  it('happy path: the Stage rests and one rested DON!! goes to the chosen [Monkey.D.Luffy] Character', () => {
    const g = stageGame();
    const luffy = g.find('p1', 'characters', CH.luffy4);
    activate(g, g.find('p1', 'stage', SUNNY));
    choose(g, [luffy]);
    expect(g.card(g.find('p1', 'stage', SUNNY)).rested).toBe(true);
    expect(g.card(luffy).don).toBe(1);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 1, given: 1 });
    expect(g.power(luffy)).toBe(7000);
  });

  it('CR 2-1-2: candidates are exactly the [Monkey.D.Luffy] cards: the Luffy Character and the Luffy Leader; not Robin, not [Nami]', () => {
    const g = stageGame();
    activate(g, g.find('p1', 'stage', SUNNY));
    expect(choiceCards(g)).toEqual([LB.redShc, CH.luffy4].sort());
  });

  it('the Leader can receive it when it is a [Monkey.D.Luffy]', () => {
    const g = stageGame();
    activate(g, g.find('p1', 'stage', SUNNY));
    choose(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('only a rested DON!! is given: the 1 active DON!! stays in the cost area', () => {
    const g = stageGame({ restedDon: 1 });
    activate(g, g.find('p1', 'stage', SUNNY));
    choose(g, [g.find('p1', 'characters', CH.luffy4)]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 0, given: 1 });
  });

  // DISAGREEMENTS-b.md B-1: "up to 1 rested DON!!" - the engine forces a recipient and gives the DON!!.
  it.fails('CR 8-4-4-1: "up to 1": giving no DON!! is allowed (the Stage is still rested)', () => {
    const g = stageGame();
    activate(g, g.find('p1', 'stage', SUNNY));
    chooseNone(g);
    expect(g.card(g.find('p1', 'stage', SUNNY)).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ given: 0, rested: 2 });
  });

  it('CR 8-3-1-5: a rested Stage cannot pay "rest this Stage", so the ability is not offered', () => {
    const g = stageGame({ rested: true });
    expect(canActivate(g, g.find('p1', 'stage', SUNNY))).toBe(false);
    expect(abilities(g, g.find('p1', 'stage', SUNNY))).toEqual([]);
  });

  it('a Leader that is not [Monkey.D.Luffy] is not a candidate: only the Character can get the DON!!', () => {
    const g = stageGame({ leader: LB.greenKid });
    activate(g, g.find('p1', 'stage', SUNNY));
    expect(choiceCards(g).filter((c) => c === LB.greenKid)).toEqual([]);
    chooseIfAsked(g, [g.find('p1', 'characters', CH.luffy4)]);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(g.card(g.find('p1', 'characters', CH.luffy4)).don).toBe(1);
  });
});
