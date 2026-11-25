/**
 * Hint as a line (M7 WP1; flows F9, learning-ui §2.4, explanations.md E15).
 *
 * "What should I do?" is answered with a **line**, not a move:
 * - a Main Phase: the turn, in order, ending in `endTurn`;
 * - a defence (a block or counter decision): the staged set, block and counters together;
 * - a choice: the picks.
 * The first step's actions come back in the view's handles as `viewActions`, so the panel can stage
 * them exactly as if the player had clicked ("Do step 1").
 *
 * **How.** Warlord's own turn search (`planTurn`), run here with a **fresh memory** and a fresh setup
 * from the request alone: it never reads or changes the AI seat's session, plan or battle memory.
 * The line is the most-visited path of the search tree from the root to the end of the turn.
 *
 * **Hidden information.** The only inputs are the asking seat's `SearchView`, public card data and
 * the player's own list (`opts.game`, else the public archetype list for their Leader). Every name
 * in the copy is looked up from the view's handles: a card with no handle, or a face-down one, is
 * never named. The determinizations that value the moves are guesses and stay in here. The seed
 * comes from the view's fingerprint, so a position gives one answer (`answerHint` also remembers the
 * last few); two positions that differ only in what the player cannot see give identical results
 * (ai/test/hint-differential.test.ts).
 */
import type { Card } from '@optcg/cards';
import {
  CannotDeterminize,
  legalActions,
  queries,
  type Action,
  type GameState,
  type PlayerId,
  type SearchView,
} from '@optcg/engine';
import type { GameInfo } from '../protocol.ts';
import { averageCounter, counterValueOf, priorFor, type Prior } from '../knowledge.ts';
import { playbookFor } from '../playbook.ts';
import { rookie } from '../rookie.ts';
import { evaluate, type Breakdown } from './heuristic.ts';
import { rolloutUntil, type TreeNode } from './mcts.ts';
import {
  counterCandidates,
  decide as pirateDecide,
  fingerprint,
  fromView,
  handCounter,
  lethalOnMe,
  otherBias,
  same,
  toView,
  type Budget,
  type Candidate,
} from './pirate.ts';
import { determinizations } from './sample.ts';
import { apply, battleNumbers, quickAction, settle } from './sim.ts';
import {
  ctxFor,
  flat,
  newMemory,
  planTurn,
  type PlanOut,
  type WarlordBudgets,
  type WarlordSetup,
} from './warlord.ts';
import type { Move } from '../explanation.ts';
import { MAX_ALTERNATIVES, type HintAlternative, type HintResult } from '../coach/types.ts';
import {
  describeActions,
  explainChoice,
  explainDefence,
  explainMainLine,
  labelOf,
  playLabel,
  type AttackFact,
  type LineFacts,
  type Named,
  type Namer,
  type PlayFact,
} from '../coach/explain-hint.ts';

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

export interface HintOptions {
  /** Public card data: the player's own list, their opponent's archetype prior, cards seen. */
  cards: ReadonlyMap<string, Card>;
  /** The search budget: `{ ms }` in the app (default 2000), `{ iterations }` for repeatable runs. */
  budget?: Budget;
  /**
   * The player's own list and the two Leaders, when the coach worker was given them (`init.game`).
   * Used only when `leader` is the Leader the request's view shows for the asking seat; without it
   * the public archetype list for their Leader stands in for their own deck.
   */
  game?: Pick<GameInfo, 'ownDeck' | 'leader' | 'opponentLeader'>;
  now?: () => number;
  /** Tests only: replace the search; returns the Main line in the view's handles. */
  search?: (view: SearchView) => Action[];
}

/** The line, the macro boundaries and the other first moves a search found. */
interface Found {
  line: Action[];
  /** The first step (what "Do step 1" stages). */
  first: Action[];
  alternatives: Action[][];
  incomplete: boolean;
  proven: boolean;
  truncated: boolean;
  /** Leaf summaries for the best line and the alternatives (same order as `alternatives`). */
  best: Leaf | null;
  leaves: Leaf[];
}

/** What a position looks like at the start of the opponent's next turn, from counts. */
interface Leaf {
  b: Breakdown;
  hand: number;
  chars: number;
  activeDon: number;
  myLife: number;
  theirLife: number;
}

// ------------------------------------------------------------------------------------------------
// Setup and names
// ------------------------------------------------------------------------------------------------

