/**
 * M7 WP2: blunder scoring and the DON!! ledger, on planted positions with the real card scripts.
 * E17 (the set-active choice past OP13-001's limit) is checked against the object in
 * docs/design/explanations.md; E06 and E07 likewise. The ledger's held rules have a table test.
 */
import { describe, expect, it, vi } from 'vitest';
import { SCRIPTS } from '@optcg/cards';
import {
  legalActions,
  project,
  projectForSearch,
  queries,
  reduce,
  type Action,
  type GameState,
  type SearchView,
} from '@optcg/engine';
import { hasCounterTiming } from '../src/knowledge.ts';
import { answerScore, GAP_THRESHOLD, scoreDecision, warningsOf } from '../src/coach/blunder.ts';
import { donLedger, explainHeld, explainUnused, ledgerLabel } from '../src/coach/tempo.ts';
import { actionKey, isNotImplemented, type ScoreTable } from '../src/coach/types.ts';
import { cardMap } from './support.ts';
import { docExample } from './support/doc.ts';
import { listOf, start } from './support/scenario.ts';

vi.setConfig({ testTimeout: 120_000 });

const cards = cardMap();
const RGL = 'OP13-001';
const NAMI = 'OP14-031';
const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';
const FILLER = 'OP13-027';
const LIFE = [FILLER, FILLER, FILLER, FILLER, FILLER];
const game = { ownDeck: listOf(RGL), leader: RGL, opponentLeader: ROCKS };
const BUDGET = { iterations: 200 } as const;

function step(s: GameState, pred: (a: Action) => boolean): GameState {
  const a = legalActions(s).find(pred);
  if (!a) throw new Error(`no such action: ${JSON.stringify(legalActions(s))}`);
  return reduce(s, a).state;
}

/** Doc E17: turn 8, going second, OP13-001 with 1 DON!! given, Nami played; the End Phase asks how many. */
function e17(): { state: GameState; view: SearchView } {
  let s = start({
    seed: 3,
    turn: 8,
    activePlayer: 'p1',
    firstPlayer: 'p2',
    p1: {
      leader: { card: RGL, don: 1 },
      hand: [NAMI, FILLER],
      life: LIFE,
      costArea: { active: 7, rested: 0 },
      decklist: listOf(RGL),
    },
    p2: {
      leader: ROCKS,
      hand: [FILLER, FILLER],
      life: LIFE,
      costArea: { active: 3, rested: 0 },
      decklist: listOf(ROCKS),
    },
  });
  s = step(s, (a) => a.type === 'playCard' && queries.card(s, a.card).card === NAMI);
  while (queries.decision(s)?.kind !== 'main') s = step(s, () => true);
  s = step(s, (a) => a.type === 'endTurn');
  return { state: s, view: projectForSearch(s, 'p1') };
}

const pickOption = (view: SearchView, id: string): Action =>
  view.actions.find(
    (a) =>
      a.type === 'pick' &&
      typeof a.choice === 'object' &&
      'option' in a.choice &&
      a.choice.option === id,
  )!;

describe('E17: the set-active choice', () => {
  const { view } = e17();
  const table = scoreDecision(view, { cards, game, budget: BUDGET });

  it('flags 4 and 3 (7 and 6 active switch the Leader off), not 2, 1 or 0', () => {
    expect(table.incomplete).toBe(false);
    const kinds = (id: string) => table.kinds[actionKey(pickOption(view, id))] ?? [];
    expect(kinds('4')).toEqual(['gap']);
    expect(kinds('3')).toEqual(['gap']);
    for (const id of ['2', '1', '0']) expect(kinds(id)).toEqual([]);
    expect(table.best).toBe(actionKey(pickOption(view, '2')));
  });

  it('the gap is the held DON!! value: 5 held × +2000 at the Counter rate, above the threshold', () => {
    const v = (id: string) => table.values[actionKey(pickOption(view, id))]!;
    // Rolled out the same way, the choices differ by the opponent-turn defence only.
    expect(v('2') - v('4')).toBeCloseTo(2.5, 5);
    expect(v('2') - v('4')).toBeGreaterThan(GAP_THRESHOLD);
    expect(v('2') - v('1')).toBeCloseTo(0.5, 5);
  });

  it("the warning is the doc's E17, field for field, and offers the better choice", () => {
    const w = warningsOf(table, pickOption(view, '4'));
    expect(w).toHaveLength(1);
    expect(w[0]!.explanation).toEqual(docExample('E17'));
    expect(w[0]!.better).toEqual(pickOption(view, '2'));
    expect(w[0]!.kind).toBe('gap');
  });

  it('every figure in the warning is recomputed from the view', () => {
    const e = warningsOf(table, pickOption(view, '4'))[0]!.explanation;
    const now = donLedger(view, cards);
    expect(e.evidence[1]!.figures).toMatchObject({
      activeNow: now.active,
      restedNow: now.paid,
      activeIfFour: now.active + 4,
      activeIfTwo: now.active + 2,
      defenceIfTwo: (now.active + 2) * 2000,
    });
  });

  it('asking twice gives the same table', () => {
    expect(scoreDecision(view, { cards, game, budget: BUDGET })).toEqual(table);
  });
});

