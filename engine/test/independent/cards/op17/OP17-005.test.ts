/**
 * OP17-005 Edward.Newgate (Character, Red, cost 10, 12000, no Counter, {The Four Emperors}/
 * {Whitebeard Pirates}, Special).
 *
 * Card text: "If your opponent has a Character with 10000 power or more, give this card in your hand -4
 * cost.
 * [On Play] Your monocolored Leader's base power becomes 8000 until the end of your opponent's next
 * End Phase."
 *
 * Rules: CR 1-3-6-2 (cost reductions), CR 4-9-2 / 4-9-2-1 ("base" power; the highest base applies),
 * RL-33, RL-11 ("until the end of your opponent's next End Phase"), CR 3-1-6 (a card that changes
 * area is a new card).
 */
import { describe, expect, it } from 'vitest';
import { isLegal } from '../../helpers.ts';
import {
  accept,
  settleYes,
  choose,
  payDon,
  endTurn,
  expectMain,
  LD,
  lp,
  mine,
  playCard,
  SC2,
  WB,
} from './kit-op17a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const NEWGATE = 'OP17-005';

function withHand(leader: string, active: number, opp: string[], leaderDon = 0) {
  return mine(
    leaderDon ? { card: leader, don: leaderDon } : leader,
    { hand: [NEWGATE], costArea: { active: Math.min(active, 10 - leaderDon), rested: 0 } },
    { characters: opp },
  );
}
const handCost = (g: TestGame) => g.card(g.find('p1', 'hand', NEWGATE)).cost;
const playable = (g: TestGame) =>
  isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', NEWGATE) });

describe('OP17-005 Edward.Newgate: in hand, -4 cost while the opponent has a Character with 10000 power or more', () => {
  it('with an opposing 10000-power Character the card costs 6 in hand and is playable with 6 active DON!!', () => {
    const g = withHand(LD.luffy, 6, [SC2.shanksP016]);
    expect(handCost(g)).toBe(6);
    expect(playable(g)).toBe(true);
  });

  it('boundary: a 9000-power opposing Character is not enough (cost stays 10, 6 DON!! cannot pay)', () => {
    const g = withHand(LD.luffy, 6, [WB.littleOars]);
    expect(handCost(g)).toBe(10);
    expect(playable(g)).toBe(false);
  });

  it('a 12000-power opposing Character also counts', () => {
    const g = withHand(LD.luffy, 6, [SC2.xebec]);
    expect(handCost(g)).toBe(6);
    expect(playable(g)).toBe(true);
  });

  it('no opposing Characters: full cost 10', () => {
    const g = withHand(LD.luffy, 10, []);
    expect(handCost(g)).toBe(10);
  });

  it('the Character must be the opponent’s: my own 10000-power Character does not reduce the cost', () => {
    const g = mine(LD.luffy, {
      hand: [NEWGATE],
      characters: [SC2.shanksP016],
      costArea: { active: 6, rested: 0 },
    });
    expect(handCost(g)).toBe(10);
    expect(playable(g)).toBe(false);
  });

  it('the reduction is exactly 4: 5 active DON!! is not enough even with the reduction', () => {
    const g = withHand(LD.luffy, 5, [SC2.shanksP016]);
    expect(playable(g)).toBe(false);
  });

  it('the reduction applies to this card only: other cards in hand keep their cost', () => {
    const g = mine(LD.luffy, { hand: [NEWGATE, WB.jil] }, { characters: [SC2.shanksP016] });
    expect(g.card(g.find('p1', 'hand', WB.jil)).cost).toBe(4);
  });

  it('CR 4-9 / power is the CURRENT power: an opposing 10000-power Character reduced to 5000 by an effect (OP05-077 Gamma Knife -5000) no longer reduces the cost', () => {
    const g = mine(
      LD.luffy,
      { hand: [NEWGATE, SC2.gammaKnife], costArea: { active: 10, rested: 0 } },
      { characters: [SC2.shanksP016] },
    );
    expect(handCost(g)).toBe(6);
    playCard(g, SC2.gammaKnife);
    accept(g);
    payDon(g, 1);
    choose(g, [g.find('p2', 'characters', SC2.shanksP016)]);
    settleYes(g, 'p1');
    expect(g.power(g.find('p2', 'characters', SC2.shanksP016))).toBe(5000);
    expect(handCost(g)).toBe(10);
  });

  it('CR 3-1-6: the reduction is for the card IN HAND only: once on the field its cost is the printed 10', () => {
    const g = withHand(LD.luffy, 10, [SC2.shanksP016]);
    playCard(g, NEWGATE);
    expect(g.card(g.find('p1', 'characters', NEWGATE)).cost).toBe(10);
  });

  it('paying 6 DON!! really plays the card: 6 rested, 4 still active', () => {
    const g = withHand(LD.luffy, 10, [SC2.shanksP016]);
    playCard(g, NEWGATE);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([NEWGATE]);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });
});

describe('OP17-005 Edward.Newgate: [On Play] monocolored Leader base power becomes 8000 until the end of the opponent’s next End Phase', () => {
  function played(leader: string, opp: string[] = [], leaderDon = 0) {
    const g = withHand(leader, 10, opp, leaderDon);
    playCard(g, NEWGATE);
    return g;
  }

  it('a monocolored Red Leader (5000) becomes 8000', () => {
    const g = played(LD.luffy, [SC2.shanksP016]);
    expectMain(g);
    expect(lp(g, 'p1')).toBe(8000);
  });

  it('works with the Red [Edward.Newgate] Leader too', () => {
    const g = played(LD.newgate, [SC2.shanksP016]);
    expect(lp(g, 'p1')).toBe(8000);
  });

  it('a multicolored Leader (Green/Red) is not changed', () => {
    const g = played(LD.law, [SC2.shanksP016]);
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('a monocolored Leader of another colour (Blue) is changed as well (any single colour)', () => {
    const g = played(LD.croc, [SC2.shanksP016]);
    expect(lp(g, 'p1')).toBe(8000);
  });

  it('it is the BASE power: a DON!! given to the Leader still adds +1000 (9000)', () => {
    const g = played(LD.luffy, [SC2.shanksP016], 1);
    expect(lp(g, 'p1')).toBe(9000);
  });

  it('RL-11: it lasts through my End Phase and the opponent’s whole turn, and ends at the end of the opponent’s End Phase', () => {
    const g = played(LD.luffy, [SC2.shanksP016]);
    endTurn(g);
    expectMain(g, 'p2');
    expect(lp(g, 'p1')).toBe(8000);
    endTurn(g);
    expectMain(g, 'p1');
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('only my own Leader changes: the opposing Leader stays at its power', () => {
    const g = played(LD.luffy, [SC2.shanksP016]);
    expect(lp(g, 'p2')).toBe(5000);
  });

  it('with the cost not reduced (full 10) the On Play works the same', () => {
    const g = played(LD.luffy, []);
    expect(lp(g, 'p1')).toBe(8000);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });
});