/** FNV-1a: a small deterministic hash for the seed. */
function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const stripIntent = ({ intentId: _i, ...a }: Action) => a;

/** The seed of a position: its fingerprint and its legal actions, handles and all. */
export function hintSeed(view: SearchView): number {
  return hashSeed(`${fingerprint(view)}|${JSON.stringify(view.actions.map(stripIntent))}`);
}

function restrict(p: Prior | null, cards: ReadonlyMap<string, Card>): Prior | null {
  if (!p) return null;
  const lists = p.lists
    .map((l) => ({ ...l, cards: l.cards.filter((c) => cards.has(c.id)) }))
    .filter((l) => l.cards.reduce((t, c) => t + c.count, 0) >= 10);
  return lists.length ? { ...p, lists } : null;
}

function ownDeckOf(view: SearchView, opts: HintOptions): string[] {
  const me = view.player;
  const leader = view.zones[me].leader[0]?.card ?? '';
  if (opts.game && opts.game.leader === leader && opts.game.ownDeck.length > 0)
    return [...opts.game.ownDeck];
  // No list was given: the public list for their Leader is the best public guess of it.
  const p = restrict(priorFor(leader), opts.cards);
  const l = p?.lists[0];
  if (l) return l.cards.flatMap((c) => Array.from({ length: c.count }, () => c.id));
  const z = view.zones[me];
  return [z.hand, z.characters, z.trash, z.stage].flat().flatMap((c) => (c.card ? [c.card] : []));
}

/** The search setup a hint uses (exported for tests). */
export function hintSetup(view: SearchView, opts: HintOptions): WarlordSetup {
  const me = view.player;
  const leader = view.zones[me].leader[0]?.card ?? '';
  const oppLeader = view.zones[other(me)].leader[0]?.card ?? '';
  const ownDeck = ownDeckOf(view, opts);
  return {
    ownDeck,
    cards: opts.cards,
    playbook: playbookFor(leader, ownDeck, opts.cards),
    prior: restrict(priorFor(oppLeader), opts.cards),
    oppAvgCounter: averageCounter(oppLeader, opts.cards),
    k: 8,
    quickPlays: true,
    now: opts.now ?? (() => performance.now()),
  };
}

/** Names from the view's handles only: nothing the player cannot see is ever named. */
function namerOf(view: SearchView, cards: ReadonlyMap<string, Card>): Namer {
  const idx = new Map<string, { card: string | null; leader: boolean; owner: PlayerId | null }>();
  for (const p of ['p1', 'p2'] as const)
    for (const [zone, cs] of Object.entries(view.zones[p]))
      for (const c of cs) idx.set(c.handle, { card: c.card, leader: zone === 'leader', owner: p });
  for (const c of view.looking)
    idx.set(c.handle, { card: c.card, leader: false, owner: view.player });
  return (handle: string): Named => {
    const e = idx.get(handle);
    const card = e?.card ?? null;
    return {
      name: card ? (cards.get(card)?.name ?? card) : e ? 'a face-down card' : handle,
      card,
      isLeader: e?.leader ?? false,
      mine: e?.owner === view.player,
    };
  };
}

// ------------------------------------------------------------------------------------------------
// Facts of a Main line, from a replay on one guess
// ------------------------------------------------------------------------------------------------

/**
 * Apply a set of picks in whichever order the state offers them (the engine takes an unordered set
 * in its own candidate order, which differs between the real game and a guess). Null: no order works.
 */
function applySet(s: GameState, picks: Action[], ctx: ReturnType<typeof ctxFor>): GameState | null {
  if (picks.length === 0) return s;
  const legal = legalActions(s);
  for (const [k, p] of picks.entries()) {
    if (!legal.some((x) => same(x, p))) continue;
    const rest = picks.filter((_, i) => i !== k);
    const next = applySet(apply(s, p, ctx), rest, ctx);
    if (next) return next;
  }
  return null;
}

/** Quick policies for every pending decision until the turn counter moves past `turnBefore`. */
export function settleToTurnChange(
  s0: GameState,
  turnBefore: number,
  ctx: ReturnType<typeof ctxFor>,
): GameState {
  let s = s0;
  for (let i = 0; i < 200; i++) {
    if (queries.result(s) || queries.turn(s).number !== turnBefore) return s;
    if (!queries.decision(s)) return s;
    s = apply(s, quickAction(s, ctx), ctx);
  }
  return s;
}

