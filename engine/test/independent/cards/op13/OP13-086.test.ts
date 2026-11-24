/**
 * OP13-086 Saint Shalria (Character, Black, cost 1, 0 power, Counter +1000, {Celestial Dragons}).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck; reveal up to 1 "Celestial Dragons" type
 * card other than [Saint Shalria] and add it to your hand. Then, trash the rest and trash 1 card from
 * your hand."
 *
 * Rules: CR 11-2-1 (revealing), CR 11-3 (looking), CR 2-4-3-1 (quoted type), CR 2-1-2 ([Saint Shalria]
 * is an exact name), CR 4-8-1 ("up to"), "trash 1 card" is exact, "the rest" are the looked-at cards
 * not added, trashing is not a K.O.
 * Scenery: OP13-085 Saint Jalmac ({Celestial Dragons}, 4000), OP13-089 Warcury ({Celestial Dragons}/
 * {Five Elders}), OP13-087 Saint Charlos (another {Celestial Dragons}), OP01-023 Marco (not one).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  canFinish,
  choices,
  deck,
  hand,
  hasEvent,
  kind,
  LD13,
  me,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  S13,
  at,
  trash,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import type { CardId } from '@optcg/engine';

const ID = 'OP13-086';
const CD1 = S13.jalmac;
const CD2 = S13.warcury;
const MISS = S13.c3;
const HAND = S13.c5;
const BEYOND = S13.c7;
const pad = Array.from({ length: 8 }, () => S13.filler);

function start(top: CardId[], extraHand: CardId[] = [HAND]): TestGame {
  const g = me(LD13.plain, { hand: [ID, ...extraHand], deck: [...top, BEYOND, ...pad] });
  playRaw(g, ID);
  return g;
}

describe('OP13-086 Saint Shalria: [On Play] look at 3, add up to 1 other [Celestial Dragons], trash the rest, trash 1 from hand', () => {
  it('offers only the {Celestial Dragons} cards; the pick goes to hand; the other two are trashed; then 1 hand card is trashed', () => {
    const g = start([CD1, MISS, CD2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CD1, CD2].sort());
    pickInst(g, [at(g, 'p1', 'deck', CD2)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CD2, HAND].sort());
    pickInst(g, [at(g, 'p1', 'hand', HAND)]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([CD2]);
    expect(trash(g)).toEqual([CD1, MISS, HAND].sort());
    expect(deck(g)[0]).toBe(BEYOND);
    expect(deck(g)).toHaveLength(9);
  });

  it('only the top 3 are looked at: a {Celestial Dragons} card in position 4 is neither offered nor trashed', () => {
    const g = me(LD13.plain, { hand: [ID, HAND], deck: [MISS, MISS, MISS, CD1, ...pad] });
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    pickInst(g, [at(g, 'p1', 'hand', HAND)]);
    expect(deck(g)[0]).toBe(CD1);
    expect(trash(g)).toEqual([MISS, MISS, MISS, HAND].sort());
  });

  it('"up to 1": adding nothing trashes all three looked-at cards, then 1 hand card', () => {
    const g = start([CD1, MISS, CD2]);
    none(g);
    if (kind(g) === 'choose') pickInst(g, [at(g, 'p1', 'hand', HAND)]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([CD1, MISS, CD2, HAND].sort());
    expect(deck(g)[0]).toBe(BEYOND);
  });

  it('"other than [Saint Shalria]": another copy of Shalria is not offered, a different Celestial Dragon is', () => {
    const g = start([ID, 'OP13-087', MISS]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual(['OP13-087']);
  });

  it('the trash from hand is exactly 1 card and cannot be skipped', () => {
    const g = start([CD1, MISS, MISS]);
    pickInst(g, [at(g, 'p1', 'deck', CD1)]);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
    expect(choices(g)).toHaveLength(2);
  });

  it('the card just added may be the card trashed from hand', () => {
    const g = start([CD1, MISS, MISS]);
    pickInst(g, [at(g, 'p1', 'deck', CD1)]);
    pickInst(g, [at(g, 'p1', 'hand', CD1)]);
    expect(hand(g)).toEqual([HAND]);
    expect(trash(g)).toEqual([CD1, MISS, MISS].sort());
  });

  it('the added card is revealed; the trashed looked-at cards are not', () => {
    const g = start([CD1, MISS, MISS]);
    pickInst(g, [at(g, 'p1', 'deck', CD1)]);
    pickInst(g, [at(g, 'p1', 'hand', HAND)]);
    expect(hasEvent(g, 'CardRevealed', { card: CD1 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: MISS })).toBe(false);
  });

  it('with an empty hand after adding nothing, the looked-at cards are trashed and nothing else is', () => {
    const g = start([CD1, MISS, MISS], []);
    none(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([CD1, MISS, MISS].sort());
    expect(hand(g)).toEqual([]);
  });

  it('the looked-at cards are trashed, not put at the bottom: the deck shrinks by 3', () => {
    const g = start([CD1, MISS, MISS]);
    none(g);
    pickInst(g, [at(g, 'p1', 'hand', HAND)]);
    expect(deck(g)).toHaveLength(9);
    expect(deck(g).slice(-1)).toEqual([S13.filler]);
  });
});
