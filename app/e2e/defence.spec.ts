import { expect, test, type Page } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';

/** In the `defend` scenario (hotseat), Player 2 attacks Player 1's Leader: 7000 vs 5000. */
async function attackLeader(page: Page) {
  await startGame(page, 'scenario=defend&speed=4');
  expect(await nextDecision(page)).toBe('main');
  await page.locator('[data-zone="my-row"].bc-leader').click();
  await page.locator('[data-zone="opp-row"].bc-leader').click();
  await expect(page.getByTestId('attacker-power')).toHaveText('7000');
  await page.locator('#confirm-attack').click();
  expect(await nextDecision(page)).toBe('block');
}

const hitLines = (page: Page) => page.locator('.log-row').filter({ hasText: /Hit|Attack fails/ });

test.describe('defence planner (flows F6, board.md §3.9)', () => {
  test('stages counters against live maths and commits once; Take the hit is always offered', async ({
    page,
  }) => {
    await attackLeader(page);
    const take = page.locator('#take-hit');
    await expect(take).toBeVisible();
    await expect(page.getByTestId('defender-power')).toHaveText('5000');
    // Hotseat: the defender's hand stays hidden until R is held (flows F13b).
    await expect(page.locator('.hand-veil')).toContainText('hold R');
    await page.keyboard.down('r');
    const counters = page.locator('[data-zone="hand"][data-glyph="play"]');
    await expect(counters).toHaveCount(4);
    // One +1000: 6000 vs 7000 still hits. Enter must not commit it.
    await counters.first().click();
    await expect(page.getByTestId('defender-power')).toHaveText('6000');
    await expect(page.locator('#play-anyway')).toBeVisible();
    await expect(take).toBeVisible();
    await page.locator('#decision-title').focus();
    await page.keyboard.press('Enter');
    expect(await page.locator('#decision').getAttribute('data-kind')).toBe('block');
    // Two: 7000 vs 7000, ties go to the attacker.
    await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
    await expect(page.getByTestId('battle-result')).toContainText('Ties go to the attacker');
    await expect(take).toBeVisible();
    // Three: 8000 vs 7000 stops it. Now the primary is the counter and Enter commits it.
    await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
    await expect(page.locator('#commit-defence')).toContainText('Counter +3000');
    await expect(take).toBeVisible();
    await page.locator('#decision-title').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.up('r');
    // One commit: block step, three Counters and the end of the Counter step, as one move.
    const line = page.locator('.log-row').filter({ hasText: 'Attack fails' });
    await expect(line).toHaveCount(1);
    await expect(line).toContainText(/Counter: .*Counter: .*Counter: /);
    await expect(
      page.getByRole('button', { name: 'Player 1’s Life, 3 cards, face down' }),
    ).toHaveCount(1);
  });

  test('Take the hit sends the empty defence and the damage decision follows', async ({ page }) => {
    await attackLeader(page);
    await page.locator('#take-hit').click();
    expect(await nextDecision(page)).toBe('trigger');
    await expect(page.locator('#trigger-hand')).toBeVisible();
    await expect(page.locator('#trigger-activate')).toHaveAttribute('aria-disabled', 'true');
    await page.locator('#trigger-hand').click();
    await expect(hitLines(page).first()).toContainText('Hit · 7000 vs 5000');
    await expect(page.locator('.log-row').filter({ hasText: 'Life 3 → 2' })).toHaveCount(1);
  });

  test('a Blocker takes the attack instead', async ({ page }) => {
    await attackLeader(page);
    const franky = page.locator('[data-zone="my-chars"][data-glyph="block"]').first();
    await franky.click();
    await expect(page.locator('#commit-defence')).toContainText('Block with');
    await expect(page.locator('#take-hit')).toBeVisible();
    await page.locator('#commit-defence').click();
    await expect(page.locator('.log-row').filter({ hasText: 'Block:' })).toHaveCount(1);
  });

  test('Counters staged before a Blocker follow it, and wasted ones never go on Enter (M3-05)', async ({
    page,
  }) => {
    await attackLeader(page);
    await page.keyboard.down('r');
    await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
    await page.locator('[data-zone="my-chars"][data-glyph="block"]').first().click();
    // Franky 5000 + 1000 staged = 6000 against 7000: still K.O.'d.
    await expect(page.getByTestId('defender-power')).toHaveText('6000');
    await expect(page.locator('#play-anyway')).toContainText('still K.O.’d');
    await expect(page.locator('#commit-defence')).toContainText('Block with Franky');
    await expect(page.locator('#commit-defence')).toContainText('Counters kept');
    await page.locator('#decision-title').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.up('r');
    const line = page.locator('.log-row').filter({ hasText: 'Block:' });
    await expect(line).toHaveCount(1);
    await expect(line).not.toContainText('Counter:');
  });

  test('press and hold on the veiled hand reveals it, for touch (M3-06)', async ({ page }) => {
    await attackLeader(page);
    const veil = page.locator('.hand-veil');
    await expect(veil).toContainText('press and hold here');
    await veil.hover();
    await page.mouse.down();
    await expect(page.locator('[data-zone="hand"][data-glyph="play"]')).toHaveCount(4);
    await page.mouse.up();
    await expect(veil).toBeVisible();
  });

  test('the attack and each staging change are announced (M3-08)', async ({ page }) => {
    await attackLeader(page);
    await expect(page.locator('#announce-assertive')).toContainText(
      'Kaido attacks your Leader. Kaido 7000, your Leader 5000. You need 3000 to stop it.',
    );
    await page.keyboard.down('r');
    await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
    await expect(page.locator('#announce-polite')).toContainText(
      /Staged .+, plus 1000\. Your Leader 6000 against 7000: still hits\. Need 2000 more\./,
    );
    await page.keyboard.up('r');
    // Released: the private sentence leaves the live region.
    await expect(page.locator('#announce-polite')).not.toContainText('Staged');
  });
});
