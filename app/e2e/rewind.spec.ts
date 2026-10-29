import { expect, test } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';

test.describe('rewind (flows F11)', () => {
  test('rewinds a DON!! burst as one move, marks the game, and goes forward again', async ({
    page,
  }) => {
    await startGame(page, 'scenario=full&speed=4');
    expect(await nextDecision(page)).toBe('main');
    const leader = page.locator('[data-zone="my-row"].bc-leader');
    await expect(leader).toHaveAccessibleName(/5000 power/);
    await page.locator('.costarea .rowbtn.legal').click();
    await leader.click();
    await leader.click();
    await expect(leader).toHaveAccessibleName(/7000 power, 2 DON!!/);
    await page.locator('#don-done').click();
    await page.locator('#decision-title').focus();
    await page.keyboard.press('u');
    await expect(leader).toHaveAccessibleName(/5000 power/);
    await expect(page.locator('.toast')).toContainText(/Back to: before give 2 DON!!/);
    await expect(page.locator('.rail-head')).toContainText('Rewound');
    await page.locator('.toast button').click();
    await expect(leader).toHaveAccessibleName(/7000 power, 2 DON!!/);
  });

  test('the rewind list restores the game to before a chosen move', async ({ page }) => {
    await startGame(page, 'scenario=full&speed=4');
    await nextDecision(page);
    // Play a Character: the area is full, so the engine asks which to trash (a choose decision).
    await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
    await page.getByRole('menuitem', { name: /^▶ Play/ }).click();
    expect(await nextDecision(page)).toBe('choose');
    await expect(page.locator('#choose-done')).toHaveAttribute('aria-disabled', 'true');
    await page.locator('#decision .opts button').first().click();
    await expect(page.locator('.count-line')).toHaveText('1 of 1 chosen');
    await page.locator('#choose-done').click();
    expect(await nextDecision(page)).toBe('main');
    await expect(page.getByRole('group', { name: /Your hand, 1 card\b/ })).toHaveCount(1);
    await page.locator('#decision-title').focus();
    await page.keyboard.press('r');
    const dialog = page.getByRole('dialog', { name: 'Rewind to before a move' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('option').last().locator('button').click();
    await dialog.getByRole('button', { name: 'Rewind to before it' }).click();
    await expect(page.getByRole('group', { name: /Your hand, 2 cards/ })).toHaveCount(1);
  });
});
