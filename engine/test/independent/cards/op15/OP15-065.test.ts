/**
 * OP15-065 Goro (Character, Purple, cost 3, 0 power, Counter +2000, {Alabasta}/{Hot Springs Island}).
 *
 * Card text: "[On Play] Reveal 1 card from the top of your deck. If the revealed card has a cost of 2 or
 * less, add up to 1 DON!! card from your DON!! deck and rest it."
 *
 * Rules: CR 11-2-1 (a revealed card is shown to both players), a revealed top card stays on top (rulings
 * on OP17-039: it remains on the deck), CR 8-3-3 (condition on the revealed card), E-Q11 / CR 4-8-1 ("up to"
 * DON!! asks a count), CR 6-5-5 (added DON!! enter the cost area; "rest it" puts it there rested).
 * Scenery: OP17-056 Rocks Pirates (Event, cost 0), OP01-076 Bellamy (cost 2), OP01-023 Marco (cost 3).
 */
import { describe, expect, it } from 'vitest';
import {
  asksDonCount,
  atMain,
  BLUE,
  deck,
  donCountOptions,
  donDeckSize,
  don,
  donOnField,
  fill,
  hand,
  hasEvent,
  kind,
  LD15,
  mine,
  playRaw,
  SC15,
  SCN,
  takeDon,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const GORO = 'OP15-065';
/** OP17-056 Rocks Pirates: blue Event, cost 0. */
const EVENT0 = 'OP17-056';

function start(top: string, donActive = 3, donDeck?: number): TestGame {
  return mine(LD15.purple, {
    hand: [GORO],
    deck: [top, ...fill(BLUE, 6)],
    costArea: { active: donActive, rested: 0 },
    ...(donDeck !== undefined ? { donDeck } : {}),
  });
}

describe('OP15-065 Goro: [On Play] reveal the top card; if its cost is 2 or less, add up to 1 DON!! rested', () => {
  it('cost 2 (boundary): a DON!! card is added to the cost area rested', () => {
    const g = start(SC15.bellamy);
    const deckBefore = donDeckSize(g);
    const fieldBefore = donOnField(g);
    playRaw(g, GORO);
    if (asksDonCount(g)) takeDon(g, 1);
    expect(atMain(g)).toBe(true);
    expect(donDeckSize(g)).toBe(deckBefore - 1);
    expect(donOnField(g)).toBe(fieldBefore + 1);
    // Goro cost 3 rested 3 of the 3 active; the added DON!! is rested too
    expect(don(g)).toMatchObject({ active: 0, rested: 4 });
  });

  it('cost 1 and cost 0 also qualify', () => {
    for (const top of [BLUE, EVENT0]) {
      const g = start(top);
      const before = donOnField(g);
      playRaw(g, GORO);
      if (asksDonCount(g)) takeDon(g, 1);
      expect(donOnField(g)).toBe(before + 1);
    }
  });

  it('cost 3 (boundary): no DON!! is added', () => {
    const g = start(SCN.c3);
    const before = donOnField(g);
    playRaw(g, GORO);
    expect(kind(g)).toBe('main');
    expect(donOnField(g)).toBe(before);
    expect(donDeckSize(g)).toBe(7);
  });

  it('a much more expensive card adds nothing either', () => {
    const g = start(SCN.c8);
    playRaw(g, GORO);
    expect(kind(g)).toBe('main');
    expect(don(g)).toMatchObject({ active: 0, rested: 3 });
  });

  it('"up to 1": the count may be 0, then nothing is added', () => {
    const g = start(SC15.bellamy);
    playRaw(g, GORO);
    expect(asksDonCount(g)).toBe(true);
    expect(donCountOptions(g)).toEqual(expect.arrayContaining(['1', '0']));
    expect(donCountOptions(g)).not.toContain('2');
    takeDon(g, 0);
    expect(donDeckSize(g)).toBe(7);
  });

  it('the revealed card is shown, and it stays on top of the deck (not drawn, not moved)', () => {
    const g = start(SC15.bellamy);
    playRaw(g, GORO);
    if (asksDonCount(g)) takeDon(g, 1);
    expect(hasEvent(g, 'CardRevealed', { card: SC15.bellamy })).toBe(true);
    expect(deck(g)[0]).toBe(SC15.bellamy);
    expect(deck(g)).toHaveLength(7);
    expect(hand(g)).toEqual([]);
  });

  it('a revealed card with a failing cost is also revealed and stays on top', () => {
    const g = start(SCN.c5);
    playRaw(g, GORO);
    expect(hasEvent(g, 'CardRevealed', { card: SCN.c5 })).toBe(true);
    expect(deck(g)[0]).toBe(SCN.c5);
  });

  it('only the top card matters: a cheap card second from the top does not count', () => {
    const g = mine(LD15.purple, {
      hand: [GORO],
      deck: [SCN.c3, SC15.bellamy, ...fill(BLUE, 5)],
      costArea: { active: 3, rested: 0 },
    });
    playRaw(g, GORO);
    expect(donOnField(g)).toBe(3);
  });

  it('with an empty DON!! deck nothing is added and the game moves on', () => {
    const g = mine(LD15.purple, {
      hand: [GORO],
      deck: [SC15.bellamy, ...fill(BLUE, 6)],
      costArea: { active: 10, rested: 0 },
    });
    expect(donDeckSize(g)).toBe(0);
    playRaw(g, GORO);
    expect(donOnField(g)).toBe(10);
    expect(kind(g)).toBe('main');
  });

  it('the added DON!! is rested, so it cannot pay for another card this turn', () => {
    const g = start(SC15.bellamy, 4);
    playRaw(g, GORO);
    if (asksDonCount(g)) takeDon(g, 1);
    expect(don(g)).toMatchObject({ active: 1, rested: 4 });
  });
});
