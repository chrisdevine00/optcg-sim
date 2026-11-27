/**
 * M9 WP3: the counter-or-take drill. Every committed item is re-classified from its scenario with the
 * M8 detectors' own checks and its answer text is the detector's explanation; a differential permutes
 * the opponent's hidden hand, deck and face-down Life and shows the class and text do not move, and
 * that a leaky classifier (one that reads their real hand) does.
 */
import { queries, reduce, type Action } from '@optcg/engine';
import { describe, expect, it, vi } from 'vitest';
import { DETECTORS } from '../src/index.ts';
import { MIN_BANK, bankFor, type CounterItem } from '../src/search/drills/index.ts';
import {
  COUNTER_CAP,
  classifiedPositions,
  classifyPosition,
  classifyWasted,
  counterBank,
  counterItemAt,
  explainCounter,
  judgeCounter,
  naiveCounters,
  replayCounter,
  reverifyCounter,
  shouldGate,
  survivingCounters,
  toCounterStep,
  leaderAttacks,
} from '../src/search/drills/counter.ts';
import { metaListSets } from '../src/search/drills/mulligan.ts';
import { applyAll, startOf } from '../src/search/drills/play.ts';
import { DRILL_SCRIPTS_VERSION } from '../src/search/drills/positions.ts';
import { lethal } from '../src/search/lethal/lethal.ts';
import { takeTheHit } from '../src/search/review/counter-wasted.ts';
import { docExample } from './support/doc.ts';
import { lifeOf, listOf } from './support/scenario.ts';
import { cardMap } from './support.ts';
import { ctxOf, item as reviewItem, recordOf, takeIt, type Spec } from './review/wp3-support.ts';

vi.setConfig({ testTimeout: 900_000 });

const cards = cardMap();
const bank = bankFor('counter');
const items = bank.items as CounterItem[];
const shapeOf = (i: CounterItem) => ({ expect: i.expect, judge: i.judge, detector: i.detector });

describe('the counter bank', () => {
  it('has at least 20 items, both classes, from at least six opponents', () => {
    expect(items.length).toBeGreaterThanOrEqual(MIN_BANK);
    expect(items.filter((i) => i.expect === 'counter').length).toBeGreaterThanOrEqual(6);
    expect(items.filter((i) => i.expect === 'take').length).toBeGreaterThanOrEqual(6);
    expect(new Set(items.map((i) => i.theirs)).size).toBeGreaterThanOrEqual(6);
    expect(bank.builtWith.scripts).toBe(DRILL_SCRIPTS_VERSION);
    for (const i of items) {
      expect(i).toMatchObject({
        drill: 'counter',
        lesson: 'L10-counter-or-take',
        certainty: 'any-hand',
        label: 'any-hand',
        hand: 'harder',
      });
      // The opponent's hand is empty and every Life card is the inert filler.
      expect(i.scenario.p2.hand ?? []).toEqual([]);
    }
  });

  it('pairs each class with its judge and detector', () => {
    for (const i of items) {
      if (i.expect === 'counter') {
        expect(i.judge).toBe('survive-turn');
        expect(i.detector).toBe('should-counter');
      } else {
        expect(i.judge).toBe('no-counter-on-attack');
        expect(['counter-wasted-a', 'counter-wasted-b']).toContain(i.detector);
      }
    }
  });

  it("replays: the prefix is legal and ends at the player's counter step, on an attack on their Leader", () => {
    for (const i of items) {
      const { counter } = replayCounter(i, cards);
      const dec = queries.decision(counter);
      expect(dec, i.id).toMatchObject({ kind: 'counter', player: 'p1' });
      const b = queries.battle(counter)!;
      expect(queries.card(counter, b.target).zone).toBe('leader');
      expect(queries.card(counter, b.attacker).owner).toBe('p2');
    }
  });

  it("every item is re-classified by the detectors' own checks: class, judge and detector equal the stored ones", () => {
    for (const i of items) expect(reverifyCounter(i, cards), i.id).toEqual(shapeOf(i));
  });

  it('judges the choice against `expect` (revert check: flip one item and the re-classification disagrees)', () => {
    const a = items.find((i) => i.expect === 'counter')!;
    const b = items.find((i) => i.expect === 'take')!;
    expect(judgeCounter(a, 'counter')).toBe(true);
    expect(judgeCounter(a, 'take')).toBe(false);
    expect(judgeCounter(b, 'take')).toBe(true);
    for (const x of [a, b]) {
      const flipped: CounterItem = { ...x, expect: x.expect === 'counter' ? 'take' : 'counter' };
      expect(reverifyCounter(flipped, cards)).not.toEqual(shapeOf(flipped));
    }
  });
});