describe('the ledger (E07 and the held rules)', () => {
  const view = (o: {
    given: number;
    active: number;
    rested?: number;
    hand?: string[];
    leader?: string;
  }): SearchView => {
    const s = start({
      seed: 4,
      turn: 8,
      activePlayer: 'p1',
      firstPlayer: 'p2',
      p1: {
        leader: { card: o.leader ?? RGL, don: o.given },
        hand: o.hand ?? [FILLER],
        life: LIFE,
        costArea: { active: o.active, rested: o.rested ?? 0 },
        decklist: listOf(RGL),
      },
      p2: { leader: KAIDO, hand: [FILLER], life: LIFE, decklist: listOf(KAIDO) },
    });
    return projectForSearch(s, 'p1');
  };

  const counterEvent = [...cards.values()].find(
    (c) =>
      c.category === 'Event' &&
      (c.cost ?? 0) >= 2 &&
      SCRIPTS[c.id]?.abilities.some((a) => hasCounterTiming((a as { when?: unknown }).when)),
  )!;

  it('OP13-001 with 1 DON!! given holds up to 5 active DON!! (E07)', () => {
    const l = donLedger(view({ given: 1, active: 5, rested: 2 }), cards);
    expect(l).toMatchObject({ total: 8, active: 5, paid: 2, given: 1, unused: 0 });
    expect(l.held.n).toBe(5);
    expect(l.held.reasons).toEqual([
      { kind: 'opponent-turn-effect', card: RGL, n: 5, limit: 5, perDon: 2000 },
    ]);
    expect(ledgerLabel(l)).toBe('8 DON!! · 2 paid · 1 given · 5 held');
  });

  it('with 6 active the effect cannot be used at all: all 6 are unused', () => {
    const l = donLedger(view({ given: 1, active: 6 }), cards);
    expect(l.held).toEqual({ n: 0, reasons: [] });
    expect(l.unused).toBe(6);
  });

  it('without a given DON!! the condition fails: nothing is held', () => {
    expect(donLedger(view({ given: 0, active: 4 }), cards).held.n).toBe(0);
  });

  it('a [Counter] Event in hand holds its cost, capped at the active DON!!', () => {
    const cost = counterEvent.cost!;
    const l = donLedger(
      view({ given: 0, active: cost + 2, hand: [counterEvent.id], leader: ROCKS }),
      cards,
    );
    expect(l.held.n).toBe(cost);
    expect(l.held.reasons).toEqual([
      { kind: 'counter-event', card: counterEvent.id, n: cost, limit: null, perDon: null },
    ]);
    expect(l.unused).toBe(2);
    const few = donLedger(
      view({ given: 0, active: 1, hand: [counterEvent.id], leader: ROCKS }),
      cards,
    );
    expect(few.held.n).toBe(1);
    expect(few.unused).toBe(0);
  });

  it('a plain hand and a plain Leader hold nothing: every active DON!! is unused', () => {
    const l = donLedger(view({ given: 0, active: 3, leader: ROCKS }), cards);
    expect(l.held.n).toBe(0);
    expect(l.unused).toBe(3);
  });

  it("E07: the explanation is the doc's object", () => {
    const v = view({ given: 1, active: 5, rested: 2 });
    const e = explainHeld(v, donLedger(v, cards), cards)!;
    expect(e).toEqual(docExample('E07'));
  });

  it('nothing is explained as "held" when nothing is held or when DON!! are also unused', () => {
    const none = view({ given: 0, active: 3, leader: ROCKS });
    expect(explainHeld(none, donLedger(none, cards), cards)).toBeNull();
    const mixed = view({ given: 1, active: 6 });
    expect(explainHeld(mixed, donLedger(mixed, cards), cards)).toBeNull();
  });
});

describe('the worker answer', () => {
  it('answers a score request with the same id and a real table', () => {
    const { view } = e17();
    const res = answerScore({ type: 'score', id: 7, view, budgetMs: 150 }, cards, game);
    expect(res).toMatchObject({ type: 'score', id: 7 });
    expect(isNotImplemented(res.result)).toBe(false);
    expect((res.result as ScoreTable).best).not.toBe('');
  });

  it('with no game data it still answers (plain rules only) and says it is incomplete', () => {
    const { view } = e17();
    const res = answerScore({ type: 'score', id: 8, view, budgetMs: 150 }, cards, null);
    expect((res.result as ScoreTable).incomplete).toBe(true);
    expect((res.result as ScoreTable).kinds).toEqual({});
  });
});

