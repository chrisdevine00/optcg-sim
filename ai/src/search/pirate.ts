/**
 * Pirate (ARCHITECTURE §4.2): a greedy per-turn planner over determinized states.
 *
 * **Main Phase (`planTurn`).** Sample K states consistent with the view (`sample.ts`). At each step
 * list the candidate moves: every play and activation, every attack alone or after giving it 1, 2,
 * 3 or all active DON!!, one DON!! to each target, and ending the turn. Score each candidate in
 * each state: apply it, let the quick policies resolve its follow-ups and play out the rest of the
 * turn (`sim.ts`), and evaluate the position the opponent then faces (`heuristic.ts`). Add the
 * playbook's bias, take the best mean, apply it to every state, and repeat until the turn ends. The
 * plan stops early where the states disagree about what the AI will see next (an attack's result, a
 * draw): from there `decide` plans again with the real outcome (ARCHITECTURE §4.1 "re-search when
 * the plan breaks").
 *
 * **Other decisions** (Block, Counter, Trigger, effect choices, optional effects, on either turn)
 * score each legal answer the same way, to the start of the next turn. A Counter decision
 * compares "take it" with whole defences that stop the attack (never a partial one, so no card is
 * thrown away), and keeps to the chosen defence for the rest of that battle.
 *
 * Budgets are rollouts (iterations) in tests and milliseconds in the app (ARCHITECTURE §4.1).
 */
import { SCRIPTS, type Card } from '@optcg/cards';
import {
  legalActions,
  project,
  queries,
  type Action,
  type GameState,
  type PlayerId,
  type PlayerView,
  type ProjectedView,
  type SearchView,
} from '@optcg/engine';
import type { Explanation } from '../explanation.ts';
import { explainMove } from '../explain.ts';
import { counterValueOf, type Prior } from '../knowledge.ts';
import { ownTurn, type Playbook } from '../playbook.ts';
import { evaluate, total, type Breakdown, type Weights } from './heuristic.ts';
import { determinizations } from './sample.ts';
import { explainAction, type WhyContext } from './why.ts';
import { apply, battleNumbers, quickAction, rolloutValue, settle, type SimContext } from './sim.ts';

export type Budget = { iterations: number } | { ms: number };

export interface PirateSetup {
  ownDeck: readonly string[];
  cards: ReadonlyMap<string, Card>;
  playbook: Playbook | null;
  prior: Prior | null;
  oppAvgCounter: number;
  /** Determinized states per decision. */
  k: number;
  /** Tests and A/B runs only: replace some heuristic weights. */
  weights?: Partial<Weights>;
  /** Tests only: no search at all, the rollout's quick policy decides (a baseline; M5a-10). */
  searchless?: boolean;
  /** Tests only: score moves by the position right after them, with no rollout (a baseline). */
  shallow?: boolean;
  /** A clock for wall-clock budgets (the worker passes `performance.now`). */
  now: () => number;
  /** Tests only: sees each ranking. */
  debug?: (
    kind: string,
    ranked: { actions: Action[]; mean: number; n: number; breakdown: Breakdown }[],
  ) => void;
}

export interface PlanStep {
  action: Action;
  /** The planner's mean value for the move this step belongs to (1000 = a win in every sample). */
  value: number;
  /** What the AI's view must look like (handles aside) for this step to still be the plan. */
  fingerprint: string;
  explanation: Explanation;
}

export interface TurnPlan {
  turn: number;
  steps: PlanStep[];
  next: number;
  incomplete: boolean;
}

/** What the worker keeps between decisions of one game. */
export interface PirateMemory {
  plan: TurnPlan | null;
  /** The rest of a whole defence chosen for the battle `key` (review M5a-11). */
  defence: { key: string; actions: Action[] } | null;
}

export interface PirateDecision {
  action: Action;
  explanation: Explanation;
  alternatives: Action[];
  stats: { rollouts: number; actions: number; planned: boolean; value?: number };
}

interface Candidate {
  actions: Action[];
}

