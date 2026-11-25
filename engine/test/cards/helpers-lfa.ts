/**
 * Constants and helpers for the leftovers group A card tests (EB02-030, EB03-018, OP09-033, OP09-045,
 * OP09-086, OP10-070, OP10-104, OP11-006, OP11-023, OP11-046, OP12-021, OP12-024, OP12-027, OP12-028,
 * OP12-034, OP12-101, OP13-025, OP15-099). Every constant is a vanilla (or a card whose text is
 * inert where the test puts it): a Character on a field, a card in a hand, a deck or a trash.
 */
import type { CardId, InstanceId, PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { BLUE, dec, game, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';

export { BLUE, PLAIN_BLUE, PLAIN_PURPLE, V };
export { canActivate, idsOf, koedInBattle, oppAttack, plant } from './helpers-op15g2.ts';
export { counterStep, useCounter } from './helpers-luffyace.ts';
export { damageWithP2, plantOpponentEffect } from './helpers-rgl-penel.ts';

/** ST01-001 Luffy Leader: {Straw Hat Crew} {Supernovas}, <Strike> (its only text is an inert [Activate: Main]). */
export const SUPERNOVAS_LEADER = 'ST01-001';
/** OP06-020 Hody Jones Leader: {Fish-Man}, <Strike>. Text inert in these tests. */
export const FISH_MAN_LEADER = 'OP06-020';
/** OP09-081 Marshall.D.Teach Leader: {Blackbeard Pirates}, <Special> (unscripted). */
export const BLACKBEARD_LEADER = 'OP09-081';
/** OP01-001 [Roronoa Zoro] Leader: {Straw Hat Crew} {Supernovas}, <Slash>. */
export const ZORO_LEADER = 'OP01-001';
/** OP06-001 Uta Leader: {FILM}, <Special>. */
export const FILM_LEADER = 'OP06-001';
/** ST05-001 Shanks Leader: {FILM} {Red-Haired Pirates}, <Slash>. */
export const SLASH_LEADER = 'ST05-001';
/** ST03-001 Crocodile Leader: <Special>, no FILM, no Supernovas (PLAIN_BLUE). */
export const OTHER_LEADER = PLAIN_BLUE;

/** <Slash> vanillas by cost: 1 (3000), 3 (5000), 4 (6000, red), 5 (7000), 6 (8000). */
export const SLASH1 = V.c1;
export const SLASH3 = V.c3;
export const SLASH4 = 'OP02-003';
export const SLASH5 = 'OP10-068';
export const SLASH6 = 'OP02-055';
/** <Strike> cost 2 (V.c2), <Ranged> cost 4 (V.c4), <Special> cost 6 (V.c6): not <Slash>. */
export const STRIKE2 = V.c2;
export const RANGED4 = V.c4;
export const SPECIAL6 = V.c6;
/** <Special> vanillas: [Marco] cost 3 / 5000 (red), [Charlotte Opera] cost 4 / 6000. */
export const SPECIAL3 = 'OP01-023';
/** [Mohji] (OP02-060, = BLUE) and [Buggy] (ST03-011), vanillas. */
export const MOHJI = BLUE;
export const BUGGY = 'ST03-011';
/** {ODYSSEY} {CP9} vanilla cost 4 / 6000, {Straw Hat Crew} {Alabasta} vanilla cost 1 / 3000. */
export const ODYSSEY4 = 'OP09-038';
export const SHC1 = 'OP04-007';
/** {GERMA 66} {The Vinsmoke Family} vanilla cost 5 / 6000. */
export const GERMA5 = 'OP11-045';
/** Characters with 1000 / 0 / 2000 base power whose text is inert on a field. */
export const POWER1000 = 'EB02-012';
export const POWER0 = 'EB01-016';
export const POWER2000 = 'EB01-017';
/** A green Event ([Main] unscripted, never played here) and a red Event. */
export const GREEN_EVENT = 'ST02-017';
export const RED_EVENT = 'ST01-016';

export const rep = (n: number, card: CardId): CardId[] => Array.from({ length: n }, () => card);

/** p1's turn 3 over `leader` with `active` active DON!!, p2 over a plain Blue Leader. */
export function mine(
  leader: PlayerSpec['leader'],
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  active = 5,
  rested = 0,
): TestGame {
  return game({ leader, costArea: { active, rested }, ...p1 }, { leader: PLAIN_BLUE, ...p2 });
}

/** The same, on p2's turn (4) with p2 active: p1 defends. */
export function theirs(
  leader: PlayerSpec['leader'],
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  active = 5,
): TestGame {
  return game(
    { leader, costArea: { active, rested: 0 }, ...p1 },
    { leader: PLAIN_PURPLE, ...p2 },
    { turn: 4, activePlayer: 'p2' },
  );
}

/** K.O. `card` of `who` now, as an effect of `by` (the engine op, no prompt). */
export function koBy(g: TestGame, who: 'p1' | 'p2', card: CardId, by: 'p1' | 'p2', nth = 0): void {
  g.state = applyOp(g.state, { op: 'ko', card: g.find(who, 'characters', card, nth), by }).state;
}

/** The instance ids the open choice offers. */
export const offered = (g: TestGame): InstanceId[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));

/** Is the open decision an `optional` that can be accepted? */
export const canAcceptNow = (g: TestGame): boolean =>
  dec(g)?.kind === 'optional' && g.legal().some((a) => a.type === 'optional' && a.accept);

/** Answer every pending `order` decision with its first legal order. */
export function orderAll(g: TestGame): void {
  while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
}

export { activate, offeredAb } from './helpers-w3s.ts';
export { finishOrder } from './helpers-luffyace.ts';
export { atMain } from './helpers-op16g1.ts';
export { damageWith } from './triggers.ts';
