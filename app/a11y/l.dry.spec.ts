/** The L script without a screen reader: checks the harness and records focus and live regions. */
import { test } from '@playwright/test';
import { DryReader } from './src/reader.ts';
import { Pass } from './src/pass.ts';
import { L_URL, runL } from './src/l.ts';
import { serveArt, startAtTop } from './src/art.ts';

test('L script (dry)', async ({ page }) => {
  const pass = new Pass(page, new DryReader(page), 'dry', 'results/dry', 'l');
  process.env.BROWSER_VERSION = `${page.context().browser()?.browserType().name()} ${page.context().browser()?.version()}`;
  await pass.install();
  await serveArt(page);
  await page.goto(L_URL);
  await page.locator('#decision').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await startAtTop(page);
  await runL(pass);
  pass.save();
});
