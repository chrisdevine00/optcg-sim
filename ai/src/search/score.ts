/**
 * The determinized half of blunder scoring (M7 WP2, coach/blunder.ts). Full-state engine calls live
 * only here, in `search/`: every guess is drawn from the seat's own view, its own list and the
 * opponent's archetype prior (sample.ts), with a seed from the view's public fingerprint, so the
 * same position gives the same answer and no hidden card is read.
 *
 * - `valueActions`: each legal action played in k guessed states and rolled out to the start of the
 *   next turn (as the planners do), averaged; own-turn effect choices also report the DON!! ledger
 *   the choice leaves, which the ledger's held rule turns into a value.
 * - `givesUpLethal`: which actions leave every proven lethal line (no lethal proven after them).
 */
import type { Card } from '@optcg/cards';
import {
  projectForSearch,
  queries,
  type Action,
  type PlayerId,
  type SearchView,
} from '@optcg/engine';
import { donLedger, type DonLedger } from '../coach/tempo.ts';
import { actionKey } from '../coach/types.ts';
import { WEIGHTS, type Breakdown } from './heuristic.ts';
import { lethal } from './lethal/lethal.ts';
import type { Cap } from './lethal/search.ts';
import {
  fingerprint,
  fromView,
  play,
  simContext,
  type Budget,
  type PirateSetup,
} from './pirate.ts';
import { determinizations } from './sample.ts';
import { rolloutValue } from './sim.ts';

