/**
 * OP12-084 Emporio.Ivankov (Character, Black, cost 3, 4000, Counter +1000, {Revolutionary Army}).
 *
 * Card text: "[Blocker] ... [On Play] If your Leader has the "Revolutionary Army" type, trash 3 cards
 * from the top of your deck."
 *
 * Rules: CR 10-2-6 ([Blocker]), CR 8-3-2 ([On Play]), a Leader "has the type" when any of its types
 * is that type, a player whose deck reaches 0 cards loses at once (CR 9-2-1-2, rules-digest 274).
 */
import { describe, expect, it } from 'vitest';
import { hasEvent } from '../kit.ts';
import { result } from '../../helpers.ts';
import {
  at,
  atMain,
  attack,
  blockers,
  chars,
  deck,
  hand,
  LDR,
  mine,
  need,
  passBlock,
  playRaw,
  SCN,
  theirs,
  topDeck,
  trash,
} from './kit-op12c.ts';

const ID = 'OP12-084';
const TOP = [SCN.c3, SCN.c4, SCN.c5];

function played(leader: string, deckCards = topDeck([...TOP, SCN.c6])) {
  const g = mine(leader, { hand: [ID], deck: deckCards });
  playRaw(g, ID);
  return g;
}

describe('OP12-084 Emporio.Ivankov: [On Play] with an RA Leader, trash 3 from the top of the deck', () => {
  it('Revolutionary Army Leader: the top 3 cards go to the trash, nothing is asked', () => {
    const g = played(LDR.ra);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([...TOP].sort());
    expect(deck(g)[0]).toBe(SCN.c6);
    expect(deck(g)).toHaveLength(11);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
  });

  it('a Leader with several types, one of them Revolutionary Army (Koala), qualifies', () => {
    const g = played(LDR.koala);
    expect(trash(g)).toEqual([...TOP].sort());
  });

  it('a Leader without the type (Luffy): nothing is trashed', () => {
    const g = played(LDR.luffy);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(SCN.c3);
  });

  it('exactly 3 are trashed, not more (the 4th card stays on top)', () => {
    const g = played(LDR.ra);
    expect(trash(g)).toHaveLength(3);
    expect(deck(g)[0]).toBe(SCN.c6);
  });

  it('the trashed cards are not revealed or added anywhere else', () => {
    const g = played(LDR.ra);
    for (const c of TOP) expect(hasEvent(g, 'CardRevealed', { card: c })).toBe(false);
    expect(hand(g)).toEqual([]);
  });

  it('with only 2 cards in the deck both are trashed, and emptying the deck loses the game (CR 9-2-1-2)', () => {
    const g = played(LDR.ra, [SCN.c3, SCN.c4]);
    expect(trash(g)).toEqual([SCN.c3, SCN.c4].sort());
    expect(deck(g)).toEqual([]);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('has [Blocker]', () => {
    const g = played(LDR.luffy);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('it can block: the attack is redirected onto it and my Life is untouched', () => {
    const g = theirs(LDR.luffy, { characters: [ID] }, { characters: [SCN.c3] });
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(g.life('p1')).toBe(4);
  });

  it('a rested Ivankov cannot block, and an [On Play] is not repeated by blocking', () => {
    const g = theirs(
      LDR.ra,
      { characters: [{ card: ID, rested: true }], deck: topDeck(TOP) },
      { characters: [SCN.c3] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([]);
    passBlock(g);
    expect(trash(g)).toEqual([]);
  });
});
