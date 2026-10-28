import { expect, test } from '@playwright/test';

test('home page renders with disclaimer', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'OPTCG Sim' })).toBeVisible();
  await expect(page.getByText('unofficial, non-commercial fan tool')).toBeVisible();
});
