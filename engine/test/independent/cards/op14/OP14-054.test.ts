/**
 * OP14-054 Fisher Tiger (Character, Blue, cost 6, 7000, Counter +1000, {Fish-Man}/{The Sun Pirates}).
 *
 * Card text: "[On Play] If your Leader has the {Fish-Man} type, draw 3 cards.
 * [End of Your Turn] Trash cards from your hand until you have 5 cards in your hand."
 *
 * Rules: CR 6-6-1-1 ([End of Your Turn] of the turn player's cards), CR 8-3-3 (no effect after a
 * failed "if"), CR 10-2-14 (Trash).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  atMain,
  BLUE,
  C14,
  choices,
  deck,
  endTurn,
  hand,
  inst,
  kind,
  L14,
  mine,
  need,
  put,
  trash,
} from './kit-op14b.ts';

const TIGER = 'OP14-054';
const CARDS = [
  C14.sai,
  C14.marco,
  C14.hajrudin,
  C14.kingdew,
  C14.thatch,
  C14.camie,
  C14.doma,
  C14.blugori,
];

function onField(leader: string, handCards: string[]) {
  return mine(leader, { characters: [TIGER], hand: handCards, deck: [BLUE, BLUE, BLUE, BLUE] });
}
function pickHand(g: TestGame, cards: string[]) {
  need(g, 'choose', 'p1');
  const used = new Set<string>();
  for (const c of cards) {
    const hit = g.zone('p1', 'hand').find((x) => x.card === c && !used.has(x.instance))!;
    used.add(hit.instance);
    act(g, { type: 'pick', choice: hit.instance });
  }
}

describe('OP14-054 Fisher Tiger: [On Play] with a {Fish-Man} Leader draw 3; [End of Your Turn] trash until 5 cards in hand', () => {
  it('[On Play] with a {Fish-Man} Leader draws exactly 3 cards', () => {
    const g = mine(L14.fish, {
      hand: [TIGER],
      deck: [C14.kingdew, C14.thatch, C14.marco, BLUE, BLUE],
    });
    put(g, TIGER);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C14.kingdew, C14.thatch, C14.marco].sort());
    expect(deck(g)).toHaveLength(2);
  });

  it('[On Play] with a Leader that is not a {Fish-Man}: draws nothing', () => {
    const g = mine(L14.luffy, { hand: [TIGER], deck: [C14.kingdew, C14.thatch, C14.marco, BLUE] });
    put(g, TIGER);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(4);
  });

  it('[End of Your Turn] with 8 cards in hand: 3 are trashed (the owner chooses which) leaving exactly 5', () => {
    const g = onField(L14.luffy, CARDS);
    endTurn(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(8);
    pickHand(g, [C14.sai, C14.marco, C14.hajrudin]);
    need(g, 'main', 'p2');
    expect(hand(g)).toHaveLength(5);
    expect(trash(g)).toEqual([C14.sai, C14.marco, C14.hajrudin].sort());
  });

  it('[End of Your Turn] the choice is not complete until all 3 cards are picked', () => {
    const g = onField(L14.luffy, CARDS);
    endTurn(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: inst(g, 'p1', 'hand', C14.sai) });
    act(g, { type: 'pick', choice: inst(g, 'p1', 'hand', C14.marco) });
    expect(kind(g)).toBe('choose');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('[End of Your Turn] boundary: 6 cards in hand: exactly 1 is trashed', () => {
    const g = onField(L14.luffy, CARDS.slice(0, 6));
    endTurn(g);
    need(g, 'choose', 'p1');
    pickHand(g, [C14.sai]);
    need(g, 'main', 'p2');
    expect(hand(g)).toHaveLength(5);
    expect(trash(g)).toEqual([C14.sai]);
  });

  it('[End of Your Turn] boundary: exactly 5 cards in hand: nothing is trashed and nothing is asked', () => {
    const g = onField(L14.luffy, CARDS.slice(0, 5));
    endTurn(g);
    need(g, 'main', 'p2');
    expect(hand(g)).toHaveLength(5);
    expect(trash(g)).toEqual([]);
  });

  it('[End of Your Turn] with fewer than 5 cards in hand nothing happens (no cards are drawn)', () => {
    const g = onField(L14.luffy, CARDS.slice(0, 3));
    endTurn(g);
    need(g, 'main', 'p2');
    expect(hand(g)).toHaveLength(3);
    expect(trash(g)).toEqual([]);
  });

  it('[End of Your Turn] does not need a {Fish-Man} Leader (unconditional)', () => {
    const g = onField(L14.fish, CARDS.slice(0, 7));
    endTurn(g);
    need(g, 'choose', 'p1');
    pickHand(g, [C14.sai, C14.marco]);
    need(g, 'main', 'p2');
    expect(hand(g)).toHaveLength(5);
  });

  it('played with a {Fish-Man} Leader and 2 other cards in hand: the 3 drawn cards make 5, so nothing is trashed at the end of the turn', () => {
    const g = mine(L14.fish, {
      hand: [TIGER, C14.sai, C14.marco],
      deck: [C14.kingdew, C14.thatch, C14.camie, BLUE, BLUE],
    });
    put(g, TIGER);
    expect(hand(g)).toHaveLength(5);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(hand(g)).toHaveLength(5);
    expect(trash(g)).toEqual([]);
  });

  it('played with a {Fish-Man} Leader and 4 other cards: 7 cards in hand, so 2 are trashed at the end of the turn', () => {
    const g = mine(L14.fish, {
      hand: [TIGER, C14.sai, C14.marco, C14.hajrudin, C14.doma],
      deck: [C14.kingdew, C14.thatch, C14.camie, BLUE, BLUE],
    });
    put(g, TIGER);
    expect(hand(g)).toHaveLength(7);
    endTurn(g);
    need(g, 'choose', 'p1');
    pickHand(g, [C14.camie, C14.doma]);
    need(g, 'main', 'p2');
    expect(hand(g)).toHaveLength(5);
    expect(trash(g)).toEqual([C14.camie, C14.doma].sort());
  });
});
