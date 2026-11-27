/**
 * "What to work on next" (M9 WP6; learning-ui §6.1, exactly):
 *
 * 1. Each concept scores over the last 10 reviewed, non-tutorial games: a flag weighs 3 (severe), 2
 *    (moderate), 1 (minor) or 0.5 (Hindsight); a game's flags are multiplied by 0.85 for each newer
 *    game; the sum is divided by the number of games looked at.
 * 2. +2 for the concept's primary lesson when its drill's last session is under the untimed exit.
 * 3. A concept whose lesson exit was passed within the last 5 games, with no flag of it since, is out.
 * 4. The highest score wins; a tie goes to the lesson earlier in the curriculum's teaching order.
 * 5. Fewer than 3 reviewed games: the next unfinished lesson, and the card says so.
 *
 * The reason always carries its numbers. Hints used and lethal tiers are supporting lines, never score
 * inputs. Pure: the caller supplies the data and the clock.
 */
import type { DrillId, Severity } from '@optcg/ai';
import raw from '../../../docs/content/curriculum.md?raw';
import { LESSONS, type Lesson } from '../learn/lessons.ts';
import {
  isDone,
  lessonInfo,
  lethalFoundAlone,
  reviewedGames,
  type DeriveInput,
  type LethalEntry,
  type ReviewedGame,
} from './derive.ts';
import { codeOf, isDrillRule, ruleWords, type DrillRule } from './exit.ts';
import type { LessonCode } from './types.ts';

export const DECAY = 0.85;
export const WINDOW = 10;
export const MIN_REVIEWED = 3;
export const PASS_WINDOW = 5;
export const DRILL_EVIDENCE = 2;
export const SEVERITY_WEIGHT: Record<Severity, number> = {
  severe: 3,
  moderate: 2,
  minor: 1,
  hindsight: 0.5,
};

