/**
 * The drill timer (M9 WP4; learning-ui §7.2). Timing is off by default and never gates anything:
 * "Over time" does not end the item, and an answer given after it still counts for the untimed
 * exit. The factor list is the one the Settings page and every start screen show: Untimed, 50%,
 * 100%, 200%, 400%, 1000% of the base time, and the base times are the curriculum's optional timed
 * criteria, kept in this one table. The clock is injected (`now`), so tests run on a fake one.
 */
import type { DrillId } from '@optcg/ai';

/** Seconds per item at 100%: the "each within N seconds" of the lesson's optional timed exit. */
export const BASE_SECONDS: Record<DrillId, number> = {
  mulligan: 10, // L12: "decide in ten seconds"
  lethal: 60, // L15: PROMPT.md's example criterion
  counter: 30, // L10
  don: 45, // L09
};

/** The option list, in order. `null` is Untimed. The value is the factor, the label the percentage. */
export const TIMER_CHOICES: readonly { factor: number | null; label: string }[] = [
  { factor: null, label: 'Untimed' },
  { factor: 0.5, label: '50%' },
  { factor: 1, label: '100%' },
  { factor: 2, label: '200%' },
  { factor: 4, label: '400%' },
  { factor: 10, label: '1000%' },
];

/** Seconds allowed for an item: the base time times the factor; null when untimed. */
export const limitSeconds = (drill: DrillId, factor: number | null): number | null =>
  factor === null ? null : BASE_SECONDS[drill] * factor;

/** "Time allowed: 600 s (1000% of 60 s)" for the start screen and the timer's own label. */
export const limitWords = (drill: DrillId, factor: number | null): string => {
  const limit = limitSeconds(drill, factor);
  return limit === null
    ? 'Untimed'
    : `${Math.round(limit * 10) / 10} s per item (${Math.round((factor ?? 0) * 100)}% of ${BASE_SECONDS[drill]} s)`;
};

export const factorOfPercent = (percent: number | undefined): number | null => {
  if (percent === undefined) return null;
  const f = percent / 100;
  return TIMER_CHOICES.some((c) => c.factor === f) ? f : null;
};

export type TimerEvent = 'ten-left' | 'over';

/**
 * One item's clock. `tick()` returns the events that became true since the last tick, so the screen
 * announces "10 seconds left" and "Over time" once each. Pausing stops the clock and hides nothing;
 * changing the factor mid-item moves the limit, never the time already spent.
 */
export class ItemTimer {
  private spent = 0;
  private startedAt: number | null = null;
  private said = new Set<TimerEvent>();

  constructor(
    private readonly drill: DrillId,
    private factor: number | null,
    private readonly now: () => number,
  ) {}

  get factorNow(): number | null {
    return this.factor;
  }

  setFactor(factor: number | null): void {
    this.factor = factor;
  }

  start(): void {
    this.startedAt ??= this.now();
  }

  pause(): void {
    if (this.startedAt === null) return;
    this.spent += this.now() - this.startedAt;
    this.startedAt = null;
  }

  get paused(): boolean {
    return this.startedAt === null;
  }

  /** Milliseconds on this item so far, paused time excluded. */
  elapsedMs(): number {
    return this.spent + (this.startedAt === null ? 0 : this.now() - this.startedAt);
  }

  /** Seconds left (never below 0), or null when untimed. */
  remaining(): number | null {
    const limit = limitSeconds(this.drill, this.factor);
    return limit === null ? null : Math.max(0, limit - this.elapsedMs() / 1000);
  }

  get over(): boolean {
    const limit = limitSeconds(this.drill, this.factor);
    return limit !== null && this.elapsedMs() / 1000 >= limit;
  }

  /** Was an answer given now within the time? Always true when untimed. */
  withinTime(): boolean {
    return !this.over;
  }

  tick(): TimerEvent[] {
    const out: TimerEvent[] = [];
    const left = this.remaining();
    const limit = limitSeconds(this.drill, this.factor);
    if (left === null || limit === null) return out;
    // A limit of 10 s or less has no separate warning: there is nothing before it to warn about.
    if (limit > 10 && left <= 10 && left > 0 && !this.said.has('ten-left')) {
      this.said.add('ten-left');
      out.push('ten-left');
    }
    if (this.over && !this.said.has('over')) {
      this.said.add('over');
      out.push('over');
    }
    return out;
  }
}

/** "0:42" for the visible number. */
export const clockWords = (seconds: number): string => {
  const s = Math.ceil(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
