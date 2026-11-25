/**
 * M8 WP0: the review store contract. Saved games, their reviews, the resume slot, tutorial timing,
 * lethal progress and metadata. The in-memory implementation (`memory.ts`) is the test double and the
 * fallback when IndexedDB is unavailable; WP5 adds the IndexedDB one behind the same interface.
 * Nothing here touches the network.
 */
import type { PlayerId } from '@optcg/engine';
import type { AiTier, PracticedState, ReviewMarker, TurnResult } from '@optcg/ai';
import type { SessionRecord } from '../session/index.ts';

/** The most games the store keeps; a save past it is a `StoreQuotaError`, never a silent delete. */
export const MAX_GAMES = 200;

export const EXPORT_SCHEMA = 'optcg-sim/export/1';

/** Storage is full (the browser's `QuotaExceededError`, or `MAX_GAMES`). The UI offers to delete. */
export class StoreQuotaError extends Error {
  constructor(
    readonly reason: 'browser' | 'max-games' = 'browser',
    message = 'Saved games are full.',
  ) {
    super(message);
    this.name = 'StoreQuotaError';
  }
}

export interface GameMeta {
  result: 'won' | 'lost' | 'draw';
  /** The human's seat. */
  me: PlayerId;
  myLeader: string;
  opponentLeader: string;
  tier: AiTier;
  deckName: string;
  /** The last game turn. */
  turns: number;
  /** Epoch ms. */
  endedAt: number;
  /** 'Rewound', 'From review', … */
  tags: string[];
  versions: { engine: string; cards: string; scripts: string };
}

export interface StoredGame {
  id: string;
  record: SessionRecord;
  meta: GameMeta;
}

/** A game without its record: what History lists. */
export type GameSummary = { id: string; meta: GameMeta };

export interface StoredReview {
  gameId: string;
  analysisVersion: number;
  engineVersion: string;
  status: 'running' | 'partial' | 'complete';
  /** Results by item id. */
  results: Record<string, TurnResult>;
  markers: ReviewMarker[];
  /** By flag id. */
  practised: Record<string, PracticedState>;
}

/** The resume slot: the game in progress, checkpointed at every move end. */
export interface CurrentGame {
  record: SessionRecord;
  savedAt: number;
  myLeader: string;
  opponentLeader: string;
  turn: number;
}

/** A small keyed store: tutorial timing runs, lethal progress, schema metadata. */
export interface KvStore {
  get(key: string): Promise<unknown | undefined>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export interface ExportBundle {
  schema: typeof EXPORT_SCHEMA;
  exportedAt: number;
  build: string;
  games: StoredGame[];
  reviews: StoredReview[];
  timing: Record<string, unknown>;
  progress: Record<string, unknown>;
}

/** What to do with an imported game whose id already exists. */
export type ImportConflict = 'replace' | 'keep-both' | 'cancel';

export interface ImportReport {
  added: number;
  replaced: number;
  keptBoth: number;
  skipped: number;
}

export interface ReviewStore {
  /** Where the data lives, for the one "Saving is off in this browser" notice. */
  readonly kind: 'memory' | 'indexeddb';

  // games (newest first from `listGames`)
  saveGame(game: StoredGame): Promise<void>;
  getGame(id: string): Promise<StoredGame | undefined>;
  listGames(): Promise<GameSummary[]>;
  /** Removes the game and its review. */
  deleteGame(id: string): Promise<void>;

  // reviews, keyed by game id
  saveReview(review: StoredReview): Promise<void>;
  getReview(gameId: string): Promise<StoredReview | undefined>;
  deleteReview(gameId: string): Promise<void>;

  // the resume slot
  getCurrent(): Promise<CurrentGame | undefined>;
  setCurrent(slot: CurrentGame): Promise<void>;
  clearCurrent(): Promise<void>;

  readonly timing: KvStore;
  readonly progress: KvStore;
  readonly meta: KvStore;

  /** Everything, as one export document. */
  exportAll(build: string): Promise<ExportBundle>;
  /** `bundle` is already validated (WP5's validator); `conflict` applies to ids already stored. */
  importAll(
    bundle: ExportBundle,
    conflict: Exclude<ImportConflict, 'cancel'>,
  ): Promise<ImportReport>;
  deleteAll(): Promise<void>;
}
