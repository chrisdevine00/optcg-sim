/**
 * M7 WP6: the tutorial's local timing log (usability-plan §7.1) on a fake clock: active, hidden and
 * idle time per step, exits, blocked attempts, inputs, the 20-run limit, and the JSON and CSV
 * exports. Nothing here touches a network.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IDLE_AFTER_MS,
  KEEP_RUNS,
  LocalTimingStore,
  MemoryTimingStore,
  minutesWords,
  TIMING_KEY,
  TimingTracker,
  toCsv,
  toJson,
  type TimingEnv,
} from '../src/tutorial/timing.ts';

const env: TimingEnv = {
  appVersion: '0.0.0',
  engineVersion: '0.5.18',
  tutorialVersion: 'test',
  settings: {
    reducedMotion: false,
    aiPace: '2x',
    singleKeyShortcuts: true,
    cardAnnouncements: 'standard',
  },
};

function setup() {
  let t = 1000;
  const clock = {
    now: () => t,
    advance(ms: number) {
      t += ms;
    },
  };
  const store = new MemoryTimingStore();
  const tracker = TimingTracker.start(clock, store, env);
  return { clock, store, tracker };
}

const S = 1000;

describe('the tracker', () => {
  it('splits a step into active and hidden time, exactly', () => {
    const { clock, tracker } = setup();
    tracker.enterStep('t1-zones');
    clock.advance(10 * S);
    tracker.setVisible(false);
    clock.advance(5 * S);
    tracker.setVisible(true);
    clock.advance(3 * S);
    tracker.completeStep();
    const [s] = tracker.snapshot().steps;
    expect(s).toMatchObject({
      stepId: 't1-zones',
      enteredMs: 0,
      completedMs: 18 * S,
      activeMs: 13 * S,
      hiddenMs: 5 * S,
      idleMs: 0,
    });
  });

  it('reports an idle span over 120 s and does not subtract it from active time', () => {
    const { clock, tracker } = setup();
    tracker.enterStep('t2-first-turn');
    tracker.input('pointer');
    clock.advance(IDLE_AFTER_MS + 30 * S);
    tracker.input('keyboard');
    clock.advance(60 * S);
    tracker.completeStep();
    const [s] = tracker.snapshot().steps;
    expect(s!.idleMs).toBe(IDLE_AFTER_MS + 30 * S);
    expect(s!.activeMs).toBe(IDLE_AFTER_MS + 90 * S);
    expect(s!.inputs).toEqual({ pointer: 1, keyboard: 1 });
  });

  it('a span of exactly 120 s or less is not idle, and hidden time never counts as idle', () => {
    const { clock, tracker } = setup();
    tracker.enterStep('t3-don-and-power');
    clock.advance(IDLE_AFTER_MS);
    tracker.input('pointer');
    tracker.setVisible(false);
    clock.advance(500 * S);
    tracker.setVisible(true);
    clock.advance(10 * S);
    tracker.completeStep();
    const [s] = tracker.snapshot().steps;
    expect(s!.idleMs).toBe(0);
    expect(s!.hiddenMs).toBe(500 * S);
    expect(s!.activeMs).toBe(IDLE_AFTER_MS + 10 * S);
  });

  it('an open idle span shows in a snapshot, once', () => {
    const { clock, tracker } = setup();
    tracker.enterStep('t4-attack');
    clock.advance(200 * S);
    expect(tracker.snapshot().steps[0]!.idleMs).toBe(200 * S);
    expect(tracker.snapshot().steps[0]!.idleMs).toBe(200 * S);
    tracker.input('pointer');
    expect(tracker.snapshot().steps[0]!.idleMs).toBe(200 * S);
  });

  it('time outside the tutorial is never counted, and a resume counts one exit on the step', () => {
    const { clock, store, tracker } = setup();
    tracker.enterStep('t4-attack');
    clock.advance(20 * S);
    tracker.exited();
    clock.advance(3600 * S);
    // The page reloads: a new tracker continues the stored run.
    const again = TimingTracker.resume(clock, store, tracker.runId)!;
    expect(again).not.toBeNull();
    again.resumed('t4-attack');
    clock.advance(7 * S);
    again.completeStep();
    const snap = again.snapshot();
    const s = snap.steps[0]!;
    expect(s.exits).toBe(1);
    expect(s.activeMs).toBe(27 * S);
    expect(s.enteredMs).toBe(0);
    expect(s.completedMs).toBe(27 * S);
    expect(snap.totalWallMs).toBe(27 * S);
    expect(snap.totalActiveMs).toBe(27 * S);
  });

  it('counts blocked attempts, explanations and rewinds on the step they happen in', () => {
    const { clock, tracker } = setup();
    tracker.enterStep('t5-defend');
    tracker.blocked();
    tracker.blocked();
    tracker.explained();
    tracker.rewound();
    clock.advance(S);
    tracker.completeStep();
    tracker.enterStep('t6-trigger');
    tracker.blocked();
    const steps = tracker.snapshot().steps;
    expect(steps[0]).toMatchObject({ blockedAttempts: 2, explainOpened: 1, rewinds: 1 });
    expect(steps[1]).toMatchObject({ blockedAttempts: 1, explainOpened: 0, rewinds: 0 });
  });

  it('re-entering a finished step (Back) keeps its record and accumulates', () => {
    const { clock, tracker } = setup();
    tracker.enterStep('t1-zones');
    clock.advance(4 * S);
    tracker.completeStep();
    tracker.enterStep('t2-first-turn');
    clock.advance(2 * S);
    tracker.enterStep('t1-zones');
    expect(tracker.snapshot().steps).toHaveLength(2);
    expect(tracker.snapshot().steps[0]!.completedMs).toBeNull();
    clock.advance(3 * S);
    tracker.completeStep();
    const [a, b] = tracker.snapshot().steps;
    expect(a!.activeMs).toBe(7 * S);
    expect(b!.activeMs).toBe(2 * S);
    expect(tracker.snapshot().totalActiveMs).toBe(9 * S);
  });

  it('totals the run: active time is the sum of the steps, finish stamps the run', () => {
    const { clock, tracker } = setup();
    for (const [id, ms] of [
      ['t1-zones', 30],
      ['t2-first-turn', 60],
    ] as const) {
      tracker.enterStep(id);
      clock.advance(ms * S);
      tracker.completeStep();
    }
    expect(tracker.snapshot().completedMs).toBeNull();
    tracker.finish();
    const snap = tracker.snapshot();
    expect(snap.totalActiveMs).toBe(90 * S);
    expect(snap.totalWallMs).toBe(90 * S);
    expect(snap.completedMs).toBe(90 * S);
    expect(snap.schema).toBe('tutorial-timing/1');
    // A finished run is not resumable.
    expect(TimingTracker.resume({ now: () => 0 }, setup().store, snap.runId)).toBeNull();
  });

  it('saves every run it starts, and keeps only the last 20', () => {
    const store = new MemoryTimingStore();
    const clock = { now: () => 0 };
    const ids: string[] = [];
    for (let i = 0; i < KEEP_RUNS + 5; i++) {
      const t = TimingTracker.start(clock, store, env);
      t.enterStep('t1-zones');
      ids.push(t.runId);
    }
    const runs = store.load();
    expect(runs).toHaveLength(KEEP_RUNS);
    expect(runs.map((r) => r.runId)).toEqual(ids.slice(-KEEP_RUNS));
  });

  it('records the settings and versions and nothing that identifies a person', () => {
    const { tracker } = setup();
    const log = tracker.snapshot();
    expect(log.settings).toEqual(env.settings);
    expect(log.engineVersion).toBe('0.5.18');
    expect(log.runId).toMatch(/^[0-9a-f]{16}$/);
    expect(Object.keys(log).sort()).toEqual(
      [
        'appVersion',
        'completedMs',
        'engineVersion',
        'runId',
        'schema',
        'settings',
        'startedAt',
        'steps',
        'totalActiveMs',
        'totalWallMs',
        'tutorialVersion',
      ].sort(),
    );
  });
});

describe('export', () => {
  const log = () => {
    const { clock, tracker } = setup();
    tracker.enterStep('t1-zones');
    tracker.input('pointer');
    clock.advance(30 * S);
    tracker.completeStep();
    tracker.enterStep('t2-first-turn');
    tracker.blocked();
    tracker.input('keyboard');
    clock.advance(10 * S);
    return tracker.snapshot();
  };

  it('JSON is the log itself, with the schema field', () => {
    const l = log();
    const back = JSON.parse(toJson(l)) as typeof l;
    expect(back.schema).toBe('tutorial-timing/1');
    expect(back).toEqual(l);
  });

  it('CSV has a header and one row per step, in the log order, with CRLF line ends', () => {
    const l = log();
    const csv = toCsv(l);
    const lines = csv.split('\r\n');
    expect(lines.at(-1)).toBe('');
    expect(lines).toHaveLength(2 + 2);
    expect(lines[0]).toBe(
      'runId,stepId,enteredMs,completedMs,activeMs,hiddenMs,idleMs,blockedAttempts,hintsOpened,explainOpened,rewinds,inputsPointer,inputsKeyboard,exits',
    );
    expect(lines[1]).toBe(`${l.runId},t1-zones,0,30000,30000,0,0,0,0,0,0,1,0,0`);
    // An unfinished step has an empty completedMs cell.
    expect(lines[2]).toBe(`${l.runId},t2-first-turn,30000,,10000,0,0,1,0,0,0,0,1,0`);
  });

  it('formats minutes for the completion screen, never below 1', () => {
    expect(minutesWords(17 * 60_000 + 20_000)).toBe('17 min');
    expect(minutesWords(10_000)).toBe('1 min');
    expect(minutesWords(0)).toBe('1 min');
  });
});

describe('the localStorage store', () => {
  let data: Record<string, string>;
  beforeEach(() => {
    data = {};
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => data[k] ?? null,
        setItem: (k: string, v: string) => {
          data[k] = v;
        },
      },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('round-trips under optcg.tutorial.timing.v1 and ignores junk', () => {
    const s = new LocalTimingStore();
    const t = TimingTracker.start({ now: () => 0 }, s, env);
    t.enterStep('t1-zones');
    expect(TIMING_KEY).toBe('optcg.tutorial.timing.v1');
    expect(JSON.parse(data[TIMING_KEY]!)).toHaveLength(1);
    expect(s.load()[0]!.runId).toBe(t.runId);
    data[TIMING_KEY] = '{"not":"a list"}';
    expect(s.load()).toEqual([]);
    data[TIMING_KEY] = 'not json';
    expect(s.load()).toEqual([]);
  });

  it('survives blocked storage', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
      },
    });
    const s = new LocalTimingStore();
    expect(() => TimingTracker.start({ now: () => 0 }, s, env)).not.toThrow();
    expect(s.load()).toEqual([]);
  });
});
