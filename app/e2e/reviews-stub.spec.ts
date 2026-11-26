/**
 * M8 WP0 and WP6: the Reviews route and nav item exist (History, and a saved game's review), and
 * the header still wraps at 320 px. The stub text of WP0 became the real pages in WP6.
 */
import { expect, test } from '@playwright/test';

test('Reviews has a nav item, the History page, and a page for a game that is not saved', async ({
  page,
}) => {
  await page.goto('./');
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Reviews' })
    .click();
  await expect(page).toHaveURL(/\/reviews$/);
  await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible();
  await expect(
    page.getByText('No games yet: play a game and its review appears here.'),
  ).toBeVisible();
  await page.goto('./reviews/abc');
  await expect(page.getByRole('heading', { name: 'Review', exact: true })).toBeVisible();
  await expect(page.getByText('This game is not saved on this device.')).toBeVisible();
});

test('the header nav wraps at 320 px without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('./reviews');
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(over).toBeLessThanOrEqual(0);
  await expect(
    page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Reviews' }),
  ).toBeVisible();
});
