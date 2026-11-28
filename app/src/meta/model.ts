/**
 * M9 WP1: what the Meta Explorer shows, as data. Tiles and the header come from
 * `docs/research/meta-lists.json` (read at build; the weekly meta job refreshes it with no code
 * change), the matchup grid from the guides' Matchups tables. Nothing here reads a clock or a card
 * image; the screens pass `today` and the loaded cards in.
 */
import { automation, playsFully, type Card } from '@optcg/cards';
import meta from '../../../docs/research/meta-lists.json';
import { SCRIPTED } from '../cards/scripts.ts';
import { dateRange } from './stale.ts';
import type { Cell, Guide, GuideMatchup, Tile } from './types.ts';

interface MetaList {
  date: string;
  main: { id: string; count: number }[];
}
interface MetaArchetype {
  id: string;
  leaderId: string;
  name: string;
  colors: string[];
  metaShare: number;
  metaSharePostBan: number | null;
  tierOpmetagame: string | null;
  tierOpmetagameLabel: string | null;
  /** Added by `meta:update` with no guide or playbook yet ("Guide pending"). */
  guidePending?: boolean;
  lists: MetaList[];
}
interface MetaFile {
  asOf: string;
  format: string;
  window: { from: string; to: string };
  countingMethod: string;
  archetypes: MetaArchetype[];
}
const META = meta as unknown as MetaFile;

/** How the counting method is told to the player (the header's disclosure). */
export const countingMethod = (): string => META.countingMethod;
export const metaAsOf = (): string => META.asOf;

/** "Luffy (Black)", "Enel (Purple)": two archetypes with one Leader name are told apart by colour. */
export function displayNames(archetypes: readonly MetaArchetype[] = META.archetypes) {
  const count = new Map<string, number>();
  for (const a of archetypes) count.set(a.name, (count.get(a.name) ?? 0) + 1);
  const out = new Map<string, string>();
  for (const a of archetypes)
    out.set(
      a.leaderId,
      (count.get(a.name) ?? 0) > 1
        ? `${a.name.replace(/^Monkey\.D\./, '')} (${a.colors.join('/')})`
        : a.name,
    );
  return out;
}

const NAMES = displayNames();

/** The grid's compact names ("Rocks W–L", "Rocks against Kaido"); elsewhere the display name. */
const SHORT: Record<string, string> = {
  'OP17-039': 'Rocks',
  'OP12-061': 'Rosinante',
};
export const shortName = (leaderId: string): string =>
  SHORT[leaderId] ?? NAMES.get(leaderId) ?? leaderId;
export const displayName = (leaderId: string): string => NAMES.get(leaderId) ?? leaderId;

/** "Purple and Yellow": colours are words, never colour alone. */
export const colorWords = (colors: readonly string[]): string => colors.join(' and ');

/** Tiles, in the file's order. `cards` (the first lists' cards, once loaded) tells vanilla and keyword-only cards from unscripted ones. */
export function tiles(cards?: ReadonlyMap<string, Card>): Tile[] {
  return META.archetypes.map((a) => {
    const main = a.lists[0]?.main ?? [];
    let n = 0;
    let of = 0;
    for (const c of main) {
      of += c.count;
      const card = cards?.get(c.id);
      const plays = card ? playsFully(automation(card, SCRIPTED)) : SCRIPTED.has(c.id);
      if (plays) n += c.count;
    }
    return {
      leaderId: a.leaderId,
      archetypeId: a.id,
      name: displayName(a.leaderId),
      colors: a.colors,
      tier: a.tierOpmetagame,
      tierSource: a.tierOpmetagame
        ? `opmetagame tier list${a.tierOpmetagameLabel ? ` (“${a.tierOpmetagameLabel}”)` : ''}, as recorded in the research`
        : null,
      metaShare: a.metaShare,
      metaSharePostBan: a.metaSharePostBan,
      listDates: a.lists.map((l) => l.date),
      guide: a.guidePending !== true,
      automated: { n, of },
      deckId: a.lists.length > 0 ? `${a.id}#1` : null,
    };
  });
}

