/**
 * The lethal bank, its judge and the flag-to-puzzle path (M9 WP2).
 *
 * Every committed item is re-checked by the solver (a changed engine rule, script or card breaks the
 * item that depends on it), against the same pinned meta lists the bank was generated with
 * (vitest.config.ts `PINNED_META`, scripts/drill-bank.ts). The any-hand rule is tested twice over:
 * a permutation of everything hidden on the opponent's side leaves an item, its header and its answer
 * text byte-identical, and a deliberately leaky version of the header is shown to fail that test.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  appendAction,
  checkInvariants,
  createFromScenario,
  ENGINE_VERSION,
  legalActions,
  queries,
  reduce,
  startRecord,
  type Action,
  type GameState,
} from '@optcg/engine';
import {
  bankFor,
  MIN_BANK,
  type LethalItem,
  type ScenarioJson,
} from '../src/search/drills/index.ts';
import { harderHand, INERT_LIFE } from '../src/search/drills/hand.ts';
import { puzzleFromFlag } from '../src/search/drills/from-flag.ts';
import {
  classify,
  classifyActual,
  judgeLethal,
  lethalHeader,
  LETHAL_NODES,
} from '../src/search/drills/lethal.ts';
import {
  bankJson,
  generateLethalBank,
  lethalItemOf,
  pairOf,
  shapeOf,
} from '../src/search/drills/lethal-gen.ts';
import type { ReviewFlag, ReviewRecord } from '../src/search/review/types.ts';
import { minimal } from '../src/explanation.ts';
import { cardMap } from './support.ts';

vi.setConfig({ testTimeout: 300_000 });

const cards = cardMap();
const lookup = (id: string) => cards.get(id);
const bank = bankFor('lethal');
const items = bank.items as LethalItem[];
const LEADERS = [
  'OP17-039',
  'OP09-062',
  'ST30-001',
  'OP13-004',
  'OP17-058',
  'OP13-001',
  'OP15-058',
  'OP17-079',
  'OP14-041',
  'OP12-061',
  'OP05-098',
  'OP08-098',
  'EB02-010',
  'OP18-021',
];

const start = (sc: ScenarioJson): GameState => createFromScenario({ ...sc, cards: lookup }).state;

/** The solver's classification matches what the item stores. */
function recheck(item: LethalItem): boolean {
  const { result } = classify(item.scenario, cards);
  if (item.answer.lethal) return result.status === 'proven' && result.certainty === 'any-hand';
  return (
    result.status === 'refuted' &&
    result.certainty === 'any-hand' &&
    result.defence?.reason === item.answer.reason
  );
}