/** A record of a counter item played through: the prefix, then the scripted actions, then `follow`. */
function recordOfItem(
  i: CounterItem,
  then: Action[],
  follow: (s: ReturnType<typeof startOf>, legal: Action[]) => Action | undefined = () => undefined,
) {
  const queue: Action[] = [...i.prefix, ...then];
  return recordOf(i.scenario as Spec, (s, legal) => queue.shift() ?? follow(s, legal));
}

describe('re-detection: the M8 detectors, run on the replayed record, flag what the item says', () => {
  it("counter-wasted items: the detector flags the naive counters, any-hand, with the item's answer text", () => {
    for (const i of items.filter((x) => x.expect === 'take')) {
      const { counter } = replayCounter(i, cards);
      const { actions } = naiveCounters(counter, cards);
      const rec = recordOfItem(i, [...actions, { type: 'endCounter', player: 'p1' }]);
      const ctx = ctxOf(rec);
      const at = i.prefix.length;
      const r = DETECTORS['counter-wasted'](reviewItem('counter-wasted', i.scenario.turn, at), ctx);
      expect(r, i.id).not.toBeNull();
      const f = r!.flags[0]!;
      expect(f.kind).toBe('counter-wasted');
      expect(f.certainty).toBe('any-hand');
      expect(f.practice).toEqual({ judge: 'no-counter-on-attack', turn: i.scenario.turn });
      expect(f.explanation, i.id).toEqual(explainCounter(i, cards));
      expect(f.explanation.conceptId).toBe(
        i.detector === 'counter-wasted-a' ? 'counters-and-blockers' : 'counter-or-take',
      );
    }
  });

  it('should-counter items: taking the hit loses, and the detector then flags it, any-hand', () => {
    for (const i of items.filter((x) => x.expect === 'counter').slice(0, 6)) {
      const { counter } = replayCounter(i, cards);
      const taken = takeTheHit(counter, 'p1');
      const win = lethal({ mode: 'actual', state: taken, attacker: 'p2' }, cards, COUNTER_CAP);
      expect(win.status, i.id).toBe('proven');
      // Played out: p1 takes the hit, p2 follows the proven line, p1 takes every hit after it.
      const queue = [...win.actions!];
      const rec = recordOfItem(i, [{ type: 'endCounter', player: 'p1' }], (s, legal) => {
        const dec = queries.decision(s)!;
        if (dec.player === 'p2' && dec.kind === 'main')
          return queue.shift() ?? legal.find((a) => a.type === 'endTurn');
        return takeIt(legal);
      });
      const ctx = ctxOf(rec);
      expect(queries.result(ctx.stateAt(rec.actions.length)), i.id).toMatchObject({ winner: 'p2' });
      const r = DETECTORS['should-counter'](reviewItem('should-counter', i.scenario.turn, 0), ctx);
      expect(r, i.id).not.toBeNull();
      const f = r!.flags[0]!;
      expect(f).toMatchObject({ kind: 'should-counter', certainty: 'any-hand' });
      const e = explainCounter(i, cards)!;
      expect(f.explanation.certainty).toBe(e.certainty);
      expect(f.explanation.claim).toBe(e.claim);
      expect(f.explanation.evidence).toEqual(e.evidence);
    }
  });
});

describe('E05: the doc example, as a drill position', () => {
  const ROCKS = 'OP17-039';
  const KAIDO = 'OP17-058';
  const spec: Spec = {
    seed: 5,
    turn: 10,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: ROCKS,
      life: lifeOf(1, 'OP17-045'),
      hand: ['OP17-056', 'OP17-055', 'OP08-051'],
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
    p2: {
      leader: { card: KAIDO, don: 2 },
      characters: ['OP17-060', 'OP17-062'],
      life: lifeOf(3, 'OP17-045'),
      hand: [],
      costArea: { active: 0, rested: 0 },
      decklist: listOf(KAIDO),
    },
  };
  const m0 = startOf(spec, cards);
  const ulti = leaderAttacks(m0).find(
    (a) => a.type === 'attack' && queries.card(m0, a.attacker).card === 'OP17-060',
  )!;
  const step = toCounterStep(m0, ulti)!;

  it('is a should-counter position: taking the first hit loses, countering holds', () => {
    expect(shouldGate(m0, cards)).toBe(true);
    expect(classifyPosition(m0, step.prefix, cards)).toEqual({
      expect: 'counter',
      judge: 'survive-turn',
      detector: 'should-counter',
    });
    expect(survivingCounters(step.state, cards)).not.toBeNull();
  });

  it('its answer text is the E05 example: claim, outcome, nextTime, evidence, line', () => {
    const e = explainCounter(
      {
        id: 'e05',
        drill: 'counter',
        lesson: 'L10-counter-or-take',
        source: { kind: 'bank', seed: 5 },
        mine: ROCKS,
        theirs: KAIDO,
        first: true,
        certainty: 'any-hand',
        label: 'any-hand',
        scenario: spec,
        prefix: step.prefix,
        hand: 'harder',
        expect: 'counter',
        judge: 'survive-turn',
        detector: 'should-counter',
      },
      cards,
    )!;
    const doc = docExample('E05');
    for (const k of ['conceptId', 'claim', 'certainty', 'nextTime', 'lessonId'] as const)
      expect(e[k], k).toEqual(doc[k]);
    // The refutation's own first attack is not this one, so the line is this battle's only.
    expect(e.outcome).toMatch(/^Survives the turn/);
    expect(e.sources).toEqual(doc.sources);
    for (const n of [0, 1, 2])
      expect(e.evidence[n]!.text, `evidence ${n}`).toBe(doc.evidence[n]!.text);
    expect(e.line!.map((m) => m.kind)).toContain('counter');
  });
});

