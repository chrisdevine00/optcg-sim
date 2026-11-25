/**
 * Constants and helpers for the leftovers group B tests (ST-22 and ST-23). Every constant is a
 * vanilla, or an unscripted card whose text is inert where the test puts it.
 */
import type { CardId, InstanceId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { game, PLAIN_BLUE, times, V, BLUE } from './helpers.ts';

export { PLAIN_BLUE, times, V, BLUE };
export { activateAb, canActivate, offered, at, isRested, RED_LEADER } from './helpers-eb04g1.ts';

/** {Whitebeard Pirates} vanillas: [Atmos] cost 4 / 6000, [Kingdew] cost 5 / 7000, [Thatch] cost 6 / 8000. */
export const WB4 = 'OP02-003';
export const WB5 = 'OP02-006';
export const WB6 = 'OP02-007';
/** [Edward.Newgate] {Whitebeard Pirates} vanilla, cost 5 / 6000 (the card ST22-015 plays). */
export const EDWARD = 'OP12-002';
/** "Whitebeard Pirates Allies" (substring of the type) cost 1, and "Former Whitebeard Pirates" cost 3. */
export const ALLY1 = 'EB01-005';
export const FORMER3 = 'OP01-023';
/** A {Whitebeard Pirates} Leader whose own text is not used by these tests: [Ace & Newgate]. */
export const WB_LEADER = 'ST22-001';
/** Red vanillas: cost 8 / 10000 and the Red Leader [Monkey.D.Luffy] ST01-001 (not Whitebeard). */
export const RED8 = 'EB02-004';
export const OTHER_LEADER = 'ST01-001';
/** {Red-Haired Pirates} Leader (inert here), the [Uta] Leader (inert) and a {FILM} Leader that is neither. */
export const RHP_LEADER = 'ST05-001';
export const UTA_LEADER = 'OP06-001';

const TEN = { active: 10, rested: 0 };

/** p1's turn 3 with ten active DON!!, p1 over the Red Leader unless given. */
export function mk(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return game({ leader: OTHER_LEADER, costArea: TEN, ...p1 }, { leader: PLAIN_BLUE, ...p2 });
}

/** The ids that can be picked right now. */
export const choices = (g: TestGame): InstanceId[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));

export const deckOf = (g: TestGame, p: 'p1' | 'p2'): CardId[] =>
  g.zone(p, 'deck').map((c) => c.card);
