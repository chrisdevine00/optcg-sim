/**
 * EB03-023 Kaya (Character, Blue, cost 2, 0 power, Counter +2000, {East Blue}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck and place them at the top or bottom
 * of the deck in any order."
 *
 * Rules: looking leaves the cards in the deck (CR 11-3-2) and only the controller sees them (CR 11-3-1).
 * Whether the 5 cards may be split between top and bottom is not settled by the card text; the tests
 * assert only what every reading shares (the multiset, the untouched cards below, both "all on top"
 * and "all at the bottom" being reachable, any order, nothing drawn or trashed, no leak). The decision
 * encoding is not part of the API, so end states are enumerated through p1's decisions
 * (`outcomes`, API-GAPS-a.md).
 */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import {
  chr,
  decision,
  hand,
  kind,
  LA,
  mine,
  outcomes,
  playRaw,
  SA,
  trash,
  zoneIds,
} from './kit-eb03a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const KAYA = 'EB03-023';

// Looked-at cards, top first: five distinct cards. Below them: F (6th), then fillers.
const A = SA.marco;
const B = SA.sai;
const C = SA.kingdew;
const D = SA.thatch;
const E = SA.hajrudin;
const F = SA.oars;
const BELOW = [F, ...Array(9).fill(SA.mohji)];

function start(top: string[] = [A, B, C, D, E], below: string[] = BELOW) {
  const g = mine(LA.croc, { hand: [KAYA], deck: [...top, ...below] });
  playRaw(g, KAYA);
  return g;
}

const deckOrder = (g: TestGame) =>
  g
    .zone('p1', 'deck')
    .map((c) => c.card)
    .join(',');

describe('EB03-023 Kaya: printed values', () => {
  it('cost 2, 0 power, Counter +2000', () => {
    const g = mine(LA.croc, { characters: [KAYA] });
    const k = chr(g, 'p1', KAYA);
    expect(g.card(k).cost).toBe(2);
    expect(g.power(k)).toBe(0);
    expect(g.card(k).counter).toBe(2000);
  });
});

describe('EB03-023 Kaya: [On Play] look at 5 cards from the top of your deck and place them at the top or bottom in any order', () => {
  it('the player is asked to arrange the cards (the effect is not automatic)', () => {
    const g = start();
    expect(kind(g)).not.toBe('main');
    expect(decision(g)?.player).toBe('p1');
  });

  it('every reachable end state keeps all 15 deck cards: the 5 looked-at cards stay in the deck', () => {
    const g = start();
    const sizes = outcomes(g, 'p1', (b) => `${b.zone('p1', 'deck').length}`);
    expect(sizes).toEqual(new Set(['15']));
  });

  it('nothing is drawn, added to hand or trashed', () => {
    const g = start();
    const res = outcomes(g, 'p1', (b) => `${hand(b).length}/${trash(b).length}`);
    expect(res).toEqual(new Set(['0/0']));
  });

  it('"all 5 on top" is reachable in the original order and in another order', () => {
    const g = start();
    const decks = outcomes(g, 'p1', deckOrder);
    expect([...decks]).toContain([A, B, C, D, E, F, ...BELOW.slice(1)].join(','));
    const reordered = [...decks].filter(
      (d) => d.startsWith(`${E},${D},${C},${B},${A},${F}`) || d.startsWith(`${B},${A},${C}`),
    );
    expect(reordered.length).toBeGreaterThan(0);
  });

  it('"all 5 at the bottom" is reachable: the 6th card becomes the top card and the 5 sit at the bottom', () => {
    const g = start();
    const decks = outcomes(g, 'p1', deckOrder);
    const bottom = [...decks].filter((d) => d.startsWith(`${F},`));
    expect(bottom.length).toBeGreaterThan(0);
    for (const d of bottom) {
      expect(d.split(',').slice(-5).sort()).toEqual([A, B, C, D, E].sort());
    }
  });

  it('cards below the looked-at 5 are never disturbed: they keep their order among themselves', () => {
    const g = start();
    const below = BELOW.join(',');
    for (const d of outcomes(g, 'p1', deckOrder)) {
      const rest = d
        .split(',')
        .filter((c) => ![A, B, C, D, E].includes(c as typeof A))
        .join(',');
      expect(rest).toBe(below);
    }
  });

  it('every reachable deck order is a permutation of the same 15 cards', () => {
    const g = start();
    const expected = [A, B, C, D, E, ...BELOW].sort().join(',');
    for (const d of outcomes(g, 'p1', deckOrder)) {
      expect(d.split(',').sort().join(',')).toBe(expected);
    }
  });

  it('a deck of fewer than 5 cards: all of them are looked at and the deck keeps its size', () => {
    const g = start([A, B, C], []);
    const sizes = outcomes(g, 'p1', (b) => `${b.zone('p1', 'deck').length}`);
    expect(sizes).toEqual(new Set(['3']));
  });

  it("CR 11-3-1: while p1 decides, the opponent's view does not show the looked-at cards", () => {
    const g = start();
    expect(decision(g)?.player).toBe('p1');
    const p2View = JSON.stringify(project(g.state, 'p2'));
    for (const c of [A, B, C, D, E]) expect(p2View).not.toContain(`"${c}"`);
  });

  it('Kaya herself stays on the field', () => {
    const g = start();
    const ends = outcomes(g, 'p1', (b) => zoneIds(b, 'p1', 'characters').join(','));
    expect(ends).toEqual(new Set([KAYA]));
  });
});
