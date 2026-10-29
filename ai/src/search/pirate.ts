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
import type { Explanation, Move } from '../explanation.ts';
import {
  explainBlock,
  explainCounter,
  explainLeaderTrick,
  explainMove,
  explainTake,
  stopText,
  type BattleFacts,
  type CardFact,
} from '../explain.ts';
import { biggestCounter, counterValueOf, eventCounterOf, type Prior } from '../knowledge.ts';
import { ownTurn, type Playbook, type WeightKey } from '../playbook.ts';
import type { Breakdown } from './heuristic.ts';
import { determinizations } from './sample.ts';
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
  defence: { key: string; actions: Action[]; explanation: Explanation } | null;
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

function score(
  states: GameState[],
  cands: Candidate[],
  me: PlayerId,
  ctx: SimContext,
  clock: Clock,
  main: boolean,
  bias: (c: Candidate) => number,
): Scored[] {
  const out: Scored[] = cands.map((c) => ({
    c,
    n: 0,
    sum: 0,
    breakdown: { ...ZERO },
    bias: bias(c),
    mean: -Infinity,
  }));
  outer: for (const s of states) {
    const fromTurn = queries.turn(s).number;
    for (const sc of out) {
      if (!clock.left()) break outer;
      const after = play(s, sc.c, me, ctx, main);
      if (!after) {
        ctx.stats.rollouts++;
        continue;
      }
      const r = rolloutValue(after, fromTurn, ctx);
      sc.n++;
      sc.sum += r.value;
      for (const k of Object.keys(ZERO) as (keyof Breakdown)[]) sc.breakdown[k] += r.breakdown[k];
    }
  }
  for (const sc of out) {
    if (sc.n === 0) continue;
    sc.mean = sc.sum / sc.n + sc.bias;
    for (const k of Object.keys(ZERO) as (keyof Breakdown)[]) sc.breakdown[k] /= sc.n;
  }
  return out.filter((x) => x.n > 0).sort((x, y) => y.mean - x.mean);
}

/** The heuristic term the chosen move gained most on, against the runner-up. */
function topTerm(best: Scored, alt: Scored | undefined): WeightKey | 'deck' | 'result' | null {
  if (!alt) return null;
  let key: keyof Breakdown | null = null;
  let gain = 0.05;
  for (const k of Object.keys(ZERO) as (keyof Breakdown)[]) {
    const d = best.breakdown[k] - alt.breakdown[k];
    if (d > gain) {
      gain = d;
      key = k;
    }
  }
  return key;
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
// Public facts for explanations (flows D9: public information only)
// ------------------------------------------------------------------------------------------------

function cardFact(s: GameState, id: string, setup: PirateSetup): CardFact {
  const c = queries.card(s, id);
  return {
    card: c.card,
    name: setup.cards.get(c.card)?.name ?? c.card,
    power: c.power ?? 0,
    isLeader: c.zone === 'leader',
  };
}

function battleFacts(s: GameState, me: PlayerId, setup: PirateSetup): BattleFacts | null {
  const n = battleNumbers(s);
  if (!n) return null;
  const foe = n.attacker.owner;
  const turn = queries.turn(s).number;
  const ready = [...queries.zone(s, foe, 'leader'), ...queries.zone(s, foe, 'characters')].filter(
    (c) =>
      c.instance !== n.b.attacker &&
      !c.rested &&
      !c.cannotAttack &&
      (c.zone === 'leader' || (c.played ?? -1) < turn || c.keywords.includes('Rush')),
  );
  const pb = setup.playbook;
  const myLeader = queries.zone(s, me, 'leader')[0]!;
  const trick = pb?.leaderTrick;
  return {
    aiName: pb?.aiName ?? setup.cards.get(myLeader.card)?.name ?? 'The AI',
    aiLife: queries.zone(s, me, 'life').length,
    aiHand: queries.zone(s, me, 'hand').length,
    attacker: cardFact(s, n.b.attacker, setup),
    target: cardFact(s, n.b.target, setup),
    need: n.need,
    readyOthers: ready.map((c) => cardFact(s, c.instance, setup)),
    biggestCounter: biggestCounter(myLeader.card, setup.cards),
    ...(trick
      ? {
          leaderTrick: {
            name: trick.name,
            used: queries
              .usedThisTurn(s)
              .some((u) => u.card === myLeader.instance && u.ability === trick.ability),
          },
        }
      : {}),
  };
}

const hasOnPlay = (cardId: string): boolean =>
  (SCRIPTS[cardId]?.abilities ?? []).some((a) => {
    const when = (a as { when?: unknown }).when;
    return Array.isArray(when) ? when.includes('onPlay') : when === 'onPlay';
  });

/** A script ability's power amount and DON!! −X cost (the Leader's trick, for copy). */
function abilityNumbers(cardId: string, ability: string): { amount: number; donCost: number } {
  const a = SCRIPTS[cardId]?.abilities.find((x) => x.id === ability) as
    { cost?: { donMinus?: number }[]; effect?: unknown } | undefined;
  let amount = 0;
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const p = o.power as { amount?: number } | undefined;
      if (p && typeof p.amount === 'number' && amount === 0) amount = p.amount;
      Object.values(o).forEach(walk);
    }
  };
  walk(a?.effect);
  const donCost = (a?.cost ?? []).reduce((t, c) => t + (c.donMinus ?? 0), 0);
  return { amount, donCost };
}

