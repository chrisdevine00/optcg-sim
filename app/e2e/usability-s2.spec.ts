/**
 * M7 WP7: the S2 task cards 2.3 to 2.5 (docs/design/usability/S2-kit.md) done as the kit says, on
 * their scenarios: Hint on `ub-hint-1`, "Why?" on `ub-why-1`, and the blunder warning on
 * `ub-blunder-1` switched on from Settings. The hint's and warning's content is held by
 * `app/test/usability-s2.test.ts`; this proves the steps in the cards work in the real page.
 */
import { expect, test } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      if (!window.sessionStorage.getItem('s2-seeded')) {
        window.localStorage.clear();
        window.sessionStorage.setItem('s2-seeded', '1');
      }
    } catch {
      /* blocked */
    }
  });
});

test.describe('S2 task cards', () => {
  test('2.3 ub-hint-1: H asks, the line plays Yamato first, nothing is played by asking', async ({
    page,
  }) => {
    await startGame(page, 'scenario=ub-hint-1&opp=pirate&speed=4&aibudget=iterations');
    expect(await nextDecision(page)).toBe('main');
    await page.waitForTimeout(500);
    const log = await page.locator('.log-list').innerText();
    await page.keyboard.press('h');
    await expect(page.locator('.coach-hint')).toBeFocused({ timeout: 5000 });
    await expect(page.locator('.coach-hint')).toHaveAttribute('data-hint', 'ready', {
      timeout: 30_000,
    });
    await expect(page.locator('.coach-hint')).toContainText('Yamato');
    await expect(page.getByRole('button', { name: /^Do step 1/ })).toBeVisible();
    await expect(page.locator('.coach-hint')).toContainText(/2000 of counters/);
    expect(await page.locator('.log-list').innerText()).toBe(log);
  });

  test('2.4 ub-why-1: after the AI’s turn, its Why? chips, the Coach’s Why button and W explain its moves', async ({
    page,
  }) => {
    await startGame(page, 'scenario=ub-why-1&opp=pirate&speed=4&aibudget=iterations');
    // The AI plays its turn; the game stops at your Main Phase.
    expect(await nextDecision(page, 60_000)).toBe('main');
    // The Why? on the Yamato line cites the AI's guide.
    const chip = page.getByRole('button', { name: /^Why\? Play Yamato/ });
    await expect(chip).toBeVisible();
    await chip.click();
    const panel = page.getByRole('dialog', { name: 'Why?' });
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('Yamato');
    // The reasons are one press of "More" away (the claim and outcome come first).
    await panel.getByRole('button', { name: /More/ }).click();
    await expect(panel).toContainText(/first three turns/);
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    // The Coach's Why button explains its last move, ending its turn.
    await page.getByRole('button', { name: 'Why', exact: true }).click();
    await expect(page.locator('[aria-label="Why the AI did that"]')).toContainText(
      'ended its turn',
    );
    // W opens the same explanation in a window.
    await page.locator('#decision-title').focus();
    await page.keyboard.press('w');
    await expect(page.getByRole('dialog', { name: 'Why?' })).toBeVisible();
  });

  test('2.5 ub-blunder-1: Settings → Blunder warning on, then End turn is held with the lethal note', async ({
    page,
  }) => {
    await page.goto('./settings');
    await page.getByLabel('Blunder warning').check();
    await expect(page.getByTestId('settings-status')).toHaveText('Blunder warning: on.');
    await startGame(page, 'scenario=ub-blunder-1&opp=pirate&speed=4&aibudget=iterations');
    expect(await nextDecision(page)).toBe('main');
    await page.waitForTimeout(1500);
    await page.locator('#endturn-btn').click();
    const note = page.locator('.blunder-note');
    await expect(note).toBeVisible();
    await expect(note).toContainText(/lethal/i);
    await expect(page.locator('#endturn-btn')).toContainText('Commit anyway');
    expect(await page.locator('#decision').getAttribute('data-kind')).toBe('main');
    // Nothing moved focus into the coach (the warning does not take the keyboard).
    expect(
      await page.evaluate(() => !!document.activeElement?.closest('[aria-label="Coach"]')),
    ).toBe(false);
  });
});
