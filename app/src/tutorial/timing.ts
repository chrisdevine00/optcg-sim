/**
 * The tutorial's local timing log (docs/design/usability-plan.md §7.1). One `TutorialTimingLog` per
 * run: active, hidden and idle time per step, blocked attempts, inputs and exits. It is kept in
 * this browser only (IndexedDB `timing` since M8, behind `TimingStore`; the old localStorage key
 * `optcg.tutorial.timing.v1` is migrated once, and still used if IndexedDB is unavailable; the last
 * 20 runs), exported as JSON or CSV through a Blob, and never sent anywhere. Nothing
 * in it identifies a person: no names, no free text, no card choices.
 *
 * The clock is injected (`performance.now` in the app, a fake in tests). Time is accounted on every
 * event by `advance`, so a step's wall time splits exactly into active and hidden, and the time the
 * player spent outside the tutorial (between "Leave" and "Continue") is never counted at all.
 */
import { synced } from '../store/open.ts';
import type { SyncKv } from '../store/sync.ts';
import { sanitizeTimingLog } from '../store/validate.ts';
import type { TutorialTimingLog } from './types.ts';

export type StepRecord = TutorialTimingLog['steps'][number];

/** Idle spans longer than this are reported in `idleMs` (and not subtracted from `activeMs`). */
export const IDLE_AFTER_MS = 120_000;

export const TIMING_KEY = 'optcg.tutorial.timing.v1';
export const KEEP_RUNS = 20;

export interface Clock {
  /** Milliseconds, monotone within a page (performance.now). */
  now(): number;
}

export interface TimingEnv {
  appVersion: string;
  engineVersion: string;
  tutorialVersion: string;
  settings: TutorialTimingLog['settings'];
}

/** Where finished and in-progress runs are kept: IndexedDB (`IdbTimingStore`), or localStorage as a fallback. */
export interface TimingStore {
  load(): TutorialTimingLog[];
  save(runs: TutorialTimingLog[]): void;
}

export class LocalTimingStore implements TimingStore {
  load(): TutorialTimingLog[] {
    try {
      const raw = JSON.parse(window.localStorage.getItem(TIMING_KEY) ?? '[]') as unknown;
      return Array.isArray(raw)
        ? raw.filter(
            (r): r is TutorialTimingLog =>
              typeof r === 'object' &&
              r !== null &&
              (r as TutorialTimingLog).schema === 'tutorial-timing/1',
          )
        : [];
    } catch {
      return [];
    }
  }
  save(runs: TutorialTimingLog[]): void {
    try {
      window.localStorage.setItem(TIMING_KEY, JSON.stringify(runs.slice(-KEEP_RUNS)));
    } catch {
      /* storage is blocked or full: the log lasts for this session only */
    }
  }
}

/**
 * The IndexedDB `timing` store behind the same synchronous interface: one record per run id, read
 * into memory at boot (`initStore`) and written behind. The last `KEEP_RUNS` runs are kept.
 */
export class IdbTimingStore implements TimingStore {
  constructor(private readonly kv: SyncKv) {}
  load(): TutorialTimingLog[] {
    const runs: TutorialTimingLog[] = [];
    for (const v of this.kv.values()) {
      try {
        runs.push(sanitizeTimingLog(v));
      } catch {
        /* an unreadable run is skipped */
      }
    }
    return runs.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  }
  save(runs: TutorialTimingLog[]): void {
    const keep = runs.slice(-KEEP_RUNS);
    const ids = new Set(keep.map((r) => r.runId));
    for (const r of keep) this.kv.set(r.runId, r);
    for (const k of this.kv.keys()) if (!ids.has(k)) this.kv.delete(k);
  }
}

/** The app's timing store: IndexedDB when the store opened on it, else localStorage as before. */
export function timingStore(): TimingStore {
  return synced.timing ? new IdbTimingStore(synced.timing) : new LocalTimingStore();
}

