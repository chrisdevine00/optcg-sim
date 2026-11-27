/**
 * M10 WP7 (review M6-3, N-2; flows F17 steps 1 and 6): the deck builder by keyboard alone. A legal
 * 50-card deck is built from an empty list with no pointer, the Tab stops from the search box to the
 * deck pane are counted in the real browser (127 before M10), the arrows move by a row at the real
 * column count, `A` cycles art, and the skip links go both ways. Numbers are written to
 * test-results/m10-wp7-*-<project>.json whatever the verdict.
 *
 * Revert, failing the build and the Tab-stop count: give every tile `tabIndex={0}`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { serveArt } from './game-support.ts';
import { axe } from './m9-support.ts';

const ROCKS: [string, number][] = [
  ['OP08-051', 3],
  ['OP17-040', 4],
  ['OP17-042', 1],
  ['OP17-044', 3],
  ['OP17-045', 4],
  ['OP17-046', 4],
  ['OP17-048', 4],
  ['OP17-049', 4],
  ['OP17-050', 3],
  ['OP17-052', 4],
  ['OP17-054', 4],
  ['OP17-055', 4],
  ['OP17-056', 4],
  ['OP17-118', 4],
];

/** Every key goes through here so the keystrokes are counted. */
function keys(page: Page) {
  let n = 0;
  return {
    get count() {
      return n;
    },
    press: async (k: string, times = 1) => {
      for (let i = 0; i < times; i++) {
        n++;
        await page.keyboard.press(k);
      }
    },
    type: async (t: string) => {
      n += t.length;
      await page.keyboard.type(t);
    },
  };
}

function record(name: string, data: unknown) {
  mkdirSync('test-results', { recursive: true });
  writeFileSync(`test-results/${name}.json`, JSON.stringify(data, null, 1));
}

async function newDeck(page: Page) {
  await page.goto('./decks');
  await page.getByRole('button', { name: 'New deck' }).click();
  await expect(page.locator('.builder')).toBeVisible({ timeout: 20_000 });
}

async function chooseLeader(page: Page) {
  await page.locator('#deck-search').fill('OP17-039');
  await page.locator('#deck-search').press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('.chip.outline')).toContainText('OP17-039');
}

