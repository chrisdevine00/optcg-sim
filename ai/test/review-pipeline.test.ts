/**
 * The review pipeline (M8 WP1): planner, replay cache, scheduler, job, and missed lethal as per-turn
 * items. Searches are capped by `nodes`, never by the clock, so every result here is deterministic;
 * the one clock test injects its own.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  actionFromView,
  appendAction,
  createFromScenario,
  legalActions,
  queries,
  reduce,
  replay,
  startRecord,
  type Action,
  type GameState,
  type PlayerId,
  type RecordWithSnapshots,
  type ScenarioSpec,
} from '@optcg/engine';
import {
  ReplayCache,
  ReviewJob,
  ReviewRefused,
  ReviewScheduler,
  certaintyLabel,
  checkLethalItem,
  flagId,
  planReview,
  reviewMissedLethal,
  reviewRecord,
  type ReviewRecord,
  type ReviewResponse,
} from '../src/index.ts';
import { cardMap, lookup } from './support.ts';
import { asVanilla } from './support/vanilla.ts';
import { docExample } from './support/doc.ts';
import { lifeOf, listOf } from './support/scenario.ts';
import { playRecord } from './support/review-record.ts';

vi.setConfig({ testTimeout: 120_000 });
asVanilla('OP13-001', 'OP13-027', 'OP13-118');

const cards = cardMap();
const allCards = [...cards.values()];
const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

// ---------------------------------------------------------------------------------------------
// Games to plan over: seeded Rookie games (fast), one lost by p1 and one won by p1
// ---------------------------------------------------------------------------------------------

function games() {
  const out = {
    lost: null as ReturnType<typeof playRecord> | null,
    won: null as ReturnType<typeof playRecord> | null,
  };
  for (let seed = 301; seed < 340 && (!out.lost || !out.won); seed++) {
    const g = playRecord(seed);
    if (!g.finished) continue;
    const w = queries.result(replay(g.record, lookup).state);
    if (!w || !('winner' in w)) continue;
    if (w.winner === 'p2' && queries.turn(replay(g.record, lookup).state).activePlayer === 'p2')
      out.lost ??= g;
    else if (w.winner === 'p1') out.won ??= g;
  }
  return out as { lost: ReturnType<typeof playRecord>; won: ReturnType<typeof playRecord> };
}
const G = games();

describe('the planner', () => {
  const plan = planReview(G.lost.record, lookup, cards);
  const rec = G.lost.record;
  const at = (i: number) => rec.actions[i]!;
  const stateAt = new ReplayCache(rec, lookup).stateAt;

  it('reviews the human seats by default, and ids are unique', () => {
    expect(plan.seats).toEqual(['p1']);
    expect(new Set(plan.items.map((x) => x.id)).size).toBe(plan.items.length);
    for (const x of plan.items) expect(x.id).toBe(flagId(x.kind, x.turn, x.index));
  });

  it('puts every item on the decision its kind names, for a reviewed seat only', () => {
    const kinds = new Set(plan.items.map((x) => x.kind));
    for (const k of ['mulligan', 'don-unused', 'target'] as const)
      expect(kinds.has(k), k).toBe(true);
    for (const x of plan.items) {
      const a = at(x.index);
      const s = stateAt(x.index);
      expect(queries.turn(s).number, x.id).toBe(x.turn);
      if (x.kind === 'mulligan') expect(a).toMatchObject({ type: 'mulligan', player: 'p1' });
      if (x.kind === 'don-unused') expect(a).toMatchObject({ type: 'endTurn', player: 'p1' });
      if (x.kind === 'counter-wasted') expect(a).toMatchObject({ type: 'counter', player: 'p1' });
      if (x.kind === 'target') {
        expect(a).toMatchObject({ type: 'attack', player: 'p1' });
        const targets = new Set(
          legalActions(s)
            .filter(
              (y) => y.type === 'attack' && y.attacker === (a as { attacker: string }).attacker,
            )
            .map((y) => (y as { target: string }).target),
        );
        expect(targets.size).toBeGreaterThanOrEqual(2);
      }
      if (x.kind === 'missed-lethal') {
        expect(queries.decision(s)).toMatchObject({ kind: 'main', player: 'p1' });
        // The first Main decision of that turn: the one before it is another turn's.
        if (x.index > 0) expect(queries.turn(stateAt(x.index - 1)).number).not.toBe(x.turn);
      }
    }
  });

  it("a lost game has the lost turn: the winner's first Main of the last turn, for the two searches", () => {
    expect(queries.result(replay(rec, lookup).state)).toMatchObject({ winner: 'p2' });
    const lost = plan.items.filter((x) => x.kind === 'should-counter' || x.kind === 'given-away');
    // The game ended on p2's own turn (`games()` picks one such).
    expect(lost.map((x) => x.kind).sort()).toEqual(['given-away', 'should-counter']);
    for (const x of lost) {
      expect(x.turn).toBe(plan.turns);
      expect(queries.decision(stateAt(x.index))).toMatchObject({ kind: 'main', player: 'p2' });
      expect(x.cost).toBe('search');
    }
  });

  it('a won game has no lost-turn items and no missed-lethal item on the winning turn', () => {
    const p = planReview(G.won.record, lookup, cards);
    expect(p.items.some((x) => x.kind === 'should-counter' || x.kind === 'given-away')).toBe(false);
    expect(p.items.some((x) => x.kind === 'missed-lethal' && x.turn === p.turns)).toBe(false);
  });

  it('skips auto-skipped actions: they are not decisions', () => {
    const ends = rec.actions.flatMap((a, i) =>
      a.type === 'endTurn' && a.player === 'p1' ? [i] : [],
    );
    expect(plan.items.filter((x) => x.kind === 'don-unused')).toHaveLength(ends.length);
    const autoed = planReview({ ...rec, auto: ends }, lookup, cards);
    expect(autoed.items.filter((x) => x.kind === 'don-unused')).toEqual([]);
    // Other kinds are untouched.
    expect(autoed.items.filter((x) => x.kind === 'target')).toEqual(
      plan.items.filter((x) => x.kind === 'target'),
    );
  });

  it('a seat that is not under review gets no items; both seats give both', () => {
    const both = planReview(rec, lookup, cards, { seats: ['p1', 'p2'] });
    const p2only = planReview(rec, lookup, cards, { seats: ['p2'] });
    expect(both.items.length).toBeGreaterThan(plan.items.length);
    const actor = (i: number) => at(i).player;
    for (const x of p2only.items.filter((y) => y.kind === 'don-unused' || y.kind === 'mulligan'))
      expect(actor(x.index)).toBe('p2');
  });

  it('refuses a record with no result: "The game is not over."', () => {
    const open: ReviewRecord = { ...rec, actions: rec.actions.slice(0, 12) };
    expect(() => planReview(open, lookup, cards)).toThrow(ReviewRefused);
    expect(() => planReview(open, lookup, cards)).toThrow('The game is not over.');
  });
});

describe('the replay cache', () => {
  const rec = G.lost.record;
  const n = rec.actions.length;

  it('answers every index as a direct replay does, in any order', () => {
    const cache = new ReplayCache(rec, lookup);
    const idx = [n, 0, 57, 19, 20, 21, 3, n - 1, 41, 40, 39, 100 % n, 20];
    for (const i of idx)
      expect(queries.turn(cache.stateAt(i)).number, `${i}`).toBe(
        queries.turn(replay(rec, lookup, i).state).number,
      );
    for (const i of [n, 25, 0, 61 % n]) {
      const a = cache.stateAt(i);
      const b = replay(rec, lookup, i).state;
      expect(queries.zone(a, 'p1', 'hand').map((c) => c.instance)).toEqual(
        queries.zone(b, 'p1', 'hand').map((c) => c.instance),
      );
      expect(queries.decision(a)?.kind).toBe(queries.decision(b)?.kind);
    }
  });

  it('keeps a checkpoint every 20 actions and starts from one, not from the beginning', () => {
    const cache = new ReplayCache(rec, lookup);
    cache.stateAt(n);
    expect(cache.size).toBe(1 + Math.floor(n / 20));
  });
});

describe('the scheduler', () => {
  const plan = planReview(G.lost.record, lookup, cards, { seats: ['p1', 'p2'] });

  it('runs the phases in order: A cheap, B missed lethal, C lost turn, D values', () => {
    const order = new ReviewScheduler(plan, { nodes: 10 }).items().map((x) => x.kind);
    const phase = (k: string) =>
      ({
        mulligan: 0,
        'don-unused': 0,
        'counter-wasted': 0,
        'missed-lethal': 1,
        'should-counter': 2,
        'given-away': 2,
        target: 3,
      })[k]!;
    expect(order.map(phase)).toEqual(order.map(phase).sort((a, b) => a - b));
    expect(order.length).toBe(plan.items.length);
  });

  it('with a node cap a search gets exactly that cap and no clock; deeper multiplies it', () => {
    const s = new ReviewScheduler(plan, { nodes: 500 });
    const first = s.next()!;
    expect(first.cap).toEqual({ nodes: 500 });
    s.complete(first.item, null);
    expect(s.deeper([first.item.id], 10)).toHaveLength(1);
    expect(s.next()).toMatchObject({ item: first.item, cap: { nodes: 5000 } });
  });

  it('prioritise runs one turn next, keeping phase order inside it', () => {
    const s = new ReviewScheduler(plan, { nodes: 10 });
    const turn = [...new Set(plan.items.map((x) => x.turn))].at(-1)!;
    s.prioritise(turn);
    const wanted = plan.items.filter((x) => x.turn === turn).length;
    const got: number[] = [];
    for (let i = 0; i < wanted; i++) got.push(s.next()!.item.turn);
    expect(got.every((t) => t === turn)).toBe(true);
  });

  it('deals shards without overlap and without loss', () => {
    const ids = [0, 1, 2].flatMap((index) =>
      new ReviewScheduler(plan, { nodes: 10, shard: { index, count: 3 } }).items().map((x) => x.id),
    );
    expect(ids.slice().sort()).toEqual(plan.items.map((x) => x.id).sort());
  });

  it('with the clock: ms = min(kind cap, time left / items left); nothing starts after the deadline', () => {
    let t = 0;
    const s = new ReviewScheduler(plan, { deadlineMs: 1000, now: () => t });
    const first = s.next()!;
    expect(first.cap.nodes).toBeGreaterThan(0);
    expect(first.cap.ms).toBeLessThanOrEqual(500);
    // A search item late in the review gets the time that is left, divided.
    const searches = plan.items.filter((x) => x.cost !== 'cheap');
    t = 990;
    const late = searches.length > 0 ? s.capFor(searches[0]!) : { ms: 0 };
    expect(late.ms).toBeLessThanOrEqual(10);
    t = 1000;
    expect(s.next()).toBeNull();
  });

  it('every item that never ran is a marker, per turn: never a clean turn', () => {
    const s = new ReviewScheduler(plan, { deadlineMs: 0, now: () => 5 });
    expect(s.next()).toBeNull();
    const m = s.markers();
    const turns = new Set(plan.items.map((x) => x.turn));
    expect(new Set(m.map((x) => x.turn))).toEqual(turns);
    expect(m.every((x) => x.reason === 'deadline')).toBe(true);
    expect(m.length).toBe(turns.size);
    expect(s.markers(true).every((x) => x.reason === 'not-run')).toBe(true);
  });
});

describe('the job (the worker body)', () => {
  const req = {
    type: 'start' as const,
    record: G.lost.record,
    cards: allCards,
    nodes: 2000,
  };

  it('streams progress and items, then done; the totals add up', async () => {
    const out: ReviewResponse[] = [];
    const job = new ReviewJob((m) => out.push(m), { yieldFn: async () => {} });
    await job.start(req);
    const prog = out.filter((m) => m.type === 'progress');
    expect(prog.length).toBeGreaterThan(1);
    const dones = prog.map((p) => p.done);
    expect(dones).toEqual(dones.slice().sort((a, b) => a - b));
    expect(prog.at(-1)).toMatchObject({ done: prog.at(-1)!.total });
    expect(out.at(-1)!.type).toBe('done');
    expect(out.filter((m) => m.type === 'done')).toHaveLength(1);
  });

  it('cancel stops between items: no done', async () => {
    const out: ReviewResponse[] = [];
    let n = 0;
    const job = new ReviewJob((m) => out.push(m), {
      yieldFn: async () => {
        if (++n === 2) job.handle({ type: 'cancel' });
      },
    });
    await job.start(req);
    expect(out.some((m) => m.type === 'done')).toBe(false);
    expect(out.filter((m) => m.type === 'progress').length).toBeLessThanOrEqual(4);
  });

  it('prioritise: the asked turn runs before the rest of its phase', async () => {
    const plan = planReview(G.lost.record, lookup, cards);
    const lateTurn = plan.items.filter((x) => x.kind === 'don-unused').at(-1)!;
    const order: number[] = [];
    const job = new ReviewJob(
      (m) => {
        if (m.type === 'progress' && m.done > 0) order.push(m.turn);
      },
      {
        yieldFn: async () => {
          if (order.length === 1) job.handle({ type: 'prioritise', turn: lateTurn.turn });
        },
      },
    );
    await job.start(req);
    // After the first item, the next run is on the asked turn.
    expect(order[1]).toBe(lateTurn.turn);
  });

  it('a shard runs only its own items; the shards together run them all', async () => {
    const seen = new Set<string>();
    for (let index = 0; index < 3; index++) {
      const results: string[] = [];
      const posted: ReviewResponse[] = [];
      const j = new ReviewJob((m) => posted.push(m), { yieldFn: async () => {} });
      await j.start({ ...req, shard: { index, count: 3 } });
      for (const m of posted)
        if (m.type === 'items') results.push(...m.results.map((r) => r.itemId));
      for (const r of results) {
        expect(seen.has(r), r).toBe(false);
        seen.add(r);
      }
    }
    const all = reviewRecord(G.lost.record, allCards, { nodes: 2000 }).results.map((r) => r.itemId);
    expect([...seen].sort()).toEqual(all.sort());
  });

  it('deeper after done re-runs the item and says so; a worker that owns none still answers', async () => {
    const out: ReviewResponse[] = [];
    const job = new ReviewJob((m) => out.push(m), { yieldFn: async () => {} });
    await job.start({ ...req, record: G.lost.record, nodes: 3 });
    const doneBefore = out.filter((m) => m.type === 'done').length;
    job.handle({ type: 'deeper', itemIds: ['nope:1:1'], factor: 50_000 });
    expect(out.filter((m) => m.type === 'done')).toHaveLength(doneBefore + 1);
  });

  it('a record that cannot be reviewed is an error message, not a throw', async () => {
    const out: ReviewResponse[] = [];
    const job = new ReviewJob((m) => out.push(m), { yieldFn: async () => {} });
    await job.start({
      ...req,
      record: { ...G.lost.record, actions: G.lost.record.actions.slice(0, 5) },
    });
    expect(out).toEqual([{ type: 'error', message: 'The game is not over.' }]);
  });
});

// ---------------------------------------------------------------------------------------------
// Missed lethal through the pipeline (planted: explanations.md E01)
// ---------------------------------------------------------------------------------------------

const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';
const ZORO = 'EB04-007';
const KAIDO_CHAR = 'OP17-062';
const ROCKS_PIRATES = 'OP17-056';
const NO_AUTHORITY = 'OP17-055';
type Spec = Omit<ScenarioSpec, 'cards'>;

const E01: Spec = {
  seed: 5,
  turn: 9,
  activePlayer: 'p1',
  firstPlayer: 'p1',
  p1: {
    leader: KAIDO,
    characters: [KAIDO_CHAR],
    life: lifeOf(3, ZORO),
    hand: [],
    costArea: { active: 4, rested: 0 },
    decklist: listOf(KAIDO),
  },
  p2: {
    leader: ROCKS,
    life: lifeOf(1, ZORO),
    hand: [ROCKS_PIRATES, NO_AUTHORITY],
    costArea: { active: 0, rested: 0 },
    decklist: listOf(ROCKS),
  },
};

function defence(s: GameState): Action {
  const acts = legalActions(s).filter((a) => a.type !== 'concede');
  const value = (a: Action): number =>
    a.type === 'counter'
      ? (queries.card(s, a.card).counter ?? 0)
      : a.type === 'activate' && a.ability === 'counter'
        ? 2000
        : 0;
  const counters = acts.filter((a) => value(a) > 0).sort((x, y) => value(y) - value(x));
  const b = queries.battle(s);
  if (counters.length > 0 && b) {
    const need =
      (queries.card(s, b.attacker).power ?? 0) - (queries.card(s, b.target).power ?? 0) + 1000;
    if (counters.reduce((t, c) => t + value(c), 0) >= need) return counters[0]!;
  }
  return (
    acts.find((a) => a.type === 'block' && a.blocker === null) ??
    acts.find((a) => a.type === 'endCounter') ??
    acts.find((a) => a.type === 'trigger' && !a.activate) ??
    acts.find((a) => a.type === 'optional' && !a.accept) ??
    acts.find((a) => a.type === 'pick') ??
    acts.find((a) => a.type === 'done') ??
    acts[0]!
  );
}

/** What the player did in E01: 2 DON!! each on Kaido and the Leader, Kaido first, then the turn ends. */
function played(spec: Spec = E01): RecordWithSnapshots {
  const init = createFromScenario({ ...spec, cards: lookup });
  let rec = startRecord({ scenario: spec }, init.state);
  let s = init.state;
  const legal = legalActions(s);
  const theirLeader = queries.zone(s, 'p2', 'leader')[0]!.instance;
  const mine = [...queries.zone(s, 'p1', 'leader'), ...queries.zone(s, 'p1', 'characters')];
  const queue: Action[] = [];
  for (const [card, don] of [
    [KAIDO_CHAR, 2],
    [KAIDO, 2],
  ] as [string, number][]) {
    const c = mine.find((x) => x.card === card)!;
    for (let i = 0; i < don; i++)
      queue.push(legal.find((a) => a.type === 'giveDon' && a.target === c.instance)!);
    queue.push({ type: 'attack', attacker: c.instance, target: theirLeader, player: 'p1' });
  }
  queue.push({ type: 'endTurn', player: 'p1' });
  for (let i = 0; i < 300 && !queries.result(s); i++) {
    const dec = queries.decision(s);
    if (queries.turn(s).number > 9) break;
    if (!dec) break;
    const a = dec.player === 'p1' && dec.kind === 'main' ? queue.shift() : defence(s);
    if (!a) break;
    s = reduce(s, a).state;
    rec = appendAction(rec, a, s);
  }
  return rec;
}

