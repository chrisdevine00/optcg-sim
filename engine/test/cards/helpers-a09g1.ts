/**
 * Constants and helpers for the OP-09 group 1 card tests (OP09-001 to OP09-030, OP09-042). Every
 * card named below is a vanilla, a [Blocker]-only card, or a Leader whose text is inert where the
 * test puts it (an [Activate: Main] nobody activates).
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import { applyOp, withAbilities } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { game, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { mk as mk15, RED_LEADER, boost, shrinkLeader } from './helpers-op15g1.ts';

export { RED_LEADER, boost, shrinkLeader, V, PLAIN_BLUE, PLAIN_PURPLE };
export { activate, offeredAb, canPick, pickable } from './helpers-w3s.ts';
export { koByEffect, settle, ids } from './helpers-op14g4.ts';
export { plantOpponentEffect } from './helpers-rgl-penel.ts';
export { koedInBattle, plant, canBlockWith, oppAttack } from './helpers-op15g2.ts';
export { finishBattle, p2Attacks, canHit } from './helpers-w4sb.ts';
export { cardsOf, finishOrder } from './helpers-luffyace.ts';
export { types, setMost } from './helpers.ts';
export { buff } from './helpers-op11g1.ts';

/** {Red-Haired Pirates} Leader (ST05-001, only an [Activate: Main], inert here) and a plain Red one. */
export const RHP_LEADER = 'ST05-001';
/** {Kid Pirates} Leader (ST02-001, 5000 power, only an [Activate: Main]). */
export const KID_LEADER = 'ST02-001';
/** [Lim] OP09-022, the only {ODYSSEY} Leader: its text is removed by `inertOdyssey` where it would matter. */
export const ODY_LEADER = 'OP09-022';
/** {Red-Haired Pirates} vanillas: cost 4 / 6000 [Rockstar], cost 5 / 7000 [Howling Gab]. */
export const RHP = { c4: 'OP09-016', c5: 'OP09-006' } as const;
/** {Cross Guild} vanillas: cost 5 / 7000 [Mr.1], cost 6 / 7000 [Buggy]. */
export const CG = { c5: 'OP09-055', c6: 'OP12-049' } as const;
/** [Blocker]-only Characters: cost 2 / 2000 [Ideo] (black), cost 6 / 7000 [Wanda]. */
export const BLK = { c2: 'OP04-077', c6: 'EB03-019' } as const;
/** {ODYSSEY} cards: cost 3 / 2000 [Lim] ([Blocker]), cost 4 / 6000 [Rob Lucci] (vanilla). */
export const ODY = { c3: 'OP03-015', c4: 'OP09-038' } as const;
/** {Straw Hat Crew} vanillas: cost 3 / 5000, cost 4 / 6000, cost 5 / 7000. */
export const SHC = { c3: 'OP02-028', c4: 'OP02-043', c5: 'OP02-039' } as const;
/** An Event with no script (cost 3, Draw 2). */
export const EVENT = 'OP03-056';
/** A Blue Leader with a plain text for the opponent. */
export const OPP_LEADER = PLAIN_BLUE;

/** p1 with 10 active DON!! and the Red Leader unless given; p2 with a plain Leader. */
export function mk(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof mk15>[2] = {},
): TestGame {
  return mk15(p1, p2, extra);
}

/** `mk`, with [Lim]'s text (the {ODYSSEY} Leader) removed so only the script under test acts. */
export function mkOdyssey(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof mk15>[2] = {},
): TestGame {
  const g = mk15({ leader: ODY_LEADER, ...p1 }, p2, extra);
  g.state = withAbilities(g.state, ODY_LEADER, []);
  return g;
}

/** p2's turn (turn 4). */
export const OPP = { turn: 4, activePlayer: 'p2' } as const;

export const rested = (card: string) => ({ card, rested: true });

/** p1 attacks p2's Leader with `attacker`. Stops at the first decision. */
export function attackLeader(g: TestGame, attacker: InstanceId): void {
  g.act({ type: 'attack', attacker, target: g.leader('p2') });
}

/** Lower `target` (any side) by `n` for this turn as an effect of `by`. */
export function shrink(g: TestGame, target: InstanceId, n: number, by: 'p1' | 'p2' = 'p2'): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'power',
      target,
      amount: -n,
      duration: { kind: 'thisTurn', turn: 3 },
      controller: by,
    },
  }).state;
}

export { game };