/**
 * Replay a line (view handles) on one determinized state and read the numbers the copy needs: the
 * powers an attack meets, the DON!! kept at the end. Only own and public quantities are read; names
 * come from the view.
 */
function factsOf(
  view: SearchView,
  setup: WarlordSetup,
  line: Action[],
  seed: number,
  who: Namer,
  flags: { proven: boolean; incomplete: boolean; truncated: boolean },
): LineFacts {
  const me = view.player;
  const opp = other(me);
  const handles = view.skeleton.handles;
  const [s0] = determinizations(view, setup, 1, seed);
  const ctx = ctxFor(view, setup);
  const facts: LineFacts = {
    plays: [],
    activations: [],
    attacks: [],
    handSize: queries.zone(s0!, me, 'hand').length,
    activeDon: queries.don(s0!, me).active,
    theirLife: queries.zone(s0!, opp, 'life').length,
    theirBlockers: queries
      .zone(s0!, opp, 'characters')
      .filter((c) => !c.rested && c.keywords.includes('Blocker')).length,
    theirCharacters: queries.zone(s0!, opp, 'characters').length,
    donGiven: 0,
    activeAtEnd: null,
    ...flags,
  };
  let s: GameState = s0!;
  for (let i = 0; i < line.length; i++) {
    const va = line[i]!;
    if (va.type === 'pick') {
      // A run of picks is an unordered set the engine takes in its own candidate order (which the
      // view does not show): apply them in whichever order this guess offers.
      let j = i;
      while (line[j + 1]?.type === 'pick') j++;
      const run = line.slice(i, j + 1).map((x) => fromView(x, handles));
      const done = applySet(s, run, ctx);
      if (!done) break;
      s = done;
      s = settle(s, me, ctx);
      i = j;
      continue;
    }
    const a = fromView(va, handles);
    if (!legalActions(s).some((x) => same(x, a))) {
      break;
    }
    if (a.type === 'playCard') {
      const n = who((va as typeof a).card);
      const c = queries.card(s, a.card);
      facts.plays.push({
        name: n.name,
        card: c.card,
        cost: c.cost ?? 0,
        label: playLabel(n.card),
        power: c.power,
      } satisfies PlayFact);
    } else if (a.type === 'activate') {
      const n = who((va as typeof a).card);
      facts.activations.push({
        name: n.name,
        isLeader: n.isLeader,
        label: labelOf(n.card, a.ability),
      });
    } else if (a.type === 'giveDon') facts.donGiven++;
    else if (a.type === 'attack') {
      const at = queries.card(s, a.attacker);
      const tg = queries.card(s, a.target);
      const an = who((va as typeof a).attacker);
      const tn = who((va as typeof a).target);
      facts.attacks.push({
        attacker: an.name,
        attackerIsLeader: at.zone === 'leader',
        power: at.power ?? 0,
        target: tn.name,
        targetIsLeader: tg.zone === 'leader',
        targetPower: tg.power ?? 0,
      } satisfies AttackFact);
    }
    const turnBefore = queries.turn(s).number;
    s = apply(s, a, ctx);
    if (a.type === 'endTurn') {
      // The DON!! still active when the turn passes: end-of-turn effects have resolved, none of the
      // next turn has run (no Refresh, no DON!! Phase, nothing of theirs). Settling to the player's
      // next Main instead would count the next turn's DON!!.
      s = settleToTurnChange(s, turnBefore, ctx);
      facts.activeAtEnd = queries.don(s, me).active;
    } else if (line[i + 1]?.type !== 'pick') s = settle(s, me, ctx);
  }
  return facts;
}

// ------------------------------------------------------------------------------------------------
// A Main Phase line
// ------------------------------------------------------------------------------------------------

/** The first step of a flat line: what one click of "Do step 1" stages. */
export function firstStepOf(line: readonly Action[]): Action[] {
  const a = line[0];
  if (!a) return [];
  let i = 0;
  if (a.type === 'giveDon') {
    while (line[i]?.type === 'giveDon') i++;
    return line.slice(0, i + 1);
  }
  if (a.type === 'playCard' || a.type === 'activate') {
    i = 1;
    while (line[i]?.type === 'pick') i++;
    return line.slice(0, i);
  }
  return [a];
}

