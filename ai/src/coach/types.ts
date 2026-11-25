/**
 * The coach's contracts (M7 WP0, docs/design/m7-plan.md). Three requests the coach worker answers:
 * `hint` (a line to play now), `score` (every legal action valued, for the blunder warning) and
 * `threat` (does the opponent's board threaten lethal on their turn). WP1 to WP3 fill them in; the
 * shapes are fixed here so the panel, the gate and the worker can be built in parallel.
 *
 * Every request carries only the asking seat's `SearchView` (ADR 0005): nothing hidden crosses.
 */
import type { Action } from '@optcg/engine';
import type { Explanation, Move } from '../explanation.ts';

export type { Explanation, Move };

/** How sure an answer is, in the vocabulary `certaintyLabel` already speaks. */
export type Certainty = Explanation['certainty'];

/** One other line worth a look: a move and the single sentence that says why. */
export interface HintAlternative {
  move: Move;
  /** One sentence, second person. */
  why: string;
}

/** At most this many alternatives sit under a hint. */
export const MAX_ALTERNATIVES = 2;

/**
 * "What should I do?" A line (the rest of the turn from here), the view actions that play its
 * first steps (what "Do step 1" stages), and the explanation in the coach's voice.
 */
export interface HintResult {
  line: Move[];
  /** The engine view actions for the line's first step(s), in order. */
  viewActions: Action[];
  explanation: Explanation;
  /** At most `MAX_ALTERNATIVES`. */
  alternatives: HintAlternative[];
  certainty: Certainty;
  /** The search ended on its budget before it was done. */
  incomplete: boolean;
}

/** Why a score table can flag a move (learning-ui §3.3 "Blunder warning"). */
export const BLUNDER_KINDS = ['missed-lethal', 'unused-don', 'gap'] as const;
export type BlunderKind = (typeof BLUNDER_KINDS)[number];

/**
 * A stable key for one engine action, the index of a `ScoreTable`. Actions are plain JSON, so the
 * key is the JSON with sorted keys: equal actions give equal keys.
 */
export function actionKey(a: Action): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sort)
      : v && typeof v === 'object'
        ? Object.fromEntries(
            Object.entries(v as Record<string, unknown>)
              .sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0))
              .map(([k, x]) => [k, sort(x)]),
          )
        : v;
  return JSON.stringify(sort(a));
}

/**
 * One warning on one action (M7 WP2, additive to the WP0 contract): the kind, the explanation in
 * the coach's voice (explanations.md E06, E17, E20) and the better action, in the view's handles.
 */
export interface BlunderWarning {
  kind: BlunderKind;
  explanation: Explanation;
  /** The action to offer instead ("Use the better choice"), or null when none is better. */
  better: Action | null;
}

/** Every legal action valued from the asking seat's side, and which ones are blunders and why. */
export interface ScoreTable {
  /** `actionKey` of the best-valued action. */
  best: string;
  /** Value by `actionKey`; higher is better for the asking seat. */
  values: Record<string, number>;
  /** By `actionKey`: the blunder kinds that apply to that action (absent or empty: none). */
  kinds: Record<string, BlunderKind[]>;
  /** By `actionKey`: the explanation of each flag. Present for every key in `kinds`. */
  warnings?: Record<string, BlunderWarning[]>;
  certainty: Certainty;
  incomplete: boolean;
}

/** The opponent's-turn threat check (learning-ui §3.1 "Both players"). */
export interface ThreatResult {
  /** `proven`: lethal on their turn whatever you hold; `refuted`: it is not; `unknown`: cap hit. */
  status: 'proven' | 'refuted' | 'unknown';
  /** Their line, when proven. */
  line?: Move[];
  explanation: Explanation;
  certainty: Certainty;
}

/** What the worker answers until a request is built (the WP0 stubs). */
export interface NotImplemented {
  status: 'not-implemented';
}

export const NOT_IMPLEMENTED: NotImplemented = { status: 'not-implemented' };

export const isNotImplemented = (r: unknown): r is NotImplemented =>
  typeof r === 'object' && r !== null && (r as { status?: unknown }).status === 'not-implemented';
