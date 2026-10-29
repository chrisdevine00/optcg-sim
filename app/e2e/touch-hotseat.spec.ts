/**
 * Touch hotseat defence (review M3-32), with real touch input: a tap on the veil shows the hand
 * until "Hide my hand" or the commit, and taps stage Counters while it is shown.
 */
import { expect, test } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';

test.use({ hasTouch: true, viewport: { width: 1024, height: 690 } });

test('a defender on a touch screen can see their hand and stage Counters', async ({ page }) => {
  await startGame(page, 'scenario=defend&speed=4');
  expect(await nextDecision(page)).toBe('main');
  await page.locator('[data-zone="my-row"].bc-leader').tap();
  await page.locator('[data-zone="opp-row"].bc-leader').tap();
  await page.locator('#confirm-attack').tap();
  expect(await nextDecision(page)).toBe('block');
  // Tap: the hand shows, and stays shown with no finger down.
  await page.locator('.hand-veil').tap();
  const counters = page.locator('[data-zone="hand"][data-glyph="play"]');
  await expect(counters).toHaveCount(4);
  await counters.first().tap();
  await expect(page.locator('[data-zone="hand"][data-glyph="pick"]')).toHaveCount(1);
  // Hide my hand: veiled again; the staging is kept, as a count.
  await page.locator('#hide-hand').tap();
  await expect(page.locator('.hand-veil')).toBeVisible();
  await expect(page.locator('#decision')).toContainText('1 staged');
  // Show again and stage enough to stop the attack (8000 vs 7000), then commit.
  await page.locator('.hand-veil').tap();
  await page.locator('[data-zone="hand"][data-glyph="play"]').first().tap();
  await page.locator('[data-zone="hand"][data-glyph="play"]').first().tap();
  await expect(page.locator('#commit-defence')).toContainText('Counter +3000');
  await page.locator('#commit-defence').tap();
  await expect(page.locator('.log-row').filter({ hasText: 'Attack fails' })).toHaveCount(1);
  // The commit ended the reveal: no hand is on screen for whoever looks next.
  await expect(page.locator('.bc[data-zone="hand"]')).toHaveCount(0);
});
