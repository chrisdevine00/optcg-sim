/**
 * A review flag as a puzzle (M9 WP2): `puzzleFromFlag` builds the `BoardItem` "From your game, turn 9"
 * is practised on. Called only from the review worker (it replays a full record, which holds both
 * hands).
 *
 * - **`any-hand` flag cut at a Main the engine can describe**: the position is rebuilt as a scenario
 *   in which the opponent's hand is `harderHand` (real cards from their public prior that defend
 *   best), their face-down Life is `INERT_LIFE`, and their deck is that many filler cards (only the count of hidden cards is public). The
 *   result mentions nothing of their real hidden cards (hard rule 3): two records that differ only
 *   there give the same item, byte for byte. `hand: 'harder'`, label `any-hand`.
 * - **A Hindsight flag, or a cut the engine cannot describe** (`NotExpressible`: a counter step, an
 *   effect half resolved): the actual hand is kept. The scenario is the last moment before the cut
 *   that can be described, and `prefix` replays the engine actions from there (the attack declared,
 *   the block step passed). `hand: 'real'`, label `hindsight`: the player is shown "Their real hand:
 *   one way to see it" (`certaintyLabel(.., 'drill')`).
 *
 * It never throws: a record it cannot read, or a position it cannot rebuild, is `{ item: null, reason }`.
 */
import type { Card } from '@optcg/cards';
import {
  createFromScenario,
  NotExpressible,
  queries,
  reduce,
  replay,
  scenarioOf,
  type Action,
  type GameState,
  type InstanceId,
  type PlayerId,
  type ZoneName,
} from '@optcg/engine';
import type { ReviewFlag, ReviewRecord } from '../review/types.ts';
import { harderHand, INERT_LIFE } from './hand.ts';
import type { BoardItem, ScenarioJson } from './types.ts';

export interface PuzzleFromFlagOptions {
  /** The saved game's id (the record has none); goes into the item's id and source. */
  gameId?: string;
  /** How far back from the cut to look for a moment the engine can describe; default 80 actions. */
  lookBack?: number;
}

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

const ZONES: ZoneName[] = ['hand', 'deck', 'life', 'leader', 'characters', 'stage', 'trash'];

/** Instance id in `from` -> the instance in `to` that sits at the same seat, zone and position. */
function positionMap(from: GameState, to: GameState): Map<InstanceId, InstanceId> {
  const m = new Map<InstanceId, InstanceId>();
  for (const p of ['p1', 'p2'] as const)
    for (const z of ZONES) {
      const a = queries.zone(from, p, z);
      const b = queries.zone(to, p, z);
      a.forEach((c, i) => {
        if (b[i]) m.set(c.instance, b[i]!.instance);
      });
    }
  return m;
}

function remap(a: Action, m: Map<InstanceId, InstanceId>): Action | null {
  const o = { ...a } as Record<string, unknown>;
  const f = (id: unknown): unknown => (typeof id === 'string' ? (m.get(id) ?? null) : id);
  for (const k of ['target', 'attacker', 'card', 'blocker']) {
    if (!(k in o) || o[k] === null) continue;
    const v = f(o[k]);
    if (v === null) return null;
    o[k] = v;
  }
  const ch = o.choice;
  if (typeof ch === 'string') {
    const v = f(ch);
    if (v === null) return null;
    o.choice = v;
  } else if (ch && typeof ch === 'object' && 'card' in ch) {
    const v = f((ch as { card: string }).card);
    if (v === null) return null;
    o.choice = { ...ch, card: v };
  }
  return o as Action;
}

type BoardDrill = BoardItem['drill'];
/** Mulligan flags are not boards: the mulligan trainer takes them. */
const DRILL_OF: Record<ReviewFlag['kind'], BoardDrill | null> = {
  'missed-lethal': 'lethal',
  target: 'lethal',
  'don-unused': 'don',
  'given-away': 'counter',
  'should-counter': 'counter',
  'counter-wasted': 'counter',
  mulligan: null,
};
const LESSON_OF: Record<BoardDrill, string> = {
  lethal: 'L15-lethal-math',
  counter: 'L10-counter-or-take',
  don: 'L09-don-efficiency',
};