describe('E06: unused DON!!', () => {
  /** Your Main, Leader active with 3 active DON!! nothing uses; their Leader 5000. */
  const main = (active: number, extra: { hand?: string[]; characters?: string[] } = {}) =>
    projectForSearch(
      start({
        seed: 5,
        turn: 8,
        activePlayer: 'p1',
        firstPlayer: 'p2',
        p1: {
          leader: ROCKS,
          hand: extra.hand ?? [FILLER],
          characters: extra.characters ?? [],
          life: LIFE,
          costArea: { active, rested: 8 - active },
          decklist: listOf(ROCKS),
        },
        p2: { leader: KAIDO, hand: [FILLER], life: LIFE, decklist: listOf(KAIDO) },
      }),
      'p1',
    );
  const endTurn = (v: SearchView) => v.actions.find((a) => a.type === 'endTurn')!;

  it('ending the turn with 3 DON!! nothing uses is flagged, with the give-and-attack line', () => {
    const v = main(3);
    const t = scoreDecision(v, { cards, game, budget: BUDGET });
    const w = warningsOf(t, endTurn(v));
    expect(w.map((x) => x.kind)).toEqual(['unused-don']);
    const e = w[0]!.explanation;
    expect(e.claim).toBe('Ending your turn leaves 3 DON!! unused.');
    expect(e.line!.map((m) => m.kind)).toEqual(['giveDon', 'attack']);
    expect(w[0]!.better).toMatchObject({ type: 'giveDon' });
    expect(e.evidence[1]!.figures).toMatchObject({ attackPower: 5000, attackWithDon: 8000 });
    expect(e.certainty).toBe('any-hand');
  });

  it("the warning is the doc's E06b, field for field", () => {
    const v = main(3, { hand: ['OP17-055', 'OP17-056', 'OP17-049', 'OP17-050'] });
    const t = scoreDecision(v, {
      cards,
      game: { ownDeck: listOf(ROCKS), leader: ROCKS, opponentLeader: KAIDO },
      budget: BUDGET,
    });
    const w = warningsOf(t, endTurn(v));
    expect(w).toHaveLength(1);
    expect(w[0]!.explanation).toEqual(docExample('E06b'));
  });

  it('2 unused DON!! are not flagged, and no other action is', () => {
    const v = main(2);
    const t = scoreDecision(v, { cards, game, budget: BUDGET });
    expect(warningsOf(t, endTurn(v))).toEqual([]);
    expect(Object.keys(t.kinds)).toEqual([]);
  });

  it('is not flagged when no attacker could still use them (the first player cannot attack)', () => {
    const s = start({
      seed: 6,
      turn: 1,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: ROCKS,
        hand: [FILLER],
        life: LIFE,
        costArea: { active: 5, rested: 0 },
        decklist: listOf(ROCKS),
      },
      p2: { leader: KAIDO, hand: [FILLER], life: LIFE, decklist: listOf(KAIDO) },
    });
    const v = projectForSearch(s, 'p1');
    const t = scoreDecision(v, { cards, game, budget: BUDGET });
    expect(warningsOf(t, endTurn(v))).toEqual([]);
  });

  it("the tempo meter's end-of-turn text keeps the doc's wording (claim and first row)", () => {
    const v = main(3);
    const e = explainUnused(v, donLedger(v, cards), cards, 'left')!;
    const doc = docExample('E06');
    expect(e.claim).toBe(doc.claim);
    expect(e.conceptId).toBe(doc.conceptId);
    expect(e.lessonId).toBe(doc.lessonId);
    expect(e.nextTime).toBe(doc.nextTime);
    expect(e.sources).toEqual(doc.sources);
    expect(e.certainty).toBe(doc.certainty);
    expect(e.evidence).toHaveLength(1);
    expect(e.evidence[0]!.figures).toEqual(doc.evidence[0]!.figures);
  });

  it('works on the opponent view of the table too: no hidden card is read', () => {
    const s = start({
      seed: 5,
      turn: 8,
      activePlayer: 'p1',
      firstPlayer: 'p2',
      p1: {
        leader: ROCKS,
        hand: [FILLER],
        life: LIFE,
        costArea: { active: 3, rested: 5 },
        decklist: listOf(ROCKS),
      },
      p2: { leader: KAIDO, hand: [FILLER], life: LIFE, decklist: listOf(KAIDO) },
    });
    // The opponent's own ledger is its own: p2 asks, and sees only its side.
    const l = donLedger(project(s, 'p2'), cards);
    expect(l.total).toBe(
      queries.don(s, 'p2').active + queries.don(s, 'p2').rested + queries.don(s, 'p2').given,
    );
  });
});
