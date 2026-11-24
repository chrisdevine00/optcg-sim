/**
 * Constants and helpers for the ST-29 and older block 4 card tests (st29old). Every card named
 * below is a vanilla, or an unscripted card whose text is inert in the position the test uses.
 */
import type { InstanceId } from '@optcg/engine';
import { dec, endCounter, passBlock, times, BLUE } from './helpers.ts';
import type { TestGame } from '../fixtures/index.ts';

export { mk, boost, RED_LEADER, EVENT } from './helpers-op15g1.ts';
export { SHC, EGGHEAD, finishOrder } from './helpers-luffyace.ts';
export { canPick, pickable, activate, koBy } from './helpers-w3s.ts';
export { plantOpponentEffect } from './helpers-rgl-penel.ts';

/** Red Leader named [Monkey.D.Luffy], {Straw Hat Crew}, 5000 power, 5 Life (its [Activate: Main] is inert here). */
export const LUFFY_LEADER = 'ST01-001';
/** Blue Leader named [Nami], {East Blue}, 5000 power (a deck-win rule only). */
export const NAMI_LEADER = 'OP03-040';
/** Yellow {Egghead} vanilla, cost 4, 6000 power; and a red {Egghead} vanilla, cost 3, 5000. */
export const EGG4 = 'OP07-108';
export const EGG3 = 'ST21-006';
/** A Character named [Monkey.D.Luffy] (red, cost 4, 6000), vanilla. */
export const LUFFY_C = 'P-022';
/** Red {Supernovas} vanillas: cost 3 / 5000, cost 6 / 7000. */
export const SN3 = 'OP14-008';
/** Red vanilla, cost 1, 3000; green {Supernovas}, cost 1, 2000; red cost 2, 3000. */
export const RED1 = 'EB01-005';
export const GREEN_SN1 = 'OP07-034';
export const RED2 = 'OP01-009';
/** A Character whose printed [Trigger] is "Play this card." (cost 2, red/other; inert in a hand). */
export const TRG = 'OP01-082';
/** {Dressrosa} vanillas: cost 2 / 4000, cost 3 / 5000; a {Dressrosa} Leader. */
export const DR2 = 'OP01-076';
export const DR3 = 'OP10-054';
export const DR_LEADER = 'OP04-039';
/** A Stage with a {Dressrosa} type is Corrida Coliseum itself. */
export const CORRIDA = 'OP04-096';

/** `n` filler Life cards. */
export const lifeOf = (n: number): string[] => times(n, BLUE);

/** The ids (in order) of the cards in a zone. */
export const cardsIn = (g: TestGame, p: 'p1' | 'p2', zone: Parameters<TestGame['zone']>[1]) =>
  g.zone(p, zone).map((c) => c.card);

/** p1 attacks p2's Leader with `attacker`. Stops at the first decision. */
export function attackLeader(g: TestGame, attacker: InstanceId): void {
  g.act({ type: 'attack', attacker, target: g.leader('p2') });
}

/** Pass the block and counter steps if open, and decline damage triggers. */
export function finishBattle(g: TestGame): void {
  if (dec(g)?.kind === 'block') passBlock(g);
  if (dec(g)?.kind === 'counter') endCounter(g);
  while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
}

/** Raw pick of one instance (asserts it is a legal pick). */
export function pickOne(g: TestGame, id: InstanceId): void {
  g.act({ type: 'pick', choice: id });
}
