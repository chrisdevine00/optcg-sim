/**
 * OP12-017 Color of Observation Haki (Event, Red, cost 0, {Former Roger Pirates}).
 *
 * Card text: "[Main] You may give 1 active DON!! card to 1 of your [Silvers Rayleigh]: Look at 4
 * cards from the top of your deck; reveal up to 1 red Event or up to 1 Character card with a cost
 * of 3 or more and add it to your hand. Then, place the rest at the bottom of your deck in any
 * order."
 *
 * Rules: the cost gives 1 active DON!! to a card named Silvers Rayleigh (Leader or Character); it
 * is optional, offered even when unpayable with accept illegal (DECISIONS 2026-10-29); only the top
 * 4 are looked at; "up to 1" may be 0; the "or" joins two kinds of card and one card is added in
 * all (CR 4-8-1); the rest go to the bottom (CR 8-4-4-2). Cards in the deck use their printed cost.
 */
import { describe, expect, it } from 'vitest';
import {
  canAcceptOptional,
  decision,
  deckTop,
  donOf,
  finishLook,
  kind,
  LD12,
  mine,
  need,
  no,
  offeredCardIds,
  playRaw,
  reachablePickSets,
  S12,
  sorted,
  yes,
} from './kit-op12a.ts';

const EV = 'OP12-017';
const E = S12.event;
const BLUE = S12.mohji;

/** Top 4: red Event, Marco (cost 3), Sai (cost 2), black Event; position 5 is a cost-3 Character. */
const TOP4 = [E, S12.marco, S12.sai, S12.iceAge];

function start(top: string[] = TOP4, leader: string = LD12.rayleigh, active = 10) {
  const g = mine(leader, {
    hand: [EV],
    deck: [...top, S12.hajrudin, ...Array.from({ length: 8 }, () => BLUE)],
    costArea: { active, rested: 0 },
  });
  playRaw(g, EV);
  return g;
}

function paid(top: string[] = TOP4) {
  const g = start(top);
  yes(g, 'p1');
  return g;
}

describe('OP12-017 Color of Observation Haki: give 1 DON!! to [Silvers Rayleigh]: look at 4', () => {
  it('printed values: Event, cost 0', () => {
    const g = mine(LD12.rayleigh, { hand: [EV] });
    expect(g.card(g.find('p1', 'hand', EV)).cost).toBe(0);
  });

  it('the optional cost is offered; paying gives 1 active DON!! to the Leader (+1000)', () => {
    const g = start();
    need(g, 'optional', 'p1');
    expect(canAcceptOptional(g)).toBe(true);
    yes(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 9, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('offers exactly the red Events and the Characters of cost 3 or more among the top 4', () => {
    const g = paid();
    need(g, 'choose', 'p1');
    // red Event and Marco (cost 3); Sai (cost 2) and the black Event are out
    expect(offeredCardIds(g)).toEqual([E, S12.marco].sort());
  });

  it('a Character of any colour with cost 3 or more qualifies; cost 2 does not', () => {
    const g = paid([S12.zoroChar, S12.mohji, S12.sai, S12.thatch]);
    expect(offeredCardIds(g)).toEqual([S12.zoroChar, S12.thatch].sort());
  });

  it('adds the chosen card; the other 3 go to the bottom and the 5th card is now on top', () => {
    const g = paid();
    finishLook(g, S12.marco);
    expect(sorted(g, 'p1', 'hand')).toEqual([S12.marco]);
    const deck = deckTop(g);
    expect(deck).toHaveLength(12);
    expect(deck[0]).toBe(S12.hajrudin);
    expect(deck.slice(-3).sort()).toEqual([E, S12.sai, S12.iceAge].sort());
  });

  it('"up to 1": adding nothing puts all 4 at the bottom', () => {
    const g = paid();
    finishLook(g, null);
    expect(sorted(g, 'p1', 'hand')).toEqual([]);
    expect(deckTop(g)[0]).toBe(S12.hajrudin);
    expect(deckTop(g).slice(-4).sort()).toEqual([...TOP4].sort());
  });

  it('one card in all: a red Event and a Character together are not both added', () => {
    const sets = reachablePickSets(paid());
    expect(sets.has(E)).toBe(true);
    expect(sets.has(S12.marco)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 4 are looked at: a qualifying card in position 5 is not offered', () => {
    const g = paid([S12.sai, S12.sai, S12.mohji, S12.iceAge]);
    if (kind(g) === 'choose') {
      expect(offeredCardIds(g)).toEqual([]);
      finishLook(g, null);
    }
    expect(sorted(g, 'p1', 'hand')).toEqual([]);
    expect(deckTop(g)[0]).toBe(S12.hajrudin);
  });

  it('declining: no DON!! is given, nothing is looked at, the deck is unchanged', () => {
    const g = start();
    no(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 10, given: 0 });
    expect(deckTop(g).slice(0, 4)).toEqual(TOP4);
    expect(kind(g)).toBe('main');
  });

  it('no active DON!! left: the cost cannot be paid and accept is not available', () => {
    const g = start(TOP4, LD12.rayleigh, 0);
    need(g, 'optional', 'p1');
    expect(canAcceptOptional(g)).toBe(false);
    no(g, 'p1');
    expect(deckTop(g).slice(0, 4)).toEqual(TOP4);
  });

  it('no [Silvers Rayleigh] on the field: the cost cannot be paid and nothing is looked at', () => {
    const g = start(TOP4, LD12.luffy);
    if (decision(g)?.kind === 'optional') {
      expect(canAcceptOptional(g)).toBe(false);
      no(g, 'p1');
    }
    expect(donOf(g, 'p1').given).toBe(0);
    expect(deckTop(g).slice(0, 4)).toEqual(TOP4);
  });
});