/**
 * The most-visited path from the root to the end of the turn, in view handles. A step that names a
 * card the view has no handle for (one you have not drawn yet) ends the line there: `truncated`.
 */
function walk(
  view: SearchView,
  tree: NonNullable<ReturnType<typeof newMemory>['tree']>,
  from: TreeNode,
): { macros: Action[][]; nodes: TreeNode[]; truncated: boolean } {
  const handles = view.skeleton.handles;
  const macros: Action[][] = [];
  const nodes: TreeNode[] = [];
  let node = from;
  let truncated = false;
  for (let i = 0; i < 40; i++) {
    const r = tree.ranked(node)[0];
    if (!r) break;
    const va = r.kid.cand!.actions.map((a) => toView(a, handles));
    if (va.some((x) => x === null)) {
      truncated = true;
      break;
    }
    macros.push(va as Action[]);
    nodes.push(r.kid);
    node = r.kid;
    if (va.some((x) => x!.type === 'endTurn')) break;
  }
  return { macros, nodes, truncated };
}

function leafOf(state: GameState, setup: WarlordSetup, view: SearchView): Leaf {
  const me = view.player;
  const ctx = ctxFor(view, setup);
  const end = rolloutUntil(state, queries.turn(state).number + 1, ctx);
  return {
    b: evaluate(end, ctx.evalCtx),
    hand: queries.zone(end, me, 'hand').length,
    chars: queries.zone(end, me, 'characters').length,
    activeDon: queries.don(end, me).active,
    myLife: queries.zone(end, me, 'life').length,
    theirLife: queries.zone(end, other(me), 'life').length,
  };
}

/** Rollouts per considered first move below which the answer is "best found, not fully checked". */
const MIN_PER_MOVE = 20;

function searchMain(view: SearchView, setup: WarlordSetup, budget: Budget, seed: number): Found {
  const mem = newMemory();
  const lethalCap: { nodes: number } | { ms: number } =
    'iterations' in budget ? { nodes: 6000 } : { ms: 150 };
  const turn: Budget = 'iterations' in budget ? budget : { ms: Math.max(50, budget.ms - 150) };
  const budgets: WarlordBudgets = { turn, defence: turn, lethal: lethalCap };
  const out: PlanOut = {};
  const planned = planTurn(view, setup, budgets, seed, mem, out);
  const none = { alternatives: [], proven: false, truncated: false, best: null, leaves: [] };
  if (planned.lethal && mem.queue.length > 0) {
    const line = mem.queue.slice();
    return { line, first: firstStepOf(line), incomplete: false, ...none, proven: true };
  }
  const tree = mem.tree;
  const ranking = out.rootRanking ?? [];
  if (!tree || ranking.length === 0) {
    const end = view.actions.find((a) => a.type === 'endTurn');
    const line = end ? [end] : [];
    return { line, first: line, incomplete: true, ...none };
  }
  const { macros, nodes, truncated } = walk(view, tree, tree.root);
  if (macros.length === 0) {
    const end = view.actions.find((a) => a.type === 'endTurn');
    const line = end ? [end] : [];
    return { line, first: line, incomplete: true, ...none };
  }
  const line = macros.flat();
  // Alternatives: the next different first moves, each with the position its own best line reaches.
  const d0 = tree.active[0]!;
  const stateAfter = (nds: TreeNode[]): GameState | null => {
    for (let i = nds.length - 1; i >= 0; i--) {
      const st = tree.stateOf(nds[i]!, d0);
      if (st) return st;
    }
    return null;
  };
  const best = (() => {
    const st = stateAfter(nodes);
    return st ? leafOf(st, setup, view) : null;
  })();
  const alternatives: Action[][] = [];
  const leaves: Leaf[] = [];
  const bestKey = nodes[0]!.key;
  for (const r of ranking) {
    if (alternatives.length >= MAX_ALTERNATIVES) break;
    if (r.kid.key === bestKey) continue;
    const va = r.actions.map((a) => toView(a, view.skeleton.handles));
    if (va.some((x) => x === null)) continue;
    const sub = walk(view, tree, r.kid);
    const st = stateAfter([r.kid, ...sub.nodes]);
    if (!st) continue;
    alternatives.push(va as Action[]);
    leaves.push(leafOf(st, setup, view));
  }
  const fewRollouts = planned.rollouts < MIN_PER_MOVE * ranking.length;
  return {
    line,
    first: macros[0]!,
    alternatives,
    incomplete: fewRollouts,
    proven: false,
    truncated,
    best,
    leaves,
  };
}

