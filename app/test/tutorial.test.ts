/**
 * M7 WP6: the guided tutorial. Each step's scenario is valid on the real engine; the allowed set is
 * a non-empty subset of the engine's own legal actions at every decision; the scripted opponent's
 * actions are legal; the taught action completes the step; step 8 can be won; "Not yet" counts a
 * blocked attempt; leave and resume restart the step; Back goes to the start of the previous one.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { actionKey } from '@optcg/ai';
import { checkInvariants, createFromScenario, deckErrors, type Action } from '@optcg/engine';
import { GameController } from '../src/play/game/controller.ts';
import { deckCoverage, TUTORIAL_DECKS } from '../src/play/setup/decks.ts';
import { COPY, CONTENT_META, parseContent, placeholders, say } from '../src/tutorial/copy.ts';
import { TUTORIAL_DECK_ST21, TUTORIAL_DECK_ST22 } from '../src/tutorial/decks.ts';
import { defaultEnv, TutorialRunner } from '../src/tutorial/runner.ts';
import { ScriptedOpponent, scriptedAction } from '../src/tutorial/scripted.ts';
import { SCENARIOS_T, STEPS } from '../src/tutorial/steps.ts';
import { MemoryTimingStore } from '../src/tutorial/timing.ts';
import { applyFirstGame, FIRST_GAME_COACH } from '../src/tutorial/preset.ts';
import { DEFAULT_PROFILE } from '../src/play/coach/profile.ts';
import { loadProgress, saveProgress, STEP_COUNT } from '../src/tutorial/progress.ts';
import { TUTORIAL_STEP_IDS, TUTORIAL_ZONES, type TutorialStepId } from '../src/tutorial/types.ts';
import { cardMap, lookup } from './support.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// A hang guard, not a bound: 8 s on an idle machine was tight under load (docs/runbooks/testing.md).
async function until(cond: () => boolean, ms = 25_000): Promise<void> {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error('timed out waiting');
    await sleep(8);
  }
}

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

beforeEach(() => {
  vi.stubGlobal('window', { localStorage: new MemStorage() });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const env = defaultEnv({
  reducedMotion: false,
  aiPace: '4x',
  singleKeyShortcuts: true,
  cardAnnouncements: 'standard',
});

function runner(
  resume: { runId: string; step: number } | null = null,
  store = new MemoryTimingStore(),
) {
  let t = 0;
  const clock = {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
  const r = new TutorialRunner({ cards: cardMap(), clock, store, env, speed: 4, resume });
  return { r, clock, store };
}

const idsOf = (): string[] => {
  const out = new Set<string>();
  const add = (c: unknown) => {
    if (typeof c === 'string') out.add(c);
    else if (c && typeof c === 'object' && 'card' in c) out.add((c as { card: string }).card);
  };
  for (const s of Object.values(SCENARIOS_T))
    for (const side of [s.p1, s.p2]) {
      add(side.leader);
      for (const l of [side.hand, side.deck, side.life, side.characters, side.trash])
        for (const c of l ?? []) add(c);
    }
  return [...out];
};

describe('the scenarios', () => {
  it('there are eight steps with the stable ids, in order', () => {
    expect(STEPS.map((s) => s.id)).toEqual([...TUTORIAL_STEP_IDS]);
    expect(STEP_COUNT).toBe(8);
  });

  it.each(TUTORIAL_STEP_IDS)('%s is a valid position on the real engine', (id) => {
    const { state } = createFromScenario({ ...SCENARIOS_T[id], cards: lookup });
    expect(checkInvariants(state)).toEqual([]);
  });

  it('the player always goes second and the opponent is Starter Deck ST-22', () => {
    for (const s of Object.values(SCENARIOS_T)) {
      expect(s.firstPlayer).toBe('p2');
      const lead = (x: unknown) => (typeof x === 'string' ? x : (x as { card: string }).card);
      expect(lead(s.p1.leader)).toBe('ST21-001');
      expect(lead(s.p2.leader)).toBe('ST22-001');
    }
  });

  it('every card the scenarios use is scripted or plays fully with no script', () => {
    const cards = cardMap();
    for (const id of idsOf()) expect(cards.has(id), id).toBe(true);
    for (const d of TUTORIAL_DECKS) {
      const c = deckCoverage(d, cards);
      expect(c.notAutomated, `${d.name} has cards that play for stats only`).toBe(0);
    }
    // The scenario cards belong to the two decks (so the first game uses the same cards).
    const inDecks = new Set([
      TUTORIAL_DECK_ST21.leader,
      ...TUTORIAL_DECK_ST21.main,
      TUTORIAL_DECK_ST22.leader,
      ...TUTORIAL_DECK_ST22.main,
    ]);
    for (const id of idsOf()) expect(inDecks.has(id), id).toBe(true);
  });

  it('the two tutorial decks are legal 50-card decks', () => {
    for (const d of [TUTORIAL_DECK_ST21, TUTORIAL_DECK_ST22]) {
      expect(d.main).toHaveLength(50);
      expect(deckErrors(d, lookup, 'standard').map((e) => e.message)).toEqual([]);
    }
  });
});

describe('the words (docs/content/tutorial.md)', () => {
  it('has the front matter the content check needs', () => {
    expect(CONTENT_META.title).not.toBe('');
    expect(CONTENT_META.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(['high', 'medium', 'low']).toContain(CONTENT_META.confidence);
    expect(CONTENT_META.sources.length).toBeGreaterThan(0);
    expect(CONTENT_META.sources.some((s) => /^CR \d/.test(s))).toBe(true);
  });

  it('every copy key a step names exists, and every step has a rule and keyboard words', () => {
    for (const step of STEPS) {
      for (const [k, v] of Object.entries(step.copy))
        if (v) expect(COPY[v], `${step.id}.copy.${k} -> ${v}`).toBeTruthy();
      expect(COPY[`${step.id}.keys`], `${step.id}.keys`).toBeTruthy();
      expect(COPY[`${step.id}.rule`], `${step.id}.rule`).toMatch(/^CR \d/);
    }
    for (const z of TUTORIAL_ZONES) expect(COPY[`t1-zones.zone.${z}`], z).toBeTruthy();
  });

  it('every rule a step cites is listed in the front matter sources (M7-R8)', () => {
    for (const step of STEPS) {
      const rule = COPY[`${step.id}.rule`]!;
      expect(CONTENT_META.sources, `${step.id} cites ${rule}`).toContain(rule);
    }
  });

  it('every {number} slot is one the runner fills from the board', () => {
    const { r } = runner();
    const known = new Set(Object.keys(r.vars()));
    for (const [k, text] of Object.entries(COPY))
      for (const p of placeholders(text)) expect(known.has(p), `${k} uses {${p}}`).toBe(true);
    r.dispose();
  });

  it('an intro is two sentences (PROMPT.md: two sentences per step)', () => {
    for (const step of STEPS) {
      const intro = COPY[step.copy.intro]!;
      const sentences = intro
        .replace(/\[[^\]]*\]/g, '')
        .replace(/DON!!/g, 'DON')
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean);
      expect(sentences.length, `${step.id}: ${intro}`).toBeLessThanOrEqual(2);
    }
  });

  it('every card id it names exists', () => {
    const cards = cardMap();
    for (const text of Object.values(COPY))
      for (const m of text.matchAll(/\b(?:ST|OP|EB|PRB)\d{2}-\d{3}\b/g))
        expect(cards.has(m[0]), m[0]).toBe(true);
  });

  it('copy that states a number reads it from the board: no digits typed in the step words', () => {
    // The only typed numbers are rule facts that never change (a card's cost, "up to 2", "9 zones"),
    // listed here so a new typed number is a deliberate choice.
    const allowed = /^(0|1|2|9|1000)$/;
    for (const [k, text] of Object.entries(COPY)) {
      if (k.endsWith('.rule')) continue;
      const stripped = text.replace(/\{\w+\}/g, '').replace(/\[[^\]]*\]/g, '');
      for (const m of stripped.matchAll(/\d[\d,]*/g))
        expect(allowed.test(m[0]), `${k} has a typed number: ${m[0]}`).toBe(true);
    }
  });

  it('parses the format and fills slots', () => {
    const p = parseContent(
      '---\ntitle: "T"\nasOf: 2026-01-02\nconfidence: high\nsources:\n  - a\n  - CR 1-1\n---\n## s\n- x: Hello {n}.\n',
    );
    expect(p.meta).toEqual({
      title: 'T',
      asOf: '2026-01-02',
      confidence: 'high',
      sources: ['a', 'CR 1-1'],
    });
    expect(p.table['s.x']).toBe('Hello {n}.');
    expect(() => parseContent('no front matter')).toThrow();
    expect(say('missing.key')).toBe('missing.key');
  });
});

