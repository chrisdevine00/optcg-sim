/**
 * M8 fix round (app): the mulligan flag's guide label wherever it is shown (M8-R1).
 */
import { expect, test } from '@playwright/test';
import { load, planted, status } from './review-m8-support.ts';

const GUIDE = /From the .+ guide \(sourced\)/;

test('a mulligan flag says "From the <Leader> guide (sourced)" in the list, the detail and Study', async ({
  page,
}) => {
  const g = planted().mulligan!;
  await load(page, [g], `./reviews/${g.id}`);
  await expect(status(page)).toContainText(/\d flags?/, { timeout: 45_000 });
  const option = page
    .getByRole('listbox', { name: /^Flags/ })
    .getByRole('option', { name: /Mulligan/i })
    .first();
  await expect(option).toBeVisible();
  await expect(option).toContainText(GUIDE);
  await expect(option).toHaveAccessibleName(GUIDE);
  await option.click();
  const detail = page.getByTestId('selected-flag');
  await expect(detail).toContainText(GUIDE);
  await expect(detail).not.toContainText('Holds whatever they held');
  // Study: the same flag, the same label.
  await page.getByRole('listbox', { name: /^Flags/ }).focus();
  await page.keyboard.press('Enter');
  const rail = page.getByTestId('study-rail');
  await expect(rail).toBeVisible();
  await expect(rail).toContainText(GUIDE);
  await expect(rail).not.toContainText('Holds whatever they held');
});
