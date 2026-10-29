/**
 * The typed worker protocol (ARCHITECTURE §4.1). M3 implements `init`, `decide` and `cancel`;
 * `planTurn`, `lethal` and `analyze` arrive with the stronger tiers (M5) and Game Review (M6).
 */
import type { Card } from '@optcg/cards';
import type { Action, PlayerView } from '@optcg/engine';
import type { Explanation } from './explanation.ts';
import type { AiTier } from './tiers.ts';

export type AiRequest =
  /** Public card data for the cards in this game (a card's printed text is public). */
  | { type: 'init'; cards: Card[] }
  | { type: 'decide'; id: number; view: PlayerView; tier: AiTier; seed: number; budgetMs: number }
  | { type: 'cancel'; id: number };

export type AiResponse =
  | {
      type: 'decision';
      id: number;
      action: Action;
      explanation: Explanation;
      alternatives: Action[];
      ms: number;
    }
  | { type: 'error'; id: number; message: string };
