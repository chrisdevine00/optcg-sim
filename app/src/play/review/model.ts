/**
 * The review screen's pure model (M8 WP6): names, shapes and sizes of flags, the timeline's columns,
 * the Life series, the opponent's notable moves, which flags can be practised, and the one-line
 * summaries History and the header use. Nothing here is rules logic: it reads what the detectors
 * (`ai/src/search/review`) already decided and what the record already shows.
 */
import type { Card } from '@optcg/cards';
import {
  certaintyLabel,
  type FlagKind,
  type PracticeJudge,
  type ReviewFlag,
  type ReviewMarker,
  type Severity,
  type TurnResult,
} from '@optcg/ai';
import type { Explanation } from '@optcg/ai';
import type { PlayerId } from '@optcg/engine';
import type { SessionRecord } from '../../session/index.ts';
import type { LogLine } from '../game/text.ts';

const TIER = { rookie: 'Rookie', pirate: 'Pirate', warlord: 'Warlord' } as const;
/** "pirate" as the screens say it. */
export const tierWord = (t: string): string => TIER[t as keyof typeof TIER] ?? t;

/** Bump when a detector changes what it reports: older stored reviews are re-run. */
export const ANALYSIS_VERSION = 1;

// ---------------------------------------------------------------------------------------------
// Flags: words, shapes, sizes, order
// ---------------------------------------------------------------------------------------------

export const KIND_WORD: Record<FlagKind, string> = {
  'missed-lethal': 'Missed lethal',
  'given-away': 'Lethal given away',
  'don-unused': 'DON!! left unused',
  'counter-wasted': 'Counter wasted',
  'should-counter': 'Hit that should have been countered',
  target: 'Poor attack ordering',
  mulligan: 'Mulligan',
};

/** The shape of each kind on the timeline (learning-ui §4.2); drawn in `FlagShape`. */
export type Shape =
  | 'diamond'
  | 'diamond-slash'
  | 'triangle'
  | 'triangle-hollow'
  | 'square-hollow'
  | 'circle-hollow'
  | 'bar';

export const KIND_SHAPE: Record<FlagKind, Shape> = {
  'missed-lethal': 'diamond',
  'given-away': 'diamond-slash',
  'should-counter': 'triangle',
  'counter-wasted': 'triangle-hollow',
  'don-unused': 'square-hollow',
  target: 'circle-hollow',
  mulligan: 'bar',
};

export const SHAPE_WORD: Record<Shape, string> = {
  diamond: 'filled diamond',
  'diamond-slash': 'filled diamond with a slash',
  triangle: 'filled triangle',
  'triangle-hollow': 'hollow triangle',
  'square-hollow': 'hollow square',
  'circle-hollow': 'hollow circle',
  bar: 'small bar',
};

/** Glyph sizes in px (learning-ui §4.1): severe 20, moderate 16, minor 12; Hindsight has its own style. */
export const SEVERITY: Record<Severity, { word: string; size: number; rank: number }> = {
  severe: { word: 'Severe', size: 20, rank: 0 },
  moderate: { word: 'Moderate', size: 16, rank: 1 },
  minor: { word: 'Minor', size: 12, rank: 2 },
  hindsight: { word: 'Hindsight', size: 14, rank: 3 },
};

/** Severity first (severe to Hindsight), then game order, then the id for a stable tie. */
export function sortFlags(flags: readonly ReviewFlag[]): ReviewFlag[] {
  return [...flags].sort(
    (a, b) =>
      SEVERITY[a.severity].rank - SEVERITY[b.severity].rank ||
      a.turn - b.turn ||
      a.decisionIndex - b.decisionIndex ||
      a.id.localeCompare(b.id),
  );
}

/** The label of a flag's certainty: the guide label for a mulligan, the review label otherwise. */
export const certaintyOf = (f: ReviewFlag, guide?: string): string =>
  certaintyLabel(f.explanation.certainty, contextOf(f), guide);

/** The certainty context everywhere a flag's explanation is shown: a mulligan is the guide's advice. */
export const contextOf = (f: ReviewFlag): 'guide' | 'review' =>
  f.kind === 'mulligan' ? 'guide' : 'review';

