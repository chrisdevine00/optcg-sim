/**
 * M8 WP4, hidden information: the `target` flag is `any-hand`. Two worlds that differ only in the
 * opponent's hidden hand, deck order and face-down Life give the seat the same view, and so exactly
 * the same verdict (the value gap and the best target) and the same flag, field for field. The check
 * runs against the real detector (it must pass) and against two deliberately leaky ones (it must
 * fail), so a green result means the differential can see a leak:
 *
 * - leaky values: the targets are rolled out in the real state (their real hand), not in guesses
 *   drawn from the archetype prior;
 * - leaky words: the explanation's "biggest Counter" is read from their real hand, not from the
 *   sourced lists.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  actionFromView,
  projectForSearch,
  queries,
  type Action,
  type GameState,
  type SearchView,
} from '@optcg/engine';
import { actionKey } from '../../src/coach/types.ts';
import { counterValueOf } from '../../src/knowledge.ts';
import { play, simContext } from '../../src/search/pirate.ts';
import { rolloutValue } from '../../src/search/sim.ts';
import {
  detect,
  judgeTarget,
  targetSetup,
  viewAttackOf,
  type TargetVerdict,
} from '../../src/search/review/target.ts';
import type { ReviewRecord, TurnResult } from '../../src/search/review/index.ts';
import { cardMap } from '../support.ts';
import { contextOf, itemAt } from '../support/review-plant.ts';
import { listOf } from '../support/scenario.ts';
import { e08Record, e09Record, KAIDO, ROCKS } from '../support/review-target-positions.ts';

vi.setConfig({ testTimeout: 120_000 });

const cards = cardMap();
const BUDGET = { iterations: 120 };

interface Case {
  name: string;
  record: (h: 'plain' | 'counters') => ReviewRecord;
  turn: number;
  ownDeck: string[];
  /** Their hand changes what rolling out in the real state gives (E09: a hit that may be stopped). */
  handMattersToValues: boolean;
}
const CASES: Case[] = [
  { name: 'E08', record: e08Record, turn: 7, ownDeck: listOf(KAIDO), handMattersToValues: false },
  { name: 'E09', record: e09Record, turn: 9, ownDeck: listOf(ROCKS), handMattersToValues: true },
];

type Judge = (state: GameState, view: SearchView, c: Case) => TargetVerdict;

const real: Judge = (state, view, c) => {
  const chosen = viewAttackOf(state, view, c.record('plain').actions[0]!)!;
  return judgeTarget(view, chosen, targetSetup(view, c.ownDeck, cards), BUDGET);
};

/** Leak 1: every target rolled out in the real state, not in guesses from the prior. */
const leakyValues: Judge = (state, view, c) => {
  const chosen = viewAttackOf(state, view, c.record('plain').actions[0]!)!;
  const setup = { ...targetSetup(view, c.ownDeck, cards), k: 1 };
  const sim = simContext(view, setup);
  const value = (o: Action): number => {
    const after = play(
      state,
      { actions: [actionFromView(state, view.player, o)] },
      view.player,
      sim,
      true,
    );
    return after ? rolloutValue(after, view.turn.number, sim).value : -Infinity;
  };
  const options = view.actions.filter((a) => a.type === 'attack' && a.attacker === chosen.attacker);
  const vs = new Map(options.map((o) => [actionKey(o), value(o)] as const));
  const best = options.reduce((x, y) => (vs.get(actionKey(y))! > vs.get(actionKey(x))! ? y : x));
  return {
    status: 'judged',
    chosen,
    best,
    gap: Math.max(0, vs.get(actionKey(best))! - vs.get(actionKey(chosen))!),
  };
};

const verdictOf = (judge: Judge, c: Case, h: 'plain' | 'counters') => {
  const rec = c.record(h);
  const ctx = contextOf(rec);
  const state = ctx.stateAt(0);
  const view = projectForSearch(state, 'p1');
  const v = judge(state, view, c);
  return { gap: v.gap, status: v.status, best: v.best ? actionKey(v.best) : null };
};

/** The flag the detector gives for the world, or a leaky rewrite of its words. */
function flagOf(c: Case, h: 'plain' | 'counters', leaky: boolean): TurnResult | null {
  const rec = c.record(h);
  const ctx = contextOf(rec);
  const out = detect(itemAt('target', c.turn, 0), ctx);
  if (!out || !leaky) return out;
  // Leak 2: the "biggest Counter" figure read from their real hand.
  const state = ctx.stateAt(0);
  const real = Math.max(
    0,
    ...queries.zone(state, 'p2', 'hand').map((x) => counterValueOf(cards.get(x.card))),
  );
  return {
    ...out,
    flags: out.flags.map((f) => ({
      ...f,
      explanation: {
        ...f.explanation,
        evidence: f.explanation.evidence.map((e) => ({
          ...e,
          figures: e.figures
            ? Object.fromEntries(
                Object.entries(e.figures).map(([k, v]) =>
                  k === 'maxPerCard' || k === 'biggestCounter' ? [k, real] : [k, v],
                ),
              )
            : e.figures,
        })),
      },
    })),
  };
}

/** The differential must fail on an assertion about the results, not on an error of its own. */
function caught(run: () => void): void {
  let error: unknown = null;
  try {
    run();
  } catch (e) {
    error = e;
  }
  expect(error).not.toBeNull();
  expect((error as Error).name).toBe('AssertionError');
}

describe.each(CASES)('hidden information: $name', (c) => {
  it('the two worlds look the same to you and differ in fact', () => {
    const a = c.record('plain').start;
    const b = c.record('counters').start;
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
    const sa = contextOf(c.record('plain')).stateAt(0);
    const sb = contextOf(c.record('counters')).stateAt(0);
    expect(projectForSearch(sb, 'p1')).toEqual(projectForSearch(sa, 'p1'));
    const hand = (s: GameState) => queries.zone(s, 'p2', 'hand').map((x) => x.card);
    expect(hand(sb)).not.toEqual(hand(sa));
  });

  it('the real detector gives the same verdict and the same flag in both worlds', () => {
    expect(verdictOf(real, c, 'counters')).toEqual(verdictOf(real, c, 'plain'));
    const plain = flagOf(c, 'plain', false);
    expect(plain?.flags).toHaveLength(1);
    expect(flagOf(c, 'counters', false)).toEqual(plain);
  });

  it.runIf(c.handMattersToValues)('a judge that rolls out in the real state is caught', () => {
    caught(() =>
      expect(verdictOf(leakyValues, c, 'counters')).toEqual(verdictOf(leakyValues, c, 'plain')),
    );
  });

  it('an explanation that reads their real hand is caught', () => {
    caught(() => expect(flagOf(c, 'counters', true)).toEqual(flagOf(c, 'plain', true)));
  });
});
