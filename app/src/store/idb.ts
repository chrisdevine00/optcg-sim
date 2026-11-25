/**
 * The IndexedDB `ReviewStore` (M8 WP5): a small hand-written promise wrapper, no dependency.
 *
 * Database `optcg-sim`, version 1:
 *   games      key `id`      the whole `StoredGame` (record + meta)
 *   summaries  key `id`      `{id, meta}`, index `endedAt`: what History lists, so listing never
 *                            reads a record (a record is the heavy part; see the size test)
 *   reviews    key `gameId`  `StoredReview`
 *   current    key `slot`    the resume slot
 *   timing     keys by run   tutorial runs
 *   progress   keys by name  lethal progress
 *   meta       keys by name  schema version and migration marks
 *
 * Inside a transaction only IndexedDB requests are awaited, so it never closes early. A browser
 * `QuotaExceededError` (on a request, the transaction or its abort) becomes `StoreQuotaError`.
 */
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

export const DB_NAME = 'optcg-sim';
export const DB_VERSION = 1;
export const SCHEMA_VERSION = 1;

type StoreName = 'games' | 'summaries' | 'reviews' | 'current' | 'timing' | 'progress' | 'meta';
const ALL: StoreName[] = ['games', 'summaries', 'reviews', 'current', 'timing', 'progress', 'meta'];

const isQuota = (e: unknown): boolean =>
  typeof e === 'object' &&
  e !== null &&
  ((e as { name?: string }).name === 'QuotaExceededError' || (e as { code?: number }).code === 22);

/** Turn any IndexedDB failure into an `Error` the UI can handle; quota keeps its own class. */
export function fail(e: unknown): Error {
  if (e instanceof StoreQuotaError) return e;
  if (isQuota(e)) return new StoreQuotaError('browser');
  if (e instanceof Error) return e;
  const msg = (e as { message?: string } | null)?.message;
  return new Error(msg ?? 'Saving failed.');
}

const asPromise = <T>(r: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(fail(r.error));
  });

/** Resolves when the transaction has committed, rejects if it aborted or errored. */
const committed = (tx: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(fail(tx.error));
    tx.onabort = () => reject(fail(tx.error));
  });

/** Open (and on first run create) the database. Rejects if it cannot be opened. */
export function openDb(factory: IDBFactory, name = DB_NAME): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let req: IDBOpenDBRequest;
    try {
      req = factory.open(name, DB_VERSION);
    } catch (e) {
      reject(fail(e));
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('games')) db.createObjectStore('games', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('summaries')) {
        const s = db.createObjectStore('summaries', { keyPath: 'id' });
        s.createIndex('endedAt', 'meta.endedAt');
      }
      if (!db.objectStoreNames.contains('reviews'))
        db.createObjectStore('reviews', { keyPath: 'gameId' });
      for (const n of ['current', 'timing', 'progress', 'meta'] as const)
        if (!db.objectStoreNames.contains(n)) db.createObjectStore(n);
    };
    req.onsuccess = () => {
      const db = req.result;
      // Another tab upgrading the database: close so it is not held up.
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(fail(req.error));
    req.onblocked = () => reject(new Error('The saved-games database is open in another tab.'));
  });
}

class IdbKv implements KvStore {
  constructor(
    private readonly db: IDBDatabase,
    private readonly name: 'timing' | 'progress' | 'meta',
  ) {}
  async get(key: string): Promise<unknown> {
    return asPromise(this.db.transaction(this.name).objectStore(this.name).get(key));
  }
  async set(key: string, value: unknown): Promise<void> {
    await run(this.db, [this.name], (tx) => void tx.objectStore(this.name).put(value, key));
  }
  async delete(key: string): Promise<void> {
    await run(this.db, [this.name], (tx) => void tx.objectStore(this.name).delete(key));
  }
  async keys(): Promise<string[]> {
    const k = await asPromise(this.db.transaction(this.name).objectStore(this.name).getAllKeys());
    return k.map(String);
  }
}

/**
 * One readwrite transaction: `fn` queues its requests, and the result is returned once the
 * transaction has committed. Any failure (including a synchronous throw from `put`) aborts it, so a
 * write is all or nothing, and comes back as `StoreQuotaError` when it was the quota.
 */
async function run<T>(
  db: IDBDatabase,
  names: StoreName[],
  fn: (tx: IDBTransaction) => Promise<T> | T,
): Promise<T> {
  const tx = db.transaction(names, 'readwrite');
  const done = committed(tx);
  done.catch(() => undefined);
  try {
    const out = await fn(tx);
    await done;
    return out;
  } catch (e) {
    try {
      tx.abort();
    } catch {
      /* already finished */
    }
    throw fail(e);
  }
}

async function allOf(db: IDBDatabase, names: StoreName[]) {
  const tx = db.transaction(names);
  const out = {} as Record<StoreName, { keys: IDBValidKey[]; values: unknown[] }>;
  for (const n of names) {
    const s = tx.objectStore(n);
    const [keys, values] = await Promise.all([asPromise(s.getAllKeys()), asPromise(s.getAll())]);
    out[n] = { keys, values };
  }
  return out;
}

export class IdbStore implements ReviewStore {
  readonly kind = 'indexeddb' as const;
  readonly timing: KvStore;
  readonly progress: KvStore;
  readonly meta: KvStore;

