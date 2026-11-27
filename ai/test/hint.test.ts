/**
 * M7 WP1: the hint as a line (docs/design/explanations.md E15, flows F9).
 *
 * - E15's explanation, with the line injected by a test double, says what the doc says: its claim,
 *   its line, its figures (recomputed through the engine), its condition, its certainty.
 * - E15's position, searched: the line starts with Nami, or Nami's line is within a tolerance of the
 *   best one.
 * - "Hint returns a line": about 50 positions from seeded Rookie-versus-Rookie games, Main, defence
 *   and choice, each give a non-empty line whose first step replays legally through the engine and
 *   a Main line ends in `endTurn`.
 * - Hidden information: two games differing only in the opponent's hand, deck and Life give the same
 *   request and the same answer; and the test has teeth (a view that shows their hand changes it).
 * - The budget: per push, the search stops when its injected clock says 2,000 ms are spent (within
 *   25%); in the nightly (TIMING=1), p95 of the wall clock within 2.5 s plus 20%.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  actionFromView,
  project,
  projectForSearch,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
  type SearchView,
} from '@optcg/engine';
import { MINUS } from '../src/explain.ts';
import { certaintyLabel, type Explanation } from '../src/index.ts';
import { answerHint, clearHintMemo, hint, hintSeed, hintSetup } from '../src/coach/hint.ts';
import { MAX_ALTERNATIVES, type HintResult } from '../src/coach/types.ts';
import {
  planTurn as piratePlan,
  toView,
  type PlanOut as PiratePlanOut,
} from '../src/search/pirate.ts';
import { newMemory, planTurn, type PlanOut } from '../src/search/warlord.ts';
import { cardMap, metaDecks } from './support.ts';
import { e15Line, e15State, KAIDO, LUFFY } from './support/hint-e15.ts';
import { gatherPositions, strip, type HintPosition } from './support/hint-positions.ts';
import { quantile } from './support/stats.ts';

// Searching tests: CI runners are several times slower than a desktop.
vi.setConfig({ testTimeout: 180_000 });

const cards = cardMap();
const luffyList = (): string[] => metaDecks().find((d) => d.leader === LUFFY)!.main;
const E15_GAME = () => ({ ownDeck: luffyList(), leader: LUFFY, opponentLeader: KAIDO });

/** The example's Explanation object, evaluated from its ```ts block in explanations.md. */
function docExample(id: string): Explanation {
  const md = readFileSync(new URL('../../docs/design/explanations.md', import.meta.url), 'utf8');
  const at = md.indexOf(`## ${id}.`);
  const block = /```ts\n([\s\S]*?)```/.exec(md.slice(at))![1]!;
  return new Function(`return (${block});`)() as Explanation;
}

const allText = (r: HintResult): string[] => [
  r.explanation.claim,
  r.explanation.outcome,
  r.explanation.nextTime,
  ...r.explanation.evidence.map((e) => e.text),
  ...r.line.map((m) => m.text),
  ...r.alternatives.map((a) => a.why),
];

/** The first step of a result replays legally: each action is in the legal list when it is taken. */
function replayFirstStep(state: GameState, me: PlayerId, r: HintResult): GameState {
  let s = state;
  const pending = [...r.viewActions];
  while (pending.length > 0) {
    const v = projectForSearch(s, me);
    expect(v.decision?.player).toBe(me);
    // A run of picks is an unordered set: the engine takes it in its own candidate order.
    const window =
      pending[0]!.type === 'pick' ? pending.filter((a) => a.type === 'pick') : [pending[0]!];
    const k = window.findIndex((a) => v.actions.some((x) => strip(x) === strip(a)));
    expect(
      k,
      `none of ${JSON.stringify(window)} is legal in ${JSON.stringify(v.actions)}`,
    ).toBeGreaterThanOrEqual(0);
    const a = window[k]!;
    pending.splice(pending.indexOf(a), 1);
    s = reduce(s, actionFromView(s, me, a)).state;
  }
  return s;
}

