/**
 * The review planner (M8 WP1): pure. One replay of a finished record yields the items to run, one per
 * (kind, turn or decision) for the seats under review. Nothing is searched here but the cheap
 * `attackersPossible` prefilter that missed lethal has always had.
 *
 * Item conventions (the detectors of WP2 to WP4 are written against these; `item.index` is the number
 * of actions applied before the decision, so `ctx.stateAt(item.index)` is the board they decided on):
 *
 * | kind           | one item per                                         | `index`                         | phase |
 * | -------------- | ---------------------------------------------------- | ------------------------------- | ----- |
 * | mulligan       | mulligan decision of a seat                          | that action                     | A     |
 * | don-unused     | `endTurn` of a seat                                  | that `endTurn` action           | A     |
 * | counter-wasted | battle in which a seat played a Counter              | the battle's first `counter`    | A     |
 * | missed-lethal  | turn of a seat that could reach lethal (prefiltered) | the turn's first Main decision  | B     |
 * | should-counter | lost game: the winner's turn that ended it           | the winner's first Main of it   | C     |
 * | given-away     | lost game: the winner's turn that ended it           | the winner's first Main of it   | C     |
 * | target         | attack of a seat that had two or more legal targets  | that `attack` action            | D     |
 *
 * Only seats under review (default: the human seats of the record) get items, never an action the
 * record marks `auto` (auto-skip: not a decision). A rewound branch is not in `record.actions`
 * (a rewind truncates the line and keeps the undone actions in `rewinds`), so the plan never sees it.
 * A record with no result is refused: a review reads the hidden cards, which are only fair to read
 * once the game is over.
 */
import type { Card } from '@optcg/cards';
import {
  legalActions,
  queries,
  reduce,
  replay,
  type CardLookup,
  type GameResult,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import { attackersPossible } from '../lethal/lethal.ts';
import { lethalCandidateAt, type LethalCandidate } from '../lethal/review.ts';
import { flagId, type FlagKind, type ReviewItem, type ReviewRecord } from './types.ts';

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

/** "The game is not over": the planner's refusal of a record with no result. */
export class ReviewRefused extends Error {
  constructor() {
    super('The game is not over.');
    this.name = 'ReviewRefused';
  }
}

export interface PlanOptions {
  /** Seats to review; default the record's human seats. */
  seats?: readonly PlayerId[];
  /** Skip turns that cannot reach the hits needed (default on; the L-slice rule). */
  prefilter?: boolean;
}

export interface ReviewPlan {
  items: ReviewItem[];
  /** The turn the game ended on. */
  turns: number;
  seats: PlayerId[];
  result: GameResult;
}

export type Phase = 'A' | 'B' | 'C' | 'D';

/** A cheap (mulligan, DON!!, counter arithmetic), B missed lethal, C lost-turn searches, D values. */
export function phaseOf(item: Pick<ReviewItem, 'kind'>): Phase {
  switch (item.kind) {
    case 'mulligan':
    case 'don-unused':
    case 'counter-wasted':
      return 'A';
    case 'missed-lethal':
      return 'B';
    case 'should-counter':
    case 'given-away':
      return 'C';
    case 'target':
      return 'D';
  }
}

const COST: Record<FlagKind, ReviewItem['cost']> = {
  mulligan: 'cheap',
  'don-unused': 'cheap',
  'counter-wasted': 'cheap',
  'missed-lethal': 'search',
  'should-counter': 'search',
  'given-away': 'search',
  target: 'value',
};

const item = (kind: FlagKind, turn: number, index: number): ReviewItem => ({
  id: flagId(kind, turn, index),
  kind,
  turn,
  index,
  cost: COST[kind],
});

export function planReview(
  record: ReviewRecord,
  lookup: CardLookup,
  cards: ReadonlyMap<string, Card>,
  opts: PlanOptions = {},
): ReviewPlan {
  const seats = (
    opts.seats ?? (['p1', 'p2'] as const).filter((p) => record.seats[p] === 'human')
  ).slice();
  const auto = new Set(record.auto);
  const n = record.actions.length;
  let state: GameState = replay(record, lookup, 0).state;
  const items: ReviewItem[] = [];
  const lethal: { c: LethalCandidate; possible: boolean }[] = [];
  /** The first Main decision of each turn, whoever's it is (the lost turn's attacker). */
  const firstMain = new Map<number, { player: PlayerId; index: number }>();
  let lastLethalTurn = -1;
  /** The last battle a seat played a Counter in: `attack` index. */
  let battle = -1;
  let counteredBattle = -1;
  for (let i = 0; i <= n; i++) {
    const turn = queries.turn(state).number;
    const dec = queries.decision(state);
    if (i < n && dec && dec.kind === 'main' && !firstMain.has(turn))
      firstMain.set(turn, { player: dec.player, index: i });
    if (i === n) break;
    const a = record.actions[i]!;
    const c = lethalCandidateAt(state, i, n, seats, lastLethalTurn);
    if (c && !auto.has(i)) {
      lastLethalTurn = c.turn;
      lethal.push({
        c,
        possible: !(opts.prefilter ?? true) || attackersPossible(state, c.player, cards),
      });
    }
    if (a.type === 'attack') battle = i;
    if (seats.includes(a.player) && !auto.has(i)) {
      if (a.type === 'mulligan') items.push(item('mulligan', turn, i));
      else if (a.type === 'endTurn') items.push(item('don-unused', turn, i));
      else if (a.type === 'counter' && battle >= 0 && counteredBattle !== battle) {
        counteredBattle = battle;
        items.push(item('counter-wasted', turn, i));
      } else if (a.type === 'attack') {
        const targets = new Set(
          legalActions(state)
            .filter((x) => x.type === 'attack' && x.attacker === a.attacker)
            .map((x) => (x as { target: string }).target),
        );
        if (targets.size >= 2) items.push(item('target', turn, i));
      }
    }
    state = reduce(state, a).state;
  }
  const result = queries.result(state);
  if (!result) throw new ReviewRefused();
  const endTurn = queries.turn(state).number;
  const winner = 'winner' in result ? result.winner : null;
  for (const { c, possible } of lethal) {
    // A turn the seat won is never flagged; a turn that cannot reach lethal is not searched.
    if (winner === c.player && c.turn === endTurn) continue;
    if (possible) items.push(item('missed-lethal', c.turn, c.index));
  }
  // The lost turn: the winner's turn the game ended on, when a seat under review lost it.
  const lost = firstMain.get(endTurn);
  if (winner && seats.includes(other(winner)) && lost && lost.player === winner) {
    items.push(item('should-counter', endTurn, lost.index));
    items.push(item('given-away', endTurn, lost.index));
  }
  return { items, turns: endTurn, seats, result };
}
