/**
 * The missed-lethal flag, end to end (PLAN row 13, L done criterion: "Planted missed-lethal is
 * flagged with certainty any-hand and a correct line"), the worker request, and the `public` mode's
 * leak properties.
 *
 * Positions are planted and worked by hand; see lethal.test.ts for the rules arithmetic used.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  appendAction,
  actionFromView,
  createFromScenario,
  legalActions,
  projectForSearch,
  queries,
  reduce,
  replay,
  startRecord,
  type Action,
  type GameState,
  type RecordWithSnapshots,
  type ScenarioSpec,
} from '@optcg/engine';
import {
  certaintyLabel,
  explainLethal,
  insertByPriority,
  lethal,
  answerLethal,
  reviewMissedLethal,
  type Explanation,
  type LethalFlag,
} from '../src/index.ts';
import { cardMap, lookup } from './support.ts';
import { docExample } from './support/doc.ts';
import { lifeOf, listOf } from './support/scenario.ts';

vi.setConfig({ testTimeout: 120_000 });

const cards = cardMap();
const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';
const LUFFY = 'OP13-001';
const SANJI = 'OP13-027'; // 7000 vanilla
const ZORO = 'EB04-007'; // 9000, no Counter
const KAIDO_CHAR = 'OP17-062'; // 12000
const ROCKS_PIRATES = 'OP17-056'; // [Counter] Event, +2000, cost 0 (explanations.md E01)
const NO_AUTHORITY = 'OP17-055'; // [Counter] Event, +2000, cost 0 (E01)

type Spec = Omit<ScenarioSpec, 'cards'>;

/** The strongest sensible defence for replays: counter (Counter cards and the two +2000 Events) if it stops the attack. */
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

/** A game record: player 1 plays `plan` (engine actions), player 2 defends with `defence`. */
function recordOf(spec: Spec, plan: (s: GameState) => Action[]): RecordWithSnapshots {
  const init = createFromScenario({ ...spec, cards: lookup });
  let rec = startRecord({ scenario: spec }, init.state);
  let s = init.state;
  const queue = plan(s);
  for (let i = 0; i < 300 && !queries.result(s); i++) {
    const dec = queries.decision(s);
    if (!dec) break;
    let a: Action;
    if (dec.player === 'p1' && dec.kind === 'main') {
      const next = queue.shift();
      if (!next) break;
      a = next;
    } else a = defence(s);
    s = reduce(s, a).state;
    rec = appendAction(rec, a, s);
  }
  return rec;
}

/** Give `don` DON!! to a card then attack their Leader with it, for each `[card, don]`. */
function attacksOf(s: GameState, plan: [string, number][]): Action[] {
  const legal = legalActions(s);
  const theirLeader = queries.zone(s, 'p2', 'leader')[0]!.instance;
  const mine = [...queries.zone(s, 'p1', 'leader'), ...queries.zone(s, 'p1', 'characters')];
  const out: Action[] = [];
  for (const [card, don] of plan) {
    const c = mine.find((x) => x.card === card)!;
    const give = legal.find((a) => a.type === 'giveDon' && a.target === c.instance)!;
    for (let i = 0; i < don; i++) out.push(give);
    out.push({ type: 'attack', attacker: c.instance, target: theirLeader, player: 'p1' });
  }
  return out;
}
const endTurn: Action = { type: 'endTurn', player: 'p1' };

/**
 * Explanations E01: game turn 9, your Main Phase. Kaido (OP17-058) Leader 5000, 3 Life; Kaido
 * (OP17-062) 12000, active, played earlier; 4 active DON!!, none given. Rocks Leader 5000, 1 Life, 2
 * cards in hand: here the two real Events (Rocks Pirates and There's No Authority, +2000 each).
 * No Characters; no Triggers in Rocks's lists.
 *
 * Hand-worked: 1 Life → 2 hits needed. With 2 cards they can add at most +4000. The Leader with all
 * 4 DON!! is 9000 against 5000 + 4000 = 9000: a tie, a hit (CR 7-1-4-1). Life 1 → 0, hand 3 (+6000).
 * Kaido 12000 against 5000 + 6000 = 11000: a hit at 0 Life: wins. In the other order the Leader
 * would face 3 cards (+6000) with 9000: stopped. No other split of 4 DON!! beats both.
 */
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

