/**
 * A main-phase position for warming the AI's worker (M10 WP3, `aiWarm.warm`). One iteration of
 * search on a real position is what compiles the search and the engine's hot paths before the game
 * starts; the worker itself is warmed by `ai-client.ts`.
 *
 * The position is the AI's own deck against a copy of itself, played at random until the second
 * seat owes a Main Phase decision, and handed over as that seat's `SearchView`. Nothing of the
 * player's deck is in it, so the warm worker holds what the game's worker would hold at "Start":
 * the AI's list, the public prior for the player's Leader and the cards that list can show.
 * (The player's own list is never posted to the AI's worker, ADR 0005.)
 */
import type { Card } from '@optcg/cards';
import { rookie } from '@optcg/ai';
import type { DeckSpec, SearchView } from '@optcg/engine';
import { GameSession, newIntentId } from '../../session/index.ts';

/** Random moves tried before giving up (a Main Phase for the second seat comes within about 40). */
const MAX_MOVES = 400;

/**
 * The second seat's first Main Phase in a mirror game of `deck`, or null when the game does not
 * reach one (the worker is still warmed, only the search is not).
 */
export function warmPosition(
  cards: ReadonlyMap<string, Card>,
  deck: DeckSpec,
  seed = 1,
): SearchView | null {
  try {
    const s = new GameSession(
      (id) => cards.get(id),
      {
        setup: { seed, decks: { p1: deck, p2: deck }, chooser: 'p2' },
      },
      { p1: 'ai', p2: 'ai' },
    );
    for (let i = 0; i < MAX_MOVES; i++) {
      const d = s.decider();
      if (!d) return null;
      const v = s.view(d);
      if (d === 'p2' && v.decision?.kind === 'main') return s.searchView('p2');
      const { action } = rookie(v, { seed: seed + i, counterOf: () => null });
      if (!s.apply(d, action, newIntentId()).ok) return null;
    }
  } catch {
    // A deck the engine refuses is Setup's problem to report; the warm-up just does less.
  }
  return null;
}
