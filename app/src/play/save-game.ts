/**
 * The PlayRoute save seam (M8 WP0): `onGameOver(record) → store.saveGame`. One call per finished
 * game against the AI; never for hotseat, never before the game is over, never twice. WP5 swaps the
 * store behind it for IndexedDB; the caller does not change.
 */
import type { GameResult, PlayerId } from '@optcg/engine';
import type { AiTier } from '@optcg/ai';
import type { SessionRecord } from '../session/index.ts';
import { getStore } from '../store/index.ts';
import { reportStoreError } from '../store/open.ts';
import type { GameMeta, ReviewStore } from '../store/types.ts';

/** What the saver reads from a game: a `GameController` fits through `sourceOf`. */
export interface SaveSource {
  mode: 'ai' | 'hotseat';
  me: PlayerId;
  tier: AiTier;
  result: GameResult | null;
  record(): SessionRecord;
  leaderOf(p: PlayerId): string;
  deckName?: string;
  /** The last game turn. */
  turn(): number;
}

export function metaFrom(src: SaveSource, record: SessionRecord, endedAt: number): GameMeta {
  const r = src.result;
  return {
    result: !r || !('winner' in r) ? 'draw' : r.winner === src.me ? 'won' : 'lost',
    me: src.me,
    myLeader: src.leaderOf(src.me),
    opponentLeader: src.leaderOf(src.me === 'p1' ? 'p2' : 'p1'),
    tier: src.tier,
    deckName: src.deckName ?? '',
    turns: src.turn(),
    endedAt,
    tags: record.rewinds.length > 0 ? ['Rewound'] : [],
    versions: record.versions,
  };
}

export class GameSaver {
  private saved = new WeakMap<object, string>();

  constructor(
    private readonly store: () => ReviewStore = getStore,
    private readonly now: () => number = Date.now,
    /** Called when a save fails (quota, storage off); the game itself is unaffected. */
    private readonly onError: (e: unknown) => void = reportStoreError,
  ) {}

  /** The saved id of this game, once saved. */
  idOf(key: object): string | undefined {
    return this.saved.get(key);
  }

  /**
   * Call on every change of the game. Saves once, when the game against the AI is over. `key` is the
   * game's identity (its controller).
   */
  observe(key: object, src: SaveSource): Promise<string | null> {
    if (src.mode !== 'ai' || !src.result || this.saved.has(key)) return Promise.resolve(null);
    const record = src.record();
    const endedAt = this.now();
    const id = `g${endedAt.toString(36)}-${Math.abs(('setup' in record.start ? record.start.setup.seed : record.start.scenario.seed) | 0).toString(36)}`;
    this.saved.set(key, id);
    return this.store()
      .saveGame({ id, record, meta: metaFrom(src, record, endedAt) })
      .then(
        () => id,
        (e: unknown) => {
          this.onError(e);
          return null;
        },
      );
  }
}

export const gameSaver = new GameSaver();
