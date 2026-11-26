/**
 * The three practice judges (M8 WP6, `GameController` `restore.puzzle.judge`): `win-this-turn`
 * (the L-slice default, covered in review.test.ts), `survive-turn` (a defence, and given-away) and
 * `no-counter-on-attack` (counter wasted). The position is cut at a real counter decision: the
 * opponent's Leader attacks the player's Leader in the `defend` scenario, built with the engine's
 * own actions and recorded as a session record.
 */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { chooseAction } from '@optcg/ai';
import {
  appendAction,
  createFromScenario,
  legalActions,
  queries,
  reduce,
  startRecord,
  type Action,
  type GameState,
  type PlayerView,
  type SearchView,
} from '@optcg/engine';
import { GameController, type AiPort } from '../src/play/game/controller.ts';
import type { SessionRecord } from '../src/session/index.ts';
import { prefixOf } from '../src/play/review/analyse.ts';
import { restoreConfig } from '../src/play/review/restore.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { cardMap, lookup } from './support.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class RookiePort implements AiPort {
  private n = 1;
  planTurn() {
    return { id: this.n++, result: Promise.resolve() };
  }
  decide(view: PlayerView | SearchView, _t: string, seed: number) {
    const d = chooseAction(view, { tier: 'rookie', seed, cards: cardMap() });
    return { id: this.n++, result: Promise.resolve({ ...d, alternatives: [], ms: 0 }) };
  }
  reveal(_c: Iterable<Card>) {}
  cancel() {}
  reset() {}
  terminate() {}
}

/** `defend`: player 2's Leader attacks player 1's Leader. Returns the record at the counter step. */
function cutAtCounter(): { record: SessionRecord; at: number } {
  const { mode: _m, ...spec } = SCENARIOS.defend!;
  const initial: GameState = createFromScenario({ ...spec, cards: lookup }).state;
  let state = initial;
  let record: SessionRecord = {
    ...startRecord({ scenario: spec }, initial),
    seats: { p1: 'human', p2: 'ai' },
    rewinds: [],
    auto: [],
  };
  const apply = (a: Action) => {
    state = reduce(state, a).state;
    record = { ...record, ...appendAction(record, a, state) };
  };
  for (let i = 0; i < 12; i++) {
    const dec = queries.decision(state);
    if (!dec) break;
    if (dec.kind === 'counter' && dec.player === 'p1') return { record, at: record.actions.length };
    const legal = legalActions(state);
    const leaderOf = (p: 'p1' | 'p2') => queries.zone(state, p, 'leader')[0]!.instance;
    const pick =
      legal.find(
        (a) => a.type === 'attack' && a.attacker === leaderOf('p2') && a.target === leaderOf('p1'),
      ) ??
      legal.find((a) => a.type === 'block' && a.blocker === null) ??
      legal.find((a) => a.type === 'endCounter');
    if (!pick) throw new Error(`no step from ${dec.kind}`);
    apply(pick);
  }
  throw new Error('the counter step was never reached');
}

const config = (record: SessionRecord) => ({
  ...restoreConfig(record, { me: 'p1', tier: 'rookie' }, cardMap()),
  speed: 4 as const,
  aiPort: () => new RookiePort(),
});

function puzzle(judge: 'no-counter-on-attack' | 'survive-turn') {
  const { record, at } = cutAtCounter();
  const prefix = prefixOf(record, at);
  const ctl = new GameController(cardMap(), prefix.start, {
    ...config(record),
    restore: { record: prefix, puzzle: { turn: 4, judge } },
  });
  ctl.start();
  return ctl;
}

const act = (ctl: GameController, type: string): boolean => {
  const a = ctl.actions().find((x) => x.type === type);
  return a ? ctl.act(a) : false;
};

describe('no-counter-on-attack (counter wasted)', () => {
  it('is solved when the counter step ends with no Counter played', async () => {
    const ctl = puzzle('no-counter-on-attack');
    await sleep(40);
    expect(ctl.puzzleState()).toBe('open');
    expect(act(ctl, 'endCounter')).toBe(true);
    expect(ctl.puzzleState()).toBe('solved');
    expect(ctl.view().turn.number).toBe(4);
    ctl.dispose();
  });

  it('fails the moment a Counter is played', async () => {
    const ctl = puzzle('no-counter-on-attack');
    await sleep(40);
    const counters = ctl.actions().filter((x) => x.type === 'counter');
    expect(counters.length).toBeGreaterThan(0);
    expect(ctl.act(counters[0]!)).toBe(true);
    expect(ctl.puzzleState()).toBe('failed');
    // Ending the step afterwards does not undo it.
    act(ctl, 'endCounter');
    expect(ctl.puzzleState()).toBe('failed');
    ctl.dispose();
  });
});

describe('survive-turn (should have countered, lethal given away)', () => {
  it('is open until the turn ends, then solved if the game is not lost', async () => {
    const ctl = puzzle('survive-turn');
    await sleep(40);
    expect(ctl.puzzleState()).toBe('open');
    expect(act(ctl, 'endCounter')).toBe(true);
    // The opponent finishes turn 4 (Rookie, in process); the puzzle is solved once turn 5 begins.
    for (let i = 0; i < 100 && ctl.puzzleState() === 'open'; i++) {
      if (ctl.myDecision() && !ctl.view().result) {
        const a =
          ctl.actions().find((x) => x.type === 'trigger') ??
          ctl.actions().find((x) => x.type === 'optional') ??
          ctl.actions().find((x) => x.type === 'endCounter') ??
          ctl.actions().find((x) => x.type === 'block');
        if (a) ctl.act(a);
      }
      await sleep(30);
    }
    expect(ctl.view().result).toBeNull();
    expect(ctl.view().turn.number).toBeGreaterThan(4);
    expect(ctl.puzzleState()).toBe('solved');
    ctl.dispose();
  });

  it('fails when the game is lost before the turn ends', async () => {
    const ctl = puzzle('survive-turn');
    await sleep(40);
    expect(ctl.act({ type: 'concede', player: 'p1' })).toBe(true);
    expect(ctl.view().result).toMatchObject({ winner: 'p2' });
    expect(ctl.puzzleState()).toBe('failed');
    ctl.dispose();
  });
});

describe('the lethal judge keeps its rule', () => {
  it('win-this-turn is failed by a loss and by a turn that ends without a win', async () => {
    const { record, at } = cutAtCounter();
    const prefix = prefixOf(record, at);
    const ctl = new GameController(cardMap(), prefix.start, {
      ...config(record),
      restore: { record: prefix, puzzle: { turn: 4, judge: 'win-this-turn' } },
    });
    ctl.start();
    await sleep(40);
    expect(ctl.puzzleState()).toBe('failed'); // turn 4 is the opponent's: nothing to win on it
    ctl.dispose();
  });
});
