/**
 * OP17-027 Benn.Beckman (Character, Green, cost 7, 9000, no Counter, {Red-Haired Pirates}, Ranged,
 * [Rush: Character]).
 *
 * Card text: "[Rush: Character] (This card can attack Characters on the turn in which it is played.)
 * [On Play] If your Leader has the {Red-Haired Pirates} type, draw 1 card and rest up to 2 of your
 * opponent's Characters."
 *
 * Rules: CR 10-1-6-1 ([Rush: Character]), CR 8-3-3 (text after a failed "if" does not resolve), CR 4-5-3
 * (draw), CR 8-4-4-1 ("up to"), CR 7-1-1-2 (only rested Characters can be attacked).
 */
import { describe, expect, it } from 'vitest';
import { attackTargets, fill } from '../../helpers.ts';
import {
  attackers,
  BLUE,
  choiceCards,
  choices,
  choose,
  chooseNone,
  deck,
  expectMain,
  hand,
  isRested,
  kind,
  LD,
  mine,
  playCard,
  reachablePickSets,
  SC2,
  VAN,
  WB,
} from './kit-op17a.ts';

const BECKMAN = 'OP17-027';

function play(
  leader: string,
  opp: (string | { card: string; rested: boolean })[] = [WB.kingdew, WB.thatch],
  top: string[] = [WB.jil],
) {
  const g = mine(
    leader,
    { hand: [BECKMAN], deck: [...top, ...fill(BLUE, 12)] },
    { characters: opp },
  );
  playCard(g, BECKMAN);
  return g;
}

describe('OP17-027 Benn.Beckman: [On Play] {Red-Haired Pirates} Leader: draw 1 card and rest up to 2 opposing Characters', () => {
  it('draws 1 card (the top card) and rests the two chosen Characters', () => {
    const g = play(LD.shanks);
    expect(hand(g)).toEqual([WB.jil]);
    expect(deck(g)).toHaveLength(12);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p2', 'characters', WB.kingdew), g.find('p2', 'characters', WB.thatch)]);
    expectMain(g);
    expect(isRested(g, 'p2', WB.kingdew)).toBe(true);
    expect(isRested(g, 'p2', WB.thatch)).toBe(true);
  });

  it('"up to 2": may rest just one', () => {
    const g = play(LD.shanks);
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expectMain(g);
    expect(isRested(g, 'p2', WB.thatch)).toBe(true);
    expect(isRested(g, 'p2', WB.kingdew)).toBe(false);
  });

  it('"up to 2": may rest nobody (the card is still drawn)', () => {
    const g = play(LD.shanks);
    chooseNone(g);
    expect(hand(g)).toEqual([WB.jil]);
    expect(isRested(g, 'p2', WB.kingdew)).toBe(false);
  });

  it('never more than 2 even with three candidates', () => {
    const g = play(LD.shanks, [WB.kingdew, WB.thatch, SC2.komachiyo]);
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it('there is no cost restriction: a cost-10 Character can be rested', () => {
    const g = play(LD.shanks, [SC2.xebec, WB.kingdew]);
    expect(choiceCards(g)).toEqual([WB.kingdew, SC2.xebec].sort());
  });

  it('only opposing Characters are candidates (not the Leader)', () => {
    const g = play(LD.shanks, [WB.kingdew]);
    expect(choices(g)).toEqual([g.find('p2', 'characters', WB.kingdew)]);
  });

  it('with no opposing Character the card is still drawn and nothing is asked', () => {
    const g = play(LD.shanks, []);
    expectMain(g);
    expect(hand(g)).toEqual([WB.jil]);
  });

  it('CR 8-3-3: without a {Red-Haired Pirates} Leader nothing is drawn and nothing is rested', () => {
    const g = play(LD.luffy);
    expectMain(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(13);
    expect(isRested(g, 'p2', WB.kingdew)).toBe(false);
  });

  it('a different {Red-Haired Pirates} Leader (ST05-001) works', () => {
    const g = play(LD.shanksP);
    expect(hand(g)).toEqual([WB.jil]);
    chooseNone(g);
  });
});

describe('OP17-027 Benn.Beckman: [Rush: Character]', () => {
  it('the turn it is played it can attack a rested opposing Character but not the Leader', () => {
    const g = play(LD.luffy, [{ card: WB.thatch, rested: true }]);
    const beckman = g.find('p1', 'characters', BECKMAN);
    expect(attackers(g)).toContain(beckman);
    expect(attackTargets(g, beckman)).toEqual([g.find('p2', 'characters', WB.thatch)]);
  });

  it('synergy: the Characters it rests become attackable the same turn', () => {
    const g = play(LD.shanks, [WB.kingdew]);
    choose(g, [g.find('p2', 'characters', WB.kingdew)]);
    const beckman = g.find('p1', 'characters', BECKMAN);
    expect(attackTargets(g, beckman)).toEqual([g.find('p2', 'characters', WB.kingdew)]);
  });

  it('control: a Character without Rush cannot attack on the turn it is played', () => {
    const g = mine(
      LD.luffy,
      { hand: [VAN.mohji] },
      { characters: [{ card: WB.thatch, rested: true }] },
    );
    playCard(g, VAN.mohji);
    expect(attackers(g)).not.toContain(g.find('p1', 'characters', VAN.mohji));
  });
});
