/**
 * OP10-004 Vergo (Character, Red, cost 1, 2000, Counter +1000, {Donquixote Pirates}/{Navy}/{Punk Hazard}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 {Punk Hazard} type
 * card other than [Vergo] and add it to your hand. Then, place the rest at the bottom of your deck
 * in any order."
 *
 * Rules: look at exactly the top 5; "up to 1" may be none (CR 8-4-4-2); "other than [Vergo]" is by
 * card name, so every [Vergo] card is excluded whatever its set; the rest go to the bottom in an
 * order the owner chooses (DECISIONS: the owner orders cards placed at a deck bottom).
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  checkLook,
  deck,
  fill,
  hand,
  kind,
  mine,
  minus,
  outcomes,
  playRaw,
  reachablePickSets,
  settleYes,
  tail,
  V10,
  VAN,
  YL,
} from './kit-op10a.ts';
import type { CardId } from '@optcg/engine';

const VERGO = 'OP10-004';
/** OP10-017 Rock: Red, cost 2, 3000, {Punk Hazard}. A second {Punk Hazard} candidate (name is not Vergo). */
const ROCK = 'OP10-017';
/** OP10-012 Dragon Number Thirteen: Red, cost 2, 2000, {Biological Weapon}/{Punk Hazard}. [Blocker] only. */
const DRAGON13 = 'OP10-012';

const TOP: CardId[] = [V10.namiPh, V10.vergoBlue, VAN.marco, V10.mochaPh4, VAN.hajrudin];

function start(top: CardId[], extraDeck: CardId[] = [VAN.kingdew, ...fill(BLUE, 8)]) {
  const g = mine(YL.neutral, { hand: [VERGO], deck: [...top, ...extraDeck] });
  playRaw(g, VERGO);
  return g;
}

describe('OP10-004 Vergo: [On Play] look at 5, add up to 1 other {Punk Hazard} card, rest to the bottom', () => {
  it('printed values: cost 1, 2000, Counter +1000', () => {
    const g = mine(YL.neutral, { hand: [VERGO] });
    const c = g.find('p1', 'hand', VERGO);
    expect(g.card(c).cost).toBe(1);
    expect(g.card(c).counter).toBe(1000);
  });

  it('offers exactly the {Punk Hazard} cards of the top 5 that are not named Vergo; the pick goes to the hand', () => {
    const g = start(TOP);
    checkLook(g, { candidates: [V10.namiPh, V10.mochaPh4], pick: [V10.mochaPh4] });
    expect(hand(g)).toEqual([V10.mochaPh4]);
    expect(deck(g)).toHaveLength(14 - 1 + 0);
    expect(deck(g)[0]).toBe(VAN.kingdew);
    expect(tail(deck(g), 4)).toEqual(minus(TOP, [V10.mochaPh4]).sort());
  });

  it('every card named [Vergo] is excluded, even another {Punk Hazard} Vergo (OP01-065) and a second copy of this one', () => {
    const g = start([V10.vergoBlue, VERGO, V10.namiPh, VAN.marco, VAN.sai]);
    checkLook(g, { candidates: [V10.namiPh], pick: [] });
    expect(hand(g)).toEqual([]);
  });

  it('"up to 1": may add nothing; all 5 looked-at cards go to the bottom', () => {
    const g = start(TOP);
    checkLook(g, { candidates: [V10.namiPh, V10.mochaPh4], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(VAN.kingdew);
    expect(tail(deck(g), 5)).toEqual([...TOP].sort());
  });

  it('adds at most one card even when two qualify', () => {
    const sets = reachablePickSets(start(TOP));
    expect(sets.has('')).toBe(true);
    expect(sets.has(V10.namiPh)).toBe(true);
    expect(sets.has(V10.mochaPh4)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 5 are looked at: a {Punk Hazard} card in 6th place is not offered', () => {
    const g = start(
      [VAN.marco, VAN.sai, VAN.hajrudin, VAN.komachiyo, VAN.thatch],
      [V10.namiPh, ...fill(BLUE, 8)],
    );
    checkLook(g, { candidates: [], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(V10.namiPh);
  });

  it('a non-{Punk Hazard} card is never offered, whatever its cost or power', () => {
    const g = start([VAN.thatch, VAN.kingdew, VAN.marco, V10.tashigiNavy, V10.mochaPh3]);
    checkLook(g, { candidates: [V10.mochaPh3], pick: [] });
  });

  it('a {Punk Hazard} Character card of any cost and other {Punk Hazard} cards are candidates', () => {
    const g = start([ROCK, DRAGON13, V10.frankyPh, VAN.marco, VAN.sai]);
    checkLook(g, { candidates: [ROCK, DRAGON13, V10.frankyPh], pick: [V10.frankyPh] });
    expect(hand(g)).toEqual([V10.frankyPh]);
  });

  it('the rest may be placed in more than one order', () => {
    const g = start(TOP);
    const fp = (game: typeof g): string => deck(game).slice(-4).join(',');
    // Pick nothing, then every order of the five cards is reachable through the order decision.
    const seen = outcomes(g, 'p1', fp, 12);
    expect(seen.size).toBeGreaterThan(1);
    for (const s of seen) {
      expect(s.split(',').length).toBeLessThanOrEqual(4);
    }
  });

  it('after the effect the game is back at the Main Phase with the Character on the field', () => {
    const g = start(TOP);
    checkLook(g, { candidates: [V10.namiPh, V10.mochaPh4], pick: [V10.namiPh] });
    settleYes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([VERGO]);
  });
});
