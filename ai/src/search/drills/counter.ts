/**
 * The counter-or-take drill (M9 WP3, curriculum L10, explanations E05 / E19 / E04).
 *
 * A position is cut at p1's counter step: p2 has declared an attack on p1's Leader (`prefix`) and p1
 * chooses to counter or to take it. Two classes, both decided by the M8 detectors' own code and both
 * admitted only when the detector's certainty is `any-hand`:
 * - `should-counter` (expect `counter`, judge `survive-turn`): the turn is survivable (`lethal` in
 *   `actual` mode refutes it, its refutation holding with the attacker's deck unknown and its hand
 *   empty), and taking this hit hands the attacker a proven win.
 * - `counter-wasted` (expect `take`, judge `no-counter-on-attack`): playing the counters a player
 *   would reach for either still loses the battle (E19, case a) or stops a hit that was safe to take
 *   at three or more Life, by the public bound on their remaining attacks (E04, case b).
 *
 * The attacker's hand is empty in every position, so nothing hidden bears on either class. The answer
 * text is the detector's own `Explanation`, rebuilt from the item (`explainCounter`).
 */
import type { Card } from '@optcg/cards';
import { ENGINE_VERSION } from '@optcg/engine';
import { metaListSets } from './mulligan.ts';
import { counterValueOf } from '../../knowledge.ts';
import {
  legalActions,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import type { Explanation } from '../../explanation.ts';
import { lethal } from '../lethal/lethal.ts';
import type { Cap } from '../lethal/search.ts';
import { counterWastedOf, takeTheHit, type PlayedCounter } from '../review/counter-wasted.ts';
import { counterCard } from '../review/exact.ts';
import { renderDefence } from '../review/defence-line.ts';
import {
  explainShouldCounter,
  refutationCertainty,
  shouldCounterExplanation,
} from '../review/should-counter.ts';
import { withHandPremise } from './hand-premise.ts';
import { applyAll, plainReply, startOf } from './play.ts';
import { DRILL_SCRIPTS_VERSION, defencePosition, type ListSet } from './positions.ts';
import type { CounterItem, DrillBank, ScenarioJson } from './types.ts';

/** Search budget of every classification: nodes, never milliseconds (deterministic). */
export const COUNTER_CAP: Cap = { nodes: 40_000 };

const ME: PlayerId = 'p1';
const FOE: PlayerId = 'p2';
type Cards = ReadonlyMap<string, Card>;

export interface CounterClass {
  expect: CounterItem['expect'];
  judge: CounterItem['judge'];
  detector: CounterItem['detector'];
}

/** Take the first plain answers until `ME` owes a counter, or give up (null). */
export function toCounterStep(
  m0: GameState,
  attack: Action,
): { prefix: Action[]; state: GameState } | null {
  const prefix: Action[] = [attack];
  let s: GameState;
  try {
    s = reduce(m0, attack).state;
  } catch {
    return null;
  }
  for (let i = 0; i < 8; i++) {
    const dec = queries.decision(s);
    if (!dec || queries.result(s)) return null;
    if (dec.kind === 'counter' && dec.player === ME) return { prefix, state: s };
    const a = plainReply(s, dec.player);
    if (!a) return null;
    prefix.push(a);
    s = reduce(s, a).state;
  }
  return null;
}

/** The attacks `FOE` can make on `ME`'s Leader from the Main state `m0`, one per attacker. */
export function leaderAttacks(m0: GameState): Action[] {
  const leader = queries.zone(m0, ME, 'leader')[0]!.instance;
  const seen = new Set<string>();
  const out: Action[] = [];
  for (const a of legalActions(m0))
    if (a.type === 'attack' && a.player === FOE && a.target === leader && !seen.has(a.attacker)) {
      seen.add(a.attacker);
      out.push(a);
    }
  return out;
}

const statusOf = (s: GameState, cards: Cards, cap: Cap): 'proven' | 'refuted' | 'unknown' =>
  lethal({ mode: 'actual', state: s, attacker: FOE }, cards, cap).status;

/**
 * Play one counter for `ME` and answer what it opens: a "choose a target" takes the Leader under attack
 * (the usual use), so an Event like Rocks Pirates costs two actions (the counter, the pick). Null when
 * the counter opens anything else (a cost to pay, a "you may"): it is not "just power", and the M8
 * detectors do not judge it either (`counterOnlyPower`).
 */
export function playCounter(
  s: GameState,
  counter: Action,
): { state: GameState; actions: Action[] } | null {
  let state = reduce(s, counter).state;
  const actions = [counter];
  for (let i = 0; i < 4; i++) {
    const dec = queries.decision(state);
    if (dec?.kind === 'counter' && dec.player === ME) return { state, actions };
    if (!dec || dec.player !== ME || dec.kind !== 'choose') return null;
    const target = queries.battle(state)?.target;
    const picks = legalActions(state).filter((x) => x.player === ME && x.type === 'pick');
    const pick = picks.find((x) => x.type === 'pick' && x.choice === target) ?? picks[0];
    if (!pick) return null;
    actions.push(pick);
    state = reduce(state, pick).state;
  }
  return null;
}

/** `ME`'s counters, played as a player reaching for them would: biggest first, until the hit stops. */
export function naiveCounters(
  c: GameState,
  cards: Cards,
): { state: GameState; played: PlayedCounter[]; actions: Action[] } {
  let s = c;
  const played: PlayedCounter[] = [];
  const actions: Action[] = [];
  const skipped = new Set<string>();
  for (let i = 0; i < 12; i++) {
    const b = queries.battle(s);
    if (!b) break;
    const atk = queries.card(s, b.attacker).power;
    const def = queries.card(s, b.target).power;
    if (atk === null || def === null || def > atk) break;
    let best: { a: Action; inst: string; card: string; value: number } | null = null;
    for (const a of legalActions(s)) {
      const inst = a.player === ME ? counterCard(a) : null;
      if (!inst || skipped.has(inst)) continue;
      const v = queries.card(s, inst);
      const value = counterValueOf(cards.get(v.card)) || (v.counter ?? 0);
      if (value > (best?.value ?? 0)) best = { a, inst, card: v.card, value };
    }
    if (!best) break;
    const next = playCounter(s, best.a);
    if (!next) {
      skipped.add(best.inst);
      continue;
    }
    played.push({ action: best.a, card: best.card, value: best.value });
    actions.push(...next.actions);
    s = next.state;
  }
  return { state: s, played, actions };
}

/**
 * The first gate of the should-counter class: their Main is refuted (some defence holds, `lethal` in
 * `actual` mode) and the refutation holds with their deck unknown and their hand empty, so nothing
 * hidden bears on it.
 */
export function shouldGate(m0: GameState, cards: Cards, cap: Cap = COUNTER_CAP): boolean {
  const dec = queries.decision(m0);
  if (dec?.kind !== 'main' || dec.player !== FOE) return false;
  if (statusOf(m0, cards, cap) !== 'refuted') return false;
  return refutationCertainty(m0, FOE, cap).certainty === 'any-hand';
}

/**
 * The fewest counters (in play order) after which taking the rest of the battle still leaves a turn the
 * defender survives: their next Main is refuted. Null when no counters do. Searched breadth first over
 * the sets of counters in the defender's hand, so the same position always gives the same answer.
 */
export function survivingCounters(
  c: GameState,
  cards: Cards,
  cap: Cap = COUNTER_CAP,
): Action[] | null {
  interface Node {
    s: GameState;
    acts: Action[];
    used: string[];
  }
  let frontier: Node[] = [{ s: c, acts: [], used: [] }];
  const seen = new Set<string>();
  for (let depth = 0; depth < 4 && frontier.length > 0; depth++) {
    const next: Node[] = [];
    for (const n of frontier) {
      for (const a of legalActions(n.s)) {
        const inst = a.player === ME ? counterCard(a) : null;
        if (!inst) continue;
        const used = [...n.used, inst].sort();
        const key = used.join();
        if (seen.has(key)) continue;
        seen.add(key);
        const played = playCounter(n.s, a);
        if (!played) continue;
        const ns = played.state;
        const acts = [...n.acts, ...played.actions];
        const t = takeTheHit(ns, ME);
        if (!queries.result(t) && statusOf(t, cards, cap) === 'refuted') return acts;
        next.push({ s: ns, acts, used });
      }
    }
    frontier = next;
  }
  return null;
}

/**
 * The should-counter class at a position: `m0` is p2's Main and `prefix` ends at the counter step.
 * Taking this hit hands them a proven win, and some counters survive the turn.
 */
export function classifyShould(
  m0: GameState,
  prefix: readonly Action[],
  cards: Cards,
  cap: Cap = COUNTER_CAP,
  gate: boolean = shouldGate(m0, cards, cap),
): boolean {
  if (!gate) return false;
  const c = applyAll(m0, prefix);
  const taken = takeTheHit(c, ME);
  if (!queries.result(taken) && statusOf(taken, cards, cap) !== 'proven') return false;
  return survivingCounters(c, cards, cap) !== null;
}

/** The counter-wasted class at the counter step `c`: the M8 detector's own check on the naive play. */
export function classifyWasted(c: GameState, cards: Cards): 'a' | 'b' | null {
  const { state, played } = naiveCounters(c, cards);
  const r = counterWastedOf(c, state, played, ME, cards);
  return r && r.certainty === 'any-hand' ? r.case : null;
}

/** Which class a position is, or null: `m0` is p2's Main, `prefix` ends at the counter step. */
export function classifyPosition(
  m0: GameState,
  prefix: readonly Action[],
  cards: Cards,
  cap: Cap = COUNTER_CAP,
  gate?: boolean,
): CounterClass | null {
  if (classifyShould(m0, prefix, cards, cap, gate))
    return { expect: 'counter', judge: 'survive-turn', detector: 'should-counter' };
  const kind = classifyWasted(applyAll(m0, prefix), cards);
  if (!kind) return null;
  return {
    expect: 'take',
    judge: 'no-counter-on-attack',
    detector: kind === 'a' ? 'counter-wasted-a' : 'counter-wasted-b',
  };
}

/** Every class a seeded position yields, the should-counter one first. */
export function classifiedPositions(
  scenario: ScenarioJson,
  cards: Cards,
  cap: Cap = COUNTER_CAP,
): { prefix: Action[]; class: CounterClass }[] {
  const m0 = startOf(scenario, cards);
  const out: { prefix: Action[]; class: CounterClass }[] = [];
  const gate = shouldGate(m0, cards, cap);
  for (const a of leaderAttacks(m0)) {
    const step = toCounterStep(m0, a);
    if (!step) continue;
    const cls = classifyPosition(m0, step.prefix, cards, cap, gate);
    if (cls) out.push({ prefix: step.prefix, class: cls });
  }
  return out;
}

// --- Items ---------------------------------------------------------------------------------------

export const COUNTER_LESSON = 'L10-counter-or-take';

/** The archetype pair a seed plays: any two of the lists' archetypes. */
export function pairOf(seed: number, sets: readonly ListSet[]): [ListSet, ListSet] {
  const n = sets.length;
  const mix = (x: number): number => Math.imul(x + 1, 2654435761) >>> 0;
  return [sets[mix(seed) % n]!, sets[mix(seed * 31 + 7) % n]!];
}

export interface CounterBankOptions {
  /** Items wanted per class. Default 12 should-counter, 6 wasted (a), 6 wasted (b). */
  want?: Partial<Record<CounterItem['detector'], number>>;
  /** Stop after this seed (a guard; the bank is complete earlier). */
  maxSeed?: number;
  /** Called with each admitted item. */
  onItem?: (item: CounterItem) => void;
}

const WANT: Record<CounterItem['detector'], number> = {
  'should-counter': 12,
  'counter-wasted-a': 6,
  'counter-wasted-b': 6,
};

/**
 * The position with the defender's hand cut down to the cards the defence needs: each card is dropped
 * in turn if the turn is still survivable without it (`lethal` refutes it). What is left is a position
 * on the edge, where the first hit taken instead of countered is the kind of slip the drill is about.
 * A position the attacker already wins, or cannot be searched, is returned as it is.
 */
export function tightened(
  scenario: ScenarioJson,
  cards: Cards,
  cap: Cap = COUNTER_CAP,
): ScenarioJson {
  if (statusOf(startOf(scenario, cards), cards, cap) !== 'refuted') return scenario;
  const hand = [...(scenario.p1.hand ?? [])];
  const withHand = (h: string[]): ScenarioJson => ({
    ...scenario,
    p1: { ...scenario.p1, hand: h },
  });
  for (let i = hand.length - 1; i >= 0; i--) {
    const trial = hand.filter((_, j) => j !== i);
    if (statusOf(startOf(withHand(trial), cards), cards, cap) === 'refuted') hand.splice(i, 1);
  }
  return withHand(hand);
}

/** The item of a seeded position, or null when it is none of the classes. */
export function counterItemAt(
  seed: number,
  sets: readonly ListSet[],
  cards: Cards,
  wanted?: ReadonlySet<CounterItem['detector']>,
): CounterItem | null {
  const [mine, theirs] = pairOf(seed, sets);
  const base = defencePosition(seed, mine, theirs, cards);
  if (!base) return null;
  // Positions at one or two Life are pressed to the edge; at three or more the hand is left whole.
  const scenario = (base.p1.life?.length ?? 0) <= 2 ? tightened(base, cards) : base;
  for (const c of classifiedPositions(scenario, cards)) {
    if (wanted && !wanted.has(c.class.detector)) continue;
    return {
      id: `counter-${seed}`,
      drill: 'counter',
      lesson: COUNTER_LESSON,
      source: { kind: 'bank', seed },
      mine: mine.leaderId,
      theirs: theirs.leaderId,
      first: true,
      certainty: 'any-hand',
      label: 'any-hand',
      scenario,
      prefix: c.prefix,
      hand: 'harder',
      ...c.class,
    };
  }
  return null;
}

/**
 * The counter bank: seeds 1, 2, 3 ... in order, each seed one position; a position is admitted when
 * it is a class that still has room. Pure and deterministic in `sets` and the card data.
 */
export function counterBank(
  sets: readonly ListSet[],
  cards: Cards,
  opts: CounterBankOptions = {},
): CounterItem[] {
  const want = { ...WANT, ...opts.want };
  const have: Record<CounterItem['detector'], number> = {
    'should-counter': 0,
    'counter-wasted-a': 0,
    'counter-wasted-b': 0,
  };
  const items: CounterItem[] = [];
  const open = (): Set<CounterItem['detector']> =>
    new Set((Object.keys(want) as CounterItem['detector'][]).filter((k) => have[k] < want[k]));
  for (let seed = 1; seed <= (opts.maxSeed ?? 20_000) && open().size > 0; seed++) {
    const item = counterItemAt(seed, sets, cards, open());
    if (!item) continue;
    have[item.detector]++;
    items.push(item);
    opts.onItem?.(item);
  }
  return items;
}

// --- Judge and answer ----------------------------------------------------------------------------

/** What the player did at the counter step: played a Counter, or took the hit. */
export type CounterChoice = 'counter' | 'take';

export const judgeCounter = (item: CounterItem, choice: CounterChoice): boolean =>
  choice === item.expect;

/** The state at the counter step and the Main before it, rebuilt from the item. */
export function replayCounter(
  item: CounterItem,
  cards: Cards,
): { m0: GameState; counter: GameState } {
  const m0 = startOf(item.scenario, cards);
  return { m0, counter: applyAll(m0, item.prefix) };
}

/** Re-run the classification of the item's own position: what the CI re-verification compares. */
export function reverifyCounter(
  item: CounterItem,
  cards: Cards,
  cap: Cap = COUNTER_CAP,
): CounterClass | null {
  const { m0 } = replayCounter(item, cards);
  return classifyPosition(m0, item.prefix, cards, cap);
}

/** The detector's explanation of the item's position (E05, E19 or E04), with its certainty. */
export function explainCounter(
  item: CounterItem,
  cards: Cards,
  cap: Cap = COUNTER_CAP,
): Explanation | null {
  const ex = explainCounterRaw(item, cards, cap);
  return ex && withHandPremise(ex, item, item.detector === 'counter-wasted-b');
}

export function explainCounterRaw(item: CounterItem, cards: Cards, cap: Cap): Explanation | null {
  const { m0, counter } = replayCounter(item, cards);
  if (item.detector === 'should-counter') {
    // When the refutation's own first attack is this one, its whole-turn line is the answer (E05).
    const { pv } = refutationCertainty(m0, FOE, cap);
    const first = pv.find((a) => a.type === 'attack' && a.player === FOE);
    const mine = item.prefix[0];
    if (
      first?.type === 'attack' &&
      mine?.type === 'attack' &&
      first.attacker === mine.attacker &&
      first.target === mine.target
    )
      return shouldCounterExplanation(m0, FOE, ME, cards, cap, item.prefix.slice(0, 1), 'take')
        .explanation;
    const counters = survivingCounters(counter, cards, cap);
    if (!counters) return null;
    // The defender's moves in this battle: the counters, then the rest of the hit taken.
    const line = renderDefence(
      m0,
      [...item.prefix, ...counters, { type: 'endCounter', player: ME }],
      ME,
      cards,
    ).line;
    const { certainty } = refutationCertainty(m0, FOE, cap);
    return explainShouldCounter(
      m0,
      FOE,
      ME,
      cards,
      certainty,
      line.length > 0 ? line : null,
      null,
      'take',
      item.prefix.slice(0, 1),
    );
  }
  const { state, played } = naiveCounters(counter, cards);
  return counterWastedOf(counter, state, played, ME, cards)?.explanation ?? null;
}

/** The generator `scripts/drill-bank.ts` registers: the bank on the pinned lists, with its build stamp. */
export function generateCounterBank(
  cards: Cards,
  opts: { maxSeeds?: number; log?: (line: string) => void } = {},
): DrillBank & { counts: Record<string, number> } {
  const counts: Record<string, number> = {};
  const items = counterBank(metaListSets(), cards, {
    ...(opts.maxSeeds ? { maxSeed: opts.maxSeeds } : {}),
    onItem: (i) => {
      const k = i.detector;
      counts[k] = (counts[k] ?? 0) + 1;
      opts.log?.(`${i.id}: ${k}`);
    },
  });
  return {
    drill: 'counter',
    builtWith: { engine: ENGINE_VERSION, scripts: DRILL_SCRIPTS_VERSION },
    items,
    counts,
  };
}
