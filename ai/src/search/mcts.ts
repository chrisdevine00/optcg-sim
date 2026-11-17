/**
 * Information-set MCTS over the AI's turn (ADR 0008; ARCHITECTURE §4.1, §4.2).
 *
 * **What a node is.** A node is a *macro move* in the turn plan: one play or activation (with the
 * first prompt it raises already answered), or one attack after giving it 0..N DON!!. Because the
 * AI's own moves are the only branching, and everything hidden (the opponent's hand, their Life
 * cards, both decks) is fixed by the determinization, a path from the root is a turn plan and
 * the tree needs no chance nodes. The statistics are kept per determinization, so the same tree
 * answers "what is best given the determinizations still consistent with what I now see".
 *
 * **One iteration.** Take the next determinization (round-robin over the active ones), descend by
 * UCB over the macro moves legal there, add one new node, play the rest of the turn out with the
 * quick finisher policy and the opponent's next turn with the quick policies (`sim.ts`), evaluate
 * the position by the heuristic (`heuristic.ts`), and back the value up. Values are squashed so a
 * win (1000) does not drown the heuristic's card units.
 *
 * **Move ordering and widening.** Moves are tried in a prior order (the playbook's bias, then a
 * structural rule: plays, then attacks on the Leader with all DON!!, then fewer DON!!, then ending
 * the turn). Only the first `ceil(W0 * n^WA)` are eligible at a node with `n` visits (progressive
 * widening), so DON!! allocations beyond "all" and "none" are tried as the node earns its visits.
 *
 * **Reuse.** After the AI acts, the tree is kept: the determinizations whose simulated outcome
 * matches what the AI now sees stay active (`consistent`), the rest are dropped with their
 * statistics, and the search continues from the node the AI is at. Nothing from a dropped
 * determinization is used, so nothing of what the AI could not see leaks into the choice.
 */
import { SCRIPTS } from '@optcg/cards';
import {
  legalActions,
  project,
  queries,
  type Action,
  type GameState,
  type PlayerId,
  type PlayerView,
} from '@optcg/engine';
import { evaluate, total } from './heuristic.ts';
import { apply, quickAction, settle, type SimContext } from './sim.ts';
import {
  discountPays,
  fingerprint,
  holdDon,
  mainBias,
  otherBias,
  same,
  unneededDiscount,
  type Budget,
  type Candidate,
  type PirateSetup,
} from './pirate.ts';

/**
 * Search constants (tuned against Pirate, docs/benchmarks.md "Warlord tuning"): UCB exploration on
 * squashed values (range -1..1), the squash scale in card units (tanh(v / squash)), and
 * progressive widening (eligible moves = ceil(w0 * visits ^ wa), at least `minWidth`).
 */
export const TUNE = { ucb: 0.25, squash: 12, w0: 2, wa: 0.5, minWidth: 3 };
/** The turn plan's depth cap (macro moves). */
const MAX_PLIES = 40;
/** Iterative deepening: tree-depth caps per stage and the share of the budget each stage ends at. */
export const DEEPENING = [
  { depth: 3, until: 0.2 },
  { depth: 6, until: 0.45 },
  { depth: 12, until: 0.7 },
  { depth: MAX_PLIES, until: 1 },
] as const;

const strip = ({ intentId: _i, ...a }: Action) => a;
export const keyOf = (c: Candidate): string => JSON.stringify(c.actions.map(strip));
const squash = (v: number): number => Math.tanh(v / TUNE.squash);

// ------------------------------------------------------------------------------------------------
// Candidates: what the AI can do at a Main decision, for the tree
// ------------------------------------------------------------------------------------------------

function scriptMentions(cardId: string, words: string[]): boolean {
  const json = JSON.stringify(SCRIPTS[cardId]?.abilities ?? []);
  return words.some((w) => json.includes(w));
}

/** Prompts bundled into one macro move, and the macros one play or activation may expand to. */
const MAX_PROMPTS = 3;
const MAX_MACROS = 12;

