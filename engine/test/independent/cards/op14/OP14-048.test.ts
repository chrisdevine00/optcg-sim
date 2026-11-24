/**
 * OP14-048 Shiryu (Character, Blue, cost 8, 10000, {Impel Down}).
 *
 * Card text: "[On Play] Return up to 1 of your opponent's Characters to the owner's hand. Then, trash
 * all cards from your hand."
 *
 * Rules: CR 4-8-1 ("up to" allows 0), CR 3-1-6 (a card that leaves the field is a new card),
 * CR 10-2-14 (Trash moves a card from hand to the trash). There is no "If" on the first sentence,
 * so "Then" is not gated (CR 4-10-1).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  C14,
  canFinish,
  choices,
  choose,
  hand,
  inst,
  kind,
  L14,
  mine,
  need,
  offeredNow,
  put,
  trash,
} from './kit-op14b.ts';

const SHIRYU = 'OP14-048';

function start(p1hand: string[], p2chars: string[], p1chars: string[] = []) {
  return mine(
    L14.luffy,
    { hand: [SHIRYU, ...p1hand], characters: p1chars },
    { characters: p2chars, hand: [C14.sai] },
  );
}

describe('OP14-048 Shiryu: [On Play] return up to 1 opposing Character to hand; then trash all cards from your hand', () => {
  it("returns the chosen opposing Character to its owner's hand (any cost) and trashes my whole hand", () => {
    const g = start([C14.sai, C14.marco, BLUE], [C14.xebec]);
    put(g, SHIRYU);
    need(g, 'choose', 'p1');
    choose(g, [inst(g, 'p2', 'characters', C14.xebec)]);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toEqual([]);
    expect(hand(g, 'p2')).toEqual([C14.sai, C14.xebec].sort());
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([C14.marco, BLUE, C14.sai].sort());
  });

  it("only the opponent's Characters are offered, not mine", () => {
    const g = start([BLUE], [C14.marco], [C14.sai]);
    put(g, SHIRYU);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.marco]);
  });

  it('"up to 1": choosing nothing returns nothing, but the hand is still trashed', () => {
    const g = start([C14.sai, BLUE], [C14.marco]);
    put(g, SHIRYU);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.marco]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([C14.sai, BLUE].sort());
  });

  it('with no opposing Character the hand is still trashed (the "Then" part is not gated)', () => {
    const g = start([C14.sai, BLUE], []);
    put(g, SHIRYU);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      act(g, { type: 'done' });
    }
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([C14.sai, BLUE].sort());
  });

  it('returns at most one Character even when the opponent has two', () => {
    const g = start([BLUE], [C14.marco, C14.kingdew]);
    put(g, SHIRYU);
    choose(g, [inst(g, 'p2', 'characters', C14.marco)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.kingdew]);
  });

  it("trashes every card of a large hand (6 cards) and only my hand, not the opponent's", () => {
    const g = start([C14.sai, C14.marco, C14.kingdew, C14.thatch, BLUE, BLUE], [C14.marco]);
    put(g, SHIRYU);
    need(g, 'choose', 'p1');
    choose(g, [inst(g, 'p2', 'characters', C14.marco)]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toHaveLength(6);
    expect(hand(g, 'p2')).toEqual([C14.sai, C14.marco].sort());
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('with an otherwise empty hand there is nothing to trash and the Main Phase resumes', () => {
    const g = start([], [C14.marco]);
    put(g, SHIRYU);
    need(g, 'choose', 'p1');
    choose(g, [inst(g, 'p2', 'characters', C14.marco)]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([]);
  });

  it('Shiryu itself stays on the field (it is not in the hand when the trash happens)', () => {
    const g = start([BLUE], [C14.marco]);
    put(g, SHIRYU);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SHIRYU]);
    expect(trash(g)).toEqual([BLUE]);
  });

  it('the Leader is not a valid target of the return (only Characters)', () => {
    const g = start([BLUE], [C14.marco]);
    put(g, SHIRYU);
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('the returned Character comes back as a new card: it can be replayed by the opponent as a fresh card in hand', () => {
    const g = start([BLUE], [C14.marco]);
    put(g, SHIRYU);
    choose(g, [inst(g, 'p2', 'characters', C14.marco)]);
    expect(g.zone('p2', 'hand').some((c) => c.card === C14.marco)).toBe(true);
    expect(g.zone('p2', 'trash')).toEqual([]);
  });
});
