/**
 * A drill session as pure data (M9 WP4): which items, in what order, how a set of answers is scored
 * against the lesson's untimed exit, and what is written to progress. No React, no clock of its
 * own, no storage: the run screen passes in what it needs, and the progress store arrives through
 * the injected `ProgressSink` (the lead wires WP6's; the default records nothing).
 */
import type { Explanation, PracticeJudge } from '@optcg/ai';
import type { DrillSession, ProgressSink } from '../progress/types.ts';
import type { AnswerResult, BoardItem, DrillId, DrillItem, SourceFilter } from './types.ts';
import { DRILL_LESSON } from './types.ts';
import { limitSeconds } from './timer.ts';

/**
 * A bank item is a full `DrillItem`; an item cut from a game is a bare `BoardItem` (no stored answer: the
 * board is judged by the controller, the text is solved when the answer is shown).
 */
export type RunItem = DrillItem | BoardItem;

/** One thing to practise: a bank or flag item, and for a flag the judge its detector chose. */
export interface DrillEntry {
  item: RunItem;
  /** Flag items only: how the board is judged (`practice.judge` of the flag). */
  judge?: PracticeJudge;
  expect?: { target?: string; unusedMin?: number };
  /** Flag items: the review's own explanation of the flag, which is the answer text. */
  explanation?: Explanation;
}

export interface Filters {
  archetype?: string | undefined;
  seat?: 'first' | 'second' | undefined;
  source?: SourceFilter | undefined;
}

export const isFromGame = (e: DrillEntry): boolean => e.item.source.kind === 'flag';

/** Which archetype an item belongs to: the mulligan item names it, a board item's own Leader implies it. */
export const archetypeOfItem = (
  item: RunItem,
  archetypeOfLeader: (leader: string) => string,
): string => (item.drill === 'mulligan' ? item.archetypeId : archetypeOfLeader(item.mine));

export function filterEntries(
  entries: readonly DrillEntry[],
  f: Filters,
  archetypeOfLeader: (leader: string) => string,
): DrillEntry[] {
  return entries.filter((e) => {
    if (f.archetype && archetypeOfItem(e.item, archetypeOfLeader) !== f.archetype) return false;
    if (f.seat === 'first' && !e.item.first) return false;
    if (f.seat === 'second' && e.item.first) return false;
    if (f.source === 'bank' && isFromGame(e)) return false;
    return true;
  });
}

