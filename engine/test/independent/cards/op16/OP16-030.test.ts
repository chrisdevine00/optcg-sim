/**
 * OP16-030 Trafalgar Law (Character, Green, cost 8, 9000, no Counter, {Heart Pirates}/{Supernovas},
 * Slash).
 *
 * Card text: "[On Play] Up to 1 of your opponent's rested Characters will not become active in your
 * opponent's next Refresh Phase.
 * [End of Your Turn] Set all of your green Characters with a cost of 5 or less as active."
 *
 * Rules: CR 6-2-3 (Refresh Phase sets rested cards active), "up to 1" (CR 8-4-4-1), CR 10-2-18
 * ([End of Your Turn], RL-09), "next" Refresh Phase only (the card refreshes normally after that).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  choices,
  endTurn,
  mayChooseNone,
  mine,
  need,
  noDefence,
  none,
  OL,
  OV,
  offeredIds,
  pickInst,
  playCard,
  restedChar,
} from './kit-op16a.ts';

const LAW = 'OP16-030';
const GREEN1 = 'OP03-023'; // Alvida: Green, cost 1, 3000
const GREEN5 = 'OP02-039'; // Franky: Green, cost 5, 7000, vanilla
const GREEN6 = 'OP04-023'; // Kuro: Green, cost 6, 8000, vanilla
const RED_CHAR = OV.sai4; // Red, cost 2

function playLaw(p2chars: (string | { card: string; rested?: boolean })[]) {
  const g = mine(OL.kid, { hand: [LAW] }, { characters: p2chars });
  playCard(g, LAW);
  return g;
}
const rested = (card: string) => ({ card, rested: true });

describe('OP16-030 Trafalgar Law: [On Play] an opposing rested Character will not become active', () => {
  it("only the opponent's RESTED Characters are offered", () => {
    const g = playLaw([rested(OV.hajrudin6), OV.thatch]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([OV.hajrudin6]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it("the chosen Character stays rested through the opponent's next Refresh Phase; the others become active", () => {
    const g = playLaw([rested(OV.hajrudin6), rested(OV.thatch)]);
    pickInst(g, [at(g, 'p2', 'characters', OV.hajrudin6)]);
    endTurn(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(restedChar(g, 'p2', OV.hajrudin6)).toBe(true);
    expect(restedChar(g, 'p2', OV.thatch)).toBe(false);
  });

  it('without the effect the same Character does become active (control)', () => {
    const g = playLaw([rested(OV.hajrudin6)]);
    none(g);
    endTurn(g);
    expect(restedChar(g, 'p2', OV.hajrudin6)).toBe(false);
  });

  it('only the NEXT Refresh Phase is skipped: it becomes active in the one after', () => {
    const g = playLaw([rested(OV.hajrudin6)]);
    pickInst(g, [at(g, 'p2', 'characters', OV.hajrudin6)]);
    endTurn(g);
    act(g, { type: 'endTurn' });
    endTurn(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(restedChar(g, 'p2', OV.hajrudin6)).toBe(false);
  });

  it('"up to 1": may choose nothing', () => {
    const g = playLaw([rested(OV.hajrudin6)]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(atMain(g)).toBe(true);
  });

  it('affects only one Character when two are rested', () => {
    const g = playLaw([rested(OV.hajrudin6), rested(OV.thatch)]);
    pickInst(g, [at(g, 'p2', 'characters', OV.thatch)]);
    endTurn(g);
    expect(restedChar(g, 'p2', OV.thatch)).toBe(true);
    expect(restedChar(g, 'p2', OV.hajrudin6)).toBe(false);
  });

  it("with no rested Character on the opponent's side nothing is asked", () => {
    const g = playLaw([OV.hajrudin6]);
    expect(atMain(g)).toBe(true);
  });
});

describe('OP16-030 Trafalgar Law: [End of Your Turn] set my green Characters with cost 5 or less as active', () => {
  /** Law is on the field; `chars` are my other Characters; the turn ends. */
  function endMyTurn(chars: { card: string; rested: boolean }[]) {
    const g = mine(OL.kid, { characters: [LAW, ...chars] });
    endTurn(g);
    return g;
  }

  it('a rested green Character with cost 1 becomes active at the end of my turn', () => {
    const g = endMyTurn([rested(GREEN1)]);
    expect(restedChar(g, 'p1', GREEN1)).toBe(false);
  });

  it('boundary: cost 5 is set active, cost 6 stays rested', () => {
    const g = endMyTurn([rested(GREEN5), rested(GREEN6)]);
    expect(restedChar(g, 'p1', GREEN5)).toBe(false);
    expect(restedChar(g, 'p1', GREEN6)).toBe(true);
  });

  it('a non-green Character with cost 2 stays rested', () => {
    const g = endMyTurn([rested(RED_CHAR)]);
    expect(restedChar(g, 'p1', RED_CHAR)).toBe(true);
  });

  it('"all": every qualifying Character is set, not only one', () => {
    const g = endMyTurn([rested(GREEN1), rested(GREEN5)]);
    expect(restedChar(g, 'p1', GREEN1)).toBe(false);
    expect(restedChar(g, 'p1', GREEN5)).toBe(false);
  });

  it('Law (green, cost 8) itself is not set active when rested', () => {
    const g = mine(OL.kid, { characters: [rested(LAW)] });
    endTurn(g);
    expect(restedChar(g, 'p1', LAW)).toBe(true);
  });

  it('works the turn Law is played: a rested green Character is active again at the end of that turn', () => {
    const g = mine(OL.kid, { hand: [LAW], characters: [rested(GREEN1)] });
    playCard(g, LAW);
    expect(restedChar(g, 'p1', GREEN1)).toBe(true);
    endTurn(g);
    expect(restedChar(g, 'p1', GREEN1)).toBe(false);
  });

  it('a Character that was rested by attacking is set active at the end of the turn', () => {
    const g = mine(OL.kid, { characters: [LAW, GREEN1] });
    attack(g, at(g, 'p1', 'characters', GREEN1), g.leader('p2'));
    noDefence(g);
    expect(restedChar(g, 'p1', GREEN1)).toBe(true);
    endTurn(g);
    expect(restedChar(g, 'p1', GREEN1)).toBe(false);
  });
});
