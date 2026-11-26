/**
 * M8-R6: the counter-wasted (b) flag may be `any-hand` only when its public bound covers every
 * hidden hand. Each test is a gap the old bound (one Rush per card in hand, priced at the cheapest
 * Rush in the archetype's lists) did not cover; each gave an `any-hand` flag before and must not now.
 * The position is the Luffy one of counter-wasted.test.ts (their Leader OP13-001, a Character on
 * their board, 2 cards in hand), with more Life on your side.
 */
import { queries, reduce, type GameState } from '@optcg/engine';
import { describe, expect, it, vi } from 'vitest';
import { hitBound } from '../../src/search/review/counter-wasted.ts';
import { priorFor } from '../../src/knowledge.ts';
import { cardMap } from '../support.ts';
import { listOf } from '../support/scenario.ts';
import { defendWith, HAWKINS, LUFFY, ZORO } from './wp2-positions.ts';
import { luffyHindsight } from './wp2-positions-more.ts';
import { build, contextOf, indexOf, lifeOf, run, step } from './wp2-support.ts';

vi.setConfig({ testTimeout: 120_000 });

const cards = cardMap();
const BLUENO = 'EB01-017';
const ZORO_OP13 = 'OP13-037';
const isCounter = (a: { type: string; ability?: string }): boolean =>
  a.type === 'counter' || (a.type === 'activate' && a.ability === 'counter');

type Spec = ReturnType<typeof luffyHindsight>;

/** The Luffy position with `life` on your side (before the hit), edited by `edit`. */
function record(life: number, edit: (s: Spec) => void = () => {}) {
  const spec = luffyHindsight(['OP17-054', 'OP17-050']);
  spec.p1.life = lifeOf(life, ZORO);
  edit(spec);
  return build(spec, 'p2', [step.attack('p2', 'leader', 'leader')], defendWith([HAWKINS]));
}

function afterHit(rec: ReturnType<typeof record>): GameState {
  const s0 = contextOf(rec).stateAt(indexOf(rec, isCounter));
  let s = reduce(s0, { type: 'endCounter', player: 'p1' }).state;
  if (queries.decision(s)?.kind === 'trigger')
    s = reduce(s, { type: 'trigger', activate: false, player: 'p1' }).state;
  return s;
}

const certainty = (rec: ReturnType<typeof record>): string | null =>
  run('counter-wasted', contextOf(rec), indexOf(rec, isCounter))?.flags[0]?.certainty ?? null;

const plainBoard = (s: Spec): void => {
  s.p2.characters = [BLUENO, { card: BLUENO, rested: true }];
};

describe('M8-R6: the public bound covers what the old one did not', () => {
  it('the base position still proves it: 3 Life left after the hit, at most 3 more hits', () => {
    const rec = record(4, plainBoard);
    expect(hitBound(afterHit(rec), 'p1', 'public', cards)!.damage).toBe(3);
    expect(certainty(rec)).toBe('any-hand');
  });

  it('draw-into-more: with one card in hand, their draws could still bring two re-activators', () => {
    // 8 DON!! pay for two Zoro (OP13-037, cost 4). Old bound: 1 card in hand, 1 more hit. At 3 Life
    // (2 after the hit) it held; the cards a draw effect puts in their hand make it 3 hits.
    const rec = record(3, (s) => {
      plainBoard(s);
      s.p2.hand = ['OP17-054'];
    });
    expect(hitBound(afterHit(rec), 'p1', 'public', cards)!.damage).toBe(3);
    expect(certainty(rec)).not.toBe('any-hand');
  });

  it('an effect already on their board that sets a Leader or Character active is counted', () => {
    // Zoro (OP13-037) in play: the old bound counted only the cards in hand.
    const rec = record(4, (s) => {
      s.p2.characters = [ZORO_OP13, { card: ZORO_OP13, rested: true }];
    });
    expect(hitBound(afterHit(rec), 'p1', 'public', cards)!.damage).toBeGreaterThan(3);
    expect(certainty(rec)).not.toBe('any-hand');
  });

  it('a Leader with no sourced list narrows nothing: every card in hand is two free hits', () => {
    const synthetic = [...cards.values()].find(
      (c) => c.category === 'Leader' && priorFor(c.id).synthetic,
    )!;
    const rec = record(4, (s) => {
      s.p2.leader = { card: synthetic.id, don: 0 };
      s.p2.characters = [BLUENO];
    });
    const bound = hitBound(afterHit(rec), 'p1', 'public', cards)!;
    expect(bound.damage).toBe(bound.boardDamage + 2 * 2);
    expect(certainty(rec)).not.toBe('any-hand');
  });

  it('the failing public bound falls to Hindsight (never severe) when their real hand and draws could not do it', () => {
    const rec = record(3, (s) => {
      plainBoard(s);
      s.p2.hand = ['OP17-054'];
    });
    const flag = run('counter-wasted', contextOf(rec), indexOf(rec, isCounter))?.flags[0];
    expect(flag).toBeDefined();
    expect(flag!.certainty).toBe('needed-hidden-info');
    expect(flag!.severity).toBe('hindsight');
    expect(flag!.explanation.certainty).toBe('needed-hidden-info');
  });

  it('their real draws count in hindsight: two drawers in hand, re-activators on top of the deck', () => {
    const rec = record(3, (s) => {
      plainBoard(s);
      s.p2.hand = ['OP17-050', 'OP17-050'];
      s.p2.deck = [ZORO_OP13, ZORO_OP13, ...listOf(LUFFY).slice(0, 30)];
    });
    const actual = hitBound(afterHit(rec), 'p1', 'actual', cards)!;
    expect(actual.damage).toBeGreaterThan(2);
    expect(certainty(rec)).toBeNull();
  });

  it('a card in hand that gives Rush or Double Attack adds hits (hindsight bound)', () => {
    const grant = record(3, (s) => {
      plainBoard(s);
      s.p2.hand = ['ST31-004'];
    });
    const none = record(3, (s) => {
      plainBoard(s);
      s.p2.hand = ['OP17-054'];
    });
    const g = hitBound(afterHit(grant), 'p1', 'actual', cards)!;
    const n = hitBound(afterHit(none), 'p1', 'actual', cards)!;
    expect(g.damage).toBeGreaterThan(n.damage);
  });
});