// ------------------------------------------------------------------------------------------------
// Explanations of moves
// ------------------------------------------------------------------------------------------------

function explainMainAction(
  s: GameState,
  a: Action,
  me: PlayerId,
  setup: PirateSetup,
  term: WeightKey | 'deck' | 'result' | null,
  macroDon: number,
): Explanation {
  const name = (id: string) => cardFact(s, id, setup).name;
  const opp = other(me);
  const yourLife = queries.zone(s, opp, 'life').length;
  const yourHand = queries.zone(s, opp, 'hand').length;
  switch (a.type) {
    case 'playCard': {
      const c = queries.card(s, a.card);
      const cost = c.cost ?? 0;
      const don = queries.don(s, me).active;
      const kw = c.keywords.length ? `, ${c.keywords.map((k) => `[${k}]`).join(' ')}` : '';
      if (setup.cards.get(c.card)?.category === 'Event') {
        const main = SCRIPTS[c.card]?.abilities.find(
          (x) => (x as { when?: unknown }).when === 'main',
        ) as { label?: string } | undefined;
        return explainMove({
          claim: `It played ${name(a.card)}.`,
          evidence: [
            {
              text: `${main?.label ?? 'Its [Main] effect'}. It cost ${cost} DON!!; ${Math.max(0, don - cost)} stayed active.`,
              figures: { cost, donAfter: Math.max(0, don - cost) },
            },
          ],
          line: [{ kind: 'play', text: `Play ${name(a.card)}.`, card: c.card }],
          outcome: `${main?.label ?? 'Its effect'}.`,
          term,
        });
      }
      return explainMove({
        claim: `It played ${name(a.card)} for ${cost} DON!!.`,
        evidence: [
          {
            text: `${name(a.card)} has ${c.power ?? 0} power${kw}.`,
            figures: { power: c.power ?? 0 },
          },
          {
            text: `It had ${don} active DON!! and kept ${Math.max(0, don - cost)}.`,
            figures: { donBefore: don, donAfter: Math.max(0, don - cost) },
          },
        ],
        line: [{ kind: 'play', text: `Play ${name(a.card)}.`, card: c.card }],
        outcome: `${name(a.card)} is on its board.`,
        term,
      });
    }
    case 'attack': {
      const at = cardFact(s, a.attacker, setup);
      const tg = cardFact(s, a.target, setup);
      const power = at.power;
      const need = power - tg.power + 1000;
      const by = at.isLeader ? 'its Leader' : at.name;
      const line: Move[] = [];
      if (macroDon > 0)
        line.push({
          kind: 'giveDon',
          text: `Give ${macroDon} DON!! to ${by} (${power}).`,
          card: at.card,
          count: macroDon,
        });
      line.push({
        kind: 'attack',
        text: `Attack ${tg.isLeader ? 'your Leader' : tg.name} with ${by}.`,
        card: at.card,
        target: tg.isLeader ? 'leader' : tg.card,
      });
      if (tg.isLeader) {
        const attackers = legalActions(s).filter(
          (x) => x.type === 'attack' && x.target === a.target,
        );
        const ready = new Set(attackers.map((x) => (x as { attacker: string }).attacker)).size;
        const lethal = yourLife + 1 <= ready;
        return explainMove({
          claim: `It attacked your Leader with ${by} at ${power}.`,
          evidence: [
            {
              text: `Stopping it takes ${stopText(power, tg.power)}.`,
              figures: { attackPower: power, defencePower: tg.power, stopNeeded: need },
            },
            {
              text: `You were at ${yourLife} Life with ${yourHand} ${yourHand === 1 ? 'card' : 'cards'} in hand; it had ${ready} ${ready === 1 ? 'attacker' : 'attackers'} ready.`,
              figures: { yourLife, yourHandSize: yourHand, attackers: ready },
            },
          ],
          line,
          outcome:
            need > 0
              ? `Costs you ${need} of counters, or 1 Life.`
              : 'You can let it fail without a card.',
          term,
          ...(lethal ? { concept: 'lethal-math' } : {}),
          sources: ['CR 7-1-4-1', 'CR 7-1-4-1-1-2', 'SH-MIS'],
        });
      }
      return explainMove({
        claim: `It attacked ${tg.name} with ${by}.`,
        evidence: [
          {
            text: `Saving ${tg.name} (${tg.power}) from ${power} takes ${stopText(power, tg.power)}.`,
            figures: { attackPower: power, defencePower: tg.power, stopNeeded: need },
          },
        ],
        line,
        outcome: `${tg.name} is K.O.'d unless you spend ${need} of counters.`,
        term,
        concept: 'board-vs-face',
        sources: ['CR 7-1-1-2', 'CR 7-1-4-1', 'SH-MIS'],
      });
    }
    case 'giveDon': {
      const t = cardFact(s, a.target, setup);
      const by = t.isLeader ? 'its Leader' : t.name;
      return explainMove({
        claim: `It gave DON!! to ${by}.`,
        evidence: [
          {
            text: `${t.isLeader ? 'Its Leader' : t.name} goes from ${t.power} to ${t.power + 1000}: given DON!! add +1000 each, on its own turn only.`,
            figures: { powerBefore: t.power, powerAfter: t.power + 1000 },
          },
        ],
        line: [{ kind: 'giveDon', text: `Give 1 DON!! to ${by}.`, card: t.card, count: 1 }],
        outcome: `${t.isLeader ? 'Its Leader' : t.name} is 1000 stronger this turn.`,
        term,
        concept: 'don-efficiency',
        sources: ['CR 6-5-5-2', 'SH-DON'],
      });
    }
    case 'activate': {
      const c = cardFact(s, a.card, setup);
      const label =
        (
          SCRIPTS[c.card]?.abilities.find((x) => x.id === a.ability) as
            { label?: string } | undefined
        )?.label ?? 'its ability';
      return explainMove({
        claim: `It used ${c.isLeader ? 'its Leader' : c.name}'s ability.`,
        evidence: [{ text: `${label}.`, figures: {} }],
        line: [{ kind: 'activate', text: `Use ${c.name}: ${label}.`, card: c.card }],
        outcome: `${label}.`,
        term,
        ...(c.isLeader ? { concept: 'leader-identity' } : {}),
      });
    }
    case 'endTurn': {
      const don = queries.don(s, me).active;
      const hand = queries.zone(s, me, 'hand').length;
      return explainMove({
        claim: 'It ended its turn.',
        evidence: [
          {
            text: `It kept ${don} DON!! active and ${hand} cards in hand: nothing else it could do scored higher.`,
            figures: { activeDon: don, aiHandSize: hand },
          },
        ],
        line: [{ kind: 'endTurn', text: 'End the turn.' }],
        outcome: 'Its turn is over.',
        term,
        concept: term === 'counter' || term === 'hand' ? 'hand-management' : 'don-efficiency',
      });
    }
    default:
      return explainMove({
        claim: 'Only legal move.',
        evidence: [],
        line: [],
        outcome: '',
        term: null,
      });
  }
}

