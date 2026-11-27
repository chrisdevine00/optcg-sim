/** The harder hand (M9 WP2): the defence a recorded game's opponent is given in a puzzle. */
import { describe, expect, it } from 'vitest';
import { SCRIPTS } from '@optcg/cards';
import { counterValueOf, priorFor } from '../src/knowledge.ts';
import { defenceValue, harderHand, INERT_LIFE } from '../src/search/drills/hand.ts';
import { placeholder } from '../src/search/lethal/public.ts';
import { cardMap } from './support.ts';

const cards = cardMap();

describe('INERT_LIFE', () => {
  it('is a vanilla Character: no [Trigger], no effect, no script', () => {
    const c = cards.get(INERT_LIFE)!;
    expect(c.category).toBe('Character');
    expect(c.triggerText).toBeNull();
    expect(c.effectText).toBe('');
    expect(SCRIPTS[INERT_LIFE]).toBeUndefined();
  });
});

describe('harderHand', () => {
  // A toy list: ids sort in the order a tie is broken (a < b < ...).
  const toy = new Map(
    [
      ['T-a', 2000],
      ['T-b', 2000],
      ['T-c', 1000],
      ['T-d', 1000],
      ['T-e', 0],
      ['T-f', 3000],
    ].map(([id, counter]) => [
      id as string,
      placeholder(id as string, id as string, 'Character', counter as number),
    ]),
  );
  const pool = [
    { id: 'T-a', count: 2 },
    { id: 'T-b', count: 1 },
    { id: 'T-c', count: 4 },
    { id: 'T-d', count: 1 },
    { id: 'T-e', count: 4 },
    { id: 'T-f', count: 1 },
  ];

  /** Every multiset of `n` cards the pool allows, by brute force. */
  function best(n: number): number {
    let top = -1;
    const walk = (i: number, left: number, total: number): void => {
      if (left === 0) return void (top = Math.max(top, total));
      if (i === pool.length) return;
      const p = pool[i]!;
      for (let k = 0; k <= Math.min(p.count, left); k++)
        walk(i + 1, left - k, total + k * defenceValue(toy.get(p.id)));
    };
    walk(0, n, 0);
    return top;
  }

  it('is the argmax of total defence, for every hand size', () => {
    for (let n = 0; n <= 9; n++) {
      const hand = harderHand('X', n, toy, { pool });
      expect(hand).toHaveLength(n);
      expect(hand.reduce((t, id) => t + defenceValue(toy.get(id)), 0)).toBe(best(n));
    }
  });

  it('respects the copies a list runs, and breaks ties by card id', () => {
    expect(harderHand('X', 5, toy, { pool })).toEqual(['T-f', 'T-a', 'T-a', 'T-b', 'T-c']);
    // Never more copies than the pool holds.
    expect(harderHand('X', 99, toy, { pool })).toHaveLength(13);
  });

  it('scores a [Counter] Event that rests or draws above its power alone', () => {
    const leaders = [
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
    ];
    const ids = new Set(
      leaders.flatMap((l) => priorFor(l).lists.flatMap((x) => x.cards.map((c) => c.id))),
    );
    const events = [...ids].filter(
      (id) => cards.get(id)?.category === 'Event' && counterValueOf(cards.get(id)) > 0,
    );
    expect(events.length).toBeGreaterThan(0);
    const boosted = events.filter(
      (id) => defenceValue(cards.get(id)) > counterValueOf(cards.get(id)),
    );
    expect(boosted.length).toBeGreaterThan(0);
    for (const id of events)
      expect(defenceValue(cards.get(id))).toBeGreaterThanOrEqual(counterValueOf(cards.get(id)));
  });

  it('draws only from the archetype lists, is deterministic, and is not the same for every Leader', () => {
    const seen = new Map<string, string[]>();
    for (const leader of ['OP17-039', 'OP17-058', 'OP09-062', 'OP05-098']) {
      const hand = harderHand(leader, 5, cards);
      expect(harderHand(leader, 5, cards)).toEqual(hand);
      const inLists = new Set(priorFor(leader).lists.flatMap((l) => l.cards.map((c) => c.id)));
      for (const id of hand) expect(inLists.has(id)).toBe(true);
      seen.set(leader, hand);
    }
    expect(new Set([...seen.values()].map((h) => h.join())).size).toBeGreaterThan(1);
  });

  it('is at least as strong as any other hand of the same list (the first five by id)', () => {
    for (const leader of ['OP17-039', 'OP17-058']) {
      const value = (h: string[]) => h.reduce((t, id) => t + defenceValue(cards.get(id)), 0);
      const first = priorFor(leader)
        .lists[0]!.cards.flatMap((c) => Array<string>(c.count).fill(c.id))
        .sort()
        .slice(0, 5);
      expect(value(harderHand(leader, 5, cards))).toBeGreaterThanOrEqual(value(first));
    }
  });
});
