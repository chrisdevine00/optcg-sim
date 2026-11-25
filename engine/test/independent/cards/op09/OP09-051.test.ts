/**
 * OP09-051 Buggy (Character, Blue, cost 10, 12000, no Counter, {The Four Emperors}/{Cross Guild}).
 *
 * Card text: "[On Play] Place up to 1 of your opponent's Characters at the bottom of the owner's deck.
 * Then, if you do not have 5 Characters with a cost of 5 or more, place this Character at the bottom
 * of the owner's deck."
 *
 * Rules: CR 8-4-4 ("up to"), CR 3-7-6 (at most 5 Characters), so "5 Characters with a cost of 5 or
 * more" means every Character slot holds one, Buggy included (cost 10). Not asserted (open question
 * M4b-5 / CR 4-10-2): whether the second sentence still resolves when no opposing Character was
 * placed and the check fails.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  chars,
  deck,
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

const BUGGY = 'OP09-051';

/** Four cost-5-or-more Characters: with Buggy every slot holds one. */
const FOUR_BIG = [V9.c5, V9.c6, V9.c7, V9.c8];

function play(own: string[], opp: string[]) {
  const g = mine(L9.neutral, { hand: [BUGGY], characters: own }, { characters: opp });
  playId(g, BUGGY);
  return g;
}

describe('OP09-051 Buggy: [On Play] place up to 1 opposing Character at the bottom of its deck; then, unless I have 5 Characters of cost 5 or more, place Buggy at the bottom of my deck', () => {
  it("with 4 other cost-5+ Characters (5 with Buggy): the opposing pick goes to the bottom of its owner's deck and Buggy stays", () => {
    const g = play(FOUR_BIG, [V9.c3, V9.c4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c3, V9.c4].sort());
    pickInst(g, [at(g, 'p2', 'characters', V9.c3)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toHaveLength(5);
    expect(chars(g)).toContain(BUGGY);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V9.c4]);
    expect(g.zone('p2', 'deck')).toHaveLength(16);
    expect(g.zone('p2', 'deck')[15]!.card).toBe(V9.c3);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });

  it('boundary: only 3 other cost-5+ Characters and one of cost 4 (4 with Buggy): Buggy goes to the bottom of my deck', () => {
    const g = play([V9.c5, V9.c6, V9.c7, V9.c4], [V9.c3]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', V9.c3)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).not.toContain(BUGGY);
    expect(chars(g)).toHaveLength(4);
    expect(deck(g).at(-1)).toBe(BUGGY);
    expect(deck(g)).toHaveLength(16);
    expect(trash(g)).toEqual([]);
  });

  it('boundary: a cost-5 Character counts ("5 or more"): 4 others of exactly cost 5 or more keep Buggy', () => {
    const g = play([V9.c5, V9.c5, V9.c5, V9.c5], [V9.c3]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', V9.c3)]);
    expect(chars(g)).toContain(BUGGY);
  });

  it('Buggy alone (1 Character of cost 5 or more): he is placed at the bottom of my deck', () => {
    const g = play([], [V9.c3]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', V9.c3)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(deck(g).at(-1)).toBe(BUGGY);
  });

  it('opposing Characters of cost 5 or more do not count for me', () => {
    const g = play([V9.c5, V9.c6], [V9.c7, V9.c8, V9.c5]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', V9.c7)]);
    expect(chars(g)).not.toContain(BUGGY);
    expect(deck(g).at(-1)).toBe(BUGGY);
  });

  it('the opposing target has no cost limit: a cost-8 Character is offered; my own Characters are not', () => {
    const g = play(FOUR_BIG, [V9.c8]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c8]);
  });

  it('"up to 1": choosing nothing places no opposing Character; with 5 cost-5+ Characters Buggy stays', () => {
    const g = play(FOUR_BIG, [V9.c3]);
    need(g, 'choose', 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(chars(g)).toContain(BUGGY);
  });

  it('places at most 1 opposing Character', () => {
    const g = play(FOUR_BIG, [V9.c3, V9.c4, V9.c5]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with no opposing Character and 5 cost-5+ Characters, nothing is lost: Buggy stays and the game moves on', () => {
    const g = play(FOUR_BIG, []);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toContain(BUGGY);
  });

  it('the placed Character is not trashed and not returned to hand: it is only moved to the bottom of the opposing deck', () => {
    const g = play(FOUR_BIG, [V9.c3]);
    pickInst(g, [at(g, 'p2', 'characters', V9.c3)]);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });
});