const flagsOf = (rec: RecordWithSnapshots, o: Parameters<typeof reviewMissedLethal>[3] = {}) =>
  reviewMissedLethal(rec, lookup, cards, { seats: ['p1'], ...o });

describe('missed lethal (E01): the planted game record', () => {
  // What the player did: 2 DON!! each on Kaido and the Leader, Kaido first (the narrative of E01).
  const played = recordOf(E01, (s) => [
    ...attacksOf(s, [
      [KAIDO_CHAR, 2],
      [KAIDO, 2],
    ]),
    endTurn,
  ]);

  it('is flagged with certainty any-hand, and the line is the one in explanations.md', () => {
    // The player's own turn: they attacked Kaido first (14000), then the Leader at 7000, which two
    // Events (9000) stopped; the game is still on.
    const end = replay(played, lookup).state;
    expect(queries.result(end)).toBeNull();
    expect(queries.zone(end, 'p2', 'life')).toHaveLength(0);

    const flags = flagsOf(played);
    expect(flags).toHaveLength(1);
    const f = flags[0]!;
    expect(f).toMatchObject({
      kind: 'missed-lethal',
      turn: 9,
      player: 'p1',
      severity: 'severe',
      actionIndex: 0,
    });
    expect(f.public.status).toBe('proven');
    expect(f.explanation.certainty).toBe('any-hand');
    expect(certaintyLabel(f.explanation.certainty, 'review')).toBe('Holds whatever they held');

    const doc = docExample('E01');
    const e = f.explanation;
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
      expect(e[k], k).toEqual(doc[k]);
    // The first evidence line, and every figure recomputed from the position (Life 1, two cards).
    expect(e.evidence[0]).toEqual(doc.evidence[0]);
    const fig = Object.assign({}, ...e.evidence.map((x) => x.figures ?? {})) as Record<
      string,
      number
    >;
    expect(fig).toMatchObject({
      opponentLife: 1,
      hitsNeeded: 2,
      handSize: 2,
      maxPerCard: 2000,
      leaderPower: 9000,
      stopLeader: 9000 - 5000 + 1000,
      maxAtFirst: 4000,
      kaidoPower: 12000,
      stopKaido: 12000 - 5000 + 1000,
      maxAtSecond: 6000,
      triggersInPrior: 0,
    });
  });

  it('the line wins when played: from the turn start, against the real hand of two +2000 Events', () => {
    const f = flagsOf(played)[0]!;
    const start = replay(played, lookup, f.actionIndex).state;
    let s = start;
    const queue = [...f.public.viewActions!];
    for (let i = 0; i < 200 && !queries.result(s); i++) {
      const dec = queries.decision(s)!;
      if (dec.player === 'p1') s = reduce(s, actionFromView(s, 'p1', queue.shift()!)).state;
      else s = reduce(s, defence(s)).state;
    }
    expect(queries.result(s)).toMatchObject({ winner: 'p1' });
    // The player's own order really was beaten: the Events stopped the Leader's 7000.
    expect(queue).toHaveLength(0);
  });

  it('a turn the player won is not flagged', () => {
    const f = flagsOf(played)[0]!;
    const start = replay(played, lookup, f.actionIndex).state;
    const winning = recordOf(E01, (s) => {
      void start;
      return attacksOf(s, [
        [KAIDO, 4],
        [KAIDO_CHAR, 0],
      ]);
    });
    expect(queries.result(replay(winning, lookup).state)).toMatchObject({ winner: 'p1' });
    expect(flagsOf(winning)).toEqual([]);
  });

  it('a turn that could not be lethal is skipped: one attacker against 3 Life', () => {
    const spec: Spec = { ...E01, p2: { ...E01.p2, life: lifeOf(3, ZORO) } };
    const rec = recordOf(spec, () => [endTurn]);
    expect(flagsOf(rec)).toEqual([]);
  });

  it('the cap: a search that cannot finish is a "not fully checked" marker, never a flag', () => {
    const flags = flagsOf(played, { cap: { nodes: 3 } });
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ kind: 'not-fully-checked', severity: 'marker' });
    expect(flags[0]!.explanation.certainty).toBe('search-incomplete');
    expect(certaintyLabel('search-incomplete', 'review')).toBe('Not fully checked');
  });
});

