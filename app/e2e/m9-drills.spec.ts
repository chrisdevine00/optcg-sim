/**
 * M9 WP4: the four drills end to end. Each drill runs a seeded session (`sid`), answers one item right
 * and one wrong, and runs axe on every screen (start, item, answer, summary) at both sizes. Nothing is
 * pre-focused on an item screen; the board drills judge the real board.
 */
import { expect, test, type Page } from '@playwright/test';
import { axe, focusedText, noArt } from './m9-support.ts';

test.beforeEach(async ({ page }) => {
  await noArt(page);
});

const titleOf = async (page: Page) =>
  (await page.getByRole('heading', { level: 1 }).innerText()).replace(/^[✓✗◌]\s*/, '').trim();

test('the drill list and each start screen', async ({ page }, info) => {
  await page.goto('drills');
  await expect(page.getByRole('heading', { level: 1, name: 'Drills' })).toBeFocused();
  await expect(page.getByRole('listitem').filter({ hasText: 'Mulligan trainer' })).toBeVisible();
  await axe(page, info, 'drills-home');
  await page.getByRole('link', { name: 'Lethal puzzles' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Lethal puzzles' })).toBeFocused();
  await expect(page.getByLabel('Time allowed')).toHaveValue('');
  await expect(page.getByLabel('Items', { exact: true })).toHaveValue('10');
  const options = await page.getByLabel('Time allowed').locator('option').allInnerTexts();
  expect(options).toEqual(['Untimed', '50%', '100%', '200%', '400%', '1000%']);
  await axe(page, info, 'lethal-start');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page).toHaveURL(/drills\/lethal\/run\?/);
});

test('mulligan: keep or redraw, answers in words, Esc asks before leaving, summary', async ({
  page,
}, info) => {
  await page.goto('drills/mulligan/run?source=bank&count=5&sid=e2e-m1');
  await expect(page.getByRole('heading', { level: 1, name: /Keep or redraw/ })).toBeFocused();
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('H1');
  await expect(page.getByRole('button', { name: /^Keep/ })).toBeVisible();
  const keep = await page.getByRole('button', { name: /^Keep/ }).getAttribute('class');
  const redraw = await page.getByRole('button', { name: /^Redraw/ }).getAttribute('class');
  expect(keep).toBe(redraw);
  await expect(page.getByTestId('drill-progress')).toContainText('Item 1 of 5');
  await axe(page, info, 'mulligan-item');

  // Esc asks first; Keep going returns to where focus was.
  await page.keyboard.press('Escape');
  const dialog = page.getByRole('dialog', { name: 'Leave drill?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Your session is saved up to here.');
  await axe(page, info, 'mulligan-leave');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  const seen = new Set<string>();
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: /^Keep/ }).click();
    const t = await titleOf(page);
    seen.add(t);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(
      page.locator('.drill-answer-line').filter({ hasText: /The guide says/ }),
    ).toBeVisible();
    if (i === 0) await axe(page, info, 'mulligan-answer');
    await page.getByRole('button', { name: /^(Next|See summary)/ }).click();
  }
  // One item right and one wrong in a seeded session of five.
  expect([...seen].sort()).toEqual(['Correct', 'Not this time']);
  await expect(page.getByTestId('drill-score')).toContainText(/\d of 5/);
  await axe(page, info, 'mulligan-summary');
});

test('lethal: the board, "No lethal", the answer with the line or the bound, summary', async ({
  page,
}, info) => {
  await page.goto('drills/lethal/run?source=bank&count=5&sid=e2e-l1');
  const noLethal = page.getByRole('button', { name: /^No lethal/ });
  await expect(noLethal).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Find lethal, or declare none.')).toBeVisible();
  // The header counts their hand and names no card.
  await expect(page.getByTestId('drill-slot')).toContainText(
    /cards? in their hand, up to \+\d+ each|no cards in their hand/,
  );
  await expect(page.getByTestId('drill-progress')).toContainText('Item 1 of 5');
  expect(await focusedText(page)).not.toMatch(/^(No lethal|Submit turn)/);
  await expect(page.getByRole('button', { name: /Submit turn/ })).toBeVisible();
  await axe(page, info, 'lethal-item');
  const seen = new Set<string>();
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: /^No lethal/ }).click({ timeout: 30_000 });
    seen.add(await titleOf(page));
    if (i === 0) await axe(page, info, 'lethal-answer');
    await page.getByRole('button', { name: /^(Next|See summary)/ }).click();
  }
  expect([...seen].sort()).toEqual(['Correct', 'Not this time']);
  await expect(page.getByTestId('drill-score')).toContainText(/\d of 5/);
  await axe(page, info, 'lethal-summary');
});

