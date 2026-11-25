/**
 * ST27-005 Marshall.D.Teach (Character, Black, cost 7, 8000, no Counter, {Blackbeard Pirates}/{The
 * Four Emperors}, Special).
 *
 * Card text: "[Activate: Main] You may rest this Character: K.O. up to 1 Character with a cost of 3 or
 * less. [On K.O.] Add up to 1 black card from your trash to your hand."
 *
 * Rules: CR 8-3 (the cost is resting this Character; a rested Character cannot pay it), CR 1-3-5
 * ("up to 1" allows 0), "Character" without an owner means either side's Characters, the cost is
 * the current cost (a -1 cost effect counts), a "black card" is any card of that color (Character,
 * Event or Stage), and [On K.O.] resolves with Teach already in the trash, so Teach is itself a
 * black card in the trash.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  canActivate,
  charIds,
  choices,
  defendNothing,
  fill,
  hand,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  restedChar,
  SL,
  SS,
  ST27,
  theirs,
  trash,
  useAbility,
  waitingAtMain,
  skipEmpty,
} from './kit-st2627a.ts';
import { reachablePickSets } from '../kit.ts';

const TEACH = ST27.teach;

function start(
  own: (string | { card: string; rested: boolean })[],
  p2: string[],
  leader = SL.shanks,
) {
  return mine(leader, { characters: [TEACH, ...own] }, { characters: p2 });
}

describe('ST27-005 Marshall.D.Teach: [Activate: Main] rest this Character: K.O. up to 1 Character, cost 3 or less', () => {
  it('rests Teach and K.O.s the chosen opposing Character with cost 3', () => {
    const g = start([], [SS.c3]);
    useAbility(g, at(g, 'p1', 'characters', TEACH));
    need(g, 'choose');
    pickInst(g, [at(g, 'p2', 'characters', SS.c3)]);
    expect(waitingAtMain(g)).toBe(true);
    expect(restedChar(g, 'p1', TEACH)).toBe(true);
    expect(charIds(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([SS.c3]);
  });

  it('boundary: cost 3 or less is offered (0..3), cost 4 and 5 are not', () => {
    const g = start([], [SS.c1, SS.c2, SS.c3, SS.c4, SS.c5]);
    useAbility(g, at(g, 'p1', 'characters', TEACH));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SS.c1, SS.c2, SS.c3].sort());
  });

  it('"up to 1 Character" is not limited to the opponent\'s: my own cost-3-or-less Characters are candidates, Leaders and Teach (cost 7) are not', () => {
    const g = start([SS.c2], [SS.c3]);
    useAbility(g, at(g, 'p1', 'characters', TEACH));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SS.c2, SS.c3].sort());
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', TEACH));
  });

  it('"up to 1": K.O.s at most one Character even when several qualify', () => {
    const g = start([], [SS.c1, SS.c2, SS.c3]);
    useAbility(g, at(g, 'p1', 'characters', TEACH));
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('"up to 1": choosing nothing is allowed; Teach stays rested (the cost is paid) and nothing is K.O.\'d', () => {
    const g = start([], [SS.c3]);
    useAbility(g, at(g, 'p1', 'characters', TEACH));
    need(g, 'choose');
    none(g);
    expect(restedChar(g, 'p1', TEACH)).toBe(true);
    expect(charIds(g, 'p2')).toEqual([SS.c3]);
  });

  it('a rested Teach cannot pay the rest cost: the ability is not offered', () => {
    const rested = mine(
      SL.shanks,
      { characters: [{ card: TEACH, rested: true }] },
      { characters: [SS.c3] },
    );
    expect(canActivate(rested, at(rested, 'p1', 'characters', TEACH))).toBe(false);
  });

  it('there is no [Once Per Turn] but resting is the cost: after one use it is not offered again this turn', () => {
    const g = start([], [SS.c3]);
    const teach = at(g, 'p1', 'characters', TEACH);
    useAbility(g, teach);
    pickInst(g, [at(g, 'p2', 'characters', SS.c3)]);
    expect(canActivate(g, teach)).toBe(false);
  });

  it("with no Character of cost 3 or less anywhere, the cost is still paid and nothing can be K.O.'d", () => {
    const g = start([], [SS.c4, SS.c5]);
    useAbility(g, at(g, 'p1', 'characters', TEACH));
    skipEmpty(g);
    expect(restedChar(g, 'p1', TEACH)).toBe(true);
    expect(charIds(g, 'p2')).toEqual([SS.c4, SS.c5].sort());
  });

  it("the current cost counts: a cost-4 Character with -1 cost from Catarina Devon (ST27-002) can be K.O.'d", () => {
    const g = mine(SL.bbp, { characters: [TEACH, ST27.devon] }, { characters: [SS.c4] });
    useAbility(g, at(g, 'p1', 'characters', ST27.devon));
    pickInst(g, [at(g, 'p2', 'characters', SS.c4)]);
    useAbility(g, at(g, 'p1', 'characters', TEACH));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SS.c4]);
    pickInst(g, [at(g, 'p2', 'characters', SS.c4)]);
    expect(trash(g, 'p2')).toEqual([SS.c4]);
  });

  it('Teach does not get his [On K.O.] when he only rests: his own K.O. effect is not triggered', () => {
    const g = start([], [SS.c3]);
    useAbility(g, at(g, 'p1', 'characters', TEACH));
    pickInst(g, [at(g, 'p2', 'characters', SS.c3)]);
    expect(hand(g)).toEqual([]);
    expect(charIds(g, 'p1')).toEqual([TEACH]);
  });
});

describe('ST27-005 Marshall.D.Teach: [On K.O.] add up to 1 black card from your trash to your hand', () => {
  const TRASH = [
    SS.black4, // black Character
    SS.blackEvent, // black Event
    SS.fullaleadBlack, // black Stage
    SS.yellowBbp, // yellow {Blackbeard Pirates}: type is not color
    SS.fullaleadBlue, // blue Stage
    SS.c1, // blue Character
    SS.c4, // red Character
  ];

  function defend(trashCards: string[]) {
    return theirs(
      SL.shanks,
      {
        characters: [{ card: TEACH, rested: true }],
        trash: trashCards,
        deck: fill(SS.c1, 10),
      },
      { characters: [SS.oars9] },
    );
  }

  function koTeach(g: ReturnType<typeof defend>) {
    defendNothing(g, at(g, 'p2', 'characters', SS.oars9), at(g, 'p1', 'characters', TEACH));
  }

  it("K.O.'d in battle: offers exactly the black cards of the trash (Character, Event, Stage) and Teach himself", () => {
    const g = defend(TRASH);
    koTeach(g);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SS.black4, SS.blackEvent, SS.fullaleadBlack, TEACH].sort());
  });

  it('adds the chosen card to my hand', () => {
    const g = defend(TRASH);
    koTeach(g);
    pickInst(g, [at(g, 'p1', 'trash', SS.black4)]);
    expect(hand(g)).toEqual([SS.black4]);
    expect(trash(g)).not.toContain(SS.black4);
  });

  it('Teach himself is in the trash when the effect resolves and can be added back to hand', () => {
    const g = defend([SS.c1]);
    koTeach(g);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([TEACH]);
    pickInst(g, [at(g, 'p1', 'trash', TEACH)]);
    expect(hand(g)).toEqual([TEACH]);
    expect(charIds(g, 'p1')).toEqual([]);
  });

  it('"up to 1": may add nothing; the trash keeps every card', () => {
    const g = defend(TRASH);
    koTeach(g);
    need(g, 'choose');
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([...TRASH, TEACH].sort());
  });

  it('adds at most 1 card even when several are black', () => {
    const g = defend(TRASH);
    koTeach(g);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    expect([...sets].some((s) => s.length > 0)).toBe(true);
  });

  it('colors, not types: a yellow {Blackbeard Pirates} card and a blue Stage are not offered', () => {
    const g = defend([SS.yellowBbp, SS.fullaleadBlue, SS.c1]);
    koTeach(g);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([TEACH]);
  });

  it('another Teach (cost 7) is not a candidate for the K.O. effect, so no [On K.O.] follows', () => {
    const g = mine(
      SL.shanks,
      { characters: [TEACH, { card: TEACH, rested: true }], trash: [SS.black4] },
      {},
    );
    useAbility(g, at(g, 'p1', 'characters', TEACH, 0));
    skipEmpty(g);
    expect(charIds(g, 'p1')).toEqual([TEACH, TEACH]);
    expect(hand(g)).toEqual([]);
  });

  it("must not trigger when Teach is not K.O.'d: resting for the Activate puts nothing in my hand", () => {
    const g = mine(SL.shanks, { characters: [TEACH], trash: [SS.black4] }, { characters: [SS.c1] });
    useAbility(g, at(g, 'p1', 'characters', TEACH));
    pickInst(g, [at(g, 'p2', 'characters', SS.c1)]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SS.black4]);
  });
});
