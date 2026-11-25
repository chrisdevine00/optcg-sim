/**
 * The M7 script with VoiceOver, through Guidepup, on the owner's Mac (never in CI). Needs
 * `npx @guidepup/setup setup` first, which changes macOS settings: see
 * docs/design/a11y-passes/README.md before running it. The owner's 30-minute listening pass stays
 * the owner's (docs/design/usability/S2-kit.md).
 */
import { voiceOverTest as test } from '@guidepup/playwright';
import { VoiceOverReader } from './src/reader.ts';
import { Pass } from './src/pass.ts';
import { M7_TUTORIAL_URL, runM7 } from './src/m7.ts';
import { serveArt } from './src/art.ts';

test.use({ voiceOverStartOptions: { capture: true } });

test('M7 script (VoiceOver)', async ({ page, voiceOver }, info) => {
  const reader = new VoiceOverReader(voiceOver);
  const pass = new Pass(page, reader, info.project.name, `results/${info.project.name}`, 'm7');
  process.env.BROWSER_VERSION = `${page.context().browser()?.browserType().name()} ${page.context().browser()?.version()}`;
  await pass.install();
  await serveArt(page);
  await page.goto(M7_TUTORIAL_URL);
  await page.locator('#tutorial-text').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await voiceOver.navigateToWebContent();
  await page.goto(M7_TUTORIAL_URL);
  await page.locator('#tutorial-text').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);
  try {
    await runM7(pass);
  } finally {
    pass.save();
  }
});
