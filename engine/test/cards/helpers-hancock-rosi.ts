/**
 * Constants and helpers for the Hancock (OP14-041) and Rosinante (OP12-061) M4b wave 2 card tests.
 * Kept apart from helpers.ts so parallel wave-2 branches do not conflict.
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import {
  dec,
  endCounter,
  expectDecision,
  game,
  passBlock,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import type { TestGame } from '../fixtures/index.ts';

/** Boa Hancock Leader (Blue/Yellow, {Kuja Pirates} {The Seven Warlords of the Sea}). */
export const HANCOCK = 'OP14-041';
/** Donquixote Rosinante Leader (Purple/Yellow, {Donquixote Pirates} {Navy}). */
export const ROSI = 'OP12-061';
/** Kuja Pirates vanilla Character, Yellow, cost 6, 8000. */
export const KUJA = 'OP16-112';
/** Amazon Lily vanilla Character, Blue, cost 4, 6000. */
export const LILY = 'OP08-048';
/** {Thriller Bark Pirates} vanilla Character, Green, cost 4, 6000. */
export const TBP4 = 'ST12-005';
/** {Thriller Bark Pirates} vanilla Character, Yellow, cost 8, 10000. */
export const TBP8 = 'OP14-101';
/** {The Seven Warlords of the Sea} vanilla Character, Blue, cost 3, 5000. */
export const WARLORD = 'ST03-002';
/** Cost 2, 3000 Character whose [Trigger] is "Play this card." (not scripted: only `hasTrigger` matters). */
export const MONET = 'OP01-082';
/** Cost 8, 7000 Character with a [Trigger] (power above 6000). */
export const EMET = 'EB04-051';
/** {Navy} vanilla Characters: cost 1 / 3000 (Black) and cost 4 / 6000 (Purple). */
export const NAVY1 = 'OP02-097';
export const NAVY4 = 'EB02-034';
/** [Trafalgar Law] vanilla Character, Black, cost 5, 7000. */
export const LAW5 = 'OP04-087';
/** [Trafalgar Law] with cost 1 ([Blocker]), 1000 power. */
export const LAW1 = 'ST03-008';
/** Cost 4 [Trafalgar Law] with a [Blocker] only. */
export const LAW4 = 'ST10-010';

/** Finish every pending `order` decision in canonical order. */
export function orderAll(g: TestGame): void {
  while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
}

/** Attack, with no block and no counter, answering a damage-step trigger by declining it. */
export function battle(g: TestGame, attacker: InstanceId, target: InstanceId): void {
  g.act({ type: 'attack', attacker, target });
  if (dec(g)?.kind === 'block') passBlock(g);
  if (dec(g)?.kind === 'counter') endCounter(g);
}

/** Decline a damage-step [Trigger] if one is pending. */
export function skipTrigger(g: TestGame): void {
  if (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
}

/** The card ids of a zone, in order. */
export const ids = (g: TestGame, p: 'p1' | 'p2', zone: Parameters<TestGame['zone']>[1]): string[] =>
  g.zone(p, zone).map((c) => c.card);

export { expectDecision };

/**
 * Shared [Trigger] position: p2 attacks p1's Leader with a 9000 Character; p1's top Life card is
 * `top` and the pending decision is p1's [Trigger]. `p2` adds to the opponent's side.
 */
export function damageGame(
  top: string,
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> = {},
) {
  const g = game(
    { life: [top, PURPLE], ...p1 },
    { leader: PLAIN_BLUE, ...p2, characters: [V.c7, ...((p2.characters as string[]) ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  if (dec(g)?.kind === 'block') passBlock(g);
  if (dec(g)?.kind === 'counter') endCounter(g);
  expectDecision(g, 'trigger', 'p1');
  return g;
}
