/**
 * Constants and set-ups for the OP-18 group g2 card tests (the Baroque Works and Water Seven cards).
 * Cards named here are vanillas or have text that is inert where the test puts them.
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { game, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';

export { PLAIN_BLUE, PLAIN_PURPLE, V };
export { koBy, activate, offeredAb } from './helpers-w3s.ts';
export { buff } from './helpers-op11g1.ts';
export { finishBattle } from './helpers-w4sb.ts';
export { candidates, ids, OPP, plantOpponentEffect } from './helpers-a10g1.ts';

/** {Baroque Works} Leader (ST03-001 Crocodile, its Activate: Main is not used) and OP18-041 itself. */
export const BW_L = 'ST03-001';
export const SUNDAY_L = 'OP18-041';
/** {Former Baroque Works} cost 2 / 3000 (inert text), cost 2 / 1000 (inert), and {Baroque Works} vanillas cost 4 / 6000, 5 / 6000. */
export const BW2 = 'OP01-083';
export const BW2_WEAK = 'PRB02-009';
export const BW4 = 'OP18-043';
export const BW5 = 'OP14-095';
/** A {Baroque Works} Character with cost 9 (OP18-046; only ever sits in a hand here). */
export const BW9 = 'OP18-046';
/** {Dressrosa}: Leader EB01-040 Kyros, Character cost 2 / 4000 (OP01-076), cost 3 / 5000 (OP10-054). */
export const DR_L = 'EB01-040';
export const DR2 = 'OP01-076';
export const DR3 = 'OP10-054';
/** [Monkey.D.Luffy] Leader EB02-010 (Green) and Character P-022 (cost 4 / 6000). */
export const LUFFY_L = 'EB02-010';
export const LUFFY_C = 'P-022';
/** An Event (cost 3), for a trash. */
export const EVENT = 'OP03-056';

/** p1's turn 3 with 5 active DON!! unless given. */
export function mine(
  p1: Partial<PlayerSpec> & { leader?: PlayerSpec['leader'] } = {},
  p2: Partial<PlayerSpec> = {},
): TestGame {
  return game(
    { leader: PLAIN_PURPLE, costArea: { active: 5, rested: 0 }, ...p1 },
    { leader: PLAIN_BLUE, ...p2 },
  );
}

/** The skipRefresh modifiers on a card. */
export const skipRefreshOn = (g: TestGame, id: InstanceId): number =>
  (g.state as unknown as { mods: { kind: string; target: string }[] }).mods.filter(
    (m) => m.kind === 'skipRefresh' && m.target === id,
  ).length;
