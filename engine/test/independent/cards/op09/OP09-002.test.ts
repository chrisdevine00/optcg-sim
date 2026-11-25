/**
 * OP09-002 Uta (Character, Red, cost 1, 2000, Counter +1000, {FILM}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 "Red-Haired Pirates"
 * type card and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: "look at" is private, "reveal" is public (CR 11-2-1); "up to 1" may be 0 (CR 8-4-4-1); only
 * the top 5 are looked at; the card type must be {Red-Haired Pirates} (a Leader-style type check, CR
 * 2-1); the owner orders the cards placed at the bottom (CR 3-1-7, bottom-order.md); the card chosen
 * leaves the looked-at group and does not go to the bottom.
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import { act } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  atMain,
  BLUE,
  deck,
  fill,
  hand,
  hasEvent,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  outcomes,
  pickCards,
  play,
  reachablePickSets,
  S9,
  settleOrders,
  tail,
  don,
} from './kit-op09a.ts';

const UTA = 'OP09-002';
const RHP = S9.gab; // OP09-006, {Red-Haired Pirates}
const RHP2 = S9.rockstar; // OP09-016, {Red-Haired Pirates}
const RHP3 = S9.yasoppP; // P-023, {FILM}/{Red-Haired Pirates}

/** Uta in hand, the given deck (top first), then played. Leaves the engine at its first prompt. */
function played(top: CardId[], rest: CardId[] = fill(BLUE, 10), leader: string = L9.luffy) {
  const g = mine(leader, { hand: [UTA], deck: [...top, ...rest] });
  play(g, g.find('p1', 'hand', UTA));
  return g;
}

describe('OP09-002 Uta: [On Play] look at 5, add up to 1 {Red-Haired Pirates}, rest to the bottom in any order', () => {
  it('printed values: cost 1, 2000, Counter +1000, type FILM; playing it costs 1 DON!!', () => {
    const g = played([S9.c1, S9.c1, S9.c1, S9.c1, S9.c1]);
    const u = g.find('p1', 'characters', UTA);
    expect(g.card(u).cost).toBe(1);
    expect(g.power(u)).toBe(2000);
    expect(g.card(u).counter).toBe(1000);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
  });

  it('offers exactly the {Red-Haired Pirates} cards among the top 5; the pick goes to hand, the rest to the bottom', () => {
    const top = [S9.c1, RHP, S9.c2, RHP2, S9.c3];
    const g = played(top, [S9.c7, ...fill(BLUE, 9)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([RHP, RHP2].sort());
    pickCards(g, [RHP2]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([RHP2]);
    expect(deck(g)).toHaveLength(15 - 1);
    expect(deck(g)[0]).toBe(S9.c7); // the card that was 6th is now on top
    expect(tail(deck(g), 4)).toEqual([S9.c1, RHP, S9.c2, S9.c3].sort());
  });

  it('the chosen card is revealed (CR 11-2-1); the other looked-at cards are not', () => {
    const g = played([S9.c1, RHP, S9.c2, S9.c3, S9.c4]);
    pickCards(g, [RHP]);
    settleOrders(g);
    expect(hasEvent(g, 'CardRevealed', { card: RHP })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: S9.c1 })).toBe(false);
    expect(hasEvent(g, 'CardRevealed', { card: S9.c2 })).toBe(false);
  });

  it('"up to 1": I may add nothing; all 5 looked-at cards go to the bottom and the 6th card is on top', () => {
    const top = [S9.c1, RHP, S9.c2, S9.c3, S9.c4];
    const g = played(top, [S9.c7, ...fill(BLUE, 9)]);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(S9.c7);
    expect(tail(deck(g), 5)).toEqual([...top].sort());
  });

  it('adds at most one card even when two qualify', () => {
    const g = played([RHP, RHP2, RHP3, S9.c1, S9.c2]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has(RHP)).toBe(true);
    expect(sets.has(RHP3)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 5 are looked at: a {Red-Haired Pirates} card in 6th place is not offered', () => {
    const g = played([S9.c1, S9.c2, S9.c3, S9.c4, S9.c5], [RHP, ...fill(BLUE, 9)]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(RHP);
  });

  it('only the type {Red-Haired Pirates} qualifies: other types (and the {FILM} Uta type) are not offered', () => {
    const g = played([S9.mohji, S9.frankyG5, S9.mr1, RHP3, S9.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([RHP3]);
  });

  it('with no {Red-Haired Pirates} card in the top 5, nothing is added and all 5 go to the bottom', () => {
    const top = [S9.c1, S9.c2, S9.c3, S9.c4, S9.c5];
    const g = played(top);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual([...top].sort());
  });

  it('"in any order": the owner can reach several different bottom orders, all permutations of the rest', () => {
    const g = played([RHP, S9.c1, S9.c2, S9.c3, S9.c4]);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'deck', RHP) });
    const seen = outcomes(g, 'p1', (x: TestGame) =>
      x
        .zone('p1', 'deck')
        .slice(-4)
        .map((c) => c.card)
        .join(','),
    );
    expect(seen.size).toBeGreaterThan(1);
    for (const s of seen) {
      expect(s.split(',').sort()).toEqual([S9.c1, S9.c2, S9.c3, S9.c4].sort());
    }
  });

  it('boundary: a deck of only 3 cards is looked at in full; the pick works and the other 2 go back', () => {
    const g = mine(L9.luffy, { hand: [UTA], deck: [S9.c1, RHP, S9.c2] });
    play(g, g.find('p1', 'hand', UTA));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([RHP]);
    pickCards(g, [RHP]);
    settleOrders(g);
    expect(hand(g)).toEqual([RHP]);
    expect(deck(g)).toHaveLength(2);
    expect(deck(g).sort()).toEqual([S9.c1, S9.c2].sort());
  });

  it('must not happen: the effect does not touch the opponent, Life, or the trash', () => {
    const g = played([RHP, S9.c1, S9.c2, S9.c3, S9.c4]);
    pickCards(g, [RHP]);
    settleOrders(g);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
    expect(g.zone('p2', 'deck')).toHaveLength(15);
  });
});
