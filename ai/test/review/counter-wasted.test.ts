/**
 * M8 WP2: the `counter-wasted` detector on planted records. E19 (a counter that only tied: the hit
 * landed) and E04 (a counter at 5 Life that a lone last hit did not need) equal the examples in
 * explanations.md; Life 2, a counter Event with a second effect, and a bound that cannot prove the
 * hits are over give no `any-hand` flag; a hand-only proof is Hindsight, never severe.
 */
import { SCRIPTS } from '@optcg/cards';
import { queries, reduce, type GameState } from '@optcg/engine';
import { describe, expect, it, vi } from 'vitest';
import { hitBound } from '../../src/search/review/counter-wasted.ts';
import { docExample } from '../support/doc.ts';
import { cardMap } from '../support.ts';
import {
  BUCKIN,
  defendWith,
  e04,
  e04Record,
  e19Record,
  HIDDEN,
  ROCKS_PIRATES,
  ZORO,
} from './wp2-positions.ts';
import { luffyRecord } from './wp2-positions-more.ts';
import { build, contextOf, indexOf, run, step } from './wp2-support.ts';

vi.setConfig({ testTimeout: 120_000 });

const firstCounter = (rec: ReturnType<typeof e04Record>): number =>
  indexOf(rec, (a) => a.type === 'counter' || (a.type === 'activate' && a.ability === 'counter'));

/** End the counter step and decline a Life Trigger, as the review's simulation does. */
const takeIt = (s: GameState): GameState => {
  let t = reduce(s, { type: 'endCounter', player: 'p1' }).state;
  if (queries.decision(t)?.kind === 'trigger')
    t = reduce(t, { type: 'trigger', activate: false, player: 'p1' }).state;
  return t;
};

const same = (e: Record<string, unknown>, d: Record<string, unknown>, keys: string[]): void => {
  for (const k of keys) expect(e[k], k).toEqual(d[k]);
};
const KEYS = ['conceptId', 'claim', 'outcome', 'certainty', 'nextTime', 'lessonId', 'sources'];

describe('E19: a counter that only tied', () => {
  const rec = e19Record();
  const ctx = contextOf(rec);
  const at = firstCounter(rec);
  const res = run('counter-wasted', ctx, at);
  const doc = docExample('E19');

  it('is a moderate any-hand flag that can be practised as "no counter"', () => {
    expect(res!.flags).toHaveLength(1);
    expect(res!.flags[0]).toMatchObject({
      id: `counter-wasted:8:${at}`,
      kind: 'counter-wasted',
      player: 'p1',
      severity: 'moderate',
      certainty: 'any-hand',
      restoreIndex: at,
      decisionIndex: at,
      practice: { judge: 'no-counter-on-attack', turn: 8 },
    });
  });

  it('matches the E19 example: claim, outcome, nextTime, ids, figures and text', () => {
    const e = res!.flags[0]!.explanation;
    same(e as never, doc as never, KEYS);
    expect(e.evidence.map((x) => x.figures)).toEqual(doc.evidence.map((x) => x.figures));
    expect(e.evidence.map((x) => x.text)).toEqual(doc.evidence.map((x) => x.text));
    expect(e.line!.map((m) => [m.kind, m.text, m.card])).toEqual(
      doc.line!.map((m) => [m.kind, m.text, m.card]),
    );
  });

  it('has a line that replays: taking the hit loses 1 Life, and adding Buckin stops it', () => {
    const s0 = ctx.stateAt(at);
    const taken = takeIt(s0);
    expect(queries.zone(taken, 'p1', 'life')).toHaveLength(2);
    // Rocks Pirates and Buckin together: 5000 + 2000 + 1000 = 8000 against 7000.
    const rp = queries.zone(s0, 'p1', 'hand').find((c) => c.card === ROCKS_PIRATES)!;
    const bk = queries.zone(s0, 'p1', 'hand').find((c) => c.card === BUCKIN)!;
    let s = s0;
    const leader = queries.zone(s, 'p1', 'leader')[0]!.instance;
    for (const a of [
      { type: 'activate', card: rp.instance, ability: 'counter', player: 'p1' },
      { type: 'counter', card: bk.instance, target: leader, player: 'p1' },
    ] as const) {
      s = reduce(s, a).state;
      while (queries.decision(s)?.kind === 'choose')
        s = reduce(s, { type: 'pick', choice: leader, player: 'p1' }).state;
    }
    expect(queries.card(s, leader).power).toBe(8000);
  });

  it('describes what the player did', () => {
    expect(res!.flags[0]!.did).toHaveLength(1);
    expect(res!.flags[0]!.did[0]!.text).toContain('Played Rocks Pirates (+2000).');
    expect(res!.flags[0]!.did[0]!.text).toContain('the hit landed (Life 3 → 2)');
  });
});

