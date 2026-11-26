/** Helpers of the M8 review specs (WP7): the planted games, loading them into IndexedDB, axe, keys. */
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { serveArt } from './game-support.ts';

export interface Planted {
  id: string;
  record: { versions: { engine: string } };
  meta: unknown;
}
export const planted = (): Record<string, Planted> =>
  JSON.parse(readFileSync('.cache/m8wp7/planted.json', 'utf8')) as Record<string, Planted>;
export const fixture = (): { decisions: number; game: Planted } =>
  JSON.parse(readFileSync('.cache/m8wp7/fixture.json', 'utf8')) as {
    decisions: number;
    game: Planted;
  };

export async function shot(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: `.cache/m8wp7/${info.project.name}-${name}.png` });
}

export async function axe(page: Page, info: TestInfo, name: string) {
  await shot(page, info, name);
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(
    r.violations.map(
      (v) => `${name}: ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

/** Opens the app (so the database exists), puts these games straight into the store, reloads. */
export async function load(page: Page, games: Planted[], then = './reviews') {
  await serveArt(page);
  await page.goto('./reviews');
  await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible();
  await page.evaluate(
    (gs) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('optcg-sim');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(['games', 'summaries'], 'readwrite');
          for (const g of gs as { id: string; meta: unknown }[]) {
            tx.objectStore('games').put(g);
            tx.objectStore('summaries').put({ id: g.id, meta: g.meta });
          }
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    games,
  );
  await page.goto(then);
}

export const status = (page: Page) => page.getByTestId('review-status');
export const polite = (page: Page) => page.locator('#announce-polite');
export const active = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return {
      id: el?.id ?? '',
      zone: el?.dataset.zone ?? '',
      cls: el?.className ?? '',
      glyph: el?.dataset.glyph ?? '',
      role: el?.getAttribute('role') ?? '',
      text: (el?.getAttribute('aria-label') ?? el?.textContent ?? '').slice(0, 80),
    };
  });

export async function tabTo(
  page: Page,
  test: (a: Awaited<ReturnType<typeof active>>) => boolean,
  max = 80,
) {
  for (let i = 0; i < max; i++) {
    if (test(await active(page))) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Tab never reached the element (at ${JSON.stringify(await active(page))})`);
}
