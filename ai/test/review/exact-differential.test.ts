/**
 * M8 WP2: the differential. Every `any-hand` result of the exact detectors (DON!! unused, counter
 * wasted, mulligan) is the same flag and the same explanation whatever the opponent's hidden hand,
 * deck and face-down Life are: permuted, or replaced by other cards from their list. Hindsight
 * results may differ (they read the real hand), which is why they are labelled so; the last test
 * shows the differential has teeth: a detector that let the real hand into an `any-hand` claim
 * would fail it.
 */
import { describe, expect, it, vi } from 'vitest';
import { mulliganVerdict } from '../../src/search/mulligan.ts';
import { playbookFor } from '../../src/playbook.ts';
import { cardMap } from '../support.ts';
import { listOf } from '../support/scenario.ts';
import { atMulligan, findSeed } from './wp2-mulligan.ts';
import { e04Record, e06Record, e19Record, ZORO, type Hidden } from './wp2-positions.ts';
import { e07Record, luffyRecord } from './wp2-positions-more.ts';
import { contextOf, indexOf, run, shown, shuffled } from './wp2-support.ts';
import type { TurnResult } from '../../src/search/review/types.ts';

vi.setConfig({ testTimeout: 120_000 });

const MIXED: Hidden = {
  hand: ['OP17-054', 'OP17-050'],
  life: [ZORO, 'OP17-052', 'OP17-045'],
  deckSeed: 1,
};

/** The opponent's hidden cards, rearranged and replaced; sizes are public and stay equal. */
const VARIANTS: Hidden[] = [
  MIXED,
  // The same cards in another order.
  { hand: [...MIXED.hand].reverse(), life: [...MIXED.life].reverse(), deckSeed: 2 },
  { hand: MIXED.hand, life: shuffled(MIXED.life, 7), deckSeed: 3 },
  // Other cards from their list, and another deck order.
  { hand: ['OP17-048', 'OP17-049'], life: [ZORO, ZORO, 'OP17-054'], deckSeed: 4 },
  { hand: ['OP17-040', 'OP08-051'], life: ['OP17-050', 'OP17-052', ZORO], deckSeed: 0 },
];

const verdictOf = (hand: string[]): boolean =>
  mulliganVerdict(
    hand.map((id) => cardMap().get(id)),
    playbookFor('OP17-039', listOf('OP17-039'), cardMap()).mulligan,
    true,
  ).keep;

const anyHand = (r: TurnResult | null): string =>
  JSON.stringify((r?.flags ?? []).filter((f) => f.certainty === 'any-hand'));

const isCounter = (a: { type: string; ability?: string }): boolean =>
  a.type === 'counter' || (a.type === 'activate' && a.ability === 'counter');

describe("any-hand flags do not depend on the opponent's hidden cards", () => {
  it('DON!! unused (E06): the same flag and explanation for every variant', () => {
    const out = VARIANTS.map((h) => {
      const rec = e06Record(h);
      const ctx = contextOf(rec);
      return run(
        'don-unused',
        ctx,
        indexOf(rec, (a) => a.type === 'endTurn'),
      );
    });
    expect(out[0]!.flags).toHaveLength(1);
    for (const r of out) expect(shown(r)).toBe(shown(out[0]!));
  });

  it('holding DON!! (E07): the same note for every variant', () => {
    const out = VARIANTS.map((h) => {
      const rec = e07Record(h);
      return run(
        'don-unused',
        contextOf(rec),
        indexOf(rec, (a) => a.type === 'endTurn'),
      );
    });
    expect(out[0]!.notes).toHaveLength(1);
    for (const r of out) expect(shown(r)).toBe(shown(out[0]!));
  });

  it('counter wasted, lost anyway (E19) and not needed (E04): the same for every variant', () => {
    for (const make of [e19Record, e04Record]) {
      const out = VARIANTS.map((h) => {
        const rec = make(h);
        return run('counter-wasted', contextOf(rec), indexOf(rec, isCounter));
      });
      expect(out[0]!.flags).toHaveLength(1);
      expect(out[0]!.flags[0]!.certainty).toBe('any-hand');
      for (const r of out) expect(shown(r)).toBe(shown(out[0]!));
    }
  });
});

describe('what only their real hand shows is Hindsight, and is the only thing that varies', () => {
  const hands: string[][] = [
    ['OP17-054', 'OP17-050'],
    ['OP17-048', 'OP17-049'],
    ['OP13-037', 'OP13-037'],
    ['OP13-037', 'OP17-050'],
  ];
  const results = hands.map((hand) => {
    const rec = luffyRecord(hand);
    return run('counter-wasted', contextOf(rec), indexOf(rec, isCounter));
  });

  it('the any-hand part of the result never changes', () => {
    for (const r of results) expect(anyHand(r)).toBe(anyHand(results[0]!));
  });

  it('the real hand does change the Hindsight part (so the label matters)', () => {
    expect(results[0]!.flags[0]!.severity).toBe('hindsight');
    expect(results[2]).toBeNull();
    expect(shown(results[0]!)).not.toBe(shown(results[2]!));
  });

  it("a leaky detector fails this differential: claiming Hindsight's result as any-hand varies", () => {
    // The deliberately leaky version: relabel the real-hand proof as an any-hand flag.
    const leaky = (r: TurnResult | null): TurnResult | null =>
      r && {
        ...r,
        flags: r.flags.map((f) => ({
          ...f,
          certainty: 'any-hand' as const,
          severity: 'moderate' as const,
        })),
      };
    expect(anyHand(leaky(results[0]!))).not.toBe(anyHand(leaky(results[2]!)));
  });
});

describe("the mulligan reads the seat's own hand and list only", () => {
  it("is the same flag for every order and content of the opponent's deck", () => {
    const seed = findSeed('OP17-039', true, (h) => !verdictOf(h));
    const out = [0, 1, 2, 3, 4].map((deckSeed) => {
      const g = atMulligan(
        'OP17-039',
        seed,
        true,
        deckSeed % 2 ? 'OP17-058' : 'OP17-039',
        deckSeed,
      );
      const ctx = contextOf(g.rec(false));
      return run(
        'mulligan',
        ctx,
        indexOf(ctx.record as never, (a) => a.type === 'mulligan' && a.player === 'p1'),
      );
    });
    expect(out[0]!.flags).toHaveLength(1);
    for (const r of out) expect(shown(r)).toBe(shown(out[0]!));
  });
});
