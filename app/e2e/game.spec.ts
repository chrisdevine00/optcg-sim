import { expect, test } from '@playwright/test';
import { playToEnd, startGame } from './game-support.ts';

test.describe('M3 board: full games', () => {
  test('a full game vs Rookie plays to completion', async ({ page }) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await startGame(page, 'seed=101&first=me&speed=4&skip=1');
    await playToEnd(page);
    await expect(page.locator('#decision-title')).toHaveText('Game over');
    await expect(page.locator('.banner')).toContainText(/wins|win/);
    expect(errors).toEqual([]);
  });

  test('a full hotseat game plays to completion, with a handoff curtain at each turn', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await startGame(page, 'opp=hotseat&seed=202&first=me&speed=4');
    // The first decision is behind a curtain: both hands are hidden until the player is ready.
    await expect(page.getByRole('dialog', { name: /^Pass to Player/ })).toBeVisible();
    let curtains = 0;
    page.on('framenavigated', () => undefined);
    const countCurtain = async () => {
      if (
        await page
          .locator('.curtain')
          .isVisible()
          .catch(() => false)
      )
        curtains++;
    };
    await countCurtain();
    await playToEnd(page);
    expect(curtains).toBeGreaterThan(0);
    await expect(page.locator('#decision-title')).toHaveText('Game over');
    await expect(page.locator('.banner')).toContainText(/Player [12] wins/);
    expect(errors).toEqual([]);
  });
});
