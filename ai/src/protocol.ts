/**
 * The typed worker protocol (ARCHITECTURE §4.1). M5a implements `init`, `cards`, `planTurn`,
 * `decide`, `cancel` and `reset`; unchosen alternatives are not posted (no UI uses them, and they
 * would carry the AI's intentions into the page: review M5a-15); `lethal` and `analyze` arrive with the learning slice and Game Review.
 *
 * The worker only ever receives the AI's own view: a `SearchView` (the view plus a skeleton with
 * every hidden card stripped, ADR 0005) for the searching tiers, a plain view for Rookie. Card data
 * is public: the AI's own deck, its opponent's archetype prior and cards it has seen.
 */
import type { Card } from '@optcg/cards';
import type { Action, PlayerView, SearchView } from '@optcg/engine';
import type { Explanation } from './explanation.ts';
import type { Budget } from './search/pirate.ts';
import type { AiTier } from './tiers.ts';

export interface GameInfo {
  tier: AiTier;
  /** The AI's own main deck. */
  ownDeck: string[];
  leader: string;
  opponentLeader: string;
  /** `iterations` makes a seeded game repeat exactly; the app uses `ms`. */
  budgets?: 'iterations' | 'ms';
}

export type AiRequest =
  /** Public card data for the cards in this game, and (M5a) the game's seats. */
  | { type: 'init'; cards: Card[]; game?: GameInfo }
  /** More public card data: cards that have become visible. */
  | { type: 'cards'; cards: Card[] }
  | { type: 'planTurn'; id: number; view: SearchView; seed: number; budget?: Budget }
  | {
      type: 'decide';
      id: number;
      view: PlayerView | SearchView;
      tier: AiTier;
      seed: number;
      budgetMs: number;
    }
  | { type: 'cancel'; id: number }
  /** Forget the turn plan and battle memory (the player rewound). */
  | { type: 'reset' };

export type AiResponse =
  | {
      type: 'decision';
      id: number;
      action: Action;
      explanation: Explanation;
      ms: number;
      /** Rollouts spent, and whether the move came from the turn plan. */
      stats?: { rollouts: number; actions: number; planned: boolean };
    }
  | { type: 'planned'; id: number; steps: number; rollouts: number; ms: number }
  | { type: 'error'; id: number; message: string };