/** The game is over: the player concedes where the turn ended (the review reads finished games). */
function finished(rec: RecordWithSnapshots): ReviewRecord {
  const s = replay(rec, lookup).state;
  const a: Action = { type: 'concede', player: queries.decision(s)!.player };
  return {
    ...appendAction(rec, a, reduce(s, a).state),
    seats: { p1: 'human', p2: 'ai' },
    auto: [],
    rewinds: [],
  };
}

describe('missed lethal as per-turn items (E01)', () => {
  const rec = finished(played());
  const run = reviewRecord(rec, allCards, { seats: ['p1'], nodes: 150_000 });

  it('flags the planted turn through the pipeline, with the E01 explanation of explanations.md', () => {
    const flags = run.results.flatMap((r) => r.flags);
    expect(flags).toHaveLength(1);
    const f = flags[0]!;
    expect(f).toMatchObject({
      id: 'missed-lethal:9:0',
      kind: 'missed-lethal',
      turn: 9,
      player: 'p1',
      restoreIndex: 0,
      decisionIndex: 0,
      severity: 'severe',
      certainty: 'any-hand',
      practice: { judge: 'win-this-turn', turn: 9 },
    });
    expect(certaintyLabel(f.certainty, 'review')).toBe('Holds whatever they held');
    const doc = docExample('E01');
    for (const k of [
      'conceptId',
      'claim',
      'line',
      'outcome',
      'certainty',
      'nextTime',
      'lessonId',
      'sources',
    ] as const)
      expect(f.explanation[k], k).toEqual(doc[k]);
    expect(f.explanation.evidence[0]).toEqual(doc.evidence[0]);
    const fig = Object.assign({}, ...f.explanation.evidence.map((x) => x.figures ?? {})) as Record<
      string,
      number
    >;
    expect(fig).toMatchObject({
      opponentLife: 1,
      hitsNeeded: 2,
      handSize: 2,
      maxPerCard: 2000,
      leaderPower: 9000,
      stopLeader: 5000,
      kaidoPower: 12000,
      stopKaido: 8000,
      maxAtFirst: 4000,
      maxAtSecond: 6000,
      triggersInPrior: 0,
    });
  });

  it('"What you did" is read from the record: the DON!! gives, the two attacks, the end of the turn', () => {
    const f = run.results.flatMap((r) => r.flags)[0]!;
    expect(f.did.map((m) => m.kind)).toEqual(['giveDon', 'attack', 'giveDon', 'attack', 'endTurn']);
    expect(f.did[0]).toMatchObject({ text: 'Gave 2 DON!! in all.', count: 2 });
    expect(f.did[1]!.text).toBe('Attacked their Leader with Kaido.');
  });

  it('the proof it carries replays with reduce and wins against the real hand', () => {
    const f = run.results.flatMap((r) => r.flags)[0]!;
    let s = replay(rec, lookup, f.restoreIndex).state;
    const queue = [...f.lethal!.public.viewActions!];
    for (let i = 0; i < 200 && !queries.result(s); i++) {
      const dec = queries.decision(s)!;
      s =
        dec.player === 'p1'
          ? reduce(s, actionFromView(s, 'p1', queue.shift()!)).state
          : reduce(s, defence(s)).state;
    }
    expect(queries.result(s)).toMatchObject({ winner: 'p1' });
    expect(queue).toHaveLength(0);
  });

  it('is exactly what reviewMissedLethal found: same flags, same explanation text, same markers', () => {
    const old = reviewMissedLethal(rec, lookup, cards, { seats: ['p1'], cap: { nodes: 150_000 } });
    const flags = run.results.flatMap((r) => r.flags);
    expect(flags.map((f) => [f.turn, f.decisionIndex, f.severity, f.explanation])).toEqual(
      old
        .filter((o) => o.kind === 'missed-lethal')
        .map((o) => [o.turn, o.actionIndex, o.severity, o.explanation]),
    );
    expect(run.markers).toEqual([]);
  });

  it('a search that cannot finish is a marker with its explanation, never a flag or a clean turn', () => {
    const r = reviewRecord(rec, allCards, { seats: ['p1'], nodes: 3 });
    expect(r.results.flatMap((x) => x.flags)).toEqual([]);
    expect(r.markers).toHaveLength(1);
    expect(r.markers[0]).toMatchObject({
      turn: 9,
      kind: 'missed-lethal',
      reason: 'search-incomplete',
    });
    expect(r.markers[0]!.explanation!.certainty).toBe('search-incomplete');
  });

  it('"Analyse deeper" on a marked turn re-runs it with a bigger cap and finds the flag', async () => {
    const out: ReviewResponse[] = [];
    const job = new ReviewJob((m) => out.push(m), { yieldFn: async () => {} });
    await job.start({ type: 'start', record: rec, cards: allCards, nodes: 3 });
    const marked = out
      .flatMap((m) => (m.type === 'items' ? m.results : []))
      .filter((r) => r.marker);
    expect(marked.map((r) => r.itemId)).toEqual(['missed-lethal:9:0']);
    out.length = 0;
    job.handle({ type: 'deeper', itemIds: ['missed-lethal:9:0'], factor: 50_000 });
    await new Promise((r) => setTimeout(r, 200));
    const again = out.flatMap((m) => (m.type === 'items' ? m.results : []));
    expect(again).toHaveLength(1);
    expect(again[0]!.flags.map((f) => f.id)).toEqual(['missed-lethal:9:0']);
    expect(again[0]!.marker).toBeUndefined();
    expect(out.at(-1)).toEqual({ type: 'done', markers: [] });
  });

  it('a turn the player won is not an item', () => {
    // Kaido first with all 4 DON!! is the winning order (E01's check): the planner drops the turn.
    const init = createFromScenario({ ...E01, cards: lookup });
    let rec2 = startRecord({ scenario: E01 }, init.state);
    let s = init.state;
    const theirs = queries.zone(s, 'p2', 'leader')[0]!.instance;
    const lead = queries.zone(s, 'p1', 'leader')[0]!;
    const give = legalActions(s).find((a) => a.type === 'giveDon' && a.target === lead.instance)!;
    const queue: Action[] = [
      give,
      give,
      give,
      give,
      { type: 'attack', attacker: lead.instance, target: theirs, player: 'p1' },
      {
        type: 'attack',
        attacker: queries.zone(s, 'p1', 'characters')[0]!.instance,
        target: theirs,
        player: 'p1',
      },
    ];
    for (let i = 0; i < 100 && !queries.result(s); i++) {
      const dec = queries.decision(s)!;
      const a = dec.player === 'p1' && dec.kind === 'main' ? queue.shift()! : defence(s);
      s = reduce(s, a).state;
      rec2 = appendAction(rec2, a, s);
    }
    expect(queries.result(s)).toMatchObject({ winner: 'p1' });
    const won: ReviewRecord = { ...rec2, seats: { p1: 'human', p2: 'ai' }, auto: [], rewinds: [] };
    expect(planReview(won, lookup, cards).items.filter((x) => x.kind === 'missed-lethal')).toEqual(
      [],
    );
  });
});

