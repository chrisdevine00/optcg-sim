/**
 * M9 WP0: the Meta Explorer's contracts (docs/design/m9-plan.md, WP1). Guides are parsed at build time
 * from `docs/content/archetypes/*.md`, tiles and the header from `docs/research/meta-lists.json`.
 * Types only: nothing here is imported as a value on the boot path.
 */

/** A run of guide text: plain, a `[TAG]` resolved through `sources.md`, or an *(inference)* mark. */
export type Span =
  | { kind: 'text'; text: string }
  | { kind: 'source'; tag: string; label: string; url: string | null }
  | { kind: 'inference' };

export type GuideBlock =
  { kind: 'p'; spans: Span[] } | { kind: 'list'; ordered: boolean; items: Span[][] };

/** One `## ` section, in file order. */
export interface GuideSection {
  /** Slug of the heading: `game-plan-by-turn`. */
  id: string;
  heading: string;
  blocks: GuideBlock[];
}

/** One row of a guide's Matchups table. */
export interface GuideMatchup {
  /** Leader id of the opposing archetype. */
  opponent: string;
  /** The sourced record, or null when the guide gives none ("11-12 (even)": text "even"). */
  record: { w: number; l: number; text: string } | null;
  /** Whose record it is (a source tag or the guide's leader), null when there is no record. */
  owner: string | null;
  plan: Span[];
  /** `[TAG]`s found in the row, resolved or not (a test requires every tag in `sources.md`). */
  tags: string[];
  /** The plan is our reasoning, marked *(inference)*. */
  inference: boolean;
}

/** One row of a guide's Sourced lists table. */
export interface GuideList {
  event: string;
  date: string;
  players: number | null;
  placing: string;
  record: string;
  player: string;
  url: string | null;
}

export interface Guide {
  title: string;
  leaderId: string;
  archetypeId: string;
  colors: string[];
  /** ISO date from the front matter. */
  asOf: string;
  confidence: string;
  /** Front-matter sources: file paths and URLs. */
  sources: string[];
  sections: GuideSection[];
  matchups: GuideMatchup[];
  lists: GuideList[];
  /** The Playbook seeds, one item per numbered line. */
  playbook: Span[][];
}

/** A tile on `/meta`. */
export interface Tile {
  leaderId: string;
  archetypeId: string;
  /** Disambiguated by colour: "Luffy (Black)". */
  name: string;
  colors: string[];
  /** opmetagame tier letter and where it came from, null when untiered. */
  tier: string | null;
  tierSource: string | null;
  metaShare: number;
  metaSharePostBan: number | null;
  /** Lists with their dates, for "Lists: 8 to 13 Oct" and the staleness flag. */
  listDates: string[];
  /** "N of 50 cards automated" from the scripts index. */
  automated: { n: number; of: number };
  /** Id of the first deck in `DECKS` for this leader, for Play this deck / against this deck. */
  deckId: string | null;
}

export interface Staleness {
  days: number;
  /** More than 60 days. */
  stale: boolean;
  /** "Lists: 8 to 13 Oct" or "Lists may be out of date (73 days)". */
  label: string;
}

/** One cell of the matchup grid: the row archetype's plan against the column's. */
export interface Cell {
  row: string;
  col: string;
  mirror: boolean;
  /** The row guide's entry; null on the mirror. */
  entry: GuideMatchup | null;
  /** Both guides list a record for the pairing and they differ. */
  disagree: boolean;
  /** The column guide's view of the same pairing, shown beside it when `disagree`. */
  other: GuideMatchup | null;
}
