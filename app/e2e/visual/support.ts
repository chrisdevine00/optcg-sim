/**
 * M10 WP8: the shared parts of the pixel specs. Kept free of runtime Playwright imports so a unit test
 * (app/test/visual-support.test.ts) can read it.
 *
 * Pixel comparison is nightly and on dispatch, never per push (DECISIONS 2026-11-27 "M10 plan", lead
 * amendment): renderer noise on a pixel diff is the non-defect failure docs/runbooks/testing.md keeps
 * out of per-push suites. Baselines are made on Linux only (`visual-baseline.yml`); on any other
 * platform, or while a baseline is absent, a spec skips itself with the reason, and never fails.
 */
import { existsSync } from 'node:fs';
import type { Page, TestInfo } from '@playwright/test';
import { IMAGE_SOURCES } from '../../src/art/sources.ts';

/** Every origin card art may load from. Each is routed to an abort, so cards draw as text faces and no
 *  Bandai art can enter a baseline. */
export const ART_ORIGINS: string[] = Object.values(IMAGE_SOURCES).map(
  (s) => new URL(s.base).origin,
);

/** The glob Playwright routes for one origin. */
export const artRoute = (origin: string): string => `${origin}/**`;

export async function abortArt(page: Page): Promise<void> {
  for (const o of ART_ORIGINS) await page.route(artRoute(o), (r) => r.abort());
}

/** The frozen "now" for screens that show a date (meta "as of", progress). */
export const FROZEN = new Date('2026-11-20T10:00:00.000Z');

const baselineExists = (info: TestInfo, name: string): boolean =>
  existsSync(info.snapshotPath(`${name}.png`));

/**
 * Why this run cannot compare, or null when it can. Order: the switch, then the platform (the
 * baselines are Linux renders), then, unless this run is writing them (`--update-snapshots`), a
 * missing baseline file. A skip is never a failure.
 */
export function skipReason(info: TestInfo, name: string): string | null {
  if (!process.env.VISUAL) return 'VISUAL=1 switches the pixel comparison on (npm run test:visual)';
  if (process.platform !== 'linux' && !process.env.VISUAL_ANY_OS)
    return `baselines are made on Linux (visual-baseline.yml); this is ${process.platform}, so ${name} is not compared`;
  const writing =
    info.config.updateSnapshots === 'all' || info.config.updateSnapshots === 'changed';
  if (!writing && !baselineExists(info, name))
    return `no baseline for ${info.project.name}/${name}.png yet: dispatch the "Visual baselines" workflow, read the images, and commit them (docs/runbooks/testing.md, "Visual baselines")`;
  return null;
}

/** What to wait for before the shot: fonts loaded, then two animation frames so layout has settled. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  });
}

/** Reduced motion is the app's own setting (the media query), so no animation runs in a baseline. */
export async function prepare(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.clock.setFixedTime(FROZEN);
  await abortArt(page);
}
