/**
 * ST22-006 Jozu (Character, Blue, cost 7, 8000, Counter +1000, {Whitebeard Pirates}).
 *
 * Card text: "[On Play] Reveal 1 card from the top of your deck. If that card's type includes
 * "Whitebeard Pirates", draw 2 cards and trash 1 card from your hand."
 *
 * Rules: CR 11-2 (reveal), RL-44 (the revealed card stays on top while revealed), M4b-5 (a "Then"
 * after a failed "If" does not resolve; here the second action belongs to the same "If").
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  choices,
  deck,
  hand,
  hasEvent,
  kind,
  LB,
  mine,
  need,
  offeredIds,
  pickCards,
  playRaw,
  SL,
  trash,
} from './kit-lfb.ts';

const ID = 'ST22-006';
const MISS = SL.miss;
const PAD = Array.from({ length: 10 }, () => MISS);

function play(top: string[], handExtra: string[] = []) {
  const g = mine(LB.neutral, { hand: [ID, ...handExtra], deck: [...top, ...PAD] });
  playRaw(g, ID);
  return g;
}

describe('ST22-006 Jozu: [On Play] reveal the top card; if Whitebeard Pirates, draw 2 and trash 1 from hand', () => {
  it('a hit draws 2 (the revealed card first), then asks for 1 card from the hand to trash', () => {
    const g = play([SL.wb4, SL.c2, SL.c4], [SL.c1]);
    need(g, 'choose', 'p1');
    expect(hand(g)).toEqual([SL.c1, SL.wb4, SL.c2].sort());
    pickCards(g, [SL.c1]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SL.c1]);
    expect(hand(g)).toEqual([SL.wb4, SL.c2].sort());
    expect(deck(g)).toHaveLength(11);
  });

  it('the card trashed may be one just drawn, including the revealed card', () => {
    const g = play([SL.wb4, SL.c2, SL.c4], [SL.c1]);
    expect(offeredIds(g)).toEqual([SL.c1, SL.wb4, SL.c2].sort());
    pickCards(g, [SL.wb4]);
    expect(trash(g)).toEqual([SL.wb4]);
    expect(hand(g)).toEqual([SL.c1, SL.c2].sort());
  });

  it('with an empty hand otherwise, the 2 drawn cards are the only candidates', () => {
    const g = play([SL.wb4, SL.c2, SL.c4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SL.wb4, SL.c2].sort());
    pickCards(g, [SL.c2]);
    expect(hand(g)).toEqual([SL.wb4]);
    expect(trash(g)).toEqual([SL.c2]);
  });

  it('exactly 1 card is trashed (not "up to"): the pick cannot be skipped', () => {
    const g = play([SL.wb4, SL.c2, SL.c4], [SL.c1]);
    need(g, 'choose', 'p1');
    expect(choices(g).length).toBeGreaterThan(0);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('a miss: nothing is drawn, nothing is trashed, no prompt, and the card stays on top', () => {
    const g = play([SL.c2, SL.wb4, SL.c4], [SL.c1]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SL.c1]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)[0]).toBe(SL.c2);
    expect(deck(g)).toHaveLength(13);
  });

  it('"type including": a Former or Allies type is a hit', () => {
    const a = play([SL.former3, SL.c2]);
    need(a, 'choose', 'p1');
    expect(hand(a)).toEqual([SL.former3, SL.c2].sort());
    const b = play([SL.allies6, SL.c2]);
    need(b, 'choose', 'p1');
    expect(hand(b)).toEqual([SL.allies6, SL.c2].sort());
  });

  it('only the top card counts: a Whitebeard Pirates card second is a miss', () => {
    const g = play([MISS, SL.wb4, SL.wb5]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([]);
  });

  it('the top card is revealed on a hit and on a miss (CR 11-2-1)', () => {
    const hit = play([SL.wb4, SL.c2]);
    expect(hasEvent(hit, 'CardRevealed', { card: SL.wb4 })).toBe(true);
    const miss = play([SL.c2, SL.wb4]);
    expect(hasEvent(miss, 'CardRevealed', { card: SL.c2 })).toBe(true);
  });

  it('the trash is part of the hit: nothing in hand is trashed on a miss even with a full hand', () => {
    const g = play([SL.c2], [SL.c1, SL.c4, SL.wb4]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SL.c1, SL.c4, SL.wb4].sort());
    expect(trash(g)).toEqual([]);
  });
});
