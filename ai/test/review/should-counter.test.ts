/**
 * M8 WP3: the `should-counter` detector (explanations.md E05). Planted games, worked by hand; the
 * player is p1 (human), the attacker p2.
 *
 * E05 position (game turn 10, their Main): you are Rocks (OP17-039) Leader 5000 at 1 Life (Kyo,
 * OP17-045, no Counter) with Rocks Pirates (+2000), There's No Authority (+2000) and Buckin (+1000)
 * in hand. They are Kaido (OP17-058): Leader with 2 DON!! given (7000), Ulti & Page One (OP17-060)
 * 6000 and Kaido (OP17-062) 12000, no hand, no active DON!!.
 * Stops needed: 6000 − 5000 + 1000 = 2000, 7000 − 5000 + 1000 = 3000, 12000 − 5000 + 1000 = 8000.
 * Hand 5000: both smaller attacks (2000 + 3000), never Kaido; one Life to spend, so Kaido is taken.
 */
import { describe, expect, it, vi } from 'vitest';
import { queries, reduce, type Action, type GameState } from '@optcg/engine';
import { DETECTORS, certaintyLabel, type ReviewRecord } from '../../src/index.ts';
import { refutationCertainty } from '../../src/search/review/should-counter.ts';
import { docExample } from '../support/doc.ts';
import { lifeOf, listOf } from '../support/scenario.ts';
import { attackOn, ctxOf, item, recordOf, takeIt, type Spec } from './wp3-support.ts';

vi.setConfig({ testTimeout: 120_000 });

const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';
const ULTI = 'OP17-060';
const KAIDO_CHAR = 'OP17-062';
const RP = 'OP17-056';
const NA = 'OP17-055';
const BUCKIN = 'OP08-051';
const KYO = 'OP17-045';

const E05: Spec = {
  seed: 5,
  turn: 10,
  activePlayer: 'p2',
  firstPlayer: 'p1',
  p1: {
    leader: ROCKS,
    life: lifeOf(1, KYO),
    hand: [RP, NA, BUCKIN],
    costArea: { active: 0, rested: 0 },
    decklist: listOf(ROCKS),
  },
  p2: {
    leader: { card: KAIDO, don: 2 },
    characters: [ULTI, KAIDO_CHAR],
    life: lifeOf(3, KYO),
    hand: [],
    costArea: { active: 0, rested: 0 },
    decklist: listOf(KAIDO),
  },
};

type Answer = (s: GameState, legal: Action[]) => Action | undefined;

/** p2 attacks in `order` (each with its Leader as the target); p1 answers per the attacker's card. */
function game(
  spec: Spec,
  order: string[],
  defend: Record<string, Answer>,
  seats?: ReviewRecord['seats'],
): ReviewRecord {
  const queue = [...order];
  return recordOf(
    spec,
    (s, legal) => {
      const dec = queries.decision(s)!;
      if (dec.player === 'p2' && dec.kind === 'main') {
        const next = queue.shift();
        return next ? attackOn(s, legal, 'p2', next) : legal.find((a) => a.type === 'endTurn');
      }
      if (dec.player === 'p1' && dec.kind === 'main') return undefined;
      if (dec.player === 'p1') {
        const b = queries.battle(s);
        const who = b ? queries.card(s, b.attacker).card : '';
        return (defend[who] ?? (() => undefined))(s, legal) ?? takeIt(legal);
      }
      return takeIt(legal);
    },
    seats,
  );
}

/** Play these Counter cards (Events by their activation, Characters by `counter`), then stop. */
const play =
  (...cards: string[]): Answer =>
  (s, legal) => {
    for (const c of cards) {
      const a = legal.find((x) => {
        if (x.type === 'activate' && x.ability === 'counter')
          return queries.card(s, x.card).card === c;
        if (x.type === 'counter') return queries.card(s, x.card).card === c;
        return false;
      });
      if (a) return a;
    }
    return legal.find((a) => a.type === 'endCounter');
  };

const ORDER = [ULTI, KAIDO, KAIDO_CHAR];
const DEFENCE = { [KAIDO]: play(RP, BUCKIN), [KAIDO_CHAR]: play(NA) };

