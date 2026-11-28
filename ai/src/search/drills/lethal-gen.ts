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
import {
  classify,
  classifyActual,
  LETHAL_NODES,
  movesOfActions,
  type Classified,
} from './lethal.ts';
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
    counts[key]++;
    against.set(theirs, (against.get(theirs) ?? 0) + 1);
    items.push(item);
    versions.push(
      scriptsVersionOf(
        createFromScenario({ ...item.scenario, cards: (id) => cards.get(id) }).state,
      ),
    );
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
