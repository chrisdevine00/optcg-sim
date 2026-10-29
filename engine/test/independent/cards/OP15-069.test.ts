/**
 * OP15-069 Nola (Character, Purple, cost 1, 2000, Counter +2000, Animal / Sky Island).
 *
 * Card text (cards/data, no override text patch):
 *   "If your Character with 7000 base power or less would be removed from the field by your
 *    opponent's effect, you may return 1 DON!! card from your field to your DON!! deck instead."
 *
 * Rules relied on:
 * - CR 8-1-3-4 / RL-31: optional replacement ("may … instead").
 * - CR 4-11-2 / RL-15: "removed from the field" covers K.O., return to hand and bottom of deck.
 *   A lost battle is not an effect (CR 10-2-1-1), and your own effects are not the opponent's.
 * - CR 4-9-2: "base power" is the printed power (7000 exactly qualifies).
 * - CR 8-1-3-4-5: with no DON!! on the field the replacement cannot be applied.
 *
 * The removal effects come from the other meta lists: OP09-077 Gum-Gum Lightning (K.O. ≤6000),
 * OP17-056 Rocks Pirates ([Main] rest 5: return a cost ≤6 Character to hand) and OP17-046 Gloriosa
 * ([On Play] place a cost ≤5 Character at the bottom of the owner's deck).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, passBlock, passCounter } from '../helpers.ts';
import {
  AKP,
  accept,
  choose,
  decline,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  RED,
  ROCKS,
  side,
  sortedIds,
  theirTurn,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function theirs(p1: Partial<PlayerSpec>, p2: Partial<PlayerSpec>) {
  return theirTurn(
    side(LEAD.shanks, PURPLE, {
      characters: [AKP.nola, VAN.marco],
      costArea: { active: 0, rested: 2 },
      ...p1,
    }),
    side(LEAD.luffy, RED, p2),
  );
}

/** p2 plays OP09-077 Gum-Gum Lightning (DON!! −2) at `target`. */
function lightning(g: TestGame, target: string) {
  act(g, { type: 'playCard', card: g.find('p2', 'hand', AKP.lightning) });
  if (offered(g, 'p2')) accept(g);
  payDon(g, 2, 'costRested');
  choose(g, [target]);
}

/** p2 plays OP17-056 Rocks Pirates (rest 5 DON!!) at `target`. */
function bounce(g: TestGame, target: string) {
  act(g, { type: 'playCard', card: g.find('p2', 'hand', ROCKS.rocksEvent) });
  if (offered(g, 'p2')) accept(g);
  payDon(g, 5);
  choose(g, [target]);
}

describe('OP15-069 Nola: return 1 DON!! instead of a ≤7000-base Character leaving by the opponent’s effect', () => {
  it('K.O. by the opponent’s effect: optional; returning 1 DON!! keeps Marco on the field', () => {
    const g = theirs({}, { hand: [AKP.lightning], costArea: { active: 4, rested: 0 } });
    const marco = g.find('p1', 'characters', VAN.marco);
    lightning(g, marco);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1, 'costRested');
    expect(g.card(marco).zone).toBe('characters');
    expect(donOf(g, 'p1').deck).toBe(9);
  });

  it('RL-31: declining lets the K.O. happen', () => {
    const g = theirs({}, { hand: [AKP.lightning], costArea: { active: 4, rested: 0 } });
    lightning(g, g.find('p1', 'characters', VAN.marco));
    decline(g);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.marco]);
  });

  it('Nola protects itself (2000 base power)', () => {
    const g = theirs({}, { hand: [AKP.lightning], costArea: { active: 4, rested: 0 } });
    const nola = g.find('p1', 'characters', AKP.nola);
    lightning(g, nola);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1, 'costRested');
    expect(g.card(nola).zone).toBe('characters');
  });

  it('CR 8-1-3-4-5: no DON!! on p1’s field → no replacement; Marco is K.O.’d', () => {
    const g = theirs(
      { costArea: { active: 0, rested: 0 } },
      { hand: [AKP.lightning], costArea: { active: 4, rested: 0 } },
    );
    lightning(g, g.find('p1', 'characters', VAN.marco));
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.marco]);
  });

  it('RL-15: return to hand counts as removal (OP17-056 bounce on Marco) → optional', () => {
    const g = theirs({}, { hand: [ROCKS.rocksEvent], costArea: { active: 5, rested: 0 } });
    const marco = g.find('p1', 'characters', VAN.marco);
    bounce(g, marco);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1, 'costRested');
    expect(g.card(marco).zone).toBe('characters');
  });

  it('CR 4-9-2: exactly 7000 base power qualifies (OP02-006 Kingdew bounced) → optional', () => {
    const g = theirs(
      { characters: [AKP.nola, VAN.kingdew] },
      { hand: [ROCKS.rocksEvent], costArea: { active: 5, rested: 0 } },
    );
    bounce(g, g.find('p1', 'characters', VAN.kingdew));
    expect(offered(g, 'p1')).toBe(true);
  });

  it('base power 8000 (OP02-007 Thatch) is not covered: no optional, Thatch returns to hand', () => {
    const g = theirs(
      { characters: [AKP.nola, VAN.thatch] },
      { hand: [ROCKS.rocksEvent], costArea: { active: 5, rested: 0 } },
    );
    bounce(g, g.find('p1', 'characters', VAN.thatch));
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.thatch]);
  });

  it('RL-15: placing at the bottom of the deck counts (OP17-046 Gloriosa’s [On Play]) → optional', () => {
    const g = theirs({}, { hand: [ROCKS.gloriosa], costArea: { active: 4, rested: 0 } });
    const marco = g.find('p1', 'characters', VAN.marco);
    act(g, { type: 'playCard', card: g.find('p2', 'hand', ROCKS.gloriosa) });
    choose(g, [marco]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1, 'costRested');
    expect(g.card(marco).zone).toBe('characters');
  });

  it('CR 10-2-1-1: a battle K.O. is not an effect → no optional', () => {
    const g = theirs(
      { characters: [AKP.nola, { card: VAN.marco, rested: true }] },
      { characters: [VAN.thatch] },
    );
    attack(g, g.find('p2', 'characters', VAN.thatch), g.find('p1', 'characters', VAN.marco));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(offered(g, 'p1')).toBe(false);
    passCounter(g);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.marco]);
  });

  it('your own effect is not covered: p1’s Gloriosa bottom-decks p1’s Marco with no optional', () => {
    const g = myTurn(
      side(LEAD.shanks, PURPLE, {
        characters: [AKP.nola, VAN.marco],
        hand: [ROCKS.gloriosa],
        costArea: { active: 4, rested: 0 },
      }),
      side(LEAD.luffy, RED),
    );
    const decksize = g.zone('p1', 'deck').length;
    act(g, { type: 'playCard', card: g.find('p1', 'hand', ROCKS.gloriosa) });
    choose(g, [g.find('p1', 'characters', VAN.marco)]);
    expect(offered(g, 'p1')).toBe(false);
    expect(g.zone('p1', 'deck')).toHaveLength(decksize + 1);
    expect(g.zone('p1', 'deck').at(-1)!.card).toBe(VAN.marco);
  });
});
