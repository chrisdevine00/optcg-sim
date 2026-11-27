/**
 * The `target` detector (M8 WP4; PROMPT.md "poor attack ordering", learning-ui §4, explanations.md
 * E08 and E09). At each attack your seat declared, the same attacker's other legal targets (their
 * Leader and each rested Character it can attack) are valued with `valueActions` from the seat's own
 * `SearchView`: each attack is played in k guessed states (drawn from the opponent's archetype
 * prior, seeded from the view's public fingerprint) and rolled out to the start of the next turn.
 * The flag fires when the best target is worth `TARGET_GAP` or more over the one you chose, wins in
 * most guesses of their hand, the rollouts did not decide the game, and the difference has a reason
 * in the cards' public text (`worthFlagging`). The better target must win in all `K` guessed hands.
 *
 * `any-hand`: nothing but the view, public card data, the seat's own list and the prior is read, so
 * the flag is the same for every hand, deck order and face-down Life they could have held (the
 * differential in ai/test/review/target-differential.test.ts). The explanation is built from feature
 * differences (`explain-target.ts`), not from the search's numbers. Moderate severity.
 *
 * Not built: the order of attacks within a turn. A flag judges each declaration on its own; a better
 * order of the same attacks is not reported (DECISIONS 2026-11-25, M8 WP4).
 */
import type { Card } from '@optcg/cards';
import {
  actionFromView,
  legalActions,
  projectForSearch,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
  type SearchView,
  type ViewCard,
} from '@optcg/engine';
import type { Move } from '../../explanation.ts';
import { actionKey } from '../../coach/types.ts';
import { averageCounter, biggestCounter, priorFor } from '../../knowledge.ts';
import { playbookFor } from '../../playbook.ts';
import type { Budget, PirateSetup } from '../pirate.ts';
import { valueActions } from '../score.ts';
import { battleNumbers } from '../sim.ts';
import {
  cardsToStop,
  didMove,
  explainTarget,
  shortName,
  stopNeeded,
  textFacts,
  type LaterAttack,
  type TargetBattle,
  type TargetFacts,
} from './explain-target.ts';
import {
  flagId,
  type Detector,
  type DetectorContext,
  type ReviewFlag,
  type ReviewItem,
  type TurnResult,
} from './types.ts';

/**
 * The value gap, in heuristic units (about one card each, as `GAP_THRESHOLD` in coach/blunder.ts),
 * from which an attack on the wrong target is flagged. Tuned on a corpus of Warlord's own attacks
 * (ai/test/review/target-corpus.test.ts, `TARGET_REPORT=path`): well under 2% of them are flagged.
 */
export const TARGET_GAP = 1;

/**
 * Guessed states per judgement. The blunder warning uses 4; this flag is labelled `any-hand` (the
 * reasons it gives rest on public facts only), so it asks more of the search behind it (M8-R7):
 * six guessed hands, and the better target must win in every one (`MIN_WINS`).
 */
export const K = 6;

/**
 * The better target must win in this many of the `K` guesses of their hand: all of them. A flag is
 * a claim that holds "whatever they held" (explanations.md certainty table); a better target that
 * loses in one sampled hand is a matter of their hand, which this flag does not claim.
 */
export const MIN_WINS = K;

/**
 * A value this far from the heuristic's ordinary range (a win in every guess is 1000) means the
 * rollouts decided the game: that is a lethal question, which the exact missed-lethal check answers,
 * not a question of which target to hit.
 */
export const DECIDED = 100;

/** What the cap of an item means for this search: `nodes` as rollouts (150,000 nodes is 120), else `ms`. */
export function budgetOf(cap: DetectorContext['cap']): Budget {
  if (cap.nodes !== undefined) return { iterations: Math.max(20, Math.round(cap.nodes / 1250)) };
  return { ms: cap.ms ?? 150 };
}

const strip = ({ intentId: _i, ...a }: Action): Action => a as Action;

/** The view's attack action that is the record's engine `action` (they differ in ids only). */
export function viewAttackOf(
  state: GameState,
  view: SearchView,
  action: Action,
): Extract<Action, { type: 'attack' }> | null {
  const mine = JSON.stringify(sortKeys(strip(action)));
  return (
    view.actions.find(
      (a): a is Extract<Action, { type: 'attack' }> =>
        a.type === 'attack' &&
        JSON.stringify(sortKeys(strip(actionFromView(state, view.player, a)))) === mine,
    ) ?? null
  );
}

/** The attacks of one attacker in a view, with their targets. */
export function attackOptions(view: SearchView, attacker: string): Action[] {
  return view.actions.filter((a) => a.type === 'attack' && a.attacker === attacker);
}