interface Scored {
  c: Candidate;
  n: number;
  sum: number;
  breakdown: Breakdown;
  bias: number;
  mean: number;
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
const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');
const strip = ({ intentId: _i, ...a }: Action) => a;
const same = (a: Action, b: Action) => JSON.stringify(strip(a)) === JSON.stringify(strip(b));

// ------------------------------------------------------------------------------------------------
// Budgets
// ------------------------------------------------------------------------------------------------

interface Clock {
  left(): boolean;
  spend(): void;
  cut: boolean;
}

function clockFor(b: Budget, ctx: SimContext, now: () => number): Clock {
  const start = now();
  const startRollouts = ctx.stats.rollouts;
  const c: Clock = {
    cut: false,
    left() {
      const ok =
        'iterations' in b
          ? ctx.stats.rollouts - startRollouts < b.iterations
          : now() - start < b.ms;
      if (!ok) c.cut = true;
      return ok;
    },
    spend() {},
  };
  return c;
}

// ------------------------------------------------------------------------------------------------
// Views, handles and fingerprints
// ------------------------------------------------------------------------------------------------

/** A determinized state's action in the view's handles, or null if it names a card with none. */
function toView(a: Action, handles: Record<string, string>): Action | null {
  let missing = false;
  const json = JSON.stringify(a).replace(/\$[a-z0-9]{7}/g, (id) => {
    const h = handles[id];
    if (h === undefined) missing = true;
    return h ?? id;
  });
  return missing ? null : (JSON.parse(json) as Action);
}

/** The view, handles aside: equal fingerprints mean the AI sees the same game. */
export function fingerprint(v: PlayerView): string {
  const card = (c: { card: string | null; rested: boolean; don: number; power: number | null }) =>
    `${c.card ?? '?'}:${c.rested ? 1 : 0}:${c.don}:${c.power ?? ''}`;
  const side = (p: PlayerId) => {
    const z = v.zones[p];
    return [
      z.leader.map(card),
      z.characters.map(card),
      z.stage.map(card),
      z.trash.map((c) => c.card),
      z.hand.length,
      p === v.player ? z.hand.map((c) => c.card).sort() : [],
      z.life.map((c) => (c.faceUp ? c.card : '')),
      z.deck.length,
      v.don[p],
    ];
  };
  return JSON.stringify([v.turn, v.decision?.kind, v.decision?.player, side('p1'), side('p2')]);
}

// ------------------------------------------------------------------------------------------------
// Scoring
// ------------------------------------------------------------------------------------------------

function simContext(view: PlayerView, setup: PirateSetup): SimContext {
  const first =
    view.turn.number % 2 === 1
      ? view.turn.activePlayer === view.player
      : view.turn.activePlayer !== view.player;
  return {
    cards: setup.cards,
    evalCtx: {
      me: view.player,
      first,
      playbook: setup.playbook,
      cards: setup.cards,
      oppAvgCounter: setup.oppAvgCounter,
      ...(setup.weights ? { weights: setup.weights } : {}),
    },
    stats: { rollouts: 0, actions: 0 },
  };
}

/** Apply a candidate's actions in one state, resolving follow-ups between them. */
function play(
  s0: GameState,
  c: Candidate,
  me: PlayerId,
  ctx: SimContext,
  main: boolean,
): GameState | null {
  let s = s0;
  for (let i = 0; i < c.actions.length; i++) {
    const a = c.actions[i]!;
    if (i > 0) {
      const d = queries.decision(s);
      if (!d || d.player !== me) return s;
    }
    try {
      s = apply(s, a, ctx);
    } catch {
      return i === 0 ? null : s;
    }
    if (main) s = settle(s, me, ctx);
    else if (i < c.actions.length - 1) s = settleToMine(s, me, ctx);
  }
  return s;
}

/** Quick policies until `me` owes a decision of the same battle again (Counter macros). */
function settleToMine(s0: GameState, me: PlayerId, ctx: SimContext): GameState {
  let s = s0;
  for (let i = 0; i < 60; i++) {
    const d = queries.decision(s);
    if (!d || queries.result(s)) return s;
    if (d.player === me && d.kind === 'counter') return s;
    if (!queries.battle(s)) return s;
    s = apply(s, quickAction(s, ctx), ctx);
  }
  return s;
}

/**
 * Score every candidate in each sampled state, one state at a time (round-robin), and compare them
 * over complete rounds only: once started, the first round runs in full (at most one round past
 * the budget per plan), so no candidate goes unscored; a round the budget cuts short is dropped, so every candidate is judged
 * on the same samples (review M5a-15).
 */
function score(
  states: GameState[],
  cands: Candidate[],
  me: PlayerId,
  ctx: SimContext,
  clock: Clock,
  main: boolean,
  bias: (c: Candidate) => number,
  shallowRun = false,
): Scored[] {
  // No budget left at all: the caller plays its quick policy instead.
  if (!clock.left()) return [];
  const runs: { value: number; breakdown: Breakdown }[][] = cands.map(() => []);
  let rounds = 0;
  for (const [round, s] of states.entries()) {
    const fromTurn = queries.turn(s).number;
    let complete = true;
    for (const [i, c] of cands.entries()) {
      if (round > 0 && !clock.left()) {
        complete = false;
        break;
      }
      const after = play(s, c, me, ctx, main);
      if (!after) {
        ctx.stats.rollouts++;
        runs[i]!.push({ value: -Infinity, breakdown: { ...ZERO } });
        continue;
      }
      if (shallowRun) {
        ctx.stats.rollouts++;
        const b = evaluate(after, ctx.evalCtx);
        runs[i]!.push({ value: total(b), breakdown: b });
      } else runs[i]!.push(rolloutValue(after, fromTurn, ctx));
    }
    if (!complete) break;
    rounds++;
  }
  if (rounds < states.length) clock.cut = true;
  const out: Scored[] = cands.map((c, i) => {
    const r = runs[i]!.slice(0, Math.max(1, rounds));
    const legal = r.filter((x) => x.value !== -Infinity);
    const breakdown = { ...ZERO };
    for (const x of legal)
      for (const k of Object.keys(ZERO) as (keyof Breakdown)[])
        breakdown[k] += x.breakdown[k] / legal.length;
    const sum = legal.reduce((t, x) => t + x.value, 0);
    const b = bias(c);
    return {
      c,
      n: legal.length,
      sum,
      breakdown,
      bias: b,
      mean: legal.length ? sum / legal.length + b : -Infinity,
    };
  });
  return out.filter((x) => x.n > 0).sort((x, y) => y.mean - x.mean);
}

// ------------------------------------------------------------------------------------------------
// Playbook biases (ai/playbooks/*.json)
// ------------------------------------------------------------------------------------------------

function ownTurnOf(s: GameState, ctx: SimContext): number {
  return ownTurn(queries.turn(s).number, ctx.evalCtx.first);
}

function mainBias(root: GameState, me: PlayerId, ctx: SimContext, setup: PirateSetup) {
  const pb = setup.playbook;
  const own = ownTurnOf(root, ctx);
  const leader = queries.zone(root, me, 'leader')[0]!;
  const hand = queries.zone(root, me, 'hand').map((c) => c.card);
  const legal = legalActions(root);
  const leaderCanAttack = legal.some((a) => a.type === 'attack' && a.attacker === leader.instance);
  const oppChars = queries.zone(root, other(me), 'characters');
  return (c: Candidate): number => {
    if (!pb) return 0;
    let b = 0;
    for (const a of c.actions) {
      for (const bias of pb.biases) {
        if (bias.kind === 'attackWith' && a.type === 'attack' && own >= bias.fromOwnTurn) {
          const who = bias.card === 'leader' ? leader.instance : null;
          if (who ? a.attacker === who : queries.card(root, a.attacker).card === bias.card)
            b += bias.bonus;
        }
        if (
          bias.kind === 'playAfterLeaderAttack' &&
          a.type === 'attack' &&
          a.attacker === leader.instance
        ) {
          // Keep the DON!! that `card` costs when the Leader attacks to set it up.
          const card = queries.zone(root, me, 'hand').find((c) => c.card === bias.card);
          const [lo, hi] = bias.targetPower;
          const given = c.actions.filter((x) => x.type === 'giveDon').length;
          if (card && oppChars.some((ch) => (ch.power ?? 0) >= lo && (ch.power ?? 0) <= hi)) {
            b +=
              queries.don(root, me).active - given >= (card.cost ?? 0)
                ? bias.penalty
                : -bias.penalty;
          }
        }
        if (a.type !== 'playCard') continue;
        const id = queries.card(root, a.card).card;
        if (bias.kind === 'play' && bias.cards.includes(id)) {
          if ((bias.fromOwnTurn ?? 0) <= own && own <= (bias.byOwnTurn ?? 99)) b += bias.bonus;
        }
        if (
          bias.kind === 'avoidPlay' &&
          bias.card === id &&
          own >= bias.fromOwnTurn &&
          hand.includes(bias.whileInHand)
        )
          b -= bias.penalty;
        if (bias.kind === 'playAfterLeaderAttack' && bias.card === id && leaderCanAttack) {
          const [lo, hi] = bias.targetPower;
          if (oppChars.some((ch) => (ch.power ?? 0) >= lo && (ch.power ?? 0) <= hi))
            b -= bias.penalty;
        }
      }
    }
    return b;
  };
}

function otherBias(root: GameState, me: PlayerId, setup: PirateSetup) {
  const pb = setup.playbook;
  const dec = queries.decision(root)!;
  const src = dec.source;
  const battle = battleNumbers(root);
  const hand = queries.zone(root, me, 'hand').length;
  return (c: Candidate): number => {
    if (!pb || !src) return 0;
    const a = c.actions[0]!;
    let b = 0;
    for (const bias of pb.biases) {
      if (
        bias.kind === 'acceptOptional' &&
        dec.kind === 'optional' &&
        src.card === bias.source &&
        src.ability === bias.ability
      ) {
        if (a.type === 'optional' && a.accept && hand >= bias.minHand) b += bias.bonus;
      }
      if (
        bias.kind === 'useOnAttacker' &&
        src.card === bias.source &&
        src.ability === bias.ability &&
        battle &&
        battle.attacker.owner !== me
      ) {
        const attackerIsChar = battle.attacker.zone === 'characters';
        // "Hold the leader's −2000 for the turn it changes an outcome" [SH-KAI]: spending it on an
        // attack that already fails, or that it cannot shrink, costs the bonus instead.
        if (dec.kind === 'optional' && a.type === 'optional' && a.accept)
          b += attackerIsChar && battle.need > 0 ? bias.bonus : -bias.bonus;
        if (dec.kind === 'choose' && a.type === 'pick' && a.choice === battle.b.attacker)
          b += bias.bonus;
      }
      // The Leader's own [When Attacking] shrink sets up `card` (Ulti & Page One's K.O. of 3000 or
      // less): use it on a Character in the power window while that card is in hand.
      if (
        bias.kind === 'playAfterLeaderAttack' &&
        battle &&
        battle.attacker.owner === me &&
        battle.attacker.zone === 'leader'
      ) {
        const inHand = queries.zone(root, me, 'hand').some((c) => c.card === bias.card);
        const [lo, hi] = bias.targetPower;
        const window = queries
          .zone(root, other(me), 'characters')
          .filter((c) => (c.power ?? 0) >= lo && (c.power ?? 0) <= hi);
        if (inHand && window.length > 0 && src.instance === battle.attacker.instance) {
          if (dec.kind === 'optional' && a.type === 'optional' && a.accept) b += bias.penalty;
          if (
            dec.kind === 'choose' &&
            a.type === 'pick' &&
            window.some((c) => c.instance === a.choice)
          )
            b += bias.penalty;
        }
      }
      if (
        bias.kind === 'targetHighestPower' &&
        dec.kind === 'choose' &&
        src.card === bias.source &&
        src.ability === bias.ability
      ) {
        if (a.type === 'pick' && typeof a.choice === 'string') {
          const picks = legalActions(root).filter(
            (x): x is Extract<Action, { type: 'pick' }> =>
              x.type === 'pick' && typeof x.choice === 'string',
          );
          const powers = picks.map((x) => queries.card(root, x.choice as string).power ?? 0);
          const mine = queries.card(root, a.choice).power ?? 0;
          if (mine === Math.max(...powers)) b += bias.bonus;
        }
      }
    }
    return b;
  };
}

// ------------------------------------------------------------------------------------------------
// Candidates
// ------------------------------------------------------------------------------------------------

/** Does a card's script care about attacking or given DON!! ([When Attacking], [DON!! xN])? */
function scriptMentions(cardId: string, words: string[]): boolean {
  const json = JSON.stringify(SCRIPTS[cardId]?.abilities ?? []);
  return words.some((w) => json.includes(w));
}

/**
 * Candidate moves at a Main decision. Moves that cannot matter are left out, so the planner never
 * shows a pointless move that happened to score level: DON!! for a card that cannot attack this
 * turn (unless its text counts given DON!!), and an attack that fails for certain from a card with
 * no [When Attacking] effect.
 */
function mainCandidates(s: GameState, me: PlayerId): Candidate[] {
  const acts = legalActions(s).filter((a) => a.type !== 'concede');
  const don = queries.don(s, me).active;
  const attackers = new Set(acts.flatMap((a) => (a.type === 'attack' ? [a.attacker] : [])));
  const out: Candidate[] = [];
  for (const a of acts) {
    if (a.type === 'attack') {
      const at = queries.card(s, a.attacker);
      const tp = queries.card(s, a.target).power ?? 0;
      const trigger = scriptMentions(at.card, ['whenAttacking']);
      const give = acts.find((g) => g.type === 'giveDon' && g.target === a.attacker);
      const ks = [
        0,
        ...(give ? [...new Set([1, 2, 3, don])].filter((k) => k > 0 && k <= don) : []),
      ];
      for (const k of ks) {
        if ((at.power ?? 0) + 1000 * k < tp && !trigger) continue;
        out.push({ actions: [...Array.from({ length: k }, () => give!), a] });
      }
    } else if (a.type === 'giveDon') {
      const t = queries.card(s, a.target);
      if (attackers.has(a.target) || scriptMentions(t.card, ['donGiven']))
        out.push({ actions: [a] });
    } else out.push({ actions: [a] });
  }
  return out.length ? out : acts.map((a) => ({ actions: [a] }));
}

/** "Take it" and the whole defences that stop the attack: fewest cards, and least Counter spent. */
function counterCandidates(s: GameState, me: PlayerId, setup: PirateSetup): Candidate[] {
  const acts = legalActions(s).filter((a) => a.type !== 'concede');
  const done = acts.find((a) => a.type === 'endCounter');
  const out: Candidate[] = done ? [{ actions: [done] }] : [];
  const n = battleNumbers(s);
  const valued = acts
    .map((a) => ({
      a,
      v:
        a.type === 'counter'
          ? (queries.card(s, a.card).counter ?? 0)
          : a.type === 'activate' && a.ability === 'counter'
            ? counterValueOf(setup.cards.get(queries.card(s, a.card).card))
            : 0,
    }))
    .filter((x) => x.v > 0);
  // Other abilities usable now (rare) are candidates on their own.
  for (const a of acts)
    if (
      a.type !== 'endCounter' &&
      a.type !== 'counter' &&
      !(a.type === 'activate' && a.ability === 'counter')
    )
      out.push({ actions: [a] });
  if (!n || n.need <= 0 || valued.length === 0) return out;
  const need = n.need;
  const order = (xs: typeof valued) =>
    // Character Counters first, then Events (their targets are chosen after).
    xs
      .slice()
      .sort(
        (x, y) => Number(x.a.type === 'activate') - Number(y.a.type === 'activate') || y.v - x.v,
      );
  // Fewest cards: largest first.
  const byValue = valued.slice().sort((x, y) => y.v - x.v);
  const fewest: typeof valued = [];
  let sum = 0;
  for (const x of byValue) {
    if (sum >= need) break;
    fewest.push(x);
    sum += x.v;
  }
  if (sum < need) return out;
  out.push({ actions: order(fewest).map((x) => x.a) });
  // Least Counter spent (over subsets of up to 8 options).
  const opts = byValue.slice(0, 8);
  let best: typeof valued | null = null;
  let bestSum = Infinity;
  for (let mask = 1; mask < 1 << opts.length; mask++) {
    let t = 0;
    const set: typeof valued = [];
    for (let i = 0; i < opts.length; i++)
      if (mask & (1 << i)) {
        t += opts[i]!.v;
        set.push(opts[i]!);
      }
    if (t >= need && (t < bestSum || (t === bestSum && best && set.length < best.length))) {
      best = set;
      bestSum = t;
    }
  }
  if (best) {
    const acts2 = order(best).map((x) => x.a);
    if (JSON.stringify(acts2) !== JSON.stringify(out[out.length - 1]!.actions))
      out.push({ actions: acts2 });
  }
  return out;
}

// ------------------------------------------------------------------------------------------------
// Entry points
// ------------------------------------------------------------------------------------------------

/** Plan the AI's turn from its Main Phase (ARCHITECTURE §4.1 `planTurn`). */
export function planTurn(
  view: SearchView,
  setup: PirateSetup,
  budget: Budget,
  seed: number,
): {
  plan: TurnPlan;
  stats: SimContext['stats'];
} {
  const me = view.player;
  const ctx = simContext(view, setup);
  const clock = clockFor(budget, ctx, setup.now);
  let states = determinizations(view, setup, setup.k, seed);
  const handles = view.skeleton.handles;
  const steps: PlanStep[] = [];
  let incomplete = false;
  let stop = false;
  for (let n = 0; n < 60 && !stop; n++) {
    const root = states[0]!;
    const dec = queries.decision(root);
    if (!dec || dec.kind !== 'main' || dec.player !== me || queries.result(root)) break;
    const fp = n === 0 ? fingerprint(view) : fingerprint(project(root, me));
    if (n > 0 && states.some((s) => fingerprint(project(s, me)) !== fp)) break;
    const cands = mainCandidates(root, me);
    const ranked = score(
      states,
      cands,
      me,
      ctx,
      clock,
      true,
      mainBias(root, me, ctx, setup),
      !!setup.shallow,
    );
    setup.debug?.(
      'main',
      ranked.map((r) => ({ actions: r.c.actions, mean: r.mean, n: r.n, breakdown: r.breakdown })),
    );
    if (clock.cut) incomplete = true;
    let chosen: Candidate;
    if (ranked.length === 0) {
      chosen = { actions: [quickAction(root, ctx)] };
      incomplete = true;
    } else chosen = ranked[0]!.c;
    for (let i = 0; i < chosen.actions.length; i++) {
      const a = chosen.actions[i]!;
      const s0 = states[0]!;
      const stepFp = i === 0 ? fp : fingerprint(project(s0, me));
      const va = toView(a, handles);
      if (!va) {
        stop = true;
        break;
      }
      // Each step is explained as itself, from public facts only (why.ts).
      const explanation = explainAction(s0, a, me, whyContext(view, setup));
      steps.push({ action: va, fingerprint: stepFp, explanation, value: ranked[0]?.mean ?? 0 });
      const next: GameState[] = [];
      for (const s of states) {
        try {
          next.push(settle(apply(s, a, ctx), me, ctx));
        } catch {
          // The move is not legal in this guess (it should always be): drop the guess.
        }
      }
      if (next.length === 0) {
        stop = true;
        break;
      }
      states = next;
      if (a.type === 'endTurn') stop = true;
    }
  }
  return { plan: { turn: view.turn.number, steps, next: 0, incomplete }, stats: ctx.stats };
}

/** Did the viewer's seat go first (from the turn number and whose turn it is). */
function wentFirst(view: PlayerView): boolean {
  return view.turn.number % 2 === 1
    ? view.turn.activePlayer === view.player
    : view.turn.activePlayer !== view.player;
}

function whyContext(view: PlayerView, setup: PirateSetup): WhyContext {
  return { cards: setup.cards, playbook: setup.playbook, first: wentFirst(view) };
}

/** A view action in a determinized state's canonical ids. */
function fromView(a: Action, handles: Record<string, string>): Action {
  const back = new Map(Object.entries(handles).map(([id, h]) => [h, id]));
  const map = (v: unknown): unknown => {
    if (typeof v === 'string') {
      const [head, ...rest] = v.split('#');
      const id = back.get(head!);
      return id === undefined ? v : [id, ...rest].join('#');
    }
    if (v && typeof v === 'object')
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, map(x)]));
    return v;
  };
  return map(a) as Action;
}