/** A 32-bit seed from the view's public fingerprint: the same position gives the same table. */
export function seedOf(view: SearchView): number {
  const s = fingerprint(view);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

const ZERO: Breakdown = {
  life: 0,
  hand: 0,
  counter: 0,
  board: 0,
  don: 0,
  threat: 0,
  deck: 0,
  result: 0,
};

/** One action's value over the guessed states, and what it left of the DON!! ledger. */
export interface ValuedAction {
  mean: number;
  breakdown: Breakdown;
  /** The seat's ledger right after the choice, in the first guess (own-turn effect choices only). */
  ledger: DonLedger | null;
}

/**
 * The seat's DON!! ledger in a guessed state, as the seat would see it. Taken right after the choice,
 * before the opponent acts: an effect choice on your own turn changes your active DON!! then, and
 * the ledger is the rule that says what those DON!! can do on their turn.
 */
function ledgerOf(
  state: Parameters<typeof projectForSearch>[0],
  me: PlayerId,
  cards: ReadonlyMap<string, Card>,
): DonLedger | null {
  try {
    return donLedger(projectForSearch(state, me), cards);
  } catch {
    return null;
  }
}

/** What DON!! held for an opponent-turn effect are worth, in heuristic units (a Counter's rate). */
export function heldValue(l: DonLedger | null): number {
  if (!l) return 0;
  let v = 0;
  for (const r of l.held.reasons)
    if (r.kind === 'opponent-turn-effect')
      v += (Math.min(r.n, l.held.n) * (r.perDon ?? 1000) * WEIGHTS.counterPer1000) / 1000;
  return v;
}

export interface ValueResult {
  /** By `actionKey`; an action no guess could apply is absent. */
  valued: Map<string, ValuedAction>;
  /** The budget ended before every guess was played, or the position could not be guessed. */
  incomplete: boolean;
}

/**
 * Value `options` in k guesses. Round by round: a round the budget cuts short is dropped, so every
 * action is judged on the same guesses (as `pirate.ts`); the first round always runs in full.
 */
export function valueActions(
  view: SearchView,
  options: readonly Action[],
  setup: PirateSetup,
  budget: Budget,
  withLedger: boolean,
): ValueResult {
  const valued = new Map<string, ValuedAction>();
  let states: ReturnType<typeof determinizations>;
  try {
    states = determinizations(view, setup, setup.k, seedOf(view));
  } catch {
    return { valued, incomplete: true };
  }
  const me = view.player;
  const sim = simContext(view, setup);
  const sums = options.map(() => 0);
  const ns = options.map(() => 0);
  const bd = options.map(() => ({ ...ZERO }));
  const ledgers: (DonLedger | null)[] = options.map(() => null);
  const startTurn = view.turn.number;
  const t0 = setup.now();
  const startRollouts = sim.stats.rollouts;
  const left = (): boolean =>
    'iterations' in budget
      ? sim.stats.rollouts - startRollouts < budget.iterations
      : setup.now() - t0 < budget.ms;
  const main = view.decision?.kind === 'main';
  let incomplete = false;
  for (const [si, s] of states.entries()) {
    const round: ({ value: number; breakdown: Breakdown; ledger: DonLedger | null } | null)[] = [];
    let complete = true;
    for (const [oi, opt] of options.entries()) {
      if (si > 0 && !left()) {
        complete = false;
        break;
      }
      const after = safePlay(s, fromView(opt, view.skeleton.handles), me, sim, main);
      if (!after) {
        round[oi] = null;
        continue;
      }
      const ledger = withLedger ? ledgerOf(after, me, setup.cards) : null;
      const r = rolloutValue(after, startTurn, sim);
      round[oi] = { value: r.value + heldValue(ledger), breakdown: r.breakdown, ledger };
    }
    if (!complete) {
      incomplete = true;
      break;
    }
    for (const [oi, r] of round.entries()) {
      if (!r) continue;
      sums[oi]! += r.value;
      ns[oi]!++;
      for (const k of Object.keys(ZERO) as (keyof Breakdown)[]) bd[oi]![k] += r.breakdown[k];
      if (si === 0) ledgers[oi] = r.ledger;
    }
  }
  for (const [oi, opt] of options.entries()) {
    const n = ns[oi]!;
    if (n === 0) continue;
    const b = { ...ZERO };
    for (const k of Object.keys(ZERO) as (keyof Breakdown)[]) b[k] = bd[oi]![k] / n;
    valued.set(actionKey(opt), { mean: sums[oi]! / n, breakdown: b, ledger: ledgers[oi]! });
  }
  return { valued, incomplete };
}

function safePlay(
  s: Parameters<typeof play>[0],
  a: Action,
  me: PlayerId,
  sim: ReturnType<typeof simContext>,
  main: boolean,
): ReturnType<typeof play> {
  try {
    return play(s, { actions: [a] }, me, sim, main);
  } catch {
    return null;
  }
}

/**
 * Of `candidates` (Main-phase actions off the proven line), the keys of those after which no lethal
 * is proven any more: applied in one guessed state, follow-ups settled by the quick policies, then
 * the public lethal check from the view the seat would then have. "Unknown" (a cap) is not a give-up:
 * a search limit never makes a warning. At most `max` are checked.
 */
export function givesUpLethal(
  view: SearchView,
  candidates: readonly Action[],
  setup: PirateSetup,
  cards: ReadonlyMap<string, Card>,
  cap: Cap,
  max: number,
): Set<string> {
  const out = new Set<string>();
  let state: ReturnType<typeof determinizations>[number];
  try {
    state = determinizations(view, setup, 1, seedOf(view))[0]!;
  } catch {
    return out;
  }
  const me = view.player;
  const sim = simContext(view, setup);
  for (const opt of candidates.slice(0, max)) {
    const after = safePlay(state, fromView(opt, view.skeleton.handles), me, sim, true);
    if (!after || queries.result(after)) continue;
    const d = queries.decision(after);
    if (
      !d ||
      d.player !== me ||
      d.kind !== 'main' ||
      queries.turn(after).number !== view.turn.number
    ) {
      out.add(actionKey(opt)); // the turn passed or moved on: nothing left to win with
      continue;
    }
    try {
      const r = lethal({ mode: 'public', view: projectForSearch(after, me) }, cards, cap);
      if (r.status === 'refuted') out.add(actionKey(opt));
    } catch {
      // The check is an aid: a position it cannot analyse is "unknown", never a flag.
    }
  }
  return out;
}
