/**
 * Everything the Progress and Learn pages say about the player, derived at read time from what is
 * already stored (M9 WP6, plan "progress derived not copied"): saved games and their reviews, the drill
 * sessions and lesson marks in `progress.v1`, the tutorial's credit and the lethal progress log.
 * Pure: inputs in, words and numbers out; no store, no clock, no React.
 */
import type { DrillId, FlagKind, ReviewFlag } from '@optcg/ai';
import type { GameSummary, StoredReview } from '../store/types.ts';
import type { LessonCredit } from '../tutorial/progress.ts';
import { drillPassedAt, EXIT, isDrillRule, ruleWords, sessionPasses } from './exit.ts';
import type { DrillSession, ExitRule, LessonCode, ProgressV1 } from './types.ts';

export interface DeriveInput {
  /** Saved games, any order. */
  games: readonly GameSummary[];
  /** Stored reviews by game id. */
  reviews: ReadonlyMap<string, StoredReview>;
  progress: ProgressV1;
  /** `lessonCredit()`: what finishing the tutorial recorded. */
  credit: Pick<LessonCredit, 'lessons' | 'at'> | null;
}

export type LessonStatus = 'not-started' | 'in-progress' | 'read' | 'passed' | 'passed-timed';

/** The status in words; the page also gives each a shape. */
export const STATUS_WORD: Record<LessonStatus, string> = {
  'not-started': 'not started',
  'in-progress': 'in progress',
  read: 'read',
  passed: 'passed',
  'passed-timed': 'passed (timed)',
};

// ---------------------------------------------------------------------------------------------
// Which games count
// ---------------------------------------------------------------------------------------------

/** Why a game is left out of win rates. */
export type Exclusion = 'rewound' | 'from-review' | 'tutorial';

export function exclusionOf(g: GameSummary): Exclusion | null {
  const tags = g.meta.tags.map((t) => t.toLowerCase());
  if (tags.includes('rewound')) return 'rewound';
  if (tags.includes('from review')) return 'from-review';
  if (tags.includes('tutorial')) return 'tutorial';
  return null;
}

const isTutorial = (g: GameSummary): boolean =>
  g.meta.tags.some((t) => t.toLowerCase() === 'tutorial');

const newestFirst = (games: readonly GameSummary[]): GameSummary[] =>
  [...games].sort((a, b) => b.meta.endedAt - a.meta.endedAt || (a.id < b.id ? -1 : 1));

/** The human seat's flags in a stored review, each once. */
export function flagsOfReview(r: StoredReview, me: 'p1' | 'p2'): ReviewFlag[] {
  const seen = new Map<string, ReviewFlag>();
  for (const t of Object.values(r.results))
    for (const f of t.flags) if (f.player === me) seen.set(f.id, f);
  return [...seen.values()];
}

/** A game whose review finished, and its flags: what the recommendation and the flag chart read. */
export interface ReviewedGame {
  id: string;
  endedAt: number;
  flags: ReviewFlag[];
}

