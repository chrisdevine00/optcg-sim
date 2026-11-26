/**
 * M8-R5: Study on a direct load of /reviews/<id> in the production build. The board's stylesheet
 * must come with the review route, and Study is the board beside the rail, in one screen.
 */
import { expect, test } from '@playwright/test';
import { load, planted, status } from './review-m8-support.ts';

test('Study on a direct load: the board is visible beside the rail, in one screen', async ({
  page,
}, info) => {
  const g = planted()['missed-lethal']!;
  await load(page, [g], `./reviews/${g.id}`);
  // A true direct load: the review route is the first page of this document, no /play before it.
  await page.reload();
  await expect(status(page)).toContainText(/\d flags?/, { timeout: 45_000 });
  await page
    .getByRole('listbox', { name: /^Flags/ })
    .getByRole('option')
    .first()
    .click();
  await page.getByRole('listbox', { name: /^Flags/ }).focus();
  await page.keyboard.press('Enter');
  const rail = page.getByTestId('study-rail');
  await expect(rail).toBeVisible();
  await expect(page.locator('.bc-leader[data-zone="my-row"]')).toBeVisible();
  await page.screenshot({ path: `.cache/m8wp7/${info.project.name}-study-direct.png` });

  const vp = page.viewportSize()!;
  const geo = await page.evaluate(() => {
    const box = (el: Element | null) => {
      const r = el?.getBoundingClientRect();
      return r ? { x: r.x, y: r.y, r: r.right, b: r.bottom, w: r.width, h: r.height } : null;
    };
    return {
      rail: box(document.querySelector('[data-testid="study-rail"]')),
      mine: box(document.querySelector('.bc-leader[data-zone="my-row"]')),
      theirs: box(document.querySelector('.bc-leader[data-zone="opp-row"]')),
      pageHeight: document.documentElement.scrollHeight,
    };
  });
  expect(geo.rail).not.toBeNull();
  // Both Leaders are inside the first viewport and to the left of the rail.
  for (const z of [geo.mine, geo.theirs]) {
    expect(z).not.toBeNull();
    expect(z!.y).toBeGreaterThanOrEqual(0);
    expect(z!.b).toBeLessThanOrEqual(vp.height);
    expect(z!.r).toBeLessThanOrEqual(geo.rail!.x + 1);
    expect(z!.w).toBeGreaterThan(40);
  }
  // No empty band above the board (M8-R12): their Leader sits near the top of the screen.
  expect(geo.theirs!.y).toBeLessThan(vp.height * 0.15);
  // Their row is above yours: the board is laid out, not a stacked column of grey boxes.
  expect(geo.theirs!.y).toBeLessThan(geo.mine!.y);
  // Board and rail share the screen: the page is no taller than the viewport plus a small margin.
  expect(geo.pageHeight).toBeLessThanOrEqual(vp.height + 40);
});
