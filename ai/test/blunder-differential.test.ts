/**
 * M7 WP2, hidden information: two states that differ only in the opponent's hidden hand, deck order
 * and face-down Life give the asking seat the same view, and so exactly the same score table. The
 * check is run against the real scorer (it must pass) and against two deliberately leaky ones (it
 * must fail), so a green result means the differential can see a leak.
 *
 * Position: their Leader is at 1 Life with one card in hand. You have a 5000 Leader and a 9000
 * Character; no DON!!. Two hits are needed. If their one hand card is a +1000 Counter they stop
 * the Leader's 5000-into-5000 attack and survive; if it is not, both attacks land. The public
 * search cannot tell which (worst case: it can be a Counter), so it does not prove lethal.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  actionFromView,
  projectForSearch,
  type Action,
  type GameState,
  type SearchView,
} from '@optcg/engine';
import { scoreDecision, seedOf, type ScoreContext } from '../src/coach/blunder.ts';
import { actionKey, type ScoreTable } from '../src/coach/types.ts';
import { lethal } from '../src/search/lethal/lethal.ts';
import { averageCounter, priorFor } from '../src/knowledge.ts';
import { fromView, play, simContext } from '../src/search/pirate.ts';
import { rolloutValue } from '../src/search/sim.ts';
import { cardMap } from './support.ts';
import { asVanilla } from './support/vanilla.ts';
import { lifeOf, listOf, start } from './support/scenario.ts';

vi.setConfig({ testTimeout: 120_000 });
asVanilla('OP13-001', 'OP13-027', 'OP13-118');

const cards = cardMap();
const LUFFY = 'OP13-001';
const ZORO = 'EB04-007';
const ROCKS = 'OP17-039';
const COUNTER_1000 = 'OP08-051';
const ctx: ScoreContext = {
  cards,
  game: { ownDeck: listOf(ROCKS), leader: LUFFY, opponentLeader: ROCKS },
  budget: { iterations: 120 },
  lethalCap: { nodes: 250_000 },
};

/** The same public position; only their hand, Life and deck differ. */
function world(hidden: 'blank' | 'counter'): GameState {
  const blank = hidden === 'blank';
  return start({
    seed: 11,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: LUFFY,
      characters: [ZORO],
      life: lifeOf(4, ZORO),
      hand: [],
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
    p2: {
      leader: ROCKS,
      life: [blank ? ZORO : COUNTER_1000],
      hand: [blank ? ZORO : COUNTER_1000],
      costArea: { active: 0, rested: 0 },
      decklist: blank ? listOf(ROCKS) : listOf('OP17-058'),
    },
  });
}

type Scorer = (state: GameState, view: SearchView) => ScoreTable;

const real: Scorer = (_s, view) => scoreDecision(view, ctx);

/** Leak 1: "is there a lethal?" asked of the real state (their real hand), not of the view. */
const leakyLethal: Scorer = (state, view) => {
  const t = scoreDecision(view, ctx);
  const r = lethal({ mode: 'actual', state }, cards, { nodes: 250_000 });
  const end = view.actions.find((a) => a.type === 'endTurn')!;
  if (r.status === 'proven') {
    (t.kinds[actionKey(end)] ??= []).push('missed-lethal');
  }
  return t;
};

/** Leak 2: values from rollouts in the real state, not in guesses drawn from the prior. */
const leakyValues: Scorer = (state, view) => {
  const t = scoreDecision(view, ctx);
  const setup = {
    ownDeck: ctx.game!.ownDeck,
    cards,
    playbook: null,
    prior: priorFor(ROCKS),
    oppAvgCounter: averageCounter(ROCKS, cards),
    k: 1,
    now: () => performance.now(),
  };
  const sim = simContext(view, setup);
  for (const o of view.actions.filter((a) => a.type !== 'concede')) {
    const after = play(
      state,
      { actions: [actionFromView(state, 'p1', o) as Action] },
      'p1',
      sim,
      true,
    );
    if (after) t.values[actionKey(o)] = rolloutValue(after, view.turn.number, sim).value;
  }
  return t;
};

/** Both worlds, the same view, and a scorer: the tables must be identical. */
function differential(score: Scorer): void {
  const a = world('blank');
  const b = world('counter');
  const va = projectForSearch(a, 'p1');
  const vb = projectForSearch(b, 'p1');
  expect(vb).toEqual(va);
  expect(score(b, vb)).toEqual(score(a, va));
}

/** The differential must fail on an assertion about the tables, not on an error of its own. */
function caught(score: Scorer): void {
  let error: unknown = null;
  try {
    differential(score);
  } catch (e) {
    error = e;
  }
  expect(error).not.toBeNull();
  expect((error as Error).name).toBe('AssertionError');
}

describe('hidden information: the score table is a function of the view', () => {
  it('the two worlds look the same to you and differ in fact', () => {
    const a = world('blank');
    const b = world('counter');
    const va = projectForSearch(a, 'p1');
    expect(projectForSearch(b, 'p1')).toEqual(va);
    expect(seedOf(va)).toBe(seedOf(projectForSearch(b, 'p1')));
    // In fact: with one real hand lethal holds, with the other it does not.
    expect(lethal({ mode: 'actual', state: a }, cards, { nodes: 250_000 }).status).toBe('proven');
    expect(lethal({ mode: 'actual', state: b }, cards, { nodes: 250_000 }).status).not.toBe(
      'proven',
    );
    // Publicly it is not proven in either (the hidden card may be a Counter).
    expect(lethal({ mode: 'public', view: va }, cards, { nodes: 250_000 }).status).not.toBe(
      'proven',
    );
  });

  it('the real scorer gives identical tables (values, kinds, warnings)', () => {
    differential(real);
  });

  it('a scorer that asks the real state about lethal is caught', () => {
    caught(leakyLethal);
  });

  it('a scorer that rolls out in the real state is caught', () => {
    caught(leakyValues);
  });

  it('the warning list is a function of the view and the pressed action only', () => {
    const va = projectForSearch(world('blank'), 'p1');
    const vb = projectForSearch(world('counter'), 'p1');
    const ta = scoreDecision(va, ctx);
    const tb = scoreDecision(vb, ctx);
    for (const act of va.actions) {
      const key = actionKey(act);
      expect(tb.warnings?.[key]).toEqual(ta.warnings?.[key]);
      expect(tb.kinds[key]).toEqual(ta.kinds[key]);
    }
    expect(fromView(va.actions[0]!, va.skeleton.handles)).toEqual(
      fromView(vb.actions[0]!, vb.skeleton.handles),
    );
  });
});