/** Reviewed (complete), non-tutorial games, newest first. */
export function reviewedGames(input: DeriveInput): ReviewedGame[] {
  const out: ReviewedGame[] = [];
  for (const g of newestFirst(input.games)) {
    if (isTutorial(g)) continue;
    const r = input.reviews.get(g.id);
    if (!r || r.status !== 'complete') continue;
    out.push({ id: g.id, endedAt: g.meta.endedAt, flags: flagsOfReview(r, g.meta.me) });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------------------------

export interface LessonInfo {
  code: LessonCode;
  status: LessonStatus;
  rule: ExitRule;
  /** The best drill session (most correct, as a share), for a lesson with a drill. */
  best: { correct: number; n: number } | null;
  /** The most recent drill session. */
  last: { correct: number; n: number } | null;
  /** ISO date-time the untimed exit was first met, if it was. */
  passedAt: string | null;
  /** "drill: best 6 of 10" and the like: what the row says after the status. */
  detail: string;
}

const share = (x: { correct: number; n: number }) => (x.n === 0 ? 0 : x.correct / x.n);

/** Counted Rookie games for L08: tutorial, rewound and from-review games are not. */
function rookieGames(input: DeriveInput): GameSummary[] {
  return newestFirst(input.games)
    .filter((g) => g.meta.tier === 'rookie' && exclusionOf(g) === null)
    .reverse();
}

/** When the games rule was first met (oldest games first), or null. */
function gamesPassedAt(rule: Extract<ExitRule, { kind: 'games' }>, games: GameSummary[]) {
  let wins = 0;
  for (let i = 0; i < games.length; i++) {
    if (games[i]!.meta.result === 'won') wins++;
    if (i + 1 >= rule.finish && wins >= rule.wins)
      return new Date(games[i]!.meta.endedAt).toISOString();
  }
  return null;
}

export function lessonInfo(code: LessonCode, input: DeriveInput): LessonInfo {
  const rule: ExitRule = EXIT[code] ?? { kind: 'none' };
  const rec = input.progress.lessons[code];
  const base = { code, rule, best: null, last: null, passedAt: null as string | null };

  if (rule.kind === 'drill') {
    const mine = input.progress.sessions
      .filter((s) => s.drill === rule.drill)
      .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
    const last = mine.at(-1);
    const best = mine.reduce<DrillSession | undefined>(
      (b, s) => (!b || share(s) > share(b) ? s : b),
      undefined,
    );
    const derived = drillPassedAt(rule, mine);
    const timed = drillPassedAt(rule, mine, true);
    const passedAt = [rec?.passedAt, derived].filter((x): x is string => !!x).sort()[0] ?? null;
    const timedAt = [rec?.passedTimedAt, timed].filter((x): x is string => !!x).sort()[0] ?? null;
    const status: LessonStatus = timedAt
      ? 'passed-timed'
      : passedAt
        ? 'passed'
        : rec?.readAt
          ? 'read'
          : mine.length > 0
            ? 'in-progress'
            : 'not-started';
    return {
      ...base,
      status,
      passedAt,
      best: best ? { correct: best.correct, n: best.n } : null,
      last: last ? { correct: last.correct, n: last.n } : null,
      detail: best ? `drill: best ${best.correct} of ${best.n}` : `drill: pass ${ruleWords(rule)}`,
    };
  }

  if (rule.kind === 'tutorial') {
    const credited = input.credit?.lessons.includes(code) === true;
    const passedAt = credited ? (input.credit?.at ?? null) : (rec?.passedAt ?? null);
    return {
      ...base,
      status: credited || rec?.passedAt ? 'passed' : rec?.readAt ? 'read' : 'not-started',
      passedAt,
      detail: 'the guided tutorial',
    };
  }

  if (rule.kind === 'games') {
    const games = rookieGames(input);
    const wins = games.filter((g) => g.meta.result === 'won').length;
    const at = gamesPassedAt(rule, games);
    const passedAt = rec?.passedAt ?? at;
    return {
      ...base,
      status: passedAt
        ? 'passed'
        : rec?.readAt
          ? 'read'
          : games.length > 0
            ? 'in-progress'
            : 'not-started',
      passedAt,
      detail: `games against Rookie: ${games.length} of ${rule.finish} finished, ${wins} of ${rule.wins} won`,
    };
  }

  return {
    ...base,
    status: rec?.readAt ? 'read' : 'not-started',
    passedAt: null,
    detail: 'Lesson only: no drill yet',
  };
}

export const lessonStatus = (code: LessonCode, input: DeriveInput): LessonStatus =>
  lessonInfo(code, input).status;

/** Done for the course list: passed, timed, or (for a lesson with no drill) marked read. */
export const isDone = (s: LessonStatus): boolean =>
  s === 'passed' || s === 'passed-timed' || s === 'read';

/** The best untimed and timed results for a Practise entry. */
export function bestResult(
  drill: DrillId,
  sessions: readonly DrillSession[],
): { correct: number; n: number; factor: number | null } | null {
  let best: DrillSession | undefined;
  for (const s of sessions) if (s.drill === drill && (!best || share(s) > share(best))) best = s;
  return best ? { correct: best.correct, n: best.n, factor: best.factor } : null;
}

export { sessionPasses, isDrillRule };

// ---------------------------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------------------------

export interface RateRow {
  key: string;
  label: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface WinRates {
  byArchetype: RateRow[];
  byTier: RateRow[];
  counted: number;
  excluded: Record<Exclusion, number>;
  /** "3 rewound games not counted", or '' when nothing was left out. */
  excludedNote: string;
}

const TIER_WORD: Record<string, string> = {
  rookie: 'Rookie',
  pirate: 'Pirate',
  warlord: 'Warlord',
  emperor: 'Emperor',
};
const TIER_ORDER = ['rookie', 'pirate', 'warlord', 'emperor'];

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function excludedNote(x: Record<Exclusion, number>): string {
  const parts: string[] = [];
  if (x.rewound) parts.push(`${plural(x.rewound, 'rewound game')}`);
  if (x['from-review'])
    parts.push(
      plural(x['from-review'], 'game started from a review', 'games started from a review'),
    );
  if (x.tutorial) parts.push(plural(x.tutorial, 'tutorial game'));
  return parts.length ? `${parts.join(', ')} not counted` : '';
}

export function winRates(input: DeriveInput): WinRates {
  const excluded: Record<Exclusion, number> = { rewound: 0, 'from-review': 0, tutorial: 0 };
  const arch = new Map<string, RateRow>();
  const tier = new Map<string, RateRow>();
  let counted = 0;
  const add = (
    m: Map<string, RateRow>,
    key: string,
    label: string,
    r: GameSummary['meta']['result'],
  ) => {
    const row = m.get(key) ?? { key, label, games: 0, wins: 0, losses: 0, draws: 0 };
    row.games++;
    if (r === 'won') row.wins++;
    else if (r === 'lost') row.losses++;
    else row.draws++;
    m.set(key, row);
  };
  // Newest first, so an archetype's label is the name of the deck most recently played with it.
  for (const g of newestFirst(input.games)) {
    const why = exclusionOf(g);
    if (why) {
      excluded[why]++;
      continue;
    }
    counted++;
    const key = g.meta.myLeader || g.meta.deckName;
    add(arch, key, g.meta.deckName || key, g.meta.result);
    add(tier, g.meta.tier, TIER_WORD[g.meta.tier] ?? g.meta.tier, g.meta.result);
  }
  const byGames = (a: RateRow, b: RateRow) => b.games - a.games || (a.label < b.label ? -1 : 1);
  return {
    byArchetype: [...arch.values()].sort(byGames),
    byTier: [...tier.values()].sort(
      (a, b) => TIER_ORDER.indexOf(a.key) - TIER_ORDER.indexOf(b.key),
    ),
    counted,
    excluded,
    excludedNote: excludedNote(excluded),
  };
}

export const ratePercent = (r: RateRow): number =>
  r.games === 0 ? 0 : Math.round((r.wins / r.games) * 100);

export interface FlagFrequency {
  /** Reviewed games looked at (at most `last`). */
  games: number;
  total: number;
  byKind: Partial<Record<FlagKind, number>>;
}

/** Flags by kind over the last `last` reviewed, non-tutorial games. */
export function flagFrequency(input: DeriveInput, last = 20): FlagFrequency {
  const games = reviewedGames(input).slice(0, last);
  const byKind: Partial<Record<FlagKind, number>> = {};
  let total = 0;
  for (const g of games)
    for (const f of g.flags) {
      byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
      total++;
    }
  return { games: games.length, total, byKind };
}

// ---------------------------------------------------------------------------------------------
// Lethal: how far the player needed to go
// ---------------------------------------------------------------------------------------------

export interface LethalEntry {
  game: number;
  turn: number;
  furthest: 'tier1' | 'tier2' | 'count' | 'tier3';
}

export interface LethalSummary {
  /** Lethal chances where the player asked the coach at all. */
  total: number;
  needed: Record<LethalEntry['furthest'], number>;
}

/**
 * What the lethal progress log holds: for each chance the player asked the coach about, the furthest
 * tier they needed. A lethal found with no help at all leaves no entry, so the rate of "found alone"
 * is not recorded yet (docs/OPEN-QUESTIONS.md); this reports what is.
 */
export function lethalFoundAlone(entries: readonly LethalEntry[]): LethalSummary {
  const needed = { tier1: 0, tier2: 0, count: 0, tier3: 0 };
  for (const e of entries) if (e.furthest in needed) needed[e.furthest]++;
  return { total: needed.tier1 + needed.tier2 + needed.count + needed.tier3, needed };
}

// ---------------------------------------------------------------------------------------------
// Drill accuracy over time
// ---------------------------------------------------------------------------------------------

export interface AccuracyPoint {
  at: string;
  n: number;
  correct: number;
  /** 0 to 100, rounded. */
  percent: number;
  factor: number | null;
}

/** Untimed sessions and timed ones (a timer was on), each oldest first: shown as separate lines. */
export function accuracySeries(
  progress: ProgressV1,
  drill: DrillId,
): { untimed: AccuracyPoint[]; timed: AccuracyPoint[] } {
  const out = { untimed: [] as AccuracyPoint[], timed: [] as AccuracyPoint[] };
  const mine = progress.sessions
    .filter((s) => s.drill === drill)
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.id < b.id ? -1 : 1));
  for (const s of mine) {
    const p = {
      at: s.at,
      n: s.n,
      correct: s.correct,
      percent: s.n === 0 ? 0 : Math.round((s.correct / s.n) * 100),
      factor: s.factor,
    };
    (s.factor === null ? out.untimed : out.timed).push(p);
  }
  return out;
}
