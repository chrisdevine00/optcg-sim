/**
 * OP11-076 Hannyabal (Character, Purple, cost 5, 5000, Counter +1000, {Impel Down}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] If your Leader has the "Impel Down" type, play up to 1 "Impel Down"
 * type Character card with a cost of 3 or less from your hand."
 *
 * Rules: CR 2-4-3 (type match), CR 8-3-2 (If condition at resolution), CR 8-4-4 ("up to" may pick
 * none), CR 3-7-6 (a card played by an effect pays no cost).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chars,
  hand,
  kind,
  LD11,
  me,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SC11,
  donField,
  mayChooseNone,
  offers,
  trash,
} from './kit-op11c.ts';

const ID = 'OP11-076';
/** OP03-069 Minorhinoceros: Purple, cost 3, 5000, {Impel Down}. [On K.O.] only: inert on play. */
const IMPEL3 = 'OP03-069';
/** EB01-028 Gum-Gum Champion Rifle: Blue Event {Impel Down}, cost 1. */
const IMPEL_EVENT = 'EB01-028';

function start(
  hand_: string[],
  leader: string = LD11.impelDown,
  extra: Partial<Parameters<typeof me>[1]> = {},
) {
  const g = me(leader, { hand: [ID, ...hand_], ...extra });
  playRaw(g, ID);
  return g;
}

describe('OP11-076 Hannyabal: with an {Impel Down} Leader, play a cost-3-or-less {Impel Down} Character from hand', () => {
  it('has [Blocker]', () => {
    const g = me(LD11.impelDown, { characters: [ID] });
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('printed effect: plays the chosen cost-3 {Impel Down} Character for free', () => {
    const g = start([IMPEL3]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', IMPEL3)]);
    expect(chars(g)).toEqual([ID, IMPEL3].sort());
    expect(hand(g)).toEqual([]);
    expect(donField(g)).toBe(10);
    expect(kind(g)).toBe('main');
  });

  it('boundary: a cost-4 {Impel Down} Character is not offered, a cost-3 and a cost-1 one are', () => {
    const g = start([SC11.impel4, IMPEL3, SC11.impel1]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([IMPEL3, SC11.impel1].sort());
  });

  it('a non-{Impel Down} Character of cost 3 or less is not offered', () => {
    const g = start([SC11.r3, SC11.impel1]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC11.impel1]);
  });

  it('an {Impel Down} Event is not offered (Character cards only)', () => {
    const g = start([IMPEL_EVENT, SC11.impel1]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC11.impel1]);
  });

  it('"up to 1": I may play nothing', () => {
    const g = start([IMPEL3]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([IMPEL3]);
  });

  it('the Leader must have the {Impel Down} type: a plain Leader gets no play and no stuck prompt', () => {
    const g = start([IMPEL3], LD11.plain);
    // The condition is false: nothing may be played, whether or not an empty pick is shown.
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([IMPEL3]);
  });

  it('a Leader with {Impel Down} among several types counts (Emporio.Ivankov, {Revolutionary Army}/{Impel Down})', () => {
    const g = start([IMPEL3], 'OP02-049');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', IMPEL3)]);
    expect(chars(g)).toEqual([ID, IMPEL3].sort());
  });

  it('a sixth Character: with 4 others on the field Hannyabal fills the area, so the played card forces one trash (area never exceeds 5)', () => {
    const g = me(LD11.impelDown, {
      hand: [ID, IMPEL3],
      characters: [SC11.r1, SC11.r2, SC11.r3, SC11.r4],
    });
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', IMPEL3)]);
    // CR 3-7-6-1: the owner trashes one of their Characters to make room.
    for (let i = 0; i < 3 && kind(g) !== 'main'; i++) {
      need(g, 'choose', 'p1');
      pickInst(g, [at(g, 'p1', 'characters', SC11.r1)]);
    }
    expect(chars(g)).toHaveLength(5);
    expect(chars(g)).toContain(IMPEL3);
    expect(trash(g)).toEqual([SC11.r1]);
  });

  it('only cards in my hand are candidates: an {Impel Down} Character in my trash is not offered', () => {
    const g = start([], LD11.impelDown, { trash: [IMPEL3] });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([IMPEL3]);
  });

  it('a candidate that is not in the pick list cannot be chosen (the cost-4 Character stays in hand)', () => {
    const g = start([SC11.impel4]);
    if (kind(g) === 'choose') {
      expect(offers(g, at(g, 'p1', 'hand', SC11.impel4))).toBe(false);
      none(g);
    }
    expect(hand(g)).toEqual([SC11.impel4]);
  });
});
