/**
 * OP15-081 Sanji (Character, Black, cost 1, 2000, Counter +2000, {Straw Hat Crew}).
 *
 * Card text: "[On Play] If your Leader has the {Straw Hat Crew} type, trash 5 cards from the top of your deck."
 *
 * Rules: CR 8-3-3 (a failed "if" stops the text), CR 8-1-2 (no "may": mandatory), CR 4-4 style milling
 * (cards go from the top of the deck to the trash), CR 1-2-1-1-2 (an empty deck is a defeat, so decks here
 * keep more than 5 cards).
 * Scenery: ST01-001 Monkey.D.Luffy ({Straw Hat Crew}/{Supernovas}), ST09-001 Yamato ({Land of Wano}).
 */
import { describe, expect, it } from 'vitest';
import { atMain, BLUE, deck, hand, kind, LD15, mine, playRaw, SCN, trash } from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SANJI = 'OP15-081';
const TOP = [SCN.c2, SCN.c3, SCN.c4, SCN.c5, SCN.c6, SCN.c7, SCN.c8, BLUE, BLUE];

function start(leader: string, deckCards: string[] = TOP, p2Leader?: string): TestGame {
  return mine(leader, { hand: [SANJI], deck: deckCards }, {}, p2Leader);
}

describe('OP15-081 Sanji: [On Play] if my Leader has {Straw Hat Crew}, trash 5 cards from the top of my deck', () => {
  it('with a {Straw Hat Crew} Leader: the top 5 cards go to the trash, in that order, no question asked', () => {
    const g = start(LD15.shc);
    playRaw(g, SANJI);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SCN.c2, SCN.c3, SCN.c4, SCN.c5, SCN.c6].sort());
    expect(deck(g)).toEqual([SCN.c7, SCN.c8, BLUE, BLUE]);
  });

  it('exactly 5: the 6th card is untouched and the cards do not go to hand', () => {
    const g = start(LD15.shc);
    playRaw(g, SANJI);
    expect(deck(g)[0]).toBe(SCN.c7);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toHaveLength(5);
  });

  it('with a Leader without the type: nothing is trashed', () => {
    const g = start(LD15.neutral);
    playRaw(g, SANJI);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(9);
  });

  it('only my Leader counts: an opposing {Straw Hat Crew} Leader does not', () => {
    const g = start(LD15.neutral, TOP, LD15.shc);
    playRaw(g, SANJI);
    expect(trash(g)).toEqual([]);
  });

  it('a Leader with {Straw Hat Crew} among several types qualifies (OP15-002 Lucy has none; OP10-042 Usopp does)', () => {
    const lucy = start(LD15.lucy);
    playRaw(lucy, SANJI);
    expect(trash(lucy)).toEqual([]);
    const usopp = start('OP10-042');
    playRaw(usopp, SANJI);
    expect(trash(usopp)).toHaveLength(5);
  });

  it('with a 6-card deck exactly 5 are trashed and 1 remains (no loss)', () => {
    const g = start(LD15.shc, [SCN.c2, SCN.c3, SCN.c4, SCN.c5, SCN.c6, SCN.c7]);
    playRaw(g, SANJI);
    expect(deck(g)).toEqual([SCN.c7]);
    expect(kind(g)).toBe('main');
  });

  it('Sanji himself stays on the field and costs 1', () => {
    const g = start(LD15.shc);
    playRaw(g, SANJI);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SANJI]);
    expect(trash(g)).not.toContain(SANJI);
  });

  it('must not: a Sanji already on the field does not trash anything when the game starts the turn', () => {
    const g = mine(LD15.shc, { characters: [SANJI], deck: TOP });
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(9);
  });

  it('two Sanjis played in a row trash 5 each (10 in total)', () => {
    const g = mine(LD15.shc, {
      hand: [SANJI, SANJI],
      deck: [...TOP, SCN.c1, SCN.c1, SCN.c1, SCN.c1, SCN.c1, SCN.c1],
    });
    playRaw(g, SANJI);
    playRaw(g, SANJI);
    expect(trash(g)).toHaveLength(10);
    expect(deck(g)).toHaveLength(5);
  });
});
