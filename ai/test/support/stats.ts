/**
 * Small statistics helpers for the strength gates, the game-plan tallies and the corpora.
 *
 * The rule (docs/runbooks/testing.md "Statistics"): a test never asserts `rate >= p` or `rate < p`
 * on a sample of games. It asks whether the sample is *evidence against* the target, at a stated
 * confidence (default one-sided 99%), using `checkRateAtLeast` and `checkRateAtMost`. A true
 * regression still fails (its interval sits wholly on the wrong side of the target); a sample that
 * merely lands a little under the line does not. Every message prints the observed rate, n, the
 * interval and the target, so a failure reads without opening the code.
 */

/** Wilson score interval for a binomial proportion, two-sided at `z` standard deviations (95% by default). */
export function wilson(wins: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 1];
  const p = wins / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const r = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - r) / d), Math.min(1, (c + r) / d)];
}

/** The `q` quantile (0..1) of `xs`, by nearest rank. */
export function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))]!;
}

/** The standard normal quantile (Acklam's rational approximation, relative error under 1.2e-9). */
export function normalQuantile(p: number): number {
  if (!(p > 0 && p < 1)) throw new RangeError(`normalQuantile needs 0 < p < 1, got ${p}`);
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  }
  if (p > 1 - lo) return -normalQuantile(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
    (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
  );
}

const LOG_FACT: number[] = [0];

/** ln(i!) for i = 0..n (one table, grown on demand). */
function logFactorials(n: number): number[] {
  for (let i = LOG_FACT.length; i <= n; i++) LOG_FACT.push(LOG_FACT[i - 1]! + Math.log(i));
  return LOG_FACT;
}

/** P(X <= k) for X ~ Binomial(n, p), summed exactly in log space. */
export function binomialCdf(k: number, n: number, p: number): number {
  if (k < 0) return 0;
  if (k >= n) return 1;
  if (p <= 0) return 1;
  if (p >= 1) return 0;
  const lf = logFactorials(n);
  let s = 0;
  const lp = Math.log(p);
  const lq = Math.log(1 - p);
  for (let i = 0; i <= k; i++) s += Math.exp(lf[n]! - lf[i]! - lf[n - i]! + i * lp + (n - i) * lq);
  return Math.min(1, s);
}

/** P(X = k) for X ~ Binomial(n, p). */
export function binomialPmf(k: number, n: number, p: number): number {
  if (k < 0 || k > n) return 0;
  const lf = logFactorials(n);
  return Math.exp(lf[n]! - lf[k]! - lf[n - k]! + k * Math.log(p) + (n - k) * Math.log(1 - p));
}

/** The smallest-first root of a monotone `f` on [0, 1] (f(0) and f(1) bracket `target`). */
function bisect(f: (p: number) => number, target: number): number {
  let lo = 0;
  let hi = 1;
  const increasing = f(1) > f(0);
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < target === increasing) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Clopper-Pearson (exact) bounds for `k` of `n`. `alpha` is the tail mass of each bound: pass
 * `1 - confidence` for a one-sided bound, `(1 - confidence) / 2` for a two-sided interval. The
 * upper bound is the p at which P(X <= k) falls to alpha; the lower, the p at which P(X >= k) does.
 */
export function clopperPearson(k: number, n: number, alpha: number): [number, number] {
  if (n === 0) return [0, 1];
  const upper = k >= n ? 1 : bisect((p) => binomialCdf(k, n, p), alpha);
  const lower = k <= 0 ? 0 : bisect((p) => 1 - binomialCdf(k - 1, n, p), alpha);
  return [lower, upper];
}

export interface RateOptions {
  /** One-sided confidence that a failure is a real shortfall (default 0.99). */
  confidence?: number;
  /** What the sample is, for the message ("OP15-058 seed 2: ..."). */
  label?: string;
}

export interface RateCheck {
  ok: boolean;
  rate: number;
  hits: number;
  n: number;
  /** The bound that decides: the upper one for "at least", the lower one for "at most" (Clopper-Pearson). */
  bound: number;
  /** The Wilson bound at the same one-sided confidence, for comparison in the message. */
  wilsonBound: number;
  confidence: number;
  message: string;
}

const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;

function describe(
  kind: 'at least' | 'at most',
  ok: boolean,
  hits: number,
  n: number,
  target: number,
  bound: number,
  wilsonBound: number,
  confidence: number,
  label: string | undefined,
): string {
  const side = kind === 'at least' ? 'upper' : 'lower';
  const verdict = ok
    ? 'not evidence against the target'
    : kind === 'at least'
      ? `even the optimistic end is under the target, so the rate is below it`
      : `even the pessimistic end is over the target, so the rate is above it`;
  return (
    `${label ? `${label}: ` : ''}observed ${hits}/${n} = ${pct(n ? hits / n : 0)}; ` +
    `${pct(confidence)} one-sided ${side} bound ${pct(bound)} (Clopper-Pearson; Wilson ${pct(wilsonBound)}) ` +
    `against a target of ${kind} ${pct(target)}: ${verdict}`
  );
}

/**
 * Is the true rate at least `target`? Fails only when the one-sided `confidence` upper bound of
 * `hits / n` is below `target`: the sample is evidence the rate is under the line, not a sample
 * that happened to land under it. With a true rate at the target this fails at most
 * `1 - confidence` of the time (exactly, by Clopper-Pearson), whatever n is.
 */
export function checkRateAtLeast(
  hits: number,
  n: number,
  target: number,
  opts: RateOptions = {},
): RateCheck {
  const confidence = opts.confidence ?? 0.99;
  const alpha = 1 - confidence;
  const [, hi] = clopperPearson(hits, n, alpha);
  const [, wHi] = wilson(hits, n, normalQuantile(confidence));
  const ok = hi >= target - 1e-12;
  return {
    ok,
    rate: n ? hits / n : 0,
    hits,
    n,
    bound: hi,
    wilsonBound: wHi,
    confidence,
    message: describe('at least', ok, hits, n, target, hi, wHi, confidence, opts.label),
  };
}

/** Is the true rate at most `target`? Fails only when the one-sided lower bound of `hits / n` is above it. */
export function checkRateAtMost(
  hits: number,
  n: number,
  target: number,
  opts: RateOptions = {},
): RateCheck {
  const confidence = opts.confidence ?? 0.99;
  const alpha = 1 - confidence;
  const [lo] = clopperPearson(hits, n, alpha);
  const [wLo] = wilson(hits, n, normalQuantile(confidence));
  const ok = lo <= target + 1e-12;
  return {
    ok,
    rate: n ? hits / n : 0,
    hits,
    n,
    bound: lo,
    wilsonBound: wLo,
    confidence,
    message: describe('at most', ok, hits, n, target, lo, wLo, confidence, opts.label),
  };
}