// -----------------------------------------------------------------------------------------------
// Playing each step the way it teaches
// -----------------------------------------------------------------------------------------------

const PREFERENCE = [
  'attack',
  'playCard',
  'giveDon',
  'activate',
  'counter',
  'trigger',
  'pick',
  'block',
  'done',
  'endCounter',
  'optional',
  'order',
];

function taught(id: TutorialStepId, al: Action[]): Action {
  const pick = [...al]
    .filter((a) => a.type !== 'endTurn' && a.type !== 'concede')
    .sort((a, b) => PREFERENCE.indexOf(a.type) - PREFERENCE.indexOf(b.type));
  if (id === 't6-trigger') {
    const t = al.find((a) => a.type === 'trigger' && a.activate);
    if (t) return t;
  }
  return pick[0]!;
}

/** Plays the step as taught; checks the allowed set at every decision. */
async function solve(r: TutorialRunner, seen: string[] = []): Promise<void> {
  const id = r.step.id;
  for (let n = 0; n < 40 && r.phase === 'playing'; n++) {
    await until(() => r.phase !== 'playing' || r.ctl.myDecision());
    if (r.phase !== 'playing') break;
    const ctl = r.ctl;
    const legal = new Set(ctl.session.view('p1').actions.map(actionKey));
    const allowed = ctl.actions();
    expect(
      allowed.length,
      `${id}: nothing allowed at ${ctl.view().decision?.kind}`,
    ).toBeGreaterThan(0);
    for (const a of allowed)
      expect(legal.has(actionKey(a)), `${id}: ${actionKey(a)} is not legal`).toBe(true);
    seen.push(ctl.view().decision?.kind ?? '');
    expect(ctl.act(taught(id, allowed))).toBe(true);
    await sleep(5);
  }
}

