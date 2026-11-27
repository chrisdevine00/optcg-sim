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

/**
 * M10-R6: what the compositor did with each frame it produced, read from a Chromium trace. The
 * animation-frame intervals above see the main thread only; a `PipelineReporter` event carries the
 * pipeline's own verdict for a frame: presented in full, presented partially (the main thread's
 * update missed the deadline and the compositor drew the old content), or dropped. Frames with no
 * update wanted are not counted: nothing was asked of them.
 */
export interface FrameStates {
  /** Frames that produced output: full + partial + dropped. */
  produced: number;
  full: number;
  /** Presented without the main thread's update. */
  partial: number;
  dropped: number;
  /** partial / produced and dropped / produced, 0 to 1 (NaN for no frames). */
  partialShare: number;
  droppedShare: number;
}

interface TraceEvent {
  name?: string;
  ph?: string;
  args?: { frame_reporter?: { state?: string } };
}

/** Counts the `PipelineReporter` begin events by state; pure, so a test feeds it synthetic events. */
export function frameStates(events: readonly TraceEvent[]): FrameStates {
  let full = 0;
  let partial = 0;
  let dropped = 0;
  for (const e of events) {
    if (e.name !== 'PipelineReporter' || e.ph !== 'b') continue;
    const state = e.args?.frame_reporter?.state;
    if (state === 'STATE_PRESENTED_ALL') full++;
    else if (state === 'STATE_PRESENTED_PARTIAL') partial++;
    else if (state === 'STATE_DROPPED') dropped++;
  }
  const produced = full + partial + dropped;
  const share = (n: number) => (produced ? Math.round((n / produced) * 10_000) / 10_000 : NaN);
  return {
    produced,
    full,
    partial,
    dropped,
    partialShare: share(partial),
    droppedShare: share(dropped),
  };
}

/**
 * The CPU benchmark's median on the reference machine (Apple M4 Pro, Chromium 156, 2026-11-27):
 * `cpuBenchMs` below, 8.7 ms. A host that takes longer is slower than the reference.
 */
export const REFERENCE_BENCH_MS = 8.7;

/**
 * The CDP throttle that makes this host behave like the reference machine slowed by `nominal`.
 * Chrome's throttle multiplies the host's own speed, so on a host k times slower than the
 * reference, `nominal / k` gives the same target device (never below 1: a slower host than the
 * target cannot be sped up). Off unless PERF_CALIBRATE is set (the reference runs are uncalibrated).
 */
export function calibratedRate(nominal: number, hostMs: number, reference = REFERENCE_BENCH_MS) {
  if (nominal <= 1) return 1;
  return Math.max(1, Math.round(((nominal * reference) / hostMs) * 10) / 10);
}
