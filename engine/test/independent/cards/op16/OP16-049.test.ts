/**
 * OP16-049 Portgas.D.Ace (Character, Blue, cost 3, 0 power, Counter +1000, {Whitebeard Pirates}/{Impel Down}).
 *
 * Card text: "[Activate:Main] You may rest this Character: Draw 1 card."
 *
 * Rules: CR 8-3-1 (a rest cost), CR 4-5-3 (draw X), CR 1-2-1-1-2 / RD 3 (0 cards in the deck is a
 * defeat), CR 3-7-4 (summoning sickness is about attacking), CR 10-2-2 ([Activate: Main] is a Main
 * Phase action of the turn player).
 */
import { describe, expect, it } from 'vitest';
import { result } from '../../helpers.ts';
import {
  abilities,
  at,
  deck,
  fill,
  hand,
  kind,
  LDR,
  mine,
  rested,
  theirs,
  useAbility,
  BLUE,
  SCN,
  n,
} from './kit-op16b.ts';

const ACE = 'OP16-049';

describe('OP16-049 Portgas.D.Ace: [Activate:Main] rest this: draw 1 card', () => {
  it('draws exactly 1 card, from the top of the deck', () => {
    const g = mine(LDR.luffy, { characters: [ACE], deck: [SCN.c3, ...fill(BLUE, 9)] });
    useAbility(g, at(g, 'p1', 'characters', ACE));
    expect(hand(g)).toEqual([SCN.c3]);
    expect(deck(g)).toHaveLength(9);
    expect(kind(g)).toBe('main');
  });

  it('the cost rests Ace', () => {
    const g = mine(LDR.luffy, { characters: [ACE] });
    useAbility(g, at(g, 'p1', 'characters', ACE));
    expect(rested(g, at(g, 'p1', 'characters', ACE))).toBe(true);
  });

  it('it cannot be activated twice: the second activation needs an active Ace', () => {
    const g = mine(LDR.luffy, { characters: [ACE] });
    useAbility(g, at(g, 'p1', 'characters', ACE));
    expect(abilities(g, at(g, 'p1', 'characters', ACE))).toEqual([]);
    expect(n(g, 'p1', 'hand')).toBe(1);
  });

  it('a rested Ace (placed rested) offers no activation', () => {
    const g = mine(LDR.luffy, { characters: [{ card: ACE, rested: true }] });
    expect(abilities(g, at(g, 'p1', 'characters', ACE))).toEqual([]);
  });

  it('it can be activated the turn it was played: resting is not attacking', () => {
    const g = mine(LDR.luffy, { characters: [{ card: ACE, playedThisTurn: true }] });
    expect(abilities(g, at(g, 'p1', 'characters', ACE))).toHaveLength(1);
    useAbility(g, at(g, 'p1', 'characters', ACE));
    expect(n(g, 'p1', 'hand')).toBe(1);
  });

  it('two Aces each draw 1 (no per-name limit)', () => {
    const g = mine(LDR.luffy, { characters: [ACE, ACE] });
    useAbility(g, at(g, 'p1', 'characters', ACE, 0));
    useAbility(g, at(g, 'p1', 'characters', ACE, 1));
    expect(n(g, 'p1', 'hand')).toBe(2);
    expect(deck(g)).toHaveLength(13);
  });

  it('it is a Main Phase action: not offered in the opponent’s Main Phase', () => {
    const g = theirs(LDR.luffy, { characters: [ACE] }, {});
    expect(abilities(g, at(g, 'p1', 'characters', ACE))).toEqual([]);
  });

  it('must-not-happen: it draws for me only: the opponent’s hand and deck are unchanged', () => {
    const g = mine(LDR.luffy, { characters: [ACE] });
    useAbility(g, at(g, 'p1', 'characters', ACE));
    expect(n(g, 'p2', 'hand')).toBe(0);
    expect(deck(g, 'p2')).toHaveLength(15);
  });

  it('CR 1-2-1-1-2: drawing the last card of the deck leaves 0 cards and loses the game', () => {
    const g = mine(LDR.luffy, { characters: [ACE], deck: [SCN.c3] });
    useAbility(g, at(g, 'p1', 'characters', ACE));
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('with 2 cards in the deck the draw is safe and 1 card is left', () => {
    const g = mine(LDR.luffy, { characters: [ACE], deck: [SCN.c3, SCN.c4] });
    useAbility(g, at(g, 'p1', 'characters', ACE));
    expect(result(g)).toBeNull();
    expect(deck(g)).toEqual([SCN.c4]);
  });
});
