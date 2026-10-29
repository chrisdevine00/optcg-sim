/** The M3 script without a screen reader: checks the harness and records focus and live regions. */
import { test } from '@playwright/test';
import { DryReader } from './src/reader.ts';
import { Pass } from './src/pass.ts';
import { M3_URL, runM3 } from './src/m3.ts';
import { serveArt } from './src/art.ts';

test('M3 script (dry)', async ({ page }) => {
  const pass = new Pass(page, new DryReader(page), 'dry', 'results/dry');
  process.env.BROWSER_VERSION = `${page.context().browser()?.browserType().name()} ${page.context().browser()?.version()}`;
  await pass.install();
  await serveArt(page);
  await page.goto(M3_URL);
  await page.locator('#decision').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await runM3(pass);
  pass.save();
});