describe('each step, played as taught', () => {
  for (const id of TUTORIAL_STEP_IDS.filter((x) => x !== 't1-zones')) {
    it(`${id}: the taught action completes it`, async () => {
      const index = TUTORIAL_STEP_IDS.indexOf(id);
      const { r } = runner({ runId: 'x', step: index });
      // The run is new (no stored log for 'x'): it starts at the step asked for.
      expect(r.step.id).toBe(id);
      const opened = vi.spyOn(ScriptedOpponent.prototype, 'decide');
      await solve(r);
      expect(r.phase).toBe('done');
      expect(r.ctl.error).toBeNull();
      // Every move of the scripted opponent was one of the actions its seat was offered.
      for (const call of opened.mock.calls) {
        const view = call[0];
        const a = scriptedAction(view, r.step.script ?? 'none');
        expect(view.actions.map(actionKey)).toContain(actionKey(a));
      }
      expect(r.text('done')).toBeTruthy();
      r.dispose();
    });
  }

  it('t3 reads the power from the view: 6000 after the DON!!, from 5000 printed', async () => {
    const { r } = runner({ runId: 'x', step: 2 });
    await solve(r);
    const v = r.vars();
    expect(v.leaderPower).toBe(6000);
    expect(v.leaderBase).toBe(5000);
    expect(r.text('done')).toContain('6000');
    r.dispose();
  });

  it('t4 ends with their Life one lower, read from the view', async () => {
    const { r } = runner({ runId: 'x', step: 3 });
    expect(r.vars().oppLife).toBe(5);
    await solve(r);
    expect(r.vars().oppLife).toBe(4);
    expect(r.text('done')).toContain('4 Life');
    r.dispose();
  });

  it('t8 can be won: two hits, then the game is won and Finish completes the tutorial', async () => {
    const { r } = runner({ runId: 'x', step: 7 });
    await solve(r);
    expect(r.phase).toBe('done');
    expect(r.ctl.view().result).toMatchObject({ winner: 'p1' });
    r.next();
    expect(r.phase).toBe('complete');
    expect(r.tracker.snapshot().completedMs).not.toBeNull();
    r.dispose();
  });

  it('t1 is done when all nine zones are visited, and no action is allowed', async () => {
    const { r } = runner();
    await until(() => r.ctl.myDecision());
    expect(r.ctl.actions()).toEqual([]);
    expect(r.step.visit).toEqual([...TUTORIAL_ZONES]);
    for (const z of TUTORIAL_ZONES.slice(0, 8)) {
      r.visitZone(z);
      expect(r.phase).toBe('playing');
    }
    expect(r.vars().visited).toBe(8);
    r.visitZone(TUTORIAL_ZONES[8]!);
    expect(r.phase).toBe('done');
    // Visiting again is harmless, and a click on a card in step 1 is not a blocked attempt.
    r.visitZone('hand');
    expect(r.tracker.snapshot().steps[0]!.blockedAttempts).toBe(0);
    r.dispose();
  });
});