/**
 * The public explanation of a view action, with no search (forced moves and fallbacks): the same
 * builder as every other decision, so a forced move reads like a chosen one (review M5a-01).
 */
export function explainViewAction(
  view: SearchView,
  a: Action,
  setup: PirateSetup,
  seed: number,
): Explanation {
  const [state] = determinizations(view, setup, 1, seed);
  return explainAction(
    state!,
    fromView(a, view.skeleton.handles),
    view.player,
    whyContext(view, setup),
  );
}

/**
 * Mulligan by the playbook's rule, taken from the guide (strategy-concepts §9 [S9]; the guides'
 * "keepable hand"). Each card counts toward one piece only.
 */
function mulligan(view: PlayerView, setup: PirateSetup): PirateDecision {
  const pb = setup.playbook;
  const hand = view.zones[view.player].hand.map((c) => setup.cards.get(c.card ?? ''));
  const first = view.turn.activePlayer === view.player;
  let keep = true;
  if (pb) {
    const m = pb.mulligan;
    const left = hand.filter((c): c is Card => !!c);
    const met: Record<string, boolean> = {};
    for (const piece of m.pieces) {
      let n = 0;
      for (let i = 0; i < left.length && n < piece.min;) {
        const c = left[i]!;
        const fits = piece.cards ? piece.cards.includes(c.id) : counterValueOf(c) > 0;
        if (fits) {
          left.splice(i, 1);
          n++;
        } else i++;
      }
      met[piece.name] = n >= piece.min;
    }
    const missing = m.pieces.filter((p) => !met[p.name]).length;
    keep = missing <= (first ? 0 : m.secondShort);
    if (first && m.requireGoingFirst.some((name) => !met[name])) keep = false;
  }
  const action = view.actions.find((a) => a.type === 'mulligan' && a.redraw === !keep)!;
  const m = pb?.mulligan;
  // The guide's rule, one line for what it keeps and one for the seat allowance (copy: <= 30 words).
  const rule: { text: string; figures: Record<string, number> }[] = m
    ? [
        {
          text: `Its guide keeps a hand with ${m.pieces.map((p) => p.label).join(', and ')}.`,
          figures: {},
        },
        ...(m.secondShort > 0
          ? [
              {
                text: `Going second, ${m.secondShort === 1 ? 'one piece' : `${m.secondShort} pieces`} short is enough.`,
                figures: {},
              },
            ]
          : []),
      ]
    : [{ text: 'It keeps any opening hand.', figures: {} }];
  return {
    action,
    explanation: explainMove({
      claim: keep ? 'It kept its opening hand.' : 'It redrew its opening hand.',
      evidence: rule,
      line: [{ kind: keep ? 'keep' : 'redraw', text: keep ? 'Keep.' : 'Redraw all five.' }],
      outcome: keep ? 'It plays the hand it drew.' : 'A fresh five cards.',
      concept: 'mulligan',
      sources: ['CR 5-2-1-6', ...(m ? [m.source] : [])],
    }),
    alternatives: [],
    stats: { rollouts: 0, actions: 0, planned: false },
  };
}

