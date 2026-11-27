/**
 * M10 WP3: the frame-timing measurements (the scaffold is WP0's, `app/e2e/support/perf.ts`). Off
 * unless `PERF=1` (`npm run perf:frames`), so a plain `playwright test` never does perf work. A
 * scenario records every animation frame's interval and every long task of its window with the CPU
 * slowed 4x through CDP (the mid-range-laptop line of the M10 plan), then once at 1x, saves a
 * Chromium trace, and writes `test-results/frames-<project>-<scenario>.json` and a console line
 * whatever the verdict.
 *
 * The scenarios (docs/design/m10-plan.md, specs WP3):
 *   a. the AI's 13-move turn of `scenario=late` at speed 1 (the animation queue at full pace);
 *   b. a human turn by keyboard: play a card, DON!! x2, an attack, the AI's counter-attack, a counter
 *      decision answered, resolved;
 *   c. the review timeline: a wheel scroll across the 300-decision game and the flag-stepping key;
 *   d. the hand fan: hover and focus moving along the hand.
 *   e. (information) the AI's wait on the worker at 1x with real millisecond budgets, split into
 *      transfer, setup and search from the `ai:request` measures the client writes.
 *
 * Nothing asserts a speed unless `PERF_ASSERT=1` (the perf workflow; docs/runbooks/testing.md
 * section 2, DECISIONS 2026-11-27 "Tests"). The assertion is the bound, 1.5 times the requirement,
 * and its message prints the observed value, the requirement and the bound:
 *   at 4x: p95 <= 30 ms (requirement 20), p99 <= 50 (34), over 25 ms in <= 3% of frames (2%), no
 *   long task over 150 ms (100); at 1x: p99 <= 30 ms (20).
 * The per-push half is the mechanism: app/test/ai-pacing.test.ts, memo-stable.test.ts.
 *
 * What the figures are (M10-R6): the animation-frame intervals are MAIN-THREAD frame cadence at 4x CPU
 * on a software compositor, not a count of frames the screen showed. Each scenario therefore also
 * reports `frameStates` from its Chromium trace (compositor frames presented in full, presented
 * partially because the main thread's update missed the deadline, and dropped). Reported, never asserted.
 */
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { decisionKind, nextDecision, resolveChoose, startGame } from './game-support.ts';
import { fixture, load, status } from './review-m8-support.ts';
import {
  calibratedRate,
  cpuBenchMs,
  REFERENCE_BENCH_MS,
  resetFrames,
  lastFrameStates,
  saveFrames,
  startFrames,
  stopFrames,
  throttle,
  trace,
  type FrameSummary,
} from './support/perf.ts';

test.skip(!process.env.PERF, 'PERF=1 switches the frame measurements on (npm run perf:frames)');

/** CPU slowdowns measured: 4 (the line) and 1; `PERF_RATES=8,12` sweeps higher for headroom (never asserted). */
const RATES = (process.env.PERF_RATES ?? '4,1').split(',').map(Number);

/** The requirement and its nightly bound (1.5x), per rate. */
const LINES = {
  4: { p95: [20, 30], p99: [34, 50], over25: [0.02, 0.03], long: [100, 150] },
  1: { p99: [20, 30] },
} as const;

function verdict(rate: number, s: FrameSummary): string[] {
  const out: string[] = [];
  const longest = Math.max(0, ...s.long.map((l) => l.duration));
  if (rate === 4) {
    const L = LINES[4];
    if (s.p95 > L.p95[1])
      out.push(`p95 ${s.p95} ms at 4x: requirement ${L.p95[0]}, bound ${L.p95[1]}`);
    if (s.p99 > L.p99[1])
      out.push(`p99 ${s.p99} ms at 4x: requirement ${L.p99[0]}, bound ${L.p99[1]}`);
    if (s.over25 > L.over25[1])
      out.push(
        `over25 ${(s.over25 * 100).toFixed(1)}% at 4x: requirement ${L.over25[0] * 100}%, bound ${L.over25[1] * 100}%`,
      );
    if (longest > L.long[1])
      out.push(`long task ${longest} ms at 4x: requirement ${L.long[0]}, bound ${L.long[1]}`);
  } else if (rate === 1) {
    const L = LINES[1];
    if (s.p99 > L.p99[1])
      out.push(`p99 ${s.p99} ms at 1x: requirement ${L.p99[0]}, bound ${L.p99[1]}`);
  }
  return out;
}

