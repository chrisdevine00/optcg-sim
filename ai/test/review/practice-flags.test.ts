/**
 * M9 WP7: Practice for the remaining flag kinds, and the worker's `puzzle` message.
 *
 * - `don-unused` flags carry `don-ledger` with `unusedMin` (the best of WP3's candidate lines at the
 *   turn's first Main, never above `n - 1`); the bar is reachable (a line reaches it with `reduce`)
 *   and "End turn at once" is not it.
 * - `target` flags carry `target-best` with the better target's ENGINE INSTANCE id (not a view handle).
 * - The `puzzle` message (`ReviewJob.handle`) answers with `puzzleFromFlag`: an any-hand flag gives
 *   the same item whatever their hidden cards are (differential, and the leaky path shown to fail it),
 *   a Hindsight flag keeps the record's hand, a target's id is mapped into the item's own ids.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  appendAction,
  createFromScenario,
  legalActions,
  queries,
  reduce,
  startRecord,
  type Action,
  type GameState,
} from '@optcg/engine';
import { harderHand, INERT_LIFE } from '../../src/search/drills/hand.ts';
import { candidateLines, ledgerAfter } from '../../src/search/drills/lines.ts';
import type { BoardItem, ScenarioJson } from '../../src/search/drills/types.ts';
import { detect as detectTarget } from '../../src/search/review/target.ts';
import {
  ReviewJob,
  type ReviewFlag,
  type ReviewRecord,
  type ReviewResponse,
} from '../../src/search/review/index.ts';
import { minimal } from '../../src/explanation.ts';
import { bankFor, type LethalItem } from '../../src/search/drills/index.ts';
import { cardMap, lookup } from '../support.ts';
import { contextOf, itemAt } from '../support/review-plant.ts';
import { e06Record } from './wp2-positions.ts';
import { run, contextOf as contextOf2, indexOf } from './wp2-support.ts';
import { e08Record, NEWGATE } from '../support/review-target-positions.ts';

vi.setConfig({ testTimeout: 300_000 });

const cards = cardMap();

type Puzzle = Extract<ReviewResponse, { type: 'puzzle' }>;
/** Ask a review job the `puzzle` question exactly as the worker's `onmessage` does. */
function ask(record: ReviewRecord, flag: ReviewFlag, gameId = 'g1'): Puzzle {
  let out: Puzzle | null = null;
  const job = new ReviewJob((m) => {
    if (m.type === 'puzzle') out = m;
  });
  job.handle({
    type: 'puzzle',
    flagId: flag.id,
    record,
    cards: [...cards.values()],
    flag,
    gameId,
  });
  return out!;
}

describe('don-unused flags carry the don-ledger bar', () => {
  const rec = e06Record();
  const ctx = contextOf2(rec);
  const at = indexOf(rec, (a) => a.type === 'endTurn');
  const flag = run('don-unused', ctx, at)!.flags[0]!;

  it('unusedMin is the least any candidate line leaves, below the 3 the game left', () => {
    expect(flag.practice).toMatchObject({ judge: 'don-ledger', turn: 8 });
    const main = ctx.stateAt(flag.restoreIndex);
    const lines = candidateLines(main, 'p1', cards);
    // Each line's ledger, recomputed here by replaying its actions with the engine.
    const unused = lines.map((l) => ledgerAfter(main, l.actions, 'p1', cards).unused);
    const best = Math.min(...unused);
    expect(flag.practice!.expect!.unusedMin).toBe(Math.min(best, 3 - 1));
    expect(flag.practice!.expect!.unusedMin).toBeLessThan(3);
  });

  it('the bar is reachable (a line reaches it) and ending the turn at once is not', () => {
    const main = ctx.stateAt(flag.restoreIndex);
    const bar = flag.practice!.expect!.unusedMin!;
    const reach = candidateLines(main, 'p1', cards).some(
      (l) => ledgerAfter(main, l.actions, 'p1', cards).unused <= bar,
    );
    expect(reach).toBe(true);
    const idle: Action[] = [{ type: 'endTurn', player: 'p1' }];
    expect(ledgerAfter(main, idle, 'p1', cards).unused).toBeGreaterThan(bar);
  });

  it('reads the player’s own seat only: other hidden cards of theirs give the same bar', () => {
    const variants = [
      { hand: ['OP17-048', 'OP17-049'], life: ['OP17-054', 'OP17-054', 'OP17-050'], deckSeed: 4 },
      { hand: ['OP17-040', 'OP08-051'], life: ['OP17-050', 'OP17-052', 'OP17-048'], deckSeed: 0 },
    ];
    for (const h of variants) {
      const r = e06Record(h);
      const out = run(
        'don-unused',
        contextOf2(r),
        indexOf(r, (a) => a.type === 'endTurn'),
      );
      expect(out!.flags[0]!.practice).toEqual(flag.practice);
    }
  });
});

