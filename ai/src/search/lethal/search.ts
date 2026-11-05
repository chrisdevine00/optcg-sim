/**
 * Lethal search core (ARCHITECTURE §4.4). It drives the real engine: every state is a full
 * `GameState`, every move is a legal `Action`, and `reduce` applies it, so Blockers, DON!!
 * allocation, on-attack effects and "each hit gives the defender a card" (CR 7-1-4-1-1-2) come from
 * the rules, not from a model of them.
 *
 * The question: can `attacker` win this turn against every legal answer of the defender? It is an
 * AND-OR search. The attacker's decisions are OR nodes (one winning move is enough), the defender's
 * are AND nodes (every answer must lose). Chance does not appear here: the caller has already
 * turned hidden cards into a worst case (`public.ts`) or into the real cards (`actual` mode).
 *
 * The attacker's Main Phase moves are *macros*: "give k DON!! to X, then attack T with X". Any final
 * DON!! split is such a sequence, because DON!! given to a card is only needed from its own attack
 * on (assumption A1 in DECISIONS: DON!! is never given to a card that does not attack next, so a
 * DON!! condition on a Character that helps another card is not searched). Other legal moves
 * (`playCard`, `activate`) stay single steps. An attack on a Character is searched only when
 * that Character is a Blocker or has a scripted ability (a vanilla Character cannot change
 * the outcome).
 *
 * Search aids: a transposition table on the engine's `summaryHash`; moves ordered largest swing
 * first; defender answers deduplicated by card id (two identical cards are one choice); node and
 * wall-clock caps. A cap raises `CapReached`, which the caller reports as `unknown`.
 */
import { SCRIPTS } from '@optcg/cards';
import {
  legalActions,
  queries,
  reduce,
  summaryHash,
  type Action,
  type GameState,
  type PlayerId,
} from '@optcg/engine';

export interface Cap {
  /** Search nodes (deterministic; tests and CI use this). */
  nodes?: number;
  /** Wall-clock milliseconds (the app only). */
  ms?: number;
}

export class CapReached extends Error {
  constructor() {
    super('lethal search reached its cap');
    this.name = 'CapReached';
  }
}

interface Res {
  win: boolean;
  /** Both players' actions along the principal variation, replayable from the node's state. */
  trace: Action[];
  /** Defender Life lost on the best attempt (for refutations). */
  prog: number;
  /** Winning only: the attacker's moves are the same against every defender answer. */
  oblivious: boolean;
}

export interface SearchOutcome {
  status: 'proven' | 'refuted' | 'unknown';
  trace: Action[];
  oblivious: boolean;
  /** Refuted: the best attempt and how many Life cards it took. */
  bestAttempt: { trace: Action[]; lifeTaken: number } | null;
  nodes: number;
}

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

/** `summaryHash` once per state object (states are immutable). */
const hashes = new WeakMap<object, string>();
function hashOf(s: GameState): string {
  let h = hashes.get(s);
  if (h === undefined) {
    h = summaryHash(s);
    hashes.set(s, h);
  }
  return h;
}

/**
 * States after 0, 1, 2 … `giveDon`s of one kind from a state, shared by every macro that starts
 * with them ("give 3 then attack" reuses "give 2").
 */
const chains = new WeakMap<object, Map<string, GameState[]>>();
function applyMove(s: GameState, m: Action[]): GameState {
  let k = 0;
  while (k < m.length && m[k]!.type === 'giveDon') k++;
  let t = s;
  if (k > 0) {
    let byTarget = chains.get(s);
    if (!byTarget) chains.set(s, (byTarget = new Map()));
    const give = m[0] as Extract<Action, { type: 'giveDon' }>;
    let arr = byTarget.get(give.target);
    if (!arr) byTarget.set(give.target, (arr = [s]));
    while (arr.length <= k) arr.push(reduce(arr[arr.length - 1]!, give).state);
    t = arr[k]!;
  }
  for (let i = k; i < m.length; i++) t = reduce(t, m[i]!).state;
  return t;
}

class Searcher {
  nodes = 0;
  private tt = new Map<string, Res>();
  protected readonly t0 = performance.now();
  protected rootLife: number;
  protected rootGiven: number;
  readonly defender: PlayerId;
  readonly turn: number;

  constructor(
    root: GameState,
    readonly attacker: PlayerId,
    protected readonly cap: Cap,
    /** Most DON!! the line may give in total (tidy pass); Infinity for none. */
    protected readonly maxGive: number,
    /**
     * Simple moves only: attacks on the Leader, "may" effects declined. The first, cheap stage of
     * the fixed-plan search; the adaptive search always has every move.
     */
    protected readonly simple = false,
  ) {
    this.defender = other(attacker);
    this.turn = queries.turn(root).number;
    this.rootLife = queries.zone(root, this.defender, 'life').length;
    this.rootGiven = queries.don(root, attacker).given;
  }

