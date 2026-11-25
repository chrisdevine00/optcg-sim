/**
 * Moves the two M7 localStorage logs into the store (M8 WP5): the tutorial timing runs
 * (`optcg.tutorial.timing.v1`) and the lethal progress (`optcg.progress.lethal.v1`). Decks, coach
 * settings and tutorial progress stay in localStorage.
 *
 * The keys are deleted only after every write has completed, so a failure part-way leaves them for
 * the next start. It is idempotent: runs are keyed by run id, progress merges by game and turn
 * keeping the furthest step, so doing it twice (a second tab, a crash before the delete) changes
 * nothing. Unreadable entries are dropped; they would not have loaded before either.
 */
import { LETHAL_KEY, sanitizeLethalProgress, sanitizeTimingLog } from './validate.ts';
import type { ReviewStore } from './types.ts';

/** Same values as `TIMING_KEY` and `KEEP_RUNS` in tutorial/timing.ts (which imports this folder); a test pins them. */
export const TIMING_KEY = 'optcg.tutorial.timing.v1';
export const KEEP_RUNS = 20;
export const PROGRESS_KEY = 'optcg.progress.lethal.v1';
const ORDER = ['tier1', 'tier2', 'count', 'tier3'];

function parse(ls: Storage, key: string): unknown {
  try {
    const raw = ls.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export interface MigrationReport {
  timingRuns: number;
  progressEntries: number;
  /** localStorage keys removed. */
  removed: string[];
}

export async function migrateFromLocalStorage(
  store: ReviewStore,
  ls: Storage,
): Promise<MigrationReport> {
  const report: MigrationReport = { timingRuns: 0, progressEntries: 0, removed: [] };
  const has = (k: string) => {
    try {
      return ls.getItem(k) !== null;
    } catch {
      return false;
    }
  };
  if (!has(TIMING_KEY) && !has(PROGRESS_KEY)) return report;

  const timing = parse(ls, TIMING_KEY);
  if (Array.isArray(timing)) {
    const runs = [];
    for (const r of timing) {
      try {
        runs.push(sanitizeTimingLog(r));
      } catch {
        /* an unreadable run is dropped */
      }
    }
    for (const run of runs.slice(-KEEP_RUNS)) {
      await store.timing.set(run.runId, run);
      report.timingRuns++;
    }
  }

  const progress = parse(ls, PROGRESS_KEY);
  if (Array.isArray(progress)) {
    let entries: ReturnType<typeof sanitizeLethalProgress> = [];
    try {
      entries = sanitizeLethalProgress(progress);
    } catch {
      /* dropped */
    }
    if (entries.length > 0) {
      const have = (await store.progress.get(LETHAL_KEY)) as typeof entries | undefined;
      const merged = Array.isArray(have) ? [...have] : [];
      for (const e of entries) {
        const at = merged.findIndex((m) => m.game === e.game && m.turn === e.turn);
        if (at < 0) merged.push(e);
        else if (ORDER.indexOf(e.furthest) > ORDER.indexOf(merged[at]!.furthest)) merged[at] = e;
      }
      await store.progress.set(LETHAL_KEY, merged.slice(-200));
      report.progressEntries = entries.length;
    }
  }

  await store.meta.set('migrated-localstorage-v1', Date.now());
  for (const k of [TIMING_KEY, PROGRESS_KEY]) {
    try {
      if (has(k)) {
        ls.removeItem(k);
        report.removed.push(k);
      }
    } catch {
      /* the key stays; the copy is idempotent */
    }
  }
  return report;
}
