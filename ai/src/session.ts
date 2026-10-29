/**
 * One AI player for one game (ARCHITECTURE §4.1). The worker holds one session per game; tests and
 * the strength runner use it directly. It receives views only: a `SearchView` (the AI's view plus
 * the search skeleton) for Pirate, a plain view for Rookie.
 */
import type { Card } from '@optcg/cards';
import { CannotDeterminize, type Action, type PlayerView, type SearchView } from '@optcg/engine';
import { averageCounter, counterValueOf, priorFor, type Prior } from './knowledge.ts';
import { playbookFor, type Playbook } from './playbook.ts';
import { rookie, type Decided } from './rookie.ts';
import type { Explanation } from './explanation.ts';
import {
  decide,
  explainViewAction,
  planTurn,
  type Budget,
  type PirateMemory,
  type PirateSetup,
} from './search/pirate.ts';
import type { AiTier } from './tiers.ts';
import type { Weights } from './search/heuristic.ts';

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
  /** Tests only: false plays without the playbook's move biases (search alone; review M5a-08). */
  biases?: boolean;
  /** Tests only: an archetype prior leaving out one sourced list (by date). */
  priorWithout?: string;
  /** Tests and A/B runs only: replace some heuristic weights. */
  weights?: Partial<Weights>;
  /** Tests only: decide by the quick policy, with no search (a strength baseline). */
  searchless?: boolean;
  /** Tests only: score moves without rollouts (a strength baseline). */
  shallow?: boolean;
}

export interface SessionDecision extends Decided {
  stats: { rollouts: number; actions: number; planned: boolean; value?: number };
}

function withoutBiases(pb: Playbook | null, off: boolean): Playbook | null {
  return pb && off ? { ...pb, biases: [] } : pb;
}

function priorWithout(p: Prior | null, date: string | undefined): Prior | null {
  if (!p || !date) return p;
  const lists = p.lists.filter((l) => l.date !== date);
  return lists.length ? { ...p, lists } : p;
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
      playbook: withoutBiases(playbookFor(opts.leader), opts.biases === false),
      prior: priorWithout(priorFor(opts.opponentLeader), opts.priorWithout),
      oppAvgCounter: averageCounter(opts.opponentLeader, opts.cards),
      ...(opts.weights ? { weights: opts.weights } : {}),
      ...(opts.searchless ? { searchless: true } : {}),
      ...(opts.shallow ? { shallow: true } : {}),
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
      // A public reference to a hidden card (never observed): answer from the view alone,
      // defending lethal, with a Pirate's own wording (review M5a-15).
      if (!(e instanceof CannotDeterminize)) throw e;
      const d = rookie(view, { seed, counterOf });
      return {
        ...d,
        explanation: {
          ...d.explanation,
          conceptId: 'tempo',
          claim: 'It could not search this position.',
          evidence: [
            {
              text: 'It defended a lethal attack if it could, and otherwise chose a legal move at random.',
              figures: {},
            },
          ],
          lessonId: 'L17-tempo-and-rush',
        },
        stats: { rollouts: 0, actions: 0, planned: false },
      };
    }
  }

  /** The public "Why?" for a given action (the same builder `decide` uses; tests). */
  explain(view: SearchView, action: Action, seed = 1): Explanation {
    return explainViewAction(view, action, this.setup, seed);
  }

  /** Forget the turn plan and the battle memory (a rewind: review M5a-11). */
  reset(): void {
    this.memory.plan = null;
    this.memory.defence = null;
  }
}
