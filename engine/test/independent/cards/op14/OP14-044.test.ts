/**
 * OP14-044 Edward.Newgate (Character, Blue, cost 8, 8000, Counter +1000, {The Four Emperors}/{Whitebeard Pirates}).
 *
 * Card text: "[Blocker]
 * [On Play] Reveal 1 card from the top of your deck. If that card's type includes "Whitebeard
 * Pirates", draw 2 cards and trash 1 card from your hand."
 *
 * Rules: CR 2-4-3-1 (a quoted type matches every type that contains the text, for example
 * "Former Whitebeard Pirates" and "Whitebeard Pirates Allies"), CR 11-2-1 (revealed cards are
 * shown), CR 10-1-4 ([Blocker]), CR 8-3-3 (text after a failed "if" does not resolve).
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  blockers,
  C14,
  choices,
  deck,
  hand,
  hasEvent,
  inst,
  kw,
  L14,
  mine,
  need,
  offeredIds,
  pickInst,
  put,
  theirs,
  trash,
} from './kit-op14b.ts';

const NEW = 'OP14-044';

function start(top: CardId[], handExtra: CardId[] = [C14.sai]) {
  return mine(L14.luffy, { hand: [NEW, ...handExtra], deck: [...top, BLUE, BLUE, BLUE, BLUE] });
}

describe('OP14-044 Edward.Newgate: [Blocker]; [On Play] reveal the top card; if its type includes "Whitebeard Pirates", draw 2 and trash 1', () => {
  it('top card {Whitebeard Pirates}: it is revealed, 2 cards are drawn (the revealed one first), then 1 hand card is trashed', () => {
    const g = start([C14.kingdew, C14.thatch]);
    put(g, NEW);
    expect(hasEvent(g, 'CardRevealed', { card: C14.kingdew })).toBe(true);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C14.kingdew, C14.sai, C14.thatch].sort());
    pickInst(g, [inst(g, 'p1', 'hand', C14.sai)]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C14.kingdew, C14.thatch].sort());
    expect(trash(g)).toEqual([C14.sai]);
    expect(deck(g)).toHaveLength(4);
  });

  it('the trashed card may be one of the two just drawn', () => {
    const g = start([C14.kingdew, C14.thatch]);
    put(g, NEW);
    pickInst(g, [inst(g, 'p1', 'hand', C14.thatch)]);
    expect(hand(g)).toEqual([C14.kingdew, C14.sai].sort());
    expect(trash(g)).toEqual([C14.thatch]);
  });

  it('exactly 1 card is trashed, not 2 and not 0 (choose offers a single pick)', () => {
    const g = start([C14.kingdew, BLUE]);
    put(g, NEW);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: choices(g)[0]! });
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toHaveLength(1);
    expect(hand(g)).toHaveLength(2);
  });

  it('top card of another type (Mohji, {Buggy Pirates}): revealed, nothing drawn, nothing trashed, and it stays on top', () => {
    const g = start([BLUE]);
    put(g, NEW);
    expect(atMain(g)).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: BLUE })).toBe(true);
    expect(hand(g)).toEqual([C14.sai]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(5);
    expect(deck(g)[0]).toBe(BLUE);
  });

  it('"type includes": {Whitebeard Pirates Allies} (Doma) counts', () => {
    const g = start([C14.doma, BLUE]);
    put(g, NEW);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(C14.doma);
    pickInst(g, [inst(g, 'p1', 'hand', C14.sai)]);
    expect(hand(g)).toEqual([C14.doma, BLUE].sort());
  });

  it('"type includes": {Former Whitebeard Pirates} (Marco) counts', () => {
    const g = start([C14.marco, BLUE]);
    put(g, NEW);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', C14.sai)]);
    expect(hand(g)).toEqual([C14.marco, BLUE].sort());
  });

  it('a top card whose types do not contain the text ({Giant}/{New Giant Pirates}) draws nothing', () => {
    const g = start([C14.hajrudin]);
    put(g, NEW);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C14.sai]);
  });

  it('with an otherwise empty hand: draws 2, then trashes 1 of them', () => {
    const g = start([C14.kingdew, C14.thatch], []);
    put(g, NEW);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C14.kingdew, C14.thatch].sort());
    pickInst(g, [inst(g, 'p1', 'hand', C14.kingdew)]);
    expect(hand(g)).toEqual([C14.thatch]);
    expect(trash(g)).toEqual([C14.kingdew]);
  });

  it('has [Blocker]', () => {
    const g = start([BLUE]);
    put(g, NEW);
    expect(kw(g, inst(g, 'p1', 'characters', NEW))).toContain('Blocker');
  });

  it('can block an attack on the Leader', () => {
    const g = theirs(L14.luffy, { characters: [NEW] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', NEW)]);
    passBlock(g);
  });
});