export interface TargetVerdict {
  /** `incomplete`: the budget ended before every guess was played (a marker, not a clean attack). */
  status: 'judged' | 'incomplete' | 'single';
  chosen?: Action;
  best?: Action;
  /** Best minus chosen, in heuristic units; 0 when the chosen attack is the best. */
  gap: number;
  /** The two values the gap is made of (a win in every guess is 1000). */
  bestValue?: number;
  chosenValue?: number;
  /** In how many of the `states` guesses of their hand the best target beat the chosen one. */
  wins?: number;
  states?: number;
}

/** Value `chosen`'s attacker's targets and say which is best. Pure in the view and the setup. */
export function judgeTarget(
  view: SearchView,
  chosen: Extract<Action, { type: 'attack' }>,
  setup: PirateSetup,
  budget: Budget,
): TargetVerdict {
  const options = attackOptions(view, chosen.attacker);
  if (options.length < 2) return { status: 'single', gap: 0 };
  // The guesses are drawn in order from one seed, so k guesses start with the first k-1: the mean
  // over i guesses less the mean over i-1 gives each guess's own value, and the better target
  // can be asked to win in most of them, not just on average.
  const means: Map<string, number>[] = [];
  // A time budget is shared out by the guesses each call plays (1 + 2 + ... + k in all).
  const share = (setup.k * (setup.k + 1)) / 2;
  for (let i = 1; i <= setup.k; i++) {
    const part: Budget = 'ms' in budget ? { ms: (budget.ms * i) / share } : budget;
    const r = valueActions(view, options, { ...setup, k: i }, part, false);
    if (r.incomplete) return { status: 'incomplete', gap: 0 };
    means.push(new Map([...r.valued].map(([key, v]) => [key, v.mean] as const)));
  }
  const last = means[setup.k - 1]!;
  const mine = last.get(actionKey(chosen));
  if (mine === undefined) return { status: 'single', gap: 0 };
  let best: { a: Action; v: number } | null = null;
  for (const o of options) {
    const v = last.get(actionKey(o));
    if (v !== undefined && (!best || v > best.v)) best = { a: o, v };
  }
  if (!best) return { status: 'single', gap: 0 };
  const own = (key: string, i: number): number | null => {
    const m = means[i]!.get(key);
    const before = i === 0 ? 0 : means[i - 1]!.get(key);
    return m === undefined || before === undefined ? null : (i + 1) * m - i * before;
  };
  const bestKey = actionKey(best.a);
  let wins = 0;
  for (let i = 0; i < setup.k; i++) {
    const b = own(bestKey, i);
    const c = own(actionKey(chosen), i);
    if (b !== null && c !== null && b > c) wins++;
  }
  return {
    status: 'judged',
    chosen,
    best: best.a,
    gap: Math.max(0, best.v - mine),
    bestValue: best.v,
    chosenValue: mine,
    wins,
    states: setup.k,
  };
}

/**
 * Does the verdict make a flag? Four conditions, all read from the view:
 * - the better target is worth `TARGET_GAP` or more, and wins in `MIN_WINS` of the guesses of their
 *   hand, so it holds against any hand and not on one lucky draw;
 * - the rollouts did not decide the game (`DECIDED`);
 * - the difference has a reason a reader can check in the cards' public text, because the words of
 *   the flag are built from that difference, not from the search's numbers: the better Character
 *   lifts their Leader's power (board over face), or the Character you hit does nothing on the board
 *   and a hit on their Leader costs them two cards or more to stop (face over board).
 */
export function worthFlagging(
  view: SearchView,
  v: TargetVerdict,
  cards: ReadonlyMap<string, Card>,
  minGap: number = TARGET_GAP,
): boolean {
  if (v.status !== 'judged' || !v.best || !v.chosen) return false;
  const best = v.best as Extract<Action, { type: 'attack' }>;
  const chosen = v.chosen as Extract<Action, { type: 'attack' }>;
  if (best.target === chosen.target || v.gap < minGap) return false;
  if ((v.wins ?? 0) < MIN_WINS) return false;
  if (Math.max(Math.abs(v.bestValue ?? 0), Math.abs(v.chosenValue ?? 0)) >= DECIDED) return false;
  const opp: PlayerId = view.player === 'p1' ? 'p2' : 'p1';
  const leader = view.zones[opp].leader[0]?.handle;
  const text = (h: string) => textFacts(viewCard(view, h)?.card ?? null, cards);
  if (best.target === leader) {
    // Face over board: the Character does nothing on the board, and the hit costs them: stopping it
    // takes two cards or more (or cannot be done).
    if (!text(chosen.target).nothingOnBoard) return false;
    const attacker = viewCard(view, chosen.attacker);
    const theirLeader = view.zones[opp].leader[0];
    const need = stopNeeded(attacker?.power ?? 0, theirLeader?.power ?? 0);
    const n = cardsToStop(need, biggestCounter(theirLeader?.card ?? '', cards));
    return n === null || n >= 2;
  }
  // Board over face: the Character pays them every turn by lifting their Leader.
  if (chosen.target === leader) return text(best.target).boostsLeader;
  return text(best.target).boostsLeader && text(chosen.target).nothingOnBoard;
}