  constructor(
    private readonly db: IDBDatabase,
    private readonly maxGames = MAX_GAMES,
  ) {
    this.timing = new IdbKv(db, 'timing');
    this.progress = new IdbKv(db, 'progress');
    this.meta = new IdbKv(db, 'meta');
  }

  static async open(factory: IDBFactory, maxGames = MAX_GAMES, name = DB_NAME): Promise<IdbStore> {
    const store = new IdbStore(await openDb(factory, name), maxGames);
    if ((await store.meta.get('schema')) === undefined)
      await store.meta.set('schema', SCHEMA_VERSION);
    return store;
  }

  close(): void {
    this.db.close();
  }

  // --- games ---

  saveGame(game: StoredGame): Promise<void> {
    return run(this.db, ['games', 'summaries'], async (tx) => {
      const games = tx.objectStore('games');
      const exists = (await asPromise(games.count(game.id))) > 0;
      if (!exists && (await asPromise(games.count())) >= this.maxGames)
        throw new StoreQuotaError('max-games');
      games.put(game);
      tx.objectStore('summaries').put({ id: game.id, meta: game.meta });
    });
  }

  async getGame(id: string): Promise<StoredGame | undefined> {
    return (await asPromise(this.db.transaction('games').objectStore('games').get(id))) as
      StoredGame | undefined;
  }

  async listGames(): Promise<GameSummary[]> {
    const all = (await asPromise(
      this.db.transaction('summaries').objectStore('summaries').getAll(),
    )) as GameSummary[];
    return all.sort((a, b) => b.meta.endedAt - a.meta.endedAt);
  }

  async deleteGame(id: string): Promise<void> {
    await run(this.db, ['games', 'summaries', 'reviews'], (tx) => {
      tx.objectStore('games').delete(id);
      tx.objectStore('summaries').delete(id);
      tx.objectStore('reviews').delete(id);
    });
  }

  // --- reviews ---

  async saveReview(review: StoredReview): Promise<void> {
    await run(this.db, ['reviews'], (tx) => void tx.objectStore('reviews').put(review));
  }

  async getReview(gameId: string): Promise<StoredReview | undefined> {
    return (await asPromise(this.db.transaction('reviews').objectStore('reviews').get(gameId))) as
      StoredReview | undefined;
  }

  async deleteReview(gameId: string): Promise<void> {
    await run(this.db, ['reviews'], (tx) => void tx.objectStore('reviews').delete(gameId));
  }

  // --- the resume slot ---

  async getCurrent(): Promise<CurrentGame | undefined> {
    return (await asPromise(this.db.transaction('current').objectStore('current').get('slot'))) as
      CurrentGame | undefined;
  }

  async setCurrent(slot: CurrentGame): Promise<void> {
    await run(this.db, ['current'], (tx) => void tx.objectStore('current').put(slot, 'slot'));
  }

  async clearCurrent(): Promise<void> {
    await run(this.db, ['current'], (tx) => void tx.objectStore('current').delete('slot'));
  }

  // --- export, import, delete all ---

  async exportAll(build: string): Promise<ExportBundle> {
    const d = await allOf(this.db, ['games', 'reviews', 'timing', 'progress']);
    const toObject = (n: 'timing' | 'progress') =>
      Object.fromEntries(d[n].keys.map((k, i) => [String(k), d[n].values[i]]));
    return {
      schema: EXPORT_SCHEMA,
      exportedAt: Date.now(),
      build,
      games: (d.games.values as StoredGame[]).sort((a, b) => b.meta.endedAt - a.meta.endedAt),
      reviews: d.reviews.values as StoredReview[],
      timing: toObject('timing'),
      progress: toObject('progress'),
    };
  }

  async importAll(bundle: ExportBundle, conflict: 'replace' | 'keep-both'): Promise<ImportReport> {
    const report: ImportReport = { added: 0, replaced: 0, keptBoth: 0, skipped: 0 };
    await run(this.db, ['games', 'summaries', 'reviews', 'timing', 'progress'], async (tx) => {
      const games = tx.objectStore('games');
      const have = new Set((await asPromise(games.getAllKeys())).map(String));
      for (const g of bundle.games) {
        let id = g.id;
        let outcome: 'added' | 'replaced' | 'keptBoth' = 'added';
        if (have.has(id)) {
          if (conflict === 'keep-both') {
            id = `${g.id}-imported`;
            for (let n = 2; have.has(id); n++) id = `${g.id}-imported-${n}`;
            outcome = 'keptBoth';
          } else outcome = 'replaced';
        }
        if (!have.has(id) && have.size >= this.maxGames) {
          report.skipped++;
          continue;
        }
        report[outcome]++;
        have.add(id);
        games.put({ ...g, id });
        tx.objectStore('summaries').put({ id, meta: g.meta });
        const rv = bundle.reviews.find((r) => r.gameId === g.id);
        if (rv) tx.objectStore('reviews').put({ ...rv, gameId: id });
      }
      for (const [k, v] of Object.entries(bundle.timing)) tx.objectStore('timing').put(v, k);
      for (const [k, v] of Object.entries(bundle.progress)) tx.objectStore('progress').put(v, k);
    });
    return report;
  }

  async deleteAll(): Promise<void> {
    const names = ALL.filter((n) => n !== 'meta');
    await run(this.db, names, (tx) => {
      for (const n of names) tx.objectStore(n).clear();
    });
  }
}
