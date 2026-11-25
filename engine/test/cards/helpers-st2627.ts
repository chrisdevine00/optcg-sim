/**
 * Constants and helpers for the ST-26 and ST-27 card tests. Every card named below is a vanilla, or
 * an unscripted card whose text is inert where the test puts it.
 */
import type { PlayerSpec } from '@optcg/engine';
import type { InstanceId } from '@optcg/engine';
import { game, PLAIN_BLUE } from './helpers.ts';
import type { TestGame } from '../fixtures/index.ts';

export { activate, canPick, offeredAb, pickable } from './helpers-w3s.ts';
export { koByBattle } from './helpers-op16g4.ts';

/** {Straw Hat Crew} Leaders, 5000 power: Green/Purple (multicolored) and Red (one color). */
export const SHC_MULTI_LEADER = 'EB02-010';
export const SHC_MONO_LEADER = 'ST01-001';
/** Black/Yellow Leader without the {Straw Hat Crew} type (multicolored). */
export const OTHER_MULTI_LEADER = 'EB01-040';
/** Black/Yellow {Blackbeard Pirates} Leader; its text is inert (unscripted) on my turn. */
export const BP_LEADER = 'OP16-080';
/** A Leader that is not {Blackbeard Pirates} (Blue, ST03-001). */
export const NOT_BP_LEADER = PLAIN_BLUE;

/** [San-Gorou] 8000 (cost 6); [Sanji] 7000 (cost 7, only an [On Play]) and [Sanji] 6000 (cost 5). */
export const SAN_GOROU_8000 = 'OP05-065';
export const SANJI_7000 = 'OP09-065';
export const SANJI_6000 = 'OP09-105';
/** A {Straw Hat Crew} [Sanji] with 3000 power (vanilla). */
export const SANJI_3000 = 'OP04-007';
/** Purple vanilla with 8000 power that is neither [San-Gorou] nor [Sanji] (cost 6). */
export const PURPLE_8000 = 'OP01-110';

/** {Blackbeard Pirates} vanillas: Pizarro (Black, cost 4, 6000), Sanjuan.Wolf (Black, cost 5, 7000). */
export const BP4 = 'OP09-082';
export const BP5 = 'OP10-084';
/** {Blackbeard Pirates} Event (Black, cost 1) and a {Blackbeard Pirates} Character with cost 6. */
export const BP_EVENT = 'OP09-096';
export const BP6 = 'OP16-108';
/** The [Fullalead] Stage (Black, its [Activate: Main] is unscripted, so inert). */
export const FULLALEAD = 'OP09-099';

/** `n` copies of a vanilla, as filler. */
export const fill = (n: number, card: string): string[] => Array.from({ length: n }, () => card);

/** p1's turn: p1 has `p1` (Leader default EB02-010 and 10 active DON!!), p2 a plain Blue Leader. */
export function mk(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game(
    { leader: SHC_MULTI_LEADER, costArea: { active: 10, rested: 0 }, ...p1 },
    { leader: PLAIN_BLUE, ...p2 },
    extra,
  );
}

/** Is the DON!! pick (a cost-area DON!!, not a card) among the legal actions? */
export const donPick = (g: TestGame) =>
  g.legal().find((a) => a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice);

/**
 * Pay "DON!! -n" by taking n cost-area DON!! (the shared `payDon` would also take the target pick
 * of an effect that can rest the opponent's DON!!).
 */
export function payDonMinus(g: TestGame, n = 2): void {
  for (let i = 0; i < n; i++) g.act(donPick(g)!);
}

/** Is playing `card` (in the hand of p1) legal now? */
export const playable = (g: TestGame, card: InstanceId): boolean =>
  g.isLegal({ type: 'playCard', card, player: 'p1' });
