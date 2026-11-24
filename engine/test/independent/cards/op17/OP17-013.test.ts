/**
 * OP17-013 Portgas.D.Ace (Character, Red, cost 6, 6000, Counter +1000, {Whitebeard Pirates}, Special).
 *
 * Card text: "If your opponent has a Character with 10000 power or more, give this card in your hand -2
 * cost. [On Play] If your Leader is [Edward.Newgate], give up to 1 of your opponent's rested
 * Characters -6000 power during this turn."
 *
 * Rules: CR 1-3-6-2 (cost reductions), CR 8-3-3 (text after a failed "if" does not resolve), CR
 * 8-4-4-1 ("up to"), RL-09 ("during this turn"), CR 7-1-1-2 (rested Characters). Unlike Izo (OP17-003)
 * only a Leader named [Edward.Newgate] qualifies: a {Land of Wano} Leader does not.
 */
import { describe, expect, it } from 'vitest';
import { isLegal } from '../../helpers.ts';
import {
  accept,
  payDon,
  choiceCards,
  choose,
  chooseNone,
  cp,
  endTurn,
  expectMain,
  LD,
  mine,
  playCard,
  SC2,
  settleYes,
  WB,
} from './kit-op17a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ACE = 'OP17-013';
const handCost = (g: TestGame) => g.card(g.find('p1', 'hand', ACE)).cost;
const playable = (g: TestGame) => isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', ACE) });

describe('OP17-013 Portgas.D.Ace: in hand, -2 cost while the opponent has a Character with 10000 power or more', () => {
  const withActive = (active: number, opp: string[], own: string[] = []) =>
    mine(
      LD.luffy,
      { hand: [ACE], characters: own, costArea: { active, rested: 0 } },
      { characters: opp },
    );

  it('with an opposing 10000-power Character it costs 4 and is playable with 4 active DON!!', () => {
    const g = withActive(4, [SC2.shanksP016]);
    expect(handCost(g)).toBe(4);
    expect(playable(g)).toBe(true);
  });

  it('boundary: 9000 power is not enough (cost 6, 4 DON!! cannot pay)', () => {
    const g = withActive(4, [WB.littleOars]);
    expect(handCost(g)).toBe(6);
    expect(playable(g)).toBe(false);
  });

  it('the reduction is exactly 2: 3 active DON!! is not enough', () => {
    const g = withActive(3, [SC2.shanksP016]);
    expect(playable(g)).toBe(false);
  });

  it('power is the CURRENT power: an opposing 10000-power Character reduced to 5000 (OP05-077 Gamma Knife -5000) no longer reduces the cost', () => {
    const g = mine(
      LD.luffy,
      { hand: [ACE, SC2.gammaKnife], costArea: { active: 10, rested: 0 } },
      { characters: [SC2.shanksP016] },
    );
    expect(handCost(g)).toBe(4);
    playCard(g, SC2.gammaKnife);
    accept(g);
    payDon(g, 1);
    choose(g, [g.find('p2', 'characters', SC2.shanksP016)]);
    settleYes(g, 'p1');
    expect(handCost(g)).toBe(6);
  });

  it('only an OPPOSING Character counts', () => {
    const g = withActive(4, [], [SC2.shanksP016]);
    expect(handCost(g)).toBe(6);
  });

  it('no opposing Characters: full cost 6', () => {
    expect(handCost(withActive(6, []))).toBe(6);
  });
});

describe('OP17-013 Portgas.D.Ace: [On Play] [Edward.Newgate] Leader: opposing rested Character -6000 this turn', () => {
  function play(
    leader: string,
    opp: (string | { card: string; rested: boolean })[] = [{ card: WB.thatch, rested: true }],
  ) {
    const g = mine(leader, { hand: [ACE] }, { characters: opp });
    playCard(g, ACE);
    return g;
  }

  it('with an [Edward.Newgate] Leader the chosen rested 8000 Character drops to 2000', () => {
    const g = play(LD.newgate);
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expectMain(g);
    expect(cp(g, 'p2', WB.thatch)).toBe(2000);
  });

  it('any Leader named [Edward.Newgate] counts (OP02-001)', () => {
    const g = play(LD.newgate6);
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expect(cp(g, 'p2', WB.thatch)).toBe(2000);
  });

  it('CR 8-3-3: a {Land of Wano} Leader does NOT qualify here (unlike Izo): nothing is asked', () => {
    const g = play(LD.wano);
    expectMain(g);
    expect(cp(g, 'p2', WB.thatch)).toBe(8000);
  });

  it('CR 8-3-3: any other Leader: nothing happens', () => {
    const g = play(LD.luffy);
    expectMain(g);
    expect(cp(g, 'p2', WB.thatch)).toBe(8000);
  });

  it('only RESTED opposing Characters are candidates', () => {
    const g = play(LD.newgate, [{ card: WB.thatch, rested: true }, WB.kingdew]);
    expect(choiceCards(g)).toEqual([WB.thatch]);
  });

  it('with only active opposing Characters nothing happens', () => {
    const g = play(LD.newgate, [WB.thatch]);
    settleYes(g, 'p1');
    expect(cp(g, 'p2', WB.thatch)).toBe(8000);
  });

  it('CR 8-4-4-1 "up to 1": may choose nobody', () => {
    const g = play(LD.newgate);
    chooseNone(g);
    expect(cp(g, 'p2', WB.thatch)).toBe(8000);
  });

  it('RL-09: the -6000 ends with the turn', () => {
    const g = play(LD.newgate);
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    endTurn(g);
    expect(cp(g, 'p2', WB.thatch)).toBe(8000);
  });
});
