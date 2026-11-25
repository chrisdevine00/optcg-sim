/**
 * OP09-036 Monkey.D.Luffy (Character, Green, cost 5, 6000, Counter +1000, {Straw Hat Crew}/{Supernovas}/{ODYSSEY}).
 *
 * Card text: "[On Play] If you have 2 or more rested Characters, rest up to 1 of your opponent's DON!!
 * cards or Characters with a cost of 6 or less."
 *
 * Rules: CR 8-4-4 ("up to"), a colon-less "If" is an effect condition, only an active DON!! card
 * can be rested, a Character is played active (so Luffy himself never counts as rested).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act } from '../../helpers.ts';
import {
  at,
  atMain,
  canFinish,
  choices,
  donChoices,
  donSum,
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

const LUFFY = 'OP09-036';
const rested2 = [
  { card: V9.c4, rested: true },
  { card: V9.c2, rested: true },
];

function play(own: PlayerSpec['characters'], opp: string[], oppDon = { active: 10, rested: 0 }) {
  const g = mine(
    L9.neutral,
    { hand: [LUFFY], characters: own },
    { characters: opp, costArea: oppDon },
  );
  playId(g, LUFFY);
  return g;
}

describe('OP09-036 Monkey.D.Luffy: [On Play] with 2+ rested Characters, rest up to 1 opposing DON!! card or Character with cost 6 or less', () => {
  it('2 rested Characters: offers the opposing Characters with cost 6 or less and the opposing active DON!!; resting a Character works', () => {
    const g = play(rested2, [V9.c5, V9.c6, V9.c7]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c5, V9.c6].sort());
    expect(donChoices(g).length).toBeGreaterThan(0);
    pickInst(g, [at(g, 'p2', 'characters', V9.c6)]);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', V9.c6)).rested).toBe(true);
    expect(donSum(g, 'p2')).toMatchObject({ active: 10, rested: 0 });
  });

  it('resting a DON!! card instead: exactly one active DON!! of the opponent becomes rested and no Character does', () => {
    const g = play(rested2, [V9.c5]);
    need(g, 'choose', 'p1');
    const don = donChoices(g)[0]!;
    act(g, { type: 'pick', choice: don });
    if (kind(g) === 'choose' && canFinish(g) && choices(g).length === 0) act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(donSum(g, 'p2')).toMatchObject({ active: 9, rested: 1 });
    expect(g.card(at(g, 'p2', 'characters', V9.c5)).rested).toBe(false);
  });

  it('boundary: cost 6 is a legal target and cost 7 is not', () => {
    const g = play(rested2, [V9.c6, V9.c7]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c6]);
  });

  it('boundary: only 1 rested Character: nothing is asked and nothing is rested', () => {
    const g = play([{ card: V9.c4, rested: true }, V9.c2], [V9.c5]);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', V9.c5)).rested).toBe(false);
    expect(donSum(g, 'p2')).toMatchObject({ active: 10, rested: 0 });
  });

  it('Luffy himself is played active and does not count: with 1 rested Character and Luffy, the condition fails', () => {
    const g = play([{ card: V9.c4, rested: true }], [V9.c5]);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', V9.c5)).rested).toBe(false);
  });

  it('"up to 1": choosing nothing is allowed; nothing is rested', () => {
    const g = play(rested2, [V9.c5]);
    need(g, 'choose', 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', V9.c5)).rested).toBe(false);
    expect(donSum(g, 'p2')).toMatchObject({ active: 10, rested: 0 });
  });

  it('rests at most 1 target in total (a Character or a DON!!, never both)', () => {
    const g = play(rested2, [V9.c5, V9.c3]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with no opposing Character in range, a DON!! can still be rested', () => {
    const g = play(rested2, [V9.c7]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    expect(donChoices(g).length).toBeGreaterThan(0);
    act(g, { type: 'pick', choice: donChoices(g)[0]! });
    expect(donSum(g, 'p2')).toMatchObject({ active: 9, rested: 1 });
  });

  it('opposing DON!! that is already rested is not offered; Characters still are', () => {
    const g = play(rested2, [V9.c5], { active: 0, rested: 4 });
    need(g, 'choose', 'p1');
    expect(donChoices(g)).toEqual([]);
    expect(offeredIds(g)).toEqual([V9.c5]);
  });
});
