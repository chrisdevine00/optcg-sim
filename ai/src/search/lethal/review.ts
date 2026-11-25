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
 *
 * M8 WP1: the candidate walk is `planLethalItems` and one candidate's check is `checkLethalItem`, so
 * the review pipeline can run each turn as its own item; `reviewMissedLethal` is the two put together.
 */
import type { Card } from '@optcg/cards';
import {
  legalActions,
  projectForSearch,
  queries,
  reduce,
  replay,
  type Action,
  type CardLookup,
  type GameRecord,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import type { Explanation } from '../../explanation.ts';
import type { LineStep } from './analyse.ts';
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

/** A turn on which a seat could have had lethal: where its first Main decision is in the record. */
export interface LethalCandidate {
  /** The game turn (CR: counted from 1). */
  turn: number;
  player: PlayerId;
  /** Actions applied before the seat's first Main decision of the turn. */
  index: number;
}

/**
 * Is action `i` (with `state` applied up to it) the first Main decision of a seated player's turn?
 * `lastTurn` is the turn of the previous candidate (-1 for none). A decision with no action after it
 * is the record's end, not a turn the seat played.
 */
export function lethalCandidateAt(
  state: GameState,
  i: number,
  actions: number,
  seats: readonly PlayerId[],
  lastTurn: number,
): LethalCandidate | null {
  const dec = queries.decision(state);
  const turn = queries.turn(state).number;
  if (i < actions && dec && dec.kind === 'main' && seats.includes(dec.player) && turn !== lastTurn)
    return { turn, player: dec.player, index: i };
  return null;
}

/** The candidates of `record` in order, from one replay. The pipeline's planner walks the same rule. */
export function planLethalItems(
  record: GameRecord,
  lookupCard: CardLookup,
  seats: readonly PlayerId[] = ['p1', 'p2'],
): LethalCandidate[] {
  let state = replay(record, lookupCard, 0).state;
  const out: LethalCandidate[] = [];
  let lastTurn = -1;
  for (let i = 0; i < record.actions.length; i++) {
    const c = lethalCandidateAt(state, i, record.actions.length, seats, lastTurn);
    if (c) {
      lastTurn = c.turn;
      out.push(c);
    }
    state = reduce(state, record.actions[i]!).state;
  }
  return out;
}

/**
 * Check one candidate. `state` is the state at `c.index`; the rest of the turn is read from
 * `actions` (what the seat did with it, and whether it won). Null: nothing to flag.
 */
export function checkLethalItem(
  c: LethalCandidate,
  actions: readonly Action[],
  state: GameState,
  cards: ReadonlyMap<string, Card>,
  cap: Cap,
  prefilter = true,
): LethalFlag | null {
  // The seat's attacks on their Leader that turn, in order, with the attacker's power; whether it
  // won; and, when it ended the turn, the cards that could still have attacked their Leader.
  const attacked: { card: string; power: number }[] = [];
  let canStillAttack: string[] | null = null;
  let won = false;
  let s = state;
  for (let i = c.index; i < actions.length && queries.turn(s).number === c.turn; i++) {
    const a = actions[i]!;
    if (a.type === 'attack' && a.player === c.player) {
      const target = queries.card(s, a.target);
      if (target.zone === 'leader') {
        const atk = queries.card(s, a.attacker);
        attacked.push({ card: atk.card, power: atk.power ?? 0 });
      }
    }
    if (a.type === 'endTurn' && a.player === c.player) {
      const leader = queries.zone(s, c.player === 'p1' ? 'p2' : 'p1', 'leader')[0]!;
      const here = s;
      canStillAttack = legalActions(here)
        .filter((x) => x.type === 'attack' && x.target === leader.instance)
        .map((x) => queries.card(here, (x as { attacker: string }).attacker).card);
    }
    s = reduce(s, a).state;
    const r = queries.result(s);
    if (r) {
      won = 'winner' in r && r.winner === c.player && queries.turn(s).number === c.turn;
      break;
    }
  }
  if (won) return null;
  if (prefilter && !attackersPossible(state, c.player, cards)) return null;
  const pub = lethal({ mode: 'public', view: projectForSearch(state, c.player) }, cards, cap);
  if (pub.status === 'proven') {
    // The seat played the proof's attacks and still did not win: a Life Trigger (or a Counter
    // the prior did not have) stopped it. That is not a miss it could have seen (L-05).
    const need = (pub.line ?? []).filter(
      (l): l is Extract<LineStep, { kind: 'attack' }> =>
        l.kind === 'attack' && l.target === 'leader',
    );
    // The same attackers in the same order, each at least as strong as the line made it, as far
    // as the seat could: an attacker the line still needed that could no longer attack (a Trigger
    // K.O.'d or rested it) is the defender's doing, not a miss.
    const prefixOk = attacked.every(
      (x, i) => need[i] !== undefined && need[i]!.card === x.card && x.power >= need[i]!.power,
    );
    const rest = need.slice(attacked.length);
    const playedIt =
      need.length > 0 &&
      attacked.length > 0 &&
      prefixOk &&
      (rest.length === 0 || (canStillAttack !== null && !canStillAttack.includes(rest[0]!.card)));
    if (playedIt) return null;
    return {
      kind: 'missed-lethal',
      turn: c.turn,
      player: c.player,
      actionIndex: c.index,
      severity: pub.certainty === 'any-hand' ? 'severe' : 'hindsight',
      explanation: explainLethal(pub, cards, 'review'),
      public: pub,
      actual: null,
    };
  }
  // A refutation that holds against any hand holds against the one they had: no `actual` search can
  // prove it wrong, so none is run (it could only end as a spurious "not fully checked").
  if (pub.status === 'refuted' && pub.certainty === 'any-hand') return null;
  const act = lethal({ mode: 'actual', state }, cards, cap);
  if (act.status === 'proven')
    return {
      kind: 'missed-lethal',
      turn: c.turn,
      player: c.player,
      actionIndex: c.index,
      severity: 'hindsight',
      explanation: explainLethal(act, cards, 'review', pub),
      public: pub,
      actual: act,
    };
  if (pub.status === 'unknown' || act.status === 'unknown') {
    const unknown = pub.status === 'unknown' ? pub : act;
    return {
      kind: 'not-fully-checked',
      turn: c.turn,
      player: c.player,
      actionIndex: c.index,
      severity: 'marker',
      explanation: explainLethal(unknown, cards, 'review'),
      public: pub,
      actual: act,
    };
  }
  return null;
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
  const out: LethalFlag[] = [];
  let state = replay(record, lookupCard, 0).state;
  let at = 0;
  for (const c of planLethalItems(record, lookupCard, seats)) {
    for (; at < c.index; at++) state = reduce(state, record.actions[at]!).state;
    const f = checkLethalItem(c, record.actions, state, cards, cap, opts.prefilter ?? true);
    if (f) out.push(f);
  }
  return out;
}
