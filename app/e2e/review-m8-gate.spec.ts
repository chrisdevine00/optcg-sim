/**
 * M8 WP7: the 60 s gate and the live-board rule, on the production build.
 *
 * - The 300-decision game (scripts/review-fixture.ts, built in globalSetup) is analysed in the real
 *   worker pool inside 60 s, with "Analysing turn n of N" on screen while it runs and a finished
 *   summary after. The time is written to `.cache/m8wp7/gate-<project>.txt`.
 * - While a board is live (Play from here, Practice) the review says nothing: no progress, no
 *   "Review ready", in the review's own status region or the app's polite region.
 */
import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { fixture, load, planted, status } from './review-m8-support.ts';

const REVIEW_WORDS = /Analysing turn|Review ready|Review\. \d/;

test('the 300-decision review finishes inside 60 s, with progress on screen', async ({
  page,
}, info) => {
  test.setTimeout(150_000);
  const { decisions, game } = fixture();
  expect(decisions).toBeGreaterThanOrEqual(300);
  await load(page, [game]);
  // Everything the status line says, from before the page is asked to open the game.
  await page.addInitScript(() => {
    const seen = new Set<string>();
    (window as unknown as { __seen: Set<string> }).__seen = seen;
    new MutationObserver(() => {
      const t = document.querySelector('[data-testid="review-status"]')?.textContent;
      if (t) seen.add(t.replace(/\d+ flags?.*/, 'N flags'));
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  const t0 = Date.now();
  await page.goto(`./reviews/${game.id}`);
  await expect(status(page)).toContainText(/Analysing turn \d+ of \d+/, { timeout: 20_000 });
  await expect(status(page)).not.toContainText('Analysing', { timeout: 60_000 });
  const ms = Date.now() - t0;
  const seen = await page.evaluate(() => [
    ...(window as unknown as { __seen: Set<string> }).__seen,
  ]);
  const progress = seen.filter((t) => /^Analysing turn \d+ of \d+/.test(t));
  const text = await status(page).innerText();
  writeFileSync(
    `.cache/m8wp7/gate-${info.project.name}.txt`,
    `${decisions} decisions, analysed in ${(ms / 1000).toFixed(1)} s, ${progress.length} progress lines; final: ${text}\n`,
  );
  expect(ms).toBeLessThan(60_000);
  expect(progress.length).toBeGreaterThan(0);
  // A finished review says what it found, never "Analysing", and is saved.
  expect(text).toMatch(/flags?|no flags found/);
});

test('no review announcement while a board is live (Play from here)', async ({ page }) => {
  test.setTimeout(150_000);
  const { game } = fixture();
  await load(page, [game], `./reviews/${game.id}`);
  await expect(status(page)).toContainText(/Analysing turn \d+ of \d+/, { timeout: 20_000 });
  // Choose one of your turns while the analysis is still running, and play from there.
  const cell = page.locator('[data-cell$="-you"]:not([data-cell^="0-"])').first();
  await cell.click();
  await page.locator('#play-from-btn').click();
  await expect(page.locator('#decision')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#announce-polite')).toContainText('Playing from turn');
  // The board is live: the review's region is gone, and nothing of the review is spoken. Wait
  // longer than a progress step takes.
  const polite = page.locator('#announce-polite');
  await page.waitForTimeout(4000);
  await expect(page.getByTestId('review-announce')).toHaveCount(0);
  await expect(polite).not.toContainText(REVIEW_WORDS);
  await expect(page.locator('#announce-assertive')).not.toContainText(REVIEW_WORDS);
});

test('no review announcement while a board is live (Practice)', async ({ page }) => {
  const g = planted()['missed-lethal']!;
  await load(page, [g], `./reviews/${g.id}`);
  await expect(status(page)).toHaveText('1 flag · 1 severe', { timeout: 45_000 });
  await page.locator('#practice-btn').click();
  await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'main', {
    timeout: 15_000,
  });
  await expect(page.locator('#announce-polite')).toContainText('Practice: turn 9 as it stood.');
  await page.waitForTimeout(3000);
  await expect(page.getByTestId('review-announce')).toHaveCount(0);
  await expect(page.locator('#announce-polite')).not.toContainText(REVIEW_WORDS);
});
