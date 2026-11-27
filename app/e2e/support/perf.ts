/**
 * M10 WP0: the frame recorder the performance specs share (app/e2e/perf-frames.spec.ts, WP3).
 * `startFrames` records every animation frame's interval and every long task from the page's first
 * script; `throttle` slows the CPU through CDP; `stopFrames` summarises; `trace` saves a Chromium
 * trace. The statistics are pure (`percentile`, `summarise`) and unit-tested without a browser
 * (app/test/perf-stats.test.ts). Nothing here reads a clock for an assertion: the spec decides.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, type Page } from '@playwright/test';
import {
  frameStates,
  summarise,
  type FrameStates,
  type FrameSummary,
  type LongTask,
} from './perf-stats.ts';

export {
  frameStates,
  percentile,
  summarise,
  type FrameStates,
  type FrameSummary,
  type LongTask,
} from './perf-stats.ts';

declare global {
  interface Window {
    __frames?: number[];
    __long?: LongTask[];
    __recording?: boolean;
  }
}

/** Starts recording on every page load of this page (an init script), so a navigation keeps it. */
export async function startFrames(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__frames = [];
    window.__long = [];
    window.__recording = true;
    let last = performance.now();
    const tick = (t: number) => {
      if (window.__recording) window.__frames!.push(t - last);
      last = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    try {
      new PerformanceObserver((list) => {
        if (!window.__recording) return;
        for (const e of list.getEntries())
          window.__long!.push({ start: e.startTime, duration: e.duration });
      }).observe({ type: 'longtask', buffered: true });
    } catch {
      // Long-task entries are not supported: `long` stays empty.
    }
  });
}

/** Empties the buffers on the current page, so a scenario measures from here (after the settle). */
export async function resetFrames(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__frames = [];
    window.__long = [];
  });
}

/** Stops recording and returns the summary of what was recorded since start (or the last reset). */
export async function stopFrames(page: Page): Promise<FrameSummary> {
  const raw = await page.evaluate(() => {
    window.__recording = false;
    return { frames: window.__frames ?? [], long: window.__long ?? [] };
  });
  return summarise(raw.frames, raw.long);
}

const rates = new WeakMap<Page, number>();

/** CPU slowdown for this page (4 is the "mid-range laptop" line of the M10 plan); 1 turns it off. */
export async function throttle(page: Page, rate: number): Promise<void> {
  rates.set(page, rate);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
}

const TRACE_CATEGORIES = [
  'devtools.timeline',
  'disabled-by-default-devtools.timeline.frame',
  'cc',
  'viz',
  'blink.user_timing',
];

/**
 * Records a Chromium trace around `body` to `test-results/trace-<name>-<project>-<rate>x.json`
 * (the rate is the one `throttle` set, 1 if none). Call it inside a test: the project name comes
 * from the running test.
 */
export async function trace<T>(page: Page, name: string, body: () => Promise<T>): Promise<T> {
  const browser = page.context().browser();
  if (!browser) throw new Error('trace needs a browser launched by Playwright');
  mkdirSync('test-results', { recursive: true });
  const path = join(
    'test-results',
    `trace-${name}-${test.info().project.name}-${rates.get(page) ?? 1}x.json`,
  );
  await browser.startTracing(page, { path, categories: TRACE_CATEGORIES });
  try {
    return await body();
  } finally {
    await browser.stopTracing();
    // M10-R6: the compositor's frame states from the trace just written (reported, never asserted).
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as { traceEvents?: unknown[] };
      states.set(page, frameStates((raw.traceEvents ?? raw) as Parameters<typeof frameStates>[0]));
    } catch {
      states.delete(page);
    }
  }
}

const states = new WeakMap<Page, FrameStates>();

/** The frame states of the last `trace` on this page, or undefined when the trace could not be read. */
export function lastFrameStates(page: Page): FrameStates | undefined {
  return states.get(page);
}

/** Writes one scenario's result where the workflow uploads it, whatever the verdict. */
export function saveFrames(
  project: string,
  scenario: string,
  rate: number,
  s: FrameSummary,
  frameStates?: FrameStates,
): void {
  mkdirSync('test-results', { recursive: true });
  writeFileSync(
    join('test-results', `frames-${project}-${scenario}.json`),
    JSON.stringify({ project, scenario, rate, ...s, frameStates: frameStates ?? null }, null, 2) +
      '\n',
  );
}
