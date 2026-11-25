/**
 * OP09-046 Crocodile (Character, Blue, cost 7, 7000, Counter +1000, {Former Baroque Works}/{Cross Guild}).
 *
 * Card text: "[On Play] Play up to 1 "Cross Guild" type Character card or Character card with a type
 * including "Baroque Works" with a cost of 5 or less from your hand."
 *
 * Rules: CR 8-4-4 ("up to"), CR 2-4-3-1 (a type "including" the text matches {Former Baroque Works}),
 * CR 3-7-6 (Character limit of 5), a card played by an effect enters active. No prompt may depend on
 * hidden cards: the "up to" pick over the hand is asked (max 0) even when nothing qualifies.
 */
import { describe, expect, it } from 'vitest';
import { decision } from '../../helpers.ts';
import {
  answerEmptyChoose,
  at,
  atMain,
  chars,
  donSum,
  E9,
  hand,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playId,
  reachablePickSets,
  trash,
  V9,
} from './kit-op09b.ts';

const CROC = 'OP09-046';

function play(handExtra: string[], own: string[] = []) {
  const g = mine(L9.neutral, { hand: [CROC, ...handExtra], characters: own });
  playId(g, CROC);
  return g;
}

describe('OP09-046 Crocodile: [On Play] play up to 1 {Cross Guild} or "Baroque Works"-including Character with cost 5 or less from hand', () => {
  it('offers {Cross Guild}, {Baroque Works} and {Former Baroque Works} Characters of cost 5 or less, not other types', () => {
    const g = play([V9.mr1, V9.mr9, V9.croc5, V9.richie, V9.c3, V9.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.mr1, V9.mr9, V9.croc5, V9.richie].sort());
  });

  it('the pick is played active and leaves the hand; Crocodile stays in play', () => {
    const g = play([V9.mr1, V9.c3]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', V9.mr1)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([CROC, V9.mr1].sort());
    expect(g.card(at(g, 'p1', 'characters', V9.mr1)).rested).toBe(false);
    expect(hand(g)).toEqual([V9.c3]);
  });

  it("the card is played for free: only Crocodile's own cost 7 was paid (3 DON!! of 10 are still active)", () => {
    const g = play([V9.mr1]);
    pickInst(g, [at(g, 'p1', 'hand', V9.mr1)]);
    expect(donSum(g, 'p1')).toMatchObject({ active: 3, rested: 7 });
  });

  it('boundary: cost 5 is playable, cost 6 ({Cross Guild} Buggy) is not', () => {
    const g = play([V9.mr1, V9.buggy6]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.mr1]);
  });

  it('a cost-2 {Cross Guild} Character is playable (cost 5 or less, not exactly 5)', () => {
    const g = play([V9.richie]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.richie]);
  });

  it('an Event with the {Cross Guild} type is not offered (Character cards only)', () => {
    const g = play([E9.blueEvent, V9.richie]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.richie]);
  });

  it('"up to 1": choosing nothing is allowed; nothing is played', () => {
    const g = play([V9.mr1, V9.richie]);
    need(g, 'choose', 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([CROC]);
    expect(hand(g)).toEqual([V9.mr1, V9.richie].sort());
  });

  it('plays at most 1 Character', () => {
    const g = play([V9.mr1, V9.richie, V9.mr9]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with no qualifying card in hand the pick is still asked (max 0): the opponent cannot tell what the hand holds', () => {
    const g = play([V9.c3, V9.buggy6]);
    answerEmptyChoose(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([CROC]);
  });

  it('with an empty hand the pick is asked as well (max 0)', () => {
    const g = play([]);
    answerEmptyChoose(g, 'p1');
    expect(atMain(g)).toBe(true);
  });

  it('with 5 Characters in play (Crocodile and 4 others) the played card forces the Character limit trash (CR 3-7-6)', () => {
    const g = play([V9.richie], [V9.c4, V9.c5, V9.c6, V9.c7]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', V9.richie)]);
    const d = decision(g);
    expect(d?.kind).toBe('choose');
    expect(d?.purpose).toBe('characterLimit');
    pickInst(g, [at(g, 'p1', 'characters', V9.c4)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toHaveLength(5);
    expect(chars(g)).toContain(V9.richie);
    expect(trash(g)).toEqual([V9.c4]);
    expect(kind(g)).toBe('main');
  });
});
