/**
 * M9 WP1: the Meta Explorer by keyboard and axe: tiles (arrows, Enter, M), a guide (sources, our
 * reasoning, chips that open the Inspector, Play links), and the matchup grid (arrows, Enter opens
 * the details, Esc closes and returns focus, Play this matchup). axe runs on each screen.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

async function axe(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: `.cache/m9wp1/${info.project.name}-${name}.png` });
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(
    r.violations.map(
      (v) => `${name}: ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  // No art host is reachable in CI; the screens draw without it.
  await page.route(/\.(png|jpe?g|webp)(\?.*)?$/, (r) => r.abort());
});

test('the tiles: header, sort, arrows, Enter opens a guide, M opens the grid', async ({
  page,
}, info) => {
  await page.goto('meta');
  await expect(page.getByRole('heading', { level: 1, name: 'Meta Explorer' })).toBeFocused();
  await expect(
    page.getByText('English Standard · as of 2026-10-28 · 33 online events, 30 Jul to 28 Oct'),
  ).toBeVisible();
  const tiles = page.getByRole('list', { name: 'Archetypes' }).getByRole('listitem');
  await expect(tiles).toHaveCount(12);
  const rocks = page.getByRole('link', {
    name: 'Rocks.D.Xebec, Blue, tier S on opmetagame, 11.2% of lists, 16.1% since the ban. Guide and 3 lists.',
  });
  await expect(rocks).toBeVisible();
  await expect(page.getByText('Lists: 8 to 13 Oct').first()).toBeVisible();
  await expect(page.getByText('Luffy (Black)').first()).toBeVisible();
  await axe(page, info, 'tiles');

  // One tab stop in the list; arrows move across it.
  await rocks.focus();
  await page.keyboard.press('ArrowRight');
  await expect(tiles.nth(1).getByRole('link')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(rocks).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(tiles.nth(1).getByRole('link')).not.toBeFocused();
  await page.keyboard.press('Home');
  await expect(rocks).toBeFocused();

  await page.getByLabel('Colour', { exact: true }).selectOption('Blue');
  await expect(tiles).toHaveCount(2);
  await page.getByLabel('Colour', { exact: true }).selectOption('');
  await page.getByLabel('Sort by', { exact: true }).selectOption('name');
  await expect(tiles.first()).toContainText('Boa Hancock');

  await page.getByLabel('Sort by', { exact: true }).selectOption('share');
  await page.getByRole('link', { name: /^Rocks\.D\.Xebec, Blue/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/meta\/OP17-039$/);

  await page.goto('meta');
  await expect(page.getByRole('heading', { level: 1, name: 'Meta Explorer' })).toBeFocused();
  await page.keyboard.press('m');
  await expect(page).toHaveURL(/\/meta\/matchups$/);
});

test('a guide: sources, our reasoning, chips, play links', async ({ page }, info) => {
  await page.goto('meta/OP17-039');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Rocks.D.Xebec (Blue) archetype guide' }),
  ).toBeFocused();
  await expect(page.getByText('as of 2026-10-28 · confidence: medium').first()).toBeVisible();
  for (const h of [
    'What the deck is trying to do',
    'Game plan by turn',
    'Defining cards',
    'Mulligan',
    'What it is weak to',
    'Matchups',
    'Sourced lists',
    'Playbook seeds',
  ])
    await expect(page.getByRole('heading', { level: 2, name: h, exact: true })).toBeVisible();
  // A sourced tag is a link; an inference carries the visible mark.
  await expect(page.locator('a.meta-src', { hasText: 'SH-XEB' }).first()).toHaveAttribute(
    'href',
    'https://www.shonentcg.com/blog/op-17-xebec-deck-guide',
  );
  await expect(page.locator('.meta-infer').first()).toHaveText(/our reasoning/);
  const play = page.getByRole('link', { name: 'Play this deck', exact: true });
  await expect(play).toHaveAttribute('href', /\/play\?p1=OP17-039-rocks%231$/);
  await expect(page.getByRole('link', { name: 'Play against this deck' })).toHaveAttribute(
    'href',
    /\/play\?p2=OP17-039-rocks%231$/,
  );
  await expect(
    page.getByRole('link', { name: 'Try the mulligan trainer for this deck' }),
  ).toHaveAttribute('href', /\/drills\/mulligan\?archetype=OP17-039-rocks$/);
  await axe(page, info, 'guide');

  // A defining-card chip opens the Inspector and Esc returns to it.
  const chip = page.getByRole('button', { name: /^OP17-118 / });
  await chip.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(chip).toBeFocused();

  // An unknown guide says so.
  await page.goto('meta/NOPE-000');
  await expect(page.getByRole('heading', { level: 1, name: 'Guide not found' })).toBeFocused();
});

test('the grid: arrows, Enter, Esc, disagreement, Play this matchup', async ({ page }, info) => {
  await page.goto('meta/matchups');
  await expect(page.getByRole('heading', { level: 1, name: 'Matchup grid' })).toBeFocused();
  const table = page.getByRole('table');
  await expect(table.getByRole('rowheader')).toHaveCount(12);
  await expect(table.getByRole('columnheader')).toHaveCount(13);
  const first = table.getByRole('button', { name: /^Rocks against Rocks: mirror/ });
  await expect(first).toBeVisible();
  await axe(page, info, 'grid');

  await first.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-cell="0-2"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-cell="1-2"]')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.locator('[data-cell="1-0"]')).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.locator('[data-cell="1-11"]')).toBeFocused();

  // Rocks against Nico Robin: two sources, two records.
  const robin = page.locator('[data-cell="0-1"]');
  await expect(robin).toHaveAccessibleName(/sources disagree/);
  await robin.focus();
  await page.keyboard.press('Enter');
  const pop = page.getByRole('dialog', { name: 'Rocks against Nico Robin' });
  await expect(pop).toBeFocused();
  await expect(pop).toContainText('Sources disagree');
  await expect(pop).toContainText('11-12');
  await expect(pop).toContainText('35-39');
  await expect(pop).toContainText('Rocks W–L');
  await axe(page, info, 'grid-popover');
  await page.keyboard.press('Escape');
  await expect(pop).toHaveCount(0);
  await expect(robin).toBeFocused();

  await robin.press('Enter');
  const go = page.getByRole('link', { name: 'Play this matchup' });
  await expect(go).toHaveAttribute(
    'href',
    /\/play\?p1=OP17-039-rocks%231&p2=OP09-062-nico-robin%231$/,
  );
});