export interface Actors {
  /** Whose turn `turn` was. */
  playerOf(turn: number): PlayerId | null;
  me: PlayerId;
  /** The opponent's Leader, for "Kaido's turn". */
  oppName: string;
  /** The seat's guide name, for a mulligan flag's "From the Rocks guide (sourced)". */
  guide?: string | undefined;
}

/** "Turn 9, your turn: missed lethal, severe, holds whatever they held." */
export function flagName(f: ReviewFlag, a: Actors): string {
  const sev = SEVERITY[f.severity].word.toLowerCase();
  const tail = `${sev}, ${certaintyOf(f, a.guide).toLowerCase()}.`;
  if (f.kind === 'mulligan') return `Start of the game: mulligan, ${tail}`;
  const whose =
    a.playerOf(f.turn) === a.me || a.playerOf(f.turn) === null
      ? 'your turn'
      : `${a.oppName}’s turn`;
  return `Turn ${f.turn}, ${whose}: ${KIND_WORD[f.kind].toLowerCase()}, ${tail}`;
}

// ---------------------------------------------------------------------------------------------
// Results: what the timeline and lists read
// ---------------------------------------------------------------------------------------------

export interface Collected {
  flags: ReviewFlag[];
  /** Notes by turn: "not flagged" (E07) and "Hindsight check not finished". */
  notes: Map<number, Explanation[]>;
  markers: ReviewMarker[];
}

const markerKey = (m: ReviewMarker) => `${m.turn}|${m.kind ?? ''}|${m.reason}`;

/** Flags of the reviewed seat, notes by turn, and the markers (from results and the run's `done`). */
export function collect(
  results: Iterable<TurnResult>,
  extra: readonly ReviewMarker[],
  me: PlayerId,
): Collected {
  const flags = new Map<string, ReviewFlag>();
  const notes = new Map<number, Explanation[]>();
  const markers = new Map<string, ReviewMarker>();
  for (const r of results) {
    for (const f of r.flags) if (f.player === me) flags.set(f.id, f);
    for (const n of r.notes) {
      const list = notes.get(r.turn) ?? [];
      if (!list.some((x) => x.claim === n.claim)) list.push(n);
      notes.set(r.turn, list);
    }
    if (r.marker) markers.set(markerKey(r.marker), r.marker);
  }
  for (const m of extra) markers.set(markerKey(m), m);
  return { flags: sortFlags([...flags.values()]), notes, markers: [...markers.values()] };
}

/** "3 flags · 1 severe" and its parts; no flags and no markers: "no flags". */
export function summaryText(
  flags: readonly ReviewFlag[],
  markers: readonly ReviewMarker[],
): string {
  const severe = flags.filter((f) => f.severity === 'severe').length;
  const parts = [`${flags.length} ${flags.length === 1 ? 'flag' : 'flags'}`];
  if (severe) parts.push(`${severe} severe`);
  if (markers.length) parts.push(`${markers.length} not fully checked`);
  return parts.join(' · ');
}

/** "1 severe · 3 moderate · 1 hindsight" for History; "No flags" when there are none. */
export function severityCounts(flags: readonly ReviewFlag[]): string {
  if (flags.length === 0) return 'No flags';
  const out: string[] = [];
  for (const s of ['severe', 'moderate', 'minor', 'hindsight'] as Severity[]) {
    const n = flags.filter((f) => f.severity === s).length;
    if (n) out.push(`${n} ${s}`);
  }
  return out.join(' · ');
}

// ---------------------------------------------------------------------------------------------
// The timeline: columns from the record's turn snapshots
// ---------------------------------------------------------------------------------------------

export interface TurnInfo {
  turn: number;
  player: PlayerId;
  /** Actions applied when the turn began (its starting position). */
  startIndex: number;
  /** Cards in each Life area when the turn began. */
  life: Record<PlayerId, number>;
}