/** Explanations of answers to non-main decisions. */
function explainOther(
  s: GameState,
  a: Action,
  me: PlayerId,
  setup: PirateSetup,
  term: WeightKey | 'deck' | 'result' | null,
): Explanation {
  const dec = queries.decision(s)!;
  const f = battleFacts(s, me, setup);
  const pb = setup.playbook;
  if (a.type === 'block' && f) {
    if (a.blocker === null)
      return explainMove({
        claim: 'It did not block this attack.',
        evidence: [
          {
            text: `${f.aiName} was at ${f.aiLife} Life with ${f.aiHand} cards in hand.`,
            figures: { aiLife: f.aiLife, aiHandSize: f.aiHand },
          },
        ],
        line: [{ kind: 'take', text: 'No block.' }],
        outcome: 'Its Blockers stay ready.',
        term,
        concept: 'counters-and-blockers',
      });
    const b = cardFact(s, a.blocker, setup);
    return explainBlock(f, { ...b, hasOnPlay: hasOnPlay(b.card) });
  }
  if ((a.type === 'counter' || (a.type === 'activate' && a.ability === 'counter')) && f) {
    const c = queries.card(s, a.card);
    const card = setup.cards.get(c.card);
    const event = card?.category === 'Event';
    return explainCounter(f, {
      card: c.card,
      name: card?.name ?? c.card,
      value: event ? eventCounterOf(c.card) : (c.counter ?? 0),
      event,
      cost: c.cost ?? 0,
    });
  }
  if (a.type === 'endCounter' && f) return explainTake(f);
  const src = dec.source;
  if (a.type === 'optional' && src) {
    const trick = pb?.leaderTrick;
    const myLeader = queries.zone(s, me, 'leader')[0]!;
    if (
      a.accept &&
      trick &&
      f &&
      src.card === trick.source &&
      src.ability === trick.ability &&
      src.instance === myLeader.instance &&
      f.attacker.isLeader === false
    ) {
      const { amount, donCost } = abilityNumbers(src.card, src.ability);
      const deckAfter = queries.don(s, me).deck + donCost;
      return explainLeaderTrick(f, trick, myLeader.card, amount, donCost, deckAfter);
    }
    const srcName = setup.cards.get(src.card)?.name ?? src.card;
    const own = src.instance === myLeader.instance ? 'its Leader' : srcName;
    const effect = src.label ? `${src.label.charAt(0).toLowerCase()}${src.label.slice(1)}` : null;
    return explainMove({
      claim: a.accept ? `It used ${own}'s effect.` : `It held ${own}'s effect back.`,
      evidence: effect ? [{ text: `The effect: ${effect}.`, figures: {} }] : [],
      line: [
        {
          kind: 'activate',
          text: a.accept ? `Use ${own}'s effect.` : `Skip ${own}'s effect this time.`,
          card: src.card,
        },
      ],
      outcome: a.accept
        ? effect
          ? `It chose to ${effect}.`
          : 'The effect resolves.'
        : 'The effect stays unused.',
      term,
    });
  }
  if (a.type === 'trigger') {
    return explainMove({
      claim: a.activate
        ? 'It used the [Trigger] on its Life card.'
        : 'It added its Life card to its hand.',
      evidence: [],
      line: [{ kind: 'trigger', text: a.activate ? 'Use the [Trigger].' : 'Add it to hand.' }],
      outcome: a.activate ? 'The [Trigger] resolves.' : 'One more card in its hand.',
      term,
      concept: 'life-as-resource',
      sources: ['CR 10-1-5'],
    });
  }
  if (a.type === 'pick') {
    const ch = a.choice;
    let what: string;
    if (typeof ch === 'string') {
      const c = queries.card(s, ch);
      // Only cards both players can see are named (flows D9).
      what = ['characters', 'leader', 'stage', 'trash'].includes(c.zone)
        ? c.zone === 'leader'
          ? c.owner === me
            ? 'its Leader'
            : 'your Leader'
          : (setup.cards.get(c.card)?.name ?? 'a card')
        : 'a card';
    } else if ('option' in ch)
      what = dec.options?.find((o) => o.id === ch.option)?.label ?? 'an option';
    else
      what =
        ch.from === 'given'
          ? 'a given DON!!'
          : ch.from === 'costRested'
            ? 'a rested DON!!'
            : 'an active DON!!';
    const srcName = src ? (setup.cards.get(src.card)?.name ?? src.card) : 'its effect';
    return explainMove({
      claim: `It chose ${what} for ${srcName}.`,
      evidence: src?.label ? [{ text: `${src.label}.`, figures: {} }] : [],
      line: [{ kind: 'choose', text: `Choose ${what}.` }],
      outcome: `${what.charAt(0).toUpperCase() + what.slice(1)} chosen.`,
      term,
    });
  }
  return explainMove({
    claim: a.type === 'done' ? 'It finished choosing.' : 'It chose the order of its effects.',
    evidence: [],
    line: [{ kind: 'choose', text: a.type === 'done' ? 'Done.' : 'Choose the order.' }],
    outcome: '',
    term,
  });
}

