import { expect, test, type Page } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';

/**
 * L screen-reader pass, fix round 1 (docs/design/a11y-passes/l-nvda-*.md): L-SR1/FF-L1 (Enter on
 * the battle panel's heading commits the attack), L-SR2 (C and L say where the coach is while the
 * decision panel is tall), L-SR3 (the review timeline is an application region and N is said),
 * L-SR4 (Practice and Review move focus and announce), L-SR5 (Study says it is read-only).
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* blocked */
    }
  });
});

const polite = (page: Page) => page.locator('#announce-polite');
const activeId = (page: Page) => page.evaluate(() => document.activeElement?.id ?? '');

/** The a11y-l scenario, up to the attack confirm panel: Leader → their Leader. */
async function toConfirm(page: Page) {
  await startGame(page, 'scenario=a11y-l&speed=step&opp=rookie&aibudget=iterations');
  expect(await nextDecision(page)).toBe('main');
  await page.locator('[data-zone="my-row"].bc-leader').focus();
  await page.keyboard.press('a');
  await page.locator('[data-zone="opp-row"].bc-leader').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#confirm-attack')).toBeVisible();
  // Focus moves to "Confirm attack" 30 ms after the panel opens (L-SR1 round 2).
  await expect.poll(() => activeId(page)).toBe('confirm-attack');
}

test.describe('L-SR1 / FF-L1 (round 2): the attack confirm does not depend on a heading click', () => {
  test('the confirm opens with focus on Confirm attack, described by the battle maths; Enter is a native press', async ({
    page,
  }) => {
    await toConfirm(page);
    const btn = page.locator('#confirm-attack');
    await expect(btn).toHaveAttribute('aria-describedby', 'confirm-spoken');
    const spoken = await page.locator('#confirm-spoken').textContent();
    expect(spoken).toMatch(/Kaido 5000 against their Leader 5000/);
    expect(spoken).toMatch(/Level: ties go to the attacker/);
    expect(spoken).toMatch(/They need plus 1000 to survive, \d+ cards? in hand/);
    expect(spoken).toMatch(/Enter to attack/);
    await page.keyboard.press('Enter');
    await expect(page.locator('#confirm-attack')).toHaveCount(0);
    await expect(page.locator('#decision')).not.toHaveAttribute('data-mode', 'confirm');
  });

  test('M during the confirm puts focus on Confirm attack, not the heading; a heading click only focuses', async ({
    page,
  }) => {
    await toConfirm(page);
    await page.locator('[data-zone="opp-row"].bc-leader').focus();
    await page.keyboard.press('m');
    expect(await activeId(page)).toBe('confirm-attack');
    // A click on the heading (NVDA's Enter, or a mouse) never commits.
    await page.evaluate(() => document.getElementById('decision-title')?.click());
    await expect(page.locator('#confirm-attack')).toBeVisible();
    expect(await activeId(page)).toBe('decision-title');
    await page.locator('#decision-title').click();
    await expect(page.locator('#confirm-attack')).toBeVisible();
  });

  test('Escape from the Confirm button goes back to the target', async ({ page }) => {
    await toConfirm(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#decision')).toHaveAttribute('data-mode', 'target');
    await expect
      .poll(() => page.evaluate(() => !!document.activeElement?.closest('[data-handle]')))
      .toBe(true);
  });

  test('L-SR11: Tab from the decision heading goes to Cancel, then Confirm attack', async ({
    page,
  }) => {
    await toConfirm(page);
    await page.locator('#decision-title').focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.textContent ?? '')).toMatch(/^Cancel/);
    await page.keyboard.press('Tab');
    expect(await activeId(page)).toBe('confirm-attack');
  });
});

test.describe('L-SR2: C and L while the decision panel is tall', () => {
  test('C says why it did not open; the third L says where the line is', async ({ page }) => {
    await toConfirm(page);
    await expect(page.locator('.coach')).toHaveAttribute('data-mode', 'strip');
    await page.keyboard.press('c');
    await expect(polite(page)).toContainText('The coach opens when this decision is done');
    await expect(page.locator('.coach')).toHaveAttribute('data-mode', 'strip');
    for (const [i, want] of [
      'Lethal: proven',
      'You need 1 hit',
      'The numbered line is in the coach',
    ].entries()) {
      await page.keyboard.press('l');
      await expect(polite(page), `L press ${i + 1}`).toContainText(want, { timeout: 30_000 });
    }
    // Past the last tier: said once, ahead of the line.
    await page.keyboard.press('l');
    await expect(polite(page)).toContainText('That is everything the coach has for this turn');
  });
});

test.describe('the review: L-SR3, L-SR4, L-SR5', () => {
  async function toReview(page: Page) {
    await startGame(page, 'scenario=lethalDemo&speed=4&opp=pirate&aibudget=iterations');
    await nextDecision(page);
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('menuitem', { name: 'Concede…' }).click();
    await page.getByRole('button', { name: 'Concede', exact: true }).click();
    await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'over');
    // The Concede dialog's own focus restore lands after the panel changes; settle on the button.
    await expect
      .poll(async () => {
        await page.locator('#review-btn').focus();
        await page.waitForTimeout(250);
        return activeId(page);
      })
      .toBe('review-btn');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('review-status')).toHaveText('1 flag · 1 severe', {
      timeout: 30_000,
    });
  }

  test('Review this game lands on its heading; the timeline is an application region and N is said', async ({
    page,
  }) => {
    await toReview(page);
    expect(await activeId(page)).toBe('rv-title');
    const region = page.locator('[role="application"][aria-roledescription="turn timeline"]');
    await expect(region.locator('ol.tl')).toHaveCount(1);
    // Every timeline action is reachable by Tab and Enter, and choosing a flag is said.
    await page.locator('button.tl-col').first().focus();
    await page.keyboard.press('n');
    await expect(page.getByTestId('review-announce')).toContainText('Flag 1 of 1 selected');
    // Enter on a flag's turn button says it again, as a fresh node.
    const first = await page.getByTestId('review-announce').locator('p').elementHandle();
    await page.keyboard.press('Enter');
    await expect.poll(() => first?.evaluate((e) => !e.isConnected)).toBe(true);
  });

  test('Study is read-only in its board name and in Q; Practice this moves focus and announces', async ({
    page,
  }) => {
    await toReview(page);
    await page.locator('#study-btn').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('study-rail')).toBeVisible();
    await expect(page.locator('[aria-label^="Game board"]').first()).toHaveAttribute(
      'aria-label',
      /read-only/,
    );
    await page.locator('[data-zone="my-row"][data-item]').first().focus();
    await page.keyboard.press('q');
    await expect(polite(page)).toContainText('Read-only: nothing here is played');
    await page.locator('#practice-btn').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'main', {
      timeout: 15_000,
    });
    await expect.poll(() => activeId(page)).toBe('decision-title');
    await expect(polite(page)).toContainText('Practice: turn 9 as it stood. Nothing is timed.');
  });
});
