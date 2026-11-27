/**
 * The DON!! allocation drill (M9 WP3, curriculum L09, explanations E06 and E07).
 *
 * An item is a Main phase with three or four described lines (`candidateLines`), each ending at
 * `endTurn`, scored by the DON!! ledger the coach and the review share (`donLedger`): the best line
 * leaves the fewest DON!! unused. An item is admitted when that minimum is unique by at least one DON!!.
 * A `hold` item is one whose best line keeps DON!! held on purpose (an OP13-001 Leader with a given
 * DON!! and at most five active: E07), so "unused" is not "idle".
 *
 * The ledger reads the seat's own hand and board and the table; the opponent's hidden hand, deck and
 * face-down Life are never read, so the label is `any-hand`.
 */
import type { Card } from '@optcg/cards';
import { ENGINE_VERSION } from '@optcg/engine';
import { metaListSets } from './mulligan.ts';
import { project, type GameState } from '@optcg/engine';
import { donLedger, explainHeld, explainUnused, type DonLedger } from '../../coach/tempo.ts';
import type { Explanation } from '../../explanation.ts';
import { candidateLines, type Line, type LineKind } from './lines.ts';
import { applyAll, startOf } from './play.ts';
import { DRILL_SCRIPTS_VERSION, mainPosition, type ListSet } from './positions.ts';
import type { DonItem, DrillBank } from './types.ts';

export const DON_LESSON = 'L09-don-efficiency';
type Cards = ReadonlyMap<string, Card>;

/** The Leader whose guide holds DON!! on purpose (E07): the `hold` items are built for it. */
export const HOLD_LEADER = 'OP13-001';

/** The lines of a position, and which are best (null when no minimum is unique by one DON!!). */
export function scoreLines(
  lines: readonly Line[],
): { best: string[]; hold: boolean; lines: Line[] } | null {
  if (lines.length < 3) return null;
  const sorted = [...lines].sort((a, b) => a.unused - b.unused);
  if (sorted[0]!.unused >= sorted[1]!.unused) return null;
  const best = sorted[0]!;
  return { best: [best.id], hold: best.held > 0, lines: [...lines] };
}

/** The item of a seeded position, or null when its lines have no unique best one. */
export function donItemAt(
  seed: number,
  mine: ListSet,
  theirs: ListSet,
  cards: Cards,
): DonItem | null {
  // E07's lesson is that a held DON!! is not an idle one: giving every DON!! away is not offered then.
  const exclude: LineKind[] = mine.leaderId === HOLD_LEADER ? ['give-attack'] : [];
  const scenario = mainPosition(seed, mine, theirs, cards);
  if (!scenario) return null;
  const start = startOf(scenario, cards);
  const scored = scoreLines(candidateLines(start, 'p1', cards, exclude));
  if (!scored) return null;
  return {
    id: `don-${seed}`,
    drill: 'don',
    lesson: DON_LESSON,
    source: { kind: 'bank', seed },
    mine: mine.leaderId,
    theirs: theirs.leaderId,
    first: scenario.firstPlayer === 'p1',
    certainty: 'any-hand',
    label: 'any-hand',
    scenario,
    prefix: [],
    hand: 'harder',
    lines: scored.lines.map(({ id, label, actions, unused }) => ({ id, label, actions, unused })),
    best: scored.best,
    hold: scored.hold,
  };
}

export interface DonBankOptions {
  /** Ordinary and hold items wanted. Default 16 and 6 (22: the bank holds at least MIN_BANK). */
  want?: { ordinary: number; hold: number };
  maxSeed?: number;
  onItem?: (item: DonItem) => void;
}

/**
 * The DON!! bank: seeds 1, 2, 3 ... in order, each a position for the next archetype pair; the hold
 * items are built for the OP13-001 guide (its Leader against any archetype), the ordinary items for the
 * others. Pure and deterministic in `sets` and the card data.
 */
