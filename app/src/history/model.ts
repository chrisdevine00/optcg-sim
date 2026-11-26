/**
 * History's rows (M8 WP6, learning-ui §9): one per saved game, from its summary and its stored
 * review. Pure: sorting, filtering and the words a row says.
 */
import type { ReviewFlag } from '@optcg/ai';
import { ANALYSIS_VERSION, collect, severityCounts, tierWord } from '../play/review/model.ts';
import type { GameSummary, StoredReview } from '../store/types.ts';

export interface Row {
  id: string;
  meta: GameSummary['meta'];
  review: StoredReview | undefined;
  /** Why the game was found read-only when it was last opened, if it was. */
  stale: string | undefined;
}

export { tierWord };

export const RESULT_WORD = { won: 'Won', lost: 'Lost', draw: 'Draw' } as const;

/** The reviewed seat's flags in a stored review. */
export function flagsOf(r: Row): ReviewFlag[] {
  if (!r.review) return [];
  return collect(Object.values(r.review.results), [], r.meta.me).flags;
}

/** True when the analysis did not finish (or is from an older analysis): "Analysis incomplete · Resume". */
export const incomplete = (r: Row): boolean =>
  !r.review || r.review.status !== 'complete' || r.review.analysisVersion !== ANALYSIS_VERSION;

export const severeCount = (r: Row): number =>
  flagsOf(r).filter((f) => f.severity === 'severe').length;

export function formatDate(t: number, timeZone?: string): string {
  return new Date(t).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  });
}

/** "Practised: 1 solved, 1 not yet" for the flags of a game that were practised; '' when none. */
export function practisedText(r: Row): string {
  const p = Object.values(r.review?.practised ?? {});
  const solved = p.filter((x) => x === 'solved').length;
  const not = p.length - solved;
  if (p.length === 0) return '';
  return `Practised: ${[solved ? `${solved} solved` : '', not ? `${not} not yet` : ''].filter(Boolean).join(', ')}`;
}

export const flagsText = (r: Row): string =>
  incomplete(r) && !r.review ? 'Not analysed' : severityCounts(flagsOf(r));

/** "Lost to Kaido, Pirate, 28 October 2026, 13 turns, 1 severe flag. Review." */
export function rowLabel(r: Row, timeZone?: string): string {
  const flags = flagsOf(r);
  const severe = flags.filter((f) => f.severity === 'severe').length;
  const tail = !r.review
    ? 'not analysed'
    : severe > 0
      ? `${severe} severe ${severe === 1 ? 'flag' : 'flags'}`
      : flags.length > 0
        ? `${flags.length} ${flags.length === 1 ? 'flag' : 'flags'}`
        : 'no flags';
  const verb =
    r.meta.result === 'draw'
      ? 'Draw with'
      : `${RESULT_WORD[r.meta.result]} ${r.meta.result === 'won' ? 'against' : 'to'}`;
  return `${verb} ${r.meta.opponentLeader || 'the AI'}, ${tierWord(r.meta.tier)}, ${formatDate(r.meta.endedAt, timeZone)}, ${r.meta.turns} ${r.meta.turns === 1 ? 'turn' : 'turns'}, ${tail}. Review.`;
}

export interface Filters {
  result: 'all' | 'won' | 'lost' | 'draw';
  opponent: string;
  severe: boolean;
  sort: 'date' | 'severe';
}

export const NO_FILTERS: Filters = { result: 'all', opponent: 'all', severe: false, sort: 'date' };

export function visibleRows(rows: readonly Row[], f: Filters): Row[] {
  const out = rows.filter(
    (r) =>
      (f.result === 'all' || r.meta.result === f.result) &&
      (f.opponent === 'all' || r.meta.opponentLeader === f.opponent) &&
      (!f.severe || severeCount(r) > 0),
  );
  return out.sort((a, b) =>
    f.sort === 'severe'
      ? severeCount(b) - severeCount(a) || b.meta.endedAt - a.meta.endedAt
      : b.meta.endedAt - a.meta.endedAt,
  );
}
