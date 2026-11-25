/**
 * OP09-035 Portgas.D.Ace (Character, Green, cost 5, 5000, Counter +2000, {Whitebeard Pirates}/{ODYSSEY}).
 *
 * Card text: "[On Play] If you have 2 or more rested Characters, rest up to 1 of your opponent's
 * Characters with a cost of 5 or less."
 *
 * Rules: CR 8-4-4 ("up to"), a colon-less "If" is an effect condition, a Character is played active
 * (CR 3-7-3), so Ace itself is never one of the "rested Characters" when his effect checks.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  at,
  atMain,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playId,
  reachablePickSets,
  V9,
} from './kit-op09b.ts';

const ACE = 'OP09-035';
const rested2 = [
  { card: V9.c4, rested: true },
  { card: V9.c2, rested: true },
];

function play(own: PlayerSpec['characters'], opp: string[]) {
  const g = mine(L9.neutral, { hand: [ACE], characters: own }, { characters: opp });
  playId(g, ACE);
  return g;
}

describe('OP09-035 Portgas.D.Ace: [On Play] with 2+ rested Characters, rest up to 1 opposing Character with cost 5 or less', () => {
  it('2 rested Characters: offers exactly the opposing Characters with cost 5 or less, and the pick is rested', () => {
    const g = play(rested2, [V9.c3, V9.c5, V9.c6, V9.c7]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c3, V9.c5].sort());
    pickInst(g, [at(g, 'p2', 'characters', V9.c5)]);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', V9.c5)).rested).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', V9.c3)).rested).toBe(false);
    expect(g.card(at(g, 'p2', 'characters', V9.c6)).rested).toBe(false);
  });

  it('boundary: cost 5 is a legal target and cost 6 is not', () => {
    const g = play(rested2, [V9.c5, V9.c6]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c5]);
  });

  it('boundary: only 1 rested Character: the condition fails and nothing is asked', () => {
    const g = play([{ card: V9.c4, rested: true }, V9.c2], [V9.c3, V9.c5]);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', V9.c3)).rested).toBe(false);
    expect(g.card(at(g, 'p2', 'characters', V9.c5)).rested).toBe(false);
  });

  it('Ace himself is played active and does not count: no rested Character at all means nothing happens', () => {
    const g = play([], [V9.c3]);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', V9.c3)).rested).toBe(false);
  });

  it('3 rested Characters also satisfy "2 or more"', () => {
    const g = play(
      [
        { card: V9.c4, rested: true },
        { card: V9.c2, rested: true },
        { card: V9.c5, rested: true },
      ],
      [V9.c3],
    );
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c3]);
  });

  it("the opponent's rested Characters do not count as mine", () => {
    const g = mine(
      L9.neutral,
      { hand: [ACE], characters: [{ card: V9.c4, rested: true }] },
      {
        characters: [
          { card: V9.c3, rested: true },
          { card: V9.c5, rested: true },
        ],
      },
    );
    playId(g, ACE);
    expect(atMain(g)).toBe(true);
  });

  it('"up to 1": choosing nothing is allowed and rests nothing', () => {
    const g = play(rested2, [V9.c3, V9.c5]);
    need(g, 'choose', 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', V9.c3)).rested).toBe(false);
    expect(g.card(at(g, 'p2', 'characters', V9.c5)).rested).toBe(false);
  });

  it('rests at most 1 Character even when several qualify', () => {
    const g = play(rested2, [V9.c3, V9.c5, V9.c4]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with the condition met but no opposing Character of cost 5 or less, nothing is rested (a prompt, if any, has no candidate)', () => {
    const g = play(rested2, [V9.c6, V9.c7]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', V9.c6)).rested).toBe(false);
  });

  it('must not rest my own Characters or the opposing Leader', () => {
    const g = play(rested2, [V9.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c3]);
    pickInst(g, [at(g, 'p2', 'characters', V9.c3)]);
    expect(g.card(g.leader('p2')).rested).toBe(false);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });
});
