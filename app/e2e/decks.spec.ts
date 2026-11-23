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
    await expect(page.getByTestId('deck-problems-mine')).toContainText('5 copies of OP17-040');
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

  test.describe('review M6 fixes', () => {
    const focusTag = (page: Page) => page.evaluate(() => document.activeElement?.tagName ?? '');

    test('M6-2: focus stays on a control after −, last copy removed, Leader choice and dialog close', async ({
      page,
    }) => {
      await importDeck(page, ROCKS);
      // A tile's − at 0 copies keeps focus (aria-disabled, not disabled).
      await page.locator('#deck-search').fill('OP17-042');
      const minus = page
        .locator('.btile')
        .first()
        .getByRole('button', { name: /^Remove one/ });
      await minus.click();
      await expect(minus).toHaveAttribute('aria-disabled', 'true');
      expect(await focusTag(page)).toBe('BUTTON');
      // The last copy removed from the deck list: focus moves to the list's heading.
      await page.locator('#deck-search').fill('');
      await page
        .getByRole('button', { name: /^Add one .* OP17-042$/ })
        .first()
        .click();
      await page
        .locator('.deck-group li', { hasText: 'OP17-042' })
        .getByRole('button', { name: /^Remove one/ })
        .click();
      await expect(page.locator('.deck-list-title')).toBeFocused();
      // Import closed with Esc: focus returns to Import, and the pasted text is kept.
      await page.getByRole('button', { name: 'Import', exact: true }).click();
      await expect(page.locator('#import-text')).toBeFocused();
      await page.locator('#import-text').fill('1xOP17-039');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Import', exact: true })).toBeFocused();
      await page.getByRole('button', { name: 'Import', exact: true }).click();
      await expect(page.locator('#import-text')).toHaveValue('1xOP17-039');
      await page.keyboard.press('Escape');
      // Change Leader, then choose one: focus goes to search both times.
      await page.getByRole('button', { name: 'Change Leader' }).click();
      await expect(page.locator('#deck-search')).toBeFocused();
      await page.getByRole('button', { name: /^Choose .* OP17-039 as Leader$/ }).click();
      await expect(page.locator('#deck-search')).toBeFocused();
    });

    test('M6-1: a deck saved in another tab survives an edit here', async ({ page, context }) => {
      await page.goto('./play');
      await expect(page.locator('h1')).toHaveText('New game');
      const other = await context.newPage();
      await serveArt(other);
      await importDeck(other, ROCKS);
      await other.close();
      await page.goto('./decks');
      await page.getByRole('button', { name: 'New deck' }).click();
      await expect(page.locator('.builder')).toBeVisible({ timeout: 20_000 });
      const n = await page.evaluate(
        () => (JSON.parse(localStorage.getItem('optcg.decks.v1') ?? '[]') as unknown[]).length,
      );
      expect(n).toBe(2);
    });

    test('M6-5: a malformed stored deck does not blank the app', async ({ page }) => {
      await page.addInitScript(() =>
        localStorage.setItem(
          'optcg.decks.v1',
          JSON.stringify([null, 7, { id: 'saved:x', main: 'nope', leader: 5 }, { name: 'no id' }]),
        ),
      );
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('./decks');
      await expect(page.locator('.deck-card')).toHaveCount(1);
      await expect(page.locator('.deck-card')).toContainText('Choose a Leader');
      expect(errors).toEqual([]);
    });

    test('M6-4: a saved deck with an unknown card cannot start, and says why', async ({ page }) => {
      await page.addInitScript(() =>
        localStorage.setItem(
          'optcg.decks.v1',
          JSON.stringify([
            {
              id: 'saved:bad',
              name: 'Typo deck',
              leader: 'OP17-039',
              main: [...Array(49).fill('OP17-040'), 'OP99-001'],
              format: 'standard',
              art: {},
              updatedAt: '2026-11-23T00:00:00Z',
            },
          ]),
        ),
      );
      await page.goto('./play?p1=saved:bad&opp=rookie');
      await expect(page.getByTestId('deck-problems-mine')).toContainText('Unknown card OP99-001');
      await expect(page.getByRole('button', { name: 'Start game' })).toBeDisabled();
    });

    test('M6-13: delete asks inline; Keep it and Esc return focus; Delete deck removes it', async ({
      page,
    }) => {
      await importDeck(page, ROCKS);
      await page.getByRole('button', { name: 'Delete', exact: true }).click();
      // Focus starts on the safe choice; Esc cancels (review N-3).
      await expect(page.getByRole('button', { name: 'Keep it' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeFocused();
      await page.getByRole('button', { name: 'Delete', exact: true }).click();
      await page.getByRole('button', { name: 'Keep it' }).click();
      await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeFocused();
      await page.getByRole('button', { name: 'Delete', exact: true }).click();
      await page.getByRole('button', { name: 'Delete deck' }).click();
      await expect(page).toHaveURL(/\/decks$/);
      await expect(page.getByText('No saved decks yet.')).toBeVisible();
    });
  });
});
