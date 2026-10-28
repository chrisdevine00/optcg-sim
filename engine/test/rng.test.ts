import { describe, expect, it } from 'vitest';
import { nextFloat, nextInt, seedRng, shuffle } from '../src/index.ts';

describe('seeded rng', () => {
  it('is deterministic for a seed', () => {
    const a = nextFloat(seedRng(42));
    const b = nextFloat(seedRng(42));
    expect(a).toEqual(b);
  });

  it('stays in range', () => {
    let s = seedRng(7);
    for (let i = 0; i < 1000; i++) {
      let n: number;
      [n, s] = nextInt(s, 6);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(6);
    }
  });

  it('shuffles without losing cards and reproducibly', () => {
    const deck = Array.from({ length: 50 }, (_, i) => i);
    const [a] = shuffle(deck, seedRng(1));
    const [b] = shuffle(deck, seedRng(1));
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual(deck);
    expect(a).not.toEqual(deck);
  });
});