describe('E15: the explanation of a line', () => {
  const state = e15State();
  const { view, line } = e15Line(state);
  const result = hint(view, { cards, search: () => line, game: E15_GAME() });
  const doc = docExample('E15');

  it("is the E15 line, in order, with the doc's claim, kinds and certainty", () => {
    expect(result.explanation.claim).toBe(doc.claim);
    expect(result.line.map((m) => m.kind)).toEqual(doc.line!.map((m) => m.kind));
    expect(result.line.map((m) => m.card)).toEqual(doc.line!.map((m) => m.card));
    expect(result.explanation.line).toEqual(result.line);
    expect(result.explanation.conceptId).toBe(doc.conceptId);
    expect(result.explanation.lessonId).toBe(doc.lessonId);
    expect(result.explanation.certainty).toBe('any-hand');
    expect(certaintyLabel(result.certainty, 'coach')).toBe('Works against any hand');
    expect(result.incomplete).toBe(false);
    // The first step is "Play Nami", and it stages its two targets.
    expect(result.viewActions.map((a) => a.type)).toEqual(['playCard', 'pick', 'pick']);
  });

  it('says its figures, each one recomputed through the engine from the scenario', () => {
    const f = Object.assign({}, ...result.explanation.evidence.map((e) => e.figures ?? {}));
    // Leader 5000 + 1 DON!! = 6000; Yamato 1000: 6000 − 1000 + 1000. Bonney 2000 against Queen 1000.
    const leader = queries.zone(state, 'p1', 'leader')[0]!;
    const yamato = queries.zone(state, 'p2', 'characters').find((c) => c.card === 'OP17-074')!;
    const queen = queries.zone(state, 'p2', 'characters').find((c) => c.card === 'EB04-032')!;
    const bonney = queries.zone(state, 'p1', 'characters')[0]!;
    expect(f.leaderPower).toBe((leader.power ?? 0) + 1000);
    expect(f.stopOnYamato).toBe((leader.power ?? 0) + 1000 - (yamato.power ?? 0) + 1000);
    expect(f.stopOnQueen).toBe((bonney.power ?? 0) - (queen.power ?? 0) + 1000);
    const { leaderPower, stopOnYamato, stopOnQueen } = doc.evidence[1]!.figures!;
    expect(f).toMatchObject({ leaderPower, stopOnYamato, stopOnQueen });
    // 6 DON!!, Nami costs 4, 1 given; at the end of the turn Nami sets up to 5 active.
    expect(f.activeAtEnd).toBe(5);
    expect(f.donGiven).toBe(1);
    expect(f.activeAtEnd).toBe(doc.evidence[3]!.figures!.activeAtEnd);
  });

  it('states its condition, never "Likely", and keeps its copy short', () => {
    expect(result.explanation.outcome).toContain('unless they spend 6000 of counters');
    expect(result.explanation.outcome).toContain('keeps 5 DON!! active');
    for (const t of allText(result)) expect(t).not.toMatch(/likely|probably|perhaps/i);
    for (const e of result.explanation.evidence)
      expect(e.text.split(/\s+/).length).toBeLessThanOrEqual(32);
    // The real minus sign, and every number in a sentence is in `figures`.
    expect(result.explanation.evidence[1]!.text).toContain(`6000 ${MINUS} 1000 + 1000 = 6000`);
    expect(result.alternatives.length).toBeLessThanOrEqual(MAX_ALTERNATIVES);
  });

  it('names no card of theirs but the two on the board, and none from a hidden zone', () => {
    const text = allText(result).join(' ');
    const hiddenNames = new Set<string>();
    for (const z of ['hand', 'life', 'deck'] as const)
      for (const c of queries.zone(state, 'p2', z)) hiddenNames.add(cards.get(c.card)!.name);
    for (const n of hiddenNames)
      if (n !== 'Yamato' && n !== 'Queen' && n !== 'Kaido') expect(text).not.toContain(n);
  });
});

