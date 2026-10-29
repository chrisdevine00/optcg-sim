import { expect, test } from '@playwright/test';
import { nextDecision, playToEnd, startGame } from './game-support.ts';

/** Turn-1 full games are long on CI runners: they run nightly (E2E_FULL=1); per push, the same
 * flows play to completion from a late-game position with every card scripted (review M4a). */
const full = () => test.skip(!process.env.E2E_FULL, 'turn-1 full games run nightly (E2E_FULL=1)');

test.describe('M3 board: full games', () => {
  test('a game vs Rookie plays to completion from a late-game position', async ({ page }) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await startGame(page, 'scenario=late&speed=4&skip=1');
    await playToEnd(page);
    await expect(page.locator('#decision-title')).toHaveText('Game over');
    expect(errors).toEqual([]);
  });

  test('a hotseat game plays to completion from a late-game position, effects under the veil', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await startGame(page, 'scenario=lateHotseat&speed=4');
    const stats = await playToEnd(page);
    expect(stats.veiledOwnDecisions).toBeGreaterThan(0);
    await expect(page.locator('#decision-title')).toHaveText('Game over');
    await expect(page.locator('.banner')).toContainText(/Player [12] wins/);
    expect(errors).toEqual([]);
  });

  test('a full game vs Rookie plays to completion', async ({ page }) => {
    full();
    // Scripted effects (M4a) add decisions; CI runners are slower than local machines.
    test.setTimeout(480_000);
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
    full();
    // Scripted effects (M4a) add decisions; CI runners are slower than local machines.
    test.setTimeout(480_000);
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
    const stats = await playToEnd(page);
    // Seed 202 reaches the defender's effect decisions under the veil (review M3-35).
    expect(stats.veiledOwnDecisions).toBeGreaterThan(0);
    expect(curtains).toBeGreaterThan(0);
    await expect(page.locator('#decision-title')).toHaveText('Game over');
    await expect(page.locator('.banner')).toContainText(/Player [12] wins/);
    expect(errors).toEqual([]);
  });

  test('Skip to my decision stops at the defence when a Counter is in hand (flows F21)', async ({
    page,
  }) => {
    // Paused first, so nothing has happened yet when Skip is pressed.
    await startGame(page, 'scenario=skip&paused=1');
    await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'waiting');
    await page.locator('#skip-btn').click();
    expect(await nextDecision(page)).toBe('counter');
    await expect(page.locator('#take-hit')).toBeVisible();
    await expect(page.locator('.log-row').filter({ hasText: /Hit|No counter/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Your Life, 2 cards, face down' })).toHaveCount(
      1,
    );
    // The recap shows where Skip stopped (M3-11).
    await expect(page.locator('#decision .recap')).toContainText('While you skipped');
    // M3-12: against the AI too, the damage decision shows which Life card you gain.
    await page.locator('#take-hit').click();
    expect(await nextDecision(page)).toBe('trigger');
    await expect(page.getByTestId('life-card')).toContainText(/Life card: (Komachiyo|Sai)/);
    await page.locator('#trigger-hand').click();
  });
});
