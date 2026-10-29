/**
 * OP17-050 Streusen (Character, Blue, cost 1, 2000, no Counter, type Rocks Pirates).
 *
 * Card text (cards/data):
 *   "[On Play] Look at 2 cards from the top of your deck, reorganize them in any order and place
 *    them at the top or bottom of your deck. Then, draw 1 card."
 *
 * Reading: both cards go together, either both on top or both at the bottom, in the order p1
 * chooses ("place them at the top or bottom"); splitting them is not offered. Then p1 draws 1.
 * The API does not name the top/bottom choice or the order, so the test enumerates every reachable
 * end state through p1's decisions (API-GAPS.md).
 *
 * Rules: looking at cards leaves them in the deck while looked at (CR 11-3-2); only the controller
 * sees them (CR 11-3-1). "Then" resolves after the placement (CR 4-10-2).
 */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import { decision, play } from '../helpers.ts';
import { BLUE, LEAD, myTurn, outcomes, RED, ROCKS, side, VAN } from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

// Deck top first: A = Marco, B = Sai, then C = Kingdew, D = Thatch, E = Hajrudin.
const A = VAN.marco;
const B = VAN.sai;
const C = VAN.kingdew;
const D = VAN.thatch;
const E = VAN.hajrudin;

function game() {
  const g = myTurn(
    side(LEAD.rocks, BLUE, {
      hand: [ROCKS.streusen],
      deck: [A, B, C, D, E],
      costArea: { active: 1, rested: 0 },
    }),
    side(LEAD.luffy, RED),
  );
  play(g, g.find('p1', 'hand', ROCKS.streusen));
  return g;
}

/** Hand card ids, then deck order top first. */
const state = (g: TestGame) =>
  `${g
    .zone('p1', 'hand')
    .map((c) => c.card)
    .sort()
    .join(',')}|${g
    .zone('p1', 'deck')
    .map((c) => c.card)
    .join(',')}`;

describe('OP17-050 Streusen: [On Play] look at 2, top or bottom in any order, then draw 1', () => {
  it('every reachable result: both on top (either order) then draw, or both at the bottom (either order) then draw', () => {
    const g = game();
    expect(outcomes(g, 'p1', state)).toEqual(
      new Set([
        `${A}|${B},${C},${D},${E}`, // top, A then B: draw A
        `${B}|${A},${C},${D},${E}`, // top, B then A: draw B
        `${C}|${D},${E},${A},${B}`, // bottom, A above B: draw C
        `${C}|${D},${E},${B},${A}`, // bottom, B above A: draw C
      ]),
    );
  });

  it('every branch draws exactly 1 card and keeps 4 in the deck', () => {
    const g = game();
    const sizes = outcomes(
      g,
      'p1',
      (b) => `${b.zone('p1', 'hand').length}/${b.zone('p1', 'deck').length}`,
    );
    expect(sizes).toEqual(new Set(['1/4']));
  });

  it('CR 11-3-1: while p1 decides, the opponent’s view does not show the looked-at cards', () => {
    const g = game();
    expect(decision(g)?.player).toBe('p1');
    const p2View = JSON.stringify(project(g.state, 'p2'));
    expect(p2View).not.toContain(A);
    expect(p2View).not.toContain(B);
  });
});
