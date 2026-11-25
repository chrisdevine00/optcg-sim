/**
 * The M7 script (accessibility.md §11.5) with NVDA, through Guidepup. Runs on Windows only (the
 * a11y-nvda workflow, script "m7"), once per browser project.
 */
import { nvdaTest as test } from '@guidepup/playwright';
import { NvdaReader } from './src/reader.ts';
import { Pass } from './src/pass.ts';
import { M7_TUTORIAL_URL, runM7 } from './src/m7.ts';
import { serveArt } from './src/art.ts';

test.use({ nvdaStartOptions: { capture: true } });

test('M7 script (NVDA)', async ({ page, nvda }, info) => {
  const reader = new NvdaReader(nvda);
  const pass = new Pass(page, reader, info.project.name, `results/${info.project.name}`, 'm7');
  process.env.BROWSER_VERSION = `${page.context().browser()?.browserType().name()} ${page.context().browser()?.version()}`;
  await pass.install();
  await serveArt(page);
  await page.goto(M7_TUTORIAL_URL);
  await page.locator('#tutorial-text').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await reader.start();
  // Guidepup: focus the browser window, enter browse mode at the top of the page.
  await nvda.navigateToWebContent();
  // Load the tutorial afresh, so step T0 starts from the page load with nothing focused by the
  // harness (Guidepup's setup clicks into the page). The tutorial's progress and timing log are
  // kept in this context's storage; a fresh profile starts clean.
  await page.goto(M7_TUTORIAL_URL);
  await page.locator('#tutorial-text').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);
  try {
    // A known phrase must be heard before step T0, else the record is marked invalid and the run stops.
    await pass.speechProbe();
    await runM7(pass);
  } finally {
    pass.save();
    reader.stop();
  }
});
