/**
 * OP17-028 Bonk Punch & Monster (Character, Green, cost 4, 3000, Counter +1000, {Animal}/{Red-Haired
 * Pirates}, Strike, [Blocker]).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the new
 * target of the attack.)
 * [On Play] K.O. up to 1 of your opponent's rested Characters with a cost of 6 or less."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 10-2-1 (K.O.), CR 8-4-4-1 ("up to"), RL-17 (rested Characters).
 */
import { describe, expect, it } from 'vitest';
import { blockers } from '../../helpers.ts';
import {
  attack,
  charsOf,
  choiceCards,
  choices,
  choose,
  chooseNone,
  expectMain,
  LD,
  mine,
  playCard,
  reachablePickSets,
  SC2,
  theirs,
  trash,
  WB,
} from './kit-op17a.ts';

const BONK = 'OP17-028';

function play(opp: (string | { card: string; rested: boolean })[], leader: string = LD.luffy) {
  const g = mine(leader, { hand: [BONK] }, { characters: opp });
  playCard(g, BONK);
  return g;
}

describe('OP17-028 Bonk Punch & Monster: [On Play] K.O. up to 1 opposing rested Character with a cost of 6 or less', () => {
  it('K.O.s the chosen rested cost-6 Character (it goes to the trash)', () => {
    const g = play([{ card: WB.thatch, rested: true }]);
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expectMain(g);
    expect(charsOf(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([WB.thatch]);
  });

  it('boundary: cost 6 is a candidate, cost 7 is not', () => {
    const g = play([
      { card: WB.thatch, rested: true },
      { card: SC2.urashima, rested: true },
    ]);
    expect(choiceCards(g)).toEqual([WB.thatch]);
  });

  it('only RESTED Characters: an active cost-5 Character is not a candidate', () => {
    const g = play([{ card: WB.thatch, rested: true }, WB.kingdew]);
    expect(choices(g)).toEqual([g.find('p2', 'characters', WB.thatch)]);
  });

  it('CR 8-4-4-1 "up to 1": may K.O. nobody', () => {
    const g = play([{ card: WB.thatch, rested: true }]);
    chooseNone(g);
    expect(charsOf(g, 'p2')).toEqual([WB.thatch]);
  });

  it('at most one Character is K.O.’d with two candidates', () => {
    const g = play([
      { card: WB.thatch, rested: true },
      { card: WB.kingdew, rested: true },
    ]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    choose(g, [g.find('p2', 'characters', WB.kingdew)]);
    expectMain(g);
    expect(charsOf(g, 'p2')).toEqual([WB.thatch]);
  });

  it('with no rested cost-6-or-less Character nothing is asked and nothing is K.O.’d', () => {
    const g = play([WB.kingdew, { card: SC2.urashima, rested: true }]);
    expectMain(g);
    expect(charsOf(g, 'p2')).toEqual([WB.kingdew, SC2.urashima].sort());
  });

  it('there is no Leader condition: a Leader of another type works', () => {
    const g = play([{ card: WB.thatch, rested: true }], LD.shanks);
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expect(charsOf(g, 'p2')).toEqual([]);
  });
});

describe('OP17-028 Bonk Punch & Monster: [Blocker]', () => {
  it('can block an attack on my Leader', () => {
    const g = theirs(LD.luffy, { characters: [BONK] }, { characters: [WB.kingdew] });
    attack(g, g.find('p2', 'characters', WB.kingdew), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', BONK)]);
  });

  it('a rested Bonk Punch cannot block', () => {
    const g = theirs(
      LD.luffy,
      { characters: [{ card: BONK, rested: true }] },
      { characters: [WB.kingdew] },
    );
    attack(g, g.find('p2', 'characters', WB.kingdew), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });
});
