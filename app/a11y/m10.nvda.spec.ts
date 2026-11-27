/**
 * The M10 script (accessibility.md §11.9) with NVDA, through Guidepup. Runs on Windows only (the
 * a11y-nvda workflow, script "m10"), once per browser project.
 */
import { nvdaTest as test } from '@guidepup/playwright';
import { NvdaReader } from './src/reader.ts';
import { Pass } from './src/pass.ts';
import { M10_URL, blockArt, runM10 } from './src/m10.ts';

// The script goes offline and installs a second service worker, so unlike the others it needs the real one.
test.use({ serviceWorkers: 'allow' });
test.use({ nvdaStartOptions: { capture: true } });

test('M10 script (NVDA)', async ({ page, nvda }, info) => {
  const reader = new NvdaReader(nvda);
  const pass = new Pass(page, reader, info.project.name, `results/${info.project.name}`, 'm10');
  process.env.BROWSER_VERSION = `${page.context().browser()?.browserType().name()} ${page.context().browser()?.version()}`;
  await pass.install();
  await blockArt(page);
  await page.goto(M10_URL);
  await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await reader.start();
  // Guidepup: focus the browser window, enter browse mode at the top of the page.
  await nvda.navigateToWebContent();
  // Load the game afresh, so the script starts from the page load with nothing focused by the harness.
  await page.goto(M10_URL);
  await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);
  try {
    // A known phrase must be heard before step R1, else the record is marked invalid and the run stops.
    await pass.speechProbe();
    await runM10(pass);
  } finally {
    pass.save();
    reader.stop();
  }
});
