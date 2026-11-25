/**
 * Constants and helpers for the OP-10 group 1 card tests (OP10-001 to OP10-035, OP10-042, OP10-099).
 * Every card named below is a vanilla, or an unscripted card whose text is inert where the test
 * puts it (placed by the scenario, so no [On Play] runs).
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { dec, expectDecision, V } from './helpers.ts';
import { mk as mk15, RED_LEADER, boost } from './helpers-op15g1.ts';

export { RED_LEADER, boost, V };
export { activate, offeredAb, canPick, pickable } from './helpers-w3s.ts';
export { koByEffect, settle, ids } from './helpers-op14g4.ts';
export { plantOpponentEffect } from './helpers-rgl-penel.ts';
export { koedInBattle, plant } from './helpers-op15g2.ts';
export { NAVY_LEADER } from './helpers-w4sb.ts';

/** Blue {Punk Hazard} vanillas: [Monet] cost 2 / 3000, [Mocha] cost 3 / 5000, cost 4 / 6000, [Vergo] cost 5 / 7000. */
export const PH = { c2: 'OP01-082', c3: 'OP01-081', c4: 'OP11-015', c5: 'OP01-065' } as const;
/** [Smiley] (OP01-072, unscripted, cost 3), [Caesar Clown] OP01-069 is not used. */
export const SMILEY = 'OP01-072';
/** {Navy} vanillas: cost 1 / 3000 (black), cost 5 / 7000 (black). */
export const NAVY = { c1: 'OP02-097', c5: 'ST08-010' } as const;
/** {Navy} Leader ST06-001 (Activate: Main only), and a Leader with neither Navy nor Punk Hazard. */
export const NAVY_L = 'ST06-001';
/** [Caesar Clown] OP10-002 as a {Punk Hazard} Leader (only a [When Attacking], inert here). */
export const PH_LEADER = 'OP10-002';
/** Red {Straw Hat Crew} Leader: neither Navy nor Punk Hazard. */
export const PLAIN_LEADER = RED_LEADER;

/** {Dressrosa} vanillas by cost: 1 / 1000 [Gyats]-like (OP04-080), 2 / 4000, 3 / 5000, 5 / 6000. */
export const DR = { c1: 'OP04-080', c2: 'OP01-076', c3: 'OP10-054', c5: 'EB03-030' } as const;
/** {Donquixote Pirates}: 5000 (cost 3, vanilla) and 6000 (cost 5), 7000 [Vergo] (cost 5). */
export const DP = { p5: 'OP05-035', p6: 'OP12-076', p7: 'OP12-064' } as const;
/** {Supernovas}: cost 2 (OP01-019), cost 3 (OP14-008), cost 4 (P-022), cost 8 (OP01-051), cost 10 (ST24-004). */
export const SN = {
  c2: 'OP01-019',
  c3: 'OP14-008',
  c4: 'P-022',
  c8: 'OP01-051',
  c10: 'ST24-004',
} as const;
/** {ODYSSEY} (green): cost 4 / 6000 vanilla, cost 5 (OP09-028), cost 6 (OP09-026). */
export const OD = { c4: 'OP09-038', c5: 'OP09-028', c6: 'OP09-026' } as const;
/** {The Akazaya Nine}: cost 2 / 3000, cost 5 / 6000, cost 6 / 8000. */
export const AKA = { c2: 'OP01-037', c5: 'OP12-023', c6: 'OP12-025' } as const;
/** Green vanillas: cost 3 (OP01-043), cost 5 (EB01-018), and a Purple one is V.cN. */
export const G3 = 'OP01-043';
export const G5 = 'EB01-018';
/** An Event with no script, cost 3 (Draw 2). */
export const EVENT = 'OP03-056';

/** p1 with 10 active DON!! and the Red Leader unless given; p2 with a plain Leader. */
export function mk(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof mk15>[2] = {},
): TestGame {
  return mk15(p1, p2, extra);
}

/** p2's turn (turn 4). */
export const OPP = { turn: 4, activePlayer: 'p2' } as const;

export const rested = (card: string) => ({ card, rested: true });

/** The pick candidates of the open choice. */
export const candidates = (g: TestGame): InstanceId[] =>
  g
    .legal()
    .filter((a) => a.type === 'pick' && typeof a.choice === 'string')
    .map((a) => (a as { choice: InstanceId }).choice);

/** Open decision kind, or 'none'. */
export const kind = (g: TestGame): string => dec(g)?.kind ?? 'none';

/** K.O. p1's `card` as an effect of p2 (a stand-in for the opponent's effect). */
export function koP1(g: TestGame, card: string, by: 'p1' | 'p2' = 'p2'): void {
  g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', card), by }).state;
}

/** Skip an end-of-turn trigger decision if one is open (used after endTurn). */
export function expectOptional(g: TestGame): void {
  expectDecision(g, 'optional', 'p1');
}
