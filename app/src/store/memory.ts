/** In-memory `ReviewStore`: the test double and the fallback when IndexedDB is unavailable. */
import {
  EXPORT_SCHEMA,
  MAX_GAMES,
  StoreQuotaError,
  type CurrentGame,
  type ExportBundle,
  type GameSummary,
  type ImportReport,
  type KvStore,
  type ReviewStore,
  type StoredGame,
  type StoredReview,
} from './types.ts';

class MemoryKv implements KvStore {
  readonly map = new Map<string, unknown>();
  get = (key: string) => Promise.resolve(structuredClone(this.map.get(key)));
  set = (key: string, value: unknown) => {
    this.map.set(key, structuredClone(value));
    return Promise.resolve();
  };
  delete = (key: string) => {
    this.map.delete(key);
    return Promise.resolve();
  };
  keys = () => Promise.resolve([...this.map.keys()]);
}

export class MemoryStore implements ReviewStore {
  readonly kind = 'memory' as const;
  private games = new Map<string, StoredGame>();
  private reviews = new Map<string, StoredReview>();
  private current: CurrentGame | undefined;
  readonly timing = new MemoryKv();
  readonly progress = new MemoryKv();
  readonly meta = new MemoryKv();

  constructor(private readonly maxGames = MAX_GAMES) {}

  saveGame(game: StoredGame): Promise<void> {
    if (!this.games.has(game.id) && this.games.size >= this.maxGames)
      return Promise.reject(new StoreQuotaError('max-games'));
    this.games.set(game.id, structuredClone(game));
    return Promise.resolve();
  }
  getGame(id: string): Promise<StoredGame | undefined> {
    return Promise.resolve(structuredClone(this.games.get(id)));
  }
  listGames(): Promise<GameSummary[]> {
    return Promise.resolve(
      [...this.games.values()]
        .map((g) => ({ id: g.id, meta: structuredClone(g.meta) }))
        .sort((a, b) => b.meta.endedAt - a.meta.endedAt),
    );
  }
  deleteGame(id: string): Promise<void> {
    this.games.delete(id);
    this.reviews.delete(id);
    return Promise.resolve();
  }

  saveReview(review: StoredReview): Promise<void> {
    this.reviews.set(review.gameId, structuredClone(review));
    return Promise.resolve();
  }
  getReview(gameId: string): Promise<StoredReview | undefined> {
    return Promise.resolve(structuredClone(this.reviews.get(gameId)));
  }
  deleteReview(gameId: string): Promise<void> {
    this.reviews.delete(gameId);
    return Promise.resolve();
  }

  getCurrent(): Promise<CurrentGame | undefined> {
    return Promise.resolve(structuredClone(this.current));
  }
  setCurrent(slot: CurrentGame): Promise<void> {
    this.current = structuredClone(slot);
    return Promise.resolve();
  }
  clearCurrent(): Promise<void> {
    this.current = undefined;
    return Promise.resolve();
  }

  async exportAll(build: string): Promise<ExportBundle> {
    const toObject = (kv: MemoryKv) => Object.fromEntries(structuredClone([...kv.map]));
    return {
      schema: EXPORT_SCHEMA,
      exportedAt: Date.now(),
      build,
      games: structuredClone([...this.games.values()]),
      reviews: structuredClone([...this.reviews.values()]),
      timing: toObject(this.timing),
      progress: toObject(this.progress),
    };
  }

  async importAll(bundle: ExportBundle, conflict: 'replace' | 'keep-both'): Promise<ImportReport> {
    const report: ImportReport = { added: 0, replaced: 0, keptBoth: 0, skipped: 0 };
    for (const g of bundle.games) {
      let id = g.id;
      if (this.games.has(id)) {
        if (conflict === 'keep-both') {
          id = `${g.id}-imported-${this.games.size}`;
          while (this.games.has(id)) id += 'x';
          report.keptBoth++;
        } else report.replaced++;
      } else report.added++;
      if (!this.games.has(id) && this.games.size >= this.maxGames) {
        report.skipped++;
        continue;
      }
      this.games.set(id, structuredClone({ ...g, id }));
      const rv = bundle.reviews.find((r) => r.gameId === g.id);
      if (rv) this.reviews.set(id, structuredClone({ ...rv, gameId: id }));
    }
    for (const [k, v] of Object.entries(bundle.timing)) await this.timing.set(k, v);
    for (const [k, v] of Object.entries(bundle.progress)) await this.progress.set(k, v);
    return report;
  }

  deleteAll(): Promise<void> {
    this.games.clear();
    this.reviews.clear();
    this.current = undefined;
    this.timing.map.clear();
    this.progress.map.clear();
    this.meta.map.clear();
    return Promise.resolve();
  }
}