describe('lethal that needed hidden information (E02)', () => {
  /**
   * Luffy (5000) and Sanji (7000), 3 DON!!; Rocks at 1 Life with 2 cards, in fact two cards with no
   * Counter, and a Life card with none either. From the view: each hidden card could be +2000, so
   * (2 cards, +4000) Sanji with 3 DON!! (10000 against 9000) lands and the Leader (5000 against
   * 5000 + 6000) does not: no lethal. Against the real hand nothing can be added: the Leader's 5000
   * ties and hits (Life 1 → 0), then Sanji's 7000 against 5000 hits at 0 Life. The player ended the
   * turn without attacking: a hindsight flag, never severe.
   */
  const spec: Spec = {
    seed: 7,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: LUFFY,
      characters: [SANJI],
      life: lifeOf(4, ZORO),
      hand: [],
      costArea: { active: 3, rested: 0 },
      decklist: listOf(ROCKS),
    },
    p2: {
      leader: ROCKS,
      life: lifeOf(1, ZORO),
      hand: [ZORO, 'OP14-104'],
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
  };
  const rec = recordOf(spec, () => [endTurn]);

  it('is a hindsight flag with certainty needed-hidden-info, and the line works against the real hand', () => {
    const flags = flagsOf(rec);
    expect(flags).toHaveLength(1);
    const f = flags[0]! as LethalFlag;
    expect(f.severity).toBe('hindsight');
    expect(f.public.status).toBe('refuted');
    expect(f.actual?.status).toBe('proven');
    const e: Explanation = f.explanation;
    const doc = docExample('E02');
    for (const k of ['conceptId', 'claim', 'outcome', 'certainty', 'nextTime', 'lessonId'] as const)
      expect(e[k], k).toEqual(doc[k]);
    expect(certaintyLabel(e.certainty, 'review')).toBe('Hindsight: needed their hidden cards');
    // The real hand: 2 cards, no Counter in them.
    const fig = Object.assign({}, ...e.evidence.map((x) => x.figures ?? {})) as Record<
      string,
      number
    >;
    expect(fig).toMatchObject({ handSize: 2, actualCounterInHand: 0 });
    // Replayed from the turn's start with engine actions against that hand: wins.
    let s = replay(rec, lookup, f.actionIndex).state;
    const queue = [...f.actual!.actions!];
    for (let i = 0; i < 200 && !queries.result(s); i++) {
      const dec = queries.decision(s)!;
      s = reduce(s, dec.player === 'p1' ? queue.shift()! : defence(s)).state;
    }
    expect(queries.result(s)).toMatchObject({ winner: 'p1' });
  });
});

