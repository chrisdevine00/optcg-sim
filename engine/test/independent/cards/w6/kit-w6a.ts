/**
 * Helpers for the wave-6 group-A independent card tests (EB02-022, EB02-039, EB03-001, EB03-003,
 * EB03-007, EB03-009, EB03-039, OP09-008, OP09-018, OP09-022, OP10-026). Public API, frozen fixtures
 * and the earlier kits only. Every answer helper accepts ONE named kind of prompt and fails on
 * anything else; where a test asks whether a prompt appears it uses raw `g.act` / `decision`.
 */
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { decision } from '../../helpers.ts';
import { choices, canFinish, cardOf } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../w5/kit-w5a.ts';

/** Scenery Characters with the printed stats noted. None has an effect that fires unless said. */
export const SC6 = {
  /** OP01-010 Komachiyo: Red, cost 1, 3000, no text. */
  c3k: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, no text. */
  c4k: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, no text. */
  c5k: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, no text. */
  c6k: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, no text. */
  c7k: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, no text. */
  c8k: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, no text. */
  c9k: 'OP02-020',
  /** OP01-080 Miss Doublefinger(Zala): Blue, cost 3, 4000, Counter +1000, only "[On K.O.] Draw a card." (a base effect, inert in hand and on play). */
  zala: 'OP01-080',
  /** OP02-012 Blenheim: Red, cost 2, 3000, only "[Blocker]" with its reminder text (no base effect, M6b-Q29). */
  blenheim: 'OP02-012',
  /** OP01-052 Raizo: Green, cost 3, 4000, only "[When Attacking] [Once Per Turn] If you have 2 or more rested Characters, draw 1 card." */
  raizo: 'OP01-052',
} as const;

/** True when the pending decision is a `choose` owed by `who`. */
export function isChoose(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return d?.kind === 'choose' && d.player === who;
}

/** Card ids offered by the pending `choose`, sorted. */
export function offeredCards(g: TestGame): (CardId | null)[] {
  need(g, 'choose');
  return choices(g)
    .map((i) => cardOf(g, i))
    .sort();
}

/** True when the pending `choose` may end with nothing picked. */
export function mayEnd(g: TestGame): boolean {
  return canFinish(g);
}

/** The sorted card ids of a zone. */
export function ofZone(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
): CardId[] {
  return g
    .zone(who, zone)
    .map((c) => c.card)
    .sort();
}

/** The rested flags of `who`'s Characters of `card`. */
export function restedOf(g: TestGame, who: PlayerId, card: CardId): boolean[] {
  return g
    .zone(who, 'characters')
    .filter((c) => c.card === card)
    .map((c) => c.rested);
}

/** Instance of the nth `card` in a zone of `who`. */
export function inst(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): InstanceId {
  return g.find(who, zone, card, nth);
}
