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
const activeTag = (page: Page) => page.evaluate(() => document.activeElement?.tagName ?? '');

/** The a11y-l scenario, up to the attack confirm panel: Leader → their Leader. */
async function toConfirm(page: Page) {
  await startGame(page, 'scenario=a11y-l&speed=step&opp=rookie&aibudget=iterations');
  expect(await nextDecision(page)).toBe('main');
  await page.locator('[data-zone="my-row"].bc-leader').focus();
  await page.keyboard.press('a');
  await page.locator('[data-zone="opp-row"].bc-leader').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#confirm-attack')).toBeVisible();
  // The confirm sentence is spoken 60 ms after the panel opens; later lines must not race it.
  await expect(polite(page)).toContainText('Enter to attack');
}

test.describe('L-SR1 / FF-L1: Enter on the attack panel heading', () => {
  test('a click no pointer made (NVDA Enter on a heading) commits the attack, focus is never <body>', async ({
    page,
  }) => {
    await toConfirm(page);
    await page.keyboard.press('m');
    expect(await activeId(page)).toBe('decision-title');
    await expect(page.locator('#decision')).toContainText('Enter to attack');
    // NVDA's browse-mode Enter on a heading is a script click: no pointer event, no key event.
    await page.evaluate(() => document.getElementById('decision-title')?.click());
    await expect(page.locator('#confirm-attack')).toHaveCount(0);
    await expect(page.locator('#decision')).not.toHaveAttribute('data-mode', 'confirm');
    await expect.poll(() => activeTag(page)).not.toMatch(/^(BODY|HTML)$/);
  });

  test('a real mouse click on the heading never commits', async ({ page }) => {
    await toConfirm(page);
    await page.locator('#decision-title').click();
    await expect(page.locator('#confirm-attack')).toBeVisible();
    expect(await activeId(page)).toBe('decision-title');
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