/** Writes, prints and (with PERF_ASSERT) asserts one scenario's result. */
function report(
  info: TestInfo,
  page: Page,
  scenario: string,
  rate: number,
  s: FrameSummary,
  calibration?: { hostBenchMs: number; referenceBenchMs: number; appliedRate: number },
): void {
  // M10-R6: the compositor's frame states from the trace, reported with the figures, never asserted.
  const fs = lastFrameStates(page);
  saveFrames(info.project.name, `${scenario}-${rate}x`, rate, s, fs, calibration);
  const longest = Math.max(0, ...s.long.map((l) => l.duration));
  const states = fs
    ? `, compositor frames ${fs.produced} (partial ${(fs.partialShare * 100).toFixed(1)}%, dropped ${(fs.droppedShare * 100).toFixed(1)}%)`
    : '';
  const cal = calibration
    ? ` (calibrated: host bench ${calibration.hostBenchMs.toFixed(1)} ms vs reference ${calibration.referenceBenchMs} ms, CDP rate ${calibration.appliedRate})`
    : '';
  const line = `${scenario} ${info.project.name} ${rate}x${cal}: n ${s.n}, p50 ${s.p50}, p95 ${s.p95}, p99 ${s.p99}, max ${s.max}, over25 ${(s.over25 * 100).toFixed(1)}%, long tasks ${s.long.length} (longest ${Math.round(longest)} ms)${states}`;
  info.annotations.push({ type: 'frames', description: line });
  console.log(line);
  expect(s.n, `${scenario}: the recorder returned no frames`).toBeGreaterThan(0);
  expect(Number.isFinite(s.p95)).toBe(true);
  if (process.env.PERF_ASSERT) expect(verdict(rate, s), line).toEqual([]);
}

/** Starts a fresh page with the recorder and the throttle on; the scenario runs in `body`. */
async function measured(
  page: Page,
  info: TestInfo,
  scenario: string,
  rate: number,
  open: () => Promise<void>,
  body: () => Promise<void>,
): Promise<void> {
  await startFrames(page);
  // PERF_CALIBRATE (the hosted perf job): "4x" means the reference machine slowed 4 times, so the
  // CDP rate is scaled by this host's measured speed (M10 release gate, DECISIONS "M10 release").
  let calibration:
    { hostBenchMs: number; referenceBenchMs: number; appliedRate: number } | undefined;
  if (process.env.PERF_CALIBRATE && rate > 1) {
    await page.goto('about:blank');
    const hostBenchMs = await cpuBenchMs(page);
    calibration = {
      hostBenchMs,
      referenceBenchMs: REFERENCE_BENCH_MS,
      appliedRate: calibratedRate(rate, hostBenchMs),
    };
  }
  await throttle(page, calibration?.appliedRate ?? rate);
  await open();
  const s = await trace(page, scenario, async () => {
    await resetFrames(page);
    await body();
    return stopFrames(page);
  });
  report(info, page, scenario, rate, s, calibration);
}

const turns = async (page: Page) =>
  ((await page.locator('main.play').getAttribute('data-ai-turns')) ?? '').split(' ').filter(Boolean)
    .length;

/** Answers whatever the board asks, taking the hit, by the shortest keyboard-free route. */
async function answer(page: Page, k: string): Promise<boolean> {
  if (k === 'main') await page.locator('#endturn-btn').click();
  else if (k === 'chooseFirst') await page.locator('#first-btn').click();
  else if (k === 'mulligan') await page.locator('#keep-btn').click();
  else if (k === 'block' || k === 'counter') await page.locator('#take-hit').click();
  else if (k === 'trigger') await page.locator('#trigger-hand').click();
  else if (k === 'optional') await page.locator('#skip-btn').click();
  else if (k === 'order') await page.locator('#order-0').click();
  else if (k === 'choose') await resolveChoose(page);
  else return false;
  return true;
}

const active = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return { id: el?.id ?? '', cls: el?.className ?? '', glyph: el?.dataset.glyph ?? '' };
  });