export function puzzleFromFlag(
  record: ReviewRecord,
  flag: ReviewFlag,
  cards: ReadonlyMap<string, Card>,
  opts: PuzzleFromFlagOptions = {},
): BoardItem | { item: null; reason: string } {
  const lookup = (id: string) => cards.get(id);
  const fail = (reason: string) => ({ item: null, reason });
  const drill = DRILL_OF[flag.kind];
  if (!drill) return fail('A mulligan is practised in the mulligan trainer.');
  try {
    const at = flag.restoreIndex;
    const lo = Math.max(0, at - (opts.lookBack ?? 80));
    let step = replay(record, lookup, lo);
    const states: GameState[] = [step.state];
    for (let i = lo; i < at; i++) {
      step = reduce(step.state, record.actions[i]!);
      states.push(step.state);
    }
    const here = states[states.length - 1]!;
    const me = flag.player;
    const opp = other(me);
    const leaderOf = (s: GameState, p: PlayerId) => queries.zone(s, p, 'leader')[0]!.card;
    const head = {
      id: `flag:${opts.gameId ?? ''}:${flag.id}`,
      drill,
      lesson: LESSON_OF[drill],
      source: {
        kind: 'flag' as const,
        gameId: opts.gameId ?? '',
        flagId: flag.id,
        turn: flag.turn,
      },
      mine: leaderOf(here, me),
      theirs: leaderOf(here, opp),
      seat: me,
    };
    const firstOf = (sc: ScenarioJson) => sc.firstPlayer === me;

    // The harder-hand path: an any-hand flag at a Main the engine can describe.
    if (flag.severity !== 'hindsight' && flag.certainty === 'any-hand') {
      try {
        const life = queries
          .zone(here, opp, 'life')
          .map((c) => (c.faceUp ? { card: c.card, faceUp: true as const } : INERT_LIFE));
        // Their deck's cards are hidden too: only how many there are is public.
        const deck = queries.zone(here, opp, 'deck').map(() => INERT_LIFE);
        const scenario = scenarioOf(here, lookup, {
          hand: { [opp]: harderHand(head.theirs, queries.zone(here, opp, 'hand').length, cards) },
          life: { [opp]: life },
          deck: { [opp]: deck },
        });
        createFromScenario({ ...scenario, cards: lookup });
        return {
          ...head,
          first: firstOf(scenario),
          certainty: 'any-hand',
          label: 'any-hand',
          scenario,
          prefix: [],
          hand: 'harder',
        };
      } catch (e) {
        if (!(e instanceof NotExpressible)) throw e;
      }
    }

    // The record-prefix path: the actual hand, from the last moment that can be described.
    for (let k = states.length - 1; k >= 0; k--) {
      let scenario: ScenarioJson;
      try {
        scenario = scenarioOf(states[k]!, lookup);
      } catch (e) {
        if (e instanceof NotExpressible) continue;
        throw e;
      }
      const base = createFromScenario({ ...scenario, cards: lookup }).state;
      const map = positionMap(states[k]!, base);
      const prefix: Action[] = [];
      let s = base;
      for (const a of record.actions.slice(lo + k, at)) {
        const b = remap(a, map);
        if (!b) return fail('This moment cannot be rebuilt as a puzzle.');
        s = reduce(s, b).state;
        prefix.push(b);
      }
      return {
        ...head,
        first: firstOf(scenario),
        certainty: 'needed-hidden-info',
        label: 'hindsight',
        scenario,
        prefix,
        hand: 'real',
      };
    }
    return fail('This moment cannot be rebuilt as a puzzle.');
  } catch (e) {
    return fail(
      e instanceof Error && e.name === 'RecordVersionMismatch'
        ? 'This game was recorded by another version of the simulator.'
        : 'This moment cannot be rebuilt as a puzzle.',
    );
  }
}
