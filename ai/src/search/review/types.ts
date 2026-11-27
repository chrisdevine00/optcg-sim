/**
 * M8 WP0: the contracts of the review pipeline (docs/design/m8-plan.md). Planner, runner, detectors,
 * worker and UI are written against these types; they carry no behaviour of their own.
 */
import type { Card } from '@optcg/cards';
import type {
  Action,
  CardLookup,
  GameRecord,
  GameResult,
  GameState,
  PlayerId,
} from '@optcg/engine';
import type { Explanation, Move } from '../../explanation.ts';
import type { BoardItem } from '../drills/types.ts';
import type { LethalResult } from '../lethal/lethal.ts';
import type { Cap } from '../lethal/search.ts';

export type FlagKind =
  | 'missed-lethal'
  | 'given-away'
  | 'don-unused'
  | 'counter-wasted'
  | 'should-counter'
  | 'target'
  | 'mulligan';

export const FLAG_KINDS: readonly FlagKind[] = [
  'missed-lethal',
  'given-away',
  'don-unused',
  'counter-wasted',
  'should-counter',
  'target',
  'mulligan',
];

/** Hindsight is never severe: a flag that needed their hidden cards is shown in its own style. */
export type Severity = 'severe' | 'moderate' | 'minor' | 'hindsight';

/**
 * The puzzle a flag can be practised as. M9 WP0 (types only) adds `don-ledger`, `target-best` and
 * `mulligan`; WP7 makes the detectors set them and WP4 the controller judge them.
 */
export type PracticeJudge =
  | 'win-this-turn'
  | 'survive-turn'
  | 'no-counter-on-attack'
  | 'don-ledger'
  | 'target-best'
  | 'mulligan';

export interface ReviewFlag {
  /** `${kind}:${turn}:${decisionIndex}`: stable across re-analysis; the key of "Practised". */
  id: string;
  kind: FlagKind;
  /** The game turn, counted from 1. */
  turn: number;
  player: PlayerId;
  /** Actions applied where Study and Play from here open. */
  restoreIndex: number;
  /** The index of the flagged action in the record's `actions`. */
  decisionIndex: number;
  severity: Severity;
  certainty: Explanation['certainty'];
  explanation: Explanation;
  /** "What you did", built in ai/ from the record. */
  did: Move[];
  practice?: {
    judge: PracticeJudge;
    turn: number;
    /** M9 (additive): what the judge compares with. `unusedMin` for `don-ledger`, a `target` handle for `target-best`. */
    expect?: { target?: string; unusedMin?: number };
  };
  /** M8 WP1 (additive): the missed-lethal proofs, which Study (the line's handles) and Practice read. */
  lethal?: LethalProof;
}

/** The `public` check of a missed-lethal turn, and the `actual` one when it was needed. */
export interface LethalProof {
  public: LethalResult;
  actual: LethalResult | null;
  /** Whose Main it was, and where the check started (the L-slice `LethalFlag`'s fields). */
  player: PlayerId;
  actionIndex: number;
}

export const flagId = (kind: FlagKind, turn: number, decisionIndex: number): string =>
  `${kind}:${turn}:${decisionIndex}`;

/** "Not fully checked": a search hit its cap or the deadline. Never a clean turn. */
export interface ReviewMarker {
  turn: number;
  /** The kind that could not be finished, or null when a whole turn was not analysed. */
  kind: FlagKind | null;
  reason: 'search-incomplete' | 'deadline' | 'not-run';
  explanation?: Explanation;
  /** M8 WP1 (additive): the unfinished missed-lethal check, kept for the L-slice review screen. */
  lethal?: LethalProof;
}

/** What running one item (or merging a turn's items) yields. */
export interface TurnResult {
  /** The item this came from. */
  itemId: string;
  turn: number;
  flags: ReviewFlag[];
  /** Things worth saying that are not flags (E07 "not flagged", "Their board won whatever you did"). */
  notes: Explanation[];
  marker?: ReviewMarker;
}

/** Planned work: one detector on one turn (or decision). */
export interface ReviewItem {
  id: string;
  kind: FlagKind;
  turn: number;
  /** The action index the detector starts from (a decision, a turn's first Main, or an `endTurn`). */
  index: number;
  /** Scheduling phase: cheap = A, search = B/C, value = D. */
  cost: 'cheap' | 'search' | 'value';
}

/** The record a review reads: a game record plus who played each side and which actions were auto. */
export type ReviewRecord = GameRecord & {
  seats: Record<PlayerId, 'human' | 'ai'>;
  /** Action indexes applied by auto-skip: never decisions. */
  auto: number[];
  /** Rewinds, so a rewound branch can be skipped. */
  rewinds: { from: number; to: number; undone: Action[] }[];
};

/** What a detector is given besides its item (the runner, WP1, fills `stateAt` from a replay cache). */
export interface DetectorContext {
  record: ReviewRecord;
  cards: ReadonlyMap<string, Card>;
  lookup: CardLookup;
  /** Search cap for this item. */
  cap: Cap;
  /** The finished game's result. */
  result: GameResult | null;
  /** The state after `index` actions of the record. */
  stateAt(index: number): GameState;
}

/** `null`: the detector has nothing to say about this item (no flag, no note, no marker). */
export type Detector = (item: ReviewItem, ctx: DetectorContext) => TurnResult | null;

// --- Worker messages (review-worker.ts, WP1) ------------------------------------------------

export type ReviewRequest =
  | {
      type: 'start';
      record: ReviewRecord;
      cards: Card[];
      /** Seats to review; default every human seat. */
      seats?: PlayerId[];
      /** Per-search node cap (tests); the app uses time caps. */
      nodes?: number;
      /** Whole-review deadline in ms; default 55 000. */
      deadlineMs?: number;
      /**
       * M8 WP1 (additive): deal the plan to a pool. This worker runs the items whose position within
       * their phase is `index` modulo `count`; every worker plans the same record the same way.
       */
      shard?: { index: number; count: number };
    }
  | { type: 'cancel' }
  /** "Analyse now": run this turn's items next. */
  | { type: 'prioritise'; turn: number }
  /** Re-run these items with `factor` times the cap. */
  | { type: 'deeper'; itemIds: string[]; factor: number }
  /**
   * M9 (additive): "build a practice item from this flag" (`puzzleFromFlag`, WP2; wired by WP7).
   * `record` and `cards` are set when no review job holds the record (a stored review, WP4 intake).
   */
  | { type: 'puzzle'; flagId: string; record?: ReviewRecord; cards?: Card[] };

export type ReviewResponse =
  | { type: 'progress'; done: number; total: number; turn: number; turns: number }
  | { type: 'items'; results: TurnResult[] }
  | { type: 'done'; markers: ReviewMarker[] }
  | { type: 'error'; message: string }
  /** M9 (additive): the answer to `puzzle`; `item` is null with a `reason` when the flag has no puzzle. */
  | { type: 'puzzle'; flagId: string; item: BoardItem | null; reason?: string };

export type PracticedState = 'solved' | 'not-yet';
