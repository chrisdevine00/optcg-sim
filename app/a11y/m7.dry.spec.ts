/** The M7 script without a screen reader: checks the harness and records focus and live regions. */
import { expect, test } from '@playwright/test';
import { DryReader } from './src/reader.ts';
import { Pass } from './src/pass.ts';
import { M7_TUTORIAL_URL, runM7 } from './src/m7.ts';
import { serveArt } from './src/art.ts';

test('M7 script (dry)', async ({ page }) => {
  const pass = new Pass(page, new DryReader(page), 'dry', 'results/dry', 'm7');
  process.env.BROWSER_VERSION = `${page.context().browser()?.browserType().name()} ${page.context().browser()?.version()}`;
  await pass.install();
  await serveArt(page);
  await page.goto(M7_TUTORIAL_URL);
  await page.locator('#tutorial-text').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await runM7(pass);
  pass.save();
  // Every step must have reached the state it needs (a "harness: did not reach" note fails it).
  expect(pass.unreached).toEqual([]);
});
