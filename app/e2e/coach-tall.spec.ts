/**
 * M7-R2: while a tall decision (a defence) owns the rail, the coach is its strip. Why, Math and
 * Tempo cannot show their content there, so their buttons are honestly unavailable: aria-disabled
 * with a reason, `aria-pressed` false, no profile write, and nothing opens when the decision ends.
 */
import { expect, test, type Page } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';

const profile = (page: Page) =>
  page.evaluate(() => JSON.parse(window.localStorage.getItem('optcg.coach.v1') ?? '{}'));

/** Play End turn until the AI attacks and a tall defence decision is owed. */
async function reachDefence(page: Page): Promise<void> {
  for (let i = 0; i < 12; i++) {
    const k = await nextDecision(page, 60_000);
    if (k === 'block' || k === 'counter') return;
    if (k === 'main') await page.locator('#endturn-btn').click();
    else if (k === 'chooseFirst') await page.locator('#first-btn').click();
    else if (k === 'mulligan') await page.locator('#keep-btn').click();
    else if (k === 'trigger') await page.locator('#trigger-hand').click();
    else if (k === 'optional') await page.locator('#skip-btn').click();
    else if (k === 'order') await page.locator('#order-0').click();
    else if (k === 'choose') await page.locator('#decision .opts button').first().click();
    await page.waitForTimeout(50);
  }
  throw new Error('no defence reached');
}

test.describe('coach tabs during a tall decision (M7-R2)', () => {
  test('Why, Math and Tempo say they are unavailable and change nothing', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        if (!window.sessionStorage.getItem('tall-seeded')) {
          window.localStorage.clear();
          window.sessionStorage.setItem('tall-seeded', '1');
        }
      } catch {
        /* blocked */
      }
    });
    await startGame(page, 'scenario=ub-why-1&opp=pirate&speed=4&aibudget=iterations');
    await reachDefence(page);
    const coach = page.locator('[aria-label="Coach"]');
    await expect(coach).toHaveAttribute('data-mode', 'strip');
    const before = await profile(page);
    for (const name of ['Why', 'Math', 'Tempo']) {
      const b = coach.getByRole('button', { name: new RegExp(`^${name}`) });
      await expect(b).toHaveAttribute('aria-disabled', 'true');
      await expect(b).toHaveAttribute('aria-pressed', 'false');
      await expect(b).toHaveAttribute('title', /Not available while a decision is open/);
      // aria-disabled buttons are still pressable by a pointer: force past the enabled check.
      await b.click({ force: true });
      await expect(b).toHaveAttribute('aria-pressed', 'false');
      await expect(coach).toHaveAttribute('data-mode', 'strip');
    }
    expect(await profile(page)).toEqual(before);
    expect((await profile(page)).expanded ?? false).toBe(false);
    // The decision ends: the coach stays a strip and the buttons work again.
    await page.locator('#take-hit').click();
    expect(await nextDecision(page, 60_000)).toMatch(/main|block|counter|trigger|over/);
    await page.waitForTimeout(400);
    expect((await profile(page)).expanded ?? false).toBe(false);
    await expect(coach).toHaveAttribute('data-mode', 'strip');
  });
});
