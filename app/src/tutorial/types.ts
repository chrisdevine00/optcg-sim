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

/** The nine zones of the board the first step names (CR 3-1). */
export const TUTORIAL_ZONES = [
  'leader',
  'characters',
  'stage',
  'life',
  'deck',
  'trash',
  'donDeck',
  'costArea',
  'hand',
] as const;
export type TutorialZone = (typeof TUTORIAL_ZONES)[number];

/** The scenario a step starts from: a `ScenarioSpec` in the loader, or by name. */
export type ScenarioRef = { name: string } | { spec: Omit<ScenarioSpec, 'cards'> };

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  scenario: ScenarioRef;
  /** Narrows the engine's legal actions; `GameConfig.tutorial.allow` calls it. */
  allowed(action: Action, view: ProjectedView): boolean;
  /** True once the view shows the step's goal reached. */
  done(view: ProjectedView): boolean;
  /**
   * WP6, additive. True once the step can no longer be won from here (t8: the turn ended without a
   * win); the runner says "Not quite" and restarts the step.
   */
  failed?(view: ProjectedView): boolean;
  /**
   * WP6, additive. A step with no engine action (t1) is done when the player has visited every one
   * of these zones (focused or clicked), so `allowed` is false for every action.
   */
  visit?: readonly TutorialZone[];
  /** WP6, additive. Cards and zones the board lights for this step (card ids, turned into handles via the view). */
  lit?: ReadonlyArray<
    { card: string; side: 'me' | 'opp' } | { zone: TutorialZone; side?: 'me' | 'opp' }
  >;
  /** WP6, additive. The opponent's script (see `scripted.ts`); absent: it never has a turn. */
  script?: 'attack-leader' | 'none';
  /** WP6, additive. Windows are never skipped in this step ("Always ask me", flows G5). */
  alwaysAsk?: boolean;
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
