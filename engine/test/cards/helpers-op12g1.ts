/**
 * Constants and helpers for the OP-12 group 1 card tests. Every constant below is a vanilla, or an
 * unscripted card whose text is inert in these positions.
 */
import type { CardId, InstanceId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { game, PLAIN_BLUE } from './helpers.ts';

export { PLAIN_BLUE };
export { EVENTS, SHC, RED_3000 } from './helpers-luffyace.ts';
export {
  RAYLEIGH_LEADER,
  RAYLEIGH_C,
  RED_LEADER,
  canActivate,
  activateAb,
} from './helpers-eb04g1.ts';

/** [Roronoa Zoro] Leader (Red, 5000 power); its own effect is unscripted. */
export const ZORO_LEADER = 'OP01-001';
/** {Former Roger Pirates} vanillas: cost 6 / 8000 and cost 6 / 7000. */
export const ROGER_A = 'EB01-041';
export const ROGER_B = 'OP12-010';
/** Red vanilla Character, cost 1, 3000 power, {Straw Hat Crew}-free (RED1) and a Blue 3000 one. */
export const BLUE_3000 = 'OP02-060';
/** Red vanilla Characters: cost 2 / 3000, cost 2 / 4000. */
export const RED_C2_3000 = 'OP01-009';
export const RED_C2_4000 = 'ST21-005';

const TEN = { active: 10, rested: 0 };

/** p1's turn 3 with ten active DON!! and the Red Leader unless given. */
export function mk(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return game({ leader: 'ST01-001', costArea: TEN, ...p1 }, { leader: PLAIN_BLUE, ...p2 });
}

/** A rested Character entry for a `PlayerSpec`. */
export const rested = (card: CardId) => ({ card, rested: true });

/** The ids that can be picked right now (card instances). */
export const choices = (g: TestGame): InstanceId[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));

/** Instance `nth` of `card` in a zone. */
export const at = (
  g: TestGame,
  p: 'p1' | 'p2',
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): InstanceId => g.find(p, zone, card, nth);

export const isRested = (g: TestGame, id: InstanceId): boolean => g.card(id).rested === true;
