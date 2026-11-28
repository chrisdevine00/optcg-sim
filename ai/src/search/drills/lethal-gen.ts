/**
 * The lethal bank generator (M9 WP2). For seed 1, 2, 3, ... it builds a board (`boards.ts`), asks
 * `lethal` in `public` mode (the player's own view only, node-capped: never a clock) and admits a
 * position only when the answer holds against **any** hand the opponent's deck could hold:
 *
 * - **lethal exists**: `proven`, `any-hand`, and a fixed line that works whatever they answer
 *   (`oblivious`). The same position is then checked against the full state with the strongest
 *   defence the prior allows (`harderHand`): the public proof has to dominate it, else the item is
 *   dropped (this is what keeps "the opponent's hand in a puzzle" honest).
 * - **provably none**: `refuted` with reason `attackers` (too few attackers could ever hit their
 *   Leader), which holds for every hand. A `bound` refutation is `needed-hidden-info` in the solver
 *   (it assumes their worst hand), and a search refutation likewise: both are discarded, as is
 *   `unknown`. The any-hand rule is never relaxed to reach a count.
 *
 * Banks are written by `npm run drills:bank -- lethal` and committed as card ids.
 */
import type { Card } from '@optcg/cards';
import {
  actionFromView,
  createFromScenario,
  ENGINE_VERSION,
  scriptsVersionOf,
} from '@optcg/engine';
import { buildBoard, type BoardShape } from './boards.ts';
import { FOCUS_LEADERS, FOCUS_MIN } from './positions.ts';
import {
  classify,
  classifyActual,
  judgeLethal,
  LETHAL_NODES,
  movesOfActions,
  type Classified,
} from './lethal.ts';
import { withMetaArchetypes } from '../../knowledge.ts';
import type { DrillBank, LethalItem } from './types.ts';

/** The item a seed gives, or null when it is not admitted (and why, for the tuning log). */
export function lethalItemOf(
  seed: number,
  mine: string,
  theirs: string,
  shape: BoardShape,
  cards: ReadonlyMap<string, Card>,
  nodes = LETHAL_NODES,
): { item: LethalItem | null; why: string } {
  const board = buildBoard(seed, mine, theirs, shape, cards);
  if (!board) return { item: null, why: 'no board' };
  let c: Classified;
  try {
    c = classify(board.scenario, cards, nodes);
  } catch (e) {
    return { item: null, why: `invalid: ${(e as Error).message}` };
  }
  const { result: r } = c;
  const base = {
    id: `lethal-${seed}`,
    drill: 'lethal' as const,
    lesson: 'L15-lethal-math',
    source: { kind: 'bank' as const, seed },
    mine,
    theirs,
    first: board.first,
    certainty: 'any-hand' as const,
    label: 'any-hand' as const,
    scenario: board.scenario,
    prefix: [],
    hand: 'harder' as const,
  };
  if (r.status === 'proven') {
    if (r.certainty !== 'any-hand') return { item: null, why: 'proven, not any-hand' };
    if (!r.oblivious || !r.viewActions) return { item: null, why: 'proven, but adapts' };
    const actual = classifyActual(c.state, cards);
    if (actual.status !== 'proven') return { item: null, why: `actual ${actual.status}` };
    const actions = r.viewActions.map((a) => actionFromView(c.state, 'p1', a));
    return {
      item: {
        ...base,
        answer: {
          lethal: true,
          actions,
          line: movesOfActions(c.state, actions, cards).map((m) => m.text),
        },
      },
      why: 'lethal',
    };
  }
  if (r.status === 'refuted') {
    const reason = r.defence?.reason;
    if (r.certainty === 'any-hand' && reason === 'attackers')
      return { item: { ...base, answer: { lethal: false, reason } }, why: 'none' };
    return { item: null, why: `refuted by ${reason ?? 'search'} (${r.certainty})` };
  }
  return { item: null, why: 'unknown' };
}