/**
 * The prompts a play or activation raises, as one macro per combination of answers: every count of
 * a "give up to N DON!!" (so the search can give fewer, review M4b-03: a DON!! kept may pay a later
 * cost), up to three targets of another choice, and the same again for a second and third prompt
 * (a mode, then a target), so the tree plans on past the whole effect and not past its first
 * question only. Each answer is scored with the playbook's pick biases (`otherBias`:
 * targetHighestPower, preferPick, targetCanAttack, pickWithTrigger, avoidTarget...) and a macro's
 * prior is `mainBias` of the move plus the sum of its answers' biases (review M5b-1). The quick
 * policy's pick breaks ties.
 */
function withPrompts(
  s: GameState,
  a: Action,
  me: PlayerId,
  ctx: SimContext,
  setup: PirateSetup,
): Candidate[] {
  if (a.type !== 'playCard' && !(a.type === 'activate' && a.ability !== 'counter'))
    return [{ actions: [a] }];
  let s1: GameState;
  try {
    s1 = apply(s, a, ctx);
  } catch {
    return [{ actions: [a] }];
  }
  const out: Candidate[] = [];
  const grow = (st: GameState, acts: Action[], bias: number): void => {
    const d = queries.decision(st);
    const picks =
      d && d.player === me && d.kind === 'choose' && acts.length <= MAX_PROMPTS
        ? legalActions(st).filter((x): x is Extract<Action, { type: 'pick' }> => x.type === 'pick')
        : [];
    if (picks.length < 2 || out.length >= MAX_MACROS) {
      out.push({ actions: acts, ...(bias ? { pickBias: bias } : {}) });
      return;
    }
    const q = quickAction(st, ctx);
    const pickBias = otherBias(st, me, setup);
    const scored = [q, ...picks.filter((p) => !same(p, q))].map((p) => ({
      p,
      b: pickBias({ actions: [p] }),
    }));
    scored.sort((x, y) => y.b - x.b); // stable: no bias, the quick policy's order
    for (const { p, b } of scored.slice(0, d!.purpose === 'mode' ? 12 : 3)) {
      let st2: GameState;
      try {
        st2 = apply(st, p, ctx);
      } catch {
        continue;
      }
      grow(st2, [...acts, p], bias + b);
    }
  };
  grow(s1, [a], 0);
  return out.length ? out : [{ actions: [a] }];
}

/**
 * Candidate macro moves at a Main decision. Like Pirate's (`pirate.ts`, `mainCandidates`) but an
 * attack is offered after giving it every count of DON!!, 0..all, and plays and activations carry
 * their first prompt's answers. Moves that cannot matter are left out.
 */
export function treeCandidates(
  s: GameState,
  me: PlayerId,
  ctx: SimContext,
  setup: PirateSetup,
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
      const ks = give ? Array.from({ length: don + 1 }, (_, k) => k) : [0];
      for (const k of ks) {
        if ((at.power ?? 0) + 1000 * k < tp && !trigger) continue;
        out.push({ actions: [...Array.from({ length: k }, () => give!), a] });
      }
    } else if (a.type === 'giveDon') {
      const t = queries.card(s, a.target);
      if (attackers.has(a.target) || scriptMentions(t.card, ['donGiven']))
        out.push({ actions: [a] });
    } else if (unneededDiscount(s, me, a, setup, true)) {
      // Left out (playbook `activateBefore`): a DON!! -1 no card in hand needs.
    } else out.push(...withPrompts(s, a, me, ctx, setup));
  }
  // "Use the ability, then play the card" as one move (playbook `activateBefore`).
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
      if (!discountPays(s, me, h, bias, true) || seen.has(h.card)) continue;
      seen.add(h.card);
      out.push({ actions: [act, { type: 'playCard', card: h.instance, player: me }] });
    }
  }
  return holdDon(out.length ? out : acts.map((a) => ({ actions: [a] })), s, me, ctx, setup);
}

