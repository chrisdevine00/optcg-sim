/**
 * Constants and helpers for the OP-14 group 1 card tests. Every card named below is a vanilla, or an
 * unscripted card whose text is inert in these positions.
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import { dec, expectDecision, passBlock, endCounter, V } from './helpers.ts';
import type { TestGame } from '../fixtures/index.ts';
import { mk } from './helpers-op15g1.ts';

export { mk, boost, RED_LEADER, EB, EVENT } from './helpers-op15g1.ts';

/** Red {Supernovas}, 2000 power, cost 2 (unscripted [Bartolomeo]). */
export const SN2 = 'OP01-019';
/** Green {Supernovas}, 2000 power, cost 1. */
export const SN2_GREEN = 'OP07-034';
/** Red {Supernovas} vanilla, 5000 power, cost 3. */
export const SN5 = 'OP14-008';
/** Red vanilla, power 0 (not {Supernovas}). */
export const RED0 = 'OP13-014';
/** Red vanilla, 3000 power, cost 1. */
export const RED3 = 'EB01-005';
/** [Monkey.D.Luffy] {Supernovas} vanilla (cost 4, 6000). */
export const LUFFY_SN = 'P-022';
/** {East Blue} Leader [Kuro]; the cost-6 [Kuro] Character; a cost-7 {East Blue} Character. */
export const KURO_LEADER = 'OP03-021';
export const KURO_CHAR = 'OP04-023';
export const EB7 = 'OP17-035';
/** Green vanillas: cost 3 (OP01-043), cost 5 (EB01-018), cost 6 (OP07-028). */
export const G3 = 'OP01-043';
export const G5 = 'EB01-018';
export const G6 = 'OP07-028';
/** {Straw Hat Crew} vanillas: green cost 4 / 5 / 3, red cost 4. */
export const SHC_G4 = 'OP02-043';
export const SHC_G5 = 'OP02-039';
export const SHC_G3 = 'OP02-028';
export const SHC_R4 = 'ST01-010';
/** Cost-0 Characters do not exist; these are the planted-effect stand-ins. */
export { V };

/** A Character placed with `n` DON!! given (on your own turn each is +1000 power). */
export const withDon = (card: string, n: number) => ({ card, don: n });
export const restedCard = (card: string) => ({ card, rested: true });

/** p1 with a smaller cost area, so DON!! given to Characters keep the total at 10 or less. */
export function mk5(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof mk>[2] = {},
): TestGame {
  return mk({ costArea: { active: 5, rested: 0 }, ...p1 }, p2, extra);
}

/** p1 attacks p2's Leader with `attacker`. Stops at the first decision. */
export function attack(g: TestGame, attacker: InstanceId): void {
  g.act({ type: 'attack', attacker, target: g.leader('p2') });
}

/** Pass the block and counter steps if they are open (after an attack with nothing to respond). */
export function finishBattle(g: TestGame): void {
  if (dec(g)?.kind === 'block') passBlock(g);
  if (dec(g)?.kind === 'counter') endCounter(g);
  while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
}

export { expectDecision };

/** Instances (in order) of the cards in a player's zone. */
export const cardsIn = (g: TestGame, p: 'p1' | 'p2', zone: Parameters<TestGame['zone']>[1]) =>
  g.zone(p, zone).map((c) => c.card);
