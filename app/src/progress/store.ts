/**
 * The progress store (M9 WP6): `progress.v1` in the `progress` KvStore, written through `recordSession`
 * (the drill shell's one call), `markRead` (a lesson with no drill) and read through `get`. Games and
 * flags are never copied here: they are derived at read time (`derive.ts`). A value that is missing or
 * damaged reads as empty and never throws; storage that is off keeps progress for the session only, as
 * the rest of the app's stores do.
 *
 * Stable contract for the drill shell: `progressSink()` returns the `ProgressSink` of `types.ts`.
 */
import { BUILD } from '../store/data.ts';
import { getStore } from '../store/index.ts';
import { synced } from '../store/open.ts';
import {
  EXPORT_SCHEMA,
  type ExportBundle,
  type KvStore,
  type ReviewStore,
} from '../store/types.ts';
import { PROGRESS_KEY, sanitizeProgress, sanitizeSession } from '../store/validate.ts';
import { codeOf, drillPassedAt, EXIT, isDrillRule } from './exit.ts';
import { capSessions, mergeProgress } from './merge.ts';
import type { DrillSession, LessonCode, ProgressSink, ProgressV1 } from './types.ts';

export { PROGRESS_KEY };

export const emptyProgress = (): ProgressV1 => ({ v: 1, lessons: {}, sessions: [] });

/** What is stored, made safe: damaged or foreign data reads as nothing. */
export function readable(raw: unknown): ProgressV1 {
  if (raw === undefined) return emptyProgress();
  try {
    return sanitizeProgress(raw);
  } catch {
    return emptyProgress();
  }
}

/**
 * The app's `progress` KvStore: the synchronous cache `initStore` hydrated (its writes are journalled,
 * so a reload straight after a drill cannot lose the session) when there is one, else the store's own.
 */
export function appKv(): KvStore {
  const sync = synced.progress;
  if (!sync) return getStore().progress;
  return {
    get: (k) => Promise.resolve(sync.get(k)),
    set: (k, v) => {
      sync.set(k, v);
      return Promise.resolve();
    },
    delete: (k) => {
      sync.delete(k);
      return Promise.resolve();
    },
    keys: () => Promise.resolve(sync.keys()),
  };
}

/** Writes are read-modify-write; one queue for the whole page keeps two quick ones from clobbering. */
let queue: Promise<unknown> = Promise.resolve();
const serial = <T>(f: () => Promise<T>): Promise<T> => {
  const next = queue.then(f, f);
  queue = next.catch(() => undefined);
  return next;
};

export interface ProgressStore {
  get(): Promise<ProgressV1>;
  /** Adds a drill session and credits the lesson when its exit has now been met. */
  recordSession(s: DrillSession): Promise<void>;
  /** "Mark as read" on a lesson with no drill: status "read", never "passed". */
  markRead(code: LessonCode, at?: string): Promise<void>;
  /** Forgets a lesson's "read" mark. */
  unmarkRead(code: LessonCode): Promise<void>;
}

export function progressStore(
  kv: KvStore,
  now: () => string = () => new Date().toISOString(),
): ProgressStore {
  const get = async () => readable(await kv.get(PROGRESS_KEY).catch(() => undefined));
  const put = (p: ProgressV1) => kv.set(PROGRESS_KEY, p);
  return {
    get,
    recordSession: (raw) =>
      serial(async () => {
        const s = sanitizeSession(raw);
        const cur = await get();
        const sessions = capSessions([...cur.sessions.filter((x) => x.id !== s.id), s]);
        const lessons = { ...cur.lessons };
        const code = codeOf(s.lesson);
        const rule = EXIT[code];
        if (isDrillRule(rule)) {
          const rec = { ...lessons[code], source: lessons[code]?.source ?? ('drill' as const) };
          const passed = drillPassedAt(rule, sessions);
          const timed = drillPassedAt(rule, sessions, true);
          // The first date is kept: a pass is not undone by a worse session, nor moved by a later one.
          if (passed && (!rec.passedAt || passed < rec.passedAt)) rec.passedAt = passed;
          if (timed && (!rec.passedTimedAt || timed < rec.passedTimedAt)) rec.passedTimedAt = timed;
          if (rec.passedAt || rec.passedTimedAt) lessons[code] = rec;
        }
        await put({ v: 1, lessons, sessions });
      }),
    markRead: (code, at) =>
      serial(async () => {
        const cur = await get();
        const had = cur.lessons[code];
        await put({
          ...cur,
          lessons: {
            ...cur.lessons,
            [code]: { ...had, source: had?.source ?? 'manual', readAt: had?.readAt ?? at ?? now() },
          },
        });
      }),
    unmarkRead: (code) =>
      serial(async () => {
        const cur = await get();
        const had = cur.lessons[code];
        if (!had?.readAt) return;
        const { readAt: _drop, ...rest } = had;
        const lessons = Object.fromEntries(
          Object.entries(cur.lessons).flatMap(([k, v]) =>
            k !== code ? [[k, v]] : rest.passedAt || rest.passedTimedAt ? [[k, rest]] : [],
          ),
        );
        await put({ ...cur, lessons });
      }),
  };
}

/** The store on the page's own `progress` KvStore. */
export const appProgress = (): ProgressStore => progressStore(appKv());

/** What the drill shell calls when a session ends (WP4). The signature is `ProgressSink` and stays. */
export function progressSink(): ProgressSink {
  return { recordSession: (s) => appProgress().recordSession(s) };
}

/**
 * Import with the progress merged (`mergeProgress`), not replaced: what the file brings is added to
 * what is here and nothing is lost, and importing the same file twice changes nothing. Everything
 * else about the import is the store's `importAll`.
 */
export async function importWithProgress(
  store: ReviewStore,
  bundle: ExportBundle,
  how: 'replace' | 'keep-both',
) {
  const incoming = bundle.progress[PROGRESS_KEY];
  if (incoming === undefined) return store.importAll(bundle, how);
  const here = readable(await store.progress.get(PROGRESS_KEY).catch(() => undefined));
  const merged = mergeProgress(here, readable(incoming));
  return store.importAll(
    { ...bundle, progress: { ...bundle.progress, [PROGRESS_KEY]: merged } },
    how,
  );
}

/** "Export progress only": the usual bundle with no games and no reviews (a small file). */
export async function exportProgressOnly(store: ReviewStore): Promise<string> {
  const all = await store.exportAll(BUILD);
  const bundle: ExportBundle = {
    schema: EXPORT_SCHEMA,
    exportedAt: all.exportedAt,
    build: all.build,
    games: [],
    reviews: [],
    timing: {},
    progress: all.progress,
  };
  return JSON.stringify(bundle) + '\n';
}
