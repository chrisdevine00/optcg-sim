/**
 * Planted positions for AI tests: build a scenario, let the AI play from its own view, answer the
 * other seat with a fixed, plain responder (no blocks, no counters, decline "you may"), and record
 * what happened. Tests read the game through the engine; the AI only ever sees its view.
 */
import {
  actionFromView,
  createFromScenario,
  project,
  projectForSearch,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
  type ProjectedView,
  type ScenarioSpec,
} from '@optcg/engine';
import { AiSession, type Explanation } from '../../src/index.ts';
import { cardMap, lookup, metaDecks } from '../support.ts';

export const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

/** The first sourced list of an archetype, as the AI's own deck. */
export function listOf(leader: string): string[] {
  return metaDecks().find((d) => d.leader === leader)!.main;
}

export type Spec = Omit<ScenarioSpec, 'cards'>;

export function start(spec: Spec): GameState {
  return createFromScenario({ ...spec, cards: lookup }).state;
}

export function session(
  seat: PlayerId,
  state: GameState,
  tier: 'pirate' | 'rookie' = 'pirate',
): AiSession {
  const leader = queries.zone(state, seat, 'leader')[0]!.card;
  const opp = queries.zone(state, other(seat), 'leader')[0]!.card;
  return new AiSession({
    tier,
    ownDeck: metaDecks().find((d) => d.leader === leader)?.main ?? listOf('OP17-039'),
    cards: cardMap(),
    leader,
    opponentLeader: opp,
    budgets: 'iterations',
  });
}

export interface Step {
  player: PlayerId;
  view: ProjectedView;
  action: Action;
  explanation: Explanation | null;
  before: GameState;
  after: GameState;
}

/** The plain responder: never blocks or counters, declines optional effects, first choice. */
export function plainAnswer(view: ProjectedView): Action {
  const acts = view.actions.filter((a) => a.type !== 'concede');
  return (
    acts.find((a) => a.type === 'block' && a.blocker === null) ??
    acts.find((a) => a.type === 'endCounter') ??
    acts.find((a) => a.type === 'optional' && !a.accept) ??
    acts.find((a) => a.type === 'trigger' && !a.activate) ??
    acts.find((a) => a.type === 'done') ??
    acts[0]!
  );
}

/** Apply a view action for `player`. */
export function act(state: GameState, player: PlayerId, a: Action): GameState {
  return reduce(state, actionFromView(state, player, a)).state;
}

/**
 * Play on until `stop` says so (default: the turn after the current one starts), the AI deciding
 * for `ai`, the plain responder for the other seat. Returns every step.
 */
export function play(
  state0: GameState,
  ai: PlayerId,
  opts: { seed?: number; stop?: (s: GameState) => boolean; ai?: AiSession; max?: number } = {},
): { steps: Step[]; state: GameState } {
  const s0turn = queries.turn(state0).number;
  const stop = opts.stop ?? ((s) => queries.turn(s).number > s0turn);
  const me = opts.ai ?? session(ai, state0);
  let state = state0;
  const steps: Step[] = [];
  for (let i = 0; i < (opts.max ?? 300); i++) {
    if (queries.result(state) || stop(state)) break;
    const dec = queries.decision(state);
    if (!dec) break;
    const p = dec.player;
    let action: Action;
    let explanation: Explanation | null = null;
    let view: ProjectedView;
    if (p === ai) {
      view = projectForSearch(state, p);
      const d = me.decide(view, (opts.seed ?? 1) * 7919 + i);
      action = d.action;
      explanation = d.explanation;
    } else {
      view = project(state, p) as ProjectedView;
      action = plainAnswer(view);
    }
    const before = state;
    state = act(state, p, action);
    steps.push({ player: p, view, action, explanation, before, after: state });
  }
  return { steps, state };
}

/** The card id behind a view handle, in the view it came from. */
export function cardOf(view: ProjectedView, handle: string): string | null {
  for (const p of ['p1', 'p2'] as const)
    for (const z of Object.values(view.zones[p])) {
      const c = z.find((x) => x.handle === handle);
      if (c) return c.card;
    }
  return null;
}

/** Life cards for a scenario: `n` copies of a vanilla-ish card from the list. */
export const lifeOf = (n: number, card: string): string[] => Array.from({ length: n }, () => card);