/** "English Standard · as of 2026-10-28 · 33 online events, 30 Jul to 28 Oct" (every part read from the file). */
export function header(): string {
  const std = /^English\b/.test(META.format) && /Standard/.test(META.format);
  const events =
    /across (\d+) [^.(]*?\bevents\b/.exec(META.countingMethod)?.[1] ??
    /(\d+) (?:[A-Za-z-]+ ){0,4}events/.exec(META.countingMethod)?.[1];
  const parts = [
    std ? 'English Standard' : META.format.split(/[,(]/)[0]!.trim(),
    `as of ${META.asOf}`,
    `${events ? `${events} online events, ` : ''}${dateRange(META.window.from, META.window.to)}`,
  ];
  return parts.join(' · ');
}

/** The newest list date a tile shows, and what a screen needs to flag stale lists. */
export const tileLists = (t: Tile): { date: string }[] => t.listDates.map((date) => ({ date }));

/** The screen-reader name of a tile (learning-ui §5.1). */
export function tileLabel(t: Tile): string {
  const bits = [
    t.name,
    colorWords(t.colors),
    t.tier ? `tier ${t.tier} on opmetagame` : 'no tier',
    `${t.metaShare}% of lists`,
  ];
  if (t.metaSharePostBan !== null) bits.push(`${t.metaSharePostBan}% since the ban`);
  return `${bits.join(', ')}. ${t.guide ? 'Guide and ' : 'Guide pending, '}${t.listDates.length} lists.`;
}

/** The tile's automation line: the consequence when a deck does not play fully (UX-R42). */
export function automationLine(t: Tile): string {
  const { n, of } = t.automated;
  return n >= of
    ? `${n} of ${of} cards automated`
    : `Plays with a generic AI; ${of - n} card effects not automated`;
}

export type SortKey = 'share' | 'postban' | 'tier' | 'color' | 'name';
export const SORT_LABELS: Record<SortKey, string> = {
  share: 'Share of lists',
  postban: 'Share since the ban',
  tier: 'Tier',
  color: 'Colour',
  name: 'Name',
};

const tierRank = (t: Tile) => (t.tier ? t.tier.charCodeAt(0) : 999);

/** Sorted copy; ties fall back to share, then name, so the order is stable. */
export function sortTiles(list: readonly Tile[], key: SortKey): Tile[] {
  const byName = (a: Tile, b: Tile) => a.name.localeCompare(b.name);
  const byShare = (a: Tile, b: Tile) => b.metaShare - a.metaShare || byName(a, b);
  const cmp: Record<SortKey, (a: Tile, b: Tile) => number> = {
    share: byShare,
    postban: (a, b) => (b.metaSharePostBan ?? -1) - (a.metaSharePostBan ?? -1) || byShare(a, b),
    tier: (a, b) => tierRank(a) - tierRank(b) || byShare(a, b),
    color: (a, b) => (a.colors[0] ?? '').localeCompare(b.colors[0] ?? '') || byShare(a, b),
    name: byName,
  };
  return [...list].sort(cmp[key]);
}

/** Tiles with `color` among their colours; `null` keeps all. */
export const filterByColor = (list: readonly Tile[], color: string | null): Tile[] =>
  color === null ? [...list] : list.filter((t) => t.colors.includes(color));

/** Every colour in the tiles, in the order the game lists them. */
export function colorsOf(list: readonly Tile[]): string[] {
  const order = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow'];
  const seen = new Set(list.flatMap((t) => t.colors));
  return [...order.filter((c) => seen.has(c)), ...[...seen].filter((c) => !order.includes(c))];
}

// ---- matchup grid ----

const isMirror = (a: GuideMatchup, b: GuideMatchup): boolean =>
  a.record !== null && b.record !== null && a.record.w === b.record.l && a.record.l === b.record.w;

/**
 * 12 rows ("you play") by 12 columns ("against"), in the file's archetype order. Two guides that both
 * give a record for one pairing and do not agree (one's W–L is not the other's L–W) mark the cell
 * `disagree` and keep both views, so the popover can show each with its source.
 */
export function matchupGrid(guides: readonly Guide[]): Cell[][] {
  const byLeader = new Map(guides.map((g) => [g.leaderId, g]));
  // Archetypes whose guide is pending have no Matchups table yet: the grid holds the guided ones.
  const ids = guidedLeaders();
  return ids.map((row) =>
    ids.map((col): Cell => {
      if (row === col) return { row, col, mirror: true, entry: null, disagree: false, other: null };
      const entry = byLeader.get(row)?.matchups.find((m) => m.opponent === col) ?? null;
      const other = byLeader.get(col)?.matchups.find((m) => m.opponent === row) ?? null;
      const disagree = entry?.record != null && other?.record != null && !isMirror(entry, other);
      return { row, col, mirror: false, entry, disagree, other };
    }),
  );
}

/**
 * What a cell shows: the row deck's W–L where a source gives one, else "plan". Never a percentage. The
 * plan glyph and the "sources disagree" mark are drawn beside the words, so a cell's visible text is
 * inside its accessible name (WCAG 2.5.3).
 */
export function cellMarker(c: Cell): string {
  if (c.mirror) return 'mirror';
  const r = c.entry?.record;
  return r ? `${r.w}–${r.l}` : 'plan';
}

/** "Rocks W–L" label for a record: whose wins and losses the numbers are. */
export const recordOwner = (m: GuideMatchup): string =>
  m.owner ? `${shortName(m.owner)} W–L` : '';

/** The screen-reader name of a cell (learning-ui §5.3). */
export function cellLabel(c: Cell): string {
  const head = `${shortName(c.row)} against ${shortName(c.col)}`;
  if (c.mirror) return `${head}: mirror. Enter for details.`;
  if (!c.entry) return `${head}: no plan written. Enter for details.`;
  const bits: string[] = [];
  const r = c.entry.record;
  if (r) bits.push(`record ${r.w}–${r.l}, ${recordOwner(c.entry)}`);
  bits.push('plan available');
  bits.push(c.entry.inference ? 'inference' : 'sourced');
  if (c.disagree) bits.push('sources disagree');
  return `${head}: ${bits.join(', ')}. Enter for details.`;
}

/** `/play?p1=&p2=` for a pairing: the first sourced list of each deck (Setup reads these). */
export function matchupHref(row: string, col: string): string {
  const id = (leader: string) => {
    const a = META.archetypes.find((x) => x.leaderId === leader);
    return a && a.lists.length > 0 ? `${a.id}#1` : leader;
  };
  return `/play?p1=${encodeURIComponent(id(row))}&p2=${encodeURIComponent(id(col))}`;
}

export type MoveKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End';

/**
 * Where an arrow key goes in a wrapped grid of tiles (learning-ui §5.1: arrows move across tiles in
 * grid order). Left and right step through the order; up and down go to the nearest tile, by left
 * edge, in the neighbouring row. `pos` holds each tile's top-left in layout order. Stays at an edge.
 */
export function gridMove(
  pos: readonly { x: number; y: number }[],
  i: number,
  key: MoveKey,
): number {
  const last = pos.length - 1;
  if (key === 'Home') return 0;
  if (key === 'End') return last;
  if (key === 'ArrowLeft') return Math.max(0, i - 1);
  if (key === 'ArrowRight') return Math.min(last, i + 1);
  const cur = pos[i];
  if (!cur) return i;
  const rows = [...new Set(pos.map((p) => p.y))].sort((a, b) => a - b);
  const next = rows[rows.indexOf(cur.y) + (key === 'ArrowDown' ? 1 : -1)];
  if (next === undefined) return i;
  let best = i;
  let dist = Infinity;
  pos.forEach((p, j) => {
    if (p.y !== next) return;
    const d = Math.abs(p.x - cur.x);
    if (d < dist) {
      dist = d;
      best = j;
    }
  });
  return best;
}

/**
 * The app's archetype id for a Leader (`OP09-062-nico-robin`, the id `DECKS` and `?p1=` use). Two
 * guides' front-matter `archetypeId` differ from it (`OP09-062-robin`, `OP05-098-enel`), so links
 * built from a guide go through here.
 */
/** Leaders of archetypes with a written guide (not `guidePending`), in the file's order. */
export const guidedLeaders = (): string[] =>
  META.archetypes.filter((a) => a.guidePending !== true).map((a) => a.leaderId);

/** The archetype whose guide is pending, for the Meta Explorer's "Guide pending" page. */
export const pendingArchetype = (key: string): MetaArchetype | undefined =>
  META.archetypes.find((a) => a.guidePending === true && (a.leaderId === key || a.id === key));

export const archetypeIdOf = (leaderId: string): string =>
  META.archetypes.find((a) => a.leaderId === leaderId)?.id ?? leaderId;