export function forced(): Explanation {
  return explainMove({
    claim: 'Only legal move.',
    evidence: [],
    line: null,
    outcome: '',
    term: null,
  });
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
    const ranked = score(states, cands, me, ctx, clock, true, mainBias(root, me, ctx, setup));
    setup.debug?.(
      'main',
      ranked.map((r) => ({ actions: r.c.actions, mean: r.mean, n: r.n, breakdown: r.breakdown })),
    );
    if (clock.cut) incomplete = true;
    let chosen: Candidate;
    let term: ReturnType<typeof topTerm> = null;
    if (ranked.length === 0) {
      chosen = { actions: [quickAction(root, ctx)] };
      incomplete = true;
    } else {
      chosen = ranked[0]!.c;
      const isEnd = chosen.actions[0]!.type === 'endTurn';
      const alt = ranked.find((r) => (r.c.actions[0]!.type === 'endTurn') !== isEnd) ?? ranked[1];
      term = topTerm(ranked[0]!, alt);
    }
    const macroDon = chosen.actions.filter((a) => a.type === 'giveDon').length;
    const isAttackMacro = chosen.actions[chosen.actions.length - 1]!.type === 'attack';
    // A DON!!-then-attack move is explained once, with the attack's final power.
    let macroExplanation: Explanation | null = null;
    if (isAttackMacro && macroDon > 0) {
      let s = states[0]!;
      for (const a of chosen.actions.slice(0, -1)) s = apply(s, a, ctx);
      macroExplanation = explainMainAction(
        s,
        chosen.actions[chosen.actions.length - 1]!,
        me,
        setup,
        term,
        macroDon,
      );
    }
    for (let i = 0; i < chosen.actions.length; i++) {
      const a = chosen.actions[i]!;
      const s0 = states[0]!;
      const stepFp = i === 0 ? fp : fingerprint(project(s0, me));
      const va = toView(a, handles);
      if (!va) {
        stop = true;
        break;
      }
      const explanation: Explanation = macroExplanation
        ? structuredClone(macroExplanation)
        : explainMainAction(s0, a, me, setup, term, 0);
      if (macroExplanation && a.type === 'giveDon') {
        // A DON!! given for the attack that follows: the line shows the whole move.
        const t = cardFact(s0, a.target, setup);
        explanation.claim = `It gave DON!! to ${t.isLeader ? 'its Leader' : t.name} for its attack.`;
      }
      if (incomplete) explanation.certainty = 'search-incomplete';
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

function mulligan(view: PlayerView, setup: PirateSetup): PirateDecision {
  const pb = setup.playbook;
  const hand = view.zones[view.player].hand.map((c) => setup.cards.get(c.card ?? ''));
  const first = view.turn.activePlayer === view.player;
  let keep = true;
  if (pb) {
    const m = pb.mulligan;
    const early = hand.filter(
      (c) =>
        c?.category === 'Character' &&
        (c.cost ?? 99) >= m.early.costMin &&
        (c.cost ?? 99) <= m.early.costMax,
    ).length;
    const plan = hand.some((c) => c && m.planPieces.includes(c.id));
    const counters = hand.filter((c) => counterValueOf(c) > 0).length;
    const yeses = Number(early >= m.early.min) + Number(plan) + Number(counters >= m.minCounters);
    keep = yeses >= m.yesesToKeep - (first ? 0 : 1);
    if (first && m.requireEarlyGoingFirst && early < m.early.min) keep = false;
  }
  const action = view.actions.find((a) => a.type === 'mulligan' && a.redraw === !keep)!;
  return {
    action,
    explanation: explainMove({
      claim: keep ? 'It kept its opening hand.' : 'It redrew its opening hand.',
      evidence: [
        {
          text: "Its guide's rule: keep a hand that can act on its first two turns, holds a piece of its plan and can defend. Two of the three is a keep.",
          figures: {},
        },
      ],
      line: [{ kind: keep ? 'keep' : 'redraw', text: keep ? 'Keep.' : 'Redraw all five.' }],
      outcome: keep ? 'It plays the hand it drew.' : 'A fresh five cards.',
      term: null,
      concept: 'mulligan',
      sources: ['CR 5-2-1-6', 'SH-MUL'],
    }),
    alternatives: [],
    stats: { rollouts: 0, actions: 0, planned: false },
  };
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
        outcome: '',
        term: null,
        concept: 'turn-order',
        sources: ['CR 6-3-1', 'CR 6-4-1', 'CR 6-5-6-1'],
      }),
      alternatives: [],
      stats: { rollouts: 0, actions: 0, planned: false },
    };
  }
  if (options.length === 1)
    return {
      action: options[0]!,
      explanation: forced(),
      alternatives: [],
      stats: { rollouts: 0, actions: 0, planned: false },
    };

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
    const end = options.find((a) => a.type === 'endTurn') ?? options[0]!;
    return {
      action: end,
      explanation: forced(),
      alternatives: [],
      stats: { ...stats, planned: false },
    };
  }

  // A defence already chosen for this battle continues while it is legal.
  const battle = (view as ProjectedView).battle;
  const key = battle ? `${view.turn.number}|${battle.attacker}|${battle.target}` : '';
  if (
    kind === 'counter' &&
    mem.defence &&
    mem.defence.key === key &&
    mem.defence.actions.length > 0
  ) {
    const a = mem.defence.actions[0]!;
    if (options.some((o) => same(o, a))) {
      mem.defence.actions.shift();
      return {
        action: a,
        explanation: mem.defence.explanation,
        alternatives: [],
        stats: { rollouts: 0, actions: 0, planned: true },
      };
    }
  }
  mem.defence = null;

  const me = view.player;
  const ctx = simContext(view, setup);
  const clock = clockFor(budgets.defence, ctx, setup.now);
  const states = determinizations(view, setup, setup.k, seed);
  const root = states[0]!;
  const cands =
    kind === 'counter'
      ? counterCandidates(root, me, setup)
      : legalActions(root)
          .filter((a) => a.type !== 'concede')
          .map((a) => ({ actions: [a] }));
  const ranked = score(states, cands, me, ctx, clock, false, otherBias(root, me, setup));
  const best = ranked[0];
  const chosen = best?.c ?? cands[0]!;
  const action = toView(chosen.actions[0]!, view.skeleton.handles) ?? options[0]!;
  const explanation = explainOther(
    root,
    chosen.actions[0]!,
    me,
    setup,
    best ? topTerm(best, ranked[1]) : null,
  );
  if (clock.cut) explanation.certainty = 'search-incomplete';
  if (kind === 'counter' && chosen.actions.length > 1) {
    const rest = chosen.actions.slice(1).map((a) => toView(a, view.skeleton.handles));
    if (rest.every((x) => x !== null))
      mem.defence = { key, actions: rest as Action[], explanation };
  }
  const alternatives = ranked
    .slice(1, 4)
    .map((r) => toView(r.c.actions[0]!, view.skeleton.handles))
    .filter((x): x is Action => x !== null);
  return {
    action,
    explanation,
    alternatives,
    stats: { ...ctx.stats, planned: false, value: best?.mean ?? 0 },
  };
}
