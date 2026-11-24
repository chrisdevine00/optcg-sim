/**
 * Constants and helpers for the OP-17 group 1 card tests. Every card below is a vanilla (no effect
 * text) or a Leader whose effects are inert in these positions, so a test never depends on another script.
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { game, PLAIN_BLUE, V } from './helpers.ts';

/** OP02-001 Edward.Newgate Leader (Red, 6000, {Whitebeard Pirates}); only an [End of Your Turn] effect. */
export const NEWGATE_LEADER = 'OP02-001';
/** ST01-001 Monkey.D.Luffy Leader (Red, 5000, {Straw Hat Crew}): not [Edward.Newgate], not Wano, mono. */
export const RED_LEADER = 'ST01-001';
/** ST09-001 Yamato Leader (Yellow, 5000, {Land of Wano}). */
export const WANO_LEADER = 'ST09-001';
/** EB01-001 Kouzuki Oden Leader (Green/Red, {Land of Wano}): multicolored and Wano. */
export const MULTI_WANO_LEADER = 'EB01-001';

/** Whitebeard Pirates vanillas. */
export const ATMOS = 'OP02-003'; // Red, cost 4, 6000, {Whitebeard Pirates}
export const KINGDEW = 'OP02-006'; // Red, cost 5, 7000, {Whitebeard Pirates}
export const DOMA = 'EB01-005'; // Red, cost 1, 3000, {Whitebeard Pirates Allies}
/** Land of Wano vanillas. */
export const SHINOBU = 'OP01-043'; // Green, cost 3, 5000, {Land of Wano}
export const YAMATO_C = 'ST09-013'; // Yellow, cost 5, 7000, {Land of Wano}
/** Red, cost 4, 6000, {Red-Haired Pirates}: neither Wano nor Whitebeard. */
export const ROCKSTAR = 'OP09-016';
/** A Whitebeard Pirates Event with cost 1 (a hand card that no effect may play). */
export const WB_EVENT = 'OP02-022';
/** Characters with 2000 base power. */
export const P2000_A = 'OP14-102';
export const P2000_B = 'OP08-104';
/** 10000 and 12000 power vanillas. */
export const BIG10 = 'EB02-004'; // Red, cost 8, 10000
export const BIG12 = 'P-041'; // Purple, cost 10, 12000

/** True when the deciding player may attack `target` with `attacker`. */
export const canAttack = (g: TestGame, attacker: InstanceId, target: InstanceId): boolean =>
  g.isLegal({ type: 'attack', attacker, target, player: g.decider });

/**
 * p2's 6000-power Character (`V.c4`, or `attacker`) attacks p1's Leader; p1 owes the
 * [On Your Opponent's Attack] decisions next. p2's other Characters go in `p2.characters`.
 */
export function oppAttack(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> = {},
  attacker: string = V.c4,
): TestGame {
  const g = game(
    p1,
    { leader: PLAIN_BLUE, ...p2, characters: [attacker, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', attacker), target: g.leader('p1') });
  return g;
}
