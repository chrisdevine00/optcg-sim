/**
 * A synchronous face for the small keyed stores (tutorial timing, lethal progress). The app's
 * existing code reads them synchronously (`TimingStore.load()`, `readLethalProgress()`), so the
 * IndexedDB store is read into memory once at boot (`initStore`) and every write goes to memory at
 * once and to IndexedDB in the same call (the transaction starts before `set` returns). A failed
 * write is reported (`onError`), never thrown: a log that cannot be saved lasts for the session.
 *
 * A write is not durable until its transaction commits, and a page that reloads or closes first can
 * lose it (the browser aborts a transaction still in flight: M8-R4, a delete came back after a
 * reload). So every write is also journalled in localStorage, synchronously, and the entry is
 * removed once IndexedDB has committed that write. The next `hydrate` applies any entry still there
 * over what IndexedDB holds and writes it again. The journal is a few small entries at most.
 */
import type { KvStore } from './types.ts';

export const JOURNAL_PREFIX = 'optcg-sim.kv-journal.';

type Entry = { del: true } | { v: unknown };

function localStore(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export class SyncKv {
  private readonly cache = new Map<string, unknown>();
  private readonly pending = new Set<Promise<void>>();
  /** The newest write per key: a commit removes the journal entry only if nothing newer replaced it. */
  private readonly newest = new Map<string, number>();
  private seq = 0;

  private constructor(
    private readonly kv: KvStore,
    private readonly onError: (e: unknown) => void,
    /** The journal's name (`timing`, `progress`); null for no journal. */
    private readonly journal: string | null,
    private readonly ls: Storage | null,
  ) {}

  static async hydrate(
    kv: KvStore,
    onError: (e: unknown) => void = () => undefined,
    journal: string | null = null,
    ls: Storage | null = localStore(),
  ): Promise<SyncKv> {
    const s = new SyncKv(kv, onError, journal, ls);
    for (const k of await kv.keys()) s.cache.set(k, await kv.get(k));
    s.replayJournal();
    return s;
  }

  get(key: string): unknown {
    return structuredClone(this.cache.get(key));
  }
  keys(): string[] {
    return [...this.cache.keys()];
  }
  values(): unknown[] {
    return [...this.cache.values()].map((v) => structuredClone(v));
  }
  set(key: string, value: unknown): void {
    const copy = structuredClone(value);
    this.cache.set(key, copy);
    this.write(key, { v: copy }, () => this.kv.set(key, copy));
  }
  delete(key: string): void {
    if (!this.cache.delete(key)) return;
    this.write(key, { del: true }, () => this.kv.delete(key));
  }

  private jkey(key: string): string {
    return `${JOURNAL_PREFIX}${this.journal}.${key}`;
  }

  /** Journal the write, then start the IndexedDB write now, inside this call (no promise chain). */
  private write(key: string, entry: Entry, write: () => Promise<void>): void {
    const n = ++this.seq;
    this.newest.set(key, n);
    if (this.journal !== null) {
      try {
        this.ls?.setItem(this.jkey(key), JSON.stringify(entry));
      } catch {
        /* storage full or off: the IndexedDB write stands alone */
      }
    }
    let p: Promise<void>;
    try {
      p = write();
    } catch (e) {
      this.onError(e);
      return;
    }
    const tracked: Promise<void> = p
      .then(() => {
        // Committed. A newer write to the same key keeps its own entry.
        if (this.newest.get(key) === n) {
          this.newest.delete(key);
          if (this.journal !== null)
            try {
              this.ls?.removeItem(this.jkey(key));
            } catch {
              /* nothing to do */
            }
        }
      })
      .catch((e: unknown) => this.onError(e))
      .finally(() => this.pending.delete(tracked));
    this.pending.add(tracked);
  }

  /** At start: writes the last page did not get committed are applied, and written again. */
  private replayJournal(): void {
    if (this.journal === null || !this.ls) return;
    const prefix = `${JOURNAL_PREFIX}${this.journal}.`;
    const found: { key: string; entry: Entry }[] = [];
    try {
      for (let i = 0; i < this.ls.length; i++) {
        const k = this.ls.key(i);
        if (!k?.startsWith(prefix)) continue;
        try {
          const entry = JSON.parse(this.ls.getItem(k) ?? 'null') as Entry | null;
          if (entry && ('del' in entry || 'v' in entry))
            found.push({ key: k.slice(prefix.length), entry });
          else this.ls.removeItem(k);
        } catch {
          this.ls.removeItem(k); // unreadable: it could not be applied
        }
      }
    } catch {
      return;
    }
    for (const { key, entry } of found) {
      if ('del' in entry) {
        this.cache.delete(key);
        this.write(key, entry, () => this.kv.delete(key));
      } else {
        this.cache.set(key, structuredClone(entry.v));
        this.write(key, entry, () => this.kv.set(key, entry.v));
      }
    }
  }

  /** Resolves when every write so far has reached the store. */
  async flush(): Promise<void> {
    while (this.pending.size > 0) await Promise.all([...this.pending]);
  }
}
