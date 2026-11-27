/**
 * Merging two progress documents (M9 WP6): an import adds to what is here and never loses it.
 * Sessions are the union by id (the newest 200 per drill kept); each lesson keeps the earliest date it
 * was passed, passed timed or read. Commutative, associative and idempotent: `progress-merge.test`
 * checks 200 random pairs. Pure and free of heavy imports, because the store's validator uses it at boot.
 */
import type { DrillSession, LessonRecord, ProgressV1 } from './types.ts';

export const MAX_SESSIONS_PER_DRILL = 200;

const SOURCE_RANK: Record<LessonRecord['source'], number> = {
  drill: 0,
  tutorial: 1,
  games: 2,
  manual: 3,
};

/** Oldest first, ties by id: the one order every merge ends in. */
const bySession = (a: DrillSession, b: DrillSession): number =>
  a.at < b.at ? -1 : a.at > b.at ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Keeps the newest `MAX_SESSIONS_PER_DRILL` of each drill; the result is in `bySession` order. */
export function capSessions(sessions: readonly DrillSession[]): DrillSession[] {
  const sorted = [...sessions].sort(bySession);
  const seen = new Map<string, number>();
  const keep: DrillSession[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const s = sorted[i]!;
    const n = (seen.get(s.drill) ?? 0) + 1;
    seen.set(s.drill, n);
    if (n <= MAX_SESSIONS_PER_DRILL) keep.push(s);
  }
  return keep.reverse();
}

const earliest = (a: string | undefined, b: string | undefined): string | undefined =>
  a === undefined ? b : b === undefined ? a : a <= b ? a : b;

/** Two records of one lesson: earliest dates; the source of the lowest rank (a fixed, symmetric choice). */
function mergeRecord(a: LessonRecord | undefined, b: LessonRecord | undefined): LessonRecord {
  if (!a) return { ...b! };
  if (!b) return { ...a };
  const out: LessonRecord = {
    source: SOURCE_RANK[a.source] <= SOURCE_RANK[b.source] ? a.source : b.source,
  };
  const passedAt = earliest(a.passedAt, b.passedAt);
  const passedTimedAt = earliest(a.passedTimedAt, b.passedTimedAt);
  const readAt = earliest(a.readAt, b.readAt);
  if (passedAt !== undefined) out.passedAt = passedAt;
  if (passedTimedAt !== undefined) out.passedTimedAt = passedTimedAt;
  if (readAt !== undefined) out.readAt = readAt;
  return out;
}

/** The same id twice: the later one, and for equal times the one whose text sorts later. */
function pickSession(a: DrillSession, b: DrillSession): DrillSession {
  if (a.at !== b.at) return a.at > b.at ? a : b;
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b;
}

export function mergeProgress(a: ProgressV1, b: ProgressV1): ProgressV1 {
  const lessons: Record<string, LessonRecord> = {};
  for (const code of new Set([...Object.keys(a.lessons), ...Object.keys(b.lessons)]))
    lessons[code] = mergeRecord(a.lessons[code], b.lessons[code]);
  const byId = new Map<string, DrillSession>();
  for (const s of [...a.sessions, ...b.sessions]) {
    const had = byId.get(s.id);
    byId.set(s.id, had ? pickSession(had, s) : s);
  }
  return { v: 1, lessons, sessions: capSessions([...byId.values()]) };
}
