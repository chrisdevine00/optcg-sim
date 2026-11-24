/**
 * OP13-116 The One Who Is the Most Free Is the Pirate King!!! (Event, Yellow, cost 1, {Straw Hat Crew}/{Supernovas}).
 *
 * Card text: "[Main] Look at 5 cards from the top of your deck; reveal up to 1 "Supernovas" type
 * Character card and add it to your hand. Then, place the rest at the bottom of your deck in any
 * order. [Trigger] Activate this card's [Main] effect."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 8-4-4-2, CR 11-2-1 (reveal), RD 101 ([Trigger]). Scenery:
 * OP02-043 Roronoa Zoro (Green, cost 4, {Supernovas}) and OP14-008 Scratchmen Apoo (Red, cost 3,
 * {Supernovas}), both vanilla Characters; OP10-097 Gum-Gum Rhino Schneider (Black Event with the
 * {Supernovas} type); plain Mohji.
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
  mine,
  need,
  offeredIds,
  outcomes,
  pickRaw,
  playRaw,
  reachablePickSets,
  S13,
  settleOrders,
  tail,
  theirs,
  trash,
} from './kit-op13d.ts';

const ID = 'OP13-116';
const ZORO = S13.zoroSn;
const APOO = S13.apooSn;
const EVT = 'OP10-097';
const BEYOND = 'OP13-085';

function start(top5: string[]): TestGame {
  const g = mine(LD13.yellow, { hand: [ID], deck: [...top5, BEYOND, ...deckWith([], 8)] });
  playRaw(g, g.find('p1', 'hand', ID));
  return g;
}

const fin = (g: TestGame) => {
  settleOrders(g);
  expect(atMain(g)).toBe(true);
};

describe('OP13-116 The One Who Is the Most Free Is the Pirate King!!!: look at 5, add up to 1 {Supernovas} Character, rest to the bottom', () => {
  it('offers the {Supernovas} Characters among the top 5, not an Event with that type and not other cards', () => {
    const g = start([ZORO, BLUE, EVT, APOO, BLUE]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([APOO, ZORO].sort());
  });

  it('the chosen Character goes to the hand, the other four go to the bottom of the deck', () => {
    const top = [ZORO, BLUE, EVT, APOO, BLUE];
    const g = start(top);
    pickRaw(g, at(g, 'p1', 'deck', ZORO));
    fin(g);
    expect(hand(g)).toEqual([ZORO]);
    expect(deck(g)).toHaveLength(13);
    expect(deck(g)[0]).toBe(BEYOND);
    expect(tail(deck(g), 4)).toEqual([BLUE, EVT, APOO, BLUE].sort());
  });

  it('"up to 1": choosing none puts all five at the bottom and adds nothing', () => {
    const top = [ZORO, BLUE, EVT, APOO, BLUE];
    const g = start(top);
    need(g, 'choose', 'p1');
    doneRaw(g);
    fin(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(BEYOND);
    expect(tail(deck(g), 5)).toEqual([...top].sort());
  });

  it('never more than one Character is added', () => {
    const g = start([ZORO, APOO, BLUE, BLUE, BLUE]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 5 are looked at: a {Supernovas} Character in 6th place is not offered', () => {
    const h = mine(LD13.yellow, {
      hand: [ID],
      deck: [BLUE, BLUE, BLUE, BLUE, BLUE, ZORO, ...deckWith([], 8)],
    });
    playRaw(h, h.find('p1', 'hand', ID));
    if (kind(h) === 'choose') {
      expect(offeredIds(h)).toEqual([]);
      doneRaw(h);
    }
    fin(h);
    expect(hand(h)).toEqual([]);
    expect(deck(h)[0]).toBe(ZORO);
  });

  it('the Event with the {Supernovas} type is not a Character: with only it in the top 5 nothing can be added', () => {
    const g = start([EVT, BLUE, BLUE, BLUE, BLUE]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      doneRaw(g);
    }
    fin(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('the added card is revealed, the others are not', () => {
    const g = start([ZORO, APOO, BLUE, BLUE, BLUE]);
    pickRaw(g, at(g, 'p1', 'deck', ZORO));
    fin(g);
    expect(hasEvent(g, 'CardRevealed', { card: ZORO })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: APOO })).toBe(false);
  });

  it('the looked-at cards leave the top: the next draw is the card that was 6th', () => {
    const g = start([ZORO, BLUE, BLUE, BLUE, BLUE]);
    pickRaw(g, at(g, 'p1', 'deck', ZORO));
    fin(g);
    expect(deck(g)[0]).toBe(BEYOND);
  });

  it('cost 1: one DON!! is rested and the Event goes to the trash', () => {
    const g = start([ZORO, BLUE, BLUE, BLUE, BLUE]);
    pickRaw(g, at(g, 'p1', 'deck', ZORO));
    fin(g);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
    expect(trash(g)).toEqual([ID]);
  });

  it('[Trigger]: taken as damage and activated, it runs its [Main] effect for free', () => {
    const g = theirs(LD13.yellow, {
      life: [ID, BLUE, BLUE, BLUE],
      deck: [ZORO, BLUE, BLUE, BLUE, BLUE, BEYOND, ...deckWith([], 8)],
    });
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ZORO]);
    pickRaw(g, at(g, 'p1', 'deck', ZORO));
    settleOrders(g);
    expect(hand(g)).toEqual([ZORO]);
    expect(don(g)).toMatchObject({ active: 0, rested: 0 });
    expect(deck(g)[0]).toBe(BEYOND);
  });

  it('hidden-gate: with no {Supernovas} Character among the 5 the pick is still asked, at max 0, so the prompt does not reveal the deck', () => {
    const g = start([BLUE, BLUE, BLUE, BLUE, BLUE]);
    const d = need(g, 'choose', 'p1');
    expect(d.max).toBe(0);
    expect(choices(g)).toEqual([]);
    doneRaw(g);
    fin(g);
    expect(hand(g)).toEqual([]);
  });
  it('"in any order": the owner can end with more than one order of the cards put at the bottom', () => {
    const g = start([ZORO, APOO, EVT, BLUE, BLUE]);
    pickRaw(g, at(g, 'p1', 'deck', ZORO));
    const ends = outcomes(g, 'p1', (x) =>
      x
        .zone('p1', 'deck')
        .slice(-4)
        .map((c) => c.card)
        .join('+'),
    );
    expect(ends.size).toBeGreaterThan(1);
    for (const e of ends) expect(e.split('+').sort()).toEqual([APOO, BLUE, BLUE, EVT].sort());
  });
});
