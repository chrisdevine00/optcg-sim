/**
 * Blunder scoring (M7 WP2, learning-ui §2.8). `scoreDecision(view, ctx)` values every legal action
 * of the asking seat and says which ones are clear mistakes, and why:
 *
 * - `missed-lethal`: a public lethal is proven (any hand the deck could hold loses to it) and the
 *   action is `endTurn`, or leaves every proven line (after it no lethal is proven any more).
 * - `unused-don`: `endTurn` with at least `UNUSED_FLAG_AT` DON!! that nothing spends on their turn
 *   (`donLedger`'s rule, tempo.ts), and an attacker could still use them now.
 * - `gap`: in an effect choice on your own turn, the action's value is at least `GAP_THRESHOLD`
 *   below the best action's (heuristic units, about one card each).
 *
 * Reads only the asking seat's `SearchView`, public card data, the seat's own list and the
 * opponent's archetype prior: what the warning list says is a function of the view and the pressed
 * action, never of a card the seat cannot see. (Values average over guessed hands, drawn from the
 * prior with a seed taken from the view's public fingerprint, so asking twice gives the same table.
 * The guessing is in `search/score.ts`, the only place full-state engine calls are allowed.)
 */
import type { Card } from '@optcg/cards';
import type { Action, SearchView } from '@optcg/engine';
import type { Explanation } from '../explanation.ts';
import { averageCounter, priorFor } from '../knowledge.ts';
import type { AiRequest, AiResponse } from '../protocol.ts';
import { playbookFor } from '../playbook.ts';
import { explainLethal } from '../search/lethal/explain.ts';
import { lethal, type LethalResult } from '../search/lethal/lethal.ts';
import type { Cap } from '../search/lethal/search.ts';
import type { Budget, PirateSetup } from '../search/pirate.ts';
import { givesUpLethal, seedOf, valueActions, type ValuedAction } from '../search/score.ts';
import { explainGap } from './explain-blunder.ts';
import { attackersAvailable, donLedger, explainUnused, UNUSED_FLAG_AT } from './tempo.ts';
import { actionKey, type BlunderWarning, type ScoreTable } from './types.ts';

export { seedOf };

/**
 * The value gap, in heuristic units (about one card each), from which an effect choice is flagged.
 * Tuned on a corpus of Warlord's own choices (ai/test/blunder-corpus.test.ts): it flags well under
 * 1% of them, and an E17 choice (DON!! set active past a Leader's limit) is above it.
 */
export const GAP_THRESHOLD = 2;

/** Decision kinds that are effect choices on which a value gap is judged. */
const GAP_KINDS: readonly string[] = ['choose', 'optional', 'trigger'];

export interface ScoreContext {
  /** Public card data for every card in the game. */
  cards: ReadonlyMap<string, Card>;
  /**
   * The seat's own list and both Leaders. Without it the checks that need guessed hands (values,
   * the "leaves every proven line" check) are skipped: only the plain rules run.
   */
  game?: { ownDeck: readonly string[]; leader: string; opponentLeader: string };
  /** The search budget for values: `ms` in the app, `iterations` in tests. */
  budget: Budget;
  /** The clock for `ms` budgets (the worker passes `performance.now`). */
  now?: () => number;
  /** Guessed states (default 4). */
  k?: number;
  /** The lethal check's cap (default 150 ms; tests give `nodes`). */
  lethalCap?: Cap;
  /** Most lethal re-checks for actions off the proven line (default 12). */
  maxLineChecks?: number;
}

function setupFor(ctx: ScoreContext): PirateSetup | null {
  if (!ctx.game) return null;
  const { ownDeck, leader, opponentLeader } = ctx.game;
  return {
    ownDeck,
    cards: ctx.cards,
    playbook: playbookFor(leader, [...ownDeck], ctx.cards),
    prior: priorFor(opponentLeader),
    oppAvgCounter: averageCounter(opponentLeader, ctx.cards),
    k: ctx.k ?? 4,
    now: ctx.now ?? (() => performance.now()),
  };
}

const emptyTable = (): ScoreTable => ({
  best: '',
  values: {},
  kinds: {},
  warnings: {},
  certainty: 'any-hand',
  incomplete: false,
});

/** The public lethal check, or null when it cannot run. */
function provenLethal(view: SearchView, ctx: ScoreContext): LethalResult | null {
  try {
    const r = lethal({ mode: 'public', view }, ctx.cards, ctx.lethalCap ?? { ms: 150 });
    return r.status === 'proven' && r.viewActions && r.viewActions.length > 0 ? r : null;
  } catch {
    return null;
  }
}

/**
 * Every legal action valued, and the clear mistakes among them. Never throws on a position it
 * cannot search: those checks are then skipped and `incomplete` says so.
 */
