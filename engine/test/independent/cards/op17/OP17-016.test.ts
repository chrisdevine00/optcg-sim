/**
 * OP17-016 Rakuyo (Character, Red, cost 3, 2000, Counter +2000, {Whitebeard Pirates}, Strike).
 *
 * Card text: "[On Play] K.O. up to 2 of your opponent's Characters with 2000 base power or less."
 *
 * Rules: CR 10-2-1 (K.O.), CR 4-9-2 (base power: printed), CR 8-4-4-1 ("up to"; choose as many as
 * possible up to the number, 0 allowed).
 */
import { describe, expect, it } from 'vitest';
import {
  charsOf,
  choiceCards,
  choose,
  chooseNone,
  expectMain,
  LD,
  mine,
  playCard,
  reachablePickSets,
  SC2,
  trash,
  WB,
} from './kit-op17a.ts';

const RAKUYO = 'OP17-016';

function play(opp: (string | { card: string; rested: boolean })[], own: string[] = []) {
  const g = mine(LD.luffy, { hand: [RAKUYO], characters: own }, { characters: opp });
  playCard(g, RAKUYO);
  return g;
}

describe('OP17-016 Rakuyo: [On Play] K.O. up to 2 opposing Characters with 2000 base power or less', () => {
  it('K.O.s two chosen 2000-or-less Characters', () => {
    const g = play([SC2.dadan2000, SC2.cobra0]);
    choose(g, [g.find('p2', 'characters', SC2.dadan2000), g.find('p2', 'characters', SC2.cobra0)]);
    expectMain(g);
    expect(charsOf(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([SC2.cobra0, SC2.dadan2000].sort());
  });

  it('"up to 2": may K.O. just one', () => {
    const g = play([SC2.dadan2000, SC2.cobra0]);
    choose(g, [g.find('p2', 'characters', SC2.cobra0)]);
    expectMain(g);
    expect(charsOf(g, 'p2')).toEqual([SC2.dadan2000]);
  });

  it('"up to 2": may K.O. nobody', () => {
    const g = play([SC2.dadan2000, SC2.cobra0]);
    chooseNone(g);
    expect(charsOf(g, 'p2')).toEqual([SC2.cobra0, SC2.dadan2000].sort());
  });

  it('never more than 2 even with three candidates', () => {
    const g = play([SC2.dadan2000, SC2.cobra0, SC2.whiteyBay2000]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...reachablePickSets(g)].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(
      true,
    );
  });

  it('with three candidates the player chooses which two (the third survives)', () => {
    const g = play([SC2.dadan2000, SC2.cobra0, SC2.whiteyBay2000]);
    choose(g, [
      g.find('p2', 'characters', SC2.dadan2000),
      g.find('p2', 'characters', SC2.whiteyBay2000),
    ]);
    expectMain(g);
    expect(charsOf(g, 'p2')).toEqual([SC2.cobra0]);
  });

  it('boundary: 3000 base power is not a candidate; 2000 and 0 are', () => {
    const g = play([SC2.dadan2000, SC2.cobra0, SC2.komachiyo]);
    expect(choiceCards(g)).toEqual([SC2.cobra0, SC2.dadan2000].sort());
  });

  it('rested and active Characters are both candidates', () => {
    const g = play([{ card: SC2.dadan2000, rested: true }, SC2.cobra0]);
    expect(choiceCards(g)).toEqual([SC2.cobra0, SC2.dadan2000].sort());
  });

  it('only the opponent’s Characters: my own 2000-power Character is not offered', () => {
    const g = play([SC2.dadan2000], [SC2.whiteyBay2000]);
    expect(choiceCards(g)).toEqual([SC2.dadan2000]);
  });

  it('with only one candidate it K.O.s that one and asks nothing more', () => {
    const g = play([SC2.dadan2000, WB.kingdew]);
    choose(g, [g.find('p2', 'characters', SC2.dadan2000)]);
    expectMain(g);
    expect(charsOf(g, 'p2')).toEqual([WB.kingdew]);
  });
});