/** The setup `valueActions` needs for `me` in `view`, from the seat's own list and both Leaders. */
export function targetSetup(
  view: SearchView,
  ownDeck: readonly string[],
  cards: ReadonlyMap<string, Card>,
  now: () => number = () => performance.now(),
): PirateSetup {
  const me = view.player;
  const opp: PlayerId = me === 'p1' ? 'p2' : 'p1';
  const leader = view.zones[me].leader[0]?.card ?? '';
  const oppLeader = view.zones[opp].leader[0]?.card ?? '';
  return {
    ownDeck,
    cards,
    playbook: playbookFor(leader, [...ownDeck], cards),
    prior: priorFor(oppLeader),
    oppAvgCounter: averageCounter(oppLeader, cards),
    k: K,
    now,
  };
}

// --- The battle's numbers ----------------------------------------------------------------------

const MAX_NODES = 300;

/**
 * Declare `action` and settle your own prompts (a [When Attacking] to use or decline, its costs and
 * targets) to the first window the opponent owes, taking whichever answers leave the target
 * weakest against the attacker. The numbers are those of that window: nothing of theirs has run,
 * so nothing hidden is read (the opponent's first decision is where this stops).
 */
export function battleOf(
  state: GameState,
  action: Action,
  me: PlayerId,
  cards: ReadonlyMap<string, Card>,
): { attack: number; defence: number; uses: TargetBattle['uses'] } | null {
  let nodes = 0;
  type Found = { attack: number; defence: number; uses: TargetBattle['uses'] };
  const go = (s: GameState, uses: TargetBattle['uses'], depth: number): Found | null => {
    if (++nodes > MAX_NODES || queries.result(s)) return null;
    const dec = queries.decision(s);
    if (!dec) return null;
    if (dec.player !== me) {
      const n = battleNumbers(s);
      return n ? { attack: n.attack, defence: n.defence, uses } : null;
    }
    if (dec.kind === 'main' || depth > 6) return null;
    let best: Found | null = null;
    for (const a of legalActions(s)
      .filter((x) => x.type !== 'concede')
      .slice(0, 10)) {
      const taken = a.type === 'optional' && a.accept ? [...uses, usedEffect(dec, cards)] : uses;
      const r = go(reduce(s, a).state, taken, depth + 1);
      if (!r) continue;
      if (
        !best ||
        r.attack - r.defence > best.attack - best.defence ||
        (r.attack - r.defence === best.attack - best.defence && r.uses.length < best.uses.length)
      )
        best = r;
    }
    return best;
  };
  try {
    return go(reduce(state, action).state, [], 0);
  } catch {
    return null;
  }
}

function usedEffect(
  dec: NonNullable<ReturnType<typeof queries.decision>>,
  cards: ReadonlyMap<string, Card>,
): TargetBattle['uses'][number] {
  const p = dec.prompt;
  const effect = /\((.*)\)\??\s*$/.exec(p)?.[1] ?? 'its effect';
  const cost = /:\s*(.*?)\s+to use this effect/.exec(p)?.[1] ?? 'its cost';
  const id = dec.source?.card;
  return { source: id ? (cards.get(id)?.name ?? id) : 'a card', cost, effect };
}

// --- The detector ---------------------------------------------------------------------------------

/** The seat's own list: the record's start, else every card of its own in the opening position. */
function ownDeckOf(ctx: DetectorContext, me: PlayerId): string[] {
  const start = ctx.record.start;
  if ('setup' in start) return [...start.setup.decks[me].main];
  const list = start.scenario[me].decklist;
  if (list && list.length > 0) return [...list];
  const s0 = ctx.stateAt(0);
  const ids: string[] = [];
  for (const z of ['deck', 'hand', 'life', 'characters', 'stage', 'trash'] as const)
    for (const c of queries.zone(s0, me, z)) ids.push(c.card);
  return ids;
}

/** The view card behind a handle. */
function viewCard(view: SearchView, handle: string): ViewCard | null {
  for (const p of ['p1', 'p2'] as const)
    for (const zone of Object.values(view.zones[p])) {
      const c = zone.find((x) => x.handle === handle);
      if (c) return c;
    }
  return null;
}

