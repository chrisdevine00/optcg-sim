/**
 * Review M3-35, M3-36: an effect decision the defender owes while their hand is veiled is
 * addressed to them by name, never in the opponent's wording, and answering it, or conceding while
 * the hand is shown, exposes nothing private to the other player.
 */
import { expect, test, type Page } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';

const P1_PRIVATE = ['Vergo', 'Krieg', 'Hajrudin', 'Shinobu', 'Mocha'];
const P2_PRIVATE = ['Fukurokuju', 'Urashima', 'Mohji'];

async function expectHidden(page: Page, names: string[], step: string) {
  const text = await page.evaluate(() => {
    const parts = [document.body.textContent ?? ''];
    for (const el of document.body.querySelectorAll('*'))
      for (const a of el.attributes)
        if (a.name !== 'style' && a.name !== 'class') parts.push(a.value);
    return parts.join('\n');
  });
  for (const n of names) expect(text.includes(n), `${step}: "${n}" is exposed`).toBe(false);
}

test('the defender’s veiled effect decisions name them, offer the reveal, and leak nothing', async ({
  page,
}) => {
  await startGame(page, 'scenario=veiled&speed=4');
  expect(await nextDecision(page)).toBe('main');
  // Player 2's Marco attacks Player 1's Leader.
  await page.locator('[data-zone="my-chars"][data-glyph="attack"]').click();
  await page.locator('[data-zone="opp-row"].bc-leader').click();
  await page.locator('#confirm-attack').click();
  // Player 1's Kaido Leader asks whether to use its DON!! −1, under the veil.
  expect(await nextDecision(page)).toBe('optional');
  await expect(page.locator('.hand-veil')).toBeVisible();
  await expect(page.locator('#decision-title')).toHaveText('Player 1: your decision');
  await expect(page.locator('#decision')).not.toContainText('Your opponent');
  await expect(page.locator('#show-hand')).toBeVisible();
  // Use and Skip are both offered, whatever the hand holds (review M3-39).
  await expect(page.locator('#use-btn')).not.toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('#skip-btn')).toBeVisible();
  await expectHidden(page, [...P1_PRIVATE, ...P2_PRIVATE], 'veiled optional');
  // Its cost reads no hidden zone, so Use applies at once; the target choice then asks for the
  // hand to be shown (a choice under the veil offers no answers at all).
  await page.locator('#use-btn').click();
  expect(await nextDecision(page)).toBe('choose');
  await expect(page.locator('#decision-title')).toHaveText('Player 1: your decision');
  await expect(page.locator('#decision')).not.toContainText('make room');
  await expect(page.locator('#decision .opts button')).toHaveCount(0);
  await expectHidden(page, [...P1_PRIVATE, ...P2_PRIVATE], 'veiled target choice');
  await page.locator('#show-hand').click();
  await page.locator('#decision .opts button', { hasText: 'Marco' }).click();
  await page.locator('#choose-done').click();
  // The defence itself, still veiled.
  expect(await nextDecision(page)).toBe('counter');
  await expectHidden(page, [...P1_PRIVATE, ...P2_PRIVATE], 'veiled defence after the effect');
  // M3-36: concede while the hand is shown; the game-over board shows no private card.
  // (Marco is now 3000 against Kaido's 5000: the attack will fail, so concede from here.)
  await page.keyboard.down('r');
  await expect(page.getByRole('group', { name: /Player 1’s hand/ })).toContainText('Hajrudin');
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('menuitem', { name: 'Concede…' }).click();
  await page.getByRole('button', { name: 'Concede', exact: true }).click();
  expect(await nextDecision(page)).toBe('over');
  await expectHidden(page, [...P1_PRIVATE, ...P2_PRIVATE], 'game over after a revealed concession');
  await page.keyboard.up('r');
});