/** The structural part of the move-ordering prior (higher first); the playbook's bias is added. */
function structural(s: GameState, c: Candidate, don: number): number {
  const a = c.actions[0]!;
  const last = c.actions[c.actions.length - 1]!;
  if (last.type === 'attack') {
    const k = c.actions.length - 1;
    const atLeader = queries.card(s, last.target).zone === 'leader';
    const allIn = don > 0 && k === don ? 0.5 : k === 0 ? 0.4 : 0.1 * (1 - k / (don + 1));
    return (atLeader ? 2 : 1) + allIn;
  }
  if (a.type === 'playCard') return 3 + (queries.card(s, a.card).cost ?? 0) / 20;
  if (a.type === 'activate') return 2.5;
  if (a.type === 'endTurn') return -1;
  return 0.5;
}

// ------------------------------------------------------------------------------------------------
// The tree
// ------------------------------------------------------------------------------------------------

export interface TreeNode {
  cand: Candidate | null;
  key: string;
  parent: TreeNode | null;
  kids: Map<string, TreeNode>;
  /** Per determinization: visits, squashed value sum, raw (card unit) value sum. */
  n: number[];
  sum: number[];
  raw: number[];
  /** The state after this node's moves, per determinization (null: not legal there). */
  states: (GameState | null | undefined)[];
  /** Per determinization: this move was not legal there. */
  dead: boolean[];
  info: (Info | undefined)[];
}

interface Info {
  cands: Candidate[];
  keys: string[];
  /** Indices into `cands`, best prior first. */
  order: number[];
  bias: number[];
}

function newNode(cand: Candidate | null, parent: TreeNode | null, k: number): TreeNode {
  return {
    cand,
    key: cand ? keyOf(cand) : '',
    parent,
    kids: new Map(),
    n: new Array<number>(k).fill(0),
    sum: new Array<number>(k).fill(0),
    raw: new Array<number>(k).fill(0),
    states: new Array<GameState | null | undefined>(k).fill(undefined),
    dead: new Array<boolean>(k).fill(false),
    info: new Array<Info | undefined>(k).fill(undefined),
  };
}

/** Play a macro's actions in one state, resolving follow-ups after the last (and not between). */
export function playMacro(
  s0: GameState,
  c: Candidate,
  me: PlayerId,
  ctx: SimContext,
): GameState | null {
  let s = s0;
  for (let i = 0; i < c.actions.length; i++) {
    if (i > 0) {
      const d = queries.decision(s);
      if (!d || d.player !== me) return s;
    }
    try {
      s = apply(s, c.actions[i]!, ctx);
    } catch {
      return i === 0 ? null : s;
    }
    // Between two moves of a macro the quick policies resolve what the first raised, unless the
    // next move is itself the answer to a prompt (a pick).
    const next = c.actions[i + 1];
    if (next && next.type !== 'pick') s = settle(s, me, ctx);
  }
  return settle(s, me, ctx);
}

/** Play on with the quick policies until the Main Phase of turn `until` (or the game ends). */
export function rolloutUntil(s0: GameState, until: number, ctx: SimContext): GameState {
  let s = s0;
  for (let i = 0; i < 600; i++) {
    if (queries.result(s)) return s;
    const dec = queries.decision(s);
    if (!dec) return s;
    if (dec.kind === 'main' && queries.turn(s).number >= until) return s;
    s = apply(s, quickAction(s, ctx), ctx);
  }
  return s;
}

export interface MctsOptions {
  me: PlayerId;
  ctx: SimContext;
  setup: PirateSetup;
  /** The determinized root states. */
  dets: GameState[];
  /** How many of the opponent's and the AI's turns the leaf looks ahead: 1 = the position the opponent faces, 2 = after the opponent's turn. */
  horizon?: 1 | 2;
  /** Iterative deepening (Emperor). */
  deepening?: boolean;
}

