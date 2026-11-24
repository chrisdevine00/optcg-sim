/**
 * Constants and helpers for the EB-03 group 1 card tests. Every card named below is a vanilla, or an
 * unscripted card whose text is inert in these positions.
 */
import type { InstanceId } from '@optcg/engine';
import { dec, endCounter, expectDecision, passBlock } from './helpers.ts';
import type { TestGame } from '../fixtures/index.ts';

export { mk, boost, RED_LEADER, EVENT } from './helpers-op15g1.ts';
export { canPick, activate, offeredAb } from './helpers-w3s.ts';
export { finishOrder } from './helpers-luffyace.ts';

/** Leaders (their own effects are inert where used). */
export const SUGAR_L = 'OP10-003';
export const VIVI_L = 'OP04-001'; // Blue/Red, [Nefeltari Vivi], multicolored, {Alabasta}
export const ODEN_L = 'OP01-031'; // Green, [Kouzuki Oden], <Slash>, {Land of Wano}
export const HANCOCK_L = 'OP07-038'; // Blue, [Boa Hancock]
export const KATAKURI_L = 'OP03-099'; // Yellow, [Charlotte Katakuri]
export const SN_LEADER = 'OP10-099'; // Yellow, {Supernovas}
/** Red Leader, <Strike>, {Straw Hat Crew}{Supernovas}: not multicolored, no [Sugar]/[Vivi]/... name. */
export const STRIKE_L = 'ST01-001';

/** {Donquixote Pirates} vanillas: 5000/cost 3, 6000/cost 4, 7000/cost 5, 8000/cost 6. */
export const DP = { c3: 'OP05-035', c4: 'OP10-073', c5: 'OP10-068', c6: 'OP14-066' } as const;
/** A Character with 0 power (vanilla, {Baterilla}) and one with 1000 (unscripted, {East Blue}). */
export const P0 = 'OP13-014';
export const P1000 = 'EB02-012';
/** {Alabasta}: cost 2 / cost 5 (6000) / cost 6; {Straw Hat Crew} cost 5 / cost 6. */
export const ALA2 = 'ST01-009';
export const ALA5 = 'OP13-011';
export const ALA6 = 'OP14-030';
export const SHC5 = 'OP02-039';
export const SHC6 = 'OP05-065';
/** {Amazon Lily} cost 4, {Kuja Pirates} cost 6. */
export const AL4 = 'OP08-048';
export const KUJA6 = 'OP16-112';
/** {Animal}/{SMILE}: cost 2 (SMILE), cost 3 (SMILE), cost 4 ({Animal}), cost 5 ({SMILE}). */
export const SM2 = 'OP02-080';
export const SM3 = 'OP02-077';
export const AN4 = 'OP02-088';
/** {FILM}: Usopp (cost 3), Jinbe (cost 2, also {Fish-Man}). */
export const FILM3 = 'OP02-028';
export const FILM2 = 'OP02-033';
/** {Merfolk} Camie (cost 1), {Fish-Man} Namule (cost 3). */
export const MERFOLK1 = 'OP03-101';
export const FISH3 = 'OP03-007';
/** The [Zou] Stage (cost 3). */
export const ZOU = 'OP08-039';
/** [Boa Hancock] Character (cost 6, 8000). */
export const HANCOCK_CHAR = 'OP07-051';
/** [Charlotte Katakuri] Character (cost 2, 3000). */
export const KATAKURI_CHAR = 'OP08-062';
/** A cost 4, {Big Mom Pirates} vanilla. */
export const BM4 = 'OP03-106';

/** p1 attacks p2's Leader with `attacker`. Stops at the first decision. */
export function attackLeader(g: TestGame, attacker: InstanceId): void {
  g.act({ type: 'attack', attacker, target: g.leader('p2') });
}

/** Pass the block and counter steps if they are open. */
export function finishBattle(g: TestGame): void {
  if (dec(g)?.kind === 'block') passBlock(g);
  if (dec(g)?.kind === 'counter') endCounter(g);
  while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
}

export { expectDecision };

/** Instances (in order) of the cards in a player's zone. */
export const cardsIn = (g: TestGame, p: 'p1' | 'p2', zone: Parameters<TestGame['zone']>[1]) =>
  g.zone(p, zone).map((c) => c.card);
