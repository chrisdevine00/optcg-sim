/**
 * Helpers and constants for the EB-04 group 2 card tests (EB04-028 to EB04-060). Every constant is
 * a vanilla, or a card whose text is inert where the test puts it (a hand, a trash, a target).
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import { applyOp, withAbilities, type Ability } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { game, PLAIN_BLUE, PURPLE, V, BLUE } from './helpers.ts';

export { PLAIN_BLUE, PURPLE, V, BLUE };
export { boost } from './helpers-op15g1.ts';
export { canPick, pickable } from './helpers-w3s.ts';
export { canActivate, canAttack, offers } from './helpers-op16g1.ts';
export { koByBattle, names, trig } from './helpers-op16g4.ts';
export { idsOf, koedInBattle, oppAttack } from './helpers-op15g2.ts';
export { attackP1Leader, triggerHit } from './helpers-robin.ts';

/** Leaders whose own text is inert in these positions (Activate-only or an unrelated timing). */
export const NAVY_LEADER = 'OP02-093'; // Smoker, Black, {Navy}
export const SANJI_LEADER = 'PRB01-001'; // Sanji, Red
export const FOXY_LEADER = 'OP07-059'; // Foxy, Purple, {Foxy Pirates}
export const KID_LEADER = 'ST02-001'; // Eustass"Captain"Kid, Green, {Kid Pirates}
export const REV_LEADER = 'OP05-002'; // Belo Betty, Red/Yellow, {Revolutionary Army}
export const OTHER_LEADER = PLAIN_BLUE; // ST03-001 Crocodile

/** Vanillas (cost / power): {Foxy Pirates} Komei 4 / 6000 (also {Navy}). */
export const FOXY4 = 'EB02-034';
/** [Porche] EB04-037: {Foxy Pirates} cost 1 / 2000 ([On Play] only, inert once placed). */
export const FOXY1 = 'EB04-037';
/** [Sanji] vanillas: Red 1 / 3000 and Black 8 / 9000. */
export const SANJI1 = 'OP04-007';
export const SANJI8 = 'OP16-086';
/** {Kid Pirates} Green 2 / 4000 and a cost 7 {Kid Pirates} (inert in a hand). */
export const KID2 = 'OP01-053';
export const KID7 = 'ST02-013';
/** {SWORD} cost 1 (its [When Attacking] is inert) and cost 4 (inert in hand or trash). */
export const SWORD1 = 'OP11-013';
export const SWORD4 = 'EB03-041';
/** {Revolutionary Army}: Black 2 / 4000, Yellow 4 / 6000, Black 5 / 6000. */
export const REV2 = 'EB05-041';
export const REV4 = 'OP09-113';
export const REV5 = 'OP12-083';
/** Black vanillas: cost 1 / 3000 {Navy}, cost 5 / 6000, cost 6 / 8000 {Navy}. */
export const BLACK1 = 'OP02-097';
export const BLACK5 = 'OP12-083';
export const BLACK6 = 'EB02-042';
/** Cost 8 vanilla (10000), and a 12000-power Character (cost 10, [On Play] only, inert placed). */
export const COST8 = 'OP12-082';
export const BIG12 = 'OP01-094';
/** A yellow vanilla with 6000 power (cost 4) and one with 7000 (cost 5). */
export const Y6000 = 'OP03-106';
export const Y7000 = 'OP04-114';
/** Yellow {Egghead} vanilla (cost 4) and a {Scientist} vanilla ([Shaka] cost 5). */
export const EGGHEAD4 = 'OP07-108';
export const SCIENTIST5 = 'OP13-107';
/** An Event with no script (cost 3). */
export const EVENT = 'OP03-056';

export const rep = (n: number, card: string): string[] => Array.from({ length: n }, () => card);

/** Instance ids by card in a zone. */
export const ids = (g: TestGame, p: 'p1' | 'p2', z: Parameters<TestGame['zone']>[1]): string[] =>
  g.zone(p, z).map((c) => c.card);

/** p1's turn with a Leader, 10 active DON!! by default; the opponent has a plain Leader. */
export function mine(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game({ costArea: { active: 10, rested: 0 }, ...p1 }, { leader: PLAIN_BLUE, ...p2 }, extra);
}

/** Run a planted effect of the active player's Leader (a stand-in for an unrelated source). */
export function plant(g: TestGame, player: 'p1' | 'p2', action: Record<string, unknown>): void {
  const leader: InstanceId = g.leader(player);
  const card = g.card(leader).card;
  g.state = withAbilities(g.state, card, [
    {
      id: 'planted',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: action }],
    } as unknown as Ability,
  ]);
  g.act({ type: 'activate', card: leader, ability: 'planted' });
}

/** An effect of `by` K.O.s `who`'s Character `card` right now. */
export function koNow(g: TestGame, who: 'p1' | 'p2', card: string, by: 'p1' | 'p2', nth = 0): void {
  g.state = applyOp(g.state, { op: 'ko', card: g.find(who, 'characters', card, nth), by }).state;
}
