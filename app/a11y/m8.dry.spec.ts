/** The M8 script without a screen reader: checks the harness and records focus and live regions. */
import { expect, test } from '@playwright/test';
import { DryReader } from './src/reader.ts';
import { Pass } from './src/pass.ts';
import { M8_URL, runM8 } from './src/m8.ts';
import { serveArt, startAtTop } from './src/art.ts';

test('M8 script (dry)', async ({ page }) => {
  const pass = new Pass(page, new DryReader(page), 'dry', 'results/dry', 'm8');
  process.env.BROWSER_VERSION = `${page.context().browser()?.browserType().name()} ${page.context().browser()?.version()}`;
  await pass.install();
  await serveArt(page);
  await page.goto(M8_URL);
  await page.locator('#decision').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await startAtTop(page);
  await runM8(pass);
  pass.save();
  // Every step must have reached the state it needs (a "harness: did not reach" note fails it).
  expect(pass.unreached).toEqual([]);
});
