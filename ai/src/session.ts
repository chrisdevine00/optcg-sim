/**
 * One AI player for one game (ARCHITECTURE §4.1). The worker holds one session per game; tests and
 * the strength runner use it directly. It receives views only: a `SearchView` (the AI's view plus
 * the search skeleton) for Pirate, a plain view for Rookie.
 */
import type { Card } from '@optcg/cards';
import { CannotDeterminize, type PlayerView, type SearchView } from '@optcg/engine';
import { averageCounter, counterValueOf, priorFor } from './knowledge.ts';
import { playbookFor } from './playbook.ts';
import { rookie, type Decided } from './rookie.ts';
import {
  decide,
  planTurn,
  type Budget,
  type PirateMemory,
  type PirateSetup,
} from './search/pirate.ts';
import type { AiTier } from './tiers.ts';

export type { Budget } from './search/pirate.ts';

/** Per-tier budgets (ARCHITECTURE §4.1): iterations for tests and CI, milliseconds in the app. */
export const BUDGETS = {
  pirate: {
    iterations: { turn: { iterations: 900 }, defence: { iterations: 120 } },
    ms: { turn: { ms: 500 }, defence: { ms: 250 } },
  },
} as const satisfies Record<string, Record<'iterations' | 'ms', { turn: Budget; defence: Budget }>>;

export interface SessionOptions {
  tier: AiTier;
  /** The AI's own main deck (its own list is not hidden from it). */
  ownDeck: readonly string[];
  /** Public card data: the AI's deck, the opponent's archetype prior, and every card seen. */
  cards: ReadonlyMap<string, Card>;
  /** The AI's Leader and the opponent's (both public). */
  leader: string;
  opponentLeader: string;
  budgets?: 'iterations' | 'ms' | { turn: Budget; defence: Budget };
  /** Determinized states per decision (default 4). */
  k?: number;
  now?: () => number;
  /** Tests only: see each ranking (PirateSetup.debug). */
  debug?: PirateSetup['debug'];
}

export interface SessionDecision extends Decided {
  stats: { rollouts: number; actions: number; planned: boolean; value?: number };
}

export class AiSession {
  readonly tier: AiTier;
  private readonly setup: PirateSetup;
  private readonly budgets: { turn: Budget; defence: Budget };
  private readonly memory: PirateMemory = { plan: null, defence: null };
  private readonly cards: ReadonlyMap<string, Card>;

  constructor(opts: SessionOptions) {
    this.tier = opts.tier;
    this.cards = opts.cards;
    const b = opts.budgets ?? 'iterations';
    this.budgets = typeof b === 'string' ? BUDGETS.pirate[b] : b;
    this.setup = {
      ownDeck: opts.ownDeck,
      cards: opts.cards,
      playbook: playbookFor(opts.leader),
      prior: priorFor(opts.opponentLeader),
      oppAvgCounter: averageCounter(opts.opponentLeader, opts.cards),
      k: opts.k ?? 4,
      now: opts.now ?? (() => performance.now()),
      ...(opts.debug ? { debug: opts.debug } : {}),
    };
  }

  /** Plan the turn ahead of its first decision (the worker does this while animations play). */
  planTurn(view: SearchView, seed: number, budget?: Budget): { steps: number; rollouts: number } {
    if (
      this.tier === 'rookie' ||
      view.decision?.kind !== 'main' ||
      view.decision.player !== view.player
    )
      return { steps: 0, rollouts: 0 };
    try {
      const { plan, stats } = planTurn(view, this.setup, budget ?? this.budgets.turn, seed);
      this.memory.plan = plan;
      return { steps: plan.steps.length, rollouts: stats.rollouts };
    } catch (e) {
      if (e instanceof CannotDeterminize) return { steps: 0, rollouts: 0 };
      throw e;
    }
  }

  decide(view: SearchView | PlayerView, seed: number): SessionDecision {
    const counterOf = (id: string) => counterValueOf(this.cards.get(id)) || null;
    if (this.tier === 'rookie' || !('skeleton' in view)) {
      return {
        ...rookie(view, { seed, counterOf }),
        stats: { rollouts: 0, actions: 0, planned: false },
      };
    }
    try {
      return decide(view, this.memory, this.setup, this.budgets, seed);
    } catch (e) {
      // A public reference to a hidden card (rare): answer from the view alone, defending lethal.
      if (!(e instanceof CannotDeterminize)) throw e;
      const d = rookie(view, { seed, counterOf });
      return { ...d, stats: { rollouts: 0, actions: 0, planned: false } };
    }
  }
}
