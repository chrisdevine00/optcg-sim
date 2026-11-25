/**
 * The worker's side of the hint (M7 WP1): `answerHint` answers a `hint` request with the line from
 * `search/hint-line.ts` (the engine-touching part lives under `ai/src/search/`, where determinized
 * states are allowed), and remembers the last few answers so that asking twice at one position gives
 * one answer even on a wall-clock budget.
 */
import type { Card } from '@optcg/cards';
import type { AiRequest, AiResponse, GameInfo } from '../protocol.ts';
import { hint, hintSeed } from '../search/hint-line.ts';
import type { HintResult } from './types.ts';

export { hint, hintSeed, hintSetup, firstStepOf, type HintOptions } from '../search/hint-line.ts';

/** The worker's answer, with the last few remembered so asking twice gives the same answer. */
const MEMO = new Map<string, HintResult>();
const MEMO_SIZE = 12;

export function clearHintMemo(): void {
  MEMO.clear();
}

export function answerHint(
  req: Extract<AiRequest, { type: 'hint' }>,
  cards: ReadonlyMap<string, Card>,
  game: GameInfo | null,
  ms = 0,
): Extract<AiResponse, { type: 'hint' }> {
  const t0 = performance.now();
  const key = `${hintSeed(req.view)}|${req.budgetMs}`;
  let result = MEMO.get(key);
  if (!result) {
    result = hint(req.view, {
      cards,
      budget: { ms: req.budgetMs },
      ...(game ? { game } : {}),
    });
    MEMO.set(key, result);
    if (MEMO.size > MEMO_SIZE) MEMO.delete(MEMO.keys().next().value!);
  }
  return {
    type: 'hint',
    id: req.id,
    result,
    ms: ms + (performance.now() - t0),
  };
}