describe('missed lethal on real games: the pipeline agrees with the sequential review', () => {
  for (const name of ['lost', 'won'] as const) {
    it(`${name} game: same flags and markers at a node cap`, () => {
      const g = G[name];
      const cap = { nodes: 3000 };
      const old = reviewMissedLethal(g.record, lookup, cards, { seats: ['p1'], cap });
      const r = reviewRecord(g.record, g.cards, { seats: ['p1'], nodes: 3000 });
      expect(
        r.results
          .flatMap((x) => x.flags)
          .filter((f) => f.kind === 'missed-lethal')
          .map((f) => [f.turn, f.decisionIndex, f.severity]),
      ).toEqual(
        old
          .filter((o) => o.kind === 'missed-lethal')
          .map((o) => [o.turn, o.actionIndex, o.severity]),
      );
      expect(r.markers.filter((m) => m.kind === 'missed-lethal').map((m) => m.turn)).toEqual(
        old.filter((o) => o.kind === 'not-fully-checked').map((o) => o.turn),
      );
    });
  }
});

// ---------------------------------------------------------------------------------------------
// The differential: an any-hand flag does not depend on their hidden cards
// ---------------------------------------------------------------------------------------------

describe('differential: a public proof is the same whatever their hidden cards are', () => {
  const OTHER_LIFE = 'OP17-118';
  const variants: [string, Spec][] = [
    ['E01', E01],
    ['hand order swapped', { ...E01, p2: { ...E01.p2, hand: [NO_AUTHORITY, ROCKS_PIRATES] } }],
    ['hand of two other cards', { ...E01, p2: { ...E01.p2, hand: [ZORO, ZORO] } }],
    [
      'hand of two cards outside the lists',
      { ...E01, p2: { ...E01.p2, hand: ['OP17-077', 'OP17-077'] } },
    ],
    ['another face-down Life card', { ...E01, p2: { ...E01.p2, life: lifeOf(1, OTHER_LIFE) } }],
    [
      'their deck in another order',
      { ...E01, p2: { ...E01.p2, decklist: listOf(ROCKS).slice().reverse() } },
    ],
  ];
  const run = (spec: Spec, mode?: 'leaky') => {
    const s = createFromScenario({ ...spec, cards: lookup }).state;
    void mode;
    return checkLethalItem({ turn: 9, player: 'p1', index: 0 }, [], s, cards, { nodes: 150_000 });
  };

  it('severe, any-hand, and the explanation and line do not change', () => {
    const base = run(E01)!;
    expect(base.severity).toBe('severe');
    for (const [name, spec] of variants) {
      const f = run(spec);
      expect(f, name).not.toBeNull();
      expect(f!.severity, name).toBe('severe');
      expect(f!.explanation, name).toEqual(base.explanation);
      expect(f!.public.viewActions, name).toEqual(base.public.viewActions);
    }
  });
});

describe('the clock', () => {
  it('a review with a deadline that has passed runs nothing and marks every turn "deadline"', () => {
    const r = reviewRecord(G.lost.record, allCards, { deadlineMs: 0, now: () => 1 });
    expect(r.results).toEqual([]);
    expect(r.markers.length).toBeGreaterThan(0);
    expect(r.markers.every((m) => m.reason === 'deadline')).toBe(true);
    void other;
  });
});