export function donBank(
  sets: readonly ListSet[],
  cards: Cards,
  opts: DonBankOptions = {},
): DonItem[] {
  const want = opts.want ?? { ordinary: 16, hold: 6 };
  const holdSet = sets.find((s) => s.leaderId === HOLD_LEADER);
  const others = sets.filter((s) => s.leaderId !== HOLD_LEADER);
  const items: DonItem[] = [];
  let ordinary = 0;
  let hold = 0;
  let giveBest = 0;
  for (
    let seed = 1;
    seed <= (opts.maxSeed ?? 20_000) && (ordinary < want.ordinary || hold < want.hold);
    seed++
  ) {
    const wantHold = hold < want.hold && !!holdSet && (ordinary >= want.ordinary || seed % 3 === 0);
    const mine = wantHold ? holdSet! : others[seed % others.length]!;
    const theirs = sets[(Math.imul(seed, 2654435761) >>> 0) % sets.length]!;
    const item = donItemAt(seed, mine, theirs, cards);
    if (!item) continue;
    if (wantHold ? !item.hold : item.hold) continue;
    // Giving every DON!! to an attacker is the best line in most positions; keep it to half the bank.
    if (!item.hold && item.best[0] === 'give-attack' && giveBest >= Math.floor(want.ordinary / 2))
      continue;
    if (item.best[0] === 'give-attack') giveBest++;
    if (item.hold) hold++;
    else ordinary++;
    items.push(item);
    opts.onItem?.(item);
  }
  return items;
}

// --- Judge and answer ----------------------------------------------------------------------------

/** Did the player pick a best line? "Choose a line" mode. */
export const judgeDonLine = (item: DonItem, lineId: string): boolean => item.best.includes(lineId);

/** The turn's end state of an item's line, and its ledger, replayed from the scenario. */
export function replayLine(
  item: DonItem,
  lineId: string,
  cards: Cards,
): { start: GameState; end: GameState; ledger: DonLedger } {
  const line = item.lines.find((l) => l.id === lineId);
  if (!line) throw new Error(`No line ${lineId} in ${item.id}`);
  const start = applyAll(startOf(item.scenario, cards), item.prefix);
  const end = applyAll(start, line.actions);
  return { start, end, ledger: donLedger(project(end, 'p1'), cards) };
}

/** Re-score every line of an item from its scenario: what the CI re-verification compares. */
export function reverifyDon(
  item: DonItem,
  cards: Cards,
): { unused: Record<string, number>; best: string[]; hold: boolean } {
  const unused: Record<string, number> = {};
  const held: Record<string, number> = {};
  for (const l of item.lines) {
    const { ledger } = replayLine(item, l.id, cards);
    unused[l.id] = ledger.unused;
    held[l.id] = ledger.held.n;
  }
  const min = Math.min(...Object.values(unused));
  const best = item.lines.filter((l) => unused[l.id] === min).map((l) => l.id);
  return { unused, best, hold: best.some((id) => held[id]! > 0) };
}

/**
 * The answer text for the line the player chose (the best one when they ask to see the answer): E06
 * for a line that leaves DON!! unused, E07 when the best line holds them on purpose, else a plain
 * statement of where every DON!! went. Certainty `any-hand`.
 */
export function explainDon(
  item: DonItem,
  cards: Cards,
  lineId: string = item.best[0]!,
): Explanation {
  const { end, ledger } = replayLine(item, lineId, cards);
  const view = project(end, 'p1');
  if (ledger.unused > 0) {
    const e = explainUnused(view, ledger, cards, 'left', true, 1);
    if (e) return e;
  }
  const held = explainHeld(view, ledger, cards);
  if (held) return held;
  return {
    conceptId: 'don-efficiency',
    claim: 'That line leaves no DON!! unused.',
    evidence: [
      {
        text: `You end with ${ledger.total} DON!!: ${ledger.paid} paid for cards, ${ledger.given} given to your Leader and Characters, and ${ledger.active} active that nothing of yours needs on their turn.`,
        figures: { paid: ledger.paid, given: ledger.given, active: ledger.active },
      },
    ],
    line: null,
    outcome: 'Every DON!! did something this turn.',
    certainty: 'any-hand',
    nextTime:
      'Before you end your turn, spend every DON!! that nothing will use on their turn. Give it to an attacker before the attack, not after.',
    lessonId: DON_LESSON,
    sources: ['CR 6-5-5-2', 'SH-DON', 'SH-MIS'],
  };
}

/** The generator `scripts/drill-bank.ts` registers: the bank on the pinned lists, with its build stamp. */
export function generateDonBank(
  cards: Cards,
  opts: { maxSeeds?: number; log?: (line: string) => void } = {},
): DrillBank & { counts: Record<string, number> } {
  const counts: Record<string, number> = {};
  const items = donBank(metaListSets(), cards, {
    ...(opts.maxSeeds ? { maxSeed: opts.maxSeeds } : {}),
    onItem: (i) => {
      const k = i.hold ? 'hold' : 'ordinary';
      counts[k] = (counts[k] ?? 0) + 1;
      opts.log?.(`${i.id}: ${k}`);
    },
  });
  return {
    drill: 'don',
    builtWith: { engine: ENGINE_VERSION, scripts: DRILL_SCRIPTS_VERSION },
    items,
    counts,
  };
}
