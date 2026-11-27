/**
 * The timer of one item (learning-ui §7.2): a thin bar and a number, each with its words, a Pause
 * button, and the option list. Nothing here ends an item: "Over time" is a label, and the answer is
 * still accepted. The polite announcement at 10 s left goes through `announce`.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DrillId } from '@optcg/ai';
import { clockWords, ItemTimer, limitSeconds, limitWords, TIMER_CHOICES } from './timer.ts';

const defaultNow = (): number => performance.now();

/** One `ItemTimer` per item (re-created when `itemKey` changes), driven by a 250 ms interval. */
export function useItemTimer(
  drill: DrillId,
  factor: number | null,
  itemKey: string,
  announce: (text: string) => void,
  now: () => number = defaultNow,
) {
  // One timer per item: a new key is a new clock (created and started in the memo, which is pure
  // enough: it holds no state of the page, only a clock reading).
  const timer = useMemo(() => {
    const t = new ItemTimer(drill, factor, now);
    t.start();
    return t;
    // `factor` is applied below, so changing it keeps the time already spent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey, drill, now]);
  const [, setBeat] = useState(0);
  const say = useRef(announce);
  useEffect(() => {
    say.current = announce;
    timer.setFactor(factor);
  });
  useEffect(() => {
    if (factor === null) return;
    const id = window.setInterval(() => {
      for (const e of timer.tick())
        say.current(e === 'ten-left' ? '10 seconds left.' : 'Over time. You can still answer.');
      setBeat((n) => n + 1);
    }, 250);
    return () => window.clearInterval(id);
  }, [timer, factor]);
  return timer;
}

export function TimerView({
  drill,
  timer,
  factor,
  onFactor,
}: {
  drill: DrillId;
  timer: ItemTimer;
  factor: number | null;
  onFactor?: ((f: number | null) => void) | undefined;
}) {
  const [, setBeat] = useState(0);
  const limit = limitSeconds(drill, factor);
  const left = timer.remaining();
  const over = timer.over;
  return (
    <div className="drill-timer">
      <label className="drill-timer-pick">
        <span>Time allowed</span>
        <select
          className="input"
          value={factor === null ? '' : String(factor)}
          onChange={(e) => onFactor?.(e.target.value === '' ? null : Number(e.target.value))}
          disabled={!onFactor}
          aria-describedby="drill-timer-words"
        >
          {TIMER_CHOICES.map((c) => (
            <option key={c.label} value={c.factor === null ? '' : String(c.factor)}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <span className="sr-only" id="drill-timer-words">
        {limitWords(drill, factor)}. Time never ends an item.
        {onFactor ? '' : ' The time allowed is fixed once you have answered an item.'}
        {timer.everPaused && factor !== null
          ? ' You paused on this item, so it will not count for the timed badge.'
          : ''}
      </span>
      {limit !== null && left !== null && (
        <>
          <span className="drill-timer-bar" aria-hidden="true">
            <span
              className={over ? 'drill-timer-fill over' : 'drill-timer-fill'}
              style={{ width: `${Math.round((left / limit) * 100)}%` }}
            />
          </span>
          <span className="drill-timer-num" data-testid="drill-timer">
            {over ? 'Over time' : `${clockWords(left)} left`}
            {timer.paused ? ' · paused' : ''}
            {timer.everPaused && !timer.paused ? ' · not counted for the badge' : ''}
          </span>
          <button
            type="button"
            className="btn small"
            aria-pressed={timer.paused}
            onClick={() => {
              if (timer.paused) timer.start();
              else timer.pause();
              setBeat((n) => n + 1);
            }}
          >
            {timer.paused ? 'Resume' : 'Pause'}
          </button>
        </>
      )}
    </div>
  );
}
