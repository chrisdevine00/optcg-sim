/**
 * Practice from a review flag (M9 WP7). Three ways to open a flag as a puzzle:
 *
 * - `mulligan`: no board; the drill route takes the one hand (`mulliganRoute`).
 * - `don-ledger`, `target-best`: the record's own position restored in place (`ReviewFlow.board`),
 *   judged by the controller against `practice.expect`, in the record's own instance ids.
 * - `win-this-turn`, `survive-turn`, `no-counter-on-attack`: `puzzleFromFlag` runs in the review
 *   worker (the `puzzle` message), and the item is restored by the drills' `materialise`. An any-hand
 *   flag at a Main gets the strongest hand their guide allows (header in counts only); a Hindsight
 *   flag or a cut the engine cannot describe keeps the real hand and says so with the label
 *   "Their real hand: one way to see it".
 *
 * Nothing here decides a rule: it asks the worker for an item and the controller for the verdict.
 */
import type { Card } from '@optcg/cards';
import type { PracticeJudge, ReviewFlag, ReviewRecord } from '@optcg/ai';
import type { GameConfig, GameController } from '../game/controller.ts';
import type { SessionRecord } from '../../session/index.ts';
import type { PuzzleRequester } from '../../drills/intake.ts';
import type { DrillAi } from '../../drills/load.ts';
import { materialise } from '../../drills/materialise.ts';
import type { BoardItem } from '../../drills/types.ts';

/** Judges whose board is an item built from the flag (the rest restore the record itself). */
export const ITEM_JUDGES: ReadonlySet<PracticeJudge> = new Set([
  'win-this-turn',
  'survive-turn',
  'no-counter-on-attack',
]);

/** `/drills/mulligan/run?...` for one flag: the trainer shell with that one hand. */
export const mulliganRoute = (gameId: string, flagId: string): string =>
  `/drills/mulligan/run?flag=${encodeURIComponent(`${gameId}:${flagId}`)}&source=mine&count=5`;

export interface PracticeBoard {
  ctl: GameController;
  /** Above the board: what is known of their hand, in counts only. Null for a real-hand board. */
  header: string | null;
  /** Set when the board keeps the game's real hand ("Their real hand: one way to see it"). */
  handLabel: string | null;
  item: BoardItem;
}

export interface PracticeInput {
  record: SessionRecord;
  flag: ReviewFlag;
  judge: PracticeJudge;
  gameId: string | null;
  cards: Map<string, Card>;
  tier: GameConfig['tier'];
  ai: DrillAi;
  request: PuzzleRequester;
}

/** The item board of a flag, or null when no item can be built (the caller restores the record). */
export async function practiceBoard(o: PracticeInput): Promise<PracticeBoard | null> {
  const res = await o.request(
    o.record as unknown as ReviewRecord,
    o.flag,
    [...o.cards.values()],
    o.gameId ?? '',
  );
  const item = res.item;
  if (!item) return null;
  const m = materialise(o.ai, { item, judge: o.judge }, o.cards, { tier: o.tier });
  const real = item.hand === 'real';
  return {
    ctl: m.ctl,
    item,
    header: real ? null : o.ai.harderHandHeader(item, o.cards),
    handLabel: real ? o.ai.certaintyLabel('needed-hidden-info', 'drill') : null,
  };
}
