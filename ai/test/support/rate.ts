/**
 * Vitest assertions over the confidence-interval checks in `stats.ts` (docs/runbooks/testing.md,
 * "Statistics"). Use these, never `expect(rate).toBeGreaterThanOrEqual(p)`, for a rate measured
 * over sampled games.
 */
import { expect } from 'vitest';
import { checkRateAtLeast, checkRateAtMost, type RateCheck, type RateOptions } from './stats.ts';

/** Fails only when the sample shows the true rate is below `target` (see `checkRateAtLeast`). */
export function expectRateAtLeast(
  hits: number,
  n: number,
  target: number,
  opts: RateOptions = {},
): RateCheck {
  const r = checkRateAtLeast(hits, n, target, opts);
  expect(r.ok, r.message).toBe(true);
  return r;
}

/** Fails only when the sample shows the true rate is above `target` (see `checkRateAtMost`). */
export function expectRateAtMost(
  hits: number,
  n: number,
  target: number,
  opts: RateOptions = {},
): RateCheck {
  const r = checkRateAtMost(hits, n, target, opts);
  expect(r.ok, r.message).toBe(true);
  return r;
}

/** A game-plan tally as the plan-tally modules produce it (hits of total qualifying situations). */
export interface PlanRate {
  leader: string;
  seed: number;
  text: string;
  threshold: number;
  hits: number;
  total: number;
}

/**
 * Every game-plan assertion over the sampled games, judged by `checkRateAtLeast` against its own
 * threshold. A tally with fewer than `minTotal` situations is not judged (as before). All failures
 * are reported together, not just the first.
 */
export function expectTalliesMeetThresholds(plan: readonly PlanRate[], minTotal = 10): void {
  const failures: string[] = [];
  for (const t of plan) {
    if (t.total < minTotal) continue;
    const r = checkRateAtLeast(t.hits, t.total, t.threshold, {
      label: `${t.leader} seed ${t.seed}: ${t.text}`,
    });
    if (!r.ok) failures.push(r.message);
  }
  expect(failures, failures.join('\n')).toEqual([]);
}