export function scoreDecision(view: SearchView, ctx: ScoreContext): ScoreTable {
  const me = view.player;
  const options = view.actions.filter((a) => a.type !== 'concede');
  const table = emptyTable();
  if (options.length === 0 || view.decision?.player !== me) return table;
  const kind = view.decision.kind;
  const ownTurn = view.turn.activePlayer === me;
  const setup = setupFor(ctx);

  // ---- Values ----------------------------------------------------------------------------------
  const values = setup
    ? valueActions(view, options, setup, ctx.budget, GAP_KINDS.includes(kind) && ownTurn)
    : null;
  const valued: Map<string, ValuedAction> = values?.valued ?? new Map();
  const incomplete = values === null || values.incomplete;
  for (const [k, v] of valued) table.values[k] = v.mean;
  let bestKey = actionKey(options[0]!);
  let bestVal = -Infinity;
  for (const opt of options) {
    const v = valued.get(actionKey(opt));
    if (v && v.mean > bestVal) {
      bestVal = v.mean;
      bestKey = actionKey(opt);
    }
  }
  table.best = bestKey;
  table.incomplete = incomplete;
  table.certainty = incomplete ? 'search-incomplete' : 'needed-hidden-info';
  const optionOf = new Map(options.map((o) => [actionKey(o), o] as const));
  const flag = (key: string, w: BlunderWarning) => {
    (table.kinds[key] ??= []).push(w.kind);
    (table.warnings![key] ??= []).push(w);
  };

  // ---- Main phase: missed lethal and unused DON!! ------------------------------------------------
  if (kind === 'main' && ownTurn) {
    const end = options.find((o) => o.type === 'endTurn');
    const proven = provenLethal(view, ctx);
    if (proven) {
      const first = proven.viewActions![0]!;
      const line = new Set(proven.viewActions!.map(actionKey));
      const explanation = lethalWarning(proven, ctx.cards);
      const off = options.filter((o) => o !== end && !line.has(actionKey(o)));
      const gives = setup
        ? givesUpLethal(
            view,
            off,
            setup,
            ctx.cards,
            ctx.lethalCap ?? { ms: 150 },
            ctx.maxLineChecks ?? 12,
          )
        : new Set<string>();
      for (const opt of options) {
        const key = actionKey(opt);
        if ((opt === end && !line.has(key)) || gives.has(key))
          flag(key, { kind: 'missed-lethal', explanation, better: first });
      }
    }
    // Unused DON!!: only when an attacker could still use them (an attack and a give are legal).
    if (end) {
      const ledger = donLedger(view, ctx.cards);
      const canUse =
        ledger.unused >= UNUSED_FLAG_AT &&
        view.actions.some((a) => a.type === 'giveDon') &&
        attackersAvailable(view).length > 0;
      const explanation = canUse ? explainUnused(view, ledger, ctx.cards, 'ending') : null;
      if (explanation)
        flag(actionKey(end), {
          kind: 'unused-don',
          explanation,
          better: view.actions.find((a) => a.type === 'giveDon') ?? null,
        });
    }
  }

  // ---- Effect choices: a value gap -----------------------------------------------------------------
  if (GAP_KINDS.includes(kind) && ownTurn && valued.size > 1 && !incomplete) {
    const best = valued.get(bestKey)!;
    const better = optionOf.get(bestKey)!;
    for (const [key, v] of valued) {
      if (best.mean - v.mean < GAP_THRESHOLD) continue;
      flag(key, {
        kind: 'gap',
        explanation: explainGap({
          view,
          cards: ctx.cards,
          action: optionOf.get(key)!,
          better,
          value: v.mean,
          bestValue: best.mean,
          breakdown: v.breakdown,
          bestBreakdown: best.breakdown,
          ledger: v.ledger,
          bestLedger: best.ledger,
        }),
        better,
      });
    }
  }
  return table;
}

function lethalWarning(proven: LethalResult, cards: ReadonlyMap<string, Card>): Explanation {
  const e = explainLethal(proven, cards, 'coach');
  return {
    ...e,
    claim: 'You have lethal this turn, and this move gives it up.',
    nextTime:
      'Before you end your turn or make a side play, check whether your attackers already win. Send your hardest-to-stop attack last.',
  };
}

/** The warnings on one action, the app's lookup at the press. */
export function warningsOf(table: ScoreTable, action: Action): BlunderWarning[] {
  return table.warnings?.[actionKey(action)] ?? [];
}

/** What `score` needs from the worker's game (the seat's own list and both Leaders). */
type ScoreGame = NonNullable<ScoreContext['game']>;

/** The worker's answer to a `score` request (ARCHITECTURE §4.1): the table, timed. */
export function answerScore(
  req: Extract<AiRequest, { type: 'score' }>,
  cards: ReadonlyMap<string, Card>,
  game: ScoreGame | null,
  now: () => number = () => performance.now(),
): Extract<AiResponse, { type: 'score' }> {
  const t0 = now();
  const result = scoreDecision(req.view, {
    cards,
    ...(game ? { game } : {}),
    budget: { ms: req.budgetMs },
    now,
  });
  return { type: 'score', id: req.id, result, ms: now() - t0 };
}
