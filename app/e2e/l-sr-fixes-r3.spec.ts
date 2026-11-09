import { expect, test, type Page } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';

/**
 * L screen-reader pass, fix round 3: L-SR16 (L three times in a row), L-SR20 (polite lines are not
 * dropped), L-SR21 (the optional-effect decision is spoken), L-SR22 (C says what it did), L-SR23
 * (Confirm attack's name and description).
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* blocked */
    }
  });
});

const SCENARIO = 'scenario=a11y-l&speed=step&opp=rookie&aibudget=iterations';
const inCoach = (page: Page) => page.evaluate(() => !!document.activeElement?.closest('.coach'));

async function toConfirm(page: Page) {
  expect(await nextDecision(page)).toBe('main');
  await page.locator('[data-zone="my-row"].bc-leader').focus();
  await page.keyboard.press('a');
  await page.locator('[data-zone="opp-row"].bc-leader').focus();
  await page.keyboard.press('Enter');
}

test('L-SR16: L, L, L from the board: focus stays put on tiers 1 and 2, moves to the line at tier 3', async ({
  page,
}) => {
  await startGame(page, SCENARIO);
  expect(await nextDecision(page)).toBe('main');
  await page.locator('[data-zone="my-row"].bc-leader').focus();
  const polite = page.locator('#announce-polite');
  await page.keyboard.press('l');
  await expect(polite).toContainText('Lethal: proven', { timeout: 30_000 });
  expect(await inCoach(page)).toBe(false);
  await page.keyboard.press('l');
  await expect(polite).toContainText('You need');
  await page.waitForTimeout(200);
  expect(await inCoach(page)).toBe(false);
  await page.keyboard.press('l');
  await expect(polite).toContainText('You have lethal');
  await expect.poll(() => inCoach(page)).toBe(true);
});

test('L-SR20 and L-SR22: C says what it did, and two quick polite lines are both written in order', async ({
  page,
}) => {
  await startGame(page, SCENARIO);
  expect(await nextDecision(page)).toBe('main');
  await page.locator('[data-zone="my-row"].bc-leader').focus();
  await page.evaluate(() => {
    const w = window as unknown as { __polite: string[] };
    w.__polite = [];
    const el = document.getElementById('announce-polite')!;
    new MutationObserver(() => {
      const t = (el.textContent ?? '').trim();
      if (t && w.__polite.at(-1) !== t) w.__polite.push(t);
    }).observe(el, { childList: true, subtree: true, characterData: true });
  });
  // Two presses a few milliseconds apart: before the queue the second replaced the first.
  await page.keyboard.press('c');
  await page.keyboard.press('c');
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __polite: string[] }).__polite))
    .toEqual(['Coach open.', 'Coach closed.']);
});

test('L-SR21: the optional-effect buttons carry the prompt and the cost as their description', async ({
  page,
}) => {
  await startGame(page, SCENARIO);
  await toConfirm(page);
  await page.locator('#confirm-attack').click();
  const use = page.locator('#use-btn');
  await expect(use).toBeFocused();
  const prompt = (await page.locator('#optional-prompt').textContent())?.trim() ?? '';
  expect(prompt).toMatch(/DON/);
  await expect(use).toHaveAccessibleDescription(new RegExp(prompt.slice(0, 12)));
  await expect(use).toHaveAccessibleDescription(/skip/i);
  await expect(page.locator('#skip-btn')).toHaveAccessibleDescription(
    new RegExp(prompt.slice(0, 12)),
  );
});

test('L-SR23: Confirm attack is named by its label alone; the description has no stray pause', async ({
  page,
}) => {
  await startGame(page, SCENARIO);
  await toConfirm(page);
  const b = page.locator('#confirm-attack');
  await expect(b).toBeFocused();
  await expect(b).toHaveAccessibleName(/^Confirm attack\s*$/);
  const d = await b.evaluate(() => document.getElementById('confirm-spoken')?.textContent ?? '');
  expect(d).not.toMatch(/[[\]]/);
  expect(d).not.toMatch(/\s\./);
});