  protected tick(): void {
    this.nodes++;
    if (this.cap.nodes !== undefined && this.nodes > this.cap.nodes) throw new CapReached();
    if (this.cap.ms !== undefined && (this.nodes & 63) === 0)
      if (performance.now() - this.t0 > this.cap.ms) throw new CapReached();
  }

  private prog(s: GameState): number {
    return this.rootLife - queries.zone(s, this.defender, 'life').length;
  }

  protected lose(s: GameState, trace: Action[] = []): Res {
    return { win: false, trace, prog: this.prog(s), oblivious: false };
  }

  solve(s: GameState): Res {
    const result = queries.result(s);
    if (result) {
      if ('winner' in result && result.winner === this.attacker)
        return { win: true, trace: [], prog: this.rootLife + 1, oblivious: true };
      return this.lose(s);
    }
    if (queries.turn(s).number !== this.turn) return this.lose(s);
    const dec = queries.decision(s);
    if (!dec) return this.lose(s);
    const key = hashOf(s);
    const hit = this.tt.get(key);
    if (hit) return hit;
    this.tick();
    const res = dec.player === this.attacker ? this.orNode(s, dec.kind) : this.andNode(s);
    this.tt.set(key, res);
    return res;
  }

  /** Attacker's decision: one winning move is enough. */
  private orNode(s: GameState, kind: string): Res {
    const moves = kind === 'main' ? this.mainMoves(s) : this.otherMoves(s);
    let best: Res = this.lose(s);
    for (const m of moves) {
      const r = this.solve(applyMove(s, m));
      if (r.win)
        return { win: true, trace: [...m, ...r.trace], prog: r.prog, oblivious: r.oblivious };
      if (r.prog > best.prog || (r.prog === best.prog && best.trace.length === 0))
        best = { ...r, trace: [...m, ...r.trace] };
    }
    return best;
  }

  /** Defender's decision: every answer must lose. */
  private andNode(s: GameState): Res {
    const wins: Res[] = [];
    let first: Res | null = null;
    for (const a of this.defenderAnswers(s)) {
      const r = this.solve(reduce(s, a).state);
      if (!r.win) return { ...r, trace: [a, ...r.trace], oblivious: false };
      first ??= { ...r, trace: [a, ...r.trace] };
      wins.push(r);
    }
    if (!first) return this.lose(s);
    const mine = (r: Res) => JSON.stringify(r.trace.filter((x) => x.player === this.attacker));
    const k0 = mine(wins[0]!);
    const oblivious = wins.every((r) => r.oblivious && mine(r) === k0);
    return { ...first, oblivious };
  }

  protected legal(s: GameState): Action[] {
    return legalActions(s).filter((a) => a.type !== 'concede');
  }

  /** The attacker's non-Main decisions (a target for an effect, a cost, "may" effects): all of them. */
  protected otherMoves(s: GameState): Action[][] {
    const acts = dedupe(s, this.legal(s));
    if (this.simple) {
      const decline = acts.find((a) => a.type === 'optional' && !a.accept);
      if (decline) return [[decline]];
    }
    return acts.map((a) => [a]);
  }

  /** Main Phase macros, ordered: attacks by final power (largest first), then other plays. */
  protected mainMoves(s: GameState): Action[][] {
    const acts = this.legal(s);
    const me = this.attacker;
    const d = queries.don(s, me);
    const budget = Math.min(d.active, this.maxGive - (d.given - this.rootGiven));
    const out: { m: Action[]; power: number; k: number; swing: number }[] = [];
    const oppLeader = queries.zone(s, this.defender, 'leader')[0]!.instance;
    const done = new Set<string>();
    for (const a of acts) {
      if (a.type !== 'attack') continue;
      const target = queries.card(s, a.target);
      if (a.target !== oppLeader && (this.simple || !worthAttacking(target.card, target.keywords)))
        continue;
      // Two identical attackers are one choice.
      const c = queries.card(s, a.attacker);
      const sig = `${c.card}|${c.zone}|${c.rested}|${c.don}|${c.power}|${a.target}`;
      if (done.has(sig)) continue;
      done.add(sig);
      const give = acts.find((g) => g.type === 'giveDon' && g.target === a.attacker);
      const base = queries.card(s, a.attacker).power ?? 0;
      for (let k = 0; k <= (give ? Math.max(0, budget) : 0); k++) {
        const m: Action[] = [];
        for (let i = 0; i < k; i++) m.push(give!);
        m.push(a);
        out.push({ m, power: base + 1000 * k, k, swing: a.target === oppLeader ? 1 : 0 });
      }
    }
    const tidy = Number.isFinite(this.maxGive);
    out.sort((x, y) =>
      tidy
        ? x.k - y.k || y.swing - x.swing || x.power - y.power
        : y.swing - x.swing || y.power - x.power,
    );
    const moves = out.map((x) => x.m);
    if (!this.simple)
      for (const a of acts) {
        if (a.type === 'activate') moves.push([a]);
        else if (a.type === 'playCard' && playMatters(queries.card(s, a.card))) moves.push([a]);
      }
    return moves;
  }

