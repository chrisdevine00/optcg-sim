/**
 * OP16-095 Monkey.D.Luffy (Character, Black, cost 2, 2000, Counter +2000, {Land of Wano}/{Straw Hat Crew}).
 *
 * Card text: "[On Play] Up to 1 of your black {Land of Wano} type Characters gains [Unblockable] during
 * this turn. (This card cannot be blocked.)"
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 6-6-1-3 ("during this turn"), CR 10-1-?? ([Unblockable]).
 * Scenery: OP09-072 Franky is a Purple [Blocker] for the opponent.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  blockers,
  choices,
  kind,
  kw,
  LD16,
  mayChooseNone,
  need,
  none,
  offeredIds,
  p1main,
  pickCards,
  playIt,
  SC16,
  SCN,
  toMyNextMain,
} from './kit-op16c.ts';

const ID = 'OP16-095';
const SANJI = SC16.wano8; // OP16-086: Black, {Land of Wano}, 9000, cost 8
const FRANKY = 'OP09-072'; // Purple, [Blocker]

function start(field: string[], opp: string[] = [FRANKY]) {
  const g = p1main(LD16.wano, { hand: [ID], characters: field }, { characters: opp });
  playIt(g, ID);
  return g;
}

describe('OP16-095 Monkey.D.Luffy: [On Play] a black {Land of Wano} Character gains [Unblockable] this turn', () => {
  it("candidates: black {Land of Wano} Characters (Luffy himself and Sanji); not green {Land of Wano}, not black non-{Land of Wano}, not the opponent's", () => {
    const g = start([SANJI, SC16.wano3, SC16.bb4], [SCN.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ID, SANJI].sort());
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('the chosen Character has [Unblockable] and the opponent has no legal block against it', () => {
    const g = start([SANJI]);
    pickCards(g, [SANJI]);
    expect(atMain(g)).toBe(true);
    const sanji = at(g, 'p1', 'characters', SANJI);
    expect(kw(g, sanji)).toContain('Unblockable');
    attack(g, sanji, g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('without the grant the same attack can be blocked by [Blocker] Franky', () => {
    const g = start([SANJI]);
    none(g);
    const sanji = at(g, 'p1', 'characters', SANJI);
    expect(kw(g, sanji)).not.toContain('Unblockable');
    attack(g, sanji, g.leader('p2'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([at(g, 'p2', 'characters', FRANKY)]);
  });

  it('Luffy may give it to himself', () => {
    const g = start([SANJI]);
    pickCards(g, [ID]);
    expect(kw(g, at(g, 'p1', 'characters', ID))).toContain('Unblockable');
    expect(kw(g, at(g, 'p1', 'characters', SANJI))).not.toContain('Unblockable');
  });

  it('"up to 1": only one Character gains it', () => {
    const g = start([SANJI]);
    pickCards(g, [SANJI]);
    expect(atMain(g)).toBe(true);
    expect(kw(g, at(g, 'p1', 'characters', ID))).not.toContain('Unblockable');
  });

  it('"up to 1": may choose nobody', () => {
    const g = start([SANJI]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(kw(g, at(g, 'p1', 'characters', SANJI))).not.toContain('Unblockable');
    expect(kw(g, at(g, 'p1', 'characters', ID))).not.toContain('Unblockable');
  });

  it('the grant lasts this turn only', () => {
    const g = start([SANJI]);
    pickCards(g, [SANJI]);
    toMyNextMain(g);
    expect(kw(g, at(g, 'p1', 'characters', SANJI))).not.toContain('Unblockable');
  });

  it('with no other black {Land of Wano} Character, Luffy is the only candidate', () => {
    const g = start([SC16.wano3]);
    expect(offeredIds(g)).toEqual([ID]);
  });

  it('is not a Leader effect: my Leader never gains [Unblockable]', () => {
    const g = start([SANJI]);
    pickCards(g, [SANJI]);
    expect(kw(g, g.leader('p1'))).not.toContain('Unblockable');
  });
});
