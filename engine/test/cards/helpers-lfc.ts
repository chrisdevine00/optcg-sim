/**
 * Helpers and constants for the leftovers group C card tests (ST24-001 to ST24-005, ST25-001 to
 * ST25-005, ST28-001 to ST28-005). Every card named below is a vanilla or an unscripted card whose
 * text is inert where the test puts it.
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { dec, don, expectDecision, game, hand, PLAIN_BLUE, times, trash, V } from './helpers.ts';
import { damageWith } from './triggers.ts';

export { canPick, pickable, offeredAb, activate } from './helpers-w3s.ts';
export { koByEffect, settle } from './helpers-op14g4.ts';
export { plantOpponentEffect } from './helpers-rgl-penel.ts';
export { canBlockWith, canAccept, offered } from './helpers-op12g2.ts';
export { p2Attacks, finishBattle } from './helpers-w4sb.ts';
export { accept, decline, none, option, pick, play, payDon } from './helpers.ts';
export { dec, don, expectDecision, game, hand, times, trash, V, PLAIN_BLUE, damageWith };

/** A Leader named [Buggy] ({Cross Guild}); its [Activate: Main] is never used here. */
export const BUGGY_LEADER = 'OP09-042';
/** Another Leader named [Buggy] ({Buggy Pirates}, scripted; only its permanent shape is idle here). */
export const NOT_BUGGY_LEADER = PLAIN_BLUE;
/** {Land of Wano} Leader [Kin'emon] (only an [Activate: Main], never used here). */
export const WANO_LEADER = 'OP02-025';
/** {Supernovas} Leader [Eustass"Captain"Kid] (only an [Activate: Main], never used here). */
export const SUPERNOVAS_LEADER = 'ST02-001';

/** {Cross Guild} Characters, vanilla or inert here: cost 2 [Richie] ([Blocker]), 4 [Mihawk], 5, 6 and 7. */
export const CG2 = 'OP09-054';
export const CG4 = 'P-081';
export const CG5 = 'OP09-055';
export const CG6 = 'OP12-049';
export const CG7 = 'P-084';
/** {Supernovas} vanillas: cost 3 [Apoo] and cost 5 [Urouge]. */
export const SN3 = 'OP14-008';
export const SN5 = 'OP10-101';
/** {Land of Wano} vanillas: cost 1 [Otsuru], cost 2 [Kawamatsu], cost 3 [Shinobu]. */
export const WANO1 = 'OP01-036';
export const WANO2 = 'OP01-037';
export const WANO3 = 'OP01-043';
/** An Event (unscripted, cost 3): hand and deck fodder. */
export const EVENT = 'OP03-056';

export const ids = (g: TestGame, p: 'p1' | 'p2', z: Parameters<TestGame['zone']>[1]): string[] =>
  g.zone(p, z).map((c) => c.card);

/** p1 on turn 3 with 10 active DON!! and a plain Leader unless given; the opponent has a plain Leader. */
export function mk(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game(
    { leader: PLAIN_BLUE, costArea: { active: 10, rested: 0 }, ...p1 },
    { leader: PLAIN_BLUE, ...p2 },
    extra,
  );
}

/** p2's turn (turn 4). */
export const opp = { turn: 4, activePlayer: 'p2' } as const;

/** The current cost of a card of `p` in `zone`. */
export const costOf = (g: TestGame, p: 'p1' | 'p2', card: string): number =>
  g.card(g.find(p, 'characters', card)).cost ?? -1;

/** Raise a card's current cost by `n` for this turn (a stand-in for an effect that did it). */
export function raiseCost(g: TestGame, target: InstanceId, n: number, turn = 3): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'cost',
      target,
      amount: n,
      duration: { kind: 'thisTurn', turn },
      controller: 'p1',
    },
  }).state;
}