describe('the committed lethal bank', () => {
  it('has the size and spread the done criteria ask for', () => {
    expect(bank.drill).toBe('lethal');
    expect(items.length).toBeGreaterThanOrEqual(MIN_BANK);
    expect(items.filter((i) => i.answer.lethal).length).toBeGreaterThanOrEqual(12);
    expect(items.filter((i) => !i.answer.lethal).length).toBeGreaterThanOrEqual(12);
    expect(new Set(items.map((i) => i.theirs)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    expect(bank.builtWith.engine).toMatch(/^\d+\.\d+\.\d+$/);
    expect(bank.builtWith.scripts).toMatch(/^scripts-/);
    for (const i of items) {
      expect(i.source.kind).toBe('bank');
      expect(i).toMatchObject({
        certainty: 'any-hand',
        label: 'any-hand',
        hand: 'harder',
        lesson: 'L15-lethal-math',
        mine: expect.any(String),
      });
      expect(i.prefix).toEqual([]);
      // Card ids and numbers only: nothing in an item can be art.
      expect(JSON.stringify(i)).not.toMatch(/https?:|\.png|\.jpg|\.webp/);
    }
  });

  it('every item is a legal position (invariants) with its opponent holding a hand from its lists', () => {
    for (const i of items) {
      expect(checkInvariants(start(i.scenario))).toEqual([]);
      const sc = i.scenario;
      expect(sc.p2.hand).toEqual(harderHand(i.theirs!, sc.p2.hand!.length, cards));
      expect(sc.p2.life!.length).toBeGreaterThan(0);
    }
  });

  it('(a) the solver agrees with every stored answer, in public mode, with the node cap', () => {
    for (const i of items) expect(recheck(i), `${i.id} ${i.mine}/${i.theirs}`).toBe(true);
  });

  it('(a, revert check) flipping one stored answer makes the check fail', () => {
    const lethal = items.find((i) => i.answer.lethal)!;
    const none = items.find((i) => !i.answer.lethal)!;
    expect(recheck({ ...lethal, answer: { lethal: false, reason: 'attackers' } })).toBe(false);
    expect(recheck({ ...none, answer: { lethal: true, actions: [], line: [] } })).toBe(false);
  });

  it('(b) a lethal item’s stored line wins the turn, and the full state proves it against the harder hand', () => {
    for (const i of items.filter((x) => x.answer.lethal)) {
      const answer = i.answer as Extract<LethalItem['answer'], { lethal: true }>;
      let s = start(i.scenario);
      const turn = queries.turn(s).number;
      const queue: Action[] = [...answer.actions];
      for (let guard = 0; guard < 200 && !queries.result(s); guard++) {
        const dec = queries.decision(s)!;
        const legal = legalActions(s);
        if (dec.player === 'p1') {
          const next = queue.shift();
          expect(next, `${i.id}: ran out of moves`).toBeDefined();
          const ok = legal.find(
            (a) =>
              JSON.stringify({ ...a, intentId: 0 }) === JSON.stringify({ ...next, intentId: 0 }),
          );
          expect(ok, `${i.id}: ${JSON.stringify(next)} is not legal`).toBeDefined();
          s = reduce(s, ok!).state;
        } else {
          // They answer with nothing: the plan has to win without their help (a plan that needs
          // them to Counter is not one). The strongest answer is `actual` below.
          const a =
            legal.find((x) => x.type === 'block' && x.blocker === null) ??
            legal.find((x) => x.type === 'endCounter') ??
            legal.find((x) => x.type === 'trigger' && !x.activate) ??
            legal.find((x) => x.type === 'optional' && !x.accept) ??
            legal.find((x) => x.type === 'done') ??
            legal.find((x) => x.type === 'pick');
          expect(
            a,
            `${i.id}: no passive answer to ${dec.kind}: ${JSON.stringify(legal)}`,
          ).toBeDefined();
          s = reduce(s, a!).state;
        }
      }
      expect(queries.result(s), i.id).toMatchObject({ winner: 'p1' });
      expect(queries.turn(s).number).toBe(turn);
      // Dominance: the public proof holds against the strongest hand the prior allows.
      expect(classifyActual(start(i.scenario), cards).status, i.id).toBe('proven');
    }
  });

  it('(b) a "none" item is not provable against the full state either', () => {
    for (const i of items.filter((x) => !x.answer.lethal))
      expect(classifyActual(start(i.scenario), cards).status, i.id).toBe('refuted');
  });

  it('(c) the dominance check has teeth: a stronger hand than the prior allows beats some items', () => {
    let beaten = 0;
    for (const i of items.filter((x) => x.answer.lethal)) {
      const sc = i.scenario;
      // Four more cards of the strongest defence in their lists: not a hand the public model allows.
      const stronger = harderHand(i.theirs!, sc.p2.hand!.length + 4, cards);
      const s = start({ ...sc, p2: { ...sc.p2, hand: stronger } });
      if (classifyActual(s, cards).status !== 'proven') beaten++;
    }
    expect(beaten).toBeGreaterThan(0);
  });
});

/** The opponent's hidden cards, moved around: same counts in every zone, different cards in each. */
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

const pickItems = [
  ...items.filter((i) => i.answer.lethal).slice(0, 3),
  ...items.filter((i) => !i.answer.lethal).slice(0, 3),
];

describe('the judge and its header read only public facts', () => {
  it('"No lethal" on a lethal item shows the line in the E01 wording; on a none item it is right', () => {
    const lethalItem = items.find((i) => i.answer.lethal)!;
    const wrong = judgeLethal(lethalItem, { kind: 'no-lethal' }, cards);
    expect(wrong.correct).toBe(false);
    expect(wrong.explanation.claim).toMatch(
      /^You have lethal: \d+ hits?, and they can't stop any of them\.$/,
    );
    expect(wrong.explanation.certainty).toBe('any-hand');
    expect(wrong.explanation.lessonId).toBe('L15-lethal-math');
    expect(wrong.explanation.line!.length).toBeGreaterThan(0);
    expect(wrong.explanation.line!.map((m) => m.text)).toEqual(
      (lethalItem.answer as { line: string[] }).line,
    );
    expect(wrong.explanation.outcome).toBe('Wins the game this turn.');
    expect(wrong.header).toMatch(/hits? to win/);

    const played = judgeLethal(lethalItem, { kind: 'played', won: true }, cards);
    expect(played.correct).toBe(true);
    expect(judgeLethal(lethalItem, { kind: 'played', won: false }, cards).correct).toBe(false);

    const noneItem = items.find((i) => !i.answer.lethal)!;
    const right = judgeLethal(noneItem, { kind: 'no-lethal' }, cards);
    expect(right.correct).toBe(true);
    expect(right.headline).toBe('Nothing wins here.');
    expect(right.explanation.claim).toMatch(
      /^No lethal: you need \d+ hits? and have \d+ attackers?\.$/,
    );
    expect(judgeLethal(noneItem, { kind: 'played', won: false }, cards).correct).toBe(false);
  });

  it('(d) permuting their hand, deck and face-down Life leaves the answer and header unchanged', () => {
    for (const i of pickItems) {
      const base = JSON.stringify([
        judgeLethal(i, { kind: 'no-lethal' }, cards),
        lethalHeader(classify(i.scenario, cards).result),
      ]);
      for (const by of [1, 3, 7]) {
        const other: LethalItem = { ...i, scenario: permuted(i.scenario, by) };
        expect(other.scenario.p2).not.toEqual(i.scenario.p2);
        const got = JSON.stringify([
          judgeLethal(other, { kind: 'no-lethal' }, cards),
          lethalHeader(classify(other.scenario, cards).result),
        ]);
        expect(got, `${i.id} by ${by}`).toBe(base);
      }
    }
  });

  it('(d, leak check) a header that read their real hand would fail that test', () => {
    // The leaky version: "up to +X in their hand" taken from the actual hand's Counter total.
    const leaky = (sc: ScenarioJson) => {
      const r = classifyActual(start(sc), cards);
      return `${r.facts.actualCounter}`;
    };
    // The comparison is between a hand of the strongest cards and one of the weakest.
    const i = items.find((x) => x.answer.lethal)!;
    const weak: ScenarioJson = {
      ...i.scenario,
      p2: { ...i.scenario.p2, hand: i.scenario.p2.hand!.map(() => INERT_LIFE) },
    };
    expect(leaky(weak)).not.toBe(leaky(i.scenario));
    // The shipped header is the same for both.
    expect(lethalHeader(classify(weak, cards).result)).toBe(
      lethalHeader(classify(i.scenario, cards).result),
    );
  });
});

describe('puzzleFromFlag', () => {
  const base = items.find((i) => i.answer.lethal && i.first)!;

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
  const flag = (over: Partial<ReviewFlag> = {}): ReviewFlag => ({
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
    ...over,
  });

  it('(d) an any-hand flag gives the same item whatever their hidden cards are', () => {
    const a = puzzleFromFlag(recordOf(base.scenario), flag(), cards, { gameId: 'g1' });
    expect('item' in a).toBe(false);
    const item = a as import('../src/search/drills/index.ts').BoardItem;
    expect(item).toMatchObject({
      hand: 'harder',
      label: 'any-hand',
      certainty: 'any-hand',
      seat: 'p1',
      drill: 'lethal',
    });
    for (const by of [1, 4, 9]) {
      const b = puzzleFromFlag(recordOf(permuted(base.scenario, by)), flag(), cards, {
        gameId: 'g1',
      });
      expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    }
    // What is in the item: their hand is harderHand, their Life and deck are filler.
    const sc = item.scenario;
    expect(sc.p2.hand).toEqual(harderHand(base.theirs!, base.scenario.p2.hand!.length, cards));
    expect((sc.p2.life ?? []).every((c) => c === INERT_LIFE)).toBe(true);
    expect((sc.p2.deck ?? []).every((c) => c === INERT_LIFE)).toBe(true);
    // And it solves: the public check of the rebuilt position is the same kind of answer.
    expect(checkInvariants(start(sc))).toEqual([]);
  });

  it('(d, hindsight) a Hindsight flag keeps their real hand, so the label is required', () => {
    const hs = flag({ severity: 'hindsight', certainty: 'needed-hidden-info' });
    const a = puzzleFromFlag(
      recordOf(base.scenario),
      hs,
      cards,
    ) as import('../src/search/drills/index.ts').BoardItem;
    const b = puzzleFromFlag(
      recordOf(permuted(base.scenario, 3)),
      hs,
      cards,
    ) as import('../src/search/drills/index.ts').BoardItem;
    expect(a).toMatchObject({ hand: 'real', label: 'hindsight' });
    expect(a.scenario.p2.hand).toEqual(base.scenario.p2.hand);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('(f) a cut the engine cannot describe falls back to the record prefix and never throws', () => {
    // Their Leader attacks mine: the cut is p2's counter step. It is described from the Main before.
    const s0 = start(base.scenario);
    const atk = legalActions(s0).find(
      (a) =>
        a.type === 'attack' &&
        queries.card(s0, a.attacker).zone === 'leader' &&
        queries.card(s0, a.target).zone === 'leader',
    )!;
    const rec = recordOf(base.scenario, [atk]);
    const f = flag({ kind: 'should-counter', player: 'p2', severity: 'moderate', restoreIndex: 1 });
    const r = puzzleFromFlag(rec, f, cards, {
      gameId: 'g2',
    }) as import('../src/search/drills/index.ts').BoardItem;
    expect(r).toMatchObject({
      hand: 'real',
      label: 'hindsight',
      seat: 'p2',
      drill: 'counter',
      first: false,
    });
    expect(r.prefix).toHaveLength(1);
    // The prefix reaches the same decision the record is at.
    let s = start(r.scenario);
    for (const a of r.prefix) s = reduce(s, a).state;
    const want = queries.decision(reduce(s0, atk).state)!;
    expect(queries.decision(s)).toMatchObject({ kind: want.kind, player: want.player });

    // A record from another engine, a mulligan flag and a flag past the end: reasons, not throws.
    const old = { ...rec, versions: { ...rec.versions, engine: '0.0.1' } } as ReviewRecord;
    for (const [record, fl] of [
      [old, flag()],
      [rec, flag({ kind: 'mulligan' })],
      [rec, flag({ restoreIndex: 99 })],
    ] as const) {
      const out = puzzleFromFlag(record, fl, cards);
      expect(out).toMatchObject({ item: null, reason: expect.any(String) });
    }
  });
});

describe('the generator', () => {
  const opts = { leaders: LEADERS, perClass: 1, maxSeeds: 80 };

  it('(e) is deterministic: two runs write the same bytes', () => {
    const a = generateLethalBank(cards, opts);
    const b = generateLethalBank(cards, opts);
    expect(a.counts).toEqual({ lethal: 1, none: 1 });
    expect(bankJson(a)).toBe(bankJson(b));
  });

  it('(e) reproduces committed items from their seeds', () => {
    for (const i of [items.find((x) => x.answer.lethal)!, items.find((x) => !x.answer.lethal)!]) {
      const seed = (i.source as { seed: number }).seed;
      const { mine, theirs } = pairOf(seed, LEADERS);
      expect(mine).toBe(i.mine);
      expect(theirs).toBe(i.theirs);
      const again = lethalItemOf(seed, mine, theirs, shapeOf(seed), cards).item;
      expect(JSON.stringify(again)).toBe(JSON.stringify(i));
    }
  });

  it('never admits a position that is only provable against a weak hand', () => {
    // A bound refutation or a search refutation is `needed-hidden-info`: no "none" item uses either.
    for (const i of items.filter((x) => !x.answer.lethal))
      expect((i.answer as { reason: string }).reason).toBe('attackers');
    // And the generator's caps are node caps, never a clock.
    expect(LETHAL_NODES).toBe(40_000);
  });

  it('the engine version a bank was built with is recorded', () => {
    expect(ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(bank.builtWith.engine).toBeTruthy();
  });
});
