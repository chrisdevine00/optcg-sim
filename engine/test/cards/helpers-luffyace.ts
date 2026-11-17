/**
 * Helpers and vanilla constants for the Luffy & Ace archetype card tests (M4b wave 2). Kept apart
 * from helpers.ts so parallel agents do not edit the same file. Every constant below is a card with
 * no effect text of its own (a vanilla), so a test never depends on another script.
 */
import type { CardId, InstanceId, PlayerSpec } from '@optcg/engine';
import { type TestGame } from '../fixtures/index.ts';
import { dec, endCounter, game, passBlock, PLAIN_BLUE, V } from './helpers.ts';

/** Red Leader, type "Straw Hat Crew" (its only text is an [Activate: Main] these tests never use). */
export const SHC_LEADER = 'ST01-001';
/** Straw Hat Crew vanilla Characters: [id, cost, power]. */
export const SHC = {
  sanji1: 'OP04-007', // Red, cost 1, 3000, {Alabasta}{Straw Hat Crew}
  jinbe2: 'ST21-005', // Red, cost 2, 4000
  franky4: 'ST01-010', // Red, cost 4, 6000
  franky5: 'OP02-039', // Green, cost 5, 7000, {FILM}{Straw Hat Crew}
  zoro4: 'OP02-043', // Green, cost 4, 6000
  nami5: 'OP10-013', // Red, cost 5, 7000
  usopp5: 'OP11-003', // Red, cost 5, 6000
} as const;
/** Red vanilla Character, cost 2, 3000 power, type {Minks} (not Straw Hat Crew). */
export const RED_3000 = 'OP01-009';
/** Red vanilla Character, cost 4, 6000 power, {Whitebeard Pirates}. */
export const WHITEBEARD = 'OP02-003';
/** Red vanilla Character, cost 4, 6000 power, named [Portgas.D.Ace], {Whitebeard Pirates}. */
export const ACE = 'P-119';
/** Red vanilla Character, cost 4, 6000 power, named [Monkey.D.Luffy], {Straw Hat Crew}. */
export const LUFFY_C = 'P-022';
/** Yellow vanilla Character, cost 4, 6000 power, {Egghead}. */
export const EGGHEAD = 'OP07-108';
/** Yellow vanilla Character, cost 5, 7000 power, {Fallen Monk Pirates}{Supernovas}. */
export const SUPERNOVA = 'OP10-101';
/** Purple vanilla Character, cost 10, 12000 power. */
export const COST10 = 'P-041';
/** Red vanilla Character, cost 8, 10000 power. */
export const COST8 = 'EB02-004';
/** Any two printed Events, used as hand fodder ("reveal 2 Events"). Never played in these tests. */
export const EVENTS = ['EB04-009', 'OP01-028'] as const;
/** A Blue vanilla with 9000 power: the attacker in counter positions. */
export const BIG = V.c7;

/** Board DON!!: `n` active cost-area DON!!. */
export const donArea = (active: number, rested = 0) => ({ costArea: { active, rested } });

export const cardsOf = (g: TestGame, p: 'p1' | 'p2', zone: Parameters<TestGame['zone']>[1]) =>
  g.zone(p, zone).map((c) => c.card);

/**
 * p2's Character attacks p1's Leader and p1 is at the Counter Step with the Event still in hand.
 * `p1` describes the defender; `p2` the attacker's side. The attacker is a 9000-power vanilla
 * unless `attacker` names another Character.
 */
export function counterStep(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> = {},
  attacker: CardId = BIG,
): TestGame {
  const g = game(
    p1,
    { leader: PLAIN_BLUE, ...p2, characters: [attacker, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', attacker), target: g.leader('p1') });
  passBlock(g);
  return g;
}

/** Use the Event in hand as a [Counter] (ability id `counter` unless given). */
export function useCounter(g: TestGame, card: CardId, ability = 'counter'): InstanceId {
  const id = g.find('p1', 'hand', card);
  g.act({ type: 'activate', card: id, ability });
  return id;
}

/** Answer every pending "order the rest at the bottom" decision with its first legal order. */
export function finishOrder(g: TestGame): void {
  while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
}

export { endCounter };