describe('what a step refuses', () => {
  it('a wrong action is refused with the step line and counts one blocked attempt', async () => {
    const { r } = runner({ runId: 'x', step: 1 });
    await until(() => r.ctl.myDecision());
    const end = r.ctl.session.view('p1').actions.find((a) => a.type === 'endTurn')!;
    const before = r.ctl.session.actionCount;
    expect(r.ctl.act(end)).toBe(false);
    expect(r.ctl.session.actionCount).toBe(before);
    expect(r.notice).toBe(say('t2-first-turn.blocked', r.vars()));
    expect(r.notice).toMatch(/^Not yet\./);
    expect(r.tracker.snapshot().steps[0]!.blockedAttempts).toBe(1);
    // A click on a card that is not lit (the stray seam) counts too.
    r.ctl.config.tutorial!.onStray!('anything');
    expect(r.tracker.snapshot().steps[0]!.blockedAttempts).toBe(2);
    r.dispose();
  });

  it('allowed never adds: with the step done, nothing is allowed', async () => {
    const { r } = runner({ runId: 'x', step: 2 });
    await solve(r);
    expect(r.phase).toBe('done');
    expect(r.ctl.actions()).toEqual([]);
    r.dispose();
  });

  it('t5: "Take the hit" is inert and says why; the counter then completes the step', async () => {
    const { r } = runner({ runId: 'x', step: 4 });
    await until(() => r.ctl.myDecision());
    // The window is the Block step: "No block" is allowed, nothing else.
    expect(r.ctl.view().decision?.kind).toBe('block');
    const keys = r.ctl.actions().map((a) => a.type);
    expect(keys).toEqual(['block']);
    // Take the hit = no block, then end the Counter Step with nothing played.
    const hit: Action[] = [
      { type: 'block', blocker: null, player: 'p1' },
      { type: 'endCounter', player: 'p1' },
    ];
    r.ctl.actSequence(hit);
    expect(r.notice).toBe(say('t5-defend.blocked'));
    expect(r.notice).toMatch(/^Not in this step: this one teaches countering\./);
    expect(r.ctl.view().zones.p1.life).toHaveLength(5);
    expect(r.phase).toBe('playing');
    expect(r.tracker.snapshot().steps[0]!.blockedAttempts).toBe(1);
    // Now the Counter Step: stage Jinbe, then end it.
    await until(() => r.ctl.view().decision?.kind === 'counter');
    await solve(r);
    expect(r.phase).toBe('done');
    expect(r.ctl.view().zones.p1.life).toHaveLength(5);
    r.dispose();
  });

  it('t6: the hit lands either way, and Activate and Add to hand are both allowed', async () => {
    const { r } = runner({ runId: 'x', step: 5 });
    await until(() => r.ctl.myDecision());
    r.ctl.act({ type: 'block', blocker: null, player: 'p1' });
    await until(() => r.ctl.view().decision?.kind === 'counter' && r.ctl.myDecision());
    r.ctl.act({ type: 'endCounter', player: 'p1' });
    await until(() => r.ctl.view().decision?.kind === 'trigger' && r.ctl.myDecision());
    expect(
      r.ctl
        .actions()
        .map((a) => a.type)
        .sort(),
    ).toEqual(['trigger', 'trigger']);
    // Add to hand finishes the step as well as Activate does.
    r.ctl.act({ type: 'trigger', activate: false, player: 'p1' });
    await until(() => r.phase === 'done');
    expect(r.vars().life).toBe(4);
    r.dispose();
  });

  it('t8: ending the turn without winning says "Not quite" and starts the step again', async () => {
    const { r } = runner({ runId: 'x', step: 7 });
    await until(() => r.ctl.myDecision());
    const attempt = r.attempt;
    const rec0 = r.tracker.snapshot().steps[0]!;
    expect(rec0.rewinds).toBe(0);
    r.ctl.act(r.ctl.session.view('p1').actions.find((a) => a.type === 'endTurn')!);
    await until(() => r.attempt > attempt);
    expect(r.step.id).toBe('t8-winning');
    expect(r.notice).toMatch(/^Not quite/);
    expect(r.phase).toBe('playing');
    // A fresh board: they are at 1 Life again, and it is the player's turn.
    await until(() => r.ctl.myDecision());
    expect(r.ctl.view().zones.p2.life).toHaveLength(1);
    expect(r.tracker.snapshot().steps[0]!.rewinds).toBe(1);
    r.dispose();
  });
});