  /** The defender's legal answers, strongest first, identical cards as one choice. */
  protected defenderAnswers(s: GameState): Action[] {
    const acts = dedupe(s, this.legal(s));
    const rank = (a: Action): number => {
      if (a.type === 'block') return a.blocker === null ? 90 : 0;
      if (a.type === 'endCounter') return 90;
      if (a.type === 'counter') return 10 - (queries.card(s, a.card).counter ?? 0) / 1000;
      if (a.type === 'trigger') return a.activate ? 20 : 91;
      if (a.type === 'optional') return a.accept ? 20 : 91;
      return 30;
    };
    return acts
      .map((a, i) => ({ a, i }))
      .sort((x, y) => rank(x.a) - rank(y.a) || x.i - y.i)
      .map((x) => x.a);
  }
}

/**
 * Playing a card can change a lethal turn only through what the engine knows about it: a scripted
 * ability, or [Rush] (it can attack at once). A card with neither does nothing but spend DON!!, so
 * the search does not play it (a Character's [Blocker] guards against attacks, which this turn has
 * none of).
 */
function playMatters(c: { card: string; keywords: string[] }): boolean {
  return (SCRIPTS[c.card]?.abilities.length ?? 0) > 0 || c.keywords.includes('Rush');
}

/** A Character target is worth an attack only if it blocks or has a scripted ability. */
function worthAttacking(cardId: string, keywords: string[]): boolean {
  return keywords.includes('Blocker') || (SCRIPTS[cardId]?.abilities.length ?? 0) > 0;
}

