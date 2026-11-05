/**
 * The typed worker protocol (ARCHITECTURE §4.1). M5a implements `init`, `cards`, `planTurn`,
 * `decide`, `cancel` and `reset` (and, from the learning slice, `lethal`); unchosen alternatives are not posted (no UI uses them, and they
 * would carry the AI's intentions into the page: review M5a-15); `analyze` arrives with Game Review.
 *
 * The worker only ever receives the AI's own view: a `SearchView` (the view plus a skeleton with
 * every hidden card stripped, ADR 0005) for the searching tiers, a plain view for Rookie. Card data
 * is public: the AI's own deck, its opponent's archetype prior and cards it has seen.
 */
import type { Card } from '@optcg/cards';
import type { Action, PlayerId, PlayerView, SearchView } from '@optcg/engine';
import type { LethalResult, LethalState } from './search/lethal/lethal.ts';
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
  /**
   * Added in the learning slice (L). Can this seat win this turn? `public` takes the requesting
   * seat's `SearchView` (the only thing it reads); `actual` takes a full state, for review and
   * open-hands games, and so is never posted in a live game. `capMs` is the wall-clock cap; `nodes`
   * a deterministic cap (tests, CI). `priority`: 2 a press of the Lethal button, 3 review,
   * 4 the background detector (the lowest, learning-ui §3.1); `decide` and `planTurn` are 1.
   * A queued request is dropped by `cancel`; a running one cannot be interrupted, so its
   * wall-clock cap is what bounds a turn's delay (default 1500 ms).
   */
  | ({
      type: 'lethal';
      id: number;
      capMs?: number;
      nodes?: number;
      priority?: 2 | 3 | 4;
    } & (
      | { mode: 'public'; view: SearchView }
      | { mode: 'actual'; state: LethalState; attacker?: PlayerId }
    ))
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
  | { type: 'lethal'; id: number; result: LethalResult; ms: number }
  | { type: 'error'; id: number; message: string };