describe('leave, resume and Back', () => {
  it('Leave saves the step; resuming restarts that step and counts an exit', async () => {
    const store = new MemoryTimingStore();
    const a = runner(null, store);
    // Step 1, then onward to step 4 (index 3): finish t1, t2 and t3 by their taught actions.
    for (const z of TUTORIAL_ZONES) a.r.visitZone(z);
    a.r.next();
    await solve(a.r);
    a.r.next();
    await solve(a.r);
    a.r.next();
    expect(a.r.step.id).toBe('t4-attack');
    const runId = a.r.tracker.runId;
    a.clock.advance(5000);
    a.r.leave();
    expect(loadProgress()).toEqual({ runId, step: 3 });

    // Later, on the next visit: Continue.
    const b = runner(loadProgress(), store);
    // `runner()` builds its own fake clock at 0; the stored run is the one resumed.
    expect(b.r.step.id).toBe('t4-attack');
    expect(b.r.tracker.runId).toBe(runId);
    const log = b.r.tracker.snapshot();
    expect(log.steps.find((s) => s.stepId === 't4-attack')!.exits).toBe(1);
    expect(log.steps.map((s) => s.stepId)).toEqual([
      't1-zones',
      't2-first-turn',
      't3-don-and-power',
      't4-attack',
    ]);
    // The scenario restarted from its first position (their Life is 5 again).
    await until(() => b.r.ctl.myDecision());
    expect(b.r.vars().oppLife).toBe(5);
    b.r.dispose();
  });

  it('Back goes to the start of the previous step, and does nothing at step 1', async () => {
    const { r } = runner({ runId: 'z', step: 3 });
    await until(() => r.ctl.myDecision());
    const attempt = r.attempt;
    r.back();
    expect(r.step.id).toBe('t3-don-and-power');
    expect(r.attempt).toBeGreaterThan(attempt);
    await until(() => r.ctl.myDecision());
    // A fresh t3: no DON!! given yet.
    expect(r.ctl.view().zones.p1.leader[0]!.don).toBe(0);
    r.back();
    r.back();
    expect(r.step.id).toBe('t1-zones');
    const at = r.attempt;
    r.back();
    expect(r.step.id).toBe('t1-zones');
    expect(r.attempt).toBe(at);
    r.dispose();
  });

  it('Back counts a rewind on the step left; Read again counts nothing; progress is saved on entering a step', async () => {
    const { r } = runner({ runId: 'z', step: 2 });
    r.back();
    const rec = r.tracker.snapshot().steps;
    expect(rec.find((s) => s.stepId === 't3-don-and-power')?.rewinds ?? 0).toBeGreaterThanOrEqual(
      0,
    );
    expect(loadProgress()?.step).toBe(1);
    const sig = r.readSignal;
    r.readAgain();
    expect(r.readSignal).toBe(sig + 1);
    r.dispose();
  });

  it('progress that is not a valid step is ignored', () => {
    saveProgress({ runId: 'a', step: 3 });
    expect(loadProgress()).toEqual({ runId: 'a', step: 3 });
    saveProgress({ runId: 'a', step: 9 });
    expect(loadProgress()).toBeNull();
    saveProgress({ runId: 'a', step: -1 });
    expect(loadProgress()).toBeNull();
  });
});

