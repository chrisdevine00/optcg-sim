import { expect, test, type Page } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';

/** L screen-reader pass, fix round 2: L-SR7 (arrows), L-SR12 (coach key hints), L-SR13 (the count). */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* blocked */
    }
  });
});

const polite = (page: Page) => page.locator('#announce-polite');
const SCENARIO = 'scenario=a11y-l&speed=step&opp=rookie&aibudget=iterations';

test('L-SR7: the attack title says "to", the arrow glyph is hidden from readers', async ({
  page,
}) => {
  await startGame(page, SCENARIO);
  expect(await nextDecision(page)).toBe('main');
  await page.locator('[data-zone="my-row"].bc-leader').focus();
  await page.keyboard.press('a');
  await page.locator('[data-zone="opp-row"].bc-leader').focus();
  await page.keyboard.press('Enter');
  const t = page.locator('#decision-title');
  await expect(t.locator('[aria-hidden="true"]')).toHaveText('→');
  await expect(t.locator('.sr-only')).toHaveText('to');
});

test('L-SR12: the coach buttons say where L and C work', async ({ page }) => {
  await startGame(page, SCENARIO);
  expect(await nextDecision(page)).toBe('main');
  const lethal = page.locator('#coach-lethal');
  await expect(lethal).not.toHaveAttribute('aria-keyshortcuts', /.*/);
  await expect(lethal).toHaveAccessibleDescription(
    /L key works from the board\. Here, press Enter/,
  );
  const chev = page.locator('.coach-chevron');
  await expect(chev).not.toHaveAttribute('aria-keyshortcuts', /.*/);
  await expect(chev).toHaveAccessibleDescription(/C key works from the board/);
});

test('L-SR13: Check my count grades only the question being asked', async ({ page }) => {
  await startGame(page, SCENARIO);
  expect(await nextDecision(page)).toBe('main');
  await page.keyboard.press('l');
  await expect(page.locator('.coach-head')).toContainText('Lethal is on the board.', {
    timeout: 30_000,
  });
  await page.keyboard.press('l');
  await page.getByRole('button', { name: 'Count it with me' }).click();
  await page.getByLabel('Hits needed').fill('3');
  await page.getByRole('button', { name: 'Check my count' }).click();
  await expect(polite(page)).toContainText('Hits: not quite');
  await expect(polite(page)).not.toContainText('Attackers');
  await expect(polite(page)).not.toContainText('Split');
});
