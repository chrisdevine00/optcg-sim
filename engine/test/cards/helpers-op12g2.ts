/**
 * Helpers and constants for the OP-12 group 2 card tests (OP12-040 to OP12-077). Every card named
 * below is a vanilla, or a card whose text is inert where the test puts it (trash, hand, a target).
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { game, PLAIN_BLUE, V } from './helpers.ts';

export { plantOpponentEffect } from './helpers-rgl-penel.ts';
export { counterGame } from './helpers-op14g4.ts';
export { koedInBattle, oppAttack, plant } from './helpers-op15g2.ts';
export { damageWith } from './triggers.ts';

/** ST06-001 Sakazuki: Black {Navy} Leader whose only text is an [Activate: Main]. */
export const NAVY_LEADER = 'ST06-001';
/** PRB01-001 Sanji: Red {Straw Hat Crew} Leader named [Sanji] (Activate: Main only). */
export const SANJI_LEADER = 'PRB01-001';
/** OP12-041 Sanji: Blue/Purple (multicolored) Leader named [Sanji] (Activate: Main only). */
export const SANJI_MULTI = 'OP12-041';
/** ST03-001 Crocodile: Blue {Baroque Works}/{The Seven Warlords of the Sea} Leader. */
export const BW_LEADER = 'ST03-001';
/** OP14-001 Trafalgar Law: Red Leader named [Trafalgar Law] (Activate: Main only). */
export const LAW_LEADER = 'OP14-001';
/** ST04-001 Kaido: Purple Leader of none of the types used here. */
export const OTHER_LEADER = 'ST04-001';
/** ST05-001 Shanks: Purple mono-colored Leader. */
export const MONO_LEADER = 'ST05-001';

/** Blue {Navy} vanillas: cost 4 / 5 ([Sengoku]) / 6 / 7 at 6000 / 7000 / 8000 / 8000, cost 8 at 10000. */
export const BN = {
  c4: 'OP12-052',
  c5: 'OP06-049',
  c6: 'OP12-045',
  c7: 'EB05-026',
  c8big: 'OP05-044',
} as const;
/** Purple {Navy} vanilla, cost 4, 6000 (not blue). */
export const NAVY_PURPLE = 'EB02-034';
/** Black {Navy} vanilla, cost 1 (3000). */
export const NAVY_C1 = 'OP02-097';
/** Green {Heart Pirates} vanilla, cost 4 (6000) and black [Trafalgar Law] vanilla, cost 5 (7000). */
export const HEART4 = 'OP01-045';
export const LAW_CHAR = 'OP04-087';
/** Green [Donquixote Rosinante], cost 2, [Blocker] only. */
export const ROSI_G = 'OP05-030';
/** Events whose text is never used here. */
export const EVENT = 'ST02-017';
export const EVENT2 = 'ST01-016';

export const rep = (n: number, card: string): string[] => Array.from({ length: n }, () => card);

/** p1 with `active` DON!! (default 5), a Navy Leader, and a plain opponent. */
export function mine(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
  active = 5,
  rested = 0,
): TestGame {
  return game(
    { leader: NAVY_LEADER, costArea: { active, rested }, ...p1 },
    { leader: PLAIN_BLUE, ...p2 },
    extra,
  );
}

/** p2's turn (turn 4) for the same position. */
export const opp = { turn: 4, activePlayer: 'p2' } as const;

export const ids = (g: TestGame, p: 'p1' | 'p2', z: Parameters<TestGame['zone']>[1]): string[] =>
  g.zone(p, z).map((c) => c.card);

export const activate = (g: TestGame, card: InstanceId, ability: string): void => {
  g.act({ type: 'activate', card, ability });
};
export const canActivate = (g: TestGame, card: InstanceId, ability: string): boolean =>
  g.isLegal({ type: 'activate', card, ability, player: g.decider });
export const canAttack = (g: TestGame, attacker: InstanceId, target: InstanceId): boolean =>
  g.isLegal({ type: 'attack', attacker, target, player: g.decider });

/** Is `blocker` among the legal blocks of the open block decision? */
export const canBlockWith = (g: TestGame, blocker: InstanceId): boolean =>
  g.legal().some((a) => a.type === 'block' && a.blocker === blocker);

/** Whether the accept answer of the open optional decision is legal (a cost can be paid). */
export const canAccept = (g: TestGame): boolean =>
  g.legal().some((a) => a.type === 'optional' && a.accept);

/** An effect of `by` K.O.s `owner`'s Character `card`. */
export function koByEffect(g: TestGame, owner: 'p1' | 'p2', card: string): void {
  g.state = applyOp(g.state, {
    op: 'ko',
    card: g.find(owner, 'characters', card),
    by: owner === 'p1' ? 'p2' : 'p1',
  }).state;
}

/** The pick candidates open right now. */
export const offered = (g: TestGame): string[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));

export { V };
