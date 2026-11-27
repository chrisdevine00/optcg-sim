/**
 * M9 WP0: the drill shell's app-side contracts. Item, bank and answer types live in `@optcg/ai`
 * (`ai/src/search/drills/types.ts`); they are re-exported here as types only, so the shell's boot
 * path never value-imports the ai barrel. Constants below are the route and copy keys the screens share.
 */
import type { DrillId } from '@optcg/ai';

export type {
  AnswerResult,
  BoardItem,
  CounterItem,
  DonItem,
  DonLine,
  DrillBank,
  DrillId,
  DrillItem,
  ItemBase,
  ItemSource,
  LethalItem,
  MulliganItem,
  ScenarioJson,
} from '@optcg/ai';
export type { ProgressSink } from '../progress/types.ts';

/** `/drills/<slug>`: the slug is the drill id. */
export const DRILL_SLUGS: readonly DrillId[] = ['mulligan', 'lethal', 'counter', 'don'];

export const isDrillId = (s: string): s is DrillId =>
  (DRILL_SLUGS as readonly string[]).includes(s);

export const DRILL_NAMES: Record<DrillId, string> = {
  mulligan: 'Mulligan trainer',
  lethal: 'Lethal puzzles',
  counter: 'Counter or take it',
  don: 'DON!! allocation',
};

/** The lesson each drill belongs to (`Lesson.id`). */
export const DRILL_LESSON: Record<DrillId, string> = {
  mulligan: 'L12-mulligan',
  lethal: 'L15-lethal-math',
  counter: 'L10-counter-or-take',
  don: 'L09-don-efficiency',
};

/** Item counts the start screen offers; the default is 10. */
export const SESSION_COUNTS = [5, 10, 20] as const;
export const DEFAULT_COUNT = 10;

/** Timer factors (learning-ui §7.2); `null` is untimed, the default. */
export const TIMER_FACTORS = [null, 0.5, 1, 2, 4, 10] as const;
export type TimerFactor = (typeof TIMER_FACTORS)[number];

/** Where an item came from, as the start screen's filter names it. */
export type SourceFilter = 'mine' | 'bank';

/** What `/drills/:drill?…` and `/drills/:drill/run?…` read: all optional. */
export interface DrillQuery {
  archetype?: string;
  seat?: 'first' | 'second';
  source?: SourceFilter;
  count?: number;
  /** Timer factor in percent: 50, 100, 200, 400, 1000; absent is untimed. */
  timer?: number;
  /** A review flag to practise on its own: `<gameId>:<flagId>` (WP7). */
  flag?: string;
}
