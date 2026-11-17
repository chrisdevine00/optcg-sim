/**
 * Warlord and Emperor (ADR 0008): information-set MCTS over turn plans (`mcts.ts`).
 *
 * - **Main Phase.** The plan is searched once, at the start of the Main Phase (`planTurn`; the
 *   worker does it while the board animates), after the lethal check (`lethal`, public mode:
 *   proven means every hidden hand loses, so the line is played with no search). Each later Main
 *   decision follows the tree; the search runs again only when the plan breaks, that is when some
 *   determinizations no longer match what the AI sees (a Counter, a Trigger, a Block, a reveal).
 *   The tree is reused: the matching determinizations keep their statistics and the search goes on
 *   from the node the AI is at (`Mcts.consistent`, `Mcts.reroot`).
 * - **Everything else** (Block, Counter, Trigger, effect choices on either turn) is a flat search
 *   over the legal answers (or the whole defences, as in `pirate.ts`) with a short budget.
 * - **Forced moves, mulligan and who goes first** cost nothing and read as every other decision.
 * - **Emperor** is the same player with a larger budget and iterative deepening (`DEEPENING`).
 *
 * Nothing here reads a hidden card: the only inputs are the AI's own `SearchView`, public card
 * data, its own list and the archetype prior (`sample.ts`).
 */
import { CannotDeterminize, legalActions, queries } from '@optcg/engine';
import type { Action, GameState, PlayerId, ProjectedView, SearchView } from '@optcg/engine';
import { lethal } from './lethal/lethal.ts';
import { evaluate, total } from './heuristic.ts';
import { Mcts, rolloutUntil, type TreeNode } from './mcts.ts';
import {
  counterCandidates,
  decide as pirateDecide,
  explainViewAction,
  handCounter,
  lethalOnMe,
  otherBias,
  play,
  same,
  simContext,
  toView,
  whyContext,
  type Budget,
  type Candidate,
  type PirateDecision,
  type PirateMemory,
  type PirateSetup,
} from './pirate.ts';
import { determinizations } from './sample.ts';
import { explainAction } from './why.ts';
import { battleNumbers } from './sim.ts';

export { CannotDeterminize };

export interface WarlordBudgets {
  /** The plan at the start of a turn. */
  turn: Budget;
  /** Any other decision. */
  defence: Budget;
  /** A re-search when the plan breaks (default: 25% of `turn`). */
  replan?: Budget;
  /** The lethal check at the start of a plan: nodes (CI) or milliseconds (app). */
  lethal?: { nodes: number } | { ms: number };
}

export interface WarlordSetup extends PirateSetup {
  /** Emperor: iterative deepening. */
  deepening?: boolean;
  /** Leaf look-ahead: 1 = the position the opponent faces, 2 = after the opponent's turn. */
  horizon?: 1 | 2;
  /** Rollouts play Characters (see `SimContext.quickPlays`). */
  quickPlays?: boolean;
}

export interface WarlordMemory {
  tree: Mcts | null;
  turn: number;
  cursor: TreeNode | null;
  /** The view handles the tree's canonical ids map to (the view it was built from). */
  handles: Record<string, string>;
  /** Rest of a macro move, or of a proven lethal line, in view handles. */
  queue: Action[];
  /** The rest of a whole defence chosen for the battle `key` (as `PirateMemory`). */
  defence: PirateMemory['defence'];
  /** Re-searches this turn (reported by tests). */
  replans: number;
}

export function newMemory(): WarlordMemory {
  return { tree: null, turn: -1, cursor: null, handles: {}, queue: [], defence: null, replans: 0 };
}

export interface WarlordDecision extends PirateDecision {
  /** What the search kept in reserve: other first moves, best first (never posted from the worker). */
  alternatives: Action[];
}

const NONE = { rollouts: 0, actions: 0, planned: false };

function scaled(b: Budget, f: number): Budget {
  return 'iterations' in b
    ? { iterations: Math.max(1, Math.round(b.iterations * f)) }
    : { ms: b.ms * f };
}

const replanBudget = (b: WarlordBudgets): Budget => b.replan ?? scaled(b.turn, 0.25);

// ------------------------------------------------------------------------------------------------
// Lethal first
// ------------------------------------------------------------------------------------------------

/** A proven line (every hidden hand loses) as view actions, or null. */
function provenLine(view: SearchView, setup: WarlordSetup, b: WarlordBudgets): Action[] | null {
  const cap = b.lethal ?? ('iterations' in b.turn ? { nodes: 6000 } : { ms: 150 });
  let r: ReturnType<typeof lethal>;
  try {
    r = lethal({ mode: 'public', view }, setup.cards, cap);
  } catch {
    // The check is an aid: a position it cannot analyse is "unknown", never a failed turn.
    return null;
  }
  if (r.status !== 'proven' || !r.viewActions || r.viewActions.length === 0) return null;
  return r.viewActions;
}

