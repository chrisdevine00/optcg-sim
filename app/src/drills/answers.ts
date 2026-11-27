/**
 * What an answered item says (flows F19, learning-ui §7.1 "Answer screen"): right or wrong in words,
 * the first lines of the answer, and the `Explanation`. Pure over the ai judges and explainers, so a
 * test can answer every drill's item without a screen. Everything reads the player's own view and the
 * item (a bank item's opponent hand is `harderHand`, never a recorded hand); an item cut from a game
 * uses the explanation its flag stored.
 */
import type { Card } from '@optcg/cards';
import type { Explanation, ExplanationContext, ListSet } from '@optcg/ai';
import type { DrillAi } from './load.ts';
import type { DrillEntry } from './session.ts';
import type { BoardItem, CounterItem, DonItem, LethalItem, MulliganItem } from './types.ts';

/** What the player did. `shown`: they asked for the answer instead. */
export type Detail =
  | { kind: 'shown' }
  | { kind: 'mulligan'; redraw: boolean }
  | { kind: 'board'; outcome: 'solved' | 'failed' }
  | { kind: 'no-lethal' }
  | { kind: 'line'; lineId: string };

export interface AnswerView {
  /** Counts as correct (never when the answer was shown). */
  correct: boolean;
  /** "Correct", "Not this time" or "Answer shown". */
  title: string;
  /** The first lines under it: what you chose and what the answer is. */
  lines: string[];
  explanation: Explanation | null;
  context: ExplanationContext;
  /** The guide's name for a sourced label. */
  archetype?: string;
  /** An item that kept the game's real hand says so (M9 WP7): "Their real hand: one way to see it". */
  handLabel?: string;
  /** Said once by the polite region. */
  spoken: string;
}

type Cards = ReadonlyMap<string, Card>;

const guideNameOf = (label: string): string | undefined => /^From the (.*) guide/.exec(label)?.[1];

const titleOf = (d: Detail, correct: boolean): string =>
  d.kind === 'shown' ? 'Answer shown' : correct ? 'Correct' : 'Not this time';

const keepWord = (keep: boolean): string => (keep ? 'Keep' : 'Redraw');

export function answerFor(
  ai: DrillAi,
  entry: DrillEntry,
  d: Detail,
  cards: Cards,
  lists: readonly ListSet[],
): AnswerView {
  const item = entry.item;
  const finish = (
    correct: boolean,
    lines: string[],
    explanation: Explanation | null,
    context: ExplanationContext,
    archetype?: string,
  ): AnswerView => {
    const ok = d.kind !== 'shown' && correct;
    const title = titleOf(d, ok);
    const real = 'hand' in item && (item as BoardItem).hand === 'real';
    return {
      ...(real ? { handLabel: ai.certaintyLabel('needed-hidden-info', 'drill') } : {}),
      correct: ok,
      title,
      lines,
      explanation,
      context,
      ...(archetype ? { archetype } : {}),
      spoken: `${title}. ${lines.join(' ')}${explanation ? ` ${explanation.claim}` : ''}`,
    };
  };

  if (item.drill === 'mulligan') {
    const m = item as MulliganItem;
    const ex = ai.explainMulliganItem(m, cards, lists);
    const keep = /^Keep/.test(ex.claim);
    const name = guideNameOf(ai.mulliganLabel(m, cards));
    const chose = d.kind === 'mulligan' ? d.redraw : null;
    const right = chose === null ? false : ai.judgeMulligan(m, chose, cards, lists);
    return finish(
      right,
      [
        ...(chose === null ? [] : [`You chose ${keepWord(!chose)}.`]),
        `The guide says ${keepWord(keep)}.`,
      ],
      ex,
      'guide',
      name,
    );
  }

  // Items cut from a game: the board's own judge decided; the words are the flag's.
  if (entry.explanation) {
    const solved = d.kind === 'board' && d.outcome === 'solved';
    return finish(
      solved,
      [solved ? 'You found the better play.' : 'The review flagged a better play here.'],
      entry.explanation,
      'drill',
    );
  }

  const board = item as BoardItem;
  if (board.drill === 'lethal') {
    const sub =
      d.kind === 'no-lethal'
        ? ({ kind: 'no-lethal' } as const)
        : ({ kind: 'played', won: d.kind === 'board' && d.outcome === 'solved' } as const);
    const v = ai.lethalVerdictOf(board as LethalItem, sub, cards);
    return finish(v.correct, [v.headline, v.header], v.explanation, 'drill');
  }
  if (board.drill === 'counter') {
    const c = board as CounterItem;
    const solved = d.kind === 'board' && d.outcome === 'solved';
    const ex = ai.explainCounter(c, cards);
    return finish(
      solved,
      [
        solved
          ? c.expect === 'counter'
            ? 'Right: this attack is worth countering.'
            : 'Right: this one is better taken.'
          : c.expect === 'counter'
            ? 'This attack was worth countering.'
            : 'This one was better taken, with your cards kept.',
      ],
      ex,
      'drill',
    );
  }
  const don = board as DonItem;
  const bestId = don.best[0]!;
  const lineId = d.kind === 'line' ? d.lineId : bestId;
  const right =
    d.kind === 'line'
      ? ai.judgeDonLine(don, d.lineId)
      : d.kind === 'board' && d.outcome === 'solved';
  const best = don.lines.find((l) => l.id === bestId);
  return finish(
    right,
    [
      right
        ? 'That spends your DON!! as well as any line does.'
        : 'Another line leaves less DON!! unused.',
      ...(best ? [`A best line: ${best.label}.`] : []),
    ],
    ai.explainDon(don, cards, d.kind === 'line' ? lineId : bestId),
    'drill',
  );
}
