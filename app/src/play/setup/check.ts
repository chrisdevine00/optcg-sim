/**
 * What Setup says about one chosen deck (flows F3a step 2, review M6-4 and N-4): the engine's own
 * problems once the cards are loaded, or, when a set could not be fetched, "Card unavailable" for
 * the cards that set holds. A network failure is never reported as an unknown card.
 */
import type { Card } from '@optcg/cards';
import { deckErrors, type DeckFormat, type DeckSpec } from '@optcg/engine';

export interface DeckCheck {
  /** The cards could not be loaded: Start stays off and Setup offers a retry. */
  unavailable: string[];
  /** The deck's own problems, in the engine's words. */
  problems: string[];
}

export function checkSetupDeck(
  spec: DeckSpec,
  cards: ReadonlyMap<string, Card>,
  unavailable: ReadonlySet<string>,
  format: DeckFormat,
): DeckCheck {
  const ids = [...new Set([spec.leader, ...spec.main])];
  const missing = ids.filter((id) => unavailable.has(id) && !cards.has(id));
  if (missing.length > 0) return { unavailable: missing, problems: [] };
  return {
    unavailable: [],
    problems: deckErrors(spec, (c) => cards.get(c), format).map((e) => e.message),
  };
}

/** "Card unavailable (OP01-001)" for the first few, then a count. */
export function unavailableText(ids: readonly string[]): string[] {
  const shown = ids.slice(0, 3).map((id) => `Card unavailable (${id})`);
  return ids.length > 3 ? [...shown, `and ${ids.length - 3} more cards unavailable`] : shown;
}
