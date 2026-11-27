/** The confidence-interval helpers behind every rate assertion (ai/test/support/stats.ts). */
import { describe, expect, it } from 'vitest';
import {
  binomialCdf,
  binomialPmf,
  checkRateAtLeast,
  checkRateAtMost,
  clopperPearson,
  normalQuantile,
  quantile,
  wilson,
} from './support/stats.ts';

describe('normalQuantile', () => {
  it('matches the tabulated values', () => {
    expect(normalQuantile(0.5)).toBeCloseTo(0, 9);
    expect(normalQuantile(0.975)).toBeCloseTo(1.959964, 5);
    expect(normalQuantile(0.99)).toBeCloseTo(2.326348, 5);
    expect(normalQuantile(0.95)).toBeCloseTo(1.644854, 5);
    expect(normalQuantile(0.001)).toBeCloseTo(-3.090232, 5);
  });
  it('rejects 0 and 1', () => {
    expect(() => normalQuantile(0)).toThrow(RangeError);
    expect(() => normalQuantile(1)).toThrow(RangeError);
  });
});

describe('binomial sums', () => {
  it('Binomial(4, 0.5): the textbook table', () => {
    expect(binomialPmf(2, 4, 0.5)).toBeCloseTo(6 / 16, 12);
    expect(binomialCdf(1, 4, 0.5)).toBeCloseTo(5 / 16, 12);
    expect(binomialCdf(4, 4, 0.5)).toBe(1);
    expect(binomialCdf(-1, 4, 0.5)).toBe(0);
  });
  it('sums to 1', () => {
    let s = 0;
    for (let k = 0; k <= 60; k++) s += binomialPmf(k, 60, 0.37);
    expect(s).toBeCloseTo(1, 10);
  });
});

describe('wilson', () => {
  it('50 of 100 at 95%: the published interval 0.4038 to 0.5962', () => {
    const [lo, hi] = wilson(50, 100);
    expect(lo).toBeCloseTo(0.4038, 4);
    expect(hi).toBeCloseTo(0.5962, 4);
  });
  it('stays inside 0..1 at the extremes and is the whole range for n = 0', () => {
    expect(wilson(0, 10)[0]).toBe(0);
    expect(wilson(10, 10)[1]).toBe(1);
    expect(wilson(0, 0)).toEqual([0, 1]);
  });
  it('133 of 200: the interval the Warlord series prints (59.7 to 72.7%)', () => {
    const [lo, hi] = wilson(133, 200);
    expect(lo).toBeCloseTo(0.597, 3);
    expect(hi).toBeCloseTo(0.727, 3);
  });
});

describe('clopperPearson', () => {
  it('50 of 100, two-sided 95%: 0.3983 to 0.6017', () => {
    const [lo, hi] = clopperPearson(50, 100, 0.025);
    expect(lo).toBeCloseTo(0.3983, 4);
    expect(hi).toBeCloseTo(0.6017, 4);
  });
  it('no hits: the upper bound is 1 - alpha^(1/n) (the rule of three, exactly)', () => {
    expect(clopperPearson(0, 10, 0.05)[1]).toBeCloseTo(1 - 0.05 ** (1 / 10), 9);
    expect(clopperPearson(0, 10, 0.05)[0]).toBe(0);
  });
  it('all hits: the lower bound is alpha^(1/n)', () => {
    expect(clopperPearson(20, 20, 0.01)[0]).toBeCloseTo(0.01 ** (1 / 20), 9);
    expect(clopperPearson(20, 20, 0.01)[1]).toBe(1);
  });
  it('each bound sits where its tail mass equals alpha', () => {
    for (const [k, n] of [
      [15, 20],
      [74, 104],
      [133, 200],
      [3, 300],
    ] as const) {
      const [lo, hi] = clopperPearson(k, n, 0.01);
      expect(binomialCdf(k, n, hi)).toBeCloseTo(0.01, 6);
      expect(1 - binomialCdf(k - 1, n, lo)).toBeCloseTo(0.01, 6);
      expect(lo).toBeLessThan(k / n);
      expect(hi).toBeGreaterThan(k / n);
    }
  });
});

describe('the rate checks', () => {
  it('the nightly failures that prompted them: 77 of 104 against 80%, 14 of 19 against 80%', () => {
    // 0.7403846 over 104 activations (OP15-058 seed 2) and 0.7368421 over 19 (OP17-058 seed 1).
    expect(checkRateAtLeast(77, 104, 0.8).ok).toBe(true);
    expect(checkRateAtLeast(14, 19, 0.8).ok).toBe(true);
  });
  it('a collapse still fails: 40 of 104, 5 of 19 against 80%', () => {
    expect(checkRateAtLeast(40, 104, 0.8).ok).toBe(false);
    expect(checkRateAtLeast(5, 19, 0.8).ok).toBe(false);
  });
  it('the 12-game Warlord gate: 10 of 12 is fine, 6 of 12 is a break', () => {
    expect(checkRateAtLeast(10, 12, 10 / 12).ok).toBe(true);
    expect(checkRateAtLeast(9, 12, 10 / 12).ok).toBe(true);
    expect(checkRateAtLeast(4, 12, 10 / 12).ok).toBe(false);
  });
  it('at-most: a flag rate over the ceiling fails only when the lower bound is over it', () => {
    expect(checkRateAtMost(3, 300, 0.01).ok).toBe(true);
    expect(checkRateAtMost(5, 300, 0.01).ok).toBe(true);
    expect(checkRateAtMost(40, 300, 0.01).ok).toBe(false);
  });
  it('the message prints the rate, n, the bound and the target', () => {
    const m = checkRateAtLeast(40, 104, 0.8, { label: 'OP15-058 seed 2' }).message;
    expect(m).toContain('OP15-058 seed 2');
    expect(m).toContain('40/104');
    expect(m).toContain('38.5%');
    expect(m).toContain('99.0% one-sided upper bound');
    expect(m).toContain('at least 80.0%');
  });
  it('false alarms: with the true rate on the line, "at least" fails at most 1% of samples (exact)', () => {
    for (const n of [12, 19, 40, 104, 200])
      for (const p of [0.6, 0.8, 0.9, 0.95]) {
        let fail = 0;
        for (let k = 0; k <= n; k++)
          if (!checkRateAtLeast(k, n, p).ok) fail += binomialPmf(k, n, p);
        expect(fail, `n=${n} p=${p}`).toBeLessThanOrEqual(0.01 + 1e-9);
      }
  });
  it('false alarms: "at most" is the mirror image', () => {
    for (const n of [40, 300])
      for (const p of [0.01, 0.02, 0.5]) {
        let fail = 0;
        for (let k = 0; k <= n; k++) if (!checkRateAtMost(k, n, p).ok) fail += binomialPmf(k, n, p);
        expect(fail, `n=${n} p=${p}`).toBeLessThanOrEqual(0.01 + 1e-9);
      }
  });
  it('power: a rate 25 points under the line is caught at n = 100 almost always', () => {
    let caught = 0;
    for (let k = 0; k <= 100; k++)
      if (!checkRateAtLeast(k, 100, 0.8).ok) caught += binomialPmf(k, 100, 0.55);
    expect(caught).toBeGreaterThan(0.95);
  });
});

describe('quantile', () => {
  it('is nearest rank', () => {
    expect(quantile([5, 1, 3, 2, 4], 0.5)).toBe(3);
    expect(quantile([], 0.5)).toBe(0);
    expect(quantile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.95)).toBe(10);
  });
});
