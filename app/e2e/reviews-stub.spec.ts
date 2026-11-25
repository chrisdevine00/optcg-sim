/** M8 WP0: the Reviews route and nav item exist, and the header still wraps at 320 px. */
import { expect, test } from '@playwright/test';

test('Reviews has a nav item and stub pages', async ({ page }) => {
  await page.goto('./');
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Reviews' })
    .click();
  await expect(page).toHaveURL(/\/reviews$/);
  await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible();
  await expect(page.getByText('Coming in M8')).toBeVisible();
  await page.goto('./reviews/abc');
  await expect(page.getByRole('heading', { name: 'Review', exact: true })).toBeVisible();
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
