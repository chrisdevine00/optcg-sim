/**
 * The tutorial's contracts (M7 WP0; WP6 builds the steps, the runner and the log on them). A step
 * is data: one fixed-seed scenario on the real engine, a predicate that narrows the engine's own
 * legal actions (it can remove, never add: no rules logic lives here), a predicate that says the
 * step is done, and keys into the copy table. Nothing in this file decides legality.
 */
import type { Action, ProjectedView, ScenarioSpec } from '@optcg/engine';

/** Stable step ids (learning-ui.md; usability-plan §7.1 logs against them). */
export const TUTORIAL_STEP_IDS = [
  't1-zones',
  't2-first-turn',
  't3-don-and-power',
  't4-attack',
  't5-defend',
  't6-trigger',
  't7-leader',
  't8-winning',
] as const;
export type TutorialStepId = (typeof TUTORIAL_STEP_IDS)[number];

/** The scenario a step starts from: a `ScenarioSpec` in the loader, or by name. */
export type ScenarioRef = { name: string } | { spec: ScenarioSpec };

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  scenario: ScenarioRef;
  /** Narrows the engine's legal actions; `GameConfig.tutorial.allow` calls it. */
  allowed(action: Action, view: ProjectedView): boolean;
  /** True once the view shows the step's goal reached. */
  done(view: ProjectedView): boolean;
  /** Keys into the tutorial copy table (WP6): the prompt, the hint, the "why not" lines. */
  copy: {
    intro: string;
    prompt: string;
    blocked?: string;
    done: string;
    [key: string]: string | undefined;
  };
}

/**
 * One record per tutorial run, exactly as docs/design/usability-plan.md §7.1. Local only; never
 * sent anywhere. Nothing in it identifies a person.
 */
export type TutorialTimingLog = {
  schema: 'tutorial-timing/1';
  runId: string; // random, local; not linked to anything
  appVersion: string;
  engineVersion: string;
  tutorialVersion: string;
  startedAt: string; // one ISO timestamp, local clock
  settings: {
    reducedMotion: boolean;
    aiPace: string;
    singleKeyShortcuts: boolean;
    cardAnnouncements: string;
  };
  steps: Array<{
    stepId: string; // stable IDs from learning-ui.md, e.g. 't3-don-and-power'
    enteredMs: number; // performance.now() offset from run start
    completedMs: number | null;
    activeMs: number; // wall time in the step minus hidden-tab time and exited time
    hiddenMs: number; // document.visibilityState === 'hidden'
    idleMs: number; // spans of more than 120 s with no input (reported, not subtracted)
    blockedAttempts: number; // whyNot reasons shown
    hintsOpened: number;
    explainOpened: number; // "Show me" or a glossary link
    rewinds: number;
    inputs: { pointer: number; keyboard: number };
    exits: number; // exit and resume during this step
  }>;
  completedMs: number | null;
  totalActiveMs: number;
  totalWallMs: number;
};
