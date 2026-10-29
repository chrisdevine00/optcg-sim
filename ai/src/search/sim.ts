/**
 * Simulation on determinized states (ARCHITECTURE §4.2): quick policies for every decision kind and
 * rollouts to the start of the next turn. The Pirate planner scores each candidate move by applying
 * it, letting these policies play out the forced follow-ups and the rest of the turn, and evaluating
 * the position the other player then faces.
 *
 * The quick policies are deliberately simple and cheap (no evaluation inside them):
 * - **Main (the finisher):** spread the active DON!! over the attackers, weakest first, then attack
 *   the opponent's Leader with each, weakest first ("send the hardest-to-stop last", §8), then end
 *   the turn. No plays: the planner decides plays.
 * - **Block / Counter (the defence):** defend lethal always; at 1–2 Life defend a hit that one or
 *   two cards stop; save an expensive Character from a cheap attack. Never play a Counter that does
 *   not change the result (strategy-concepts §4: "a Counter that only matches is a wasted card").
 * - **Choices:** costs take the least useful card; effects on the opponent pick their strongest
 *   Character (the attacker, in a battle); effects on your own cards pick the card in the battle.
 */
import type { Card } from '@optcg/cards';
import {
  legalActions,
  queries,
  reduce,
  type Action,
  type CardView,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import { counterValueOf } from '../knowledge.ts';
import { evaluate, total, type Breakdown, type EvalContext } from './heuristic.ts';

export interface SimContext {
  cards: ReadonlyMap<string, Card>;
  evalCtx: EvalContext;
  stats: { rollouts: number; actions: number };
}

/** A rollout stops after this many actions (games cap at 2,000; a turn is far fewer). */
const ROLLOUT_CAP = 400;

/**
 * The quick defence's thresholds (review M5a-09). Directions from strategy-concepts.md; every number
 * is an inference, untested on its own (they steer rollouts, not the AI's own decisions, which are
 * scored by search):
 * - §3/§4: "always defend lethal"; "near zero Life, counter everything" [S38]; "below two Life,
 *   block by default" [S40]. So at 1 Life it stops any hit that 2 cards of +2000 stop
 *   (`needAtOne`), at 2 Life a hit one +2000 card stops (`needAtTwo`), and above that none.
 * - §4 "counter to save a Character only if it has an important ongoing effect" [S7]: a Character
 *   costing `saveCost` or more, if one +2000 card saves it (`saveNeed`).
 * - §5 a Blocker "whose job is done": block at 2 Life or less with one costing `blockCost` or less.
 * - Paying a cost: the card least worth keeping, scored by its Counter (per 1000), its cost
 *   (`keepPerCost`) and the playbook's value for it.
 */
export const QUICK = {
  needAtOne: 4000,
  needAtTwo: 2000,
  saveCost: 5,
  saveNeed: 2000,
  blockCost: 4,
  keepPerCost: 0.1,
} as const;

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

export function apply(s: GameState, a: Action, ctx: SimContext): GameState {
  ctx.stats.actions++;
  return reduce(s, a).state;
}

function decider(s: GameState): PlayerId | null {
  return queries.decision(s)?.player ?? null;
}

/** Defensive value of a Counter action ([Counter] Events by their +power). */
function counterOfAction(s: GameState, a: Action, ctx: SimContext): number {
  if (a.type === 'counter') return queries.card(s, a.card).counter ?? 0;
  if (a.type === 'activate' && a.ability === 'counter')
    return counterValueOf(ctx.cards.get(queries.card(s, a.card).card));
  return 0;
}

/** What one card in hand is worth keeping (for paying costs with the least useful one). */
function keepValue(c: CardView, ctx: SimContext): number {
  const card = ctx.cards.get(c.card);
  const counter = card?.category === 'Event' ? counterValueOf(card) : (c.counter ?? 0);
  return (
    counter / 1000 +
    (c.cost ?? 0) * QUICK.keepPerCost +
    (ctx.evalCtx.playbook?.cardValue[c.card] ?? 0)
  );
}

/** The battle as numbers: attacker and target power, and the Counter needed to stop it. */
export function battleNumbers(s: GameState) {
  const b = queries.battle(s);
  if (!b) return null;
  const attacker = queries.card(s, b.attacker);
  const target = queries.card(s, b.target);
  const attack = attacker.power ?? 0;
  const defence = target.power ?? 0;
  return { b, attacker, target, attack, defence, need: attack - defence + 1000 };
}

/** Should the defender stop this attack, if it can (the quick defence rule above)? */
function worthDefending(s: GameState, need: number, ctx: SimContext): boolean {
  const n = battleNumbers(s)!;
  if (n.target.zone === 'leader') {
    const life = queries.zone(s, n.target.owner, 'life').length;
    if (life === 0) return true;
    if (life === 1) return need <= QUICK.needAtOne;
    if (life === 2) return need <= QUICK.needAtTwo;
    return false;
  }
  return (n.target.cost ?? 0) >= QUICK.saveCost && need <= QUICK.saveNeed && ctx !== null;
}

/** The next Counter to play toward `need`, or null when the hand cannot reach it. */
function nextCounter(
  s: GameState,
  options: Action[],
  need: number,
  ctx: SimContext,
): Action | null {
  const valued = options
    .map((a) => ({ a, v: counterOfAction(s, a, ctx) }))
    .filter((x) => x.v > 0)
    .sort((x, y) => x.v - y.v);
  const sum = valued.reduce((t, x) => t + x.v, 0);
  if (sum < need) return null;
  return (valued.find((x) => x.v >= need) ?? valued[valued.length - 1]!).a;
}

/** Quick policy: one action for whoever owes the decision. */
export function quickAction(s: GameState, ctx: SimContext): Action {
  const dec = queries.decision(s)!;
  const p = dec.player;
  const acts = legalActions(s).filter((a) => a.type !== 'concede');
  const first = acts[0]!;
  switch (dec.kind) {
    case 'chooseFirst':
      return acts.find((a) => a.type === 'chooseFirst' && !a.goFirst) ?? first;
    case 'mulligan':
      return acts.find((a) => a.type === 'mulligan' && !a.redraw) ?? first;
    case 'main':
      return finisher(s, p, acts);
    case 'block': {
      const n = battleNumbers(s);
      const none = acts.find((a) => a.type === 'block' && a.blocker === null) ?? first;
      if (!n || n.target.zone !== 'leader' || n.attack < n.defence) return none;
      const life = queries.zone(s, p, 'life').length;
      const blockers = acts
        .filter(
          (a): a is Extract<Action, { type: 'block' }> => a.type === 'block' && a.blocker !== null,
        )
        .map((a) => ({ a, c: queries.card(s, a.blocker!) }))
        .sort((x, y) => (x.c.cost ?? 0) - (y.c.cost ?? 0));
      if (blockers.length === 0) return none;
      if (life === 0) return blockers[0]!.a;
      if (life <= 2 && (blockers[0]!.c.cost ?? 0) <= QUICK.blockCost) return blockers[0]!.a;
      return none;
    }
    case 'counter': {
      const done = acts.find((a) => a.type === 'endCounter') ?? first;
      const n = battleNumbers(s);
      if (!n || n.need <= 0 || !worthDefending(s, n.need, ctx)) return done;
      return nextCounter(s, acts, n.need, ctx) ?? done;
    }
    case 'trigger':
      return acts.find((a) => a.type === 'trigger' && a.activate) ?? first;
    case 'optional':
      return acts.find((a) => a.type === 'optional' && a.accept) ?? first;
    case 'order':
      return first;
    case 'choose':
      return quickChoose(s, p, acts, ctx);
  }
  return first;
}

function finisher(s: GameState, p: PlayerId, acts: Action[]): Action {
  const end = acts.find((a) => a.type === 'endTurn')!;
  const oppLeader = queries.zone(s, other(p), 'leader')[0]!.instance;
  const attacks = acts.filter(
    (a): a is Extract<Action, { type: 'attack' }> => a.type === 'attack' && a.target === oppLeader,
  );
  if (attacks.length === 0) return end;
  const power = (id: string) => queries.card(s, id).power ?? 0;
  const weakest = attacks.reduce((x, y) => (power(y.attacker) < power(x.attacker) ? y : x));
  if (queries.don(s, p).active > 0) {
    const give = acts.find((a) => a.type === 'giveDon' && a.target === weakest.attacker);
    if (give) return give;
  }
  return weakest;
}

function quickChoose(s: GameState, p: PlayerId, acts: Action[], ctx: SimContext): Action {
  const dec = queries.decision(s)!;
  const done = acts.find((a) => a.type === 'done');
  const picks = acts.filter((a): a is Extract<Action, { type: 'pick' }> => a.type === 'pick');
  if (picks.length === 0) return done ?? acts[0]!;
  // A cost, or making room in a full Character area: give up the least useful card.
  const isCost = dec.purpose === 'cost' || dec.purpose === 'characterLimit';
  // A cost: pay only what is required. Anything else: take as many as allowed.
  if (done && (isCost ? (dec.min ?? 0) === 0 : (dec.max ?? 1) === 0)) return done;
  const b = queries.battle(s);
  const score = (a: Extract<Action, { type: 'pick' }>): number => {
    const ch = a.choice;
    if (typeof ch !== 'string') {
      if ('option' in ch) return 0;
      // DON!! for a cost: rested first, then active, then given.
      return ch.from === 'costRested' ? 3 : ch.from === 'costActive' ? 2 : 1;
    }
    const c = queries.card(s, ch);
    if (isCost)
      return c.zone === 'hand'
        ? -keepValue(c, ctx)
        : -(
            (c.power ?? 0) / 1000 +
            (c.cost ?? 0) / 2 +
            (ctx.evalCtx.playbook?.cardValue[c.card] ?? 0)
          ) - 2;
    const mine = c.owner === p;
    const inBattle = b && (b.attacker === ch || b.target === ch) ? 10 : 0;
    const strength = (c.power ?? 0) / 1000 + (c.cost ?? 0) / 2;
    return mine ? inBattle + strength : inBattle + strength;
  };
  let best = picks[0]!;
  let bestScore = score(best);
  for (const a of picks.slice(1)) {
    const v = score(a);
    if (v > bestScore) {
      best = a;
      bestScore = v;
    }
  }
  return best;
}

/**
 * Play on with the quick policies until the turn after `fromTurn` reaches its Main Phase (or the
 * game ends), then return that position.
 */
export function rollout(s0: GameState, fromTurn: number, ctx: SimContext): GameState {
  let s = s0;
  for (let i = 0; i < ROLLOUT_CAP; i++) {
    if (queries.result(s)) return s;
    const dec = queries.decision(s);
    if (!dec) return s;
    if (dec.kind === 'main' && queries.turn(s).number > fromTurn) return s;
    s = apply(s, quickAction(s, ctx), ctx);
  }
  return s;
}

/**
 * Resolve the follow-ups of a move: quick policies for every decision until `me` owes a Main
 * decision again (or the turn passes, or the game ends).
 */
export function settle(s0: GameState, me: PlayerId, ctx: SimContext): GameState {
  let s = s0;
  const turn = queries.turn(s).number;
  for (let i = 0; i < ROLLOUT_CAP; i++) {
    if (queries.result(s)) return s;
    const dec = queries.decision(s);
    if (!dec) return s;
    if (dec.kind === 'main' && (dec.player === me || queries.turn(s).number !== turn)) return s;
    s = apply(s, quickAction(s, ctx), ctx);
  }
  return s;
}

/**
 * The value of a position after a rollout to the Main Phase of the turn after `fromTurn` (the turn
 * the decision was made in, so every candidate is judged at the same point), with its breakdown.
 */
export function rolloutValue(
  s: GameState,
  fromTurn: number,
  ctx: SimContext,
): { value: number; breakdown: Breakdown } {
  ctx.stats.rollouts++;
  const end = rollout(s, fromTurn, ctx);
  const breakdown = evaluate(end, ctx.evalCtx);
  return { value: total(breakdown), breakdown };
}

export { decider, other };
