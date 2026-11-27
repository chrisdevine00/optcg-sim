/**
 * What the drill shell (app/src/drills, M9 WP4) needs from the engine, written here because full-state
 * calls live only under `ai/src/search/` (hard rule 2). Three things:
 *
 * - `recordOfItem`: the item's scenario plus its `prefix` as a session-shaped record, which the app's
 *   `GameController` restores from (the `cutAtCounter` pattern). The human seat is the item's `seat`
 *   (absent: `p1`); the other is the AI.
 * - `lethalHeaderOf`: "3 Life cards to take, so 3 hits to win · 4 cards in their hand, up to +2000
 *   each". It reads the player's own view in `public` mode, so the opponent's hand is only counted.
 * - `lethalVerdictOf`: the answer text of a lethal item, seat-aware: a bank item goes through
 *   `judgeLethal` (WP2); an item cut from a game (no stored answer) is solved in `public` mode now.
 */
import type { Card } from '@optcg/cards';
import {
  appendAction,
  projectForSearch,
  queries,
  reduce,
  replay,
  startRecord,
  type Action,
  type PlayerId,
  type RecordWithSnapshots,
} from '@optcg/engine';
import type { Explanation } from '../../explanation.ts';
import { explainLethal } from '../lethal/explain.ts';
import { lethal, type LethalResult } from '../lethal/lethal.ts';
import {
  judgeLethal,
  lethalHeader,
  LETHAL_NODES,
  type LethalSubmission,
  type LethalVerdict,
} from './lethal.ts';
import type { ReviewFlag, ReviewRecord } from '../review/types.ts';
import { MULLIGAN_LESSON, metaListSets } from './mulligan.ts';
import { applyAll, startOf } from './play.ts';
import type { BoardItem, LethalItem, MulliganItem } from './types.ts';

type Cards = ReadonlyMap<string, Card>;

/** A session record: the shape the app's `GameSession.fromRecord` takes (`SessionRecord`). */
export type ItemRecord = RecordWithSnapshots & {
  seats: Record<PlayerId, 'human' | 'ai'>;
  rewinds: { from: number; to: number; undone: Action[] }[];
  auto: number[];
};

export const seatOf = (item: BoardItem): PlayerId => item.seat ?? 'p1';

/**
 * The scenario and its prefix as a record the app can restore a controller from, and the turn number
 * the position stands in (the turn a puzzle is judged on).
 */
export function recordOfItem(item: BoardItem, cards: Cards): { record: ItemRecord; turn: number } {
  const initial = startOf(item.scenario, cards);
  const me = seatOf(item);
  let record: ItemRecord = {
    ...startRecord({ scenario: item.scenario }, initial),
    seats: { p1: me === 'p1' ? 'human' : 'ai', p2: me === 'p2' ? 'human' : 'ai' },
    rewinds: [],
    auto: [],
  };
  let state = initial;
  for (const a of item.prefix) {
    state = reduce(state, a).state;
    record = { ...record, ...appendAction(record, a, state) };
  }
  return { record, turn: queries.turn(state).number };
}

/** The solver's public-mode answer for the item's seat, from that seat's own view. */
export function publicResultOf(item: BoardItem, cards: Cards): LethalResult {
  const state = applyAll(startOf(item.scenario, cards), item.prefix);
  return lethal({ mode: 'public', view: projectForSearch(state, seatOf(item)) }, cards, {
    nodes: LETHAL_NODES,
  });
}

/** Above the board of a lethal puzzle: only counts and public facts (hard rule 3). */
export const lethalHeaderOf = (item: BoardItem, cards: Cards): string =>
  lethalHeader(publicResultOf(item, cards));

/**
 * The answer's headline and text. A bank item has its stored answer (`judgeLethal`); an item cut from a
 * game is solved here: `proven` means a line wins against every hand, anything else is "no proof".
 */
export function lethalVerdictOf(
  item: BoardItem,
  submitted: LethalSubmission,
  cards: Cards,
): LethalVerdict {
  if ('answer' in item && seatOf(item) === 'p1' && item.prefix.length === 0)
    return judgeLethal(item as LethalItem, submitted, cards);
  const result = publicResultOf(item, cards);
  const explanation: Explanation = explainLethal(result, cards, 'coach');
  const won = submitted.kind === 'played' && submitted.won;
  return {
    correct: won,
    headline: won
      ? 'You found it.'
      : result.status === 'proven'
        ? 'You have lethal: a line wins this turn against any hand they could hold.'
        : 'Nothing could be proved here from what you can see.',
    header: lethalHeader(result),
    explanation,
  };
}

/**
 * A mulligan flag as a mulligan item: the seat's own opening hand, read from the record at the
 * decision (it is the player's own hand, so nothing hidden is read). Null when the Leader has no
 * sourced list set (no archetype to judge the hand against), which a flag never has in practice.
 */
export function mulliganItemFromFlag(
  record: ReviewRecord,
  flag: ReviewFlag,
  cards: Cards,
  gameId: string,
): MulliganItem | null {
  if (flag.kind !== 'mulligan') return null;
  try {
    const s = replay(record, (id) => cards.get(id), flag.restoreIndex).state;
    const me = flag.player;
    const leader = queries.zone(s, me, 'leader')[0]!.card;
    const opp = me === 'p1' ? 'p2' : 'p1';
    const set = metaListSets().find((x) => x.leaderId === leader);
    if (!set) return null;
    return {
      id: `flag:${gameId}:${flag.id}`,
      drill: 'mulligan',
      lesson: MULLIGAN_LESSON,
      source: { kind: 'flag', gameId, flagId: flag.id, turn: flag.turn },
      mine: leader,
      theirs: queries.zone(s, opp, 'leader')[0]?.card ?? null,
      first: queries.turn(s).activePlayer === me,
      certainty: 'any-hand',
      label: 'guide',
      hand: queries.zone(s, me, 'hand').map((c) => c.card),
      archetypeId: set.archetypeId,
    };
  } catch {
    return null;
  }
}