export class MemoryTimingStore implements TimingStore {
  runs: TutorialTimingLog[] = [];
  load(): TutorialTimingLog[] {
    return structuredClone(this.runs);
  }
  save(runs: TutorialTimingLog[]): void {
    this.runs = structuredClone(runs.slice(-KEEP_RUNS));
  }
}

const emptyStep = (stepId: string, enteredMs: number): StepRecord => ({
  stepId,
  enteredMs,
  completedMs: null,
  activeMs: 0,
  hiddenMs: 0,
  idleMs: 0,
  blockedAttempts: 0,
  hintsOpened: 0,
  explainOpened: 0,
  rewinds: 0,
  inputs: { pointer: 0, keyboard: 0 },
  exits: 0,
});

function newRunId(): string {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Accumulates one run. Create it with `TimingTracker.start` (a new run) or `TimingTracker.resume`
 * (a run left earlier); call `enterStep` when a step begins, then the event methods; `snapshot`
 * is always a complete, valid log and `save` writes it through the store.
 */
export class TimingTracker {
  private log: TutorialTimingLog;
  private current: StepRecord | null = null;
  private lastTick: number;
  private visible = true;
  /** Active time since the last input, for the idle rule. */
  private sinceInput = 0;
  /** Run clock: time inside the tutorial, exited time left out. */
  private runMs: number;
  private open = true;

  private constructor(
    private readonly clock: Clock,
    private readonly store: TimingStore,
    log: TutorialTimingLog,
    runMs: number,
  ) {
    this.log = log;
    this.runMs = runMs;
    this.lastTick = clock.now();
  }

  static start(clock: Clock, store: TimingStore, env: TimingEnv): TimingTracker {
    const log: TutorialTimingLog = {
      schema: 'tutorial-timing/1',
      runId: newRunId(),
      appVersion: env.appVersion,
      engineVersion: env.engineVersion,
      tutorialVersion: env.tutorialVersion,
      startedAt: new Date().toISOString(),
      settings: { ...env.settings },
      steps: [],
      completedMs: null,
      totalActiveMs: 0,
      totalWallMs: 0,
    };
    const t = new TimingTracker(clock, store, log, 0);
    t.save();
    return t;
  }

  /** Continue a stored run: the time spent outside the tutorial is not counted. */
  static resume(clock: Clock, store: TimingStore, runId: string): TimingTracker | null {
    const log = store.load().find((r) => r.runId === runId);
    if (!log || log.completedMs !== null) return null;
    return new TimingTracker(clock, store, structuredClone(log), log.totalWallMs);
  }

  get runId(): string {
    return this.log.runId;
  }

  /** Move the clock to now and account the time since the last event. */
  private advance(): void {
    const now = this.clock.now();
    const dt = Math.max(0, now - this.lastTick);
    this.lastTick = now;
    if (!this.open) return;
    this.runMs += dt;
    if (!this.current) return;
    if (this.visible) {
      this.current.activeMs += dt;
      this.sinceInput += dt;
    } else this.current.hiddenMs += dt;
  }

  private closeIdle(): void {
    if (this.current && this.sinceInput > IDLE_AFTER_MS) this.current.idleMs += this.sinceInput;
    this.sinceInput = 0;
  }

  /** A step begins (or begins again after Back, a restart or a resume). */
  enterStep(stepId: string): void {
    this.advance();
    this.closeIdle();
    let rec = this.log.steps.find((s) => s.stepId === stepId);
    if (!rec) {
      rec = emptyStep(stepId, this.runMs);
      this.log.steps.push(rec);
    } else rec.completedMs = null;
    this.current = rec;
    this.save();
  }

  /** The current step's goal was reached. */
  completeStep(): void {
    this.advance();
    this.closeIdle();
    if (this.current) this.current.completedMs = this.runMs;
    this.save();
  }

  /** A refused action or a click on something the step does not teach ("Not yet…"). */
  blocked(): void {
    this.advance();
    if (this.current) this.current.blockedAttempts++;
    this.save();
  }

  /** One pointer press or key press while the tutorial is open. */
  input(kind: 'pointer' | 'keyboard'): void {
    this.advance();
    this.closeIdle();
    if (this.current) this.current.inputs[kind]++;
  }

  /** "Show me" or a rule link. */
  explained(): void {
    this.advance();
    if (this.current) this.current.explainOpened++;
  }

  /** A step started over or sent back (Back, or t8's "Not quite"). */
  rewound(): void {
    this.advance();
    if (this.current) this.current.rewinds++;
  }

  /** The tab hides or shows. */
  setVisible(visible: boolean): void {
    this.advance();
    this.visible = visible;
    if (!visible) this.closeIdle();
  }

  /** The player left the tutorial: time stops until `resumed`. */
  exited(): void {
    this.advance();
    this.closeIdle();
    this.open = false;
    this.save();
  }

  /** The player came back to this run: the current step restarts and counts one exit. */
  resumed(stepId: string): void {
    this.open = true;
    this.lastTick = this.clock.now();
    this.sinceInput = 0;
    this.enterStep(stepId);
    if (this.current) this.current.exits++;
    this.save();
  }

  /** The last step is done. */
  finish(): void {
    this.advance();
    this.closeIdle();
    this.log.completedMs = this.runMs;
    this.save();
    this.open = false;
  }

  snapshot(): TutorialTimingLog {
    this.advance();
    const steps = structuredClone(this.log.steps);
    // The open step's idle span counts too, so a snapshot is a complete picture.
    if (this.current && this.sinceInput > IDLE_AFTER_MS) {
      const rec = steps.find((s) => s.stepId === this.current!.stepId);
      if (rec) rec.idleMs += this.sinceInput;
    }
    return {
      ...structuredClone(this.log),
      steps,
      totalActiveMs: Math.round(steps.reduce((n, s) => n + s.activeMs, 0)),
      totalWallMs: Math.round(this.runMs),
    };
  }

  save(): void {
    this.advance();
    const snap = this.snapshot();
    this.log.totalActiveMs = snap.totalActiveMs;
    this.log.totalWallMs = snap.totalWallMs;
    const runs = this.store.load().filter((r) => r.runId !== snap.runId);
    this.store.save([...runs, snap]);
  }
}

// -----------------------------------------------------------------------------------------------
// Export: JSON and CSV, through a Blob. No network (usability-plan §7.1).
// -----------------------------------------------------------------------------------------------

export function toJson(log: TutorialTimingLog): string {
  return JSON.stringify(log, null, 2) + '\n';
}

const CSV_HEAD = [
  'runId',
  'stepId',
  'enteredMs',
  'completedMs',
  'activeMs',
  'hiddenMs',
  'idleMs',
  'blockedAttempts',
  'hintsOpened',
  'explainOpened',
  'rewinds',
  'inputsPointer',
  'inputsKeyboard',
  'exits',
] as const;

/** One row per step, a header first, `\r\n` line ends (RFC 4180). */
export function toCsv(log: TutorialTimingLog): string {
  const cell = (v: string | number | null): string => {
    if (v === null) return '';
    const s = String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = log.steps.map((s) =>
    [
      log.runId,
      s.stepId,
      Math.round(s.enteredMs),
      s.completedMs === null ? null : Math.round(s.completedMs),
      Math.round(s.activeMs),
      Math.round(s.hiddenMs),
      Math.round(s.idleMs),
      s.blockedAttempts,
      s.hintsOpened,
      s.explainOpened,
      s.rewinds,
      s.inputs.pointer,
      s.inputs.keyboard,
      s.exits,
    ].map(cell),
  );
  return [CSV_HEAD.join(','), ...rows.map((r) => r.join(','))].join('\r\n') + '\r\n';
}

/** Hand the file to the player: a Blob and a link click, nothing leaves the browser. */
export function download(name: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const exportName = (log: TutorialTimingLog, ext: 'json' | 'csv') =>
  `optcg-tutorial-timing-${log.runId}.${ext}`;

/** "17 min" for the completion screen, from `totalActiveMs`: a minute rounds up, never below 1. */
export function minutesWords(ms: number): string {
  const m = Math.max(1, Math.round(ms / 60_000));
  return `${m} min`;
}
