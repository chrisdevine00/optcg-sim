/**
 * The tutorial's state machine: which step, its controller on the real engine, the "Not yet…"
 * line, the zone visits of step 1, the timing log and the saved progress. It has no React in it,
 * so the unit tests drive it directly; `TutorialRoute` renders it.
 *
 * It decides nothing about the game. A step's `allowed` narrows what the engine already allows
 * (through `GameConfig.tutorial`), and `done` reads the player's own view.
 */
import type { Card } from '@optcg/cards';
import { ENGINE_VERSION, type Action, type ProjectedView } from '@optcg/engine';
import { GameController, type GameConfig } from '../play/game/controller.ts';
import type { CoachPort } from '../play/game/ai-client.ts';
import { COPY, say, TUTORIAL_VERSION } from './copy.ts';
import { ScriptedOpponent } from './scripted.ts';
import { STEPS } from './steps.ts';
import {
  clearProgress,
  recordCompletion,
  saveProgress,
  STEP_COUNT,
  type TutorialProgress,
} from './progress.ts';
import { TimingTracker, type Clock, type TimingEnv, type TimingStore } from './timing.ts';
import { TUTORIAL_ZONES, type TutorialStep, type TutorialZone } from './types.ts';

/** The coach is hidden in the tutorial; its port never answers and never starts a worker. */
export const inertCoachPort = (): CoachPort => {
  const never = () => ({ id: 0, result: new Promise<never>(() => undefined) });
  return {
    lethal: never,
    hint: never,
    score: never,
    threat: never,
    reveal() {},
    cancel() {},
    terminate() {},
  };
};

export type Phase = 'playing' | 'done' | 'complete';

export interface RunnerOptions {
  cards: Map<string, Card>;
  clock: Clock;
  store: TimingStore;
  env: TimingEnv;
  /** A run to continue (progress saved by "Leave tutorial"), else a new run starts at step 1. */
  resume?: TutorialProgress | null;
  /** Tests: shorter AI pacing. */
  speed?: GameConfig['speed'];
  /** Tests: stand-in for the in-process controller factory. */
  makeController?: (
    step: TutorialStep,
    filter: NonNullable<GameConfig['tutorial']>,
  ) => GameController;
}

export class TutorialRunner {
  readonly tracker: TimingTracker;
  ctl!: GameController;
  index = 0;
  phase: Phase = 'playing';
  /** The "Not yet…" or "Not quite" line, shown in the step card until the next action. */
  notice: string | null = null;
  /** The action count when the notice was set, so only a later action clears it. */
  private noticeAt: number | null = null;
  /** A bump of this remounts the board (a new controller for the same or another step). */
  attempt = 0;
  readonly visited = new Set<TutorialZone>();
  /** The last zone visited in step 1, whose one-line meaning is shown. */
  lastZone: TutorialZone | null = null;
  /** Bumps when the player asks for the step text again (focus and speech). */
  readSignal = 0;
  /** Bumps when focus should move to the step text. */
  focusSignal = 0;

  private listeners = new Set<() => void>();
  private version = 0;
  private offController: (() => void) | null = null;
  private disposed = false;

  constructor(private readonly o: RunnerOptions) {
    const resumed = o.resume ? TimingTracker.resume(o.clock, o.store, o.resume.runId) : null;
    this.tracker = resumed ?? TimingTracker.start(o.clock, o.store, o.env);
    // The step comes from the saved progress even when its timing log is gone (storage cleared or
    // the run pushed out of the last 20): the player continues, and a new log starts.
    const first = o.resume?.step ?? 0;
    this.begin(first, null);
    if (resumed) this.tracker.resumed(this.step.id);
    else this.tracker.enterStep(this.step.id);
  }