/** One entry per game turn, from the per-turn snapshots (no replay: stale records read the same way). */
export function turnsOf(record: SessionRecord): TurnInfo[] {
  const out: TurnInfo[] = [];
  for (const s of record.snapshots) {
    if (s.turn < 1 || out.some((t) => t.turn === s.turn)) continue;
    const v = s.views.p1;
    out.push({
      turn: s.turn,
      player: v.turn.activePlayer,
      startIndex: s.actionIndex,
      life: { p1: v.zones.p1.life.length, p2: v.zones.p2.life.length },
    });
  }
  return out.sort((a, b) => a.turn - b.turn);
}

/** The Life of both players after the record's last action. */
export function finalLife(record: SessionRecord): Record<PlayerId, number> | null {
  const s = record.snapshots.at(-1);
  if (!s) return null;
  return { p1: s.views.p1.zones.p1.life.length, p2: s.views.p2.zones.p2.life.length };
}

export const actorsOf = (
  turns: readonly TurnInfo[],
  me: PlayerId,
  oppName: string,
  guide?: string,
): Actors => ({
  playerOf: (t) => turns.find((x) => x.turn === t)?.player ?? null,
  me,
  oppName,
  guide,
});

/** The position a marker or a turn without a flag is studied at: the turn's start. */
export const turnStartIndex = (turns: readonly TurnInfo[], turn: number): number =>
  turns.find((t) => t.turn === turn)?.startIndex ?? 0;

// ---------------------------------------------------------------------------------------------
// The opponent's notable moves (from the game's own log lines)
// ---------------------------------------------------------------------------------------------

/** Plays costing this much or more count as notable. */
export const BIG_PLAY_COST = 5;

/**
 * K.O.s of your Characters, hits on your Life, plays of cost 5 or more and Leader abilities, per
 * turn, read from the log text the board already shows. Short phrases, at most `max` a turn.
 */