export interface LethalGenOptions {
  /** Archetype Leader ids, in a fixed order (the script passes the guides' fourteen). */
  leaders: readonly string[];
  /** Items of each class; default 14. */
  perClass?: number;
  /** First seed; default 1. */
  startSeed?: number;
  /** Stop after this many seeds, short of the count (the honest-numbers case); default 4000. */
  maxSeeds?: number;
  /** At most this many items against one opponent Leader (a spread of opponents); default 6. */
  perOpponent?: number;
  nodes?: number;
  /** The Leaders given their own pass after the walk (default `FOCUS_LEADERS`; `[]` runs the walk alone). */
  focus?: readonly string[];
  /**
   * Another meta file's archetypes (the live `docs/research/meta-lists.json` when the bank is made on
   * the pinned copy): an item is admitted only if its answer, header and explanation are the same
   * under both priors, so a meta refresh cannot change a committed answer.
   */
  agreeWith?: readonly unknown[];
  /** One line per seed tried, for tuning. */
  log?: (line: string) => void;
}

/** FNV-1a: a short digest to stamp a bank with the scripts it was built against. */
function digest(parts: string[]): string {
  let h = 0x811c9dc5;
  for (const ch of parts.join('|')) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, '0');
}

/** The leaders a seed gives (a pure function of the seed and the leader list). */
export function pairOf(seed: number, leaders: readonly string[]): { mine: string; theirs: string } {
  const n = leaders.length;
  // Even and odd seeds are different shapes, so the pair walks the pair index of the shape's own run.
  const k = seed >> 1;
  return { mine: leaders[(k * 7 + 1) % n]!, theirs: leaders[(k * 5 + 3 + (seed & 1)) % n]! };
}

/** The shape tried at a seed: even seeds one attacker short, odd seeds a real attempt. */
export const shapeOf = (seed: number): BoardShape => (seed % 2 === 0 ? 'short' : 'strike');

/**
 * The focus Leaders' own pass (M11 Track C): seeds from a range of their own with the Leader fixed in the
 * player's seat against a seeded opponent, the same shapes and the same any-hand admission
 * (`lethalItemOf`), until `FOCUS_PER_CLASS` lethal and as many "none" items are found or
 * `FOCUS_SEEDS` seeds are spent. No cap on the opponent: the pass is already small.
 */
export const FOCUS_SEED_BASE = 1_000_000;
export const FOCUS_SEEDS = 2_000;
/**
 * Lethal items wanted per focus Leader, and "none" items wanted within the first `FOCUS_NONE_SEEDS`
 * seeds. The two Leaders' lists hold draw and search cards (Nami, Iceburg, the Stages), so a "none by
 * count" refutation is only "from what you hold", never any-hand (`needed-hidden-info`, lethal.ts):
 * no "none" item is admitted for them, and the any-hand rule is not relaxed to get one. The pass
 * takes `FOCUS_MIN` lethal items instead, so the Leader's count still reaches the minimum.
 */
/** Does the item judge the same under the current prior and under `other`'s (both submissions)? */
export function agreesUnder(
  item: LethalItem,
  cards: ReadonlyMap<string, Card>,
  other: readonly unknown[] | undefined,
): boolean {
  if (!other) return true;
  const subs = [{ kind: 'no-lethal' } as const, { kind: 'played', won: true } as const];
  const view = (v: ReturnType<typeof judgeLethal>) =>
    JSON.stringify({ h: v.headline, header: v.header, ex: v.explanation });
  return subs.every(
    (sub) =>
      view(judgeLethal(item, sub, cards)) ===
      view(withMetaArchetypes(other, () => judgeLethal(item, sub, cards))),
  );
}

export const FOCUS_PER_CLASS = FOCUS_MIN / 2;
export const FOCUS_NONE_SEEDS = 500;

