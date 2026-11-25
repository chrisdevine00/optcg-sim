/**
 * OP09-048 Dracule Mihawk (Character, Blue, cost 6, 7000, no Counter, {Cross Guild}).
 *
 * Card text: "[Blocker]
 * [On Play] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 8-4 (an exact "trash 1" is not "up to": it cannot be skipped).
 * The draw comes first, so a drawn card may be the one trashed.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers, passBlock, result } from '../../helpers.ts';
import {
  at,
  atMain,
  BLUE,
  canFinish,
  choices,
  deck,
  deckTop,
  hand,
  kind,
  kw,
  L9,
  mine,
  need,
  offeredIds,
  pickCards,
  playId,
  reachablePickSets,
  theirs,
  trash,
  V9,
} from './kit-op09b.ts';

const MIHAWK = 'OP09-048';

function play(handExtra: string[], top: string[] = [V9.c1, V9.c5]) {
  const g = mine(L9.neutral, { hand: [MIHAWK, ...handExtra], deck: deckTop(top) });
  playId(g, MIHAWK);
  return g;
}

describe('OP09-048 Dracule Mihawk: [Blocker]; [On Play] draw 2 cards and trash 1 card from your hand', () => {
  it('draws exactly 2 (the top two), then trashes the 1 card I pick from the enlarged hand', () => {
    const g = play([V9.c2, V9.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c1, V9.c2, V9.c3, V9.c5].sort());
    pickCards(g, [V9.c2]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([V9.c1, V9.c3, V9.c5].sort());
    expect(trash(g)).toEqual([V9.c2]);
    expect(deck(g)).toHaveLength(10);
  });

  it('a card just drawn may be the one trashed', () => {
    const g = play([V9.c2]);
    pickCards(g, [V9.c5]);
    expect(hand(g)).toEqual([V9.c1, V9.c2].sort());
    expect(trash(g)).toEqual([V9.c5]);
  });

  it('exactly 1 is trashed: it cannot be skipped and no selection has 2 cards', () => {
    const g = play([V9.c2, V9.c3]);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
    for (const s of reachablePickSets(g)) expect(s.split('+').filter(Boolean)).toHaveLength(1);
  });

  it('with an empty hand otherwise: draws 2 and trashes 1 of them, keeping 1', () => {
    const g = play([]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c1, V9.c5].sort());
    pickCards(g, [V9.c1]);
    expect(hand(g)).toEqual([V9.c5]);
    expect(trash(g)).toEqual([V9.c1]);
  });

  it('the Mihawk just played is on the field, not in hand, and cannot be trashed by this effect', () => {
    const g = play([V9.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(MIHAWK);
    pickCards(g, [V9.c2]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([MIHAWK]);
  });

  it('with exactly 3 cards in the deck 2 are drawn, 1 remains and the game goes on', () => {
    const g = mine(L9.neutral, { hand: [MIHAWK], deck: [V9.c1, V9.c5, V9.c6] });
    playId(g, MIHAWK);
    need(g, 'choose', 'p1');
    pickCards(g, [V9.c1]);
    expect(deck(g)).toHaveLength(1);
    expect(hand(g)).toEqual([V9.c5]);
    expect(result(g)).toBeNull();
  });

  it('RL-26: drawing the last 2 cards of the deck empties it and loses at once, with no trash step', () => {
    const g = mine(L9.neutral, { hand: [MIHAWK], deck: [V9.c1, V9.c5] });
    playId(g, MIHAWK);
    expect(result(g)).toMatchObject({ winner: 'p2' });
    expect(trash(g)).toEqual([]);
  });

  it('does not fire when Mihawk is not played: starting on the field, no draw happens', () => {
    const g = mine(L9.neutral, { characters: [MIHAWK], hand: [V9.c2], deck: deckTop([V9.c1]) });
    expect(hand(g)).toEqual([V9.c2]);
    expect(deck(g)).toHaveLength(11);
    expect(kind(g)).toBe('main');
  });

  it('has [Blocker]', () => {
    const g = mine(L9.neutral, { characters: [MIHAWK] });
    expect(kw(g, at(g, 'p1', 'characters', MIHAWK))).toContain('Blocker');
  });

  it('can block an attack on my Leader', () => {
    const g = theirs(
      L9.neutral,
      { characters: [MIHAWK], deck: [BLUE, BLUE, BLUE] },
      { characters: [V9.c1] },
    );
    attack(g, at(g, 'p2', 'characters', V9.c1), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', MIHAWK)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', MIHAWK) });
    expect(choices(g)).toEqual([]);
    passBlock(g);
  });
});
