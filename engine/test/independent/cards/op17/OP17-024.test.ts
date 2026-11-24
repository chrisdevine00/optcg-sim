/**
 * OP17-024 Howling Gab (Character, Green, cost 8, 8000, Counter +1000, {Red-Haired Pirates}, Special,
 * [Banish]).
 *
 * Card text: "[Banish] (When this card deals damage, the target card is trashed without activating its
 * Trigger.) [On Play] Rest up to 1 of your opponent's Characters."
 *
 * Rules: CR 10-1-3 ([Banish]: the Life card is trashed, its [Trigger] does not activate), CR 8-4-4-1
 * ("up to"), RD 96.
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  attack,
  BLUE,
  choices,
  choose,
  chooseNone,
  decider,
  expectMain,
  hand,
  isRested,
  kind,
  LD,
  mine,
  noDefence,
  passBlock,
  playCard,
  reachablePickSets,
  SC2,
  trash,
  WB,
} from './kit-op17a.ts';
import { TRIGGER_SPEED } from '../../helpers.ts';

const GAB = 'OP17-024';

function play(opp: (string | { card: string; rested: boolean })[], leader: string = LD.shanks) {
  const g = mine(leader, { hand: [GAB] }, { characters: opp });
  playCard(g, GAB);
  return g;
}

describe('OP17-024 Howling Gab: [On Play] rest up to 1 of the opponent’s Characters', () => {
  it('rests the chosen active Character', () => {
    const g = play([WB.kingdew, WB.thatch]);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p2', 'characters', WB.kingdew)]);
    expectMain(g);
    expect(isRested(g, 'p2', WB.kingdew)).toBe(true);
    expect(isRested(g, 'p2', WB.thatch)).toBe(false);
  });

  it('CR 8-4-4-1 "up to 1": may rest nobody', () => {
    const g = play([WB.kingdew]);
    chooseNone(g);
    expect(isRested(g, 'p2', WB.kingdew)).toBe(false);
  });

  it('at most one Character is rested', () => {
    const g = play([WB.kingdew, WB.thatch]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('there is no cost or power restriction: a 12000-power cost-10 Character can be rested', () => {
    const g = play([SC2.xebec]);
    choose(g, [g.find('p2', 'characters', SC2.xebec)]);
    expect(isRested(g, 'p2', SC2.xebec)).toBe(true);
  });

  it('only opposing Characters: the opposing Leader is not a candidate', () => {
    const g = play([WB.kingdew]);
    expect(choices(g)).toEqual([g.find('p2', 'characters', WB.kingdew)]);
  });

  it('works with any Leader (no condition): a Leader of another type still rests a Character', () => {
    const g = play([WB.kingdew], LD.luffy);
    choose(g, [g.find('p2', 'characters', WB.kingdew)]);
    expect(isRested(g, 'p2', WB.kingdew)).toBe(true);
  });

  it('with no opposing Character nothing is asked', () => {
    const g = play([]);
    expectMain(g);
  });
});

describe('OP17-024 Howling Gab: [Banish]', () => {
  it('the keyword is on the card', () => {
    const g = mine(LD.shanks, { characters: [GAB] });
    expect(g.card(g.find('p1', 'characters', GAB)).keywords).toContain('Banish');
  });

  it('a Life card hit by Gab is trashed, not added to hand, and its [Trigger] is not offered', () => {
    const g = mine(LD.shanks, { characters: [GAB] }, { life: [TRIGGER_SPEED, ...fill(BLUE, 3)] });
    attack(g, g.find('p1', 'characters', GAB), g.leader('p2'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    expect(decider(g)).toBe('p1');
    expectMain(g);
    expect(g.life('p2')).toBe(3);
    expect(trash(g, 'p2')).toEqual([TRIGGER_SPEED]);
    expect(hand(g, 'p2')).toEqual([]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('control: a non-Banish 8000 attacker lets the same card’s [Trigger] be offered', () => {
    const g = mine(
      LD.shanks,
      { characters: [WB.thatch] },
      { life: [TRIGGER_SPEED, ...fill(BLUE, 3)] },
    );
    attack(g, g.find('p1', 'characters', WB.thatch), g.leader('p2'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    expect(decider(g)).toBe('p2');
    expect(kind(g)).toBe('trigger');
    void noDefence;
  });
});
