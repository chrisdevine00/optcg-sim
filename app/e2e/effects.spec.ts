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
    // The DON!! went back to the DON!! deck.
    expect(errors).toEqual([]);
  });
});