/** Your later attacks that turn (to the end of your turn), in card ids. */
function laterAttacks(ctx: DetectorContext, index: number, me: PlayerId): LaterAttack[] {
  const out: LaterAttack[] = [];
  const first = ctx.record.actions[index]!;
  const turn = queries.turn(ctx.stateAt(index)).number;
  for (let j = index + 1; j < ctx.record.actions.length; j++) {
    const a = ctx.record.actions[j]!;
    if (a.player === me && a.type === 'endTurn') break;
    if (a.type !== 'attack' || a.player !== me) continue;
    const s = ctx.stateAt(j);
    if (queries.turn(s).number !== turn) break;
    try {
      const atk = queries.card(s, a.attacker);
      const tgt = queries.card(s, a.target);
      if (first.type === 'attack' && a.attacker === first.attacker) continue;
      out.push({ attacker: atk.card, target: tgt.zone === 'leader' ? 'leader' : tgt.card });
    } catch {
      break;
    }
  }
  return out;
}

export const detect: Detector = (item: ReviewItem, ctx: DetectorContext): TurnResult | null => {
  // The WP0 registry test calls every detector with an empty context: nothing to judge then.
  const rec = (ctx as Partial<DetectorContext>).record;
  const action = rec?.actions[item.index];
  if (!rec || !action || action.type !== 'attack') return null;
  const me = action.player;
  if (rec.seats[me] !== 'human' || rec.auto.includes(item.index)) return null;
  const state = ctx.stateAt(item.index);
  const dec = queries.decision(state);
  if (!dec || dec.kind !== 'main' || dec.player !== me) return null;
  const view = projectForSearch(state, me);
  const chosen = viewAttackOf(state, view, action);
  if (!chosen) return null;
  const setup = targetSetup(view, ownDeckOf(ctx, me), ctx.cards);
  const verdict = judgeTarget(view, chosen, setup, budgetOf(ctx.cap));
  if (verdict.status === 'incomplete')
    return {
      itemId: item.id,
      turn: item.turn,
      flags: [],
      notes: [],
      marker: { turn: item.turn, kind: 'target', reason: 'search-incomplete' },
    };
  if (!worthFlagging(view, verdict, ctx.cards)) return null;
  const best = verdict.best as Extract<Action, { type: 'attack' }>;

  const attacker = viewCard(view, chosen.attacker);
  const chosenCard = viewCard(view, chosen.target);
  const bestCard = viewCard(view, best.target);
  if (!attacker || !chosenCard || !bestCard) return null;
  const battleFor = (a: Extract<Action, { type: 'attack' }>, t: ViewCard): TargetBattle | null => {
    const b = battleOf(state, actionFromView(state, me, a), me, ctx.cards);
    return b
      ? {
          attackPower: b.attack,
          targetPower: b.defence,
          targetPowerBefore: t.power ?? b.defence,
          uses: b.uses,
        }
      : null;
  };
  const chosenBattle = battleFor(chosen, chosenCard);
  const bestBattle = battleFor(best, bestCard);
  if (!chosenBattle || !bestBattle) return null;
  const later = laterAttacks(ctx, item.index, me);
  const opp: PlayerId = me === 'p1' ? 'p2' : 'p1';
  const leader = view.zones[opp].leader[0]?.handle;
  const facts: TargetFacts = {
    view,
    cards: ctx.cards,
    attacker,
    chosen: chosenCard,
    best: bestCard,
    chosenBattle,
    bestBattle,
    later,
    hitsAtLeader:
      (chosenCard.handle === leader ? 1 : 0) + later.filter((l) => l.target === 'leader').length,
  };
  const { explanation } = explainTarget(facts);
  const did: Move[] = [
    didMove(facts, chosenCard, chosenBattle),
    ...later.map((l): Move => ({
      kind: 'attack',
      text: `Attack ${l.target === 'leader' ? 'their Leader' : shortName(ctx.cards.get(l.target)?.name ?? l.target)} with ${shortName(ctx.cards.get(l.attacker)?.name ?? l.attacker)}.`,
      card: l.attacker,
      target: l.target,
    })),
  ];
  const flag: ReviewFlag = {
    id: flagId('target', item.turn, item.index),
    kind: 'target',
    turn: item.turn,
    player: me,
    restoreIndex: item.index,
    decisionIndex: item.index,
    severity: 'moderate',
    certainty: explanation.certainty,
    explanation,
    did,
  };
  // M9 WP7: Practice restores just before the attack and judges the first attack's target against
  // the better one. `expect.target` is the engine's instance id (what an action holds), found by
  // turning the view's handle back into the action; a handle would never equal `a.target`.
  const bestTarget = (actionFromView(state, me, best) as Extract<Action, { type: 'attack' }>)
    .target;
  if (bestTarget)
    flag.practice = { judge: 'target-best', turn: item.turn, expect: { target: bestTarget } };
  return { itemId: item.id, turn: item.turn, flags: [flag], notes: [] };
};

/** Objects with sorted keys, so two spellings of one action compare equal. */
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0))
        .map(([k, x]) => [k, sortKeys(x)]),
    );
  return v;
}