export function notableMoves(
  lines: readonly LogLine[],
  cards: ReadonlyMap<string, Card>,
  me: PlayerId,
  oppLeaderName: string,
  max = 3,
): Map<number, string[]> {
  const bigCost = new Map<string, number>();
  for (const c of cards.values())
    if (c.cost !== null && c.cost >= BIG_PLAY_COST)
      bigCost.set(c.name, Math.max(bigCost.get(c.name) ?? 0, c.cost));
  const out = new Map<number, string[]>();
  let turn = 0;
  for (const l of lines) {
    if (l.kind === 'turn') {
      const m = /^Turn (\d+)/.exec(l.text);
      if (m) turn = Number(m[1]);
      continue;
    }
    if (l.actor === me || l.auto || turn === 0) continue;
    const found: string[] = [];
    for (const m of l.text.matchAll(/K\.O\. · Your ([^·]+?)(?= · |$)/g))
      found.push(`K.O. of your ${m[1]}`);
    const life = /your Life (\d+) → (\d+)/.exec(l.text);
    if (life && Number(life[1]) > Number(life[2]))
      found.push(`Hit your Life, ${life[1]} to ${life[2]}`);
    for (const bit of l.text.split(' · ')) {
      const play = /^Play (.+)$/.exec(bit);
      if (play && bigCost.has(play[1]!))
        found.push(`Played ${play[1]} (cost ${bigCost.get(play[1]!)})`);
      if (oppLeaderName && bit.startsWith(`Their ${oppLeaderName}`) && bit.includes(':'))
        found.push(bit.replace(/^Their /, ''));
    }
    if (found.length === 0) continue;
    const list = out.get(turn) ?? [];
    for (const f of found) if (!list.includes(f)) list.push(f);
    out.set(turn, list);
  }
  for (const [t, list] of out)
    if (list.length > max) out.set(t, [...list.slice(0, max), `and ${list.length - max} more`]);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Study and Practice
// ---------------------------------------------------------------------------------------------

/** A stored review made before the detector set `expect` on a target flag: it cannot be judged. */
export const REANALYSE_COPY = 'Analyse again to practise this.';
export const NO_PRACTICE_COPY = 'This flag has no puzzle to practise.';

export type PracticeAvailability =
  | {
      ok: true;
      judge: PracticeJudge;
      turn: number;
      expect?: { target?: string; unusedMin?: number };
    }
  | { ok: false; reason: string };

/**
 * Which flags can be a puzzle: the ones the detector gave a judge; stale records never. A stored
 * review that lacks `practice` (made before M9 WP7) gets it by kind where the flag alone says
 * enough: a mulligan is the opening hand; DON!! left unused is "spend it" (no bar was stored, so the
 * bar is none left); a target flag needs the better target, which only a new analysis records, so
 * it says so rather than being quietly solved by any attack.
 */
export function practiceOf(
  f: ReviewFlag | null,
  live: boolean,
  staleCopy: string,
): PracticeAvailability {
  if (!f) return { ok: false, reason: 'Choose a flag first.' };
  if (!live) return { ok: false, reason: staleCopy };
  const p = f.practice;
  if (p) {
    if (p.judge === 'target-best' && !p.expect?.target)
      return { ok: false, reason: REANALYSE_COPY };
    return { ok: true, judge: p.judge, turn: p.turn, ...(p.expect ? { expect: p.expect } : {}) };
  }
  if (f.kind === 'mulligan') return { ok: true, judge: 'mulligan', turn: 1 };
  if (f.kind === 'don-unused')
    return { ok: true, judge: 'don-ledger', turn: f.turn, expect: { unusedMin: 0 } };
  if (f.kind === 'target') return { ok: false, reason: REANALYSE_COPY };
  return { ok: false, reason: NO_PRACTICE_COPY };
}

/** What the Practice screen says it is, by judge (spoken once when it opens). */
export const PRACTICE_INTRO: Record<PracticeJudge, (turn: number) => string> = {
  'win-this-turn': (t) =>
    `Practice: turn ${t} as it stood. Nothing is timed. Find the win you missed.`,
  'survive-turn': (t) =>
    `Practice: survive turn ${t}. Nothing is timed. Find the defence that keeps you in the game.`,
  'no-counter-on-attack': () =>
    'Practice: this attack. Nothing is timed. Take the hit, or find out why you should not.',
  'don-ledger': (t) =>
    `Practice: turn ${t}. Nothing is timed. Spend your DON!! so little is left unused.`,
  'target-best': () =>
    'Practice: this attack. Nothing is timed. Choose the target that gets the most from it.',
  mulligan: () => 'Practice: your opening hand. Nothing is timed. Keep it or redraw.',
};

export const PRACTICE_LABEL: Record<PracticeJudge, string> = {
  'win-this-turn': 'Win this turn',
  'survive-turn': 'Survive the turn',
  'no-counter-on-attack': 'Take this attack without a Counter',
  'don-ledger': 'Spend your DON!!',
  'target-best': 'Choose the best target',
  mulligan: 'Keep or redraw',
};

export const practisedWord = (s: 'solved' | 'not-yet' | undefined): string | null =>
  s === 'solved' ? 'Practised: solved' : s === 'not-yet' ? 'Practised: not yet' : null;

/** The cost is in the label: a deeper search of one turn takes about half a minute (M8-2). */
export const DEEPER_LABEL = 'Analyse deeper (about half a minute)';

export interface MarkerCopy {
  lead: string;
  body: string;
  /** The one button, or null when nothing more can help. */
  button: 'deeper' | 'now' | null;
}

/**
 * What a marker says (M8-R9). A `deadline` or `not-run` marker is time: we never got to the turn,
 * and Analyse now settles it. `search-incomplete` is the search: too many possible hands, which a
 * bigger run seldom settles (M8-2 measured three public-lethal markers that stayed open at ten times
 * the nodes), so it never says "ran out of time", offers "Analyse deeper" once, and after that
 * says it did not help.
 */
export function markerCopy(
  reason: 'search-incomplete' | 'deadline' | 'not-run',
  tried: boolean,
): MarkerCopy {
  if (reason !== 'search-incomplete')
    return { lead: 'Not analysed.', body: 'We stopped before checking this turn.', button: 'now' };
  const base = 'We couldn’t settle this turn: too many possible hands to check.';
  return tried
    ? {
        lead: 'Not fully checked.',
        body: `${base} Looking deeper did not settle it either.`,
        button: null,
      }
    : { lead: 'Not fully checked.', body: base, button: 'deeper' };
}
