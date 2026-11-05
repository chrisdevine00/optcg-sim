/**
 * The missed-lethal flag (learning-ui §4.2, PLAN row 13): replay a record, and at the first Main
 * decision of each turn ask whether the seat had lethal. If it did and the game was not won that
 * turn, it is a flag:
 *
 * - **`any-hand`** (severe): the `public` proof holds. The seat could see everything the proof used,
 *   so it works against any hand they could have held (E01).
 * - **`needed-hidden-info`** (hindsight, never severe): only the `actual` proof holds, against the
 *   hand they really held (E02).
 * - **`search-incomplete`**: neither mode finished; a "Not fully checked" marker, not a flag (E03).
 *
 * A turn the seat won is never flagged. Turns where the seat plainly cannot reach Life + 1 hits are
 * skipped without a search (`prefilter`): see `attackersPossible`.
 */
import type { Card } from '@optcg/cards';
import {
  projectForSearch,
  queries,
  reduce,
  replay,
  type CardLookup,
  type GameRecord,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import type { Explanation } from '../../explanation.ts';
import { explainLethal } from './explain.ts';
import { attackersPossible, lethal, type LethalResult } from './lethal.ts';
import type { Cap } from './search.ts';

export interface LethalFlag {
  kind: 'missed-lethal' | 'not-fully-checked';
  /** The game turn (CR: counted from 1). */
  turn: number;
  player: PlayerId;
  /** Actions applied before the seat's first Main decision of the turn. */
  actionIndex: number;
  /** `severe`: works against any hand. `hindsight`: needed their hidden cards. `marker`: not fully checked. */
  severity: 'severe' | 'hindsight' | 'marker';
  explanation: Explanation;
  /** The `public` check, and the `actual` one when it was needed. */
  public: LethalResult;
  actual: LethalResult | null;
}

export interface ReviewOptions {
  /** Whose turns to check; default both. */
  seats?: PlayerId[];
  /** Per-search cap; default 150,000 nodes. */
  cap?: Cap;
  /** Skip turns that cannot reach the hits needed (default on). */
  prefilter?: boolean;
}

/** Replay `record` and flag every turn where a seat had lethal and did not win. */
export function reviewMissedLethal(
  record: GameRecord,
  lookupCard: CardLookup,
  cards: ReadonlyMap<string, Card>,
  opts: ReviewOptions = {},
): LethalFlag[] {
  const seats = opts.seats ?? ['p1', 'p2'];
  const cap = opts.cap ?? { nodes: 150_000 };
  let state = replay(record, lookupCard, 0).state;
  const candidates: { turn: number; player: PlayerId; index: number; state: GameState }[] = [];
  let lastTurn = -1;
  let resultTurn = -1;
  for (let i = 0; i <= record.actions.length; i++) {
    const dec = queries.decision(state);
    const turn = queries.turn(state).number;
    // A decision with no action after it is the record's end, not a turn the seat played.
    if (
      i < record.actions.length &&
      dec &&
      dec.kind === 'main' &&
      seats.includes(dec.player) &&
      turn !== lastTurn
    ) {
      lastTurn = turn;
      candidates.push({ turn, player: dec.player, index: i, state });
    }
    if (queries.result(state) && resultTurn < 0) resultTurn = turn;
    if (i < record.actions.length) state = reduce(state, record.actions[i]!).state;
  }
  if (queries.result(state) && resultTurn < 0) resultTurn = queries.turn(state).number;
  const result = queries.result(state);
  const out: LethalFlag[] = [];
  for (const c of candidates) {
    if (result && 'winner' in result && result.winner === c.player && resultTurn === c.turn)
      continue;
    if ((opts.prefilter ?? true) && !attackersPossible(c.state, c.player, cards)) continue;
    const pub = lethal({ mode: 'public', view: projectForSearch(c.state, c.player) }, cards, cap);
    if (pub.status === 'proven') {
      out.push({
        kind: 'missed-lethal',
        turn: c.turn,
        player: c.player,
        actionIndex: c.index,
        severity: 'severe',
        explanation: explainLethal(pub, cards, 'review'),
        public: pub,
        actual: null,
      });
      continue;
    }
    const act = lethal({ mode: 'actual', state: c.state }, cards, cap);
    if (act.status === 'proven') {
      out.push({
        kind: 'missed-lethal',
        turn: c.turn,
        player: c.player,
        actionIndex: c.index,
        severity: 'hindsight',
        explanation: explainLethal(act, cards, 'review', pub),
        public: pub,
        actual: act,
      });
    } else if (pub.status === 'unknown' || act.status === 'unknown') {
      const unknown = pub.status === 'unknown' ? pub : act;
      out.push({
        kind: 'not-fully-checked',
        turn: c.turn,
        player: c.player,
        actionIndex: c.index,
        severity: 'marker',
        explanation: explainLethal(unknown, cards, 'review'),
        public: pub,
        actual: act,
      });
    }
  }
  return out;
}