/** Is this battle lethal for `me` if nothing stops it (0 Life, Leader target, attack lands)? */
function lethalOnMe(s: GameState, me: PlayerId): boolean {
  const n = battleNumbers(s);
  return (
    !!n &&
    n.target.owner === me &&
    n.target.zone === 'leader' &&
    n.need > 0 &&
    queries.zone(s, me, 'life').length === 0
  );
}

/** The Counter this hand can add now (Character Counters, and [Counter] Events it can pay for). */
function handCounter(s: GameState, me: PlayerId, setup: PirateSetup): number {
  const active = queries.don(s, me).active;
  let t = 0;
  for (const c of queries.zone(s, me, 'hand')) {
    const card = setup.cards.get(c.card);
    if (card?.category === 'Event') t += (c.cost ?? 0) <= active ? counterValueOf(card) : 0;
    else t += c.counter ?? 0;
  }
  return t;
}

/** One decision (ARCHITECTURE §4.1 `decide`): follow the turn plan while it holds; search otherwise. */
export function decide(
  view: SearchView,
  mem: PirateMemory,
  setup: PirateSetup,
  budgets: { turn: Budget; defence: Budget },
  seed: number,
): PirateDecision {
  const kind = view.decision?.kind;
  const options = view.actions.filter((a) => a.type !== 'concede');
  if (options.length === 0) throw new Error('Pirate was asked to decide with no legal action.');
  const none = { rollouts: 0, actions: 0, planned: false };
  if (kind === 'mulligan') return mulligan(view, setup);
  if (kind === 'chooseFirst') {
    const goFirst = setup.playbook?.goFirst ?? false;
    const action =
      options.find((a) => a.type === 'chooseFirst' && a.goFirst === goFirst) ?? options[0]!;
    return {
      action,
      explanation: explainMove({
        claim: goFirst ? 'It chose to go first.' : 'It chose to go second.',
        evidence: [
          {
            text: goFirst
              ? 'Going first gives it the first attack, on its second turn.'
              : 'Going second, it draws on its first turn and has 1 more DON!! each turn until 10.',
            figures: {},
          },
        ],
        line: null,
        outcome: goFirst ? 'It takes the first turn.' : 'You take the first turn.',
        concept: 'turn-order',
        sources: ['CR 6-3-1', 'CR 6-4-1', 'CR 6-5-6-1', 'S17'],
      }),
      alternatives: [],
      stats: none,
    };
  }
  const battle = (view as ProjectedView).battle;
  const key = battle ? `${view.turn.number}|${battle.attacker}|${battle.target}` : '';
  if (setup.searchless) {
    const [state] = determinizations(view, setup, 1, seed);
    const ctx = simContext(view, setup);
    const quick = quickAction(state!, ctx);
    const action = toView(quick, view.skeleton.handles) ?? options[0]!;
    return {
      action,
      explanation: explainViewAction(view, action, setup, seed),
      alternatives: [],
      stats: none,
    };
  }
  // The same explanation builder whether or not there was a choice (review M5a-01).
  if (options.length === 1) {
    const action = options[0]!;
    return {
      action,
      explanation: explainViewAction(view, action, setup, seed),
      alternatives: [],
      stats: none,
    };
  }

  if (kind === 'main') {
    const p = mem.plan;
    if (p && p.turn === view.turn.number && p.next < p.steps.length) {
      const st = p.steps[p.next]!;
      if (st.fingerprint === fingerprint(view) && options.some((a) => same(a, st.action))) {
        p.next++;
        return {
          action: st.action,
          explanation: st.explanation,
          alternatives: [],
          stats: { rollouts: 0, actions: 0, planned: true, value: st.value },
        };
      }
    }
    const { plan, stats } = planTurn(view, setup, budgets.turn, seed);
    mem.plan = plan;
    const st = plan.steps[0];
    if (st && options.some((a) => same(a, st.action))) {
      plan.next = 1;
      return {
        action: st.action,
        explanation: st.explanation,
        alternatives: [],
        stats: { ...stats, planned: false, value: st.value },
      };
    }
    // No plan step is legal (never seen): end the turn, explained like any other end of turn.
    const end = options.find((a) => a.type === 'endTurn') ?? options[0]!;
    return {
      action: end,
      explanation: explainViewAction(view, end, setup, seed),
      alternatives: [],
      stats: { ...stats, planned: false },
    };
  }

  // A defence chosen for this battle continues while it is legal, through the target picks of its
  // [Counter] Events (review M5a-11).
  if (mem.defence && mem.defence.key !== key) mem.defence = null;
  if (kind === 'counter' && mem.defence && mem.defence.actions.length > 0) {
    const a = mem.defence.actions[0]!;
    if (options.some((o) => same(o, a))) {
      mem.defence.actions.shift();
      return {
        action: a,
        explanation: explainViewAction(view, a, setup, seed),
        alternatives: [],
        stats: { rollouts: 0, actions: 0, planned: true },
      };
    }
    mem.defence = null;
  }

  const me = view.player;
  const ctx = simContext(view, setup);
  const clock = clockFor(budgets.defence, ctx, setup.now);
  const states = determinizations(view, setup, setup.k, seed);
  const root = states[0]!;
  let cands =
    kind === 'counter'
      ? counterCandidates(root, me, setup)
      : legalActions(root)
          .filter((a) => a.type !== 'concede')
          .map((a) => ({ actions: [a] }));
  // Lethal is always defended where a defence exists, even when a later attack may still win
  // (DECISIONS M5a "Defence"; Rookie's rule too; review M5a-05).
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
  const ranked = score(
    states,
    cands,
    me,
    ctx,
    clock,
    false,
    otherBias(root, me, setup),
    !!setup.shallow,
  );
  const chosen = ranked[0]?.c ?? cands[0]!;
  const first = chosen.actions[0]!;
  const action = toView(first, view.skeleton.handles) ?? options[0]!;
  const explanation = explainAction(root, first, me, whyContext(view, setup));
  if (kind === 'counter' && chosen.actions.length > 1) {
    const rest = chosen.actions.slice(1).map((a) => toView(a, view.skeleton.handles));
    if (rest.every((x) => x !== null)) mem.defence = { key, actions: rest as Action[] };
  }
  return {
    action,
    explanation,
    alternatives: [],
    stats: { ...ctx.stats, planned: false, value: ranked[0]?.mean ?? 0 },
  };
}
