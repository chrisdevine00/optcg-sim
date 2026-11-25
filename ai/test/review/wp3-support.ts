/** Planted games for the WP3 detectors: a scripted record, and the `DetectorContext` over it. */
import {
  appendAction,
  createFromScenario,
  legalActions,
  queries,
  reduce,
  replay,
  startRecord,
  type Action,
  type GameState,
  type PlayerId,
  type ScenarioSpec,
} from '@optcg/engine';
import type { DetectorContext, ReviewItem, ReviewRecord } from '../../src/index.ts';
import { cardMap, lookup } from '../support.ts';

export type Spec = Omit<ScenarioSpec, 'cards'>;

/** Pick an action by a predicate over the state (the first match). */
export type Pick = (s: GameState, legal: Action[]) => Action | undefined;

/**
 * Play a scripted game: each decision asks `script(state, legal)` for the action; `undefined` ends
 * the record there. Returns the review record (both seats listed, p1 human).
 */
export function recordOf(
  spec: Spec,
  script: (s: GameState, legal: Action[]) => Action | undefined,
  seats: Record<PlayerId, 'human' | 'ai'> = { p1: 'human', p2: 'ai' },
): ReviewRecord {
  const init = createFromScenario({ ...spec, cards: lookup });
  let rec = startRecord({ scenario: spec }, init.state);
  let s = init.state;
  for (let i = 0; i < 400 && !queries.result(s); i++) {
    if (!queries.decision(s)) break;
    const a = script(s, legalActions(s));
    if (!a) break;
    s = reduce(s, a).state;
    rec = appendAction(rec, a, s);
  }
  return { ...rec, seats, auto: [], rewinds: [] };
}

export function ctxOf(record: ReviewRecord, nodes = 200_000): DetectorContext {
  const states = new Map<number, GameState>();
  const stateAt = (i: number): GameState => {
    let s = states.get(i);
    if (!s) states.set(i, (s = replay(record, lookup, i).state));
    return s;
  };
  return {
    record,
    cards: cardMap(),
    lookup,
    cap: { nodes },
    result: queries.result(stateAt(record.actions.length)),
    stateAt,
  };
}

export const item = (kind: ReviewItem['kind'], turn: number, index: number): ReviewItem => ({
  id: `${kind}:${turn}:${index}`,
  kind,
  turn,
  index,
  cost: 'search',
});

/** The first action of `type` for `card` (a card id) that is legal, by the actor's own cards. */
export function find(
  s: GameState,
  legal: Action[],
  pred: (a: Action) => boolean,
): Action | undefined {
  return legal.find(pred);
}

/** An attack by the first of `player`'s cards with id `card`, on their opponent's Leader. */
export function attackOn(
  s: GameState,
  legal: Action[],
  player: PlayerId,
  card: string,
  targetCard?: string,
): Action | undefined {
  const foe = player === 'p1' ? 'p2' : 'p1';
  return legal.find((a) => {
    if (a.type !== 'attack' || a.player !== player) return false;
    const atk = queries.card(s, a.attacker);
    const tgt = queries.card(s, a.target);
    return (
      atk.card === card &&
      tgt.owner === foe &&
      (targetCard ? tgt.card === targetCard : tgt.zone === 'leader')
    );
  });
}

/** The defender's plain answer: no Block, no Counter, decline everything. */
export function takeIt(legal: Action[]): Action | undefined {
  return (
    legal.find((a) => a.type === 'block' && a.blocker === null) ??
    legal.find((a) => a.type === 'endCounter') ??
    legal.find((a) => a.type === 'trigger' && !a.activate) ??
    legal.find((a) => a.type === 'optional' && !a.accept) ??
    legal.find((a) => a.type === 'pick') ??
    legal.find((a) => a.type === 'done') ??
    legal[0]
  );
}
