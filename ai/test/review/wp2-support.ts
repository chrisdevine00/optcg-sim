/**
 * M8 WP2 test support: scripted games from planted positions, a detector context built from the
 * record (what WP1's runner provides in the app), and hidden-zone variants for the differentials.
 * Tests call detectors directly with planted records, never through the pipeline.
 */
import {
  appendAction,
  createFromScenario,
  createGame,
  legalActions,
  queries,
  reduce,
  startRecord,
  type Action,
  type GameState,
  type PlayerId,
  type RecordWithSnapshots,
  type ScenarioSpec,
} from '@optcg/engine';
import { DETECTORS } from '../../src/search/review/registry.ts';
import type {
  DetectorContext,
  FlagKind,
  ReviewItem,
  ReviewRecord,
  TurnResult,
} from '../../src/search/review/types.ts';
import { cardMap, lookup } from '../support.ts';

export type Spec = Omit<ScenarioSpec, 'cards'>;
export type Plan = ((s: GameState) => Action)[];

const inst = (s: GameState, p: PlayerId, card: string): string => {
  const zones = ['leader', 'characters', 'hand', 'stage'] as const;
  for (const z of zones) {
    const c = queries.zone(s, p, z).find((x) => x.card === card);
    if (c) return c.instance;
  }
  throw new Error(`${p} has no ${card} on the table or in hand`);
};

/** Plan steps. `who` is the seat; a card is a card id, or 'leader'. */
export const step = {
  play:
    (who: PlayerId, card: string) =>
    (s: GameState): Action => ({
      type: 'playCard',
      card: inst(s, who, card),
      player: who,
    }),
  give: (who: PlayerId, card: string, n: number): Plan =>
    Array.from({ length: n }, () => (s: GameState): Action => {
      const target =
        card === 'leader' ? queries.zone(s, who, 'leader')[0]!.instance : inst(s, who, card);
      return { type: 'giveDon', target, player: who };
    }),
  attack:
    (who: PlayerId, attacker: string, target: string) =>
    (s: GameState): Action => {
      const foe = who === 'p1' ? 'p2' : 'p1';
      const a =
        attacker === 'leader'
          ? queries.zone(s, who, 'leader')[0]!.instance
          : inst(s, who, attacker);
      const t =
        target === 'leader' ? queries.zone(s, foe, 'leader')[0]!.instance : inst(s, foe, target);
      return { type: 'attack', attacker: a, target: t, player: who };
    },
  endTurn: (who: PlayerId) => (): Action => ({ type: 'endTurn', player: who }),
};

/** The plain answer to a pending decision: no block, no counter, decline "you may", first choice. */
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

/** A counter action for `who` playing the card with id `card` (Character counter or [Counter] Event). */
export function counterWith(s: GameState, who: PlayerId, card: string): Action {
  const a = legalActions(s).find((x) => {
    if (x.type !== 'counter' && !(x.type === 'activate' && x.ability === 'counter')) return false;
    return x.player === who && queries.card(s, x.card).card === card;
  });
  if (!a) throw new Error(`no counter with ${card}`);
  return a;
}

/**
 * Play a planted position: `seat` plays `plan` at its Main decisions, every other decision is
 * answered by `answer` (default `plainAnswer`). Stops when the plan is spent and `seat` owes a
 * Main, or when the other seat reaches a Main.
 */
export function build(
  spec: Spec,
  seat: PlayerId,
  plan: Plan,
  answer: (s: GameState) => Action = plainAnswer,
): RecordWithSnapshots {
  const init = createFromScenario({ ...spec, cards: lookup });
  let rec = startRecord({ scenario: spec }, init.state);
  let s = init.state;
  const queue = [...plan];
  for (let i = 0; i < 400 && !queries.result(s); i++) {
    const dec = queries.decision(s);
    if (!dec) break;
    let a: Action;
    if (dec.kind === 'main') {
      if (dec.player !== seat) break;
      const next = queue.shift();
      if (!next) break;
      a = next(s);
    } else a = answer(s);
    s = reduce(s, a).state;
    rec = appendAction(rec, a, s);
  }
  return rec;
}

/** Every state of the record: index i is the state after i actions. */
export function states(rec: RecordWithSnapshots): GameState[] {
  const init =
    'scenario' in rec.start
      ? createFromScenario({ ...(rec.start.scenario as Spec), cards: lookup })
      : createGame({ ...rec.start.setup, cards: lookup });
  const out = [init.state];
  for (const a of rec.actions) out.push(reduce(out.at(-1)!, a).state);
  return out;
}

export function contextOf(
  rec: RecordWithSnapshots,
  seats: Record<PlayerId, 'human' | 'ai'> = { p1: 'human', p2: 'ai' },
  auto: number[] = [],
): DetectorContext {
  const all = states(rec);
  const record: ReviewRecord = { ...rec, seats, auto, rewinds: [] };
  return {
    record,
    cards: cardMap(),
    lookup,
    cap: { nodes: 1000 },
    result: queries.result(all.at(-1)!),
    stateAt: (i) => all[Math.min(i, all.length - 1)]!,
  };
}

export const itemAt = (kind: FlagKind, ctx: DetectorContext, index: number): ReviewItem => ({
  id: `${kind}:${queries.turn(ctx.stateAt(index)).number}:${index}`,
  kind,
  turn: queries.turn(ctx.stateAt(index)).number,
  index,
  cost: kind === 'target' ? 'value' : 'cheap',
});

/** The index of the first (or `nth`) action matching `pred`. */
export function indexOf(rec: RecordWithSnapshots, pred: (a: Action) => boolean, nth = 0): number {
  const hits = rec.actions.flatMap((a, i) => (pred(a) ? [i] : []));
  if (hits[nth] === undefined) throw new Error('no such action in the record');
  return hits[nth]!;
}

export const run = (kind: FlagKind, ctx: DetectorContext, index: number): TurnResult | null =>
  DETECTORS[kind](itemAt(kind, ctx, index), ctx);

/** The part of a result a differential compares: everything the app would show. */
export const shown = (r: TurnResult | null): string => JSON.stringify(r);

/** Deterministic xorshift for permutations; no wall clock, no Math.random. */
export function shuffled<T>(xs: readonly T[], seed: number): T[] {
  let x = seed | 0 || 1;
  const rnd = (): number => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0x100000000;
  };
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export const lifeOf = (n: number, card: string): string[] => Array.from({ length: n }, () => card);
