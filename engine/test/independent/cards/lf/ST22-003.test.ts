/**
 * ST22-003 Edward.Newgate (Character, Blue, cost 9, 10000, [Double Attack], {The Four Emperors}/
 * {Whitebeard Pirates}).
 *
 * Card text: "[Double Attack] (This card deals 2 damage.)
 * [On Play] Reveal 1 card from the top of your deck. If that card's type includes "Whitebeard
 * Pirates", draw 2 cards."
 *
 * Rules: CR 10-1-3 ([Double Attack]), CR 11-2 (reveal), RL-44 (the revealed card stays on top while
 * revealed; on a hit the draw takes it).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  attack,
  deck,
  hand,
  hasEvent,
  kind,
  LB,
  mine,
  noDefence,
  passBlock,
  playRaw,
  SL,
  trash,
} from './kit-lfb.ts';

const ID = 'ST22-003';
const MISS = SL.miss;
const PAD = Array.from({ length: 10 }, () => MISS);

function play(top: string[], handExtra: string[] = []) {
  const g = mine(LB.neutral, { hand: [ID, ...handExtra], deck: [...top, ...PAD] });
  playRaw(g, ID);
  return g;
}

describe('ST22-003 Edward.Newgate: [On Play] reveal the top card; if Whitebeard Pirates, draw 2', () => {
  it('a Whitebeard Pirates top card: draw exactly 2 (the revealed card is the first of them)', () => {
    const g = play([SL.wb4, SL.c2, SL.c4]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SL.wb4, SL.c2].sort());
    expect(deck(g)).toHaveLength(11);
    expect(deck(g)[0]).toBe(SL.c4);
  });

  it('a non-matching top card: nothing is drawn and the card stays on top', () => {
    const g = play([SL.c2, SL.wb4, SL.c4]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(13);
    expect(deck(g)[0]).toBe(SL.c2);
  });

  it('"type including": a Former or Allies type counts', () => {
    const a = play([SL.former3, SL.c2]);
    expect(hand(a)).toEqual([SL.former3, SL.c2].sort());
    const b = play([SL.allies6, SL.c2]);
    expect(hand(b)).toEqual([SL.allies6, SL.c2].sort());
  });

  it('only the top card is looked at: a matching second card does not count', () => {
    const g = play([MISS, SL.wb4, SL.wb5]);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(MISS);
  });

  it('a different Red-Haired type does not match', () => {
    const g = play([SL.rhp4, SL.wb4]);
    expect(hand(g)).toEqual([]);
  });

  it('the top card is revealed whether or not it matches (CR 11-2-1)', () => {
    const hit = play([SL.wb4, SL.c2]);
    expect(hasEvent(hit, 'CardRevealed', { card: SL.wb4 })).toBe(true);
    const miss = play([SL.c2, SL.wb4]);
    expect(hasEvent(miss, 'CardRevealed', { card: SL.c2 })).toBe(true);
  });

  it('the effect is mandatory: no prompt is asked and nothing is trashed', () => {
    const g = play([SL.wb4, SL.c2], [SL.c4]);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([SL.c4, SL.wb4, SL.c2].sort());
  });

  it('has [Double Attack] and, attacking the Leader, deals 2 damage', () => {
    const g = mine(LB.neutral, { characters: [ID] }, { life: [MISS, MISS, MISS, MISS] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Double Attack');
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(2);
  });

  it('must not happen: on the turn it is played it cannot attack (no [Rush])', () => {
    const g = play([MISS, MISS]);
    const edward = g.find('p1', 'characters', ID);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === edward)).toBe(false);
    expect(passBlock).toBeTypeOf('function');
  });
});
