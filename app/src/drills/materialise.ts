/**
 * An item on the real board (M9 WP4): the record the controller restores from, the puzzle it is
 * judged as, and the controller itself. The record is built in ai (`recordOfItem`, the
 * `cutAtCounter` pattern: the scenario plus the engine actions of the prefix), because full-state
 * engine calls are allowed only there; this file only wires it to `GameController`.
 *
 * The player sits in the item's `seat` (absent: `p1`); the other seat is the Rookie AI, as in review's
 * Practice (`restoreConfig`).
 */
import type { Card } from '@optcg/cards';
import type { AiPort, PuzzleConfig } from '../play/game/controller.ts';
import { GameController } from '../play/game/controller.ts';
import { cardIdsOf, restoreConfig } from '../play/review/restore.ts';
import type { SessionRecord } from '../session/index.ts';
import type { DrillAi } from './load.ts';
import type { BoardItem, DonItem } from './types.ts';
import type { DrillEntry } from './session.ts';

export const SUBMIT_LABEL = 'Submit turn';

/** The card ids a board item needs: its scenario's cards and the public priors of both Leaders. */
export const itemCardIds = (record: SessionRecord): string[] => cardIdsOf(record);

/** How the item's board is judged. A flag item takes its detector's judge; a bank item its own. */
export function puzzleOf(entry: DrillEntry, turn: number): PuzzleConfig {
  const item = entry.item as BoardItem;
  const base = { turn, submitLabel: SUBMIT_LABEL };
  if (item.drill === 'lethal')
    return { ...base, judge: entry.judge ?? 'win-this-turn', ...expectOf(entry) };
  if (item.drill === 'counter') {
    const judge =
      entry.judge ??
      ('judge' in item
        ? (item as { judge: 'survive-turn' | 'no-counter-on-attack' }).judge
        : 'survive-turn');
    return { turn, judge };
  }
  // DON!!: the least DON!! any listed line leaves unused is the bar (`best` holds the lines that reach it).
  const lines = 'lines' in item ? (item as DonItem).lines : [];
  const best = lines.length > 0 ? Math.min(...lines.map((l) => l.unused)) : undefined;
  return {
    ...base,
    judge: entry.judge ?? 'don-ledger',
    expect: { ...(entry.expect ?? {}), ...(best !== undefined ? { unusedMin: best } : {}) },
  };
}

function expectOf(entry: DrillEntry): { expect?: { target?: string; unusedMin?: number } } {
  return entry.expect ? { expect: entry.expect } : {};
}

export interface Materialised {
  ctl: GameController;
  record: SessionRecord;
  puzzle: PuzzleConfig;
}

export function materialise(
  ai: Pick<DrillAi, 'recordOfItem'>,
  entry: DrillEntry,
  cards: Map<string, Card>,
  o: { aiPort?: () => AiPort; speed?: GameController['config']['speed'] } = {},
): Materialised {
  const item = entry.item as BoardItem;
  const { record, turn } = ai.recordOfItem(item, cards);
  const session = record as unknown as SessionRecord;
  const puzzle = puzzleOf(entry, turn);
  const me = item.seat ?? 'p1';
  const ctl = new GameController(cards, session.start, {
    ...restoreConfig(session, { me, tier: 'rookie' }, cards),
    ...(o.speed ? { speed: o.speed } : {}),
    ...(o.aiPort ? { aiPort: o.aiPort } : {}),
    restore: { record: session, puzzle },
  });
  return { ctl, record: session, puzzle };
}

/** The "No lethal" button belongs to a lethal item whose answer is stored: a bank item. */
export const hasNoLethal = (item: BoardItem): boolean =>
  item.drill === 'lethal' && 'answer' in item;
