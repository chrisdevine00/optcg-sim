/**
 * M10 WP0: the pure statistics of the frame recorder (app/e2e/support/perf-stats.ts) and of the
 * Lighthouse summary (scripts/lighthouse.ts). No browser, no clock. Revert: use the nearest rank
 * instead of interpolating, or count `>= 25` as over, and the exact-value cases fail.
 */
import { describe, expect, it } from 'vitest';
import { percentile, summarise } from '../e2e/support/perf-stats.ts';
import { median, summarise as lhSummarise } from '../../scripts/lighthouse.ts';

describe('percentile', () => {
  it('interpolates between ranks', () => {
    expect(percentile([10, 20, 30, 40], 50)).toBe(25);
    expect(percentile([10, 20, 30, 40], 0)).toBe(10);
    expect(percentile([10, 20, 30, 40], 100)).toBe(40);
    expect(percentile([0, 100], 95)).toBeCloseTo(95, 9);
  });
  it('does not depend on the order of the input, and does not mutate it', () => {
    const xs = [30, 10, 40, 20];
    expect(percentile(xs, 50)).toBe(25);
    expect(xs).toEqual([30, 10, 40, 20]);
  });
  it('is NaN for no values and the value for one', () => {
    expect(percentile([], 50)).toBeNaN();
    expect(percentile([16.7], 99)).toBe(16.7);
  });
  it('clamps p outside 0 to 100', () => {
    expect(percentile([1, 2, 3], 150)).toBe(3);
    expect(percentile([1, 2, 3], -5)).toBe(1);
  });
});

describe('summarise', () => {
  it('reports n, the percentiles, the max, the share over 25 ms and the long tasks', () => {
    const frames = [...Array<number>(96).fill(16.7), 30, 40, 60, 100];
    const s = summarise(frames, [{ start: 5, duration: 120 }]);
    expect(s.n).toBe(100);
    expect(s.p50).toBe(16.7);
    expect(s.max).toBe(100);
    expect(s.over25).toBeCloseTo(0.04, 9);
    expect(s.p99).toBeGreaterThan(s.p95);
    expect(s.long).toEqual([{ start: 5, duration: 120 }]);
  });
  it('counts exactly 25 ms as on time', () => {
    expect(summarise([25, 25.01]).over25).toBe(0.5);
  });
  it('has NaN figures and n 0 for an empty recording', () => {
    const s = summarise([]);
    expect(s.n).toBe(0);
    expect(s.p95).toBeNaN();
    expect(s.over25).toBeNaN();
  });
});

describe('the Lighthouse median (scripts/lighthouse.ts)', () => {
  it('takes the middle run, the mean of the middle two for an even count', () => {
    expect(median([90, 70, 80])).toBe(80);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
  it('summarises each metric on its own', () => {
    const run = (performance: number, lcp: number) => ({
      performance,
      accessibility: 100,
      bestPractices: 100,
      lcp,
      fcp: 1,
      tbt: 0,
      cls: 0,
      bytes: 1,
    });
    const s = lhSummarise([run(80, 900), run(90, 700), run(85, 1200)]);
    expect(s.median.performance).toBe(85);
    expect(s.median.lcp).toBe(900);
    expect([s.min.performance, s.max.performance]).toEqual([80, 90]);
  });
});