describe('E05: a hit that should have been countered', () => {
  const rec = game(E05, ORDER, DEFENCE);
  const ctx = ctxOf(rec);
  const run = () => DETECTORS['should-counter'](item('should-counter', 10, 0), ctx)!;

  it('flags the take of the first hit, any-hand and severe, in the lost turn', () => {
    const r = run();
    expect(r.flags).toHaveLength(1);
    expect(r.marker).toBeUndefined();
    const f = r.flags[0]!;
    expect(f).toMatchObject({
      kind: 'should-counter',
      turn: 10,
      player: 'p1',
      severity: 'severe',
      certainty: 'any-hand',
      practice: { judge: 'survive-turn', turn: 10 },
    });
    // The flagged decision is p1's answer to the first attack: an endCounter at that index.
    expect(rec.actions[f.decisionIndex]).toMatchObject({ type: 'endCounter', player: 'p1' });
    expect(f.restoreIndex).toBe(f.decisionIndex);
    expect(f.id).toBe(`should-counter:10:${f.decisionIndex}`);
    expect(certaintyLabel(f.explanation.certainty, 'review')).toBe('Holds whatever they held');
    expect(queries.result(ctx.stateAt(rec.actions.length))).toMatchObject({ winner: 'p2' });
  });

  it('matches the E05 example: claim, outcome, nextTime, concept, lesson, certainty; figures recomputed', () => {
    const e = run().flags[0]!.explanation;
    const doc = docExample('E05');
    for (const k of ['conceptId', 'claim', 'outcome', 'certainty', 'nextTime', 'lessonId'] as const)
      expect(e[k], k).toEqual(doc[k]);
    expect(e.sources).toEqual(doc.sources);
    // The first three evidence lines are the doc's, word for word.
    for (const i of [0, 1, 2])
      expect(e.evidence[i]!.text, `evidence ${i}`).toBe(doc.evidence[i]!.text);
    const m0 = ctx.stateAt(0);
    const leader = queries.zone(m0, 'p1', 'leader')[0]!.power!;
    const theirs = [...queries.zone(m0, 'p2', 'characters'), ...queries.zone(m0, 'p2', 'leader')];
    const stop = (id: string): number => theirs.find((c) => c.card === id)!.power! - leader + 1000;
    const fig = Object.assign({}, ...e.evidence.map((x) => x.figures ?? {})) as Record<
      string,
      number
    >;
    expect(fig).toMatchObject({
      life: queries.zone(m0, 'p1', 'life').length,
      hitsYouCanTake: 1,
      stopUlti: stop(ULTI),
      stopLeader: stop(KAIDO),
      stopKaido: stop(KAIDO_CHAR),
      handCounter: 2000 + 2000 + 1000,
      neededAfterTaking: stop(KAIDO) + stop(KAIDO_CHAR),
      bestPossible: 5000 + 2000,
      opponentHand: queries.zone(m0, 'p2', 'hand').length,
      opponentActiveDon: queries.don(m0, 'p2').active,
    });
  });

  it('the line is a defence that holds: its principal variation replays with reduce and survives', () => {
    const m0 = ctx.stateAt(0);
    const { certainty, pv } = refutationCertainty(m0, 'p2', ctx.cap);
    expect(certainty).toBe('any-hand');
    let s = m0;
    for (const a of pv) s = reduce(s, a).state;
    expect(queries.result(s)).toBeNull();
    const e = run().flags[0]!.explanation;
    // One Move per battle: take the 12000 hit, stop the other two.
    expect(e.line!.map((m) => m.kind)).toEqual(['take', 'counter', 'counter']);
    expect(e.line![0]!.text).toBe("Take Kaido's hit: 1 Life → 0.");
    expect(e.outcome).toBe(`Survives the turn at ${queries.zone(s, 'p1', 'life').length} Life.`);
  });

  it('"What you did" is the record: take, two counters on the Leader, a lost counter on Kaido', () => {
    const did = run().flags[0]!.did;
    expect(did.map((m) => m.kind)).toEqual(['take', 'counter', 'take']);
    expect(did[0]!.text).toBe("Take Ulti & Page One's hit: 1 Life → 0.");
    expect(did[1]!.text).toBe(
      'Stop their Leader with Rocks Pirates and Buckin (8000 against 7000).',
    );
    expect(did[2]!.text).toMatch(/on Kaido's attack \(7000 against 12000\) and lose\.$/);
  });
});

describe('should-counter: when it does not flag', () => {
  it('no flag when your hand could never have stopped it (proven from the start)', () => {
    const spec: Spec = { ...E05, p1: { ...E05.p1, hand: [KYO] } };
    const rec = game(spec, ORDER, {});
    expect(DETECTORS['should-counter'](item('should-counter', 10, 0), ctxOf(rec))).toBeNull();
  });

  it('no flag when the game did not end in that turn', () => {
    const rec = game(E05, [ULTI], {});
    expect(queries.result(ctxOf(rec).stateAt(rec.actions.length))).toBeNull();
    expect(DETECTORS['should-counter'](item('should-counter', 10, 0), ctxOf(rec))).toBeNull();
  });

  it('only on the turn the player lost, only for a human seat', () => {
    const rec = game(E05, ORDER, DEFENCE);
    expect(DETECTORS['should-counter'](item('should-counter', 9, 0), ctxOf(rec))).toBeNull();
    const ai = game(E05, ORDER, DEFENCE, { p1: 'ai', p2: 'human' });
    expect(DETECTORS['should-counter'](item('should-counter', 10, 0), ctxOf(ai))).toBeNull();
  });

  it('a cap before any answer is a "Not fully checked" marker, never a clean turn', () => {
    const rec = game(E05, ORDER, DEFENCE);
    const r = DETECTORS['should-counter'](item('should-counter', 10, 0), ctxOf(rec, 3))!;
    expect(r.flags).toHaveLength(0);
    expect(r.marker).toMatchObject({
      turn: 10,
      kind: 'should-counter',
      reason: 'search-incomplete',
    });
  });

  it('is inert on a context with no record (the WP0 registry test)', () => {
    expect(DETECTORS['should-counter'](item('should-counter', 1, 0), {} as never)).toBeNull();
  });
});

describe('should-counter: certainty reads only what you could see', () => {
  /** The E05 position with the attacker's hidden cards changed: its hand, deck order and Life cards. */
  const variant = (hand: string[], life: string[], deck: string[]): ReviewRecord => {
    const { decklist: _drop, ...p2 } = E05.p2;
    void _drop;
    const spec: Spec = { ...E05, p2: { ...p2, hand, life, deck } };
    return game(spec, ORDER, DEFENCE);
  };
  const pad = (xs: string[]): string[] =>
    [...xs, ...Array.from({ length: 30 }, () => KYO)].slice(0, 30);
  const flagOf = (rec: ReviewRecord) =>
    DETECTORS['should-counter'](item('should-counter', 10, 0), ctxOf(rec))!.flags[0]!;

  it('with no hand, the flag is identical whatever their deck order and Life cards are', () => {
    const a = flagOf(variant([], lifeOf(3, KYO), pad([])));
    const b = flagOf(variant([], lifeOf(3, ULTI), pad([KAIDO_CHAR, ULTI, RP])));
    const c = flagOf(variant([], [KYO, ULTI, KAIDO_CHAR], pad([NA, BUCKIN, ULTI]).reverse()));
    expect(a.certainty).toBe('any-hand');
    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });

  it('with cards in their hand it is Hindsight, never any-hand and never severe', () => {
    for (const hand of [[KYO], [ULTI], [RP, NA]]) {
      const f = flagOf(variant(hand, lifeOf(3, KYO), pad([])));
      expect(f.certainty, hand.join()).toBe('needed-hidden-info');
      expect(f.severity).toBe('hindsight');
      expect(certaintyLabel(f.certainty, 'review')).toBe('Hindsight: needed their hidden cards');
      expect(f.explanation.evidence.at(-1)!.text).toMatch(/^They held \d cards? in hand/);
    }
  });
});