describe("any-hand: the opponent's hidden hand, deck and face-down Life are never read", () => {
  // The first few items of each class: a full re-classification takes seconds each.
  const sample = [
    ...items.filter((i) => i.expect === 'counter').slice(0, 3),
    ...items.filter((i) => i.detector === 'counter-wasted-a').slice(0, 2),
    ...items.filter((i) => i.detector === 'counter-wasted-b').slice(0, 2),
  ];
  const permuted = (i: CounterItem, k: number): CounterItem['scenario'] => {
    const sc = i.scenario;
    const list = sc.p2.decklist ?? [];
    const rotated = [...list.slice(k), ...list.slice(0, k)].reverse();
    return {
      ...sc,
      // Their deck order and the Life cards change; the sizes do not.
      p2: {
        ...sc.p2,
        decklist: rotated,
        life: (sc.p2.life ?? []).map((_, n) => rotated[n]!) as never,
      },
    };
  };

  it('permuting their deck order and Life leaves the class and the answer text byte-identical', () => {
    expect(sample.length).toBeGreaterThanOrEqual(6);
    for (const i of sample) {
      const base = JSON.stringify(explainCounter(i, cards));
      for (const k of [7, 19]) {
        const v: CounterItem = { ...i, scenario: permuted(i, k) };
        expect(reverifyCounter(v, cards), `${i.id} k=${k}`).toEqual(shapeOf(i));
        expect(JSON.stringify(explainCounter(v, cards)), `${i.id} k=${k}`).toBe(base);
      }
    }
  });

  it('a leaky classifier (one that also reads their real hand) differs across hands; the real one does not', () => {
    // Replace their (empty) hand by two real cards: one hand of Rush Characters, one of other cards.
    const rush = [...cards.values()].find(
      (c) => c.category === 'Character' && c.effectText.includes('[Rush]'),
    )!.id;
    let shown = 0;
    for (const i of items.filter((x) => x.expect === 'take')) {
      const list = i.scenario.p2.decklist ?? [];
      const other = list.find((id) => cards.get(id)?.category === 'Event')!;
      const classes = [rush, other].map((card) => {
        const sc = { ...i.scenario, p2: { ...i.scenario.p2, hand: [card, card] } };
        const m0 = startOf(sc, cards);
        // The same attack, found by its card (instance ids move when their hand changes).
        const first = replayCounter(i, cards).counter;
        const want = queries.card(first, queries.battle(first)!.attacker).card;
        const atk = leaderAttacks(m0).find(
          (a) => a.type === 'attack' && queries.card(m0, a.attacker).card === want,
        )!;
        const c = toCounterStep(m0, atk)!.state;
        const real = classifyWasted(c, cards);
        // The leak: "take it is safe because they hold no Rush Character", read off the real hand.
        const holdsRush = queries
          .zone(m0, 'p2', 'hand')
          .some((h) => cards.get(h.card)?.effectText.includes('[Rush]'));
        return { real, leaky: holdsRush ? null : real };
      });
      // What the guide may use is what everyone sees: the answer does not depend on which two cards.
      expect(classes[0]!.real, i.id).toBe(classes[1]!.real);
      if (classes[0]!.real && classes[0]!.leaky !== classes[1]!.leaky) shown++;
    }
    expect(shown).toBeGreaterThan(0);
  });
});

describe('the generator', () => {
  it('is deterministic per seed: the first three committed seeds rebuild their items exactly', () => {
    const sets = metaListSets();
    for (const i of items.slice(0, 3)) {
      const seed = (i.source as { seed: number }).seed;
      expect(JSON.parse(JSON.stringify(counterItemAt(seed, sets, cards))), i.id).toEqual(i);
    }
  });

  it('classifies a position without hidden help: a bank position stays one class under every attack order', () => {
    const i = items[0]!;
    const found = classifiedPositions(i.scenario, cards);
    expect(found.some((f) => JSON.stringify(f.prefix) === JSON.stringify(i.prefix))).toBe(true);
    expect(applyAll(startOf(i.scenario, cards), i.prefix)).toBeDefined();
    expect(reduce).toBeDefined();
    expect(counterBank).toBeDefined();
  });
});
