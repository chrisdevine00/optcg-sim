/**
 * The M3 script with VoiceOver, through Guidepup, on the owner's Mac (never in CI). Needs
 * `npx @guidepup/setup setup` first, which changes macOS settings: see
 * docs/design/a11y-passes/README.md before running it.
 */
import { voiceOverTest as test } from '@guidepup/playwright';
import { VoiceOverReader } from './src/reader.ts';
import { Pass } from './src/pass.ts';
import { M3_URL, runM3 } from './src/m3.ts';
import { serveArt } from './src/art.ts';

test.use({ voiceOverStartOptions: { capture: true } });

test('M3 script (VoiceOver)', async ({ page, voiceOver }, info) => {
  const reader = new VoiceOverReader(voiceOver);
  const pass = new Pass(page, reader, info.project.name, `results/${info.project.name}`);
  process.env.BROWSER_VERSION = `${page.context().browser()?.browserType().name()} ${page.context().browser()?.version()}`;
  await pass.install();
  await serveArt(page);
  await page.goto(M3_URL);
  await page.locator('#decision').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await voiceOver.navigateToWebContent();
  // Load the game afresh, so step 1 starts from the page top with nothing focused (Guidepup's
  // setup clicks into the page, which moves the browser's Tab starting point).
  await page.goto(M3_URL);
  await page.locator('#decision').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);
  try {
    await runM3(pass);
  } finally {
    pass.save();
  }
});