/** "Concept → primary lesson", read out of the curriculum's table. */
export function parseConceptTable(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  let on = false;
  for (const line of text.split('\n')) {
    if (/^## Concept → primary lesson/.test(line)) on = true;
    else if (/^## /.test(line)) on = false;
    if (!on) continue;
    const m = /^\|\s*`([a-z-]+)`\s*\|\s*(L\d+-[a-z0-9-]+)\s*\|/.exec(line);
    if (m) out[m[1]!] = m[2]!;
  }
  return out;
}

export const CONCEPT_LESSON: Readonly<Record<string, string>> = parseConceptTable(raw);

/** How the recommendation names a drill: "Your counter-or-take drill: 6 of 10." */
export const DRILL_PHRASE: Record<DrillId, string> = {
  counter: 'counter-or-take',
  don: 'DON!! allocation',
  lethal: 'lethal puzzles',
  mulligan: 'mulligan',
};

export interface Suggestion {
  /** `L10` */
  lesson: LessonCode;
  /** `L10-counter-or-take` */
  lessonId: string;
  title: string;
  concept: string | null;
  score: number;
  reason: string;
}

export interface Recommendation {
  /** `flags`: chosen from review flags and drill evidence; `course`: the next unfinished lesson; `done`: every lesson is finished. */
  kind: 'flags' | 'course' | 'done';
  lesson: LessonCode | null;
  lessonId: string | null;
  title: string;
  /** With its numbers. */
  reason: string;
  /** Supporting lines (lethal tiers), never score inputs. */
  supporting: string[];
  /** The next two. */
  others: Suggestion[];
  /** Reviewed games the score looked at. */
  reviewed: number;
}

export interface RecommendInput extends DeriveInput {
  lethal?: readonly LethalEntry[];
}

export interface RecommendOptions {
  /** The decay per newer game; 0.85 by spec. A test sets 1 to show the pick depends on it. */
  decay?: number;
}

const lessonOf = (code: LessonCode): Lesson | undefined => LESSONS.find((l) => l.code === code);
const orderOf = (code: LessonCode): number => LESSONS.findIndex((l) => l.code === code);
const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;

/** The first lesson, in teaching order, that is not passed or read. */
export function nextUnfinished(input: DeriveInput, skip: readonly LessonCode[] = []): Lesson[] {
  return LESSONS.filter((l) => !skip.includes(l.code) && !isDone(lessonInfo(l.code, input).status));
}

interface Scored {
  concept: string;
  lesson: LessonCode;
  score: number;
  flags: number;
  severe: number;
  /** Games from the newest back to the oldest one that has a flag of this concept. */
  span: number;
  drillClause: string;
  underExit: boolean;
}

function drillClause(rule: DrillRule, last: { correct: number; n: number } | null): string {
  const name = DRILL_PHRASE[rule.drill];
  return last
    ? `Your ${name} drill: ${last.correct} of ${last.n}.`
    : `You have not tried the ${name} drill yet.`;
}

export function recommend(
  input: RecommendInput,
  today: number,
  opts: RecommendOptions = {},
): Recommendation {
  const decay = opts.decay ?? DECAY;
  const reviewedAll = reviewedGames(input).filter((g) => g.endedAt <= today);
  const window = reviewedAll.slice(0, WINDOW);

  const course = (why: string): Recommendation => {
    const open = nextUnfinished(input);
    const first = open[0];
    const others: Suggestion[] = open.slice(1, 3).map((l) => ({
      lesson: l.code,
      lessonId: l.id,
      title: l.title,
      concept: null,
      score: 0,
      reason: `Next in the course after ${first?.code ?? 'this'}.`,
    }));
    if (!first)
      return {
        kind: 'done',
        lesson: null,
        lessonId: null,
        title: 'Every lesson is finished',
        reason: 'You have passed or read every lesson. Review your games to find what to sharpen.',
        supporting: [],
        others: [],
        reviewed: window.length,
      };
    return {
      kind: 'course',
      lesson: first.code,
      lessonId: first.id,
      title: first.title,
      reason: `${why} next in the course is ${first.code}.`,
      supporting: [],
      others,
      reviewed: window.length,
    };
  };

  if (window.length < MIN_REVIEWED) return course('Not enough games yet:');

  // 1. Concept scores.
  const perConcept = new Map<
    string,
    { score: number; flags: number; severe: number; span: number }
  >();
  const lessonForConcept = (concept: string, lessonId: string): string | undefined =>
    CONCEPT_LESSON[concept] ?? (LESSONS.some((l) => l.id === lessonId) ? lessonId : undefined);
  window.forEach((g: ReviewedGame, newer) => {
    for (const f of g.flags) {
      const concept = f.explanation.conceptId;
      if (!lessonForConcept(concept, f.explanation.lessonId)) continue;
      const cur = perConcept.get(concept) ?? { score: 0, flags: 0, severe: 0, span: 0 };
      cur.score += SEVERITY_WEIGHT[f.severity] * Math.pow(decay, newer);
      cur.flags++;
      if (f.severity === 'severe') cur.severe++;
      cur.span = Math.max(cur.span, newer + 1);
      perConcept.set(concept, cur);
    }
  });
  const lessonIdOf = new Map<string, string>();
  for (const g of window)
    for (const f of g.flags) {
      const id = lessonForConcept(f.explanation.conceptId, f.explanation.lessonId);
      if (id) lessonIdOf.set(f.explanation.conceptId, id);
    }
  // Concepts with no flag still count when their lesson has a drill the player is failing.
  for (const [concept, id] of Object.entries(CONCEPT_LESSON)) lessonIdOf.set(concept, id);

  const scored: Scored[] = [];
  for (const [concept, lessonId] of lessonIdOf) {
    const lesson = codeOf(lessonId);
    const s = perConcept.get(concept) ?? { score: 0, flags: 0, severe: 0, span: 0 };
    let score = s.score / window.length;
    // 2. Drill evidence.
    const info = lessonInfo(lesson, input);
    const rule = info.rule;
    let underExit = false;
    if (isDrillRule(rule) && info.last && info.last.correct * rule.of < rule.n * info.last.n) {
      score += DRILL_EVIDENCE;
      underExit = true;
    }
    // 3. Passed lately, no flag since: out.
    const passedMs = info.passedAt ? Date.parse(info.passedAt) : NaN;
    if (!Number.isNaN(passedMs)) {
      const cutoff = nthNewestEnd(input, PASS_WINDOW);
      const flaggedSince = reviewedAll.some(
        (g) => g.endedAt > passedMs && g.flags.some((f) => f.explanation.conceptId === concept),
      );
      if (passedMs >= cutoff && !flaggedSince) continue;
    }
    if (score <= 0) continue;
    scored.push({
      concept,
      lesson,
      score,
      flags: s.flags,
      severe: s.severe,
      span: s.span,
      drillClause: isDrillRule(rule) ? drillClause(rule, info.last) : 'Lesson only: no drill yet.',
      underExit,
    });
  }

  // 4. Highest first; ties by teaching order. One suggestion per lesson (the best concept of it).
  scored.sort((a, b) => b.score - a.score || orderOf(a.lesson) - orderOf(b.lesson));
  const seen = new Set<string>();
  const picks = scored.filter((s) => (seen.has(s.lesson) ? false : (seen.add(s.lesson), true)));
  if (picks.length === 0)
    return course(`No flags to work on in your last ${plural(window.length, 'reviewed game')}:`);

  const reasonOf = (s: Scored): string => {
    const lesson = lessonOf(s.lesson)!;
    const rule = lessonInfo(s.lesson, input).rule;
    const flagPart =
      s.flags > 0
        ? `${plural(s.flags, 'flag')} in ${s.span === 1 ? 'your last game' : `your last ${s.span} games`}` +
          (s.severe > 0 ? `, ${s.severe} of them severe. ` : '. ')
        : '';
    const drillPart = s.drillClause;
    const under =
      s.flags === 0 && s.underExit && isDrillRule(rule)
        ? ` That is under the ${ruleWords(rule)} to pass ${lesson.code}.`
        : '';
    return `${flagPart}${drillPart}${under}`;
  };
  const top = picks[0]!;
  const lesson = lessonOf(top.lesson)!;
  const supporting: string[] = [];
  if (top.concept === 'lethal-math' && input.lethal && input.lethal.length > 0) {
    const l = lethalFoundAlone(input.lethal);
    supporting.push(
      `You asked the lethal coach about ${plural(l.total, 'chance')}: the full line was needed on ${l.needed.tier3}.`,
    );
  }
  return {
    kind: 'flags',
    lesson: top.lesson,
    lessonId: lesson.id,
    title: lesson.title,
    reason: reasonOf(top),
    supporting,
    others: picks.slice(1, 3).map((s) => {
      const l = lessonOf(s.lesson)!;
      return {
        lesson: s.lesson,
        lessonId: l.id,
        title: l.title,
        concept: s.concept,
        score: s.score,
        reason: reasonOf(s),
      };
    }),
    reviewed: window.length,
  };
}

/** When the Nth newest non-tutorial game ended (epoch ms); nothing is older than "before all of them". */
function nthNewestEnd(input: DeriveInput, n: number): number {
  const ends = input.games
    .filter((g) => !g.meta.tags.some((t) => t.toLowerCase() === 'tutorial'))
    .map((g) => g.meta.endedAt)
    .sort((a, b) => b - a);
  return ends.length < n ? -Infinity : ends[n - 1]!;
}