describe('E15: the position, searched', () => {
  it("starts with Nami, or Nami's line is within a tolerance of the best", () => {
    const state = e15State();
    const { view } = e15Line(state);
    const opts = { cards, budget: { iterations: 4000 }, game: E15_GAME() };
    const setup = hintSetup(view, opts);
    const mem = newMemory();
    const out: PlanOut = {};
    planTurn(
      view,
      setup,
      { turn: { iterations: 4000 }, defence: { iterations: 300 }, lethal: { nodes: 6000 } },
      hintSeed(view),
      mem,
      out,
    );
    const ranking = out.rootRanking!;
    expect(ranking.length).toBeGreaterThan(3);
    // Sorted by visits, and each entry is a legal first move of the position.
    for (const r of ranking) expect(toView(r.actions[0]!, view.skeleton.handles)).not.toBeNull();
    const nami = view.zones.p1.hand.find((c) => c.card === 'OP14-031')!.handle;
    const isNami = (r: (typeof ranking)[number]) => {
      const a = toView(r.actions[0]!, view.skeleton.handles);
      return a?.type === 'playCard' && a.card === nami;
    };
    const best = ranking[0]!;
    const withNami = ranking.filter(isNami);
    expect(withNami.length).toBeGreaterThan(0);
    const gap = best.raw - Math.max(...withNami.map((r) => r.raw));
    const r = hint(view, opts);
    const startsWithNami = r.line[0]?.card === 'OP14-031';
    // The heuristic is not tuned to a doc example: a play that costs at most 4 cards of value
    // (the heuristic's units) against the best line still teaches the same idea.
    expect(
      startsWithNami || gap <= 4,
      `Nami is ${gap.toFixed(2)} cards behind: ${r.line.map((m) => m.text).join(' / ')}`,
    ).toBe(true);
  });
});

describe('hint returns a line', () => {
  const positions: HintPosition[] = gatherPositions(
    { main: 20, defence: 17, choice: 13 },
    Array.from({ length: 40 }, (_, i) => i + 1),
  );

  it('has about 50 positions of all three kinds', () => {
    const n = (k: string) => positions.filter((p) => p.kind === k).length;
    expect(positions.length).toBeGreaterThanOrEqual(40);
    expect(n('main')).toBeGreaterThanOrEqual(15);
    expect(n('defence')).toBeGreaterThanOrEqual(10);
    expect(n('choice')).toBeGreaterThanOrEqual(8);
  });

  it('gives each a non-empty line whose first step replays legally; a Main line ends in endTurn', () => {
    for (const p of positions) {
      const r = hint(p.view, {
        cards,
        budget: { iterations: 250 },
        game: { ownDeck: p.own, leader: p.leader, opponentLeader: p.opponentLeader },
      });
      const where = `seed ${p.seed} ${p.kind} ${p.view.decision?.kind}`;
      expect(r.line.length, where).toBeGreaterThan(0);
      expect(r.viewActions.length, where).toBeGreaterThan(0);
      replayFirstStep(p.state, p.player, r);
      if (p.view.decision!.kind === 'main')
        expect(r.line[r.line.length - 1]!.kind, where).toBe('endTurn');
      // The explanation is a real one.
      expect(r.explanation.claim.length, where).toBeGreaterThan(0);
      expect(r.explanation.evidence.length, where).toBeGreaterThan(0);
      expect(r.explanation.outcome.length, where).toBeGreaterThan(0);
      expect(r.certainty, where).toBe(r.explanation.certainty);
      expect(r.alternatives.length, where).toBeLessThanOrEqual(MAX_ALTERNATIVES);
      for (const t of allText(r)) expect(t, where).not.toMatch(/likely/i);
      // Nothing the player cannot see is named: every card name in the copy is on the board, in
      // their own hand or trash, or in the effect text (the view's own cards).
      const visible = new Set<string>();
      for (const side of ['p1', 'p2'] as const)
        for (const z of Object.values(p.view.zones[side]))
          for (const c of z) if (c.card) visible.add(cards.get(c.card)?.name ?? c.card);
      const hidden = new Set<string>();
      for (const c of queries.zone(p.state, p.player === 'p1' ? 'p2' : 'p1', 'hand'))
        hidden.add(cards.get(c.card)!.name);
      for (const n of hidden)
        if (!visible.has(n)) expect(allText(r).join(' '), where).not.toContain(n);
    }
  });

  it('asking twice gives the same answer', () => {
    for (const p of positions.slice(0, 8)) {
      const opts = {
        cards,
        budget: { iterations: 200 },
        game: { ownDeck: p.own, leader: p.leader, opponentLeader: p.opponentLeader },
      };
      expect(hint(p.view, opts)).toEqual(hint(p.view, opts));
    }
  });

  it("is the worker's answer too: same id, a typed result, remembered between asks", () => {
    clearHintMemo();
    const p = positions.find((x) => x.kind === 'main')!;
    const game = {
      tier: 'warlord' as const,
      ownDeck: p.own,
      leader: p.leader,
      opponentLeader: p.opponentLeader,
    };
    const req = { type: 'hint' as const, id: 7, view: p.view, budgetMs: 300 };
    const a = answerHint(req, cards, game);
    const b = answerHint({ ...req, id: 8 }, cards, game);
    expect(a).toMatchObject({ type: 'hint', id: 7 });
    expect(b).toMatchObject({ type: 'hint', id: 8 });
    expect((a.result as HintResult).line.length).toBeGreaterThan(0);
    expect(b.result).toEqual(a.result);
  });
});