// ------------------------------------------------------------------------------------------------
// The turn tree
// ------------------------------------------------------------------------------------------------

function ctxFor(view: SearchView, setup: WarlordSetup) {
  return { ...simContext(view, setup), ...(setup.quickPlays ? { quickPlays: true } : {}) };
}

function newTree(view: SearchView, setup: WarlordSetup, seed: number, mem: WarlordMemory): Mcts {
  const dets = determinizations(view, setup, setup.k, seed);
  const tree = new Mcts({
    me: view.player,
    ctx: ctxFor(view, setup),
    setup,
    dets,
    horizon: setup.horizon ?? 2,
    deepening: setup.deepening ?? false,
  });
  mem.tree = tree;
  mem.turn = view.turn.number;
  mem.cursor = tree.root;
  mem.handles = view.skeleton.handles;
  mem.queue = [];
  return tree;
}

/**
 * Plan the turn ahead of its first decision (the worker calls this while animations play).
 * Returns the rollouts spent and whether a lethal line was found.
 */
export function planTurn(
  view: SearchView,
  setup: WarlordSetup,
  budgets: WarlordBudgets,
  seed: number,
  mem: WarlordMemory,
): { rollouts: number; lethal: boolean } {
  mem.replans = 0;
  const line = provenLine(view, setup, budgets);
  if (line) {
    mem.tree = null;
    mem.queue = line;
    mem.turn = view.turn.number;
    return { rollouts: 0, lethal: true };
  }
  const tree = newTree(view, setup, seed, mem);
  tree.search(budgets.turn);
  return { rollouts: tree.iterations, lethal: false };
}

function mainDecision(
  view: SearchView,
  options: Action[],
  mem: WarlordMemory,
  setup: WarlordSetup,
  budgets: WarlordBudgets,
  seed: number,
): WarlordDecision {
  // The first Main decision of a turn with no plan made ahead (a game with no worker doing it
  // while the board animates) gets the whole turn budget; later searches are re-searches.
  const planned = mem.turn === view.turn.number;
  const budgetNow = planned ? replanBudget(budgets) : budgets.turn;
  let tree = mem.tree && planned ? mem.tree : null;
  let searched = 0;
  if (tree && mem.cursor) {
    const keep = tree.consistent(mem.cursor, view);
    if (keep.length === 0) tree = null;
    else {
      const broke = keep.length < tree.active.length;
      tree.reroot(mem.cursor, keep);
      if (broke || tree.ranked(mem.cursor).length === 0) {
        // The plan broke: check lethal again, then keep searching from here.
        const line = provenLine(view, setup, budgets);
        if (line) {
          mem.tree = null;
          mem.queue = line;
          const d = takeQueue(view, options, mem, setup, seed);
          if (d) return d;
        }
        mem.replans++;
        const before = tree.iterations;
        tree.search(budgetNow);
        searched = tree.iterations - before;
      }
    }
  }
  if (!tree) {
    const line = provenLine(view, setup, budgets);
    if (line) {
      mem.tree = null;
      mem.queue = line;
      mem.turn = view.turn.number;
      const d = takeQueue(view, options, mem, setup, seed);
      if (d) return d;
    }
    tree = newTree(view, setup, seed, mem);
    mem.replans++;
    tree.search(budgetNow);
    searched = tree.iterations;
  }
  const cursor = mem.cursor!;
  const ranked = tree.ranked(cursor);
  const state = firstState(tree, cursor);
  for (const r of ranked) {
    const acts = r.kid.cand!.actions;
    const first = toView(acts[0]!, mem.handles);
    if (!first || !options.some((o) => same(o, first))) continue;
    const rest: Action[] = [];
    for (const a of acts.slice(1)) {
      const v = toView(a, mem.handles);
      if (!v) break;
      rest.push(v);
    }
    const explanation =
      state && queries.decision(state)
        ? explainAction(state, acts[0]!, view.player, whyContext(view, setup))
        : explainViewAction(view, first, setup, seed);
    mem.cursor = r.kid;
    mem.queue = rest;
    const alternatives: Action[] = [];
    for (const o of ranked.slice(0, 5)) {
      if (o === r) continue;
      const v = toView(o.kid.cand!.actions[0]!, mem.handles);
      if (v && !alternatives.some((x) => same(x, v))) alternatives.push(v);
    }
    return {
      action: first,
      explanation,
      alternatives,
      stats: {
        rollouts: searched,
        actions: tree.ctx.stats.actions,
        planned: searched === 0,
        value: r.raw,
      },
    };
  }
  // Nothing in the tree is legal here (never seen): end the turn like any forced move.
  mem.tree = null;
  const end = options.find((a) => a.type === 'endTurn') ?? options[0]!;
  return {
    action: end,
    explanation: explainViewAction(view, end, setup, seed),
    alternatives: [],
    stats: { ...NONE, rollouts: searched },
  };
}

