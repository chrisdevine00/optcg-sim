/**
 * M7-R4: t1 asks the player to click every zone. Opening Trash before the others must not cover the
 * step card (its done copy and Next), and Escape closes the popover even after focus has left it.
 */
import { expect, test } from '@playwright/test';
import { card, fresh, hand, next } from './tutorial-support.ts';

test.beforeEach(async ({ page }) => {
  await fresh(page);
});

test.describe('t1: Trash opened before the other zones (M7-R4)', () => {
  test('the popover never covers Next or the done copy, and Escape closes it after focus left', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto('./tutorial?restart=1');
    await expect(card(page)).toHaveAttribute('data-step', 't1-zones', { timeout: 20_000 });
    // Trash first, as the lit order invites a pointer player to do.
    await page.locator('[data-zid="trash"]').click();
    const viewer = page.locator('.trash-viewer');
    await expect(viewer).toBeVisible();
    // The step card sits clear of the viewer and its scrim.
    const clear = async () => {
      const cardBox = (await card(page).boundingBox())!;
      const viewerBox = (await viewer.boundingBox())!;
      expect(viewerBox.y + viewerBox.height).toBeLessThanOrEqual(cardBox.y + 1);
      const covered = await page.evaluate(() => {
        const c = document.querySelector('[data-testid="tutorial-card"]')!.getBoundingClientRect();
        const el = document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2);
        return !!el?.closest('.rail-scrim, .trash-viewer');
      });
      expect(covered).toBe(false);
    };
    await clear();
    // Other zones work with the popover open (it is not modal).
    for (const z of ['donDeck', 'life', 'deck', 'stage'])
      await page.locator(`[data-zid="${z}"]`).click();
    await page.locator('[data-zid="costArea"] .rowbtn').click();
    await page.locator('[data-zone="my-row"].bc-leader').click();
    await page.locator('[data-zone="my-chars"][data-item]').first().click();
    await hand(page, 'Jinbe').click();
    await clear();
    // Focus has left the popover: one Escape still closes it.
    await page.keyboard.press('Escape');
    await expect(viewer).toHaveCount(0);
    await expect(page.locator('.rail-scrim')).toHaveCount(0);
    // And the step can be finished: Next is reachable.
    await next(page);
    await expect(card(page)).toHaveAttribute('data-step', 't2-first-turn');
  });
});
