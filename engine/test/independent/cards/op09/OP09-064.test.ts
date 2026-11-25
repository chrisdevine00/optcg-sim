/**
 * OP09-064 Killer (Character, Purple, cost 5, 5000, Counter +1000, {Kid Pirates}).
 *
 * Card text: "[On Play] DON!! −1 (You may return the specified number of DON!! cards from your field to
 * your DON!! deck.): Set up to 1 of your "Kid Pirates" type Leader as active."
 *
 * Rules: CR 10-2-10 (DON!! −X is a "you may" cost: returns DON!! from the field to the DON!! deck),
 * CR 8-4-4 ("up to"), the effect only reaches a Leader, never a Character. The cost is paid first,
 * so by the time it is asked Killer's own cost 5 has already been rested.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  at,
  atMain,
  donSum,
  kind,
  L9,
  mine,
  need,
  no,
  payDonStrict,
  pickInst,
  playId,
  yes,
} from './kit-op09b.ts';

const KILLER = 'OP09-064';

function play(
  leader: string,
  o: { chars?: (string | { card: string; rested: boolean })[]; don?: number } = {},
) {
  const g = mine(
    { card: leader, rested: true },
    {
      hand: [KILLER],
      characters: o.chars,
      ...(o.don ? { costArea: { active: o.don, rested: 0 } } : {}),
    },
  );
  playId(g, KILLER);
  return g;
}

/** Accept the DON!! −1 question and pay it with one active DON!!, then answer a Leader target pick if one is asked. */
function useIt(g: ReturnType<typeof play>, from: 'costActive' | 'costRested' = 'costActive') {
  yes(g, 'p1');
  payDonStrict(g, 1, from);
  if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
}

describe('OP09-064 Killer: [On Play] DON!! −1: set up to 1 of my {Kid Pirates} Leader as active', () => {
  it('a rested {Kid Pirates} Leader is set active, and 1 DON!! went back to the DON!! deck', () => {
    const g = play(L9.kid);
    const before = donSum(g, 'p1');
    expect(before.active + before.rested).toBe(10);
    useIt(g);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    const after = donSum(g, 'p1');
    expect(after.active + after.rested).toBe(9);
    expect(after.deck).toBe(before.deck + 1);
  });

  it('exactly 1 DON!! is returned (DON!! −1), chosen by me: returning a rested one leaves the active ones', () => {
    const g = play(L9.kid);
    const before = donSum(g, 'p1');
    useIt(g, 'costRested');
    const after = donSum(g, 'p1');
    expect(after.active).toBe(before.active);
    expect(after.rested).toBe(before.rested - 1);
  });

  it('declining the cost: the Leader stays rested and no DON!! moves', () => {
    const g = play(L9.kid);
    const before = donSum(g, 'p1');
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(donSum(g, 'p1')).toEqual(before);
  });

  it('only a Leader is set active: a rested {Kid Pirates} Character (another Killer) stays rested', () => {
    const g = play(L9.kid, { chars: [{ card: KILLER, rested: true }] });
    useIt(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.card(at(g, 'p1', 'characters', KILLER, 0)).rested).toBe(true);
  });

  it('a Leader that is not {Kid Pirates} is not set active (Crocodile stays rested); nothing wrong happens', () => {
    const g = play(L9.baroque);
    if (kind(g) === 'optional') no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it("the opponent's Leader is not affected", () => {
    const g = play(L9.kid);
    useIt(g);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });

  it('an active {Kid Pirates} Leader stays active whether or not the cost is used (nothing is rested by this effect)', () => {
    const g = mine(L9.kid, { hand: [KILLER] });
    playId(g, KILLER);
    if (kind(g) === 'optional') no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('DON!! given to the Leader stay on it when it is set active', () => {
    const g = mine(
      { card: L9.kid, rested: true, don: 2 },
      { hand: [KILLER], costArea: { active: 8, rested: 0 } },
    );
    playId(g, KILLER);
    useIt(g, 'costRested');
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.card(g.leader('p1')).don).toBe(2);
  });

  it('the cost is asked before anything changes: the Leader is still rested while the question is open', () => {
    const g = play(L9.kid);
    need(g, 'optional', 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(true);
    act(g, { type: 'optional', accept: false });
  });
});
