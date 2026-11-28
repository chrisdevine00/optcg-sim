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
import { playOnlyIfMet } from './conditions.ts';
import { evaluate, total, type Breakdown, type Weights } from './heuristic.ts';
import { mulliganVerdict } from './mulligan.ts';
import { determinizations } from './sample.ts';
import { explainAction, playConditionHolds, type WhyContext } from './why.ts';
import {
  apply,
  battleNumbers,
  isNoOpActivation,
  quickAction,
  rolloutValue,
  settle,
  type SimContext,
} from './sim.ts';

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

export interface Candidate {
  actions: Action[];
  /**
   * Warlord macro moves only: the playbook's pick-type bias (`otherBias`) for the prompt answer
   * bundled into `actions`, so a macro's prior is `mainBias` of the move plus this (review M5b-1).
   */
  pickBias?: number;
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
export const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');
const strip = ({ intentId: _i, ...a }: Action) => a;
export const same = (a: Action, b: Action) => JSON.stringify(strip(a)) === JSON.stringify(strip(b));

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
export function toView(a: Action, handles: Record<string, string>): Action | null {
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

export function simContext(view: PlayerView, setup: PirateSetup): SimContext {
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
export function play(
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

/** Can this Character attack this turn (active, not "cannot attack", not summoning-sick unless Rush)? */
function canAttackNow(
  c: { rested: boolean; cannotAttack?: boolean; played?: number; keywords: string[]; zone: string },
  turn: number,
): boolean {
  return (
    c.zone === 'characters' &&
    !c.rested &&
    !c.cannotAttack &&
    ((c.played ?? -1) < turn || c.keywords.includes('Rush'))
  );
}

/** A Character `avoidTarget` removal is for: above `maxCost` and, if given, within its `reach`. */
function realThreat(
  c: { cost: number | null; power: number | null },
  bias: { maxCost: number; reach?: number },
): boolean {
  return (c.cost ?? 0) > bias.maxCost && (bias.reach === undefined || (c.power ?? 0) <= bias.reach);
}

/** Does `activateBefore`'s discount pay for this hand card now (see the playbook type)? */
export function discountPays(
  s: GameState,
  me: PlayerId,
  h: { card: string; cost: number | null },
  bias: { cards: string[]; refundCards: string[]; minCost: number },
  /**
   * Count DON!! given this turn as still in the cost area (the tree: a discount that only becomes
   * "the only way" because the plan first gave DON!! away is not needed; play the card first).
   */
  turnStart = false,
): boolean {
  const cost = h.cost ?? 0;
  if (!bias.cards.includes(h.card) || cost < bias.minCost) return false;
  const d = queries.don(s, me);
  const o = queries.don(s, other(me));
  if (d.active < cost - 1) return false; // not affordable even with it
  const only = cost > d.active + (turnStart ? d.given : 0);
  const refunds =
    bias.refundCards.includes(h.card) &&
    d.active + d.rested + d.given - 1 <= o.active + o.rested + o.given;
  return only || refunds;
}

function ownTurnOf(s: GameState, ctx: SimContext): number {
  return ownTurn(queries.turn(s).number, ctx.evalCtx.first);
}

export function mainBias(root: GameState, me: PlayerId, ctx: SimContext, setup: PirateSetup) {
  const pb = setup.playbook;
  const own = ownTurnOf(root, ctx);
  const leader = queries.zone(root, me, 'leader')[0]!;
  const hand = queries.zone(root, me, 'hand').map((c) => c.card);
  const legal = legalActions(root);
  const leaderCanAttack = legal.some((a) => a.type === 'attack' && a.attacker === leader.instance);
  const oppChars = queries.zone(root, other(me), 'characters');
  const chars = queries.zone(root, me, 'characters');
  const donActive = queries.don(root, me).active;
  const ctxG2 = groupTwoFacts(root, me, own, setup);
  const myChars = queries.zone(root, me, 'characters');
  const readyAttackers = new Set(legal.flatMap((a) => (a.type === 'attack' ? [a.attacker] : [])))
    .size;
  return (c: Candidate): number => {
    if (!pb) return 0;
    let b = 0;
    let gaveLeader = false;
    for (const a of c.actions) {
      for (const bias of pb.biases) {
        b += groupTwoBias(bias, a, c, root, me, own, leader, donActive, ctxG2, setup);
        if (
          bias.kind === 'activate' &&
          a.type === 'activate' &&
          a.ability === bias.ability &&
          own >= bias.fromOwnTurn &&
          queries.card(root, a.card).card === bias.card
        )
          b += bias.bonus;
        // Sabo: one DON!! on the Leader lifts every body (+1000), so it pays once a cost-12
        // Character is out and the team is ready to swing.
        if (
          bias.kind === 'giveDonLeader' &&
          a.type === 'giveDon' &&
          a.target === leader.instance &&
          !gaveLeader &&
          readyAttackers >= bias.minAttackers &&
          myChars.some((ch) => (ch.cost ?? 0) >= bias.minCost)
        ) {
          gaveLeader = true;
          b += bias.bonus;
        }
        // Hold removal for real threats: an Event of this kind is not played while every
        // opposing Character costs `maxCost` or less.
        if (
          bias.kind === 'avoidTarget' &&
          a.type === 'playCard' &&
          oppChars.length > 0 &&
          !oppChars.some((ch) => realThreat(ch, bias)) &&
          queries.card(root, a.card).card === bias.source &&
          setup.cards.get(bias.source)?.category === 'Event'
        )
          b -= bias.penalty;
        // The card's own On-field effect needs it out first (Sanji & Pudding before the Leader's DON!! -2).
        if (
          bias.kind === 'playBeforeActivate' &&
          a.type === 'activate' &&
          a.ability === bias.ability &&
          queries.card(root, a.card).card === bias.source &&
          !chars.some((ch) => ch.card === bias.card) &&
          legal.some((x) => x.type === 'playCard' && queries.card(root, x.card).card === bias.card)
        ) {
          const at = c.actions.indexOf(a);
          const playedFirst = c.actions
            .slice(0, at)
            .some((x) => x.type === 'playCard' && queries.card(root, x.card).card === bias.card);
          if (!playedFirst) b -= bias.penalty;
        }
        if (bias.kind === 'activateBefore') {
          const mine = (x: Action) =>
            x.type === 'activate' &&
            x.ability === bias.ability &&
            queries.card(root, x.card).card === bias.source;
          const discountLegal = legal.some(mine);
          const inCandidate = c.actions.some(mine);
          const used = queries.usedThisTurn(root).some((u) => {
            // The user may have left play since (a new object, CR 3-1-6): then it is not here.
            try {
              return queries.card(root, u.card).card === bias.source && u.ability === bias.ability;
            } catch {
              return false;
            }
          });
          if (mine(a)) {
            // Worth it only while a card it pays for is in hand (see `discountPays`).
            const target = queries
              .zone(root, me, 'hand')
              .some((h) => discountPays(root, me, h, bias));
            // A DON!! -1 for nothing is a loss, though rollouts score it up to +2.3 over ending the turn.
            b += target ? bias.bonus : -4;
          }
          if (
            a.type === 'playCard' &&
            bias.cards.includes(queries.card(root, a.card).card) &&
            (queries.card(root, a.card).cost ?? 0) >= bias.minCost
          ) {
            if (
              discountLegal &&
              !inCandidate &&
              discountPays(root, me, queries.card(root, a.card), bias)
            )
              b -= bias.penalty;
            if (used) b += bias.bonus;
          }
        }
        if (bias.kind === 'attackWith' && a.type === 'attack' && own >= bias.fromOwnTurn) {
          const who = bias.card === 'leader' ? leader.instance : null;
          const at = queries.card(root, a.attacker);
          const loaded =
            at.don +
            c.actions.filter((x) => x.type === 'giveDon' && x.target === a.attacker).length;
          const is = who
            ? a.attacker === who
            : bias.card === '*'
              ? at.zone === 'characters'
              : at.card === bias.card;
          if (is && loaded >= (bias.minDon ?? 0)) b += bias.bonus;
        }
        if (bias.kind === 'attackWithPower' && a.type === 'attack' && own >= bias.fromOwnTurn) {
          const at = chars.find((x) => x.instance === a.attacker);
          if (
            at &&
            (at.power ?? 0) >= bias.minPower &&
            (!bias.withTrigger || setup.cards.get(at.card)?.triggerText)
          )
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
        if (
          bias.kind === 'playBeforeLeaderAttack' &&
          a.type === 'attack' &&
          a.attacker === leader.instance
        ) {
          // The card is in hand and the DON!! left after this move's gifts still pays for it.
          const card = queries.zone(root, me, 'hand').find((c) => c.card === bias.card);
          const given = c.actions.filter((x) => x.type === 'giveDon').length;
          if (card && queries.don(root, me).active - given >= (card.cost ?? 0)) b -= bias.penalty;
        }
        if (a.type !== 'playCard') continue;
        const id = queries.card(root, a.card).card;
        if (bias.kind === 'play' && bias.cards.includes(id)) {
          if ((bias.fromOwnTurn ?? 0) <= own && own <= (bias.byOwnTurn ?? 99)) b += bias.bonus;
        }
        if (bias.kind === 'playOnlyIf' && bias.card === id && !playOnlyIfMet(root, me, bias.when))
          b -= bias.penalty;
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
    // One bonus for a move that gives DON!! to the named card, while it holds fewer than `upTo`.
    for (const bias of pb.biases)
      if (bias.kind === 'giveDon' && own >= bias.fromOwnTurn) {
        const gives = c.actions.some((x) => {
          if (x.type !== 'giveDon') return false;
          const t = queries.card(root, x.target);
          const hit =
            bias.target === 'leader' ? x.target === leader.instance : t.card === bias.target;
          return hit && (t.don ?? 0) < (bias.upTo ?? 1);
        });
        if (gives) b += bias.bonus;
      }
    return b;
  };
}

/**
 * `keepActiveDon` also holds DON!! back from giving: a Leader attack or a give that would leave
 * fewer than `min` active DON!! is not offered (the Leader's DON!! rest needs active DON!!; the
 * guide's plan is to defend with it, not to pour every DON!! into one swing).
 */
export function holdDon(
  cands: Candidate[],
  root: GameState,
  me: PlayerId,
  ctx: SimContext,
  setup: PirateSetup,
): Candidate[] {
  const hold = setup.playbook?.biases.find((b) => b.kind === 'keepActiveDon');
  if (!hold || hold.kind !== 'keepActiveDon' || ownTurnOf(root, ctx) < hold.fromOwnTurn)
    return cands;
  const active = queries.don(root, me).active;
  const kept = cands.filter((c) => {
    const gives = c.actions.filter((a) => a.type === 'giveDon');
    return gives.length === 0 || active - gives.length >= hold.min;
  });
  return kept.length ? kept : cands;
}

/** What the group-2 biases read from the root state, once per planning step. */
interface GroupTwoFacts {
  leaderAttacked: boolean;
  counterReserve: number;
  /** Active DON!! `keepActiveDon` holds back this turn (0 before its turn). */
  holdMin: number;
}

function groupTwoFacts(
  root: GameState,
  me: PlayerId,
  own: number,
  setup: PirateSetup,
): GroupTwoFacts {
  const leader = queries.zone(root, me, 'leader')[0]!;
  // The cheapest [Counter] Event in hand the AI could still pay for: DON!! it keeps back.
  const don = queries.don(root, me).active;
  const costs = queries
    .zone(root, me, 'hand')
    .filter((c) => {
      const card = setup.cards.get(c.card);
      return card?.category === 'Event' && counterValueOf(card) > 0 && (c.cost ?? 0) <= don;
    })
    .map((c) => c.cost ?? 0);
  const hold = setup.playbook?.biases.find((b) => b.kind === 'keepActiveDon');
  return {
    leaderAttacked: leader.rested,
    counterReserve: costs.length ? Math.min(...costs) : 0,
    holdMin: hold?.kind === 'keepActiveDon' && own >= hold.fromOwnTurn ? hold.min : 0,
  };
}

/** The group-2 bias kinds (Luffy & Ace, OP13-001, OP17-079). */
function groupTwoBias(
  bias: Playbook['biases'][number],
  a: Action,
  c: Candidate,
  root: GameState,
  me: PlayerId,
  own: number,
  leader: { instance: string; don: number },
  donActive: number,
  f: GroupTwoFacts,
  setup: PirateSetup,
): number {
  switch (bias.kind) {
    case 'playOnlyWhen': {
      if (a.type !== 'playCard' || !bias.cards.includes(queries.card(root, a.card).card)) return 0;
      const late = bias.beforeLeaderAttack && f.leaderAttacked;
      return late || !playConditionHolds(bias.when, root, me) ? -bias.penalty : 0;
    }
    case 'avoidBasePower': {
      if (a.type !== 'playCard') return 0;
      const card = queries.card(root, a.card);
      return setup.cards.get(card.card)?.category === 'Character' &&
        (card.power ?? 0) >= bias.minPower
        ? -bias.penalty
        : 0;
    }
    case 'leaderDon': {
      if (own < bias.fromOwnTurn || leader.don > 0) return 0;
      if (a.type === 'giveDon' && a.target === leader.instance) return bias.bonus;
      // Only when a DON!! could be given without breaking the hold (keepActiveDon).
      if (a.type === 'endTurn' && donActive - 1 >= f.holdMin) return -bias.bonus;
      return 0;
    }
    case 'keepActiveDon': {
      if (own < bias.fromOwnTurn) return 0;
      if (a.type === 'endTurn')
        return donActive < bias.min || donActive > bias.max ? -bias.penalty : 0;
      if (a.type === 'playCard') {
        const card = queries.card(root, a.card);
        // A card that sets DON!! active again does not spend the DON!! the Leader's rest needs.
        if (scriptMentions(card.card, ['setActive'])) return 0;
        return donActive - (card.cost ?? 0) < bias.min && donActive >= bias.min ? -bias.penalty : 0;
      }
      return 0;
    }
    case 'spareDon': {
      if (a.type !== 'attack' || a.attacker !== leader.instance) return 0;
      if (own < bias.fromOwnTurn || own > bias.toOwnTurn) return 0;
      const spare = donActive - f.counterReserve;
      if (spare <= 0) return 0;
      const given = c.actions.filter((x) => x.type === 'giveDon').length;
      return given > spare ? -bias.bonus : (bias.bonus * given) / spare;
    }
    default:
      return 0;
  }
}

export function otherBias(root: GameState, me: PlayerId, setup: PirateSetup) {
  const pb = setup.playbook;
  const dec = queries.decision(root)!;
  const src = dec.source;
  const battle = battleNumbers(root);
  const hand = queries.zone(root, me, 'hand').length;
  const life = queries.zone(root, me, 'life').length;
  const turnNo = queries.turn(root).number;
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
        if (
          a.type === 'optional' &&
          a.accept &&
          hand >= bias.minHand &&
          (bias.donDeckAtLeast === undefined ||
            queries.don(root, me).deck >= bias.donDeckAtLeast) &&
          life >= (bias.minLife ?? 0)
        )
          b += bias.bonus;
      }
      if (
        bias.kind === 'targetCanAttack' &&
        dec.kind === 'choose' &&
        src.card === bias.source &&
        src.ability === bias.ability &&
        a.type === 'pick' &&
        typeof a.choice === 'string'
      ) {
        const ch = queries.card(root, a.choice);
        if (ch.owner === me && canAttackNow(ch, turnNo)) b += bias.bonus;
      }
      // The same for a removal's optional cost (Sakazuki's DON!! -1): not paid for a cheap body.
      if (
        bias.kind === 'avoidTarget' &&
        dec.kind === 'optional' &&
        src.card === bias.source &&
        src.ability === bias.ability &&
        a.type === 'optional' &&
        a.accept
      ) {
        const foes = queries.zone(root, other(me), 'characters');
        if (foes.length > 0 && !foes.some((ch) => realThreat(ch, bias))) b -= bias.penalty;
      }
      if (
        bias.kind === 'avoidTarget' &&
        dec.kind === 'choose' &&
        src.card === bias.source &&
        src.ability === bias.ability &&
        a.type === 'pick' &&
        typeof a.choice === 'string'
      ) {
        const ch = queries.card(root, a.choice);
        if (ch.owner !== me && ch.zone === 'characters' && (ch.cost ?? 0) <= bias.maxCost)
          b -= bias.penalty;
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
        bias.kind === 'preferPick' &&
        dec.kind === 'choose' &&
        src.card === bias.source &&
        src.ability === bias.ability &&
        a.type === 'pick' &&
        typeof a.choice === 'string' &&
        bias.cards.includes(queries.card(root, a.choice).card)
      )
        b += bias.bonus;
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
          const key = (id: string) => {
            const c = queries.card(root, id);
            return (bias.by === 'cost' ? c.cost : c.power) ?? 0;
          };
          const best = Math.max(...picks.map((x) => key(x.choice as string)));
          if (key(a.choice) === best) b += bias.bonus;
        }
      }
      if (
        bias.kind === 'pickWithTrigger' &&
        dec.kind === 'choose' &&
        src.card === bias.source &&
        src.ability === bias.ability &&
        a.type === 'pick' &&
        typeof a.choice === 'string' &&
        setup.cards.get(queries.card(root, a.choice).card)?.triggerText
      )
        b += bias.bonus;
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
/** Is `a` an `activateBefore` ability that no card in hand needs now? */
export function unneededDiscount(
  s: GameState,
  me: PlayerId,
  a: Action,
  setup: PirateSetup,
  turnStart = false,
): boolean {
  if (a.type !== 'activate') return false;
  for (const bias of setup.playbook?.biases ?? []) {
    if (
      bias.kind === 'activateBefore' &&
      a.ability === bias.ability &&
      queries.card(s, a.card).card === bias.source
    )
      return !queries.zone(s, me, 'hand').some((h) => discountPays(s, me, h, bias, turnStart));
  }
  return false;
}

export function mainCandidates(
  s: GameState,
  me: PlayerId,
  setup: PirateSetup,
  ctx?: SimContext,
): Candidate[] {
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
    } else if (unneededDiscount(s, me, a, setup)) {
      // Left out: a DON!! -1 no card in hand needs ends up in rollouts as a free extra turn.
    } else if (ctx && isNoOpActivation(s, a, me, ctx)) {
      // Left out: a repeatable ability that changes nothing (B3B-R1) would tie, and win, over ending.
    } else out.push({ actions: [a] });
  }
  // "Use the ability, then play the card" as one move (Rosinante's discount, then the Law): the
  // card is often not playable until the ability has resolved, and one rollout cannot tell the
  // search that the second half is the point (playbook `activateBefore`).
  for (const bias of setup.playbook?.biases ?? []) {
    if (bias.kind !== 'activateBefore') continue;
    const act = acts.find(
      (a) =>
        a.type === 'activate' &&
        a.ability === bias.ability &&
        queries.card(s, a.card).card === bias.source,
    );
    if (!act) continue;
    const seen = new Set<string>();
    for (const h of queries.zone(s, me, 'hand')) {
      if (!discountPays(s, me, h, bias) || seen.has(h.card)) continue;
      seen.add(h.card);
      out.push({ actions: [act, { type: 'playCard', card: h.instance, player: me }] });
    }
  }
  return out.length ? out : acts.map((a) => ({ actions: [a] }));
}

/** "Take it" and the whole defences that stop the attack: fewest cards, and least Counter spent. */
export function counterCandidates(s: GameState, me: PlayerId, setup: PirateSetup): Candidate[] {
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

/**
 * An optional out-parameter of `planTurn` (M7 WP1, additive): the first decision's candidates, best
 * first, with their mean values and heuristic breakdowns. Nothing changes when it is left out.
 */
export interface PlanOut {
  rootRanking?: { actions: Action[]; mean: number; n: number; breakdown: Breakdown }[];
}

/** Plan the AI's turn from its Main Phase (ARCHITECTURE §4.1 `planTurn`). */
export function planTurn(
  view: SearchView,
  setup: PirateSetup,
  budget: Budget,
  seed: number,
  out?: PlanOut,
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
    const cands = holdDon(mainCandidates(root, me, setup, ctx), root, me, ctx, setup);
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
    if (n === 0 && out)
      out.rootRanking = ranked.map((r) => ({
        actions: r.c.actions,
        mean: r.mean,
        n: r.n,
        breakdown: r.breakdown,
      }));
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

export function whyContext(view: PlayerView, setup: PirateSetup): WhyContext {
  return { cards: setup.cards, playbook: setup.playbook, first: wentFirst(view) };
}

/** A view action in a determinized state's canonical ids. */
export function fromView(a: Action, handles: Record<string, string>): Action {
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
  const keep = pb ? mulliganVerdict(hand, pb.mulligan, first).keep : true;
  const action = view.actions.find((a) => a.type === 'mulligan' && a.redraw === !keep)!;
  const m = pb?.mulligan;
  // The guide's rule, one line for what it keeps and one for the seat allowance (copy: <= 30 words).
  const rule: { text: string; figures: Record<string, number> }[] =
    m && m.pieces.length > 0
      ? [
          {
            text: `${pb?.isDefault ? 'It keeps' : 'Its guide keeps'} a hand with ${m.pieces.map((p) => p.label).join(', and ')}.`,
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
export function lethalOnMe(s: GameState, me: PlayerId): boolean {
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
export function handCounter(s: GameState, me: PlayerId, setup: PirateSetup): number {
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
  setup.debug?.(
    'other',
    ranked.map((r) => ({ actions: r.c.actions, mean: r.mean, n: r.n, breakdown: r.breakdown })),
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
