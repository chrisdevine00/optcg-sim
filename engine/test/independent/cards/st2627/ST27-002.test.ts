/**
 * ST27-002 Catarina Devon (Character, Black, cost 1, 1000, Counter +2000, {Blackbeard Pirates},
 * Special).
 *
 * Card text: "[Activate: Main] You may trash this Character: If your Leader has the "Blackbeard
 * Pirates" type, give up to 1 of your opponent's Characters -1 cost during this turn.
 * [On K.O.] Draw 1 card."
 *
 * Rules: CR 8-3 (the cost is trashing this Character), CR 10-2-1 (trashing as a cost is not a
 * K.O.), the "If" after the colon is an effect condition (the cost is paid even when the check
 * fails), CR 1-3-5 ("up to 1" allows 0), CR 1-3-6-2 (a cost never shows below 0), CR 6-6-1-3.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  canActivate,
  choices,
  costIn,
  defendNothing,
  endTurn,
  fill,
  hand,
  mine,
  n,
  need,
  none,
  offeredIds,
  pickInst,
  skipEmpty,
  SL,
  SS,
  ST27,
  theirs,
  trash,
  useAbility,
  waitingAtMain,
} from './kit-st2627a.ts';

const DEVON = ST27.devon;

function start(leader: string, own: string[] = [DEVON], p2: string[] = [SS.c4]) {
  return mine(leader, { characters: own, deck: fill(SS.c1, 10) }, { characters: p2 });
}

describe('ST27-002 Catarina Devon: [Activate: Main] trash this Character: -1 cost', () => {
  it('with a {Blackbeard Pirates} Leader: trashes Devon and gives an opposing Character -1 cost (4 -> 3)', () => {
    const g = start(SL.bbp);
    useAbility(g, at(g, 'p1', 'characters', DEVON));
    need(g, 'choose');
    pickInst(g, [at(g, 'p2', 'characters', SS.c4)]);
    expect(waitingAtMain(g)).toBe(true);
    expect(costIn(g, 'p2', 'characters', SS.c4)).toBe(3);
    expect(trash(g)).toEqual([DEVON]);
  });

  it('the cost is paid first: Devon is already in the trash while the target is chosen', () => {
    const g = start(SL.bbp);
    useAbility(g, at(g, 'p1', 'characters', DEVON));
    need(g, 'choose');
    expect(trash(g)).toEqual([DEVON]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('"up to 1": choosing nothing is allowed; Devon is trashed all the same and no cost changes', () => {
    const g = start(SL.bbp);
    useAbility(g, at(g, 'p1', 'characters', DEVON));
    none(g);
    expect(trash(g)).toEqual([DEVON]);
    expect(costIn(g, 'p2', 'characters', SS.c4)).toBe(4);
  });

  it('a Leader without the type: Devon is trashed (cost paid) and nothing is asked or changed (effect condition)', () => {
    const g = start(SL.shanks);
    useAbility(g, at(g, 'p1', 'characters', DEVON));
    expect(waitingAtMain(g)).toBe(true);
    expect(trash(g)).toEqual([DEVON]);
    expect(costIn(g, 'p2', 'characters', SS.c4)).toBe(4);
  });

  it("candidates are the opponent's Characters only: not my Characters, not either Leader", () => {
    const g = start(SL.bbp, [DEVON, SS.c3], [SS.c4, SS.c2]);
    useAbility(g, at(g, 'p1', 'characters', DEVON));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SS.c4, SS.c2].sort());
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', SS.c3));
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('only the chosen Character changes: a second opposing Character keeps its cost', () => {
    const g = start(SL.bbp, [DEVON], [SS.c4, SS.c5]);
    useAbility(g, at(g, 'p1', 'characters', DEVON));
    pickInst(g, [at(g, 'p2', 'characters', SS.c4)]);
    expect(costIn(g, 'p2', 'characters', SS.c4)).toBe(3);
    expect(costIn(g, 'p2', 'characters', SS.c5)).toBe(5);
  });

  it('"during this turn": the opposing Character has its printed cost again on the opponent\'s turn', () => {
    const g = start(SL.bbp);
    useAbility(g, at(g, 'p1', 'characters', DEVON));
    pickInst(g, [at(g, 'p2', 'characters', SS.c4)]);
    expect(costIn(g, 'p2', 'characters', SS.c4)).toBe(3);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(costIn(g, 'p2', 'characters', SS.c4)).toBe(4);
  });

  it('there is no [Once Per Turn]: two Devons on the same Character give -2 (4 -> 2)', () => {
    const g = start(SL.bbp, [DEVON, DEVON]);
    const target = at(g, 'p2', 'characters', SS.c4);
    useAbility(g, at(g, 'p1', 'characters', DEVON));
    pickInst(g, [target]);
    useAbility(g, at(g, 'p1', 'characters', DEVON));
    pickInst(g, [target]);
    expect(costIn(g, 'p2', 'characters', SS.c4)).toBe(2);
    expect(trash(g)).toEqual([DEVON, DEVON]);
  });

  it('a cost never shows below 0: two Devons on a cost-1 Character leave it at 0 (CR 1-3-6-2)', () => {
    const g = start(SL.bbp, [DEVON, DEVON], [SS.c1]);
    const target = at(g, 'p2', 'characters', SS.c1);
    useAbility(g, at(g, 'p1', 'characters', DEVON));
    pickInst(g, [target]);
    expect(costIn(g, 'p2', 'characters', SS.c1)).toBe(0);
    useAbility(g, at(g, 'p1', 'characters', DEVON));
    pickInst(g, [target]);
    expect(costIn(g, 'p2', 'characters', SS.c1)).toBe(0);
  });

  it('with no opposing Character the ability can still be used; the cost is paid and nothing can be chosen', () => {
    const g = start(SL.bbp, [DEVON], []);
    expect(canActivate(g, at(g, 'p1', 'characters', DEVON))).toBe(true);
    useAbility(g, at(g, 'p1', 'characters', DEVON));
    skipEmpty(g);
    expect(trash(g)).toEqual([DEVON]);
    expect(waitingAtMain(g)).toBe(true);
  });

  it('trashing Devon as a cost is not a K.O.: [On K.O.] does not draw', () => {
    const g = start(SL.bbp);
    useAbility(g, at(g, 'p1', 'characters', DEVON));
    pickInst(g, [at(g, 'p2', 'characters', SS.c4)]);
    expect(hand(g)).toEqual([]);
    expect(n(g, 'p1', 'deck')).toBe(10);
  });
});

describe('ST27-002 Catarina Devon: [On K.O.] draw 1 card', () => {
  it("K.O.'d in battle: draws 1 card (hand +1, deck -1)", () => {
    const g = theirs(
      SL.shanks,
      { characters: [{ card: DEVON, rested: true }], deck: fill(SS.c1, 10) },
      { characters: [SS.c5] },
    );
    defendNothing(g, at(g, 'p2', 'characters', SS.c5), at(g, 'p1', 'characters', DEVON));
    expect(trash(g)).toEqual([DEVON]);
    expect(hand(g)).toEqual([SS.c1]);
    expect(n(g, 'p1', 'deck')).toBe(9);
  });

  it("K.O.'d by my Teach: draws 1 card", () => {
    const g = start(SL.shanks, [DEVON, ST27.teach]);
    useAbility(g, at(g, 'p1', 'characters', ST27.teach));
    pickInst(g, [at(g, 'p1', 'characters', DEVON)]);
    expect(trash(g)).toEqual([DEVON]);
    expect(hand(g)).toEqual([SS.c1]);
  });
});
