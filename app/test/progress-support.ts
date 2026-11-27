/** Fixtures for the M9 WP6 tests: games with reviews and flags, drill sessions, empty inputs. */
import type { DrillId, FlagKind, ReviewFlag, Severity, TurnResult } from '@optcg/ai';
import { emptyProgress } from '../src/progress/store.ts';
import type { DeriveInput } from '../src/progress/derive.ts';
import type { DrillSession, ProgressV1 } from '../src/progress/types.ts';
import type { GameSummary, StoredReview } from '../src/store/types.ts';
import { explanation } from './store-support.ts';

export const DAY = 86_400_000;
/** 2026-11-26T12:00:00Z */
export const NOW = Date.UTC(2026, 10, 26, 12);
export const iso = (t: number): string => new Date(t).toISOString();

export interface FlagSpec {
  concept: string;
  severity: Severity;
  kind?: FlagKind;
  lessonId?: string;
}

export interface GameSpec {
  /** Newest is 0: the game ended `age` days before NOW. */
  age: number;
  flags?: FlagSpec[];
  result?: 'won' | 'lost' | 'draw';
  tier?: 'rookie' | 'pirate' | 'warlord';
  tags?: string[];
  /** No review at all, or one that did not finish. */
  review?: 'none' | 'partial' | 'complete';
  leader?: string;
  deck?: string;
}

const KIND_OF: Record<string, FlagKind> = {
  'counter-or-take': 'should-counter',
  'lethal-math': 'missed-lethal',
  'don-efficiency': 'don-unused',
  'board-vs-face': 'target',
  mulligan: 'mulligan',
};

export function gameOf(i: number, g: GameSpec): { summary: GameSummary; review?: StoredReview } {
  const id = `g${i}`;
  const summary: GameSummary = {
    id,
    meta: {
      result: g.result ?? 'lost',
      me: 'p1',
      myLeader: g.leader ?? 'OP17-039',
      opponentLeader: 'OP17-058',
      tier: g.tier ?? 'pirate',
      deckName: g.deck ?? 'Rocks',
      turns: 9,
      endedAt: NOW - g.age * DAY,
      tags: g.tags ?? [],
      versions: { engine: 'x', cards: 'x', scripts: 'x' },
    },
  };
  const mode = g.review ?? 'complete';
  if (mode === 'none') return { summary };
  const results: Record<string, TurnResult> = {};
  (g.flags ?? []).forEach((f, n) => {
    const kind = f.kind ?? KIND_OF[f.concept] ?? 'target';
    const fid = `${kind}:${n + 1}:${n + 10}`;
    const flag: ReviewFlag = {
      id: fid,
      kind,
      turn: n + 1,
      player: 'p1',
      restoreIndex: 1,
      decisionIndex: n + 10,
      severity: f.severity,
      certainty: 'any-hand',
      explanation: { ...explanation('x'), conceptId: f.concept, lessonId: f.lessonId ?? '' },
      did: [],
    };
    results[fid] = { itemId: fid, turn: n + 1, flags: [flag], notes: [] };
  });
  const review: StoredReview = {
    gameId: id,
    analysisVersion: 1,
    engineVersion: 'x',
    status: mode === 'partial' ? 'partial' : 'complete',
    results,
    markers: [],
    practised: {},
  };
  return { summary, review };
}

export function inputOf(
  games: GameSpec[],
  extra: Partial<Pick<DeriveInput, 'progress' | 'credit'>> = {},
): DeriveInput {
  const built = games.map((g, i) => gameOf(i, g));
  return {
    games: built.map((b) => b.summary),
    reviews: new Map(built.flatMap((b) => (b.review ? [[b.summary.id, b.review] as const] : []))),
    progress: extra.progress ?? emptyProgress(),
    credit: extra.credit ?? null,
  };
}

const LESSON_OF: Record<DrillId, string> = {
  mulligan: 'L12-mulligan',
  lethal: 'L15-lethal-math',
  counter: 'L10-counter-or-take',
  don: 'L09-don-efficiency',
};

export function session(
  drill: DrillId,
  n: number,
  correct: number,
  at: string,
  extra: Partial<DrillSession> = {},
): DrillSession {
  return {
    id: `${drill}-${at}-${correct}-${extra.archetype ?? ''}-${extra.factor ?? 'u'}`,
    drill,
    lesson: LESSON_OF[drill],
    at,
    n,
    correct,
    shown: 0,
    factor: null,
    itemIds: Array.from({ length: n }, (_, i) => `${drill}-${i}`),
    ...extra,
  };
}

export const progressOf = (
  sessions: DrillSession[],
  lessons: ProgressV1['lessons'] = {},
): ProgressV1 => ({ v: 1, lessons, sessions });

/** A tutorial credit for L01 to L07 at a given time. */
export const credit = (t: number) => ({
  lessons: ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07'],
  at: iso(t),
});
