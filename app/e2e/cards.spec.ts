import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

type C = { id: string; name: string; category: string; colors: string[] };
const load = (code: string) =>
  (
    JSON.parse(
      readFileSync(new URL(`../../cards/data/sets/${code}.json`, import.meta.url), 'utf8'),
    ) as { cards: C[] }
  ).cards;
const op17 = load('OP-17');
const NEWEST = 'OP-17 (newest set)';

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
const status = (page: Page) => page.locator('#search-scope');
const focusedIndex = (page: Page) =>
  page.evaluate(() => document.activeElement?.getAttribute('data-index'));

/** Focus moves after a frame; poll for it. */
const expectFocusAt = (page: Page, i: string) => expect.poll(() => focusedIndex(page)).toBe(i);

/** accessibility.md §11.1: zero axe violations on every UI state. */
async function expectNoAxeViolations(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(
    r.violations.map(
      (v) => `${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

test.describe('card browser', () => {
  test('opens from the home page and shows the newest set with art', async ({ page }) => {
    await serveArt(page);
    await page.goto('./');
    await page.getByRole('link', { name: /Browse .* cards/ }).click();
    await expect(page).toHaveURL(/\/optcg-sim\/cards$/);
    await expect(page).toHaveTitle('Cards · OPTCG Sim');
    await expect(page.getByRole('heading', { name: 'Cards', level: 1 })).toBeVisible();
    await expect(status(page)).toHaveText(`${op17.length} cards in ${NEWEST}`);
    await expect(tile(page, 'OP17-001').locator('.face')).toHaveAttribute('data-art', 'image');
    await expect(page.getByText('unofficial, non-commercial fan tool')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  // M1-01: a search covers every set unless the user picked one.
  test('search covers all sets by default and ranks name matches first', async ({ page }) => {
    await serveArt(page);
    await page.goto('./cards');
    const search = page.getByRole('searchbox', { name: /Search cards/ });
    await search.fill('Luffy');
    await expect(status(page)).toHaveText(/^\d+ cards in all sets$/, { timeout: 15_000 });
    const luffy = Number((await status(page).textContent())!.split(' ')[0]);
    expect(luffy).toBeGreaterThan(100);
    // Ranking (M1-07): the first results are named Luffy, not cards that mention him.
    const firstNames = await page
      .locator('.card-btn .sr-only')
      .evaluateAll((els) => els.slice(0, 6).map((e) => e.textContent ?? ''));
    for (const n of firstNames) expect(n).toMatch(/Luffy/);
    await search.fill('OP01-016');
    await expect(page.locator('.card-btn').first()).toHaveAccessibleName(/^Nami, OP01-016/);
    // Picking a set scopes the search and still shows the all-sets count.
    await page.getByLabel('Set', { exact: true }).selectOption('OP-17');
    await search.fill('Luffy');
    await expect(status(page)).toHaveText(
      new RegExp(`^\\d+ cards? in OP-17 · ${luffy} in all sets$`),
    );
    await page.getByRole('button', { name: `${luffy} in all sets` }).click();
    await expect(status(page)).toHaveText(`${luffy} cards in all sets`);
  });

  test('filters by colour and category, with active filters shown and cleared from the results bar', async ({
    page,
  }) => {
    await serveArt(page);
    await page.goto('./cards');
    await page.getByRole('button', { name: 'Blue', exact: true }).click();
    await page.getByRole('button', { name: 'Leader', exact: true }).click();
    const expected = op17.filter((c) => c.category === 'Leader' && c.colors.includes('Blue'));
    await expect(status(page)).toHaveText(
      `${expected.length} card${expected.length === 1 ? '' : 's'} in ${NEWEST}`,
    );
    const names = await page
      .locator('.card-btn .sr-only')
      .evaluateAll((els) => els.map((e) => e.textContent));
    expect(names).toHaveLength(expected.length);
    for (const n of names) expect(n).toMatch(/Blue.*Leader/);
    const chips = page.getByRole('group', { name: 'Active filters' });
    await expect(chips.getByRole('button', { name: 'Remove filter Colour: Blue' })).toBeVisible();
    await expect(page).toHaveURL(/color=Blue&category=Leader/);
    await chips.getByRole('button', { name: 'Clear all' }).click();
    await expect(status(page)).toHaveText(`${op17.length} cards in ${NEWEST}`);
  });

  test('empty results say what was searched and offer a way out', async ({ page }) => {
    await serveArt(page);
    await page.goto('./cards?set=OP-17&q=zzzzqx');
    await expect(page.getByText('No cards match')).toBeVisible();
    await expect(page.locator('.empty')).toContainText('“zzzzqx” in OP-17');
    await expectNoAxeViolations(page);
    await page.getByRole('button', { name: 'Search all sets' }).click();
    await expect(page.locator('.empty')).toContainText('in all sets');
  });

  test('inspector: full text, repairs, badges, previous/next, URL and Back', async ({ page }) => {
    await serveArt(page);
    await page.goto('./cards');
    await page.getByRole('searchbox', { name: /Search cards/ }).fill('OP17-087');
    await tile(page, 'OP17-087').click();
    const dialog = page.getByRole('dialog', { name: 'Nico Robin' });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/card=OP17-087/);
    await expect(page).toHaveTitle('Nico Robin (OP17-087) · Cards · OPTCG Sim');
    await expect(dialog.getByText('✓ Verified')).toBeVisible();
    await expect(dialog.getByText('Effect not automated', { exact: true })).toBeVisible();
    await expect(dialog.getByText("Card effects aren't automated yet")).toBeVisible();
    await expect(dialog.getByLabel('Card text')).toContainText('−3000 power during this turn');
    await dialog.getByText(/Repairs to the upstream data/).click();
    await expect(dialog.locator('.fixes li', { hasText: 'Corrected by hand' })).toContainText(
      'poser',
    );
    await expectNoAxeViolations(page);
    // Back closes the inspector instead of leaving the page (M1-13).
    await page.goBack();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/cards\?q=OP17-087$/);
    // A link to a card opens it, and Previous/Next walk the results (M1-15).
    await page.goto('./cards?set=OP-17&card=OP17-002');
    await expect(page.getByRole('dialog', { name: 'Atmos' })).toBeVisible();
    await page.keyboard.press('PageDown');
    await expect(page.getByRole('dialog', { name: 'Izo' })).toBeVisible();
    await page.getByRole('button', { name: '◂ Previous' }).click();
    await expect(page.getByRole('dialog', { name: 'Atmos' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tile(page, 'OP17-002')).toBeFocused();
  });

  // M1-02: one Tab, or ArrowDown, from search to the first result; a skip link from the top of the page.
  test('keyboard path: search to results in one key, arrows, open and close', async ({ page }) => {
    await serveArt(page);
    await page.goto('./cards');
    await expect(tile(page, 'OP17-001')).toBeVisible();
    await page.keyboard.press('/');
    await expect(page.getByRole('searchbox', { name: /Search cards/ })).toBeFocused();
    await page.keyboard.type('Kaido');
    await expect(status(page)).toHaveText(/cards? in all sets$/, { timeout: 15_000 });
    await page.keyboard.press('ArrowDown');
    await expectFocusAt(page, '0');
    await page.getByRole('searchbox', { name: /Search cards/ }).focus();
    await page.keyboard.press('Tab');
    await expectFocusAt(page, '0');
    await page.keyboard.press('ArrowRight');
    await expectFocusAt(page, '1');
    await page.keyboard.press('Home');
    await expectFocusAt(page, '0');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expectFocusAt(page, '0');
    await expect(page).not.toHaveURL(/card=/);
    // From page load: the first Tab reaches "Skip to results", which lands on the grid.
    await page.goto('./cards');
    await expect(tile(page, 'OP17-001')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to results' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expectFocusAt(page, '0');
  });

  // M1-03: the focus ring is an outline, so forced colours keep it.
  test('a focused card keeps a visible ring in forced colours', async ({ page }) => {
    await serveArt(page);
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('./cards');
    await expect(tile(page, 'OP17-001')).toBeVisible();
    await page.getByRole('searchbox', { name: /Search cards/ }).press('ArrowDown');
    await expectFocusAt(page, '0');
    const ring = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement!);
      return {
        style: s.outlineStyle,
        width: parseFloat(s.outlineWidth),
        offset: parseFloat(s.outlineOffset),
      };
    });
    expect(ring.style).toBe('solid');
    expect(ring.width).toBeGreaterThanOrEqual(2);
    expect(ring.offset).toBeGreaterThanOrEqual(4);
  });

  // M1-04: 400% zoom of 1280x720 is 320x180 CSS px; nothing scrolls sideways and the grid is usable.
  test('reflows at 320 CSS px with no horizontal scroll and no overlap', async ({ page }) => {
    await serveArt(page);
    await page.setViewportSize({ width: 320, height: 180 });
    await page.goto('./cards');
    await expect(status(page)).toHaveText(`${op17.length} cards in ${NEWEST}`);
    const m = await page.evaluate(() => {
      const box = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        header: box('.app-header'),
        count: box('#search-scope'),
        results: box('#results'),
      };
    });
    expect(m.scrollWidth).toBeLessThanOrEqual(320);
    expect(m.count.top).toBeGreaterThanOrEqual(m.header.bottom);
    expect(m.results.width).toBeGreaterThan(250);
    expect(m.results.height).toBeGreaterThanOrEqual(180);
    await tile(page, 'OP17-001').scrollIntoViewIfNeeded();
    await expect(tile(page, 'OP17-001')).toBeInViewport();
    // Filters sit behind a button, and open above the results.
    await page.getByRole('button', { name: 'Filters' }).click();
    await expect(page.getByLabel('Set', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    await expectNoAxeViolations(page);
  });

  // M1-30: the inspector reflows at 320 CSS px; the card text is readable.
  for (const [w, h] of [
    [320, 256],
    [320, 180],
  ] as const) {
    test(`inspector reflows at ${w}x${h}`, async ({ page }) => {
      await serveArt(page);
      await page.setViewportSize({ width: w, height: h });
      await page.goto('./cards?set=OP-17&card=OP17-087');
      const dialog = page.getByRole('dialog', { name: 'Nico Robin' });
      await expect(dialog).toBeVisible();
      const m = await dialog.evaluate((d) => {
        const r = (s: string) => d.querySelector(s)!.getBoundingClientRect();
        return {
          scrollWidth: d.scrollWidth,
          clientWidth: d.clientWidth,
          dialog: d.getBoundingClientRect(),
          head: r('.inspector-head'),
          info: r('.inspector-info'),
          text: r('.text'),
          headSticky: getComputedStyle(d.querySelector('.inspector-head')!).position,
        };
      });
      expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth);
      expect(m.dialog.right).toBeLessThanOrEqual(w);
      expect(m.info.width).toBeGreaterThanOrEqual(250);
      expect(m.text.width).toBeGreaterThanOrEqual(250);
      expect(m.headSticky).toBe('static');
      expect(m.head.height).toBeLessThan(m.dialog.height / 2);
      const text = dialog.getByLabel('Card text');
      await text.scrollIntoViewIfNeeded();
      await expect(text).toBeInViewport();
      await expect(text).toContainText('−3000 power during this turn');
      await expectNoAxeViolations(page);
    });
  }

  // M1-31: focus never falls to body when the inspector closes.
  test('focus returns to the card after Back and after closing a deep-linked inspector', async ({
    page,
  }) => {
    await serveArt(page);
    await page.goto('./cards');
    await tile(page, 'OP17-003').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(tile(page, 'OP17-003')).toBeFocused();
    await page.goto('./cards?set=OP-17&card=OP17-005');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tile(page, 'OP17-005')).toBeFocused();
  });

  // M1-34, M1-33: narrow layout keeps focus and view together; the search has a visible label.
  test('narrow layout: Filters opens below its button with focus inside, and returns to the results', async ({
    page,
  }) => {
    await serveArt(page);
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('./cards');
    await expect(page.getByText('Search cards', { exact: true })).toBeVisible();
    const toggle = page.getByRole('button', { name: 'Filters' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    const set = page.getByLabel('Set', { exact: true });
    await expect(set).toBeFocused();
    await expect(set).toBeInViewport();
    const order = await page.evaluate(() => {
      const y = (s: string) => document.querySelector(s)!.getBoundingClientRect().top;
      return { toggle: y('.filters-toggle'), panel: y('#filters'), grid: y('#results') };
    });
    expect(order.panel).toBeGreaterThan(order.toggle);
    expect(order.grid).toBeGreaterThan(order.panel);
    await page.getByRole('button', { name: /^Show \d+ results$/ }).click();
    await expect(page.locator('#filters')).toBeHidden();
    await expectFocusAt(page, '0');
  });

  test('shows banned and rotated status on tiles', async ({ page }) => {
    await serveArt(page);
    await page.goto('./cards?q=OP14-020');
    await expect(tile(page, 'OP14-020')).toContainText('⛔ Banned');
    await expect(tile(page, 'OP14-020')).toHaveAccessibleName(/banned in Standard/);
    await page.goto('./cards?set=OP-01');
    await expect(tile(page, 'OP01-001')).toContainText('⟲ Rotated');
  });

  test('falls back to the text card face when images are blocked, and says so honestly', async ({
    page,
  }) => {
    await page.route(IMAGES, (r) => r.abort('blockedbyclient'));
    await page.goto('./cards');
    const face = tile(page, 'OP17-039').locator('.face');
    await expect(face).toHaveAttribute('data-art', 'text');
    await expect(face.locator('.face-text-body')).toContainText('[When Attacking]');
    await expect(face.locator('.face-name')).toHaveText(/Rocks/);
    const box = await tile(page, 'OP17-039').boundingBox();
    expect(Math.round(box!.height)).toBe(Math.round((box!.width * 88) / 63));
    await expect(page.getByText("Some card images didn't load")).toBeVisible();
    await expectNoAxeViolations(page);
    await tile(page, 'OP17-039').click();
    await expect(
      page
        .getByRole('dialog')
        .getByText("Couldn't load the card image (optcgapi.com didn't respond)."),
    ).toBeVisible();
  });

  test('a set that fails to load says so and can be retried', async ({ page }) => {
    await serveArt(page);
    let fail = true;
    await page.route(/\/assets\/OP-17-[^/]*\.js$/, (r) =>
      fail ? r.abort('failed') : r.continue(),
    );
    await page.goto('./cards');
    await expect(status(page)).toHaveText("Couldn't load OP-17");
    await expect(page.getByRole('alert')).toContainText("The card list didn't load");
    fail = false;
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(status(page)).toHaveText(`${op17.length} cards in ${NEWEST}`);
  });
});
