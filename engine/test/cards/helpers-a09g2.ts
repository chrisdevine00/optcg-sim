/**
 * Constants and helpers for the OP-09 group 2 card tests (OP09-031 to OP09-074). Every card named
 * below is a vanilla, or an unscripted card whose text is inert where the test puts it (in a deck,
 * a hand or placed by the scenario, so no [On Play] runs).
 */
import { dec } from './helpers.ts';

export { mk, boost, RED_LEADER } from './helpers-op15g1.ts';
export { canPick, pickable, koBy } from './helpers-w3s.ts';
export { settle, ids, koByEffect } from './helpers-op14g4.ts';
export { p2Attacks, finishBattle } from './helpers-w4sb.ts';
export { KID_LEADER, OTHER_LEADER, plant } from './helpers-eb04g2.ts';

/** [Buggy] Leader {Cross Guild} (only an [Activate: Main], inert here); Red {Straw Hat Crew} Leader. */
export const CG_LEADER = 'OP09-042';
/** {Cross Guild} Characters: cost 5 / 6000 [Mohji & Cabaji], cost 6 / 7000 [Buggy]. */
export const CG5 = 'OP12-055';
export const CG6 = 'OP12-049';
/** {Former Baroque Works}{Cross Guild} cost 5 / 7000 [Mr.1]; {Baroque Works} cost 5 / 6000 [Mr.9]. */
export const CGFBW5 = 'OP09-055';
export const BW5 = 'OP14-095';
/** {Impel Down}{Former Baroque Works} vanillas: cost 5 / 7000 and cost 4 / 6000. */
export const FBW5 = 'OP02-053';
export const FBW4 = 'ST30-013';
/** {Land of Wano} vanilla (cost 1); {Whitebeard Pirates} (cost 4, Blue); {Former Whitebeard Pirates} (cost 3). */
export const WANO1 = 'OP01-036';
export const WB4 = 'OP09-049';
export const FWB3 = 'OP01-023';
/** {Whitebeard Pirates Allies} cost 1: its type includes "Whitebeard Pirates". */
export const WBA1 = 'EB01-005';
/** {Thriller Bark Pirates} cost 4; [Dracule Mihawk] (no Thriller Bark type, cost 6, Blue). */
export const TB4 = 'ST12-005';
export const MIHAWK = 'OP02-055';
/** {ODYSSEY} vanilla, cost 4 (Green). */
export const OD4 = 'OP09-038';
/** {Heart Pirates} vanillas: cost 4, and cost 1 ({Minks}). */
export const HP4 = 'OP01-045';
export const HP1 = 'ST02-012';
/** {Straw Hat Crew} vanillas: cost 1 (Red) and cost 3 (Green). */
export const SH1 = 'OP04-007';
export const SH3 = 'OP02-028';
/** A Blue Event with no effect in a deck (cost 3), a Red Event (cost 4), a Black Event (cost 3). */
export const BLUE_EVENT = 'OP03-056';
export const RED_EVENT = 'ST01-015';
export const BLACK_EVENT = 'ST08-015';
/** A Stage (cost 1, Black). */
export const STAGE = 'OP04-096';
/** A Blue vanilla Character (cost 1) that is none of the above types. */
export const BLUE_C1 = 'OP02-060';
export { dec };
