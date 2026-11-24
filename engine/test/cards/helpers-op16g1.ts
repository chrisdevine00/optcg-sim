/**
 * Constants and helpers for the OP-16 group 1 card tests. Every Character below is a vanilla (no
 * effect text) unless noted, and every Leader's effects are inert in these positions.
 */
import type { InstanceId } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { dec, expectDecision, hand, trash } from './helpers.ts';

export { dec, expectDecision, hand, trash };

/** Leaders. */
export const ACE_LEADER = 'OP16-001'; // Red, {Whitebeard Pirates}, name includes "Ace"
export const WB_LEADER = 'OP02-001'; // Red, {Whitebeard Pirates}; only an [End of Your Turn] effect
export const RED_LEADER = 'ST01-001'; // Red, {Straw Hat Crew}
export const SHANKS_LEADER = 'ST05-001'; // Purple, {Red-Haired Pirates}; Activate: Main only
export const WANO_LEADER = 'ST09-001'; // Yellow, {Land of Wano}
export const IMPEL_LEADER = 'OP02-049'; // Blue, {Impel Down}; End of Your Turn only
export const OP16_022 = 'OP16-022'; // Blue/Green Luffy Leader, {Impel Down}

/** {Whitebeard Pirates} vanillas: 8000 power cost 7, 8000 cost 6 (Allies), 7000 cost 5, 9000 cost 7. */
export const WB8 = 'OP16-004';
export const WB8B = 'OP16-016';
export const WB7 = 'OP02-006';
export const WB9 = 'OP02-020';
/** Cost 8, {Whitebeard Pirates}, 8000 power: [Thatch] (OP16-005, its hand discount is inert on the field). */
export const WB_COST8 = 'OP16-005';
/** Purple 8000 power vanilla, no Whitebeard type. */
export const NON_WB8 = 'OP01-110';
/** Red 6000 power vanilla named [Monkey.D.Luffy]. */
export const LUFFY_V = 'P-022';
/** Red vanilla named [Shanks], cost 8. */
export const SHANKS_V = 'P-016';
/** Red {Red-Haired Pirates} vanillas: 6000 cost 4, 8000 cost 6. */
export const RHP6 = 'OP09-016';
export const RHP8 = 'P-023';
/** Red 10000 power cost 8 vanilla. */
export const BIG10 = 'EB02-004';
/** {Impel Down} vanillas: Purple 3000 cost 1, Green 3000 cost 1. */
export const IMPEL_V = 'OP02-084';
export const IMPEL_G = 'OP16-023';
/** Green vanillas: cost 1 3000 {Land of Wano}, cost 5 7000, cost 6 8000, cost 4 6000. */
export const GREEN1 = 'OP01-036';
export const GREEN5 = 'EB01-018';
export const GREEN6 = 'OP04-023';
export const GREEN4 = 'OP01-045';
/** 2000 base power Characters (OP14-102, OP08-104) and a 3000 one: the V.c1 vanilla. */
export const P2000_A = 'OP14-102';
export const P2000_B = 'OP08-104';

/** True when `card` has `ability` available to activate right now. */
export const canActivate = (g: TestGame, card: InstanceId, ability: string): boolean =>
  g.isLegal({ type: 'activate', card, ability, player: g.decider });

/** True when the deciding player may attack `target` with `attacker`. */
export const canAttack = (g: TestGame, attacker: InstanceId, target: InstanceId): boolean =>
  g.isLegal({ type: 'attack', attacker, target, player: g.decider });

/** Is a choose decision open that offers this instance? */
export const offers = (g: TestGame, id: InstanceId): boolean =>
  g.legal().some((a) => a.type === 'pick' && a.choice === id);

/** Whether the accept answer of the open optional decision is legal. */
export const canAccept = (g: TestGame): boolean =>
  g.legal().some((a) => a.type === 'optional' && a.accept);

export const idsIn = (
  g: TestGame,
  p: 'p1' | 'p2',
  zone: Parameters<TestGame['zone']>[1],
): string[] => g.zone(p, zone).map((c) => c.card);

/** Is the decision queue idle (a `main` decision for p1)? */
export const atMain = (g: TestGame): boolean => dec(g)?.kind === 'main';
