/** M10 WP0: the pure half of the frame recorder (no browser, no clock), re-exported by perf.ts. */

export interface LongTask {
  start: number;
  duration: number;
}
export interface FrameSummary {
  /** Frames recorded. */
  n: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  /** The share of frames longer than 25 ms (a missed 40 fps line), 0 to 1. */
  over25: number;
  long: LongTask[];
}

/** The p-th percentile (0 to 100) by linear interpolation between ranks; NaN for no values. */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const rank = (Math.min(100, Math.max(0, p)) / 100) * (s.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  return s[lo]! + (s[hi]! - s[lo]!) * (rank - lo);
}

/** Frame intervals (ms) and long tasks to the figures the specs assert and the benchmarks print. */
export function summarise(frames: readonly number[], long: readonly LongTask[] = []): FrameSummary {
  const round = (x: number) => Math.round(x * 100) / 100;
  return {
    n: frames.length,
    p50: round(percentile(frames, 50)),
    p95: round(percentile(frames, 95)),
    p99: round(percentile(frames, 99)),
    max: frames.length ? round(Math.max(...frames)) : NaN,
    over25: frames.length ? frames.filter((f) => f > 25).length / frames.length : NaN,
    long: [...long],
  };
}
