/**
 * OP13-024 Gordon (Character, Green, cost 1, 0 power, Counter +2000, {FILM}, Wisdom).
 *
 * Card text: "[On Play] You may reveal 1 "Music" or "FILM" type card from your hand: Set up to 2 of
 * your DON!! cards as active at the end of this turn."
 *
 * Rules: CR 8-3 (a cost is paid in full or not at all; an optional cost paid from the hidden hand
 * is offered even when it cannot be paid, with "use" unavailable, DECISIONS 2026-10-29); revealing
 * leaves the card in hand (CR 11-2-1); "at the end of this turn" delays the set to my End Phase;
 * "set up to 2 DON!! active" acts on as many as possible (OPEN-QUESTIONS E-Q11).
 * Scenery: ST05-012 Baccarat ({FILM}), EB02-008 The Peak (Event, {Music}), ST05-007 Gordon ({FILM}),
 * OP01-023 Marco (neither), OP13-020 Meteor Fist (Event, {Navy}).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  charsOfIds,
  don,
  endTurn,
  hand,
  kind,
  L13,
  mine,
  need,
  no,
  offeredIds,
  payHand,
  playRaw,
  revealedByEffects,
  unusable,
  V13,
  yes,
} from './kit-op13a.ts';

const GORDON = 'OP13-024';
const FILM = V13.baccarat; // ST05-012 {FILM}
const MUSIC = 'EB02-008'; // The Peak: Event {Music}
const METEOR = 'OP13-020';

function start(handCards: string[], costArea = { active: 5, rested: 3 }) {
  const g = mine(L13.luffy, { hand: [GORDON, ...handCards], costArea });
  playRaw(g, GORDON);
  return g;
}

describe('OP13-024 Gordon: [On Play] you may reveal a Music/FILM card: set up to 2 DON!! active at the end of this turn', () => {
  it('printed values: cost 1, 0 power, Counter +2000', () => {
    const g = mine(L13.luffy, { hand: [GORDON] });
    const c = g.card(at(g, 'p1', 'hand', GORDON));
    expect(c.cost).toBe(1);
    expect(c.counter).toBe(2000);
    playRaw(g, GORDON);
    expect(g.power(at(g, 'p1', 'characters', GORDON))).toBe(0);
  });

  it('with a {FILM} card in hand the effect is offered; the cost lists only {Music} and {FILM} cards', () => {
    const g = start([FILM, MUSIC, V13.marco, METEOR]);
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([FILM, MUSIC].sort());
  });

  it('revealing a {FILM} card: it stays in hand, is revealed, and the DON!! are set only at the END of the turn', () => {
    const g = start([FILM, V13.marco], { active: 5, rested: 3 });
    const before = don(g);
    yes(g, 'p1');
    payHand(g, [FILM]);
    need(g, 'main', 'p1');
    expect(hand(g)).toEqual([FILM, V13.marco].sort());
    expect(revealedByEffects(g)).toEqual([FILM]);
    expect(don(g)).toEqual(before); // nothing set yet
    endTurn(g);
    need(g, 'main', 'p2');
    expect(don(g)).toMatchObject({ active: before.active + 2, rested: before.rested - 2 });
  });

  it('a {Music} card is a legal reveal too', () => {
    const g = start([MUSIC]);
    yes(g, 'p1');
    payHand(g, [MUSIC]);
    expect(revealedByEffects(g)).toEqual([MUSIC]);
    expect(hand(g)).toEqual([MUSIC]);
  });

  it('a second copy of Gordon (a {FILM} card) in hand can be revealed', () => {
    const g = mine(L13.luffy, { hand: [GORDON, GORDON], costArea: { active: 5, rested: 3 } });
    playRaw(g, GORDON);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([GORDON]);
  });

  it('with no {Music}/{FILM} card in hand the cost cannot be paid: "use" is unavailable, nothing is revealed, no DON!! is set', () => {
    const g = start([V13.marco, METEOR]);
    unusable(g, 'p1');
    expect(atMain(g, 'p1')).toBe(true);
    expect(revealedByEffects(g)).toEqual([]);
    const before = don(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(don(g)).toEqual(before);
  });

  it('with an empty hand the cost cannot be paid either', () => {
    const g = start([]);
    unusable(g, 'p1');
    expect(atMain(g, 'p1')).toBe(true);
    expect(charsOfIds(g, 'p1')).toEqual([GORDON]);
  });

  it('declining the "you may": nothing is revealed and no DON!! is set at the end of the turn', () => {
    const g = start([FILM]);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(revealedByEffects(g)).toEqual([]);
    const before = don(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(don(g)).toEqual(before);
  });

  it('"up to 2": with only 1 rested DON!! at the end of the turn only 1 is set', () => {
    const g = start([FILM], { active: 9, rested: 0 }); // after the cost of 1: 8 active, 1 rested
    yes(g, 'p1');
    payHand(g, [FILM]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(don(g)).toMatchObject({ active: 9, rested: 0 });
  });

  it('must not: the effect does not ask anything else and the reveal costs no card from hand', () => {
    const g = start([FILM]);
    yes(g, 'p1');
    payHand(g, [FILM]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([FILM]);
  });
});