describe('hidden information', () => {
  /** The state with the opponent's hand, deck and face-down Life cards rotated among themselves. */
  function twin(state: GameState, me: PlayerId): { state: GameState; changed: number } {
    const opp = me === 'p1' ? 'p2' : 'p1';
    const t = structuredClone(state) as unknown as { cards: Record<string, { card: string }> };
    const ids = [
      ...queries.zone(state, opp, 'hand'),
      ...queries.zone(state, opp, 'deck'),
      ...queries.zone(state, opp, 'life').filter((c) => !c.faceUp),
    ].map((c) => c.instance);
    const names = ids.map((id) => t.cards[id]!.card);
    let changed = 0;
    ids.forEach((id, i) => {
      const next = names[(i + 7) % names.length]!;
      if (next !== t.cards[id]!.card) changed++;
      t.cards[id]!.card = next;
    });
    return { state: t as unknown as GameState, changed };
  }

  const positions = gatherPositions(
    { main: 8, defence: 6, choice: 4 },
    Array.from({ length: 30 }, (_, i) => i + 50),
  );

  it('two states differing only in their hand, deck and Life give identical requests and identical hints', () => {
    let differing = 0;
    for (const p of positions) {
      const { state: other, changed } = twin(p.state, p.player);
      if (changed > 0) differing++;
      const a = projectForSearch(p.state, p.player);
      const b = projectForSearch(other, p.player);
      // The request: the view and its search skeleton are the same.
      expect(JSON.stringify(b), `seed ${p.seed}`).toBe(JSON.stringify(a));
      const opts = {
        cards,
        budget: { iterations: 250 },
        game: { ownDeck: p.own, leader: p.leader, opponentLeader: p.opponentLeader },
      };
      expect(hint(b, opts), `seed ${p.seed} ${p.kind}`).toEqual(hint(a, opts));
    }
    // The twins really differ in what they hold.
    expect(differing).toBeGreaterThan(positions.length / 2);
  });

  it('has teeth: a view that shows their hand changes the hint', () => {
    // The leaky version: the opponent's hand identities in the view, as a bad projection would show.
    const leaky = (state: GameState, view: SearchView, me: PlayerId): SearchView => {
      const opp = me === 'p1' ? 'p2' : 'p1';
      const hand = queries.zone(state, opp, 'hand');
      return {
        ...view,
        zones: {
          ...view.zones,
          [opp]: {
            ...view.zones[opp],
            hand: view.zones[opp].hand.map((c, i) => ({ ...c, card: hand[i]?.card ?? null })),
          },
        },
      } as SearchView;
    };
    let differs = 0;
    for (const p of positions) {
      const { state: other, changed } = twin(p.state, p.player);
      if (changed === 0) continue;
      const opts = {
        cards,
        budget: { iterations: 250 },
        game: { ownDeck: p.own, leader: p.leader, opponentLeader: p.opponentLeader },
      };
      const a = hint(leaky(p.state, projectForSearch(p.state, p.player), p.player), opts);
      const b = hint(leaky(other, projectForSearch(other, p.player), p.player), opts);
      if (JSON.stringify(a) !== JSON.stringify(b)) differs++;
    }
    expect(differs).toBeGreaterThan(0);
  });

  it('a hint never reads the other seat: a plain view for the other player is not the request', () => {
    // The request is the asking seat's SearchView; the other seat's own view differs from it.
    const p = positions.find((x) => x.kind === 'main')!;
    const mine = projectForSearch(p.state, p.player);
    const theirs = project(p.state, p.player === 'p1' ? 'p2' : 'p1');
    expect(JSON.stringify(theirs.zones)).not.toBe(JSON.stringify(mine.zones));
    expect(mine.player).toBe(p.player);
  });
});

