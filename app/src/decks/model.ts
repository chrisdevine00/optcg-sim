/**
 * The deck builder's pure logic (flows F17): editing, the check rows, coverage, grouping. No rules
 * here: legality comes from the engine's `deckIssues` (one source with Setup and game start).
 */
import { automation, playsFully, type Card } from '@optcg/cards';
import { deckIssues, type DeckFormat, type DeckIssue, type DeckIssueCode } from '@optcg/engine';
import { SCRIPTED } from '../cards/scripts.ts';
import type { SavedDeck } from './store.ts';
import standard from '../../../cards/format/standard.json';

/** From the format file, for the check rows' wording (F17 step 2; review M6-12). */
const FMT = standard as unknown as {
  regulation: { allowedBlocks: (number | string)[] };
  banned: { effective: string | null }[];
  bannedPairs: { effective: string | null }[];
};
const NUMERIC_BLOCKS = FMT.regulation.allowedBlocks.filter(
  (b): b is number => typeof b === 'number',
);
const BLOCKS = `${Math.min(...NUMERIC_BLOCKS)}–${Math.max(...NUMERIC_BLOCKS)}`;
/** The newest effective date across banned cards and banned pairs (a list change may add only pairs). */
const BAN_LIST = [...FMT.banned, ...FMT.bannedPairs]
  .map((b) => b.effective ?? '')
  .sort()
  .at(-1);

export const DECK_SIZE = 50;
export const MAX_COPIES = 4;

export const countOf = (main: readonly string[], id: string) =>
  main.reduce((n, x) => (x === id ? n + 1 : n), 0);

/** Add one copy (always allowed: an over-limit deck is shown as invalid, never silently refused). */
export function addCopy(d: SavedDeck, id: string): SavedDeck {
  return { ...d, main: [...d.main, id] };
}

export function removeCopy(d: SavedDeck, id: string): SavedDeck {
  const i = d.main.lastIndexOf(id);
  if (i < 0) return d;
  return { ...d, main: [...d.main.slice(0, i), ...d.main.slice(i + 1)] };
}

export function issuesOf(d: SavedDeck, lookup: (id: string) => Card | undefined): DeckIssue[] {
  if (!d.leader) return [];
  return deckIssues({ leader: d.leader, main: d.main }, lookup, d.format);
}

export interface CheckRow {
  label: string;
  rule: string;
  ok: boolean;
  /** What fails, when it fails. */
  detail: string[];
  cards: string[];
}

const ROWS: {
  label: (d: SavedDeck) => string;
  rule: string;
  codes: DeckIssueCode[];
  /** Shown only when it fails (a rule only some Leaders have). */
  onlyOnIssue?: true;
}[] = [
  {
    label: (d) => `${DECK_SIZE} cards (${d.main.length})`,
    rule: 'CR 5-1-2',
    codes: ['size', 'unknownCard', 'leaderInDeck', 'notLeader', 'unknownLeader'],
  },
  { label: () => `Max ${MAX_COPIES} per card number`, rule: 'CR 5-1-2-3', codes: ['copies'] },
  { label: () => 'Colours match Leader', rule: 'CR 5-1-2-2', codes: ['color'] },
  {
    label: () => "Leader's deck-building rule",
    rule: 'card rules text',
    codes: ['deckRestriction'],
    onlyOnIssue: true,
  },
  {
    label: () => `No banned cards or pairs${BAN_LIST ? ` (list from ${BAN_LIST})` : ''}`,
    rule: 'official ban list',
    codes: ['banned', 'bannedPair', 'restricted'],
  },
  {
    label: (d) =>
      d.format === 'standard' ? `Standard blocks ${BLOCKS}` : 'Extra Regulation (all blocks)',
    rule: 'official format rules',
    codes: ['rotated', 'legalityUnknown'],
  },
];

