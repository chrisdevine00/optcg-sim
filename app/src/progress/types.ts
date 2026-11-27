/**
 * M9 WP0: the progress contracts (docs/design/m9-plan.md, WP6). Stored in the `progress` KvStore under
 * key `v1`; games and flags are never copied here, they are derived at read time. Types only.
 */
import type { DrillId } from '@optcg/ai';

/** `L10`: the code of a curriculum lesson. */
export type LessonCode = string;

export interface LessonRecord {
  /** ISO date-time. */
  passedAt?: string;
  /** Passed again within the timed criteria (only a session with `factor <= 1` earns it). */
  passedTimedAt?: string;
  /** "Mark as read" on a lesson with no drill. Never "passed". */
  readAt?: string;
  source: 'drill' | 'tutorial' | 'games' | 'manual';
}

export interface DrillSession {
  id: string;
  drill: DrillId;
  /** A `Lesson.id`: `L10-counter-or-take`. */
  lesson: string;
  /** ISO date-time. */
  at: string;
  n: number;
  correct: number;
  /** Items where the answer was shown (counted as not correct). */
  shown: number;
  /** The timer factor (0.5 to 10), null when untimed. */
  factor: number | null;
  /**
   * M9-R4 (additive): the right answers that came inside the limit that applied to each of them (a paused
   * item does not count). The timed badge reads this, never `factor` alone. Absent on a session from before
   * it existed, or an untimed one: such a session does not earn the badge.
   */
  timedOk?: number;
  itemIds: string[];
  /** Set by the mulligan trainer's per-archetype exit (L12). */
  archetype?: string;
}

export interface ProgressV1 {
  v: 1;
  lessons: Record<LessonCode, LessonRecord>;
  /** The last 200 per drill. */
  sessions: DrillSession[];
}

/** How a lesson is passed (curriculum "exit"); `EXIT` in `exit.ts` has one per lesson code. */
export type ExitRule =
  | { kind: 'drill'; drill: DrillId; n: number; of: number; perArchetype?: number }
  | { kind: 'tutorial' }
  | { kind: 'games'; vs: 'rookie'; finish: number; wins: number }
  | { kind: 'none' };

/** The one method the drill shell writes through (WP4 uses a double in tests; WP6 implements it). */
export interface ProgressSink {
  recordSession(s: DrillSession): Promise<void>;
}
