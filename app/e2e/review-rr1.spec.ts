/** M3 re-review 1: M3-27 (inspector during a reveal), M3-28 (game over after a defence), M3-30. */
import { expect, test, type Page } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';

async function attackLeader(page: Page) {
  await startGame(page, 'scenario=defend&speed=4');
  expect(await nextDecision(page)).toBe('main');
  await page.locator('[data-zone="my-row"].bc-leader').click();
  await page.locator('[data-zone="opp-row"].bc-leader').click();
  await page.locator('#confirm-attack').click();
  expect(await nextDecision(page)).toBe('block');
  // The decision takes focus as it arrives (accessibility §3.2); start from there.
  await expect(page.locator('#decision-title')).toBeFocused();
}

test('inspecting a card while R is held never leaves the keyboard dead (M3-27)', async ({
  page,
}) => {
  await attackLeader(page);
  await page.keyboard.down('r');
  const card = page.locator('.bc[data-zone="hand"]').first();
  await card.focus();
  await page.keyboard.press('i');
  await expect(page.getByRole('dialog', { name: /^Inspector/ })).toBeVisible();
  await page.keyboard.up('r');
  // The reveal ended: the inspector closes and focus returns to the veil.
  await expect(page.locator('.dock')).toHaveCount(0);
  await expect(page.locator('.hand-veil')).toBeFocused();
  // Every key works again: R reveals the hand once more.
  await page.keyboard.down('r');
  await expect(page.locator('.bc[data-zone="hand"]')).toHaveCount(4);
  await page.keyboard.up('r');
  await expect(page.locator('.hand-veil')).toBeVisible();
});

test('game over is announced and takes focus after a defence was announced (M3-28)', async ({
  page,
}) => {
  await startGame(page, 'scenario=last&speed=4');
  expect(await nextDecision(page)).toBe('main');
  await page.locator('[data-zone="my-row"].bc-leader').click();
  await page.locator('[data-zone="opp-row"].bc-leader').click();
  await page.locator('#confirm-attack').click();
  expect(await nextDecision(page)).toBe('counter');
  await expect(page.locator('#announce-assertive')).toContainText('Plan your defence');
  await page.locator('#take-hit').click();
  expect(await nextDecision(page)).toBe('trigger');
  await page.locator('#trigger-hand').click();
  expect(await nextDecision(page)).toBe('main');
  await page.locator('.hand-veil').click();
  await page.locator('#endturn-btn').click();
  expect(await nextDecision(page)).toBe('main');
  // Player 1's turn: their Leader hits Player 2's Leader at 0 Life.
  await page.locator('[data-zone="my-row"].bc-leader').click();
  await page.locator('[data-zone="opp-row"].bc-leader').click();
  await page.locator('#confirm-attack').click();
  expect(await nextDecision(page)).toBe('over');
  await expect(page.locator('#announce-assertive')).toContainText('Game over. Player 1 wins');
  await expect(page.locator('#announce-polite')).toContainText('Rematch, or New game.');
  await expect(page.locator('#decision-title')).toBeFocused();
});

test('the hover preview is never a Tab stop (M3-30)', async ({ page }) => {
  await startGame(page, 'scenario=full&speed=4');
  await nextDecision(page);
  await page.locator('.bc[data-zone="hand"]').first().focus();
  await expect(page.locator('.dock')).toBeVisible();
  await expect(page.locator('.dock')).toHaveAttribute('inert', '');
});
