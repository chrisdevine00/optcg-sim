/**
 * OP17-045 Kyo (Character, Blue, cost 2, 4000, no Counter, type Rocks Pirates).
 *
 * Card text (cards/data):
 *   "If one of your Characters would be removed from the field by your opponent's effect, you may
 *    trash 2 cards from your hand instead.
 *
 *    [On Play] Draw 1 card."
 *
 * Rules: an optional replacement (CR 8-1-3-4, 8-1-3-4-1; RL-31: "may" → optional). "Removed from
 * the field" covers K.O. by an effect, return to hand and placing in the deck (CR 4-11-2; RL-15).
 * A K.O. in battle is not an effect, and p1's own effects are not "your opponent's effect".
 * There is no [Once Per Turn]. Text works only on the field (CR 2-8-2).
 *
 * Opponent removal used here (scripted in M4a): OP09-077 Gum-Gum Lightning ("[Main] DON!! −2: K.O.
 * up to 1 of your opponent's Characters with 6000 power or less", cost 2) and OP17-046 Gloriosa
 * ("[On Play] Place up to 1 Character with a cost of 5 or less at the bottom of the owner's deck",
 * cost 4).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { attack, fill, noDefence, play } from '../helpers.ts';
import {
  accept,
  AKP,
  BLUE,
  choose,
  count,
  decline,
  LEAD,
  myTurn,
  offered,
  payDon,
  payWith,
  PURPLE,
  RED,
  ROCKS,
  side,
  sortedIds,
  theirTurn,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

/** p2's turn: p2 (Kaido Leader) holds Gum-Gum Lightning; p1 has Kyo on the field. */
function threatened(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return theirTurn(
    side(LEAD.rocks, BLUE, { characters: [ROCKS.kyo], hand: [VAN.mohji, VAN.gordon], ...p1 }),
    side(LEAD.kaido, PURPLE, {
      hand: [AKP.lightning],
      costArea: { active: 4, rested: 0 },
      ...p2,
    }),
  );
}

/** p2 plays Gum-Gum Lightning, pays DON!! −2 and targets `target`. */
function lightning(g: TestGame, target: string, nth = 0) {
  play(g, g.find('p2', 'hand', AKP.lightning, nth));
  if (offered(g, 'p2')) accept(g);
  payDon(g, 2);
  choose(g, [target]);
}

describe('OP17-045 Kyo: [On Play] Draw 1 card', () => {
  it('happy path: playing Kyo draws 1', () => {
    const g = myTurn(
      side(LEAD.rocks, BLUE, {
        hand: [ROCKS.kyo],
        deck: [VAN.marco, ...fill(BLUE, 10)],
        costArea: { active: 2, rested: 0 },
      }),
      side(LEAD.luffy, RED),
    );
    play(g, g.find('p1', 'hand', ROCKS.kyo));
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.marco]);
    expect(offered(g, 'p1')).toBe(false);
  });
});

describe('OP17-045 Kyo: trash 2 instead of being removed by the opponent’s effect', () => {
  it('happy path: an opponent’s K.O. effect on Kyo → p1 may trash 2 instead, and Kyo stays', () => {
    const g = threatened();
    const kyo = g.find('p1', 'characters', ROCKS.kyo);
    lightning(g, kyo);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji), g.find('p1', 'hand', VAN.gordon)]);
    expect(g.card(kyo).zone).toBe('characters');
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.gordon, VAN.mohji].sort());
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('it protects any of p1’s Characters, not only Kyo', () => {
    const g = threatened({ characters: [ROCKS.kyo, VAN.marco] });
    const marco = g.find('p1', 'characters', VAN.marco);
    lightning(g, marco);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji), g.find('p1', 'hand', VAN.gordon)]);
    expect(g.card(marco).zone).toBe('characters');
  });

  it('CR 8-1-3-4-1: declining lets the K.O. happen', () => {
    const g = threatened();
    lightning(g, g.find('p1', 'characters', ROCKS.kyo));
    decline(g);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([ROCKS.kyo]);
    expect(g.zone('p1', 'hand')).toHaveLength(2);
  });

  it('CR 8-1-3-4-5: with only 1 card in hand the replacement cannot be applied; the K.O. happens', () => {
    const g = threatened({ hand: [VAN.mohji] });
    lightning(g, g.find('p1', 'characters', ROCKS.kyo));
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([ROCKS.kyo]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.mohji]);
  });

  it('no [Once Per Turn]: it can replace a second removal in the same turn', () => {
    const g = threatened(
      { characters: [ROCKS.kyo, VAN.marco], hand: [VAN.mohji, VAN.gordon, VAN.sai, VAN.komachiyo] },
      { hand: [AKP.lightning, AKP.lightning], costArea: { active: 8, rested: 0 } },
    );
    const kyo = g.find('p1', 'characters', ROCKS.kyo);
    const marco = g.find('p1', 'characters', VAN.marco);
    lightning(g, kyo);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji), g.find('p1', 'hand', VAN.gordon)]);
    lightning(g, marco);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.sai), g.find('p1', 'hand', VAN.komachiyo)]);
    expect(g.card(kyo).zone).toBe('characters');
    expect(g.card(marco).zone).toBe('characters');
    expect(count(g, 'p1', 'trash')).toBe(4);
  });

  it('"removed" includes placing at the bottom of the deck (opponent’s OP17-046 Gloriosa)', () => {
    const g = theirTurn(
      side(LEAD.rocks, BLUE, { characters: [ROCKS.kyo, VAN.marco], hand: [VAN.mohji, VAN.gordon] }),
      side(LEAD.rocks, BLUE, { hand: [ROCKS.gloriosa], costArea: { active: 4, rested: 0 } }),
    );
    const marco = g.find('p1', 'characters', VAN.marco);
    play(g, g.find('p2', 'hand', ROCKS.gloriosa));
    choose(g, [marco]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji), g.find('p1', 'hand', VAN.gordon)]);
    expect(g.card(marco).zone).toBe('characters');
  });

  it('CR 10-2-1-1: a K.O. in battle is not an effect: no offer, Kyo is K.O.’d', () => {
    // p2's OP02-007 Thatch (8000) attacks rested Kyo (4000).
    const g = threatened(
      { characters: [{ card: ROCKS.kyo, rested: true }] },
      { characters: [VAN.thatch] },
    );
    attack(g, g.find('p2', 'characters', VAN.thatch), g.find('p1', 'characters', ROCKS.kyo));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([ROCKS.kyo]);
  });

  it('p1’s own effect is not "your opponent’s effect": p1’s Gloriosa bottom-decks p1’s Marco with no offer', () => {
    const g = myTurn(
      side(LEAD.rocks, BLUE, {
        characters: [ROCKS.kyo, VAN.marco],
        hand: [ROCKS.gloriosa, VAN.mohji, VAN.gordon],
        costArea: { active: 4, rested: 0 },
      }),
      side(LEAD.luffy, RED),
    );
    play(g, g.find('p1', 'hand', ROCKS.gloriosa));
    choose(g, [g.find('p1', 'characters', VAN.marco)]);
    expect(offered(g, 'p1')).toBe(false);
    expect(g.zone('p1', 'deck').at(-1)!.card).toBe(VAN.marco);
  });

  it('CR 2-8-2: Kyo in hand protects nothing', () => {
    const g = threatened({ characters: [VAN.marco], hand: [ROCKS.kyo, VAN.mohji, VAN.gordon] });
    lightning(g, g.find('p1', 'characters', VAN.marco));
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.marco]);
  });
});