/** The check rows at the deck's top (F17 step 2), each with what fails. */
export function checkRows(d: SavedDeck, issues: readonly DeckIssue[]): CheckRow[] {
  return ROWS.filter((r) => !r.onlyOnIssue || issues.some((i) => r.codes.includes(i.code))).map(
    (r) => {
      const mine = issues.filter((i) => r.codes.includes(i.code));
      const errors = mine.filter((i) => i.severity === 'error');
      return {
        label: r.label(d),
        rule: r.rule,
        ok: errors.length === 0,
        detail: mine.map((i) => i.message),
        cards: [...new Set(mine.flatMap((i) => i.cards))],
      };
    },
  );
}

export const blocking = (issues: readonly DeckIssue[]) =>
  issues.filter((i) => i.severity === 'error');

export interface DeckCoverage {
  copies: number;
  copiesFull: number;
  names: number;
  namesFull: number;
  /** Card numbers that play for stats only (no effect script), with copies. */
  statsOnly: { id: string; name: string; count: number }[];
}

/** Coverage by copies (what you draw) and by names (F17 step 3). */
export function deckCoverage(
  main: readonly string[],
  lookup: (id: string) => Card | undefined,
): DeckCoverage {
  const counts = new Map<string, number>();
  for (const id of main) counts.set(id, (counts.get(id) ?? 0) + 1);
  let copiesFull = 0;
  let namesFull = 0;
  const statsOnly: DeckCoverage['statsOnly'] = [];
  for (const [id, n] of counts) {
    const c = lookup(id);
    if (c && playsFully(automation(c, SCRIPTED))) {
      copiesFull += n;
      namesFull++;
    } else statsOnly.push({ id, name: c?.name ?? id, count: n });
  }
  return { copies: main.length, copiesFull, names: counts.size, namesFull, statsOnly };
}

export function coverageLine(c: DeckCoverage): string {
  if (c.copies === 0) return 'Automated: no cards yet';
  const pct = Math.round((c.copiesFull / c.copies) * 100);
  return `Automated: ${c.copiesFull} of ${c.copies} cards (${pct}%) · ${c.namesFull} of ${c.names} card names`;
}

export interface CostGroup {
  label: string;
  rows: { id: string; count: number; card: Card | undefined }[];
}

/** The deck list grouped by cost (0 to 10), Events and Stages by their cost too. */
export function groupByCost(
  main: readonly string[],
  lookup: (id: string) => Card | undefined,
): CostGroup[] {
  const counts = new Map<string, number>();
  for (const id of main) counts.set(id, (counts.get(id) ?? 0) + 1);
  const groups = new Map<number, CostGroup['rows']>();
  for (const [id, count] of counts) {
    const card = lookup(id);
    const cost = card?.cost ?? -1;
    if (!groups.has(cost)) groups.set(cost, []);
    groups.get(cost)!.push({ id, count, card });
  }
  return [...groups]
    .sort(([a], [b]) => a - b)
    .map(([cost, rows]) => ({
      label: cost < 0 ? 'Unknown cards' : `Cost ${cost}`,
      rows: rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    }));
}

/** Can this card go in this deck at all (colour and category), for the browser's default filter? */
export function fitsLeader(card: Card, leader: Card | undefined): boolean {
  if (!leader) return card.category === 'Leader';
  if (card.category === 'Leader') return false;
  return card.colors.every((c) => leader.colors.includes(c));
}

/** Legal in the deck's format (banned, rotated and unknown-block cards are not). */
export function legalIn(card: Card, format: Exclude<DeckFormat, 'free'>): boolean {
  const s = card.legality[format].status;
  return s === 'legal' || s === 'restricted';
}

/** The live-region line after a change (F17 step 1). */
export function changeLine(
  verb: 'Added' | 'Removed',
  card: Card | undefined,
  id: string,
  d: SavedDeck,
): string {
  const n = countOf(d.main, id);
  return `${verb} ${card?.name ?? id}. ${n} of ${MAX_COPIES} copies. Deck ${d.main.length} of ${DECK_SIZE}.`;
}