async function focusZone(page: Page, key: string, test: (a: { cls: string }) => boolean) {
  await page.keyboard.press('g');
  await page.keyboard.press(key);
  for (let i = 0; i < 12; i++) {
    if (test(await active(page))) return true;
    await page.keyboard.press('ArrowRight');
  }
  return false;
}

// a. ----------------------------------------------------------------------------------------------
for (const rate of RATES) {
  test(`a. the AI's 13-move turn of the late-game scenario at ${rate}x`, async ({ page }, info) => {
    test.setTimeout(300_000);
    await measured(
      page,
      info,
      'ai-turn',
      rate,
      () => startGame(page, 'scenario=late&opp=pirate&speed=1&aibudget=iterations'),
      async () => {
        // The player's turns end at once; the first completed AI turn closes the window.
        for (let i = 0; i < 400; i++) {
          const k = await nextDecision(page, 60_000);
          if (k === 'over' || (await turns(page)) >= 1) break;
          if (!(await answer(page, k))) break;
        }
      },
    );
  });
}

// b. ----------------------------------------------------------------------------------------------
for (const rate of RATES) {
  test(`b. a human turn by keyboard at ${rate}x: play, DON!! x2, attack, counter, resolve`, async ({
    page,
  }, info) => {
    test.setTimeout(300_000);
    await measured(
      page,
      info,
      'human-turn',
      rate,
      () => startGame(page, 'scenario=late&opp=pirate&speed=1&aibudget=iterations'),
      async () => {
        await nextDecision(page, 60_000);
        await page.waitForTimeout(200);
        // Play the first playable hand card: focus the hand, Enter opens its menu, Enter plays.
        await page.keyboard.press('g');
        await page.keyboard.press('h');
        for (let i = 0; i < 8; i++) {
          const a = await active(page);
          if (a.glyph === 'play') break;
          await page.keyboard.press('ArrowRight');
        }
        await page.keyboard.press('Enter');
        const play = page.getByRole('menuitem', { name: /^Play/ });
        if (await play.count()) {
          await page.keyboard.press('Enter');
          await nextDecision(page);
          if ((await decisionKind(page)) === 'choose') await resolveChoose(page);
        } else await page.keyboard.press('Escape');
        // DON!! x2 on the Leader, then the Leader attacks theirs.
        await focusZone(page, 'l', (a) => a.cls.includes('bc-leader'));
        await page.keyboard.press('+');
        await expect(page.getByRole('dialog', { name: /Give DON!!/ })).toBeVisible();
        await page.keyboard.press('2');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
        await focusZone(page, 'l', (a) => a.cls.includes('bc-leader'));
        await page.keyboard.press('a');
        // One target: straight to the confirm step; with a choice, Enter on their Leader picks it.
        await page.waitForTimeout(150);
        if (!(await page.locator('#confirm-attack').isVisible()))
          await page.keyboard.press('Enter');
        await expect(page.locator('#confirm-attack')).toBeVisible();
        await page.keyboard.press('Enter');
        for (let i = 0; i < 30; i++) {
          const k = await nextDecision(page, 60_000);
          if (k === 'main') break;
          if (!(await answer(page, k))) break;
        }
        // End the turn; the AI attacks and the player answers a counter decision with a counter
        // card when one is on offer, else takes the hit.
        let counters = 0;
        for (let i = 0; i < 200; i++) {
          const k = await nextDecision(page, 60_000);
          if (k === 'over') break;
          if (k === 'main') {
            if ((await turns(page)) >= 1) break;
            await page.keyboard.press('e');
          } else if (k === 'counter' && counters === 0) {
            const card = page.locator('[data-zone="hand"][data-glyph="counter"]').first();
            if (await card.count()) {
              await card.focus();
              await page.keyboard.press('Enter');
              const use = page.getByRole('menuitem', { name: /Counter|Use/ }).first();
              if (await use.count()) await page.keyboard.press('Enter');
              counters++;
              continue;
            }
            await page.locator('#take-hit').click();
          } else if (!(await answer(page, k))) break;
        }
        // The turn was what it says it is: a card played, DON!! given, an attack made (the numbers of
        // a turn that did nothing would be empty).
        const log = (await page.locator('.log-list').innerText()).replace(/\s+/g, ' ');
        expect(log).toMatch(/Play /);
        expect(log).toMatch(/Give 2 DON!!/);
        expect(log).toMatch(/attacks their Leader/);
      },
    );
  });
}

