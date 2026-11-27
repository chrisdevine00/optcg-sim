/**
 * Playing a drill position with the engine (M9 WP3): start it, apply actions, answer for the other
 * seat. Full-state calls are fine here (`ai/src/search/`); the drills' text and judges read only what
 * their own helpers return.
 */
import type { Card } from '@optcg/cards';
import {
  createFromScenario,
  legalActions,
  queries,
  reduce,
  type Action,
  type CardLookup,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import type { ScenarioJson } from './types.ts';

/** The state a scenario starts in. */
export function startOf(scenario: ScenarioJson, cards: ReadonlyMap<string, Card>): GameState {
  const lookup: CardLookup = (id) => cards.get(id);
  return createFromScenario({ ...scenario, cards: lookup }).state;
}

/** Apply `actions` in order (each must be legal; `reduce` throws otherwise). */
export function applyAll(state: GameState, actions: readonly Action[]): GameState {
  let s = state;
  for (const a of actions) s = reduce(s, a).state;
  return s;
}

/**
 * The plain answer to whatever is open for `seat`: no Block, no Counter, decline every "you may" and
 * Trigger, take the first target, finish. Null when `seat` has nothing to answer.
 */
export function plainReply(s: GameState, seat: PlayerId): Action | null {
  const dec = queries.decision(s);
  if (!dec || dec.player !== seat || queries.result(s)) return null;
  const legal = legalActions(s).filter((a) => a.player === seat);
  return (
    legal.find((a) => a.type === 'block' && a.blocker === null) ??
    legal.find((a) => a.type === 'endCounter') ??
    legal.find((a) => a.type === 'trigger' && !a.activate) ??
    legal.find((a) => a.type === 'optional' && !a.accept) ??
    legal.find((a) => a.type === 'pick') ??
    legal.find((a) => a.type === 'done') ??
    legal.find((a) => a.type === 'order') ??
    null
  );
}

/** The seat that owes a decision, or null. */
export const deciderOf = (s: GameState): PlayerId | null => queries.decision(s)?.player ?? null;
