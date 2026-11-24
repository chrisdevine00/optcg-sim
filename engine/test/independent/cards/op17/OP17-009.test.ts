/**
 * OP17-009 Haruta (Character, Red, cost 4, 5000, Counter +1000, {Whitebeard Pirates}, Slash).
 *
 * Card text: "[Opponent's Turn] This Character gains +3000 power.
 * [On Play] K.O. up to 1 of your opponent's Characters with 2000 base power or less."
 *
 * Rules: CR 8-3-2-5 ([Opponent's Turn]), CR 4-9-2 ("base" power is the printed one: power changes do
 * not matter), CR 10-2-1-1 (K.O.), CR 8-4-4-1 ("up to"), RL-09 ("during this turn").
 */
import { describe, expect, it } from 'vitest';
import {
  charsOf,
  choiceCards,
  choices,
  choose,
  chooseNone,
  cp,
  endTurn,
  expectMain,
  kind,
  LD,
  mine,
  playCard,
  reachablePickSets,
  SC2,
  theirs,
  trash,
  VAN,
  WB,
} from './kit-op17a.ts';

const HARUTA = 'OP17-009';

function play(opp: (string | { card: string; rested?: boolean })[], own: string[] = []) {
  const g = mine(LD.luffy, { hand: [HARUTA], characters: own }, { characters: opp });
  playCard(g, HARUTA);
  return g;
}

describe('OP17-009 Haruta: [Opponent’s Turn] +3000 power', () => {
  it('is 5000 on my turn', () => {
    const g = mine(LD.luffy, { characters: [HARUTA] });
    expect(cp(g, 'p1', HARUTA)).toBe(5000);
  });

  it('is 8000 on the opponent’s turn', () => {
    const g = theirs(LD.luffy, { characters: [HARUTA] }, {});
    expect(cp(g, 'p1', HARUTA)).toBe(8000);
  });
});

describe('OP17-009 Haruta: [On Play] K.O. up to 1 opposing Character with 2000 base power or less', () => {
  it('K.O.s the chosen 2000-power Character (it goes to the trash)', () => {
    const g = play([SC2.dadan2000]);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p2', 'characters', SC2.dadan2000)]);
    expectMain(g);
    expect(charsOf(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([SC2.dadan2000]);
  });

  it('boundary: 2000 and 0 base power are offered, 3000 is not', () => {
    const g = play([SC2.dadan2000, SC2.cobra0, SC2.komachiyo]);
    expect(choiceCards(g)).toEqual([SC2.cobra0, SC2.dadan2000].sort());
  });

  it('rested and active Characters are both candidates', () => {
    const g = play([{ card: SC2.dadan2000, rested: true }, SC2.cobra0]);
    expect(choiceCards(g)).toEqual([SC2.cobra0, SC2.dadan2000].sort());
  });

  it('CR 4-9-2: it is BASE power: a 3000 Character reduced to 0 by an effect is not a candidate', () => {
    // ST21-017 Gum-Gum Mole Pistol: -5000 to a Character (its K.O. part needs a 6000+ Character of mine).
    const g = mine(LD.luffy, { hand: [SC2.molePistol, HARUTA] }, { characters: [SC2.komachiyo] });
    playCard(g, SC2.molePistol);
    choose(g, [g.find('p2', 'characters', SC2.komachiyo)]);
    expect(cp(g, 'p2', SC2.komachiyo)).toBeLessThanOrEqual(0);
    playCard(g, HARUTA);
    expectMain(g);
    expect(charsOf(g, 'p2')).toEqual([SC2.komachiyo]);
  });

  it('only the opponent’s Characters: my own 2000-power Character and the opposing Leader are not offered', () => {
    const g = play([SC2.dadan2000], [SC2.whiteyBay2000]);
    expect(choices(g)).toEqual([g.find('p2', 'characters', SC2.dadan2000)]);
  });

  it('CR 8-4-4-1 "up to 1": may K.O. nobody', () => {
    const g = play([SC2.dadan2000]);
    chooseNone(g);
    expect(charsOf(g, 'p2')).toEqual([SC2.dadan2000]);
  });

  it('at most one Character is K.O.’d even when two qualify', () => {
    const g = play([SC2.dadan2000, SC2.cobra0]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    choose(g, [g.find('p2', 'characters', SC2.cobra0)]);
    expectMain(g);
    expect(charsOf(g, 'p2')).toEqual([SC2.dadan2000]);
  });

  it('no candidate (only a 3000 and a 7000 Character): nothing is asked and nothing is K.O.’d', () => {
    const g = play([SC2.komachiyo, WB.kingdew]);
    expectMain(g);
    expect(charsOf(g, 'p2')).toEqual([WB.kingdew, SC2.komachiyo].sort());
  });

  it('the +3000 does not matter on my turn: Haruta itself stays on the field and 5000', () => {
    const g = play([SC2.dadan2000]);
    chooseNone(g);
    expect(cp(g, 'p1', HARUTA)).toBe(5000);
    endTurn(g);
    expect(cp(g, 'p1', HARUTA)).toBe(8000);
    void VAN;
  });
});
