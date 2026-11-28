/**
 * Constants and set-ups for the OP-18 card tests (Franky and Luffy slice first). Unscripted cards are
 * used as scenery where their own text cannot fire.
 */
import type { PlayerSpec } from '@optcg/engine';
import { game, PLAIN_BLUE, PLAIN_PURPLE, times, BLUE, PURPLE } from './helpers.ts';
import type { TestGame } from '../fixtures/index.ts';

export const FRANKY_L = 'OP18-021';
/** EB02-010 Monkey.D.Luffy Leader (Green, {Straw Hat Crew}). */
export const LUFFY_L = 'EB02-010';
/** Unscripted Stages (inert): cost 2 {Straw Hat Crew}, cost 3 {Water Seven}, cost 5, cost 6. */
export const STAGE2 = 'ST01-017';
export const STAGE3 = 'OP03-075';
export const STAGE5 = 'OP05-040';
export const STAGE6 = 'OP06-041';
/** Vanilla {Straw Hat Crew} Characters: cost/power 2/4000, 3/5000, 4/6000, 5/7000, 6/8000. */
export const SHC2 = 'OP02-033';
export const SHC3 = 'ST01-008';
export const SHC4 = 'OP02-043';
export const SHC5 = 'OP02-039';
export const SHC6 = 'OP05-065';
/** Vanilla {Water Seven}/{The Franky Family} cost 2/4000, and a {Water Seven}-only cost 3/5000. */
export const FF2 = 'OP03-061';
export const W7 = 'OP18-035';
export { PLAIN_BLUE, PLAIN_PURPLE };

/** p1's turn 3 with `p1` and 5 active DON!!; p2 a plain Blue Leader. */
export function mine(
  p1: Partial<PlayerSpec> & { leader?: PlayerSpec['leader'] } = {},
  p2: Partial<PlayerSpec> = {},
): TestGame {
  return game(
    { leader: PLAIN_PURPLE, costArea: { active: 5, rested: 0 }, ...p1 },
    { leader: PLAIN_BLUE, ...p2 },
  );
}

/** p2's turn 4 (p1 defends). */
export function theirs(
  p1: Partial<PlayerSpec> & { leader?: PlayerSpec['leader'] } = {},
  p2: Partial<PlayerSpec> = {},
): TestGame {
  return game(
    { leader: PLAIN_PURPLE, ...p1 },
    { leader: PLAIN_BLUE, costArea: { active: 5, rested: 0 }, ...p2 },
    { turn: 4, activePlayer: 'p2' },
  );
}

export const deckOf = (cards: string[], fill = BLUE) => [...cards, ...times(10, fill)];
export { PURPLE };
