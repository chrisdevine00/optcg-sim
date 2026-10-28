import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

type C = { id: string; name: string; category: string; colors: string[]; textFixes: unknown[] };
const op17 = (
  JSON.parse(
    readFileSync(new URL('../../cards/data/sets/OP-17.json', import.meta.url), 'utf8'),
  ) as { cards: C[] }
).cards;

// A generated 1x1 PNG stands in for card art: tests never touch the network or Bandai art.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);
const IMAGES = /https:\/\/(optcgapi\.com|optcg-api\.arjunbansal-ai\.workers\.dev)\/.*/;

async function serveArt(page: Page) {
  await page.route(IMAGES, (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
}
const tile = (page: Page, id: string) => page.getByRole('button', { name: new RegExp(`, ${id},`) });

test.describe('card browser', () => {
  test('opens from the home page and shows the newest set with art', async ({ page }) => {
    await serveArt(page);
    await page.goto('./');
    await page.getByRole('link', { name: /Browse .* cards/ }).click();
    await expect(page).toHaveURL(/\/optcg-sim\/cards$/);
    await expect(page.getByRole('heading', { name: 'Cards', level: 1 })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText(`${op17.length} cards in OP-17`);
    const first = tile(page, 'OP17-001');
    await expect(first).toBeVisible();
    await expect(first.locator('.face')).toHaveAttribute('data-art', 'image');
    await expect(page.getByText('unofficial, non-commercial fan tool')).toBeVisible();
  });

  test('search by name, text and card number; a card number loads its set', async ({ page }) => {
    await serveArt(page);
    await page.goto('./cards');
    const search = page.getByLabel('Search name, ID or text');
    await search.fill('Rocks.D.Xebec');
    await expect(tile(page, 'OP17-039')).toBeVisible();
    await search.fill('OP01-016');
    await expect(page.getByRole('status')).toHaveText('1 card in OP-01');
    await expect(tile(page, 'OP01-016')).toHaveAccessibleName(/^Nami, OP01-016/);
    await search.fill('Elbaph');
    await page.getByRole('button', { name: 'Search all sets' }).click();
    await expect(page.getByRole('status')).toHaveText(/cards in all sets/, { timeout: 15_000 });
    await expect(tile(page, 'OP17-079')).toBeVisible();
  });

  test('filters by colour and category', async ({ page }) => {
    await serveArt(page);
    await page.goto('./cards');
    await page.getByRole('button', { name: 'Blue', exact: true }).click();
    await page.getByRole('button', { name: 'Leader', exact: true }).click();
    const expected = op17.filter((c) => c.category === 'Leader' && c.colors.includes('Blue'));
    await expect(page.getByRole('status')).toHaveText(
      `${expected.length} card${expected.length === 1 ? '' : 's'} in OP-17`,
    );
    const names = await page
      .locator('.card-btn')
      .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    expect(names).toHaveLength(expected.length);
    for (const n of names) expect(n).toMatch(/Blue.*Leader/);
    await page.getByRole('button', { name: /Clear 2 filters/ }).click();
    await expect(page.getByRole('status')).toHaveText(`${op17.length} cards in OP-17`);
  });

  test('inspector shows full text, repairs and badges, and returns focus', async ({ page }) => {
    await serveArt(page);
    await page.goto('./cards');
    await page.getByLabel('Search name, ID or text').fill('OP17-087');
    await tile(page, 'OP17-087').click();
    const dialog = page.getByRole('dialog', { name: 'Nico Robin' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('✓ Verified')).toBeVisible();
    await expect(dialog.getByText('⚠ Effect not automated')).toBeVisible();
    await expect(dialog.getByLabel('Card text')).toContainText('−3000 power during this turn');
    await dialog.getByText(/Repairs to the upstream data/).click();
    await expect(dialog.locator('.fixes li', { hasText: 'Corrected by hand' })).toContainText(
      'poser',
    );
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(tile(page, 'OP17-087')).toBeFocused();
  });

  test('keyboard path: search, into the grid, arrows, open and close', async ({ page }) => {
    await serveArt(page);
    await page.goto('./cards');
    await expect(tile(page, 'OP17-001')).toBeVisible();
    await page.keyboard.press('/');
    await expect(page.getByLabel('Search name, ID or text')).toBeFocused();
    await page.keyboard.type('Kaido');
    await expect(page.getByRole('status')).toHaveText(/^\d+ cards? in OP-17$/);
    // Tab through the filters until the grid's one tab stop has focus.
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(() => document.activeElement?.hasAttribute('data-index'))) break;
    }
    const focused = page.locator('.card-btn:focus');
    await expect(focused).toHaveAttribute('data-index', '0');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.card-btn:focus')).toHaveAttribute('data-index', '1');
    await page.keyboard.press('Home');
    await expect(page.locator('.card-btn:focus')).toHaveAttribute('data-index', '0');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: /Close inspector/ })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('.card-btn:focus')).toHaveAttribute('data-index', '0');
  });

  test('falls back to the text card face when images are blocked', async ({ page }) => {
    await page.route(IMAGES, (r) => r.abort('blockedbyclient'));
    await page.goto('./cards');
    const face = tile(page, 'OP17-039').locator('.face');
    await expect(face).toHaveAttribute('data-art', 'text');
    await expect(face.locator('.face-text-body')).toContainText('[When Attacking]');
    await expect(face.locator('.face-name')).toHaveText(/Rocks/);
    // The tile keeps its size: no layout shift when art fails.
    const box = await tile(page, 'OP17-039').boundingBox();
    expect(Math.round(box!.height)).toBe(Math.round((box!.width * 88) / 63));
    await tile(page, 'OP17-039').click();
    await expect(
      page.getByRole('dialog').getByText('No image available. The card is shown as text.'),
    ).toBeVisible();
  });
});
