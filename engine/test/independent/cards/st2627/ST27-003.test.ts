/**
 * ST27-003 Kuzan (Character, Black, cost 6, 6000, Counter +1000, {Blackbeard Pirates}/{Former Navy},
 * Special).
 *
 * Card text: "[Blocker] [On K.O.] Play up to 1 "Blackbeard Pirates" type Character card with a cost of
 * 5 or less from your trash rested."
 *
 * Rules: CR 10-1-3 ([Blocker]), CR 1-3-5 ("up to 1" allows 0), "a "Blackbeard Pirates" type card"
 * is the exact type (the type {Blackbeard Pirates Allies} is another type), the type is read on the
 * card whatever its color, only Character cards can be played to the Character area, a card played
 * "rested" enters rested, and its own [On Play] still happens (CR 10-2-1: K.O. is battle or effect).
 * Kuzan is in the trash when [On K.O.] resolves, with printed cost 6, so it is not a candidate.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  blockers,
  charIds,
  choices,
  defendNothing,
  fill,
  hand,
  kind,
  kw,
  need,
  none,
  offeredIds,
  passCounter,
  pickInst,
  SL,
  skipEmpty,
  SS,
  ST27,
  theirs,
  trash,
  attack,
  restedChar,
} from './kit-st2627a.ts';
import { reachablePickSets } from '../kit.ts';

const KUZAN = ST27.kuzan;

function defend(trashCards: string[], o: { leader?: string; hand?: string[]; p2?: string[] } = {}) {
  return theirs(
    o.leader ?? SL.shanks,
    {
      characters: [{ card: KUZAN, rested: true }],
      trash: trashCards,
      hand: o.hand ?? [],
      deck: fill(SS.c1, 10),
    },
    { characters: o.p2 ?? [SS.c5] },
  );
}

function koKuzan(g: ReturnType<typeof defend>) {
  defendNothing(g, at(g, 'p2', 'characters', SS.c5), at(g, 'p1', 'characters', KUZAN));
}

describe('ST27-003 Kuzan: [Blocker]', () => {
  it('has [Blocker] and can block an attack on my Leader', () => {
    const g = theirs(
      SL.shanks,
      { characters: [KUZAN] },
      { characters: [SS.c3], costArea: { active: 10, rested: 0 } },
    );
    const kuzan = at(g, 'p1', 'characters', KUZAN);
    expect(kw(g, kuzan)).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', SS.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([kuzan]);
  });

  it('blocking a weaker attacker: Kuzan survives and [On K.O.] does not happen', () => {
    const g = theirs(SL.shanks, { characters: [KUZAN], trash: [SS.bbp4] }, { characters: [SS.c3] });
    attack(g, at(g, 'p2', 'characters', SS.c3), g.leader('p1'));
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', KUZAN) });
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(charIds(g, 'p1')).toEqual([KUZAN]);
    expect(trash(g)).toEqual([SS.bbp4]);
  });

  it("blocking a stronger attacker: Kuzan is K.O.'d and [On K.O.] is offered", () => {
    const g = theirs(
      SL.shanks,
      { characters: [KUZAN], trash: [SS.bbp4] },
      { characters: [SS.oars9] },
    );
    attack(g, at(g, 'p2', 'characters', SS.oars9), g.leader('p1'));
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', KUZAN) });
    passCounter(g);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SS.bbp4]);
  });
});

describe('ST27-003 Kuzan: [On K.O.] play up to 1 {Blackbeard Pirates} Character, cost 5 or less, rested', () => {
  it('plays the chosen card from the trash, rested, onto the field', () => {
    const g = defend([SS.bbp4, SS.black4]);
    koKuzan(g);
    need(g, 'choose');
    pickInst(g, [at(g, 'p1', 'trash', SS.bbp4)]);
    expect(charIds(g, 'p1')).toEqual([SS.bbp4]);
    expect(restedChar(g, 'p1', SS.bbp4)).toBe(true);
    expect(trash(g)).toEqual([KUZAN, SS.black4].sort());
  });

  it('candidates: Characters of the exact type with cost 5 or less (4 and 5 qualify, even a yellow one); cost 6 and 7, other types and non-Characters do not', () => {
    const g = defend([
      SS.bbp4,
      SS.bbp5,
      SS.yellowBbp,
      ST27.teach, // cost 7
      SS.black4, // {CP9}
      SS.allies3, // {Blackbeard Pirates Allies}
      SS.blackEvent, // an Event of the type
      SS.c3, // no type
    ]);
    koKuzan(g);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SS.bbp4, SS.bbp5, SS.yellowBbp].sort());
  });

  it('Kuzan itself (cost 6, in the trash when the effect resolves) is not a candidate', () => {
    const g = defend([SS.bbp4]);
    koKuzan(g);
    need(g, 'choose');
    expect(choices(g)).toHaveLength(1);
    expect(offeredIds(g)).not.toContain(KUZAN);
  });

  it('boundary: exactly cost 5 can be played', () => {
    const g = defend([SS.bbp5]);
    koKuzan(g);
    pickInst(g, [at(g, 'p1', 'trash', SS.bbp5)]);
    expect(charIds(g, 'p1')).toEqual([SS.bbp5]);
  });

  it('"up to 1": may choose nothing; the trash is untouched', () => {
    const g = defend([SS.bbp4, SS.bbp5]);
    koKuzan(g);
    need(g, 'choose');
    none(g);
    expect(charIds(g, 'p1')).toEqual([]);
    expect(trash(g)).toEqual([KUZAN, SS.bbp4, SS.bbp5].sort());
  });

  it('plays at most 1 card even when several qualify', () => {
    const g = defend([SS.bbp4, SS.bbp5, SS.yellowBbp]);
    koKuzan(g);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has(SS.bbp4)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with no qualifying card in the trash nothing is played', () => {
    const g = defend([ST27.teach, SS.black4, SS.allies3]);
    koKuzan(g);
    skipEmpty(g);
    expect(charIds(g, 'p1')).toEqual([]);
    expect(trash(g)).toEqual([KUZAN, ST27.teach, SS.black4, SS.allies3].sort());
  });

  it('it does not matter what my Leader is: a Leader without the type still plays the card', () => {
    const g = defend([SS.bbp4], { leader: SL.monoShc });
    koKuzan(g);
    pickInst(g, [at(g, 'p1', 'trash', SS.bbp4)]);
    expect(charIds(g, 'p1')).toEqual([SS.bbp4]);
  });

  it("the played card's own [On Play] happens: Sanjuan.Wolf (ST27-004) trashes a card from my hand", () => {
    const g = defend([ST27.wolf], { hand: [SS.c1] });
    koKuzan(g);
    pickInst(g, [at(g, 'p1', 'trash', ST27.wolf)]);
    // Wolf's [On Play] "Trash 1 card from your hand": a single card is still offered as a forced pick.
    if (kind(g) === 'choose') pickInst(g, [at(g, 'p1', 'hand', SS.c1)]);
    expect(charIds(g, 'p1')).toEqual([ST27.wolf]);
    expect(restedChar(g, 'p1', ST27.wolf)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([KUZAN, SS.c1].sort());
  });
});