describe('the budget', () => {
  const positionsForBudget = () =>
    gatherPositions(
      { main: 10, defence: 2, choice: 0 },
      Array.from({ length: 30 }, (_, i) => i + 100),
    );

  // Per push, no wall clock (docs/runbooks/testing.md): the search is handed a clock that advances
  // 10 "ms" on every read, so its elapsed time is the number of budget checks it made. It must
  // stop when that clock says the 2,000 ms budget is spent, within 25% (the 2.5 s of the old gate).
  it('stops when its injected clock says the 2,000 ms budget is spent (within 25%)', () => {
    const TICK = 10;
    const used: number[] = [];
    for (const p of positionsForBudget()) {
      let t = 0;
      hint(p.view, {
        cards,
        budget: { ms: 2000 },
        now: () => (t += TICK),
        game: { ownDeck: p.own, leader: p.leader, opponentLeader: p.opponentLeader },
      });
      used.push(t);
    }
    const worst = Math.max(...used);
    expect(
      worst,
      `the hint read its clock up to ${worst} ms of a 2,000 ms budget (bound 2,500)`,
    ).toBeLessThanOrEqual(2500 + TICK);
    expect(worst, 'the hint searched on the injected clock').toBeGreaterThan(1500);
  });

  // The product requirement, in real milliseconds, in the nightly (TIMING=1): p95 within 2.5 s
  // plus 20% at the default budget. The numbers go to test-results/timing-hint.json.
  it.runIf(process.env.TIMING === '1')(
    'p95 of the wall clock is within 2.5 s plus 20% at the default budget (nightly)',
    () => {
      const times: number[] = [];
      for (const p of positionsForBudget()) {
        const t0 = performance.now();
        hint(p.view, {
          cards,
          budget: { ms: 2000 },
          game: { ownDeck: p.own, leader: p.leader, opponentLeader: p.opponentLeader },
        });
        times.push(performance.now() - t0);
      }
      const p95 = quantile(times, 0.95);
      mkdirSync('test-results', { recursive: true });
      writeFileSync(
        'test-results/timing-hint.json',
        JSON.stringify(
          {
            date: new Date().toISOString(),
            n: times.length,
            p50: quantile(times, 0.5),
            p95,
            max: Math.max(...times),
          },
          null,
          2,
        ),
      );
      expect(
        p95,
        `hint p95 ${p95.toFixed(0)} ms over ${times.length} positions; bound 3,000 ms`,
      ).toBeLessThanOrEqual(2500 * 1.2);
    },
  );
});

describe('the out-parameter of planTurn', () => {
  it('reports the root moves, best first, and leaves the plan unchanged', () => {
    const state = e15State();
    const { view } = e15Line(state);
    const setup = hintSetup(view, { cards, game: E15_GAME() });
    const budgets = {
      turn: { iterations: 600 },
      defence: { iterations: 100 },
      lethal: { nodes: 2000 },
    };
    const without = newMemory();
    const a = planTurn(view, setup, budgets, 5, without);
    const withOut = newMemory();
    const out: PlanOut = {};
    const b = planTurn(view, setup, budgets, 5, withOut, out);
    expect(b).toEqual(a);
    expect(out.rootRanking!.length).toBeGreaterThan(0);
    const visits = out.rootRanking!.map((r) => r.n);
    expect([...visits].sort((x, y) => y - x)).toEqual(visits);
    expect(withOut.tree!.iterations).toBe(without.tree!.iterations);
  });
});

describe("the out-parameter of Pirate's planTurn", () => {
  it('reports the candidates of the first decision, best first, and leaves the plan unchanged', () => {
    const { view } = e15Line(e15State());
    const setup = hintSetup(view, { cards, game: E15_GAME() });
    const a = piratePlan(view, setup, { iterations: 150 }, 3);
    const out: PiratePlanOut = {};
    const b = piratePlan(view, setup, { iterations: 150 }, 3, out);
    expect(b.plan.steps.map((x) => x.action)).toEqual(a.plan.steps.map((x) => x.action));
    expect(out.rootRanking!.length).toBeGreaterThan(1);
    const means = out.rootRanking!.map((r) => r.mean);
    expect([...means].sort((x, y) => y - x)).toEqual(means);
  });
});

export type { Action };
