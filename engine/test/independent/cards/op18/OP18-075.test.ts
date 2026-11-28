/**
 * OP18-075 Thousand Sunny (Stage, Purple, cost 5, type Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[On Play] Draw 1 card, then add up to 1 DON!! card as rested from your DON!! deck.
 *    [Activate: Main] DON!! −2, you may rest this Stage: Set up to 1 of your {Straw Hat Crew} type
 *    Characters with 7000 power or less as active."
 *
 * Rules: CR 8-3-1 (every part of a cost must be payable); CR 8-3-1-6 / RL-23 (DON!! −X may return
 * rested or given DON!!); "up to" CR 8-4-4-1; the power limit is the Character's current power,
 * with DON!! given to it counted on your turn (CR 6-5-5-2).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, play, takeMost } from '../../helpers.ts';
import {
  canActivate,
  choiceCards,
  chooseNone,
  choose,
  count,
  donOf,
  kind,
  LEAD,
  myTurn,
  payDon,
  PURPLE,
  RED,
  settleYes,
  side,
  sortedIds,
  activate,
  VAN,
} from '../kit.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SUNNY = 'OP18-075';
/** Vanilla {Straw Hat Crew} Characters: P-015 Sunny-Kun 3000, ST01-010 Franky 6000, OP02-039 Franky 7000,
 * ST14-013 Roronoa Zoro 8000. */
const SHC3 = 'P-015';
const SHC6 = 'ST01-010';
const SHC7 = 'OP02-039';
const SHC8 = 'ST14-013';

const rested = (card: string) => ({ card, rested: true });

function onField(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return myTurn(
    side(LEAD.kaido, PURPLE, {
      stage: SUNNY,
      characters: [rested(SHC7), rested(SHC3), rested(SHC8), rested(VAN.marco)],
      costArea: { active: 4, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED, p2),
  );
}

const stageOf = (g: TestGame) => g.find('p1', 'stage', SUNNY);

function useIt(g: TestGame): void {
  activate(g, stageOf(g));
  payDon(g, 2, 'costActive');
}

describe('OP18-075 Thousand Sunny: [On Play] draw 1, then add up to 1 rested DON!!', () => {
  it('playing it draws the top card and adds 1 rested DON!! from the DON!! deck', () => {
    const g = myTurn(
      side(LEAD.kaido, PURPLE, {
        hand: [SUNNY],
        deck: [VAN.marco, ...Array(10).fill(PURPLE)],
        costArea: { active: 5, rested: 0 },
      }),
      side(LEAD.luffy, RED),
    );
    play(g, g.find('p1', 'hand', SUNNY));
    takeMost(g);
    settleYes(g, 'p1');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.marco]);
    expect(count(g, 'p1', 'deck')).toBe(10);
    // 5 DON!! rested to pay the cost, plus 1 more added rested.
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 6, deck: 4 });
    expect(kind(g)).toBe('main');
  });
});

describe('OP18-075 Thousand Sunny: [Activate: Main] DON!! −2, rest it → set a ≤7000 {Straw Hat Crew} Character active', () => {
  it('happy path: 2 DON!! go back to the DON!! deck, the Stage rests, a rested 7000 Crew Character is active', () => {
    const g = onField();
    useIt(g);
    expect(choiceCards(g)).toEqual([SHC3, SHC7].sort());
    choose(g, [g.find('p1', 'characters', SHC7)]);
    expect(g.card(g.find('p1', 'characters', SHC7)).rested).toBe(false);
    expect(g.card(stageOf(g)).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, deck: 8 });
  });

  it('power boundary: 7000 is offered, 8000 is not', () => {
    const g = onField();
    useIt(g);
    const offeredCards = choiceCards(g);
    expect(offeredCards).toContain(SHC7);
    expect(offeredCards).not.toContain(SHC8);
    chooseNone(g);
  });

  it('only {Straw Hat Crew} Characters: a vanilla non-Crew Character is not offered', () => {
    const g = onField();
    useIt(g);
    expect(choiceCards(g)).not.toContain(VAN.marco);
    chooseNone(g);
  });

  it('only your own Characters are offered', () => {
    const g = onField({}, { characters: [rested(SHC3)] });
    useIt(g);
    expect(choiceCards(g)).toEqual([SHC3, SHC7].sort());
    expect(choiceCards(g)).toHaveLength(2);
    chooseNone(g);
  });

  it('DON!! given to a Character count toward its power: a 6000 Character with 2 DON!! (8000) is not offered', () => {
    const g = onField({
      characters: [{ card: SHC6, rested: true, don: 2 }, rested(SHC3)],
      costArea: { active: 4, rested: 0 },
    });
    useIt(g);
    expect(choiceCards(g)).toEqual([SHC3]);
    chooseNone(g);
  });

  it('"up to 1": choosing nobody is allowed; the costs stay paid', () => {
    const g = onField();
    useIt(g);
    chooseNone(g);
    expect(g.card(stageOf(g)).rested).toBe(true);
    expect(donOf(g, 'p1').deck).toBe(8);
    expect(g.card(g.find('p1', 'characters', SHC7)).rested).toBe(true);
  });

  it('CR 8-3-1: with only 1 DON!! on the field the DON!! −2 cannot be paid, so it cannot be activated', () => {
    const g = onField({ costArea: { active: 1, rested: 0 } });
    expect(canActivate(g, stageOf(g))).toBe(false);
  });

  it('the DON!! −2 can return rested DON!!, so 2 rested DON!! are enough', () => {
    const g = onField({ costArea: { active: 0, rested: 2 } });
    expect(canActivate(g, stageOf(g))).toBe(true);
    activate(g, stageOf(g));
    payDon(g, 2, 'costRested');
    choose(g, [g.find('p1', 'characters', SHC3)]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
    expect(g.card(g.find('p1', 'characters', SHC3)).rested).toBe(false);
  });

  it('a Stage that is already rested cannot pay the rest cost: it cannot be activated', () => {
    const g = onField({ stage: { card: SUNNY, rested: true } });
    expect(canActivate(g, stageOf(g))).toBe(false);
  });

  it('it can be activated the turn it is played', () => {
    const g = onField({ hand: [SUNNY], stage: undefined, costArea: { active: 8, rested: 0 } });
    play(g, g.find('p1', 'hand', SUNNY));
    takeMost(g);
    settleYes(g, 'p1');
    expect(canActivate(g, stageOf(g))).toBe(true);
    act(g, { type: 'endTurn' });
  });
});
