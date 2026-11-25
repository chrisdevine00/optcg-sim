/**
 * Helpers and constants for the wave 7 group 1 card tests (EB02-009, EB02-053, EB02-057, EB03-006,
 * EB04-023, OP09-101, OP10-022, OP10-116, OP11-101, OP11-116). Every card named below is a vanilla
 * (or has only a keyword), so it is inert as scenery.
 */
import type { InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import {
  dec,
  endCounter,
  expectDecision,
  game,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  passBlock,
  V,
} from './helpers.ts';

export { activate, canPick, offeredAb, pickable } from './helpers-w3s.ts';
export { atMain } from './helpers-w5c2.ts';

/** A {Alabasta} Leader (5000 power; its [Activate: Main] is unused). */
export const ALABASTA_LEADER = 'OP04-001';
/** {Supernovas} Characters with no text: cost 3 (5000), cost 4 (6000, also {Straw Hat Crew}), cost 5 (7000), cost 6 (7000). */
export const SN3 = 'OP14-008';
export const SN4 = 'OP02-043';
export const SN5 = 'OP10-101';
export const SN6 = 'OP11-055';
/** A {Straw Hat Crew} {Supernovas} Character with only [Rush] (cost 3). */
export const SHC3 = 'OP01-025';
/** An Event (cost 1) that is not a Character. */
export const EVENT_1 = 'ST02-017';

/** Is there an `optional` decision to accept? (raw: no helper answers it) */
export const canAccept = (g: TestGame): boolean =>
  g.legal().some((a) => a.type === 'optional' && a.accept);

/** The cards of `who`'s zone, as card ids. */
export const ids = (g: TestGame, who: PlayerId, zone: 'life' | 'hand' | 'characters' | 'trash') =>
  g.zone(who, zone).map((c) => c.card);

/** The DON!! given to a card. */
export const given = (g: TestGame, id: InstanceId): number => g.card(id).don;

/** The cards that can be picked now, as card ids. */
export const pickableCardIds = (g: TestGame): string[] =>
  g
    .legal()
    .flatMap((a) =>
      a.type === 'pick' && typeof a.choice === 'string'
        ? [g.card(a.choice as InstanceId).card]
        : [],
    );

/** The ids of the options of the pending decision, in order. */
export const optionIds = (g: TestGame): string[] => (dec(g)?.options ?? []).map((o) => o.id);

/**
 * A [Trigger] position: p2 attacks p1's Leader with a cost 7 Character and p1's top Life card is
 * `top`; the decision is p1's [Trigger] choice. `p2` adds the other player's cards.
 */
export function triggerGame(
  top: string,
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
): TestGame {
  const g = game(
    { leader: PLAIN_PURPLE, life: [top, V.c1], ...p1 },
    { leader: PLAIN_BLUE, ...p2, characters: [V.c7, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: false });
  passBlock(g);
  endCounter(g);
  expectDecision(g, 'trigger', 'p1');
  return g;
}
