/**
 * M10 WP0: the frame-timing scaffold (WP3 fills in the scenarios). Off unless `PERF=1`
 * (`npm run perf:frames`), so a plain `playwright test` never does perf work. It records, asserts
 * nothing about speed unless `PERF_ASSERT=1` (the perf workflow, DECISIONS 2026-11-27 "Tests": the
 * wall-clock lines are measured with a fixed throttle and asserted only in the nightly half), and
 * writes `test-results/frames-<project>-<scenario>.json` whatever the verdict.
 *
 * The smoke scenario proves the recorder returns frames: the late-game scenario against Pirate at
 * speed 1 with iteration budgets, the player ends the turn at once, and the frames of the AI's turn
 * are summarised, at 4x CPU throttle.
 */
import { expect, test } from '@playwright/test';
import { nextDecision, resolveChoose, startGame } from './game-support.ts';
import {
  resetFrames,
  saveFrames,
  startFrames,
  stopFrames,
  throttle,
  trace,
} from './support/perf.ts';

test.skip(!process.env.PERF, 'PERF=1 switches the frame measurements on (npm run perf:frames)');

const RATE = 4;

test('smoke: the recorder returns frames for the AI turn of the late-game scenario at 4x', async ({
  page,
}, info) => {
  test.setTimeout(240_000);
  await startFrames(page);
  await throttle(page, RATE);
  await startGame(page, 'scenario=late&opp=pirate&speed=1&aibudget=iterations');
  const turns = async () =>
    ((await page.locator('main.play').getAttribute('data-ai-turns')) ?? '')
      .split(' ')
      .filter(Boolean).length;
  const summary = await trace(page, 'smoke-ai-turn', async () => {
    await resetFrames(page);
    // The player's turns end at once; the first completed AI turn closes the window.
    for (let i = 0; i < 400; i++) {
      const k = await nextDecision(page, 60_000);
      // The AI's turn is on record (its attacks asked the player to defend along the way): done.
      if (k === 'over' || (await turns()) >= 1) break;
      if (k === 'main') await page.locator('#endturn-btn').click();
      else if (k === 'block' || k === 'counter') await page.locator('#take-hit').click();
      else if (k === 'trigger') await page.locator('#trigger-hand').click();
      else if (k === 'optional') await page.locator('#skip-btn').click();
      else if (k === 'order') await page.locator('#order-0').click();
      else if (k === 'choose') await resolveChoose(page);
      else break;
    }
    return stopFrames(page);
  });
  const aiTurns = (await page.locator('main.play').getAttribute('data-ai-turns')) ?? '';
  saveFrames(info.project.name, 'smoke-ai-turn', RATE, summary);
  const line = `smoke ai-turn ${info.project.name} ${RATE}x: n ${summary.n}, p50 ${summary.p50}, p95 ${summary.p95}, p99 ${summary.p99}, max ${summary.max}, over25 ${(summary.over25 * 100).toFixed(1)}%, long tasks ${summary.long.length}, ai turns (turn:ms:speed:moves:thinkMs) ${aiTurns}`;
  info.annotations.push({ type: 'frames', description: line });
  console.log(line);
  expect(summary.n).toBeGreaterThan(0);
  expect(Number.isFinite(summary.p95)).toBe(true);
  if (process.env.PERF_ASSERT)
    // Scaffold bound only; WP3 states the real lines (observed, requirement and bound in the message).
    expect(
      summary.p95,
      `p95 ${summary.p95} ms at ${RATE}x: requirement 20, bound 30`,
    ).toBeLessThanOrEqual(30);
});
