/**
 * Planted game records for the review detectors (M8): a scenario, a plan for the human seat's Main
 * decisions, a plain answer for everything else, and a `DetectorContext` over the result with a
 * replay cache (the runner, WP1, fills `stateAt` the same way).
 */
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
import type { DetectorContext, ReviewItem, ReviewRecord } from '../../src/search/review/index.ts';
import { cardMap, lookup } from '../support.ts';

export type Spec = Omit<ScenarioSpec, 'cards'>;

/** The plain answer: no block, no counter, decline every optional effect and [Trigger], else first. */
export function plainAnswer(s: GameState): Action {
  const acts = legalActions(s).filter((a) => a.type !== 'concede');
  return (
    acts.find((a) => a.type === 'block' && a.blocker === null) ??
    acts.find((a) => a.type === 'endCounter') ??
    acts.find((a) => a.type === 'optional' && !a.accept) ??
    acts.find((a) => a.type === 'trigger' && !a.activate) ??
    acts.find((a) => a.type === 'done') ??
    acts[0]!
  );
}

/**
 * Play a game from `spec`: `plan(s)` is the human's Main-phase action list (taken in order whenever
 * `p1` owes a Main decision); every other decision, either seat's, is `answer(s)`.
 */
export function plantRecord(
  spec: Spec,
  plan: (s: GameState) => Action[],
  answer: (s: GameState) => Action = plainAnswer,
  human: PlayerId = 'p1',
): ReviewRecord {
  const init = createFromScenario({ ...spec, cards: lookup });
  let rec = startRecord({ scenario: spec }, init.state);
  let s = init.state;
  const queue = plan(s);
  for (let i = 0; i < 400 && !queries.result(s); i++) {
    const dec = queries.decision(s);
    if (!dec) break;
    let a: Action;
    if (dec.player === human && dec.kind === 'main') {
      const next = queue.shift();
      if (!next) break;
      a = next;
    } else a = answer(s);
    s = reduce(s, a).state;
    rec = appendAction(rec, a, s);
  }
  return {
    ...rec,
    seats: { p1: 'human', p2: 'ai', [human]: 'human' } as ReviewRecord['seats'],
    auto: [],
    rewinds: [],
  };
}

/** A detector context over `record` with a replay cache. */
export function contextOf(
  record: ReviewRecord,
  cap: DetectorContext['cap'] = { nodes: 150_000 },
): DetectorContext {
  const cache = new Map<number, GameState>();
  return {
    record,
    cards: cardMap(),
    lookup,
    cap,
    result: null,
    stateAt(index: number): GameState {
      let s = cache.get(index);
      if (!s) cache.set(index, (s = replay(record, lookup, index).state));
      return s;
    },
  };
}

export const itemAt = (kind: ReviewItem['kind'], turn: number, index: number): ReviewItem => ({
  id: `${kind}:${turn}:${index}`,
  kind,
  turn,
  index,
  cost: 'value',
});

/** The engine attack action of `who` at `target` (a card id, or `leader`) in `s`. */
export function attackAction(
  s: GameState,
  who: PlayerId,
  attackerCard: string,
  target: string,
): Action {
  const opp: PlayerId = who === 'p1' ? 'p2' : 'p1';
  const mine = [...queries.zone(s, who, 'leader'), ...queries.zone(s, who, 'characters')];
  const theirs = [...queries.zone(s, opp, 'leader'), ...queries.zone(s, opp, 'characters')];
  const a = mine.find((c) => c.card === attackerCard)!;
  const t =
    target === 'leader'
      ? theirs.find((c) => c.zone === 'leader')!
      : theirs.find((c) => c.card === target)!;
  return { type: 'attack', attacker: a.instance, target: t.instance, player: who };
}
