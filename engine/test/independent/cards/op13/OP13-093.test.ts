/**
 * OP13-093 Morgans (Character, Black, cost 3, 4000, Counter +1000, {Journalist}, [Blocker]).
 *
 * Card text: "[Blocker] (...) [On Play] Draw 2 cards and trash 2 cards from your hand."
 *
 * Rules: CR 4-5-3 (draw), CR 10-1-4 ([Blocker]), CR 8-4-4-1 (an exact number is chosen as far as
 * possible), CR 10-2-14 (trash from hand).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  attack,
  blockers,
  canFinish,
  choices,
  deck,
  deckWith,
  hand,
  kind,
  LD13,
  mine,
  need,
  pickSet,
  reachablePickSets,
  playRaw,
  SC15,
  theirs,
  total,
  trash,
} from './kit-op13d.ts';

const ID = 'OP13-093';
/** Every 2-card subset of `cards` as sorted '+' keys, sorted. */
function pairs(cards: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < cards.length; i++)
    for (let j = i + 1; j < cards.length; j++) out.push([cards[i], cards[j]].sort().join('+'));
  return out.sort();
}
const D1 = 'OP13-085';
const D2 = 'OP13-089';
const F1 = SC15.red2;
const F2 = SC15.red3;

function start(h: string[] = [F1, F2], top: string[] = [D1, D2]): TestGame {
  const g = mine(LD13.black, { hand: [ID, ...h], deck: deckWith(top) });
  playRaw(g, g.find('p1', 'hand', ID));
  return g;
}

describe('OP13-093 Morgans: [Blocker]; [On Play] draw 2 cards and trash 2 cards from your hand', () => {
  it('has [Blocker] and, being a [Blocker] on the defender’s side, can take an attack', () => {
    const g = theirs(LD13.black, { characters: [ID] }, {});
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });

  it('draws 2 first, then asks for 2 cards to trash from the new hand of 4', () => {
    const g = start();
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect([...sets].sort()).toEqual(pairs([D1, D2, F1, F2]));
    expect(hand(g)).toHaveLength(4);
    expect(deck(g)).toHaveLength(12);
  });

  it('trashing the two old cards keeps the drawn ones', () => {
    const g = start();
    need(g, 'choose', 'p1');
    pickSet(g, [F1, F2]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([D1, D2].sort());
    expect(trash(g)).toEqual([F1, F2].sort());
  });

  it('a drawn card may itself be trashed (the draw comes first)', () => {
    const g = start();
    need(g, 'choose', 'p1');
    pickSet(g, [D2, F1]);
    expect(hand(g)).toEqual([D1, F2].sort());
    expect(trash(g)).toEqual([D2, F1].sort());
  });

  it('exactly 2: one pick is not enough, "done" is not offered', () => {
    const g = start();
    need(g, 'choose', 'p1');
    pickSet(g, [D1]);
    expect(kind(g)).toBe('choose');
    expect(canFinish(g)).toBe(false);
    expect(choices(g).length).toBeGreaterThan(0);
  });

  it('no question about whether to use it: it is mandatory (the first prompt is the trash pick)', () => {
    const g = start();
    expect(kind(g)).toBe('choose');
  });

  it('with an empty hand the two drawn cards are the only ones to trash', () => {
    const g = start([]);
    if (kind(g) === 'choose') pickSet(g, [D1, D2]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([D1, D2].sort());
  });

  it('cards are conserved: 2 move deck to hand to trash, nothing else moves', () => {
    const g = mine(LD13.black, { hand: [ID, F1, F2], deck: deckWith([D1, D2]) });
    const before = total(g);
    playRaw(g, g.find('p1', 'hand', ID));
    pickSet(g, [F1, F2]);
    expect(total(g)).toBe(before);
    expect(deck(g)).toHaveLength(12);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
  });

  it('only my own hand is touched: the opponent’s hand and trash do not change', () => {
    const g = mine(LD13.black, { hand: [ID, F1, F2], deck: deckWith([D1, D2]) }, { hand: [F1] });
    playRaw(g, g.find('p1', 'hand', ID));
    pickSet(g, [F1, F2]);
    expect(hand(g, 'p2')).toEqual([F1]);
    expect(trash(g, 'p2')).toEqual([]);
  });
});