/** Collapse interchangeable choices: the same card id in the same state is one option. */
function dedupe(s: GameState, acts: Action[]): Action[] {
  const seen = new Set<string>();
  const out: Action[] = [];
  const sig = (id: string): string => {
    const c = queries.card(s, id);
    return `${c.card}|${c.zone}|${c.rested}|${c.don}|${c.power}|${c.faceUp}`;
  };
  for (const a of acts) {
    let key: string;
    switch (a.type) {
      case 'counter':
        key = `counter|${sig(a.card)}|${a.target}`;
        break;
      case 'activate':
        key = `activate|${sig(a.card)}|${a.ability}`;
        break;
      case 'block':
        key = a.blocker === null ? 'block|none' : `block|${sig(a.blocker)}`;
        break;
      case 'pick':
        key =
          typeof a.choice === 'string'
            ? `pick|${sig(a.choice)}`
            : `pick|${JSON.stringify(a.choice)}`;
        break;
      default:
        key = JSON.stringify(a);
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

/**
 * The oblivious plan: one fixed sequence of attacker moves that wins against **every** defender
 * answer (a person can follow it without adapting). The search carries the *set* of states the
 * defender's answers lead to; a move must be legal in all of them, and the plan wins when every
 * state ends in a win. `maxGive` caps the DON!! the plan gives, so trying 0, 1, 2 … finds the line
 * that gives the fewest, smallest attacks first.
 */
class PlanSearcher extends Searcher {
  /**
   * Frontier → the largest remaining DON!! budget known to fail from it. A failure with r left is
   * a failure with less, so tightening the budget reuses every earlier pass.
   */
  constructor(
    root: GameState,
    attacker: PlayerId,
    cap: Cap,
    maxGive: number,
    private readonly fails: Map<string, number>,
  ) {
    super(root, attacker, cap, maxGive, true);
  }

  /** All states the defender's answers lead to, at the attacker's next decision; null if any loses. */
  private expand(frontier: GameState[]): GameState[] | null {
    const out = new Map<string, GameState>();
    const seen = new Set<string>();
    const stack = [...frontier];
    while (stack.length > 0) {
      const s = stack.pop()!;
      const result = queries.result(s);
      if (result) {
        if ('winner' in result && result.winner === this.attacker) continue;
        return null;
      }
      if (queries.turn(s).number !== this.turn) return null;
      const dec = queries.decision(s);
      if (!dec) return null;
      const key = hashOf(s);
      if (seen.has(key)) continue;
      seen.add(key);
      this.tick();
      if (dec.player === this.attacker) {
        out.set(key, s);
        continue;
      }
      for (const a of this.defenderAnswers(s)) stack.push(reduce(s, a).state);
    }
    return [...out.values()];
  }

  private moveKey(m: Action[]): string {
    return JSON.stringify(m.map((a) => ({ ...a, intentId: undefined })));
  }

  /** Moves legal in every state of the frontier, in the first state's order. */
  private common(frontier: GameState[]): Action[][] {
    const movesOf = (s: GameState): Action[][] =>
      queries.decision(s)?.kind === 'main' ? this.mainMoves(s) : this.otherMoves(s);
    const first = movesOf(frontier[0]!);
    if (frontier.length === 1) return first;
    const others = frontier.slice(1).map((s) => new Set(movesOf(s).map((m) => this.moveKey(m))));
    return first.filter((m) => others.every((o) => o.has(this.moveKey(m))));
  }

  plan(frontier: GameState[]): Action[] | null {
    if (frontier.length === 0) return [];
    const key = frontier
      .map((s) => hashOf(s))
      .sort()
      .join('|');
    const spent = Math.max(
      ...frontier.map((s) => queries.don(s, this.attacker).given - this.rootGiven),
    );
    const r = this.maxGive - spent;
    if ((this.fails.get(key) ?? -1) >= r) return null;
    let found: Action[] | null = null;
    for (const m of this.common(frontier)) {
      let next: GameState[];
      try {
        next = frontier.map((s) => applyMove(s, m));
      } catch {
        continue;
      }
      const f = this.expand(next);
      if (!f) continue;
      const rest = this.plan(f);
      if (rest) {
        found = [...m, ...rest];
        break;
      }
    }
    if (!found) this.fails.set(key, Math.max(this.fails.get(key) ?? -1, r));
    return found;
  }
}

const donGiven = (plan: Action[]): number => plan.filter((a) => a.type === 'giveDon').length;

/**
 * The tidy fixed plan: a simple plan (Leader attacks, "may" effects declined) that wins against
 * every defender answer, giving the **fewest DON!!**, and among those the smallest attacks first
 * (each attack's DON!! tried from none upward). The budget starts at everything and tightens to one
 * less than each plan found, until none is left, so every earlier pass's failures are reused. A last
 * pass at the minimal budget takes the first plan in that order.
 * `none` means no simple fixed plan exists (not that lethal is refuted).
 */
export function searchPlan(
  root: GameState,
  attacker: PlayerId,
  cap: Cap,
): { status: 'proven' | 'none' | 'unknown'; actions: Action[]; nodes: number } {
  const fails = new Map<string, number>();
  const t0 = performance.now();
  let nodes = 0;
  const budget0 = queries.don(root, attacker).active;
  const run = (budget: number): Action[] | null => {
    const sr = new PlanSearcher(root, attacker, remainingCap(cap, nodes, t0), budget, fails);
    try {
      return sr.plan([root]);
    } finally {
      nodes += sr.nodes;
    }
  };
  try {
    let best = run(budget0);
    if (!best) return { status: 'none', actions: [], nodes };
    for (;;) {
      const used = donGiven(best);
      if (used === 0) return { status: 'proven', actions: best, nodes };
      const tighter = run(used - 1);
      if (!tighter) {
        // The minimal budget is `used`: take the first plan in tidy order within exactly that.
        const canonical = run(used);
        return { status: 'proven', actions: canonical ?? best, nodes };
      }
      best = tighter;
    }
  } catch (e) {
    if (e instanceof CapReached) return { status: 'unknown', actions: [], nodes };
    throw e;
  }
}

function remainingCap(cap: Cap, used: number, t0: number): Cap {
  return {
    ...(cap.nodes !== undefined ? { nodes: Math.max(1, cap.nodes - used) } : {}),
    ...(cap.ms !== undefined ? { ms: Math.max(1, cap.ms - (performance.now() - t0)) } : {}),
  };
}

/**
 * Search from a full state in which `attacker` owes a Main decision, adapting to the defender's
 * answers (AND-OR). `maxGive` bounds the DON!! the line may give; the default searches every split.
 */
export function search(
  root: GameState,
  attacker: PlayerId,
  cap: Cap,
  maxGive = Infinity,
): SearchOutcome {
  const sr = new Searcher(root, attacker, cap, maxGive);
  try {
    const r = sr.solve(root);
    if (r.win)
      return {
        status: 'proven',
        trace: r.trace,
        oblivious: r.oblivious,
        bestAttempt: null,
        nodes: sr.nodes,
      };
    return {
      status: 'refuted',
      trace: [],
      oblivious: false,
      bestAttempt: { trace: r.trace, lifeTaken: r.prog },
      nodes: sr.nodes,
    };
  } catch (e) {
    if (e instanceof CapReached)
      return { status: 'unknown', trace: [], oblivious: false, bestAttempt: null, nodes: sr.nodes };
    throw e;
  }
}
