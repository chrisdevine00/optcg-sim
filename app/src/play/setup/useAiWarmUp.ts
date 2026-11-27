/**
 * Warm the AI's worker while Setup is open (M10 WP3; Setup calls this once). The worker is spawned,
 * given the AI's deck and the public prior for the player's Leader, its session is built and one
 * iteration of search compiles the hot paths, all before "Start", so the first AI turn does not pay
 * for them (the Warlord's wait was 1.8 to 4.1 s against a 1,500 ms budget). The game's own client
 * takes this worker when the decks and tier are the ones warmed (`AiClient`'s `adoptWarm`), and it
 * is terminated after 20 s if Setup closes without a game (`aiWarm.release`).
 *
 * Rookie warms nothing (its budget is 10 ms), nor does a hotseat game or a scenario or autostart
 * link (those build their own game at once). The player's deck never reaches the worker: only the
 * AI's list, the public prior for the player's Leader, and a position from the AI's deck against
 * itself (`warmPosition`).
 */
import { useEffect } from 'react';
import type { Card } from '@optcg/cards';
import { priorCardIds } from '@optcg/ai';
import type { GameInfo } from '@optcg/ai';
import { aiWarm, type WarmSpec } from '../game/ai-client.ts';
import { aiInitCards } from '../game/controller.ts';
import { warmPosition } from '../game/warm-position.ts';
import { deckById, loadCards } from './decks.ts';
import type { Opponent } from './Setup.tsx';

export interface WarmInputs {
  opponent: Opponent;
  myDeck: string;
  theirDeck: string;
  /** Card data of the two chosen decks, once loaded. */
  cards: ReadonlyMap<string, Card>;
  /** The decks are valid and their cards are loaded. */
  ready: boolean;
  /** A scenario or autostart link: the game is built at once and brings its own worker. */
  off: boolean;
  budgets?: 'iterations' | 'ms';
}

/** Debounce: a click through several decks warms the one that is left. */
export const WARM_DELAY_MS = 300;

/** What to warm for these inputs, or null when no worker should be warm (pure; tested). */
export async function warmSpecFor(
  o: WarmInputs,
  load: (ids: string[]) => Promise<ReadonlyMap<string, Card>> = loadCards,
  decks: (
    id: string,
  ) => Pick<NonNullable<ReturnType<typeof deckById>>, 'spec'> | undefined = deckById,
): Promise<WarmSpec | null> {
  if (o.off || !o.ready || o.opponent === 'hotseat' || o.opponent === 'rookie') return null;
  const mine = decks(o.myDeck);
  const theirs = decks(o.theirDeck);
  if (!mine || !theirs) return null;
  // The same card data the game will give its worker: the AI's list and the public prior for the
  // player's Leader (ARCHITECTURE §4.3).
  const prior = await load([
    ...priorCardIds(mine.spec.leader),
    ...priorCardIds(theirs.spec.leader),
  ]);
  const cards = new Map<string, Card>([...o.cards, ...prior]);
  const aiCardIds = [theirs.spec.leader, ...theirs.spec.main];
  const game: GameInfo = {
    tier: o.opponent,
    ownDeck: theirs.spec.main,
    leader: theirs.spec.leader,
    opponentLeader: mine.spec.leader,
    budgets: o.budgets ?? 'ms',
  };
  return {
    cards: aiInitCards(cards, aiCardIds, mine.spec.leader),
    game,
    position: () => warmPosition(cards, theirs.spec),
  };
}

export function useAiWarmUp(o: WarmInputs): void {
  const { opponent, myDeck, theirDeck, cards, ready, off, budgets } = o;
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      warmSpecFor({
        opponent,
        myDeck,
        theirDeck,
        cards,
        ready,
        off,
        ...(budgets ? { budgets } : {}),
      })
        .then((spec) => {
          if (!live) return;
          if (spec) aiWarm.warm(spec);
          else aiWarm.cancel();
        })
        .catch(() => {
          // Warming is an optimisation: a failure here leaves the game to start its own worker.
        });
    }, WARM_DELAY_MS);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [opponent, myDeck, theirDeck, cards, ready, off, budgets]);
  // Setup closing: the game that is starting takes the worker; with none, it ends after 20 s.
  useEffect(() => () => aiWarm.release(), []);
}