export class Mcts {
  readonly me: PlayerId;
  readonly ctx: SimContext;
  readonly setup: PirateSetup;
  readonly k: number;
  readonly fromTurn: number;
  readonly horizon: number;
  readonly deepening: boolean;
  root: TreeNode;
  /** Determinizations still consistent with what the AI sees. */
  active: number[];
  iterations = 0;
  private maxDepth = MAX_PLIES;

  constructor(o: MctsOptions) {
    this.me = o.me;
    this.ctx = o.ctx;
    this.setup = o.setup;
    this.k = o.dets.length;
    this.horizon = o.horizon ?? 2;
    this.deepening = o.deepening ?? false;
    this.root = newNode(null, null, this.k);
    this.active = o.dets.map((_, i) => i);
    this.fromTurn = queries.turn(o.dets[0]!).number;
    o.dets.forEach((s, i) => (this.root.states[i] = s));
  }

  // -- statistics over the active determinizations ------------------------------------------------

  aggN(nd: TreeNode): number {
    let n = 0;
    for (const d of this.active) n += nd.n[d]!;
    return n;
  }
  /**
   * The node's mean value over the active determinizations, **net of each determinization's own
   * mean at the root** (a control variate). Determinizations differ a lot in how good they are
   * for the AI (what the opponent happens to hold); a move visited under the kind ones would look
   * better than one visited under the harsh ones. Measuring each visit against the root's mean
   * under the same determinization compares the moves as if all were tried in all of them.
   */
  aggMean(nd: TreeNode): number {
    let n = 0;
    let s = 0;
    for (const d of this.active) {
      const k = nd.n[d]!;
      if (k === 0) continue;
      const rn = this.root.n[d]!;
      const base = rn ? this.root.sum[d]! / rn : 0;
      n += k;
      s += nd.sum[d]! - k * base;
    }
    return n ? s / n : 0;
  }
  /** Mean value in heuristic card units (1000 = a win in every sample). */
  aggRaw(nd: TreeNode): number {
    let n = 0;
    let s = 0;
    for (const d of this.active) {
      n += nd.n[d]!;
      s += nd.raw[d]!;
    }
    return n ? s / n : 0;
  }

  // -- states and candidates -----------------------------------------------------------------------

  stateOf(nd: TreeNode, d: number): GameState | null {
    const have = nd.states[d];
    if (have !== undefined) return have;
    const ps = nd.parent ? this.stateOf(nd.parent, d) : null;
    const s = ps && nd.cand ? playMacro(ps, nd.cand, this.me, this.ctx) : null;
    nd.states[d] = s;
    if (!s) nd.dead[d] = true;
    return s;
  }

  private infoOf(nd: TreeNode, d: number, s: GameState): Info {
    const have = nd.info[d];
    if (have) return have;
    const cands = treeCandidates(s, this.me, this.ctx, this.setup);
    const main = mainBias(s, this.me, this.ctx, this.setup);
    // A macro's bias = the move's own (mainBias) + its bundled prompt answer's (otherBias).
    const bias = (c: Candidate): number => main(c) + (c.pickBias ?? 0);
    const don = queries.don(s, this.me).active;
    const prior = cands.map((c) => bias(c) * 4 + structural(s, c, don));
    const order = cands.map((_, i) => i).sort((x, y) => prior[y]! - prior[x]! || x - y);
    const info: Info = { cands, keys: cands.map(keyOf), order, bias: cands.map(bias) };
    nd.info[d] = info;
    return info;
  }

  // -- search --------------------------------------------------------------------------------------

  /** Run until the budget is spent. Returns the iterations run. */
  search(budget: Budget): number {
    const start = this.setup.now();
    const r0 = this.iterations;
    const limit = 'iterations' in budget ? budget.iterations : budget.ms;
    const used = () => ('iterations' in budget ? this.iterations - r0 : this.setup.now() - start);
    const stages = this.deepening ? DEEPENING : [{ depth: MAX_PLIES, until: 1 }];
    for (const st of stages) {
      this.maxDepth = st.depth;
      const cut = limit * st.until;
      while (used() < cut && this.active.length > 0) {
        this.iterate(this.active[this.iterations % this.active.length]!);
      }
    }
    this.maxDepth = MAX_PLIES;
    return this.iterations - r0;
  }

