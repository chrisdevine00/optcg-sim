/**
 * The M3 script (accessibility.md §11.3) with NVDA, through Guidepup. Runs on Windows only (the
 * a11y-nvda workflow), once per browser project.
 */
import { nvdaTest as test } from '@guidepup/playwright';
import { NvdaReader } from './src/reader.ts';
import { Pass } from './src/pass.ts';
import { M3_URL, runM3 } from './src/m3.ts';
import { serveArt } from './src/art.ts';

test.use({ nvdaStartOptions: { capture: true } });

test('M3 script (NVDA)', async ({ page, nvda }, info) => {
  const reader = new NvdaReader(nvda);
  const pass = new Pass(page, reader, info.project.name, `results/${info.project.name}`);
  process.env.BROWSER_VERSION = `${page.context().browser()?.browserType().name()} ${page.context().browser()?.version()}`;
  await pass.install();
  await serveArt(page);
  await page.goto(M3_URL);
  await page.locator('#decision').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await reader.start();
  // Guidepup: focus the browser window, enter browse mode at the top of the page.
  await nvda.navigateToWebContent();
  // Load the game afresh, so step 1 starts from the page top with nothing focused (Guidepup's
  // setup clicks into the page, which moves the browser's Tab starting point).
  await page.goto(M3_URL);
  await page.locator('#decision').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);
  try {
    await runM3(pass);
  } finally {
    pass.save();
    reader.stop();
  }
});
