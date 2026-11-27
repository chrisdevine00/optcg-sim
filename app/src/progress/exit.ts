/**
 * How each lesson is passed (M9 WP6; docs/content/curriculum.md "Exit (untimed)"). One rule per lesson
 * code. Only four lessons have a drill in M9 (L09, L10, L12, L15); L01 to L07 are credited by the
 * tutorial and L08 by finished games; the rest are "Lesson only: no drill yet" and can only be marked
 * read, never passed. `app/test/progress-exit.test.ts` reads the numbers back out of the curriculum
 * text, so editing a threshold there without editing this table fails the build.
 *
 * Pure: no React, no store, no clock.
 */
import type { DrillSession, ExitRule, LessonCode } from './types.ts';

/** One rule per lesson code; the test checks it covers every lesson in the curriculum. */
export const EXIT: Record<LessonCode, ExitRule> = {
  L01: { kind: 'tutorial' },
  L02: { kind: 'tutorial' },
  L03: { kind: 'tutorial' },
  L04: { kind: 'tutorial' },
  L05: { kind: 'tutorial' },
  L06: { kind: 'tutorial' },
  L07: { kind: 'tutorial' },
  L08: { kind: 'games', vs: 'rookie', finish: 3, wins: 2 },
  L09: { kind: 'drill', drill: 'don', n: 7, of: 10 },
  L10: { kind: 'drill', drill: 'counter', n: 8, of: 10 },
  L11: { kind: 'none' },
  L12: { kind: 'drill', drill: 'mulligan', n: 8, of: 10, perArchetype: 2 },
  L13: { kind: 'none' },
  L14: { kind: 'none' },
  L15: { kind: 'drill', drill: 'lethal', n: 8, of: 10 },
  L16: { kind: 'none' },
  L17: { kind: 'none' },
  L18: { kind: 'none' },
  L19: { kind: 'none' },
  L20: { kind: 'none' },
  L21: { kind: 'none' },
  L22: { kind: 'none' },
  L23: { kind: 'none' },
  L24: { kind: 'none' },
  L25: { kind: 'none' },
  L26: { kind: 'none' },
  L27: { kind: 'none' },
};

/** `L10-counter-or-take` or `L10` to `L10`. */
export const codeOf = (lessonIdOrCode: string): LessonCode => lessonIdOrCode.split('-')[0]!;

export type DrillRule = Extract<ExitRule, { kind: 'drill' }>;
export const isDrillRule = (r: ExitRule | undefined): r is DrillRule => r?.kind === 'drill';

/** "8 of 10" as the lessons say it. */
export const ruleWords = (r: DrillRule): string =>
  `${r.n} of ${r.of}` + (r.perArchetype ? `, for each of ${r.perArchetype} archetypes` : '');

/**
 * One session meets the rule when it had at least `of` items and the same share right (so 16 of 20
 * passes "8 of 10", and a 5-item warm-up cannot). Items whose answer was shown are not correct.
 */
export const sessionPasses = (r: DrillRule, s: DrillSession): boolean =>
  s.n >= r.of && s.correct * r.of >= r.n * s.n;

/**
 * When the exit was first met by the sessions of `r.drill`, as an ISO date-time, or null. With
 * `perArchetype` it is the moment the Nth different archetype first passed. `timedOnly` looks at
 * sessions run at the base time or faster (`factor <= 1`): the separate "passed (timed)" badge.
 */
export function drillPassedAt(
  r: DrillRule,
  sessions: readonly DrillSession[],
  timedOnly = false,
): string | null {
  const first = new Map<string, string>();
  for (const s of sessions) {
    if (s.drill !== r.drill || !sessionPasses(r, s)) continue;
    if (timedOnly && !(s.factor !== null && s.factor <= 1)) continue;
    const key = r.perArchetype ? (s.archetype ?? '') : '*';
    if (r.perArchetype && key === '') continue;
    const had = first.get(key);
    if (had === undefined || s.at < had) first.set(key, s.at);
  }
  const need = r.perArchetype ?? 1;
  const at = [...first.values()].sort();
  return at.length >= need ? at[need - 1]! : null;
}