describe('public mode reads only the requesting seat’s view', () => {
  /**
   * Two positions that differ only in what the attacker cannot see: the defender's hand, Life and
   * deck, and the attacker's own Life and deck. The answer must be identical, word for word, and no
   * hidden card may be named anywhere in it.
   */
  const base = (hand: string[], life: string[], decks: [string, string]): Spec => ({
    seed: 3,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: KAIDO,
      characters: ['OP17-060', KAIDO_CHAR],
      life: life.slice(0, 3),
      hand: [],
      costArea: { active: 10, rested: 0 },
      deck: listOf(decks[0]).slice(0, 30),
    },
    p2: {
      leader: ROCKS,
      characters: [{ card: 'OP17-040', rested: true }],
      life: life.slice(3, 5),
      hand,
      costArea: { active: 0, rested: 0 },
      deck: listOf(decks[1]).slice(0, 30),
    },
  });
  const A = base([ROCKS_PIRATES], [ZORO, ZORO, ZORO, ZORO, ZORO], [KAIDO, ROCKS]);
  const B = base(
    ['OP17-118'],
    ['OP14-104', SANJI, 'OP12-114', 'OP08-099', 'EB04-002'],
    [ROCKS, KAIDO],
  );

  it('gives the same answer, with no hidden card named', () => {
    const sa = createFromScenario({ ...A, cards: lookup }).state;
    const sb = createFromScenario({ ...B, cards: lookup }).state;
    const ra = lethal({ mode: 'public', view: projectForSearch(sa, 'p1') }, cards, {
      nodes: 300_000,
    });
    const rb = lethal({ mode: 'public', view: projectForSearch(sb, 'p1') }, cards, {
      nodes: 300_000,
    });
    expect(ra.status).toBe('proven');
    // A view handle is an opaque name for a visible card; two views may name the same card
    // differently, so handles are compared by order of first appearance.
    const norm = (r: unknown): string => {
      const seen = new Map<string, string>();
      return JSON.stringify(r).replace(/h[0-9a-f]{12}/g, (h) => {
        if (!seen.has(h)) seen.set(h, `H${seen.size}`);
        return seen.get(h)!;
      });
    };
    expect(norm(ra)).toBe(norm(rb));
    const text = JSON.stringify(ra) + JSON.stringify(explainLethal(ra, cards, 'coach'));
    for (const id of [ROCKS_PIRATES, 'OP17-118', 'OP14-104', 'OP12-114', 'OP08-099', 'EB04-002'])
      expect(text, id).not.toContain(id);
  });

  it('actual mode, by contrast, reads the real hand', () => {
    const sa = createFromScenario({ ...A, cards: lookup }).state;
    expect(
      lethal({ mode: 'actual', state: sa }, cards, { nodes: 300_000 }).facts.actualCounter,
    ).toBe(2000); // the one Event in their hand: Rocks Pirates, +2000
  });
});

describe('the worker request', () => {
  it('answers a lethal request from its view, with the cap it was given', () => {
    const s = createFromScenario({ ...E01, cards: lookup }).state;
    const view = projectForSearch(s, 'p1');
    const res = answerLethal(
      { type: 'lethal', id: 9, mode: 'public', view, nodes: 100_000 },
      cards,
    );
    expect(res.id).toBe(9);
    expect(res.type).toBe('lethal');
    expect(res.result.status).toBe('proven');
    expect(res.result).toEqual(lethal({ mode: 'public', view }, cards, { nodes: 100_000 }));
    const tiny = answerLethal({ type: 'lethal', id: 10, mode: 'public', view, nodes: 2 }, cards);
    expect(tiny.result.status).toBe('unknown');
  });

  it('queues by priority: the turn’s own search (1), a press (2), review (3), the background detector (4)', () => {
    const q: { id: number; p: number }[] = [];
    const prio = (x: { p: number }) => x.p;
    for (const [id, p] of [
      [1, 4],
      [2, 4],
      [3, 2],
      [4, 1],
      [5, 3],
      [6, 2],
      [7, 4],
    ] as const)
      insertByPriority(q, { id, p }, prio);
    // Lower first; within a priority, first come first served.
    expect(q.map((x) => x.id)).toEqual([4, 3, 6, 5, 1, 2, 7]);
  });

  it('runs through the worker: a pressed request overtakes the background one, and cancel drops a queued one', async () => {
    const posted: { type: string; id?: number }[] = [];
    const g = globalThis as unknown as { self?: unknown };
    const old = g.self;
    g.self = { postMessage: (m: { type: string; id?: number }) => posted.push(m) };
    vi.resetModules();
    await import('../src/worker.ts');
    const self_ = g.self as { onmessage: (e: { data: unknown }) => void };
    const s = createFromScenario({ ...E01, cards: lookup }).state;
    const view = projectForSearch(s, 'p1');
    const send = (data: unknown) => self_.onmessage({ data });
    send({ type: 'init', cards: [...cards.values()] });
    send({ type: 'lethal', id: 1, mode: 'public', view, nodes: 100_000, priority: 4 });
    send({ type: 'lethal', id: 2, mode: 'public', view, nodes: 100_000, priority: 2 });
    send({ type: 'lethal', id: 3, mode: 'public', view, nodes: 100_000, priority: 4 });
    send({ type: 'cancel', id: 3 });
    await new Promise((r) => setTimeout(r, 1500));
    expect(posted.filter((m) => m.type === 'lethal').map((m) => m.id)).toEqual([2, 1]);
    g.self = old;
  });
});
