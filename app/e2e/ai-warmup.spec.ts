/**
 * M10 WP3: the AI's worker starts when Setup opens and the game takes it (the per-push half of the
 * Warlord wait; the milliseconds are measured in `perf-frames.spec.ts` scenario e and the nightly,
 * docs/runbooks/testing.md). Counts of workers, not times: a worker exists on Setup before Start,
 * Start reuses it (no second AI worker), Rookie and hotseat start none, and switching the AI's deck
 * rebuilds (the warm worker is replaced, not leaked).
 *
 * Revert: delete the `useAiWarmUp` call in Setup.tsx (the first test fails: no worker before Start);
 * drop `{ adoptWarm: true }` in the controller (the second fails: a second worker at Start).
 */
import { expect, test, type Page } from '@playwright/test';
import { serveArt } from './game-support.ts';

const once = () =>
  test.skip(test.info().project.name !== '720p', 'a worker count is the same at both sizes');

/** The workers the page has had (a closed one is dropped from `page.workers()`). */
function watch(page: Page) {
  const seen: string[] = [];
  page.on('worker', (w) => seen.push(w.url()));
  return {
    seen,
    live: () => page.workers().filter((w) => /ai-worker/.test(w.url())).length,
    created: () => seen.filter((u) => /ai-worker/.test(u)).length,
  };
}

test('Setup starts the Warlord worker before Start, and Start reuses it', async ({ page }) => {
  once();
  test.setTimeout(120_000);
  await serveArt(page);
  const w = watch(page);
  await page.goto('./play?opp=warlord&aibudget=iterations&speed=4&skip=1');
  await expect(page.getByRole('heading', { name: 'New game' })).toBeVisible();
  // The warm-up waits for the decks' card data and a short debounce; a hang guard, not a bound.
  await expect.poll(w.created, { timeout: 30_000 }).toBe(1);
  expect(w.live()).toBe(1);
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.locator('#decision')).toBeVisible({ timeout: 30_000 });
  // The game's AI took the warm worker: still the one worker made, and it is still alive.
  expect(w.created()).toBe(1);
  expect(w.live()).toBe(1);
});

test('Rookie and a second player at this device start no AI worker on Setup', async ({ page }) => {
  once();
  await serveArt(page);
  const w = watch(page);
  await page.goto('./play?opp=rookie');
  await expect(page.getByRole('heading', { name: 'New game' })).toBeVisible();
  await page.waitForTimeout(1500);
  expect(w.created()).toBe(0);
  await page.getByRole('radio', { name: /Second player at this device/ }).check();
  await page.waitForTimeout(800);
  expect(w.created()).toBe(0);
});

test('changing the AI tier replaces the warm worker', async ({ page }) => {
  once();
  test.setTimeout(120_000);
  await serveArt(page);
  const w = watch(page);
  await page.goto('./play?opp=warlord');
  await expect.poll(w.created, { timeout: 30_000 }).toBe(1);
  // Pick another tier: the worker warmed for the Warlord is terminated, one for the Pirate is warmed.
  await page.getByRole('radio', { name: /Pirate AI/ }).check();
  await expect.poll(w.created, { timeout: 30_000 }).toBe(2);
  expect(w.live()).toBe(1);
});
