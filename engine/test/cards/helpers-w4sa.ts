/**
 * Constants and helpers for the wave 4 group A tests (OP15-001 .. OP15-116, OP13-046, OP14-051).
 * Positions are built from vanilla cards; the cards under test are the only scripts that matter.
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { game, PLAIN_BLUE } from './helpers.ts';

/** An {East Blue} Character, cost 1, 3000 power, no script. */
export const EB1 = 'OP03-023';
/** An {East Blue} Character, cost 5, 7000 power, no script. */
export const EB5 = 'EB05-015';

/** A rested card entry for a `PlayerSpec`. */
export const rested = (card: string, extra: object = {}) => ({ card, rested: true, ...extra });

const TEN = { active: 10, rested: 0 };

/** p1's turn 3 with ten active DON!!, Leader PLAIN_BLUE unless given. */
export function mk(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return game({ leader: PLAIN_BLUE, costArea: TEN, ...p1 }, { leader: PLAIN_BLUE, ...p2 });
}

/** Give `target` `n` power for this turn (a stand-in for an effect that did it). */
export function boost(g: TestGame, target: InstanceId, n: number, turn = 3): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'power',
      target,
      amount: n,
      duration: { kind: 'thisTurn', turn },
      controller: 'p1',
    },
  }).state;
}

/** The ids that can be picked right now. */
export const choices = (g: TestGame): InstanceId[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
