/**
 * OP13-096 The Five Elders Are at Your Service!!! (Event, Black, cost 1, {Celestial Dragons}/{Five Elders}).
 *
 * Card text: "[Main] Look at 3 cards from the top of your deck; reveal up to 1 "Celestial Dragons"
 * type card other than [The Five Elders Are at Your Service!!!] and add it to your hand. Then,
 * trash the rest. [Trigger] Activate this card's [Main] effect."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 8-4-4-2 (hidden cards: may choose none), RD 101 ([Trigger]),
 * CR 11-2-1 (revealed cards). Scenery: OP13-085 Saint Jalmac and OP13-087 Saint Charlos
 * ({Celestial Dragons} Characters), OP13-097 (a {Celestial Dragons} Event), plain Mohji.
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  activateTrigger,
  at,
  atMain,
  BLUE,
  choices,
  deck,
  deckWith,
  doneRaw,
  don,
  hand,
  hasEvent,
  hitLeader,
  kind,
  LD13,
  lifeCards,
  mine,
  need,
  offeredIds,
  pickRaw,
  playRaw,
  reachablePickSets,
  S13,
  theirs,
  trash,
} from './kit-op13d.ts';

const ID = 'OP13-096';
const JAL = S13.jalmac;
const CHARLOS = 'OP13-087';
const EVT = 'OP13-097';

function start(top: string[], h: string[] = []): TestGame {
  const g = mine(LD13.black, { hand: [ID, ...h], deck: deckWith(top, 10) });
  playRaw(g, g.find('p1', 'hand', ID));
  return g;
}

describe('OP13-096 The Five Elders Are at Your Service!!!: look at 3, add up to 1 {Celestial Dragons} card, trash the rest', () => {
  it('offers exactly the {Celestial Dragons} cards among the top 3, Events included, not the other cards', () => {
    const g = start([JAL, BLUE, EVT]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EVT, JAL].sort());
  });

  it('the chosen card goes to the hand and the other two looked-at cards are trashed, even a matching one', () => {
    const g = start([JAL, CHARLOS, BLUE]);
    pickRaw(g, at(g, 'p1', 'deck', JAL));
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([JAL]);
    expect(trash(g)).toEqual([BLUE, CHARLOS, ID].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('"up to 1": choosing none trashes all three looked-at cards', () => {
    const g = start([JAL, CHARLOS, BLUE]);
    need(g, 'choose', 'p1');
    doneRaw(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([BLUE, CHARLOS, ID, JAL].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('never more than one card is added', () => {
    const g = start([JAL, CHARLOS, EVT]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 3 are looked at: a match in 4th place is not offered and stays on the deck', () => {
    const g = start([BLUE, BLUE, BLUE, JAL]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      doneRaw(g);
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(JAL);
    expect(trash(g)).toEqual([BLUE, BLUE, BLUE, ID].sort());
  });

  it('another copy of this very Event is not offered, although it has the type', () => {
    const g = start([ID, BLUE, BLUE]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      doneRaw(g);
    }
    expect(hand(g)).toEqual([]);
  });

  it('a different Five Elders Event (OP13-097) is not excluded by the name rule', () => {
    const g = start([ID, EVT, BLUE]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EVT]);
    pickRaw(g, at(g, 'p1', 'deck', EVT));
    expect(hand(g)).toEqual([EVT]);
  });

  it('the added card is revealed, the cards that are only trashed are not', () => {
    const g = start([JAL, CHARLOS, BLUE]);
    pickRaw(g, at(g, 'p1', 'deck', JAL));
    expect(hasEvent(g, 'CardRevealed', { card: JAL })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: CHARLOS })).toBe(false);
  });

  it('the cost is 1 DON!! and the Event itself ends in the trash', () => {
    const g = start([JAL, BLUE, BLUE]);
    pickRaw(g, at(g, 'p1', 'deck', JAL));
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
    expect(trash(g)).toContain(ID);
  });

  it('[Trigger]: taken as damage and activated, it runs its [Main] effect without paying its cost', () => {
    const g = theirs(
      LD13.black,
      { life: [ID, BLUE, BLUE, BLUE], deck: deckWith([JAL, CHARLOS, BLUE], 10) },
      {},
    );
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CHARLOS, JAL].sort());
    pickRaw(g, at(g, 'p1', 'deck', JAL));
    expect(hand(g)).toEqual([JAL]);
    expect(trash(g)).toEqual([BLUE, CHARLOS, ID].sort());
    expect(lifeCards(g)).toHaveLength(3);
    expect(don(g)).toMatchObject({ active: 0, rested: 0 });
  });

  it('hidden-gate: with no {Celestial Dragons} card among the 3 the pick is still asked, at max 0, so the prompt does not reveal the deck', () => {
    const g = start([BLUE, BLUE, BLUE]);
    const d = need(g, 'choose', 'p1');
    expect(d.max).toBe(0);
    expect(choices(g)).toEqual([]);
    doneRaw(g);
    expect(trash(g)).toEqual([BLUE, BLUE, BLUE, ID].sort());
  });
});
