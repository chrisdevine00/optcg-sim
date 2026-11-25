/**
 * M7 WP0: the controller seams are inert by default and only narrow when set (tutorial filter,
 * commit gate, stage), and the stored coach profile migrates to the new fields.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actionKey } from '@optcg/ai';
import type { Action } from '@optcg/engine';
import { GameController, type GameConfig } from '../src/play/game/controller.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { DEFAULT_PROFILE, loadProfile, saveProfile } from '../src/play/coach/profile.ts';
import { TUTORIAL_STEP_IDS } from '../src/tutorial/types.ts';
import { cardMap } from './support.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function game(extra: Partial<GameConfig> = {}) {
  const { mode: _m, ...spec } = SCENARIOS.lethalDemo!;
  const ctl = new GameController(
    cardMap(),
    { scenario: spec },
    {
      mode: 'ai',
      human: 'p1',
      names: { p1: 'You', p2: 'Rocks' },
      tier: 'rookie',
      autoSkip: true,
      alwaysSkip: false,
      speed: 4,
      aiCardIds: ['OP17-039'],
      aiDeck: [],
      aiPort: () => ({
        planTurn: () => ({ id: 0, result: Promise.resolve() }),
        decide: () => ({ id: 0, result: new Promise(() => undefined) }),
        reveal() {},
        cancel() {},
        reset() {},
        terminate() {},
      }),
      ...extra,
    },
  );
  ctl.start();
  return ctl;
}

const keys = (as: Action[]) => as.map(actionKey);

describe('the controller seams', () => {
  it('are inert by default: the same actions, no gate, nothing staged or held', async () => {
    const a = game();
    const b = game({ tutorial: { allow: () => true, onBlocked: () => undefined } });
    await sleep(60);
    expect(a.actions().length).toBeGreaterThan(1);
    expect(keys(b.actions())).toEqual(keys(a.actions()));
    expect(a.commitGate).toBeUndefined();
    expect(a.staged).toBeNull();
    expect(a.heldAction).toBeNull();
    a.dispose();
    b.dispose();
  });

  it('the tutorial filter only narrows the engine legal actions, and a refused act calls onBlocked', async () => {
    const base = game();
    const blocked: Action[] = [];
    const ctl = game({
      tutorial: { allow: (a) => a.type !== 'endTurn', onBlocked: (a) => blocked.push(a) },
    });
    await sleep(60);
    const all = keys(base.actions());
    const some = keys(ctl.actions());
    expect(some.every((k) => all.includes(k))).toBe(true);
    expect(some.length).toBe(all.length - 1);
    const end = ctl.session.view('p1').actions.find((a) => a.type === 'endTurn') as Action;
    const before = ctl.session.actionCount;
    expect(ctl.act(end)).toBe(false);
    expect(blocked).toEqual([end]);
    expect(ctl.session.actionCount).toBe(before);
    base.dispose();
    ctl.dispose();
  });

  it('a commit gate can hold an action, and Commit anyway skips it', async () => {
    const ctl = game();
    await sleep(60);
    ctl.commitGate = () => 'hold';
    const end = ctl.session.view('p1').actions.find((a) => a.type === 'endTurn') as Action;
    const before = ctl.session.actionCount;
    expect(ctl.act(end)).toBe(false);
    expect(ctl.heldAction).toEqual(end);
    expect(ctl.session.actionCount).toBe(before);
    expect(ctl.act(end, undefined, { skipGate: true })).toBe(true);
    expect(ctl.heldAction).toBeNull();
    ctl.dispose();
  });

  it('stage accepts a legal action only, and clears', async () => {
    const ctl = game();
    await sleep(60);
    const legal = ctl.actions()[0]!;
    expect(ctl.stage(legal)).toBe(true);
    expect(ctl.staged).toEqual(legal);
    expect(ctl.stage({ type: 'endTurn', player: 'p2' } as Action)).toBe(false);
    expect(ctl.staged).toEqual(legal);
    expect(ctl.stage(null)).toBe(true);
    expect(ctl.staged).toBeNull();
    ctl.dispose();
  });

  it('stage refuses what the tutorial filter removed', async () => {
    const ctl = game({
      tutorial: { allow: (a) => a.type === 'endTurn', onBlocked: () => undefined },
    });
    await sleep(60);
    const other = ctl.session.view('p1').actions.find((a) => a.type !== 'endTurn') as Action;
    expect(ctl.stage(other)).toBe(false);
    ctl.dispose();
  });
});

describe('the coach profile migration', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
      },
    };
  });
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it('gives an empty store the defaults', () => {
    expect(loadProfile()).toEqual(DEFAULT_PROFILE);
    expect(DEFAULT_PROFILE).toMatchObject({ blunder: false, muted: [], alerts: false });
    expect(DEFAULT_PROFILE.firstGame).toBeUndefined();
  });

  it('reads an old stored profile and fills the new fields with defaults', () => {
    store.set(
      'optcg.coach.v1',
      JSON.stringify({
        expanded: true,
        tab: 'why',
        alwaysOn: 2,
        verbosity: 'terse',
        donMath: true,
      }),
    );
    expect(loadProfile()).toEqual({
      expanded: true,
      tab: 'why',
      alwaysOn: 2,
      verbosity: 'terse',
      donMath: true,
      blunder: false,
      muted: [],
      alerts: false,
    });
  });

  it('keeps the new tabs and fields, and drops garbage', () => {
    saveProfile({
      ...DEFAULT_PROFILE,
      tab: 'tempo',
      blunder: true,
      muted: ['gap'],
      alerts: true,
      firstGame: true,
    });
    expect(loadProfile()).toMatchObject({
      tab: 'tempo',
      blunder: true,
      muted: ['gap'],
      alerts: true,
      firstGame: true,
    });
    store.set(
      'optcg.coach.v1',
      JSON.stringify({ tab: 'bogus', muted: [1, 'gap'], firstGame: 'x' }),
    );
    const p = loadProfile();
    expect(p.tab).toBe('lethal');
    expect(p.muted).toEqual(['gap']);
    expect('firstGame' in p).toBe(false);
  });
});

describe('the tutorial step ids', () => {
  it('are t1-zones to t8-winning, in order', () => {
    expect(TUTORIAL_STEP_IDS).toEqual([
      't1-zones',
      't2-first-turn',
      't3-don-and-power',
      't4-attack',
      't5-defend',
      't6-trigger',
      't7-leader',
      't8-winning',
    ]);
  });
});
