/**
 * EB05-018 Rebecca (Character, Green, cost 1, 1000, Counter +2000, {Dressrosa}, Slash).
 *
 * Card text: "[On Play] Up to 1 of your opponent's rested Characters with a cost of 6 or less will not
 * become active in your opponent's next Refresh Phase."
 *
 * Rules: CR 6-2-4 (Refresh sets rested cards active), CR 8-4-4-1 ("up to"), RL-11 (durations that
 * reach into the next turn), M6b-Q48-style: "next Refresh Phase" is the opponent's very next one.
 */
import { describe, expect, it } from 'vitest';
import { endTurn, fill } from '../../helpers.ts';
import {
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  EL,
  kind,
  mine,
  offeredInstance,
  playCard,
  reachablePickSets,
  settleYes,
  VAN,
} from './kit-eb05a.ts';

const REBECCA = 'EB05-018';
const rested = (card: string) => ({ card, rested: true });

function played(opp: (string | { card: string; rested?: boolean })[]) {
  const g = mine(EL.croc, { hand: [REBECCA], deck: fill(BLUE, 10) }, { characters: opp });
  playCard(g, REBECCA);
  return g;
}
const isRested = (g: ReturnType<typeof played>, card: string) =>
  g.card(g.find('p2', 'characters', card)).rested;

describe('EB05-018 Rebecca: [On Play] a rested opposing Character with cost 6 or less will not become active next Refresh', () => {
  const OPP = [rested(VAN.thatch), rested(VAN.marco), rested(VAN.littleOars), VAN.hajrudin];

  it('only rested Characters with cost 6 or less are candidates (cost 6 yes; cost 7 and active ones no)', () => {
    const g = played(OPP);
    expect(choiceCards(g)).toEqual([VAN.marco, VAN.thatch].sort());
  });

  it('the chosen Character stays rested in the opponent’s next turn, the other rested Characters become active', () => {
    const g = played(OPP);
    choose(g, [offeredInstance(g, VAN.thatch)]);
    settleYes(g, 'p1');
    endTurn(g);
    expect(kind(g)).toBe('main');
    expect(isRested(g, VAN.thatch)).toBe(true);
    expect(isRested(g, VAN.marco)).toBe(false);
    expect(isRested(g, VAN.littleOars)).toBe(false);
  });

  it('only the NEXT Refresh Phase is skipped: the Character is active again one turn cycle later', () => {
    const g = played(OPP);
    choose(g, [offeredInstance(g, VAN.thatch)]);
    settleYes(g, 'p1');
    endTurn(g);
    endTurn(g);
    endTurn(g);
    expect(kind(g)).toBe('main');
    expect(isRested(g, VAN.thatch)).toBe(false);
  });

  it('"up to 1": may choose nobody; every rested Character refreshes as normal', () => {
    const g = played(OPP);
    chooseNone(g);
    settleYes(g, 'p1');
    endTurn(g);
    expect(isRested(g, VAN.thatch)).toBe(false);
    expect(isRested(g, VAN.marco)).toBe(false);
  });

  it('chooses at most 1 of the candidates', () => {
    const g = played(OPP);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('it affects the Character chosen, not the other candidate', () => {
    const g = played(OPP);
    choose(g, [offeredInstance(g, VAN.marco)]);
    settleYes(g, 'p1');
    endTurn(g);
    expect(isRested(g, VAN.marco)).toBe(true);
    expect(isRested(g, VAN.thatch)).toBe(false);
  });

  it('with no rested Character with cost 6 or less nothing is chosen and nothing changes', () => {
    const g = played([VAN.hajrudin, rested(VAN.littleOars)]);
    settleYes(g, 'p1');
    expect(kind(g)).toBe('main');
    endTurn(g);
    expect(isRested(g, VAN.littleOars)).toBe(false);
  });

  it('my own rested Characters are not candidates', () => {
    const g = mine(
      EL.croc,
      { hand: [REBECCA], characters: [rested(VAN.sai)], deck: fill(BLUE, 10) },
      { characters: [rested(VAN.marco)] },
    );
    playCard(g, REBECCA);
    expect(choiceCards(g)).toEqual([VAN.marco]);
  });
});