describe('target flags carry the better target as an engine instance id', () => {
  const rec = e08Record();
  const ctx = contextOf(rec);
  const flag = detectTarget(itemAt('target', 7, 0), ctx)!.flags[0]!;
  const expectTarget = flag.practice!.expect!.target!;

  it('is target-best, restored at the attack, with an id of the record’s own state', () => {
    expect(flag.practice).toMatchObject({ judge: 'target-best', turn: 7 });
    const s = ctx.stateAt(flag.restoreIndex);
    // What an action holds: the same id the legal attacks name.
    const legalTargets = legalActions(s)
      .filter((a) => a.type === 'attack')
      .map((a) => (a as Extract<Action, { type: 'attack' }>).target);
    expect(legalTargets).toContain(expectTarget);
    // E08: the better target is Newgate, not the Leader the player attacked.
    expect(queries.card(s, expectTarget).card).toBe(NEWGATE);
    const chosen = (rec.actions[flag.decisionIndex] as Extract<Action, { type: 'attack' }>).target;
    expect(chosen).not.toBe(expectTarget);
    expect(queries.card(s, chosen).zone).toBe('leader');
  });
});

// --- The `puzzle` message --------------------------------------------------------------------

const bank = bankFor('lethal').items as LethalItem[];
const base = bank.find((i) => i.answer.lethal && i.first)!;
const start = (sc: ScenarioJson): GameState => createFromScenario({ ...sc, cards: lookup }).state;

function recordOf(sc: ScenarioJson, actions: Action[] = []): ReviewRecord {
  let s = start(sc);
  let rec = {
    ...startRecord({ scenario: sc }, s),
    seats: { p1: 'human', p2: 'ai' },
    auto: [],
    rewinds: [],
  } as ReviewRecord;
  for (const a of actions) {
    s = reduce(s, a).state;
    rec = { ...rec, ...appendAction(rec as never, a, s) } as ReviewRecord;
  }
  return rec;
}

/** Their hidden cards moved around: same counts in each zone, other cards in each. */
function permuted(sc: ScenarioJson, by: number): ScenarioJson {
  const p2 = sc.p2;
  const hand = p2.hand ?? [];
  const deck = p2.deck ?? [];
  const life = (p2.life ?? []).map((x) => (typeof x === 'string' ? x : x.card));
  const all = [...hand, ...deck, ...life];
  const r = [...all.slice(by % all.length), ...all.slice(0, by % all.length)];
  return {
    ...sc,
    p2: {
      ...p2,
      hand: r.slice(0, hand.length),
      deck: r.slice(hand.length, hand.length + deck.length),
      life: r.slice(hand.length + deck.length),
    },
  };
}

const lethalFlag = (over: Partial<ReviewFlag> = {}): ReviewFlag => ({
  id: 'missed-lethal:3:0',
  kind: 'missed-lethal',
  turn: base.scenario.turn,
  player: 'p1',
  restoreIndex: 0,
  decisionIndex: 0,
  severity: 'severe',
  certainty: 'any-hand',
  explanation: minimal('lethal-math', 'x'),
  did: [],
  practice: { judge: 'win-this-turn', turn: base.scenario.turn },
  ...over,
});

