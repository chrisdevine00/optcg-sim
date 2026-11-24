/**
 * Constants and helpers for the OP-11 group 3 card tests (OP11-072 to OP11-119). Every card named
 * below is a vanilla, or an unscripted card whose text is inert where a test puts it (a hand, a
 * trash, a target); a Leader's own text is inert in these positions.
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { dec, expectDecision, game, PLAIN_BLUE, V } from './helpers.ts';

export { mk, boost, RED_LEADER } from './helpers-op15g1.ts';
export { activate, canPick, offeredAb, pickable } from './helpers-w3s.ts';
export { canActivate, canAttack } from './helpers-op16g1.ts';
export { idsOf, plant, orderAll, koedInBattle, canBlockWith } from './helpers-op15g2.ts';
export { damageGame } from './helpers-hancock-rosi.ts';
export { counterStep, useCounter, finishOrder } from './helpers-luffyace.ts';
export { koNow, rep } from './helpers-op14g3.ts';
export { canHit, finishBattle, NAVY_LEADER, NAVY3, NAVY8 } from './helpers-w4sb.ts';

/** OP11-022 Shirahoshi Leader (Green/Yellow, {Merfolk}); its text is inert in these positions. */
export const SHIRAHOSHI = 'OP11-022';
/** EB05-010 Nico Robin Leader (Green/Yellow); its trigger is inert in these positions. */
export const ROBIN_LEADER = 'EB05-010';
/** EB01-021 Hannyabal Leader ({Impel Down}, Blue/Purple, End of Your Turn only). */
export const IMPEL_LEADER = 'EB01-021';
/** Impel Down vanillas: Purple cost 1 / 3000, Purple cost 4 / 6000. */
export const IMPEL1 = 'OP02-084';
export const IMPEL4 = 'OP02-088';
/** Big Mom Pirates: cost 2 / 3000 and cost 5 / 7000 (no text on the field). */
export const BMP2 = 'OP04-113';
export const BMP5 = 'OP04-114';
/** SMILE: cost 3 / 5000, cost 5 / 7000 and cost 6 / 7000. */
export const SMILE3 = 'OP02-077';
export const SMILE5 = 'OP01-107';
export const SMILE6 = 'OP12-092';
/** [Camie] (Yellow, cost 1, 3000, {Merfolk}). */
export const CAMIE = 'OP03-101';
/** {Merfolk}/{Fish-Man Island} [Camie] (a Fish-Man Island type card). */
export const FMI_CAMIE = 'OP11-102';
/** [Caribou]: cost 3, cost 4 and cost 5. */
export const CARIBOU3 = 'OP01-007';
export const CARIBOU4 = 'OP07-023';
export const CARIBOU5 = 'OP17-101';
/** Cost 9 (9000) and cost 8 (10000) Characters. */
export const COST9 = 'ST04-003';
export const COST8 = 'OP12-082';
/** Black {Navy}: cost 1 / 3000, cost 3 / 5000, cost 4 / 6000; Blue {Navy} cost 5 / 7000. */
export const NAVY_B1 = 'OP02-097';
export const NAVY_B3 = 'OP02-116';
export const NAVY_B4 = 'OP02-109';
export const NAVY_BLUE5 = 'OP06-049';
/** {Neptunian} cost 6, {Fish-Man} cost 2, {Merfolk} cost 1. */
export const NEPTUNIAN = 'OP11-026';
export const FISHMAN = 'OP01-037';
export const MERFOLK = CAMIE;
/** Events with no text on the field/trash: cost 1 / 2 / 3 / 4. */
export const EVT = ['ST02-017', 'ST01-016', 'ST08-015', 'ST01-015'] as const;
/** Stage [Fish-Man Island] (OP11-117; its Activate is not used where it is scenery). */
export const FMI_STAGE = 'OP11-117';

export { PLAIN_BLUE, V };
export type Spec = Partial<PlayerSpec> & { leader: PlayerSpec['leader'] };

/** A face-up / face-down Life card. */
export const up = (card: string) => ({ card, faceUp: true });

/** p2 attacks p1's Leader with a 9000-power Character; stops at the block decision. */
export function p2Attacks(p1: Spec, p2chars: PlayerSpec['characters'] = [V.c7]): TestGame {
  const g = game(p1, { leader: PLAIN_BLUE, characters: p2chars }, { turn: 4, activePlayer: 'p2' });
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  return g;
}

/** The prompt of the pending decision. */
export const prompt = (g: TestGame): string => dec(g)?.prompt ?? '';

/** Answer every `order` decision in canonical order, then expect the main decision. */
export function expectMain(g: TestGame, who: 'p1' | 'p2' = 'p1'): void {
  while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
  expectDecision(g, 'main', who);
}

export type { InstanceId };