function firstState(tree: Mcts, nd: TreeNode): GameState | null {
  for (const d of tree.active) {
    const s = tree.stateOf(nd, d);
    if (s) return s;
  }
  return null;
}

/** The next queued action, if it is legal now (else the queue is dropped). */
function takeQueue(
  view: SearchView,
  options: Action[],
  mem: WarlordMemory,
  setup: WarlordSetup,
  seed: number,
): WarlordDecision | null {
  const head = mem.queue[0];
  if (!head) return null;
  if (!options.some((o) => same(o, head))) {
    mem.queue = [];
    return null;
  }
  mem.queue.shift();
  return {
    action: options.find((o) => same(o, head))!,
    explanation: explainViewAction(view, head, setup, seed),
    alternatives: [],
    stats: { ...NONE, planned: true },
  };
}

// ------------------------------------------------------------------------------------------------
// Everything else: a flat search over the legal answers
// ------------------------------------------------------------------------------------------------

interface FlatResult {
  c: Candidate;
  n: number;
  raw: number;
}

/**
 * UCB over `cands`, one determinization per iteration (round-robin), each scored by playing the
 * answer and the quick policies to the start of the next turn. The playbook's bias joins each
 * score. Returns the answers by visits.
 */
function flat(
  states: GameState[],
  cands: Candidate[],
  me: PlayerId,
  setup: WarlordSetup,
  budget: Budget,
  bias: (c: Candidate) => number,
  ctx: ReturnType<typeof simContext>,
): { ranked: FlatResult[]; iterations: number } {
  const n = cands.map(() => 0);
  const sum = cands.map(() => 0);
  const raw = cands.map(() => 0);
  const dead = cands.map(() => states.map(() => false));
  const biases = cands.map(bias);
  const fromTurn = queries.turn(states[0]!).number;
  const start = setup.now();
  let it = 0;
  const limit = 'iterations' in budget ? budget.iterations : budget.ms;
  const used = () => ('iterations' in budget ? it : setup.now() - start);
  // At least one full pass over the answers in the first determinization, so none goes unscored.
  while (used() < limit || it < cands.length) {
    const d = it % states.length;
    let pick = -1;
    let best = -Infinity;
    const total = it + 1;
    for (const [i] of cands.entries()) {
      if (dead[i]!.every(Boolean)) continue;
      if (dead[i]![d]) continue;
      if (n[i] === 0) {
        pick = i;
        break;
      }
      const u = sum[i]! / n[i]! + 0.25 * Math.sqrt(Math.log(total) / n[i]!);
      if (u > best) {
        best = u;
        pick = i;
      }
    }
    if (pick < 0) {
      it++;
      if (it > 4 * limit + 100) break;
      continue;
    }
    it++;
    const after = play(states[d]!, cands[pick]!, me, ctx, false);
    if (!after) {
      dead[pick]![d] = true;
      continue;
    }
    ctx.stats.rollouts++;
    const end = rolloutUntil(after, fromTurn + 1, ctx);
    const v = total_(end, ctx) + biases[pick]!;
    n[pick]!++;
    sum[pick]! += Math.tanh(v / 12);
    raw[pick]! += v;
  }
  const ranked = cands
    .map((c, i) => ({
      c,
      n: n[i]!,
      raw: n[i] ? raw[i]! / n[i]! : -Infinity,
      m: n[i] ? sum[i]! / n[i]! : -2,
    }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || b.m - a.m)
    .map(({ c, n: k, raw: r }) => ({ c, n: k, raw: r }));
  return { ranked, iterations: it };
}

const total_ = (s: GameState, ctx: ReturnType<typeof simContext>) =>
  total(evaluate(s, ctx.evalCtx));

function otherDecision(
  view: SearchView,
  options: Action[],
  mem: WarlordMemory,
  setup: WarlordSetup,
  budgets: WarlordBudgets,
  seed: number,
): WarlordDecision {
  const kind = view.decision?.kind;
  const battle = (view as ProjectedView).battle;
  const key = battle ? `${view.turn.number}|${battle.attacker}|${battle.target}` : '';
  if (mem.defence && mem.defence.key !== key) mem.defence = null;
  if (kind === 'counter' && mem.defence && mem.defence.actions.length > 0) {
    const a = mem.defence.actions[0]!;
    if (options.some((o) => same(o, a))) {
      mem.defence.actions.shift();
      return {
        action: a,
        explanation: explainViewAction(view, a, setup, seed),
        alternatives: [],
        stats: { ...NONE, planned: true },
      };
    }
    mem.defence = null;
  }
  const me = view.player;
  const ctx = ctxFor(view, setup);
  const states = determinizations(view, setup, setup.k, seed);
  const root = states[0]!;
  let cands: Candidate[] =
    kind === 'counter'
      ? counterCandidates(root, me, setup)
      : legalActions(root)
          .filter((a) => a.type !== 'concede')
          .map((a) => ({ actions: [a] }));
  // Lethal is always defended where a defence exists (DECISIONS M5a "Defence"; as Pirate).
  if (lethalOnMe(root, me)) {
    if (kind === 'counter') {
      const covers = cands.filter(
        (c) =>
          c.actions.length > 0 &&
          c.actions.every(
            (x) => x.type === 'counter' || (x.type === 'activate' && x.ability === 'counter'),
          ),
      );
      if (covers.length > 0) cands = covers;
    }
    if (kind === 'block') {
      const blocks = cands.filter(
        (c) =>
          c.actions[0]!.type === 'block' &&
          (c.actions[0] as { blocker: string | null }).blocker !== null,
      );
      const n = battleNumbers(root)!;
      if (blocks.length > 0 && handCounter(root, me, setup) < n.need) cands = blocks;
    }
  }
  const { ranked, iterations } = flat(
    states,
    cands,
    me,
    setup,
    budgets.defence,
    otherBias(root, me, setup),
    ctx,
  );
  const chosen = ranked[0]?.c ?? cands[0]!;
  const first = chosen.actions[0]!;
  const action = toView(first, view.skeleton.handles) ?? options[0]!;
  const explanation = explainAction(root, first, me, whyContext(view, setup));
  if (kind === 'counter' && chosen.actions.length > 1) {
    const rest = chosen.actions.slice(1).map((a) => toView(a, view.skeleton.handles));
    if (rest.every((x) => x !== null)) mem.defence = { key, actions: rest as Action[] };
  }
  const alternatives: Action[] = [];
  for (const r of ranked.slice(1, 5)) {
    const v = toView(r.c.actions[0]!, view.skeleton.handles);
    if (v && !same(v, action) && !alternatives.some((x) => same(x, v))) alternatives.push(v);
  }
  return {
    action,
    explanation,
    alternatives,
    stats: {
      rollouts: iterations,
      actions: ctx.stats.actions,
      planned: false,
      value: ranked[0]?.raw ?? 0,
    },
  };
}

// ------------------------------------------------------------------------------------------------
// Entry point
// ------------------------------------------------------------------------------------------------

/** One decision for Warlord or Emperor (ARCHITECTURE §4.1 `decide`). */
export function decide(
  view: SearchView,
  mem: WarlordMemory,
  setup: WarlordSetup,
  budgets: WarlordBudgets,
  seed: number,
): WarlordDecision {
  const kind = view.decision?.kind;
  const options = view.actions.filter((a) => a.type !== 'concede');
  if (options.length === 0) throw new Error('Warlord was asked to decide with no legal action.');
  // The rest of a macro move or a proven line comes first, even when it is the only legal move.
  const queued = takeQueue(view, options, mem, setup, seed);
  if (queued) return queued;
  // Mulligan, who goes first, forced moves and the searchless baseline: one rule for every tier.
  if (kind === 'mulligan' || kind === 'chooseFirst' || setup.searchless || options.length === 1) {
    const d = pirateDecide(
      view,
      { plan: null, defence: null },
      setup,
      { turn: budgets.turn, defence: budgets.defence },
      seed,
    );
    return { ...d, alternatives: [] };
  }
  if (kind === 'main' && view.decision?.player === view.player)
    return mainDecision(view, options, mem, setup, budgets, seed);
  return otherDecision(view, options, mem, setup, budgets, seed);
}

/** Forget the plan and the battle memory (a rewind). */
export function reset(mem: WarlordMemory): void {
  mem.tree = null;
  mem.cursor = null;
  mem.queue = [];
  mem.defence = null;
  mem.turn = -1;
}