/** A 32-bit hash of the session id, the seed of its order. */
export function seedOfSession(sid: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < sid.length; i++) h = Math.imul(h ^ sid.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

function rngOf(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(xs: readonly T[], seed: number): T[] {
  const out = xs.slice();
  const rnd = rngOf(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * The items of a session: the player's own games first (the filter "from my games"), then the bank;
 * each group in an order seeded by the session id, so the same id gives the same session.
 */
export function pickItems(
  entries: readonly DrillEntry[],
  o: { count: number; sid: string; source?: SourceFilter | undefined },
): DrillEntry[] {
  const seed = seedOfSession(o.sid);
  const mine = shuffled(entries.filter(isFromGame), seed);
  const bank = shuffled(
    entries.filter((e) => !isFromGame(e)),
    seed ^ 0x9e3779b9,
  );
  const ordered = o.source === 'mine' ? [...mine, ...bank] : shuffled([...mine, ...bank], seed);
  return ordered.slice(0, o.count);
}

// --- The exit ------------------------------------------------------------------------------------

/** The untimed exit of each drill's lesson, in items right out of `of` (curriculum.md). */
export const EXIT: Record<DrillId, { needed: number; of: number; perArchetype: number | null }> = {
  mulligan: { needed: 8, of: 10, perArchetype: 2 }, // L12: 8 of 10, for each of 2 archetypes
  lethal: { needed: 8, of: 10, perArchetype: null }, // L15
  counter: { needed: 8, of: 10, perArchetype: null }, // L10
  don: { needed: 7, of: 10, perArchetype: null }, // L09: 7 of 10 within the top two lines
};

/** How many right a session of `n` items needs: the exit's ratio, rounded up. */
export const neededFor = (drill: DrillId, n: number): number =>
  Math.ceil((EXIT[drill].needed * n) / EXIT[drill].of);

export interface Summary {
  n: number;
  correct: number;
  shown: number;
  skipped: number;
  /** null: a set shorter than the exit's ten cannot pass the lesson. */
  passed: boolean | null;
  /** "8 of 10: passed" */
  headline: string;
  /** The sentence after it: what the exit asks, or what a short set means. */
  detail: string;
  timed: null | {
    factor: number;
    within: number;
    /** Only a session at 100% or less earns the "passed (timed)" badge. */
    earns: boolean;
    passed: boolean;
    line: string;
  };
}

export function summarise(
  drill: DrillId,
  results: readonly AnswerResult[],
  n: number,
  factor: number | null,
): Summary {
  const correct = results.filter((r) => r.correct && !r.shownAnswer).length;
  const shown = results.filter((r) => r.shownAnswer).length;
  const skipped = Math.max(0, n - results.length);
  const exit = EXIT[drill];
  const need = neededFor(drill, n);
  const full = n >= exit.of;
  const passed = full ? correct >= need : null;
  const headline = `${correct} of ${n}: ${passed === null ? 'not counted for the lesson' : passed ? 'passed' : 'not yet'}`;
  const detail = full
    ? `The lesson's exit is ${exit.needed} of ${exit.of}${n === exit.of ? '' : ` (${need} of ${n} for ${n} items)`}${
        exit.perArchetype ? `, for each of ${exit.perArchetype} archetypes` : ''
      }. Shown answers and skipped items do not count.`
    : `The lesson's exit is ${exit.needed} of ${exit.of}; a set of ${n} is practice. Try ${exit.of} items to work towards it.`;
  let timed: Summary['timed'] = null;
  if (factor !== null) {
    const limit = limitSeconds(drill, factor)!;
    const within = results.filter(
      (r) => r.correct && !r.shownAnswer && r.ms !== null && r.ms / 1000 <= limit,
    ).length;
    const earns = factor <= 1 && full;
    const ok = earns && within >= need;
    timed = {
      factor,
      within,
      earns,
      passed: ok,
      line: `Timed at ${Math.round(factor * 100)}%: ${within} of ${n} right within ${Math.round(limit * 10) / 10} s. ${
        ok
          ? 'Passed (timed).'
          : earns
            ? `The timed badge needs ${need}.`
            : 'The timed badge needs 100% or less, with a full set.'
      }`,
    };
  }
  return { n, correct, shown, skipped, passed, headline, detail, timed };
}

// --- Progress ------------------------------------------------------------------------------------

/** The sink the shell records through. The lead replaces the default with WP6's `progressStore`. */
const noop: ProgressSink = { recordSession: () => Promise.resolve() };
let sink: ProgressSink = noop;
export const setProgressSink = (s: ProgressSink | null): void => {
  sink = s ?? noop;
};
export const progressSink = (): ProgressSink => sink;

export function toDrillSession(o: {
  sid: string;
  drill: DrillId;
  at: string;
  results: readonly AnswerResult[];
  factor: number | null;
  archetype?: string | undefined;
}): DrillSession {
  return {
    id: o.sid,
    drill: o.drill,
    lesson: DRILL_LESSON[o.drill],
    at: o.at,
    n: o.results.length,
    correct: o.results.filter((r) => r.correct && !r.shownAnswer).length,
    shown: o.results.filter((r) => r.shownAnswer).length,
    factor: o.factor,
    itemIds: o.results.map((r) => r.itemId),
    ...(o.archetype ? { archetype: o.archetype } : {}),
  };
}

/** "From your game, turn 9" for an item cut from a played game. */
export const sourceNote = (item: RunItem): string | null =>
  item.source.kind === 'flag' ? `From your game, turn ${item.source.turn}` : null;