// c. ----------------------------------------------------------------------------------------------
for (const rate of RATES) {
  test(`c. the review timeline scroll and flag stepping at ${rate}x`, async ({ page }, info) => {
    test.setTimeout(300_000);
    const { game } = fixture();
    await startFrames(page);
    await throttle(page, rate);
    // The planted game goes straight into the store, and the analysis is allowed to finish first
    // (the scroll is the timeline's, not the analysis worker pool's).
    await load(page, [game], `./reviews/${game.id}`);
    await expect(status(page)).toContainText(/flags?|no flags found/, { timeout: 150_000 });
    await expect(status(page)).not.toContainText('Analysing', { timeout: 150_000 });
    const tl = page.locator('.rv-tl');
    await expect(tl).toBeVisible();
    const s = await trace(page, 'review-scroll', async () => {
      await resetFrames(page);
      const box = (await tl.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      const reach = () =>
        tl.evaluate((el) => {
          let best = 0;
          for (let n: HTMLElement | null = el as HTMLElement; n; n = n.parentElement)
            best = Math.max(best, n.scrollLeft);
          return best;
        });
      let far = 0;
      for (let i = 0; i < 40; i++) {
        await page.mouse.wheel(i < 20 ? 220 : -220, 0);
        await page.waitForTimeout(16);
        far = Math.max(far, await reach());
      }
      // The timeline really moved (a scroll that did nothing would measure nothing).
      expect(far, 'the review timeline did not scroll').toBeGreaterThan(0);
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('n');
        await page.waitForTimeout(120);
      }
      return stopFrames(page);
    });
    report(info, page, 'review-scroll', rate, s);
  });
}

// d. ----------------------------------------------------------------------------------------------
for (const rate of RATES) {
  test(`d. the hand fan: hover and focus moving along the hand at ${rate}x`, async ({
    page,
  }, info) => {
    test.setTimeout(300_000);
    await measured(
      page,
      info,
      'hand-fan',
      rate,
      () => startGame(page, 'scenario=late&opp=pirate&speed=1&aibudget=iterations'),
      async () => {
        await nextDecision(page, 60_000);
        await page.waitForTimeout(300);
        const cards = page.locator('.bc-hand');
        const n = await cards.count();
        for (let pass = 0; pass < 4; pass++)
          for (let i = 0; i < n; i++) {
            const idx = pass % 2 ? n - 1 - i : i;
            const box = await cards.nth(idx).boundingBox();
            if (box)
              await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
            await page.waitForTimeout(60);
          }
        await page.keyboard.press('g');
        await page.keyboard.press('h');
        for (let i = 0; i < 16; i++) {
          await page.keyboard.press(i < 8 ? 'ArrowRight' : 'ArrowLeft');
          await page.waitForTimeout(60);
        }
      },
    );
  });
}

// e. ----------------------------------------------------------------------------------------------
test('e. the AI wait on the worker at 1x with real budgets, split into parts (information)', async ({
  page,
}, info) => {
  test.skip(info.project.name !== '720p', 'one pass is enough');
  test.setTimeout(420_000);
  const query = process.env.PERF_AI_QUERY ?? 'seed=31&first=me&opp=warlord&speed=1';
  await startGame(page, query);
  const want = Number(process.env.PERF_AI_TURNS ?? 4);
  for (let i = 0; i < 1500 && (await turns(page)) < want; i++) {
    const k = await nextDecision(page, 90_000);
    if (k === 'over') break;
    if (!(await answer(page, k))) break;
  }
  const split = await page.evaluate(() =>
    performance
      .getEntriesByName('ai:request')
      .map((e) => (e as PerformanceMeasure).detail as Record<string, number | string>),
  );
  const aiTurns = (await page.locator('main.play').getAttribute('data-ai-turns')) ?? '';
  mkdirSync('test-results', { recursive: true });
  writeFileSync(
    `test-results/ai-wait-${info.project.name}.json`,
    JSON.stringify({ query, aiTurns, requests: split }, null, 2) + '\n',
  );
  console.log(`ai wait ${query}: ai turns ${aiTurns}; ${split.length} requests measured`);
  expect(split.length).toBeGreaterThan(0);
});