/** A macro's moves as the one move an alternative names: "Give 4 DON!! to your Leader and attack ...". */
function macroMove(m: Move[]): Move {
  const head = m[0];
  if (!head) return { kind: 'endTurn', text: 'End your turn.' };
  if (m.length === 1) return head;
  const last = m[m.length - 1]!;
  const joined = m
    .map((x, i) => (i === 0 ? x.text : lower(x.text)).replace(/\.$/, ''))
    .join(m.length === 2 ? ' and ' : ', then ');
  return { ...last, kind: last.kind === 'attack' ? 'attack' : head.kind, text: `${joined}.` };
}

const lower = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * One sentence on why an alternative is worse, from the heuristic's own terms; null when the
 * breakdown gives no specific reason (the alternative is then left out, never explained by "it
 * ranked lower", M7-R6).
 */
function whyWorse(best: Leaf | null, alt: Leaf | null, move: Move): string | null {
  const head = `Instead, ${lower(move.text.replace(/\.$/, ''))}`;
  if (!best || !alt) return null;
  const d = (k: keyof Breakdown) => best.b[k] - alt.b[k];
  const terms: [keyof Breakdown, number][] = [
    ['result', d('result')],
    ['life', d('life')],
    ['hand', d('hand')],
    ['board', d('board')],
    ['don', d('don')],
    ['threat', d('threat')],
    ['counter', d('counter')],
  ];
  const ranked = terms.filter(([, g]) => g >= 0.25).sort((x, y) => y[1] - x[1]);
  const times = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  // The first term whose numbers move the way the sentence says (never "5 Characters, not 4").
  for (const [key] of ranked) {
    switch (key) {
      case 'result':
        return `${head}: it does not win this turn.`;
      case 'life':
        if (alt.theirLife > best.theirLife)
          return `${head}: it leaves them at ${alt.theirLife} Life, not ${best.theirLife}.`;
        if (alt.myLife < best.myLife)
          return `${head}: it leaves you at ${alt.myLife} Life, not ${best.myLife}.`;
        break;
      case 'hand':
        if (alt.hand < best.hand)
          return `${head}: it leaves you ${times(alt.hand, 'card', 'cards')} in hand, not ${best.hand}.`;
        break;
      case 'board':
        if (alt.chars < best.chars)
          return `${head}: it leaves you ${times(alt.chars, 'Character', 'Characters')} on the board, not ${best.chars}.`;
        return `${head}: it leaves a weaker board.`;
      case 'don':
        return `${head}: it leaves you less DON!! to work with next turn.`;
      case 'threat':
        return `${head}: it leaves a weaker threat on their Leader.`;
      default:
        if (alt.activeDon < best.activeDon)
          return `${head}: it ends with ${alt.activeDon} DON!! active, not ${best.activeDon}.`;
        return `${head}: it holds less defence in your hand.`;
    }
  }
  return null;
}

function mainHint(
  view: SearchView,
  setup: WarlordSetup,
  budget: Budget,
  seed: number,
  opts: HintOptions,
): HintResult {
  const who = namerOf(view, opts.cards);
  const found: Found = opts.search
    ? {
        line: opts.search(view),
        first: [],
        alternatives: [],
        incomplete: false,
        proven: false,
        truncated: false,
        best: null,
        leaves: [],
      }
    : searchMain(view, setup, budget, seed);
  if (opts.search) found.first = firstStepOf(found.line);
  const facts = factsOf(view, setup, found.line, seed, who, {
    proven: found.proven,
    incomplete: found.incomplete,
    truncated: found.truncated,
  });
  const moves = describeActions(found.line, who);
  const ends = found.line.some((a) => a.type === 'endTurn');
  if (ends) {
    const m = moves[moves.length - 1]!;
    if (m.kind === 'endTurn' && facts.activeAtEnd !== null)
      m.text = `End your turn with ${facts.activeAtEnd} DON!! active.`;
  } else
    moves.push({
      kind: 'endTurn',
      text: found.truncated
        ? 'Then ask again: the next step turns on a card you have not drawn yet.'
        : 'Then end your turn.',
    });
  const explanation = explainMainLine(facts, moves);
  const bestFirst = macroMove(describeActions(found.first, who)).text;
  const alternatives: HintAlternative[] = [];
  found.alternatives.forEach((alt, i) => {
    const m = describeActions(alt, who);
    // A different macro that reads the same (another answer to the same prompt) is not another line.
    const move = macroMove(m);
    if (move.text === bestFirst) return;
    // A move that is already a step of the main line is not an alternative to it (the same attack
    // after the same plays), M7-R6.
    if (moves.some((x) => x.text === move.text)) return;
    const why = whyWorse(found.best, found.leaves[i] ?? null, move);
    if (why !== null) alternatives.push({ move, why });
  });
  return {
    line: moves,
    viewActions: found.first,
    explanation,
    alternatives: alternatives.slice(0, MAX_ALTERNATIVES),
    certainty: explanation.certainty,
    incomplete: found.incomplete,
  };
}

// ------------------------------------------------------------------------------------------------
// A defence
// ------------------------------------------------------------------------------------------------

/**
 * Insert the picks an action's effect raises (a [Counter] Event's target, a Blocker's [On Block]),
 * by the quick policy, so the staged set replays one step at a time.
 */
function expand(
  root: GameState,
  setup: WarlordSetup,
  view: SearchView,
  actions: Action[],
): Action[] {
  const me = view.player;
  const ctx = ctxFor(view, setup);
  const handles = view.skeleton.handles;
  let s = root;
  const out: Action[] = [];
  for (const a of actions) {
    for (let guard = 0; guard < 6; guard++) {
      const d = queries.decision(s);
      if (!d || d.player !== me || d.kind !== 'choose') break;
      if (legalActions(s).some((x) => same(x, a))) break;
      const q = quickAction(s, ctx);
      const v = toView(q, handles);
      if (!v) return out;
      out.push(v);
      s = apply(s, q, ctx);
    }
    const v = toView(a, handles);
    if (!v) return out;
    try {
      s = apply(s, a, ctx);
    } catch {
      return out;
    }
    out.push(v);
  }
  return out;
}

function lethalFilter(
  root: GameState,
  me: PlayerId,
  kind: string,
  cands: Candidate[],
  setup: WarlordSetup,
): Candidate[] {
  // Lethal is always defended where a defence exists (DECISIONS M5a "Defence").
  if (!lethalOnMe(root, me)) return cands;
  const isCover = (x: Action) =>
    x.type === 'counter' || (x.type === 'activate' && x.ability === 'counter');
  if (kind === 'counter') {
    const covers = cands.filter((c) => c.actions.length > 0 && c.actions.every(isCover));
    return covers.length ? covers : cands;
  }
  const blocks = cands.filter((c) => {
    const f = c.actions[0]!;
    return f.type === 'block' && f.blocker !== null;
  });
  const n = battleNumbers(root);
  return blocks.length > 0 && n && handCounter(root, me, setup) < n.need ? blocks : cands;
}

function defenceHint(
  view: SearchView,
  setup: WarlordSetup,
  budget: Budget,
  seed: number,
  opts: HintOptions,
): HintResult {
  const me = view.player;
  const who = namerOf(view, opts.cards);
  const states = determinizations(view, setup, setup.k, seed);
  const root = states[0]!;
  const ctx = ctxFor(view, setup);
  const kind = view.decision!.kind;
  let cands: Candidate[];
  if (kind === 'counter') cands = counterCandidates(root, me, setup);
  else {
    cands = [];
    for (const b of legalActions(root).filter((a) => a.type === 'block')) {
      let s1: GameState | null;
      try {
        s1 = apply(root, b, ctx);
      } catch {
        s1 = null;
      }
      const d = s1 && queries.decision(s1);
      if (s1 && d && d.player === me && d.kind === 'counter') {
        const sets = counterCandidates(s1, me, setup).slice(0, 4);
        for (const c of sets) cands.push({ actions: [b, ...c.actions] });
      } else cands.push({ actions: [b] });
    }
    if (cands.length === 0)
      cands = legalActions(root)
        .filter((a) => a.type !== 'concede')
        .map((a) => ({ actions: [a] }));
  }
  cands = lethalFilter(root, me, kind, cands, setup);
  const share: Budget =
    'iterations' in budget
      ? { iterations: Math.max(60, Math.round(budget.iterations / 4)) }
      : { ms: Math.max(100, budget.ms / 2) };
  const { ranked, iterations } = flat(
    states,
    cands,
    me,
    setup,
    share,
    otherBias(root, me, setup),
    ctx,
  );
  const chosen = ranked[0]?.c ?? cands[0]!;
  const canonical = expand(root, setup, view, chosen.actions);
  const viewActions =
    canonical.some(
      (a) => a.type === 'counter' || (a.type === 'activate' && a.ability === 'counter'),
    ) && canonical[canonical.length - 1]!.type !== 'endCounter'
      ? [...canonical, { type: 'endCounter', player: me } as Action]
      : canonical;
  // Facts from the numbers the view shows: the battle and the cards staged.
  const n = battleNumbers(root);
  const handles = view.skeleton.handles;
  const named = (id: string): Named => who(handles[id] ?? id);
  const blockAct = chosen.actions.find(
    (a): a is Extract<Action, { type: 'block' }> => a.type === 'block' && a.blocker !== null,
  );
  const counters = chosen.actions.flatMap((a) => {
    if (a.type === 'counter')
      return [{ name: named(a.card).name, value: queries.card(root, a.card).counter ?? 0 }];
    if (a.type === 'activate' && a.ability === 'counter')
      return [
        {
          name: named(a.card).name,
          value: counterValueOf(opts.cards.get(queries.card(root, a.card).card)),
        },
      ];
    return [];
  });
  const moves = describeActions(viewActions, who);
  const incomplete = ranked.length === 0 || iterations < MIN_PER_MOVE * 2;
  const explanation = n
    ? explainDefence(
        {
          attacker: named(n.b.attacker).name,
          attackPower: n.attack,
          target: named(n.b.target).name,
          targetIsYourLeader: n.target.zone === 'leader' && n.target.owner === me,
          targetPower: n.defence,
          yourLife: queries.zone(root, me, 'life').length,
          yourHand: queries.zone(root, me, 'hand').length,
          blocker: blockAct
            ? {
                name: named(blockAct.blocker!).name,
                power: queries.card(root, blockAct.blocker!).power ?? 0,
              }
            : null,
          counters,
          keywords: n.attacker.keywords,
          incomplete,
        },
        moves,
      )
    : explainChoice({ prompt: view.decision!.prompt, label: null, incomplete }, moves);
  const alternatives: HintAlternative[] = [];
  const bestV = ranked[0]?.raw ?? 0;
  for (const r of ranked.slice(1)) {
    if (alternatives.length >= MAX_ALTERNATIVES) break;
    const vs = r.c.actions.map((a) => toView(a, handles));
    if (vs.some((x) => x === null)) continue;
    const m = describeActions(vs as Action[], who);
    if (m.length === 0) continue;
    const text = m.map((x) => lower(x.text.replace(/\.$/, ''))).join(', ');
    // Only a measured margin is a reason; "it ranked lower" alone says nothing (M7-R6).
    if (bestV - r.raw < 0.5) continue;
    if (moves.some((x) => x.text === m[0]!.text)) continue;
    alternatives.push({
      move: m[0]!,
      why: `Instead, ${lower(text)}: it ranked lower in the games the search played out (${(bestV - r.raw).toFixed(1)} cards behind).`,
    });
  }
  return {
    line: moves,
    viewActions,
    explanation,
    alternatives,
    certainty: explanation.certainty,
    incomplete,
  };
}

// ------------------------------------------------------------------------------------------------
// A choice
// ------------------------------------------------------------------------------------------------

function choiceHint(
  view: SearchView,
  setup: WarlordSetup,
  budget: Budget,
  seed: number,
  opts: HintOptions,
): HintResult {
  const me = view.player;
  const who = namerOf(view, opts.cards);
  const handles = view.skeleton.handles;
  const kind = view.decision!.kind;
  const opening = kind === 'mulligan' || kind === 'chooseFirst';
  const picked: Action[] = [];
  let incomplete = false;
  let rule: string[] | undefined;
  if (opening) {
    const d = pirateDecide(
      view,
      { plan: null, defence: null },
      setup,
      { turn: budget, defence: budget },
      seed,
    );
    picked.push(d.action);
    const m = setup.playbook?.mulligan;
    if (kind === 'mulligan')
      rule =
        m && m.pieces.length > 0
          ? [`The guide keeps a hand with ${m.pieces.map((p) => p.label).join(', and ')}.`]
          : ['Any opening hand is a keep for this deck.'];
    else
      rule = [
        setup.playbook?.goFirst
          ? 'Going first gives you the first attack.'
          : 'Going second draws a card on your first turn.',
      ];
  } else {
    let states = determinizations(view, setup, setup.k, seed);
    const ctx = ctxFor(view, setup);
    const share: Budget =
      'iterations' in budget
        ? { iterations: Math.max(60, Math.round(budget.iterations / 4)) }
        : { ms: Math.max(100, budget.ms / 2) };
    for (let i = 0; i < 8; i++) {
      const root = states[0]!;
      const d = queries.decision(root);
      if (!d || d.player !== me || (i > 0 && d.kind !== 'choose')) break;
      const cands = legalActions(root)
        .filter((a) => a.type !== 'concede')
        .map((a) => ({ actions: [a] }));
      if (cands.length === 0) break;
      const { ranked, iterations } = flat(
        states,
        cands,
        me,
        setup,
        share,
        otherBias(root, me, setup),
        ctx,
      );
      if (iterations < MIN_PER_MOVE) incomplete = true;
      const best = (ranked[0]?.c ?? cands[0]!).actions[0]!;
      const v = toView(best, handles);
      if (!v) break;
      picked.push(v);
      if (best.type === 'done' || d.kind !== 'choose') break;
      const next: GameState[] = [];
      for (const s of states) {
        try {
          next.push(apply(s, best, ctx));
        } catch {
          // This guess cannot take the pick: leave it out.
        }
      }
      if (next.length === 0) break;
      states = next;
    }
  }
  const moves = describeActions(picked, who, view.decision?.options ?? []);
  const label = view.decision?.source?.label ?? null;
  const explanation = explainChoice(
    { prompt: view.decision!.prompt, label, incomplete, ...(rule ? { rule } : {}) },
    moves,
  );
  return {
    line: moves,
    viewActions: picked,
    explanation,
    alternatives: [],
    certainty: explanation.certainty,
    incomplete,
  };
}

// ------------------------------------------------------------------------------------------------
// Entry points
// ------------------------------------------------------------------------------------------------

/**
 * The Main Phase line `hint` would give, as view actions (for tests that replay it through the
 * engine). Same setup, budget and seed as `hint`, so the same line.
 */
export function mainLineOf(view: SearchView, opts: HintOptions): Action[] {
  const budget: Budget = opts.budget ?? { ms: 2000 };
  return searchMain(view, hintSetup(view, opts), budget, hintSeed(view)).line;
}

/** The hint for the asking seat's decision. */
export function hint(view: SearchView, opts: HintOptions): HintResult {
  const budget: Budget = opts.budget ?? { ms: 2000 };
  const me = view.player;
  const d = view.decision;
  if (!d || d.player !== me || view.actions.length === 0) {
    const explanation = explainChoice(
      { prompt: 'Nothing is waiting on you.', label: null, incomplete: false },
      [],
    );
    return {
      line: [],
      viewActions: [],
      explanation,
      alternatives: [],
      certainty: 'any-hand',
      incomplete: false,
    };
  }
  const seed = hintSeed(view);
  try {
    const setup = hintSetup(view, opts);
    if (d.kind === 'main') return mainHint(view, setup, budget, seed, opts);
    if (d.kind === 'block' || d.kind === 'counter')
      return defenceHint(view, setup, budget, seed, opts);
    return choiceHint(view, setup, budget, seed, opts);
  } catch (e) {
    // A position the search cannot analyse (a public reference to a card it never saw): the coach
    // says so and gives a legal step, rather than no answer.
    if (!(e instanceof CannotDeterminize)) console.error('[coach] hint search failed:', e);
    const options = view.actions.filter((a) => a.type !== 'concede');
    const counterOf = (id: string) => counterValueOf(opts.cards.get(id)) || null;
    const pick = rookie(view, { seed, counterOf }).action;
    const action = options.find((a) => same(a, pick)) ?? options[0]!;
    const who = namerOf(view, opts.cards);
    const moves = describeActions([action], who);
    const explanation = explainChoice({ prompt: d.prompt, label: null, incomplete: true }, moves);
    return {
      line: moves,
      viewActions: [action],
      explanation,
      alternatives: [],
      certainty: 'search-incomplete',
      incomplete: true,
    };
  }
}
