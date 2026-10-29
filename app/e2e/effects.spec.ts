import { expect, test } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';

test.describe('M4a: card effects through the UI', () => {
  test("Kaido's [When Attacking] DON!! −1 gives the opponent's Character −2000", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await startGame(page, 'scenario=kaido');
    expect(await nextDecision(page)).toBe('main');
    // Attack the opponent's Leader with the Kaido Leader.
    await page.locator('[data-zone="my-row"].bc-leader[data-glyph="attack"]').click();
    await page.locator('[data-zone="opp-row"].bc-leader[data-glyph="target"]').click();
    await page.locator('#confirm-attack').click();
    // The optional ability asks first (CR 8-3-1-4: its DON!! −1 cost may be declined).
    expect(await nextDecision(page)).toBe('optional');
    await expect(page.locator('#decision .dec-lead')).toContainText('Kaido');
    await page.locator('#use-btn').click();
    // One DON!! location only, so the cost is paid at once; then the target.
    expect(await nextDecision(page)).toBe('choose');
    await page.locator('#decision .opts button').filter({ hasText: 'Babanuki' }).click();
    await page.locator('#choose-done').click();
    const babanuki = page.locator('[data-card="OP01-107"]');
    await expect(babanuki.locator('.sr-only')).toContainText(/5\D?000/);
    // The log names the cost and the effect (M4a-05), and the prompt named the cost (M4a-09).
    await expect(page.locator('.log-row').filter({ hasText: 'Babanuki −2000' })).toHaveCount(1);
    await expect(
      page.locator('.log-row').filter({ hasText: 'Return 1 DON!! to the DON!! deck' }),
    ).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('the optional prompt states its cost; Enter uses it (flows F8d)', async ({ page }) => {
    await startGame(page, 'scenario=kaido');
    expect(await nextDecision(page)).toBe('main');
    await page.locator('[data-zone="my-row"].bc-leader[data-glyph="attack"]').click();
    await page.locator('[data-zone="opp-row"].bc-leader[data-glyph="target"]').click();
    await page.locator('#confirm-attack').click();
    expect(await nextDecision(page)).toBe('optional');
    await expect(page.locator('#decision .dec-lead')).toContainText('DON!! −1');
    await expect(page.locator('#use-btn')).toBeFocused();
    await page.keyboard.press('Enter');
    expect(await nextDecision(page)).toBe('choose');
    // Enter does not throw the paid effect away with "Choose none" (M4a-09).
    await page.locator('#decision-title').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    expect(await nextDecision(page)).toBe('choose');
  });

  test('[Activate: Main] from the action menu; an unusable one says why (M4a-03)', async ({
    page,
  }) => {
    await startGame(page, 'scenario=activate');
    expect(await nextDecision(page)).toBe('main');
    // Stussy needs 3 active DON!! to rest and p1 has 2: the item is there, disabled, with why.
    await page.locator('[data-zone="my-chars"][data-card="OP17-054"]').click();
    const no = page.getByRole('menuitem', { name: /Activate: Up to 1 of your opponent/ });
    await expect(no).toHaveAttribute('aria-disabled', 'true');
    await expect(no).toContainText("can't pay");
    await page.keyboard.press('Escape');
    await page.locator('[data-zone="my-chars"][data-card="EB04-031"]').click();
    const use = page.getByRole('menuitem', { name: /Activate: Add up to 1 active/ });
    await expect(use).toBeVisible();
    await use.click();
    await expect(
      page.locator('.log-row').filter({ hasText: 'King: Add up to 1 active' }),
    ).toHaveCount(1);
    await expect(page.locator('.log-row').filter({ hasText: 'Add 1 DON!!' }).first()).toBeVisible();
  });

  test('[Activate: Main] by keyboard: Enter on the card, then E (M4a-03)', async ({ page }) => {
    await startGame(page, 'scenario=activate');
    expect(await nextDecision(page)).toBe('main');
    await page.locator('[data-zone="my-chars"][data-card="EB04-031"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('e');
    await expect(
      page.locator('.log-row').filter({ hasText: 'King: Add up to 1 active' }),
    ).toHaveCount(1);
  });
});
