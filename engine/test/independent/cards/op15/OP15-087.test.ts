/**
 * OP15-087 Nico Robin (Character, Black, cost 5, 7000, no Counter, {Straw Hat Crew}).
 *
 * Card text:
 *   "If you have 10 or more cards in your trash, this Character gains [Blocker].
 *    [On Play] Draw 2 cards and trash 2 cards from your hand."
 *
 * Rules relied on: CR 10-1-4 ([Blocker]), permanent effects are continuously re-evaluated (CR 8-1-3-2),
 * "draw" then "trash from hand" are two steps ("and"), the trash count includes cards just trashed.
 */
import { describe, expect, it } from 'vitest';
import {
  anyOrder,
  at,
  atMain,
  attack,
  blockers,
  chars,
  deck,
  deckTop,
  hand,
  junk,
  kind,
  kw,
  LD15,
  mine,
  need,
  pickAny,
  playIt,
  SC15,
  theirs,
  trash,
} from './kit-op15c.ts';

const ROBIN = 'OP15-087';

describe('OP15-087 Nico Robin: conditional [Blocker]', () => {
  const board = (trashN: number) =>
    theirs(LD15.neutral, { characters: [ROBIN], trash: junk(trashN) }, { characters: [SC15.red3] });

  it('10 cards in the trash (the boundary): Robin has [Blocker] and may block', () => {
    const g = board(10);
    const r = at(g, 'p1', 'characters', ROBIN);
    expect(kw(g, r)).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([r]);
  });

  it('9 cards in the trash: no [Blocker], no block is offered', () => {
    const g = board(9);
    const r = at(g, 'p1', 'characters', ROBIN);
    expect(kw(g, r)).not.toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('more than 10 cards in the trash still has [Blocker]', () => {
    const g = board(14);
    expect(kw(g, at(g, 'p1', 'characters', ROBIN))).toContain('Blocker');
  });

  it('a rested Robin cannot block even with 10 cards in the trash', () => {
    const g = theirs(
      LD15.neutral,
      { characters: [{ card: ROBIN, rested: true }], trash: junk(10) },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });
});

describe('OP15-087 Nico Robin [On Play]', () => {
  const D1 = SC15.red4;
  const D2 = SC15.red5;
  const start = (handCards: string[], trashCards: string[] = []) => {
    const g = mine(LD15.neutral, {
      hand: [ROBIN, ...handCards],
      deck: deckTop([D1, D2]),
      trash: trashCards,
    });
    playIt(g, ROBIN);
    return g;
  };

  it('draws exactly 2, then trashes 2 cards of my choice from the whole hand (drawn cards included)', () => {
    const g = start([SC15.red2, SC15.red3]);
    need(g, 'choose', 'p1');
    pickAny(g, [SC15.red2, D1]);
    anyOrder(g);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SC15.red2, D1].sort());
    expect(hand(g)).toEqual([SC15.red3, D2].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('with an otherwise empty hand: draws 2, then both are trashed', () => {
    const g = start([]);
    if (kind(g) === 'choose') pickAny(g, [D1, D2]);
    anyOrder(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([D1, D2].sort());
  });

  it('the trash is counted after the cards are trashed: 8 + 2 = 10 gives [Blocker] at once', () => {
    const g = start([SC15.red2, SC15.red3], junk(8));
    pickAny(g, [SC15.red2, SC15.red3]);
    anyOrder(g);
    expect(trash(g)).toHaveLength(10);
    expect(kw(g, at(g, 'p1', 'characters', ROBIN))).toContain('Blocker');
  });

  it('with 7 in the trash the 2 trashed cards make 9: still no [Blocker]', () => {
    const g = start([SC15.red2, SC15.red3], junk(7));
    pickAny(g, [SC15.red2, SC15.red3]);
    anyOrder(g);
    expect(trash(g)).toHaveLength(9);
    expect(kw(g, at(g, 'p1', 'characters', ROBIN))).not.toContain('Blocker');
    expect(chars(g)).toEqual([ROBIN]);
  });
});
