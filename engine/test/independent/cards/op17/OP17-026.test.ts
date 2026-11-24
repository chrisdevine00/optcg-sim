/**
 * OP17-026 Fugar (Character, Green, cost 1, 2000, Counter +2000, {Red-Haired Pirates Allies}, Slash).
 *
 * Card text: "[When Attacking] If your Leader has the {Red-Haired Pirates} type, rest up to 1 of your
 * opponent's Characters with a cost of 2 or less.
 * [On K.O.] Draw 1 card."
 *
 * Rules: CR 10-2-5 ([When Attacking]), CR 8-3-3 (text after a failed "if" does not resolve), CR 8-4-4-1
 * ("up to"), CR 10-2-17 ([On K.O.]), CR 4-5-3 (draw).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  attack,
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  decider,
  deck,
  expectMain,
  hand,
  isRested,
  kind,
  LD,
  mine,
  noDefence,
  opponentKOs,
  reachablePickSets,
  SC2,
  theirs,
  VAN,
  WB,
} from './kit-op17a.ts';

const FUGAR = 'OP17-026';

function swing(leader: string, opp: string[]) {
  const g = mine(leader, { characters: [FUGAR] }, { characters: opp });
  attack(g, g.find('p1', 'characters', FUGAR), g.leader('p2'));
  return g;
}

describe('OP17-026 Fugar: [When Attacking] {Red-Haired Pirates} Leader: rest up to 1 opposing Character with cost 2 or less', () => {
  it('rests the chosen cost-2-or-less Character', () => {
    const g = swing(LD.shanks, [SC2.cobra0, SC2.komachiyo]);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p2', 'characters', SC2.cobra0)]);
    expect(isRested(g, 'p2', SC2.cobra0)).toBe(true);
    expect(isRested(g, 'p2', SC2.komachiyo)).toBe(false);
    expect(decider(g)).toBe('p2');
  });

  it('boundary: cost 2 and 1 are candidates, cost 3 is not', () => {
    const g = swing(LD.shanks, [SC2.cobra0, SC2.komachiyo, WB.namule]);
    expect(choiceCards(g)).toEqual([SC2.cobra0, SC2.komachiyo].sort());
  });

  it('a different {Red-Haired Pirates} Leader (ST05-001, also {FILM}/{The Four Emperors}) works', () => {
    const g = swing(LD.shanksP, [SC2.cobra0]);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p2', 'characters', SC2.cobra0)]);
    expect(isRested(g, 'p2', SC2.cobra0)).toBe(true);
  });

  it('CR 8-3-3: without a {Red-Haired Pirates} Leader nothing is asked and nothing is rested', () => {
    const g = swing(LD.luffy, [SC2.cobra0]);
    expect(decider(g)).toBe('p2');
    expect(kind(g)).toBe('block');
    expect(isRested(g, 'p2', SC2.cobra0)).toBe(false);
  });

  it('CR 8-4-4-1 "up to 1": may rest nobody', () => {
    const g = swing(LD.shanks, [SC2.cobra0]);
    chooseNone(g);
    expect(isRested(g, 'p2', SC2.cobra0)).toBe(false);
    expect(kind(g)).toBe('block');
  });

  it('at most one Character is rested', () => {
    const g = swing(LD.shanks, [SC2.cobra0, SC2.komachiyo]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with no cost-2-or-less Character the attack goes straight on', () => {
    const g = swing(LD.shanks, [WB.kingdew]);
    expect(decider(g)).toBe('p2');
    expect(isRested(g, 'p2', WB.kingdew)).toBe(false);
  });

  it('the Character rested by the effect is still rested after the battle', () => {
    const g = swing(LD.shanks, [SC2.cobra0]);
    choose(g, [g.find('p2', 'characters', SC2.cobra0)]);
    noDefence(g);
    expect(isRested(g, 'p2', SC2.cobra0)).toBe(true);
  });
});

describe('OP17-026 Fugar: [On K.O.] draw 1 card', () => {
  it('K.O.’d in battle: I draw 1 card', () => {
    const g = theirs(
      LD.shanks,
      {
        characters: [{ card: FUGAR, rested: true }],
        hand: [VAN.gordon],
        deck: [WB.jil, ...fill(BLUE, 10)],
        life: fill(BLUE, 4),
      },
      { characters: [WB.kingdew] },
    );
    attack(g, g.find('p2', 'characters', WB.kingdew), g.find('p1', 'characters', FUGAR));
    noDefence(g);
    expectMain(g, 'p2');
    expect(hand(g)).toEqual([WB.jil, VAN.gordon].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('K.O.’d by an opponent’s effect: I draw 1 card as well', () => {
    const g = theirs(
      LD.shanks,
      { characters: [FUGAR], deck: [WB.jil, ...fill(BLUE, 10)], life: fill(BLUE, 4) },
      { hand: [SC2.lightning] },
    );
    opponentKOs(g, g.find('p1', 'characters', FUGAR));
    expectMain(g, 'p2');
    expect(hand(g)).toEqual([WB.jil]);
  });

  it('it needs no Leader condition: with any Leader the [On K.O.] draws', () => {
    const g = theirs(
      LD.luffy,
      {
        characters: [{ card: FUGAR, rested: true }],
        deck: [WB.jil, ...fill(BLUE, 10)],
        life: fill(BLUE, 4),
      },
      { characters: [WB.kingdew] },
    );
    attack(g, g.find('p2', 'characters', WB.kingdew), g.find('p1', 'characters', FUGAR));
    noDefence(g);
    expect(hand(g)).toEqual([WB.jil]);
  });
});
