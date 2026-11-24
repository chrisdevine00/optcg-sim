/**
 * Constants and helpers for the wave-4 scripting group B card tests (OP14-001, OP14-009, OP14-017,
 * OP14-115, EB03-008, EB03-054, EB03-055, EB03-057, EB04-044, EB04-050). Every card named below is a
 * vanilla, or an unscripted card whose text is inert in these positions.
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { dec, endCounter, expectDecision, game, passBlock, PLAIN_BLUE, V } from './helpers.ts';

export { mk, boost, RED_LEADER } from './helpers-op15g1.ts';
export { SN2, SN5, cardsIn } from './helpers-op14g1.ts';
export { activate, offeredAb, canPick } from './helpers-w3s.ts';

/** {Heart Pirates} vanillas: green cost 1 / 3000, cost 4 / 6000, black cost 5 / 7000. */
export const HP3 = 'ST02-012';
export const HP6 = 'OP01-045';
export const HP7 = 'OP04-087';
/** {Navy}{SWORD} Leader (5000, text unscripted) and a {SWORD}{Navy} vanilla, cost 6 / 7000. */
export const SWORD_LEADER = 'OP11-001';
export const SWORD7 = 'OP11-017';
/** {Navy} Leader (5000) and {Navy} vanillas: black cost 1 / 3000 and cost 6 / 8000. */
export const NAVY_LEADER = 'ST06-001';
export const NAVY3 = 'OP02-097';
export const NAVY8 = 'EB02-042';
/** {Kuja Pirates} Leader, {Land of Wano} Leader, {Straw Hat Crew} Leader. */
export const KUJA_LEADER = 'OP07-038';
export const WANO_LEADER = 'ST09-001';
export const SHC_LEADER = 'ST01-001';

/** p2 attacks p1's Leader with `attacker`, p1's own [On Your Opponent's Attack] next. */
export function p2Attacks(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  attacker: string = V.c4,
  p2chars: PlayerSpec['characters'] = [attacker],
): TestGame {
  const g = game(p1, { leader: PLAIN_BLUE, characters: p2chars }, { turn: 4, activePlayer: 'p2' });
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', attacker), target: g.leader('p1') });
  return g;
}

/** Pass block and counter and answer any [Trigger] with "no". */
export function finishBattle(g: TestGame): void {
  if (dec(g)?.kind === 'block') passBlock(g);
  if (dec(g)?.kind === 'counter') endCounter(g);
  while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
}

/** Whether `attacker` (p1) may attack `target` (p2) right now. */
export const canHit = (g: TestGame, attacker: InstanceId, target: InstanceId): boolean =>
  g.isLegal({ type: 'attack', attacker, target, player: 'p1' });

export { expectDecision };
