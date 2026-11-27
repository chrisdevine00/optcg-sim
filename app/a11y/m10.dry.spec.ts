/** The M10 script without a screen reader: checks the harness and records focus and live regions. */
import { expect, test } from '@playwright/test';
import { DryReader } from './src/reader.ts';
import { Pass } from './src/pass.ts';
import { M10_URL, blockArt, runM10 } from './src/m10.ts';
import { startAtTop } from './src/art.ts';

// The script goes offline and installs a second service worker, so unlike the others it needs the real one.
test.use({ serviceWorkers: 'allow' });

test('M10 script (dry)', async ({ page }) => {
  const pass = new Pass(page, new DryReader(page), 'dry', 'results/dry', 'm10');
  process.env.BROWSER_VERSION = `${page.context().browser()?.browserType().name()} ${page.context().browser()?.version()}`;
  await pass.install();
  await blockArt(page);
  await page.goto(M10_URL);
  await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await startAtTop(page);
  await runM10(pass);
  pass.save();
  // Every step must have reached the state it needs (a "harness: did not reach" note fails it).
  expect(pass.unreached).toEqual([]);
});
