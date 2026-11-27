/**
 * One-off (M10 WP6, not run in the build): renders app/public/favicon.svg, our own mark, to the PNG
 * icons the manifest and iOS need, using the Playwright Chromium the e2e tests already install. The PNGs
 * are committed. Run `npx tsx scripts/make-icons.ts` after changing the SVG.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const pub = join(import.meta.dirname, '../app/public');
const svg = `data:image/svg+xml;base64,${readFileSync(join(pub, 'favicon.svg')).toString('base64')}`;
/** The tokens' dark background: the page behind the mark, so every PNG is opaque. */
const BG = '#0b0e12';

/** `size` px square; the mark fills `fill` of it (maskable icons keep to the 80% safe zone). */
const OUT: { file: string; size: number; fill: number }[] = [
  { file: 'apple-touch-icon.png', size: 180, fill: 1 },
  { file: 'icon-192.png', size: 192, fill: 1 },
  { file: 'icon-512.png', size: 512, fill: 1 },
  { file: 'icon-maskable-512.png', size: 512, fill: 0.72 },
];

const browser = await chromium.launch();
try {
  for (const { file, size, fill } of OUT) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    const inner = Math.round(size * fill);
    await page.setContent(
      `<body style="margin:0;background:${BG};display:grid;place-items:center;width:${size}px;height:${size}px">` +
        `<img src="${svg}" width="${inner}" height="${inner}"></body>`,
    );
    await page.locator('img').evaluate((i: HTMLImageElement) => i.decode());
    await page.screenshot({ path: join(pub, file) });
    await page.close();
    console.log(`wrote app/public/${file}`);
  }
} finally {
  await browser.close();
}
