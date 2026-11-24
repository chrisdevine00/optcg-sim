/**
 * Helpers and constants for the OP-13 group 4 card tests (OP13-089 to OP13-120). Every constant is a
 * vanilla, or a card whose text is inert where the test puts it (a hand, a trash, a target).
 */
import type { CardId, PlayerSpec } from '@optcg/engine';
import { dec, game, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import type { TestGame } from '../fixtures/index.ts';

export { canActivate, canBlockWith, idsOf, orderAll, plant } from './helpers-op15g2.ts';
export { plantOpponentEffect } from './helpers-rgl-penel.ts';
export { canAccept, canAttack } from './helpers-op15g3.ts';
export { canPick, koByBattle, names, skipOptional, trig } from './helpers-op16g4.ts';
export { counterStep, useCounter } from './helpers-luffyace.ts';

/** OP13-085 Saint Jalmac: {Celestial Dragons} vanilla, cost 2, 4000. */
export const CD2 = 'OP13-085';
/** OP13-083 (cost 4) and OP13-084 (cost 7): black {Five Elders} Characters, inert in a hand. */
export const FE4 = 'OP13-083';
export const FE7 = 'OP13-084';
/** OP05-097 Mary Geoise: {Mary Geoise} Stage, cost 1; OP13-099 is the cost 7 one, EB04-010 a cost 7 Stage of another type. */
export const MG1 = 'OP05-097';
export const STAGE7 = 'EB04-010';
export const STAGE6 = 'OP06-041';
/** OP13-079 Imu Leader (inert); OP07-097 Vegapunk Leader ({Egghead}, inert); EB01-040 Kyros (Black/Yellow, multicolored). */
export const IMU = 'OP13-079';
export const EGG_LEADER = 'OP07-097';
export const MULTI_LEADER = 'EB01-040';
/** Plain Blue Leader (not Egghead, mono-coloured). */
export const OTHER_LEADER = PLAIN_BLUE;
/** A {Supernovas} vanilla Character, cost 4 (Zoro, OP02-043) and one that is not ({Minks} with a Trigger, OP01-009). */
export const SUPERNOVA = 'OP02-043';
/** Characters with a [Trigger] and no On Play: cost 2 [Monet], cost 5 [Zoro OP07-113], cost 6 (see TRIG6). */
export const TRIG2 = 'OP01-082';
export const TRIG5 = 'OP07-113';
/** An Event (inert in a hand). */
export const EVENT = 'ST02-017';

export { PURPLE, V };

/** `n` copies of `card`. */
export const rep = (n: number, card: CardId): CardId[] => Array.from({ length: n }, () => card);

/** p1's Main Phase with `active` active DON!!; the opponent has a plain Blue Leader. */
export function mine(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> = {},
  active = 5,
  rested = 0,
): TestGame {
  return game({ costArea: { active, rested }, ...p1 }, { leader: PLAIN_BLUE, ...p2 });
}

/** p2's turn (turn 4), p1 is the defender; used for the opponent's effects. */
export function theirs(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> = {},
): TestGame {
  return game(p1, { leader: PLAIN_BLUE, ...p2 }, { turn: 4, activePlayer: 'p2' });
}

/** The pending decision's kind (or null at the end of the game). */
export const kind = (g: TestGame): string | null => dec(g)?.kind ?? null;
