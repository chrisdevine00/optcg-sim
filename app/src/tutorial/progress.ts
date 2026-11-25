/**
 * Where the player is in the tutorial, kept in this browser (flows F2 step 4): "Leave tutorial"
 * saves `{ runId, step }`, Home shows "Continue the tutorial (step N of 8)", and resuming restarts
 * that step's scenario. Completion records lesson credit for L01 to L07 (docs/content/curriculum.md)
 * for the progress page (M9) to read. Every read and write is guarded: blocked storage must not
 * break the tutorial.
 */
import { TUTORIAL_STEP_IDS } from './types.ts';

const KEY = 'optcg.tutorial.progress.v1';
const CREDIT = 'optcg.tutorial.credit.v1';
const WELCOME = 'optcg.welcome.v1';

export const STEP_COUNT = TUTORIAL_STEP_IDS.length;

/** The lessons the tutorial teaches, in step order (curriculum.md Stage 1). */
export const TUTORIAL_LESSONS = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07'] as const;

export interface TutorialProgress {
  runId: string;
  /** Zero-based index of the step to restart. */
  step: number;
}

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage is blocked or full: progress lasts for this session only */
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* nothing to clear */
  }
}

export function loadProgress(): TutorialProgress | null {
  const p = read<Partial<TutorialProgress>>(KEY);
  if (
    !p ||
    typeof p.runId !== 'string' ||
    typeof p.step !== 'number' ||
    !Number.isInteger(p.step) ||
    p.step < 0 ||
    p.step >= STEP_COUNT
  )
    return null;
  return { runId: p.runId, step: p.step };
}

export function saveProgress(p: TutorialProgress): void {
  write(KEY, p);
}

export function clearProgress(): void {
  remove(KEY);
}

export interface LessonCredit {
  lessons: string[];
  at: string;
  runId: string;
}

/** The tutorial is finished: lesson credit for L01 to L07, and the run to continue is gone. */
export function recordCompletion(runId: string): void {
  write(CREDIT, {
    lessons: [...TUTORIAL_LESSONS],
    at: new Date().toISOString(),
    runId,
  } satisfies LessonCredit);
  write(WELCOME, 'tutorial-done');
  clearProgress();
}

export function lessonCredit(): LessonCredit | null {
  return read<LessonCredit>(CREDIT);
}

/** Home's welcome question (flows F1): how the visitor answered it, or null when never asked. */
export type Welcome = 'know-rules' | 'new' | 'look-around' | 'tutorial-done';

export function loadWelcome(): Welcome | null {
  const w = read<Welcome>(WELCOME);
  return w === 'know-rules' || w === 'new' || w === 'look-around' || w === 'tutorial-done'
    ? w
    : null;
}

export function saveWelcome(w: Welcome): void {
  write(WELCOME, w);
}

export function clearWelcome(): void {
  remove(WELCOME);
}
