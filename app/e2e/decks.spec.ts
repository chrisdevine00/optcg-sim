/**
 * M6 deck builder (flows F17): import a tournament list, see it pass, export it unchanged, break it
 * and see why, keep it across a reload, then play with it. Setup and the builder share one check.
 */
import { expect, test, type Page } from '@playwright/test';
import { serveArt } from './game-support.ts';

const ROCKS = [
  '1 OP17-039',
  '3 OP08-051',
  '4 OP17-040',
  '1 OP17-042',
  '3 OP17-044',
  '4 OP17-045',
  '4 OP17-046',
  '4 OP17-048',
  '4 OP17-049',
  '3 OP17-050',
  '4 OP17-052',
  '4 OP17-054',
  '4 OP17-055',
  '4 OP17-056',
  '4 OP17-118',
].join('\n');

async function importDeck(page: Page, text: string) {
  await page.goto('./decks');
  await page.getByRole('button', { name: 'New deck' }).click();
  await expect(page.locator('.builder')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('#import-text').fill(text);
  await page.getByRole('button', { name: /^Import \d+ cards$/ }).click();
  await expect(page.locator('#import-text')).toHaveCount(0);
}

test.describe('M6: deck builder', () => {
  test.beforeEach(async ({ page }) => {
    await serveArt(page);
  });

  test('imports a tournament list, passes every check, exports it unchanged', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await importDeck(page, ROCKS);
    await expect(page.getByLabel('Deck checks').locator('li.fail')).toHaveCount(0);
    await expect(page.getByLabel('Deck checks')).toContainText('50 cards (50)');
    await expect(page.locator('.deck-cov')).toContainText('Automated: 50 of 50 cards (100%)');
    await page.getByRole('button', { name: 'Export' }).click();
    await page.getByLabel('4xOP01-016').check();
    const out = await page.locator('#export-text').inputValue();
    expect(out).toBe(ROCKS.replace(/^(\d+) /gm, '$1x'));
    await page.getByRole('button', { name: 'Close' }).click();
    expect(errors).toEqual([]);
  });

  test('an import with an unknown ID suggests the card its name matches', async ({ page }) => {
    await page.goto('./decks');
    await page.getByRole('button', { name: 'New deck' }).click();
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await page.locator('#import-text').fill('1xOP17-039\n4 OP17-999 Charlotte Linlin');
    await expect(page.getByRole('button', { name: /^Import 0 cards$/ })).toBeDisabled();
    await expect(page.getByText('Fix or drop line 2 first')).toBeVisible();
    await page.getByRole('button', { name: 'Use OP17-049' }).click();
    await expect(page.locator('#import-text')).toHaveValue('1xOP17-039\n4xOP17-049');
    await expect(page.getByRole('button', { name: 'Import 4 cards' })).toBeEnabled();
  });

  test('a fifth copy fails with its rule; Play is blocked with the reason, and Setup agrees', async ({
    page,
  }) => {
    await importDeck(page, ROCKS);
    await page
      .getByRole('button', { name: /^Add one .* OP17-040$/ })
      .first()
      .click();
    const checks = page.getByLabel('Deck checks');
    await expect(checks.locator('li.fail')).toHaveCount(2);
    await expect(checks).toContainText('5 copies of OP17-040; the limit is 4 per card number');
    await expect(page.getByRole('link', { name: 'Play with this deck' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(page.locator('.foot-why')).toContainText('Fix 2 problems first');
    // The deck is saved: it survives a reload, and Setup refuses to start with it.
    const url = page.url();
    await page.reload();
    await expect(page.getByLabel('Deck checks').locator('li.fail')).toHaveCount(2);
    const id = url.split('/decks/')[1]!;
    await page.goto(`./play?p1=saved:${id}&opp=rookie`);
    await expect(page.getByTestId('deck-problems')).toContainText('5 copies of OP17-040');
    await expect(page.getByRole('button', { name: 'Start game' })).toBeDisabled();
  });

  test('keyboard: / focuses search; + and − on a card change its copies', async ({ page }) => {
    await importDeck(page, ROCKS);
    await page.locator('body').press('/');
    await expect(page.locator('#deck-search')).toBeFocused();
    await page.locator('#deck-search').fill('OP17-040');
    const tile = page.locator('.btile').first();
    await tile.getByRole('button', { name: /^Remove one/ }).focus();
    await page.keyboard.press('-');
    await expect(page.getByRole('status').filter({ hasText: 'Removed' })).toContainText(
      '3 of 4 copies. Deck 49 of 50.',
    );
    await page.keyboard.press('+');
    await expect(page.getByLabel('Deck checks').locator('li.fail')).toHaveCount(0);
  });

  test('Play with this deck starts a game with it', async ({ page }) => {
    test.setTimeout(90_000);
    await importDeck(page, ROCKS);
    await page.getByRole('link', { name: 'Play with this deck' }).click();
    await expect(page.locator('select[name="mine-archetype"]')).toHaveValue('saved');
    await page.getByLabel('Rookie AI').check();
    await page.getByRole('button', { name: 'Start game' }).click();
    await expect(page.locator('#decision')).toBeVisible({ timeout: 20_000 });
  });
});