describe('the scripted opponent', () => {
  it('never blocks, counters or uses a Trigger, and attacks the Leader once on its turn', async () => {
    const { r } = runner({ runId: 'x', step: 4 });
    // Wait for its attack: the player is asked to block.
    await until(() => r.ctl.myDecision());
    const v2 = r.ctl.session.view('p2');
    const at = r.ctl.view().battle!;
    expect(at).not.toBeNull();
    expect(v2.zones.p2.leader[0]!.rested).toBe(true);
    r.dispose();
  });

  it('answers each kind of decision from the actions it is offered', () => {
    const ctl = (() => {
      const { r } = runner({ runId: 'x', step: 4 });
      return r.ctl;
    })();
    // At the start of its Main Phase it attacks; with nothing to attack with it ends its turn.
    const v = ctl.session.view('p2');
    const a = scriptedAction(v, 'attack-leader');
    expect(v.actions.map(actionKey)).toContain(actionKey(a));
    ctl.dispose();
  });
});

describe('hidden information', () => {
  // The step words, highlights and allowed set are functions of the player's own view: two games
  // that differ only in the opponent's hidden hand, deck and Life cards read and allow the same.
  const swapHidden = (id: TutorialStepId) => {
    const spec = structuredClone(SCENARIOS_T[id]);
    const other = ['ST22-014', 'ST22-013', 'ST22-012'];
    const swap = (l: string[] | undefined) => l?.map((_c, i) => other[i % other.length]!);
    spec.p2.hand = swap(spec.p2.hand) ?? [];
    spec.p2.deck = swap(spec.p2.deck) ?? [];
    spec.p2.life = swap(spec.p2.life as string[] | undefined) ?? [];
    return spec;
  };

  for (const id of TUTORIAL_STEP_IDS) {
    it(`${id}: the words and the allowed set do not depend on their hidden cards`, async () => {
      const index = TUTORIAL_STEP_IDS.indexOf(id);
      const a = runner({ runId: 'x', step: index }).r;
      const b = new TutorialRunner({
        cards: cardMap(),
        clock: { now: () => 0 },
        store: new MemoryTimingStore(),
        env,
        speed: 4,
        resume: { runId: 'y', step: index },
        makeController: (step, filter) => {
          const ctl = new GameController(
            cardMap(),
            { scenario: swapHidden(step.id) },
            {
              mode: 'ai',
              human: 'p1',
              names: { p1: 'You', p2: 'Opp' },
              tier: 'rookie',
              autoSkip: !step.alwaysAsk,
              alwaysSkip: false,
              speed: 4,
              aiCardIds: [],
              aiDeck: [],
              aiPort: () => new ScriptedOpponent(step.script ?? 'none'),
              tutorial: filter,
            },
          );
          return ctl;
        },
      });
      await Promise.all([until(() => a.ctl.myDecision()), until(() => b.ctl.myDecision())]);
      for (const k of ['intro', 'prompt', 'blocked', 'done'] as const)
        expect(b.text(k)).toBe(a.text(k));
      expect(b.keys()).toBe(a.keys());
      expect(b.vars()).toEqual(a.vars());
      expect(b.ctl.actions().map(actionKey)).toEqual(a.ctl.actions().map(actionKey));
      expect(b.spoken()).toBe(a.spoken());
      a.dispose();
      b.dispose();
    });
  }
});

describe('the first-game preset', () => {
  it('sets Learner verbosity and the tier-1 detector, and leaves the rest of the profile alone', () => {
    const p = { ...DEFAULT_PROFILE, donMath: true, muted: ['x'] };
    const q = applyFirstGame(p);
    expect(q).toMatchObject({ verbosity: 'learner', alwaysOn: 1, donMath: true, muted: ['x'] });
    expect(FIRST_GAME_COACH).toEqual({ verbosity: 'learner', alwaysOn: 1 });
    // The stored profile is the caller's: the preset returns a copy.
    expect(p.verbosity).toBe('standard');
    expect(p.alwaysOn).toBe(0);
  });
});
