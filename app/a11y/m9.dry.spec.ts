/** The M9 script without a screen reader: checks the harness and records focus and live regions. */
import { expect, test } from '@playwright/test';
import { DryReader } from './src/reader.ts';
import { Pass } from './src/pass.ts';
import { M9_URL, runM9 } from './src/m9.ts';
import { serveArt, startAtTop } from './src/art.ts';

test('M9 script (dry)', async ({ page }) => {
  const pass = new Pass(page, new DryReader(page), 'dry', 'results/dry', 'm9');
  process.env.BROWSER_VERSION = `${page.context().browser()?.browserType().name()} ${page.context().browser()?.version()}`;
  await pass.install();
  await serveArt(page);
  await page.goto(M9_URL);
  await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await startAtTop(page);
  await runM9(pass);
  pass.save();
  // Every step must have reached the state it needs (a "harness: did not reach" note fails it).
  expect(pass.unreached).toEqual([]);
});
