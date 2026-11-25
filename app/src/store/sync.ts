/**
 * A synchronous face for the small keyed stores (tutorial timing, lethal progress). The app's
 * existing code reads them synchronously (`TimingStore.load()`, `readLethalProgress()`), so the
 * IndexedDB store is read into memory once at boot (`initStore`) and every write goes to memory at
 * once and to IndexedDB behind it, in order. A failed write is reported (`onError`), never thrown:
 * a log that cannot be saved lasts for the session.
 */
import type { KvStore } from './types.ts';

export class SyncKv {
  private readonly cache = new Map<string, unknown>();
  private chain: Promise<void> = Promise.resolve();

  private constructor(
    private readonly kv: KvStore,
    private readonly onError: (e: unknown) => void,
  ) {}

  static async hydrate(
    kv: KvStore,
    onError: (e: unknown) => void = () => undefined,
  ): Promise<SyncKv> {
    const s = new SyncKv(kv, onError);
    for (const k of await kv.keys()) s.cache.set(k, await kv.get(k));
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
    this.queue(() => this.kv.set(key, copy));
  }
  delete(key: string): void {
    if (!this.cache.delete(key)) return;
    this.queue(() => this.kv.delete(key));
  }

  private queue(write: () => Promise<void>): void {
    this.chain = this.chain.then(write).catch((e: unknown) => this.onError(e));
  }

  /** Resolves when every write so far has reached the store. */
  flush(): Promise<void> {
    return this.chain;
  }
}