  // -------------------------------------------------------------------------------------------
  // Subscription
  // -------------------------------------------------------------------------------------------

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getVersion = () => this.version;
  private bump(): void {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  // -------------------------------------------------------------------------------------------
  // The step on screen
  // -------------------------------------------------------------------------------------------

  get step(): TutorialStep {
    return STEPS[this.index]!;
  }

  get isLast(): boolean {
    return this.index === STEP_COUNT - 1;
  }

  /** The guard the controller calls: nothing is allowed once the step is done. */
  private filter(): NonNullable<GameConfig['tutorial']> {
    const step = this.step;
    return {
      allow: (a: Action, v: ProjectedView) => this.phase === 'playing' && step.allowed(a, v),
      onBlocked: () => this.blockedAttempt(),
      onStray: () => this.blockedAttempt(),
    };
  }

  private build(step: TutorialStep): GameController {
    const filter = this.filter();
    if (this.o.makeController) return this.o.makeController(step, filter);
    const spec = 'spec' in step.scenario ? step.scenario.spec : null;
    if (!spec) throw new Error(`Step ${step.id} names a scenario the tutorial cannot load.`);
    return new GameController(
      this.o.cards,
      { scenario: spec },
      {
        mode: 'ai',
        human: 'p1',
        names: { p1: 'You', p2: 'Ace & Newgate' },
        tier: 'rookie',
        // t5 and t6 never skip a window: every one waits for the player (flows G5).
        autoSkip: !step.alwaysAsk,
        alwaysSkip: false,
        speed: this.o.speed ?? 2,
        aiCardIds: [],
        aiDeck: [],
        aiPort: () => new ScriptedOpponent(step.script ?? 'none'),
        coachPort: inertCoachPort,
        tutorial: filter,
      },
    );
  }

  /** Start step `index` on a fresh controller; `notice` is the line to show on arrival. */
  private begin(index: number, notice: string | null): void {
    this.offController?.();
    this.ctl?.dispose();
    this.index = index;
    this.phase = 'playing';
    this.notice = notice;
    this.noticeAt = null;
    this.visited.clear();
    this.lastZone = null;
    this.attempt++;
    this.focusSignal++;
    this.ctl = this.build(this.step);
    this.offController = this.ctl.subscribe(() => this.check());
    this.ctl.start();
    saveProgress({ runId: this.tracker.runId, step: index });
    this.ctl.announce(this.spoken());
    this.bump();
  }

  // -------------------------------------------------------------------------------------------
  // Words
  // -------------------------------------------------------------------------------------------

  /** Numbers read from the player's own view, for the `{name}` slots in the copy. */
  vars(): Record<string, string | number> {
    const v = this.ctl.view();
    const me = v.player;
    const opp = me === 'p1' ? 'p2' : 'p1';
    const mine = v.zones[me];
    const theirs = v.zones[opp];
    const leader = mine.leader[0];
    const printed = leader?.card ? this.o.cards.get(leader.card)?.power : null;
    const withDon = mine.characters.find((c) => c.don >= 1);
    return {
      visited: this.visited.size,
      donActive: v.don[me].active,
      hand: mine.hand.length,
      life: mine.life.length,
      oppLife: theirs.life.length,
      leaderPower: leader?.power ?? 0,
      leaderBase: printed ?? leader?.power ?? 0,
      theirPower: theirs.leader[0]?.power ?? 0,
      donOnCharacter: withDon?.don ?? 0,
      characterPower: withDon?.power ?? 0,
    };
  }

  text(key: 'intro' | 'prompt' | 'blocked' | 'done' | 'failed'): string {
    const k = this.step.copy[key];
    return k ? say(k, this.vars()) : '';
  }

  /** The keyboard words for this step (they sit beside `prompt` in the copy table). */
  keys(): string {
    return say(`${this.step.id}.keys`, this.vars());
  }

  rule(): string {
    return COPY[`${this.step.id}.rule`] ?? '';
  }

  /** What a screen reader hears when the step starts: the title, the lesson, then the input. */
  spoken(): string {
    const s = this.step;
    const parts = [`Step ${this.index + 1} of ${STEP_COUNT}: ${s.title}.`, this.text('intro')];
    parts.push(this.text('prompt'));
    return parts.join(' ');
  }

  zoneLine(): string {
    return this.lastZone ? say(`${this.step.id}.zone.${this.lastZone}`) : '';
  }

  // -------------------------------------------------------------------------------------------
  // Progress through the step
  // -------------------------------------------------------------------------------------------

  /** Called on every change of the game. */
  private check(): void {
    if (this.disposed || this.phase !== 'playing') return;
    const step = this.step;
    const v = this.ctl.view();
    if (step.done(v)) {
      this.finishStep();
    } else if (step.failed?.(v)) {
      this.restart(step.copy.failed ? say(step.copy.failed, this.vars()) : null);
    }
  }

  private finishStep(): void {
    this.phase = 'done';
    this.notice = null;
    this.tracker.completeStep();
    // The next step is what "Continue" restarts once this one is done.
    if (!this.isLast) saveProgress({ runId: this.tracker.runId, step: this.index + 1 });
    this.ctl.announce(`${this.text('done')} Press Next to go on.`);
    this.bump();
  }

  /** Step 1: a zone was focused or clicked. */
  visitZone(zone: TutorialZone): void {
    const step = this.step;
    if (!step.visit || this.phase !== 'playing' || !TUTORIAL_ZONES.includes(zone)) return;
    if (!step.visit.includes(zone)) return;
    const first = !this.visited.has(zone);
    this.visited.add(zone);
    this.lastZone = zone;
    if (first) this.ctl.announce(this.zoneLine());
    if (this.visited.size >= step.visit.length) this.finishStep();
    else this.bump();
  }

  /** A refused action or a click on something the step does not teach. */
  private blockedAttempt(): void {
    if (this.step.visit || this.phase !== 'playing') return;
    this.tracker.blocked();
    this.notice = this.text('blocked');
    this.noticeAt = this.ctl.session.actionCount;
    this.ctl.announce(this.notice);
    this.bump();
  }

  /**
   * The "Not yet…" line goes away with the player's next accepted action: the first time the card
   * sees the notice it notes the action count, and a higher count clears it.
   */
  settle(actionCount: number): void {
    if (this.notice === null) return;
    if (this.noticeAt === null) {
      this.noticeAt = actionCount;
      return;
    }
    if (actionCount > this.noticeAt) {
      this.notice = null;
      this.noticeAt = null;
      this.bump();
    }
  }

  /** The step starts over (t8 "Not quite"). */
  private restart(notice: string | null): void {
    this.tracker.rewound();
    this.begin(this.index, notice);
    if (notice) this.ctl.announce(notice);
  }

  // -------------------------------------------------------------------------------------------
  // The card's buttons
  // -------------------------------------------------------------------------------------------

  /** Next: the step is done. */
  next(): void {
    if (this.phase !== 'done') return;
    if (this.isLast) {
      this.tracker.finish();
      recordCompletion(this.tracker.runId);
      this.offController?.();
      this.phase = 'complete';
      this.bump();
      return;
    }
    this.begin(this.index + 1, null);
    this.tracker.enterStep(this.step.id);
  }

  /** Back: the start of the previous step. */
  back(): void {
    if (this.index === 0 || this.phase === 'complete') return;
    this.tracker.rewound();
    this.begin(this.index - 1, null);
    this.tracker.enterStep(this.step.id);
  }

  /** Read again: speak the step text once more and put focus on it. */
  readAgain(): void {
    this.readSignal++;
    this.ctl.announce(this.spoken());
    this.bump();
  }

  /** A rule link or "Show me" was opened. */
  explained(): void {
    this.tracker.explained();
  }

  /** Leave: time stops, the step is saved, and "Continue" will restart it. */
  leave(): void {
    if (this.phase !== 'complete') {
      this.tracker.exited();
      saveProgress({
        runId: this.tracker.runId,
        // A step already done continues at the next one.
        step: Math.min(
          STEP_COUNT - 1,
          this.index + (this.phase === 'done' && !this.isLast ? 1 : 0),
        ),
      });
    }
    this.dispose();
  }

  /** After completion the saved run is gone. */
  forget(): void {
    clearProgress();
  }

  input(kind: 'pointer' | 'keyboard'): void {
    if (this.phase !== 'complete') this.tracker.input(kind);
  }

  setVisible(visible: boolean): void {
    this.tracker.setVisible(visible);
  }

  dispose(): void {
    this.disposed = true;
    this.offController?.();
    this.ctl?.dispose();
  }
}

export const defaultEnv = (settings: TimingEnv['settings']): TimingEnv => ({
  appVersion: '0.0.0',
  engineVersion: ENGINE_VERSION,
  tutorialVersion: TUTORIAL_VERSION,
  settings,
});
