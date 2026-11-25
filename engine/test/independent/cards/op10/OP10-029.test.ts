/**
 * OP10-029 Dracule Mihawk (Character, Green, cost 5, 6000, Counter +1000, {The Seven Warlords of
 * the Sea}/{ODYSSEY}).
 *
 * Card text: "[On Play] If you have 2 or more rested Characters, set up to 1 of your rested "ODYSSEY"
 * type Characters with a cost of 5 or less as active."
 *
 * Rules: the "If" has no colon: an effect condition over the whole sentence; Mihawk is played active
 * and does not count itself; only my own rested {ODYSSEY} Characters with cost 5 or less (current
 * cost) are candidates; "up to 1" may be none.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  kind,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  V10,
  VAN,
  type Chars,
} from './kit-op10a.ts';

const MIHAWK = 'OP10-029';
/** OP09-038 Rob Lucci: Green, cost 4, 6000, {CP9}/{ODYSSEY}. Vanilla. */
const LUCCI = V10.lucciOdyssey;
/** OP09-027 Sabo: Green, cost 5, 6000, {Revolutionary Army}/{ODYSSEY}. [When Attacking] only (inert here). */
const SABO5 = 'OP09-027';
/** OP09-026 Sakazuki: Green, cost 6, 7000, {Navy}/{ODYSSEY}. [On Play] only (inert here). */
const SAKAZUKI6 = 'OP09-026';

const rest = (card: string) => ({ card, rested: true });

function start(mineChars: Chars, opp: Parameters<typeof mine>[2] = {}) {
  const g = mine('ST01-001', { hand: [MIHAWK], characters: mineChars }, opp);
  playRaw(g, MIHAWK);
  return g;
}

const isRested = (g: ReturnType<typeof start>, card: string, nth = 0) =>
  g.card(at(g, 'p1', 'characters', card, nth)).rested;

describe('OP10-029 Dracule Mihawk: [On Play] with 2+ rested Characters, set up to 1 rested {ODYSSEY} Character (cost 5 or less) active', () => {
  it('printed values: cost 5, 6000, Counter +1000', () => {
    const g = mine('ST01-001', { hand: [MIHAWK] });
    const c = g.find('p1', 'hand', MIHAWK);
    expect(g.card(c).cost).toBe(5);
    expect(g.card(c).counter).toBe(1000);
    expect(g.power(c)).toBe(6000);
  });

  it('with 2 rested Characters: the chosen rested {ODYSSEY} Character becomes active', () => {
    const g = start([rest(LUCCI), rest(VAN.marco)]);
    need(g, 'choose', 'p1');
    pickCards(g, [LUCCI]);
    expect(isRested(g, LUCCI)).toBe(false);
    expect(isRested(g, VAN.marco)).toBe(true);
    expect(kind(g)).toBe('main');
  });

  it('boundary: with only 1 rested Character (the {ODYSSEY} one) nothing is asked and it stays rested', () => {
    const g = start([rest(LUCCI)]);
    expect(kind(g)).toBe('main');
    expect(isRested(g, LUCCI)).toBe(true);
  });

  it('Mihawk is played active and does not count itself', () => {
    const g = start([rest(LUCCI), VAN.marco]);
    expect(g.card(g.find('p1', 'characters', MIHAWK)).rested).toBe(false);
    expect(kind(g)).toBe('main');
    expect(isRested(g, LUCCI)).toBe(true);
  });

  it('any 2 rested Characters count, not only {ODYSSEY} ones', () => {
    const g = start([rest(VAN.marco), rest(VAN.sai), rest(LUCCI)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LUCCI]);
  });

  it('boundary on cost: a cost-5 {ODYSSEY} Character is offered, a cost-6 one is not', () => {
    const g = start([rest(LUCCI), rest(SABO5), rest(SAKAZUKI6)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LUCCI, SABO5].sort());
  });

  it('only rested Characters are candidates: an active {ODYSSEY} Character is not offered', () => {
    const g = start([rest(VAN.marco), rest(SABO5), LUCCI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SABO5]);
  });

  it('only {ODYSSEY} Characters are candidates: a rested non-{ODYSSEY} Character is not', () => {
    const g = start([rest(VAN.marco), rest(V10.tashigiNavy), rest(LUCCI)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LUCCI]);
  });

  it('only my own Characters: a rested opposing {ODYSSEY} Character is not offered', () => {
    const g = start([rest(LUCCI), rest(VAN.marco)], { characters: [rest(SABO5)] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LUCCI]);
  });

  it('"up to 1": may set none, everything stays rested', () => {
    const g = start([rest(LUCCI), rest(SABO5)]);
    none(g);
    expect(isRested(g, LUCCI)).toBe(true);
    expect(isRested(g, SABO5)).toBe(true);
  });

  it('only 1 Character is set active even when two qualify', () => {
    const g = start([rest(LUCCI), rest(SABO5)]);
    pickCards(g, [LUCCI]);
    expect(isRested(g, LUCCI)).toBe(false);
    expect(isRested(g, SABO5)).toBe(true);
  });
});