describe('E04: a counter the Life total did not need', () => {
  const rec = e04Record();
  const ctx = contextOf(rec);
  const at = firstCounter(rec);
  const res = run('counter-wasted', ctx, at);
  const doc = docExample('E04');

  it('is a moderate any-hand flag', () => {
    expect(res!.flags).toHaveLength(1);
    expect(res!.flags[0]).toMatchObject({
      kind: 'counter-wasted',
      severity: 'moderate',
      certainty: 'any-hand',
      practice: { judge: 'no-counter-on-attack', turn: 10 },
    });
  });

  it('matches the E04 example: claim, outcome, nextTime, ids, figures and text', () => {
    const e = res!.flags[0]!.explanation;
    same(e as never, doc as never, KEYS);
    expect(e.evidence.map((x) => x.figures)).toEqual(doc.evidence.map((x) => x.figures));
    expect(e.evidence.map((x) => x.text)).toEqual(doc.evidence.map((x) => x.text));
    expect(e.line).toEqual(doc.line);
  });

  it('has a line that replays: taking the hit leaves 4 Life and 7 cards', () => {
    const taken = takeIt(ctx.stateAt(at));
    expect(queries.zone(taken, 'p1', 'life')).toHaveLength(4);
    expect(queries.zone(taken, 'p1', 'hand')).toHaveLength(7);
  });

  it('gives no flag at 2 Life', () => {
    const r = e04Record(HIDDEN, 2);
    expect(run('counter-wasted', contextOf(r), firstCounter(r))).toBeNull();
  });

  it('gives no flag when the player did not counter, or an AI seat did', () => {
    const noCounter = build(e04(), 'p2', [step.attack('p2', 'leader', 'leader')], defendWith([]));
    const c = contextOf(noCounter);
    expect(run('counter-wasted', c, noCounter.actions.length - 1)).toBeNull();
    expect(run('counter-wasted', contextOf(rec, { p1: 'ai', p2: 'human' }), at)).toBeNull();
  });
});

describe('E19 and E04 with a second effect or an attack still to come', () => {
  it('does not judge a counter Event whose script does more than add power', () => {
    const rec = e19Record();
    const ctx = contextOf(rec);
    const at = firstCounter(rec);
    expect(run('counter-wasted', ctx, at)).not.toBeNull();
    const script = SCRIPTS[ROCKS_PIRATES] as unknown as {
      abilities: { when: unknown; effect: unknown[] }[];
    };
    const counter = script.abilities.find((a) => a.when === 'counter' || Array.isArray(a.when))!;
    const saved = counter.effect;
    try {
      // As if the Event also rested a Character: one more step after the power gain.
      counter.effect = [...saved, { do: { rest: { from: 'characters', owner: 'opponent' } } }];
      expect(run('counter-wasted', ctx, at)).toBeNull();
    } finally {
      counter.effect = saved;
    }
    expect(run('counter-wasted', ctx, at)).not.toBeNull();
  });

  it('three active attackers at 3 Life: the bound fails, so no any-hand flag (and none at all)', () => {
    const r = e04Record(HIDDEN, 3, [ZORO, ZORO, ZORO]);
    const res = run('counter-wasted', contextOf(r), firstCounter(r));
    expect(res).toBeNull();
  });
});

describe('Hindsight: the public bound fails, their real hand could not have made the hits', () => {
  /**
   * They play Luffy (OP13-001): their archetype runs cards that could add an attacker (Zoro
   * OP13-037 sets itself active, cost 4), they hold 2 cards and 8 active DON!!, so publicly two more
   * hits are possible on top of the Character on their board. At 3 Life (2 after the hit) that is
   * not provable. What they really hold decides it.
   */
  const make = (hand: string[]) => luffyRecord(hand);

  it('is a Hindsight flag (never severe) when the real hand holds no attacker', () => {
    const r = make(['OP17-054', 'OP17-050']);
    const res = run('counter-wasted', contextOf(r), firstCounter(r))!;
    expect(res.flags).toHaveLength(1);
    const f = res.flags[0]!;
    expect(f.severity).toBe('hindsight');
    expect(f.certainty).toBe('needed-hidden-info');
    expect(f.explanation.certainty).toBe('needed-hidden-info');
    expect(f.explanation.evidence[1]!.text).toContain('Looking at their hand');
  });

  it('is no flag at all when their real hand held what could have made the hits', () => {
    const r = make(['OP13-037', 'OP13-037']);
    expect(run('counter-wasted', contextOf(r), firstCounter(r))).toBeNull();
  });

  it('the public bound is what hides the hand, the actual one is what reads it', () => {
    const cards = cardMap();
    const a = make(['OP17-054', 'OP17-050']);
    const b = make(['OP13-037', 'OP13-037']);
    const taken = (r: typeof a) => takeIt(contextOf(r).stateAt(firstCounter(r)));
    const [sa, sb] = [taken(a), taken(b)];
    expect(hitBound(sa, 'p1', 'public', cards)).toEqual(hitBound(sb, 'p1', 'public', cards));
    expect(hitBound(sa, 'p1', 'actual', cards)).not.toEqual(hitBound(sb, 'p1', 'actual', cards));
  });
});