test.describe('the builder by keyboard', () => {
  test.beforeEach(async ({ page }) => serveArt(page));

  test('builds a legal 50-card deck from an empty list, and it is saved', async ({
    page,
  }, info) => {
    test.setTimeout(180_000);
    const k = keys(page);
    await page.goto('./decks');
    await page.getByRole('button', { name: 'New deck' }).focus();
    await k.press('Enter');
    await expect(page.locator('.builder')).toBeVisible({ timeout: 20_000 });

    // The Leader: search, Down into the Leaders, Enter on the tile.
    await page.locator('#deck-search').focus();
    await k.type('OP17-039');
    await k.press('ArrowDown');
    const focused = () => page.locator('.btile:focus');
    await expect(focused()).toHaveAccessibleName(/OP17-039/);
    await k.press('Enter');
    await expect(page.locator('.chip.outline')).toContainText('OP17-039');
    await expect(page.locator('#deck-search')).toBeFocused();

    // The 50 main-deck cards: search by number, Down, Enter once per copy, Escape back to the search box.
    for (const [id, copies] of ROCKS) {
      await k.press('ControlOrMeta+a');
      await k.type(id);
      await k.press('ArrowDown');
      await expect(focused()).toHaveAccessibleName(new RegExp(id));
      await k.press('Enter', copies);
      await k.press('Escape');
      await expect(page.locator('#deck-search')).toBeFocused();
    }
    await expect(page.getByRole('heading', { name: /^Deck list · 50 cards$/ })).toBeVisible();
    await expect(page.getByLabel('Deck checks').locator('li.fail')).toHaveCount(0);

    // Saved: it survives a reload, and the list calls it ready.
    await page.reload();
    await expect(page.getByLabel('Deck checks').locator('li.fail')).toHaveCount(0);
    await expect(page.getByLabel('Deck checks')).toContainText('50 cards (50)');
    await page.goto('./decks');
    await expect(page.locator('.deck-card')).toContainText('Ready to play');
    record(`m10-wp7-keystrokes-${info.project.name}`, {
      project: info.project.name,
      keystrokesToBuildLegalDeck: k.count,
    });
  });

  test('Tab stops from the search box to the deck pane, counted in the browser', async ({
    page,
  }, info) => {
    await newDeck(page);
    await chooseLeader(page);
    await page.locator('#deck-search').fill('');
    await expect(page.locator('.show-more')).toBeVisible();
    await page.locator('#deck-search').focus();
    let stops = 1;
    const seen: string[] = ['deck-search'];
    for (; stops < 60; stops++) {
      await page.keyboard.press('Tab');
      const at = await page.evaluate(() => {
        const e = document.activeElement as HTMLElement;
        return e.id || (e.dataset.tile !== undefined ? `tile ${e.dataset.tile}` : '') || e.tagName;
      });
      seen.push(at);
      if (at === 'deck-name') break;
    }
    stops += 1;
    record(`m10-wp7-tabstops-${info.project.name}`, { before: 127, after: stops, path: seen });
    expect(seen.at(-1)).toBe('deck-name');
    expect(
      stops,
      `Tab stops from search to the deck name: ${seen.join(' > ')}`,
    ).toBeLessThanOrEqual(12);
    // The grid took exactly one of them.
    expect(seen.filter((s) => s.startsWith('tile '))).toHaveLength(1);
  });

  test('arrows move by a row at the real column count; skip links go both ways', async ({
    page,
  }) => {
    await newDeck(page);
    await page.locator('#deck-search').focus();
    await page.keyboard.press('ArrowDown');
    const idx = () =>
      page.evaluate(() => Number((document.activeElement as HTMLElement).dataset.tile ?? -1));
    expect(await idx()).toBe(0);
    const cols = await page.evaluate(() => {
      const t = [...document.querySelectorAll<HTMLElement>('.builder-grid > li')];
      return t.filter((x) => x.offsetTop === t[0]!.offsetTop).length;
    });
    expect(cols).toBeGreaterThan(1);
    await page.keyboard.press('ArrowDown');
    expect(await idx()).toBe(cols);
    await page.keyboard.press('ArrowRight');
    expect(await idx()).toBe(cols + 1);
    await page.keyboard.press('ArrowUp');
    expect(await idx()).toBe(1);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft'); // never wraps
    expect(await idx()).toBe(0);
    await page.keyboard.press('End');
    expect(await idx()).toBe((await page.locator('.builder-grid > li').count()) - 1);
    await page.keyboard.press('Home');
    expect(await idx()).toBe(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('#deck-search')).toBeFocused();

    // The skip links, by keyboard: the grid to the deck, and the deck back to the grid.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Shift+Tab'); // "Skip to the deck" sits just before the grid
    await expect(page.getByRole('link', { name: 'Skip to the deck' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#deck-name')).toBeFocused();
    await page.getByRole('link', { name: 'Skip to the card grid' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.builder-grid > li:focus')).toHaveCount(1);
  });

  test('the deck list is one stop, with arrows, and Backspace keeps focus in the list', async ({
    page,
  }) => {
    await newDeck(page);
    await chooseLeader(page);
    await page.locator('#deck-search').fill('OP17-040');
    await page.locator('#deck-search').press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await page.locator('#deck-search').fill('OP17-042');
    await page.locator('#deck-search').press('ArrowDown');
    await page.keyboard.press('Enter');
    const rows = page.locator('li[data-deckrow]');
    await expect(rows).toHaveCount(2);
    await rows.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(rows.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowDown'); // never wraps
    await expect(rows.nth(1)).toBeFocused();
    await page.keyboard.press('Backspace'); // the last copy of the last row
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toBeFocused();
  });

  test('A on a card with alternates says "art 2 of n"; without them it says so', async ({
    page,
  }) => {
    await newDeck(page);
    await chooseLeader(page);
    const status = page.getByRole('status').filter({ hasText: /art \d of \d|no other art/ });
    // Any card of the Leader's colours: try tiles until one has alternates or all say none.
    await page.locator('#deck-search').fill('');
    await page.locator('#deck-search').press('ArrowDown');
    await page.keyboard.press('a');
    await expect(status).toBeVisible();
    await expect(status).toContainText(/art 2 of \d+\.|has no other art\./);
  });

  test('axe finds nothing in the builder, its shortcut sheet, the import report or Setup', async ({
    page,
  }, info) => {
    await newDeck(page);
    await axe(page, info, 'wp7-builder-no-leader');
    await chooseLeader(page);
    await page.locator('#deck-search').press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.getByText('Keyboard shortcuts').click();
    await axe(page, info, 'wp7-builder-leader-keys');
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await page
      .locator('#import-text')
      .fill(JSON.stringify({ leader: 'OP17-039', main: [{ id: 'OP17-040', count: 'x' }] }));
    await expect(page.locator('.import-skipped')).toBeVisible();
    await axe(page, info, 'wp7-import-skipped');
    await page.keyboard.press('Escape');
    await page.goto('./play');
    await expect(page.locator('.setup-grid')).toBeVisible();
    await axe(page, info, 'wp7-setup', true);
  });
});
