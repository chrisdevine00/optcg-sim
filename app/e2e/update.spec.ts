/**
 * M6b-6 app updates (ARCHITECTURE §5): the production service worker precaches the app shell; a new
 * deploy installs and waits; the page shell offers "Reload to update" (never the game screen), and
 * accepting it swaps to the new build. A new deploy is simulated by rewriting sw.js with another build id.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// The preview server serves app/dist; a "deploy" rewrites its sw.js (Playwright routing does not see
// the browser's own fetch of a worker script). One resolution only, so two runs never share the file.
const SW = new URL('../dist/sw.js', import.meta.url);

test.use({ serviceWorkers: 'allow' });

test('a new build shows the update prompt off the game screen, and Reload swaps to it', async ({
  page,
}, info) => {
  test.skip(info.project.name !== '720p', 'rewrites the served sw.js; one resolution only');
  await page.goto('./decks');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
    timeout: 15_000,
  });
  const version = (await (await page.request.get('./version.json')).json()) as {
    build: string;
    cardsThrough: string;
    metaAsOf: string;
  };
  expect(version.cardsThrough).toMatch(/^OP-\d+$/);
  expect(version.metaAsOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  // The shell is precached under this build's id.
  await expect
    .poll(() => page.evaluate(() => caches.keys()), { timeout: 15_000 })
    .toContain(`optcg-shell-${version.build}`);
  await expect(page.locator('.update-prompt')).toHaveCount(0);

  // "Deploy" a new build: the same worker with another id.
  const original = readFileSync(SW, 'utf8');
  expect(original).toContain(version.build);
  const NEXT = 'e2e0000next0';
  writeFileSync(SW, original.split(version.build).join(NEXT));
  try {
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg!.update();
    });
    const prompt = page.locator('.update-prompt');
    await expect(prompt).toBeVisible({ timeout: 20_000 });
    await expect(prompt).toContainText('A new version of the app is ready');

    // Never on the game screen.
    await page.goto('./play');
    await expect(page.locator('h1')).toHaveText('New game');
    await expect(page.locator('.update-prompt')).toHaveCount(0);

    // Back on a page, the waiting build is offered again; accepting reloads into it.
    await page.goto('./cards');
    await expect(prompt).toBeVisible({ timeout: 20_000 });
    await Promise.all([
      page.waitForEvent('load'),
      prompt.getByRole('button', { name: 'Reload to update' }).click(),
    ]);
    await expect(page.locator('.update-prompt')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => caches.keys()), { timeout: 15_000 })
      .toContain(`optcg-shell-${NEXT}`);
    expect(await page.evaluate(() => caches.keys())).not.toContain(`optcg-shell-${version.build}`);
  } finally {
    writeFileSync(SW, original);
  }
});

test('the app shell works offline once installed', async ({ context, page }) => {
  await page.goto('./cards');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
    timeout: 15_000,
  });
  const build = ((await (await page.request.get('./version.json')).json()) as { build: string })
    .build;
  await expect
    .poll(
      () =>
        page.evaluate(
          async (name) => (await (await caches.open(name)).keys()).length,
          `optcg-shell-${build}`,
        ),
      { timeout: 20_000 },
    )
    .toBeGreaterThan(50);
  await context.setOffline(true);
  await page.goto('./decks');
  await expect(page.getByRole('button', { name: 'New deck' })).toBeVisible({ timeout: 20_000 });
  await context.setOffline(false);
});