export function lethalFocusItems(
  leaders: readonly string[],
  cards: ReadonlyMap<string, Card>,
  mine: string,
  opts: {
    maxSeeds?: number;
    nodes?: number;
    agreeWith?: readonly unknown[];
    log?: (line: string) => void;
  } = {},
): LethalItem[] {
  const slot = Math.max(FOCUS_LEADERS.indexOf(mine), 0);
  const counts = { lethal: 0, none: 0 };
  const items: LethalItem[] = [];
  const mix = (x: number): number => Math.imul(x + 1, 2654435761) >>> 0;
  for (
    let k = 1;
    k <= (opts.maxSeeds ?? FOCUS_SEEDS) &&
    (counts.lethal < FOCUS_MIN || (counts.none < FOCUS_PER_CLASS && k <= FOCUS_NONE_SEEDS));
    k++
  ) {
    const seed = FOCUS_SEED_BASE + slot * 100_000 + k;
    const theirs = leaders[mix(seed) % leaders.length]!;
    const { item, why } = lethalItemOf(seed, mine, theirs, shapeOf(seed), cards, opts.nodes);
    opts.log?.(`seed ${seed} ${mine}/${theirs}: ${why}`);
    if (!item) continue;
    const key = item.answer.lethal ? 'lethal' : 'none';
    if (counts[key] >= (key === 'lethal' ? FOCUS_MIN : FOCUS_PER_CLASS)) continue;
    if (!agreesUnder(item, cards, opts.agreeWith)) {
      opts.log?.(`seed ${seed}: answer differs under the other meta lists, skipped`);
      continue;
    }
    counts[key]++;
    items.push(item);
  }
  return items;
}

export type GeneratedBank = DrillBank & {
  tried: number;
  counts: { lethal: number; none: number };
};

export function generateLethalBank(
  cards: ReadonlyMap<string, Card>,
  opts: LethalGenOptions,
): GeneratedBank {
  const want = opts.perClass ?? 14;
  const items: LethalItem[] = [];
  const counts = { lethal: 0, none: 0 };
  const versions: string[] = [];
  const against = new Map<string, number>();
  const perOpp = opts.perOpponent ?? 6;
  let seed = (opts.startSeed ?? 1) - 1;
  let tried = 0;
  while ((counts.lethal < want || counts.none < want) && tried < (opts.maxSeeds ?? 4000)) {
    seed++;
    tried++;
    const { mine, theirs } = pairOf(seed, opts.leaders);
    const { item, why } = lethalItemOf(seed, mine, theirs, shapeOf(seed), cards, opts.nodes);
    opts.log?.(`seed ${seed} ${mine}/${theirs}: ${why}`);
    if (!item) continue;
    const key = item.answer.lethal ? 'lethal' : 'none';
    if (counts[key] >= want || (against.get(theirs) ?? 0) >= perOpp) continue;
    if (!agreesUnder(item, cards, opts.agreeWith)) {
      opts.log?.(`seed ${seed}: answer differs under the other meta lists, skipped`);
      continue;
    }
    counts[key]++;
    against.set(theirs, (against.get(theirs) ?? 0) + 1);
    items.push(item);
    versions.push(
      scriptsVersionOf(
        createFromScenario({ ...item.scenario, cards: (id) => cards.get(id) }).state,
      ),
    );
  }
  // The focus Leaders' own pass comes after the base walk, so no base item or id moves.
  for (const mine of opts.focus ?? FOCUS_LEADERS) {
    if (!opts.leaders.includes(mine)) continue;
    const got = lethalFocusItems(opts.leaders, cards, mine, {
      ...(opts.maxSeeds ? { maxSeeds: opts.maxSeeds } : {}),
      ...(opts.nodes ? { nodes: opts.nodes } : {}),
      ...(opts.agreeWith ? { agreeWith: opts.agreeWith } : {}),
      ...(opts.log ? { log: opts.log } : {}),
    });
    for (const item of got) {
      counts[item.answer.lethal ? 'lethal' : 'none']++;
      items.push(item);
      versions.push(
        scriptsVersionOf(
          createFromScenario({ ...item.scenario, cards: (id) => cards.get(id) }).state,
        ),
      );
    }
    if (got.length < FOCUS_MIN)
      opts.log?.(`focus ${mine}: only ${got.length} of ${FOCUS_MIN} lethal items`);
  }
  return {
    drill: 'lethal',
    builtWith: {
      engine: ENGINE_VERSION,
      scripts: 'scripts-' + digest([...new Set(versions)].sort()),
    },
    items,
    tried,
    counts,
  };
}

/** The committed form of a generated bank (`tried` and `counts` are for the log, not the file). */
export function bankJson(bank: DrillBank): string {
  const { drill, builtWith, items } = bank;
  return JSON.stringify({ drill, builtWith, items }, null, 2) + '\n';
}