describe('the `puzzle` message', () => {
  it('an any-hand flag: their hand is harderHand, and the item is the same whatever they hold', () => {
    const a = ask(recordOf(base.scenario), lethalFlag());
    expect(a).toMatchObject({ type: 'puzzle', flagId: 'missed-lethal:3:0' });
    const item = a.item as BoardItem;
    expect(item).toMatchObject({ hand: 'harder', label: 'any-hand', drill: 'lethal', seat: 'p1' });
    expect(item.id).toBe('flag:g1:missed-lethal:3:0');
    expect(item.scenario.p2.hand).toEqual(
      harderHand(base.theirs!, base.scenario.p2.hand!.length, cards),
    );
    // A record whose real hand was weak: the item still shows the harder one.
    const weak = {
      ...base.scenario,
      p2: { ...base.scenario.p2, hand: base.scenario.p2.hand!.map(() => INERT_LIFE) },
    };
    const w = ask(recordOf(weak), lethalFlag()).item!;
    expect(w.scenario.p2.hand).toEqual(item.scenario.p2.hand);
    expect(w.scenario.p2.hand).not.toEqual(weak.p2.hand);
    for (const by of [1, 4, 9]) {
      const b = ask(recordOf(permuted(base.scenario, by)), lethalFlag());
      expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    }
  });

  it('leak check: a path that kept the real hand would fail that differential', () => {
    // The leaky version of the any-hand path is the Hindsight path (it keeps the record's hand).
    const leaky = (sc: ScenarioJson) =>
      JSON.stringify(ask(recordOf(sc), lethalFlag({ severity: 'hindsight' })));
    expect(leaky(permuted(base.scenario, 3))).not.toBe(leaky(base.scenario));
  });

  it('a Hindsight flag keeps the record’s hand and is labelled hindsight', () => {
    const hs = lethalFlag({ severity: 'hindsight', certainty: 'needed-hidden-info' });
    const item = ask(recordOf(base.scenario), hs).item!;
    expect(item).toMatchObject({ hand: 'real', label: 'hindsight' });
    expect(item.scenario.p2.hand).toEqual(base.scenario.p2.hand);
  });

  it('answers a flag it cannot rebuild with a reason, never a throw', () => {
    const r = ask(recordOf(base.scenario), lethalFlag({ restoreIndex: 99 }));
    expect(r.item).toBeNull();
    expect(r.reason).toEqual(expect.any(String));
    // No flag, no record: the same.
    let out: Puzzle | null = null;
    new ReviewJob((m) => {
      if (m.type === 'puzzle') out = m;
    }).handle({ type: 'puzzle', flagId: 'x' });
    expect((out as Puzzle | null)?.item).toBeNull();
  });

  it('maps a target flag’s record id into the rebuilt scenario’s own ids', () => {
    const rec = e08Record();
    const flag = detectTarget(itemAt('target', 7, 0), contextOf(rec))!.flags[0]!;
    const out = ask(rec, flag);
    const item = out.item!;
    expect(item).toMatchObject({ drill: 'lethal', label: 'any-hand', hand: 'harder' });
    const t = item.judgeExpect!.target!;
    const s = start(item.scenario);
    // The id names the same card, in the same zone, in the item's own state.
    expect(queries.card(s, t)).toMatchObject({ card: NEWGATE, zone: 'characters' });
    const legal = legalActions(s)
      .filter((a) => a.type === 'attack')
      .map((a) => (a as Extract<Action, { type: 'attack' }>).target);
    expect(legal).toContain(t);
  });

  it('a DON!! flag keeps its bar in the item', () => {
    const rec = e06Record();
    const ctx = contextOf2(rec);
    const flag = run(
      'don-unused',
      ctx,
      indexOf(rec, (a) => a.type === 'endTurn'),
    )!.flags[0]!;
    const out = ask(
      {
        seats: { p1: 'human', p2: 'ai' },
        auto: [],
        rewinds: [],
        ...rec,
      } as unknown as ReviewRecord,
      flag,
    );
    expect(out.item).toMatchObject({
      drill: 'don',
      judgeExpect: { unusedMin: flag.practice!.expect!.unusedMin },
    });
  });
});