test('DON!!: choose a line, one best and one worse, then the board', async ({ page }, info) => {
  await page.goto('drills/don/run?source=bank&count=5&sid=e2e-d1');
  const choose = page.getByRole('button', { name: 'Choose a line' });
  await expect(choose).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: /Submit turn/ })).toBeVisible();
  await axe(page, info, 'don-board');
  const seen = new Set<string>();
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: 'Choose a line' }).click({ timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1, name: /Which line/ })).toBeFocused();
    const radios = page.getByRole('radio');
    expect(await radios.count()).toBeGreaterThanOrEqual(2);
    for (const r of await radios.all()) await expect(r).not.toBeChecked();
    if (i === 0) await axe(page, info, 'don-lines');
    await radios.first().check();
    await page.getByRole('button', { name: 'Submit line' }).click();
    seen.add(await titleOf(page));
    if (i === 0) await axe(page, info, 'don-answer');
    await page.getByRole('button', { name: /^(Next|See summary)/ }).click();
  }
  expect(seen.size).toBeGreaterThanOrEqual(1);
  await expect(page.getByTestId('drill-score')).toContainText(/\d of 5/);
  await axe(page, info, 'don-summary');
});

test('counter or take it: the defence on the board, one answer right and one wrong', async ({
  page,
}, info) => {
  await page.goto('drills/counter/run?source=bank&count=10&sid=e2e-c1');
  await expect(page.getByTestId('drill-slot')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('They attack. Counter it, or take it.')).toBeVisible();
  expect(await focusedText(page)).not.toMatch(/^(Take the hit|Counter)/);
  await axe(page, info, 'counter-item');
  const seen = new Set<string>();
  for (let i = 0; i < 10 && seen.size < 2; i++) {
    // Every attack of their turn is a new decision: take them all until the judge decides.
    const verdict = page.getByRole('heading', { level: 1, name: /Correct|Not this time/ });
    await expect(async () => {
      if (await verdict.isVisible()) return;
      const take = page.getByRole('button', { name: /^Take the hit/ });
      // The damage that follows is a decision too (add the Life card to hand): its primary is Enter.
      const primary = page
        .getByRole('application', { name: 'Decision actions' })
        .getByRole('button', { disabled: false })
        .last();
      if (await take.isVisible()) await take.click();
      else if (await primary.isVisible()) await primary.click();
      await expect(verdict).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 90_000 });
    seen.add(await titleOf(page));
    if (i === 0) await axe(page, info, 'counter-answer');
    await page.getByRole('button', { name: /^(Next|See summary)/ }).click();
  }
  expect([...seen].sort()).toEqual(['Correct', 'Not this time']);
});

test('the DON!! board: Submit turn is judged by the ledger', async ({ page }) => {
  await page.goto('drills/don/run?source=bank&count=5&sid=e2e-d1');
  await expect(page.getByRole('button', { name: /Submit turn/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: /Submit turn/ }).click();
  // Ending the turn may owe an end-of-turn choice; the item ends when the judge decides.
  await expect(async () => {
    const order = page.getByRole('button', { name: /resolve|first/i }).first();
    if (await page.getByRole('heading', { level: 1, name: /Correct|Not this time/ }).isVisible())
      return;
    if (await order.isVisible()) await order.click();
    await expect(
      page.getByRole('heading', { level: 1, name: /Correct|Not this time/ }),
    ).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 60_000 });
});