  private iterate(d: number): void {
    const { me, ctx } = this;
    let node = this.root;
    let state = this.stateOf(node, d);
    if (!state) {
      this.iterations++;
      return;
    }
    const path: TreeNode[] = [node];
    let bias = 0;
    let depth = 0;
    for (;;) {
      const dec = queries.decision(state);
      if (
        queries.result(state) ||
        !dec ||
        dec.kind !== 'main' ||
        dec.player !== me ||
        queries.turn(state).number !== this.fromTurn ||
        depth >= this.maxDepth
      )
        break;
      const info = this.infoOf(node, d, state);
      if (info.cands.length === 0) break;
      const visits = this.aggN(node);
      const width = Math.max(TUNE.minWidth, Math.ceil(TUNE.w0 * Math.pow(visits + 1, TUNE.wa)));
      const limit = Math.min(width, info.order.length);
      let pick = -1;
      let best = -Infinity;
      let fresh = -1;
      const lnN = Math.log(visits + 1);
      for (let r = 0; r < limit; r++) {
        const i = info.order[r]!;
        const kid = node.kids.get(info.keys[i]!);
        if (kid?.dead[d]) continue;
        const kn = kid ? this.aggN(kid) : 0;
        if (kn === 0) {
          fresh = i;
          break;
        }
        const u = this.aggMean(kid!) + TUNE.ucb * Math.sqrt(lnN / kn);
        if (u > best) {
          best = u;
          pick = i;
        }
      }
      if (fresh >= 0) pick = fresh;
      if (pick < 0) break;
      const key = info.keys[pick]!;
      let kid = node.kids.get(key);
      if (!kid) {
        kid = newNode(info.cands[pick]!, node, this.k);
        node.kids.set(key, kid);
      }
      const next = this.stateOf(kid, d);
      if (!next) continue; // not legal in this determinization: try another move
      const isNew = this.aggN(kid) === 0;
      bias += info.bias[pick]!;
      node = kid;
      state = next;
      path.push(node);
      depth++;
      if (isNew) break;
    }
    this.iterations++;
    ctx.stats.rollouts++;
    const end = rolloutUntil(state, this.fromTurn + this.horizon, ctx);
    const raw = total(evaluate(end, ctx.evalCtx)) + bias;
    const v = squash(raw);
    for (const nd of path) {
      nd.n[d]!++;
      nd.sum[d]! += v;
      nd.raw[d]! += raw;
    }
  }

  // -- reading the result --------------------------------------------------------------------------

  /** Kids of `nd` by visits (most first), over the active determinizations. */
  ranked(nd: TreeNode): { kid: TreeNode; n: number; mean: number; raw: number }[] {
    return [...nd.kids.values()]
      .map((kid) => ({ kid, n: this.aggN(kid), mean: this.aggMean(kid), raw: this.aggRaw(kid) }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n || b.mean - a.mean);
  }

  /** Keep the determinizations whose state at `nd` projects to what the AI now sees. */
  consistent(nd: TreeNode, view: PlayerView): number[] {
    const fp = fingerprint(view);
    return this.active.filter((d) => {
      const s = this.stateOf(nd, d);
      return !!s && fingerprint(project(s, this.me)) === fp;
    });
  }

  /** Continue from `nd` with only the determinizations in `keep`. */
  reroot(nd: TreeNode, keep: number[]): void {
    this.root = nd;
    this.active = keep;
  }

  /** A determinized state at the root (for explanations): the first active one. */
  rootState(): GameState | null {
    for (const d of this.active) {
      const s = this.stateOf(this.root, d);
      if (s) return s;
    }
    return null;
  }
}
