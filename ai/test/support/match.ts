/**
 * AI-versus-AI matches for tests and the strength runner (PLAN §5 "ai"). Each seat gets only its
 * own view: a `SearchView` for Pirate, a plain view for Rookie. Every chosen action is checked
 * against the view's own list before the store (here, this loop) maps it back to the engine.
 */
import {
  actionFromView,
  createGame,
  project,
  projectForSearch,
  reduce,
  type Action,
  type DeckSpec,
  type GameResult,
  type GameState,
  type PlayerId,
  type ProjectedView,
} from '@optcg/engine';
import {
  AiSession,
  priorCardIds,
  type AiTier,
  type Budget,
  type Explanation,
} from '../../src/index.ts';
import { cardMap, lookup } from '../support.ts';

export interface MatchOptions {
  seed: number;
  decks: Record<PlayerId, DeckSpec>;
  tiers: Record<PlayerId, AiTier>;
  budgets?: 'iterations' | { turn: Budget; defence: Budget };
  k?: number;
  /** Called after every decision, with the deciding seat's view before it. */
  onDecision?: (d: DecisionRecord) => void;
  /** Action cap (ARCHITECTURE §2.6: 2,000 for AI test games). */
  cap?: number;
  debug?: import('../../src/session.ts').SessionOptions['debug'];
  /** Per-seat overrides (strength gates and A/B runs). */
  seats?: Partial<
    Record<
      PlayerId,
      Partial<
        Pick<
          import('../../src/session.ts').SessionOptions,
          'budgets' | 'k' | 'biases' | 'priorWithout' | 'weights' | 'searchless' | 'shallow'
        >
      >
    >
  >;
}

export interface DecisionRecord {
  index: number;
  player: PlayerId;
  tier: AiTier;
  view: ProjectedView;
  action: Action;
  explanation: Explanation;
  ms: number;
  rollouts: number;
  planned: boolean;
  /** The planner's value for the move (Pirate; 1000 = a win in every sample). */
  value: number | null;
  /** The state before the action (for tests that inspect what happened; never given to an AI). */
  before: GameState;
  after: GameState;
}

export interface MatchResult {
  result: GameResult | null;
  actions: number;
  turns: number;
  /** Per seat: wall-clock ms spent deciding, per own turn and per decision. */
  timing: Record<PlayerId, { turnMs: number[]; decisionMs: number[] }>;
  capped: boolean;
}

const strip = ({ intentId: _i, ...a }: Action) => JSON.stringify(a);

/** Public card data the AI may hold: its own list, the opponent's archetype prior. */
export function aiCards(own: DeckSpec, opponentLeader: string) {
  const all = cardMap();
  const ids = new Set([own.leader, ...own.main, opponentLeader, ...priorCardIds(opponentLeader)]);
  return new Map([...ids].map((id) => [id, all.get(id)!] as const));
}

export function playMatch(opts: MatchOptions): MatchResult {
  const all = cardMap();
  const sessions = {} as Record<PlayerId, AiSession>;
  for (const p of ['p1', 'p2'] as const) {
    const opp = p === 'p1' ? 'p2' : 'p1';
    sessions[p] = new AiSession({
      tier: opts.tiers[p],
      ownDeck: opts.decks[p].main,
      // Every card is public data; the session reads only what views show it, plus its prior.
      cards: all,
      leader: opts.decks[p].leader,
      opponentLeader: opts.decks[opp].leader,
      budgets: opts.budgets ?? 'iterations',
      ...(opts.k ? { k: opts.k } : {}),
      ...(opts.debug ? { debug: opts.debug } : {}),
      ...(opts.seats?.[p] ?? {}),
    });
  }
  let state = createGame({ seed: opts.seed, cards: lookup, decks: opts.decks }).state;
  const timing: MatchResult['timing'] = {
    p1: { turnMs: [], decisionMs: [] },
    p2: { turnMs: [], decisionMs: [] },
  };
  let turnKey = '';
  let n = 0;
  const cap = opts.cap ?? 2000;
  for (; n < cap; n++) {
    const pub = project(state, 'p1');
    if (pub.result || !pub.decision) break;
    const p = pub.decision.player;
    const tier = opts.tiers[p];
    const view = tier === 'rookie' ? project(state, p) : projectForSearch(state, p);
    const t0 = performance.now();
    const d = sessions[p].decide(view, (opts.seed * 7919 + n * 104729) >>> 0);
    const ms = performance.now() - t0;
    if (!view.actions.some((a) => strip(a) === strip(d.action)))
      throw new Error(
        `seed ${opts.seed}: ${tier} chose an action not in its view: ${strip(d.action)}`,
      );
    timing[p].decisionMs.push(ms);
    const key = `${pub.turn.number}`;
    if (pub.turn.activePlayer === p) {
      if (key !== turnKey) {
        timing[p].turnMs.push(0);
        turnKey = key;
      }
      timing[p].turnMs[timing[p].turnMs.length - 1]! += ms;
    }
    const before = state;
    state = reduce(state, actionFromView(state, p, d.action)).state;
    opts.onDecision?.({
      index: n,
      player: p,
      tier,
      view: view as ProjectedView,
      action: d.action,
      explanation: d.explanation,
      ms,
      rollouts: d.stats.rollouts,
      planned: d.stats.planned,
      value: d.stats.value ?? null,
      before,
      after: state,
    });
  }
  const end = project(state, 'p1');
  return { result: end.result, actions: n, turns: end.turn.number, timing, capped: n >= cap };
}
