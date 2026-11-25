/**
 * M7 WP6: the tutorial's edges. A wrong click says "Not yet…" and adds a blocked attempt; t5's "Take
 * the hit" is inert with its line; leave at step 4, reload and Continue, with focus on the step text;
 * the welcome question on Home; reduced motion shows no pulse; a lit card is lit.
 */
import { expect, test, type Page } from '@playwright/test';
import { timingRuns } from './idb-support.ts';
import { card, check, fresh, hand, myTurn, next, PROGRESS, startAt } from './tutorial-support.ts';

test.beforeEach(async ({ page }) => {
  await fresh(page);
});

const stored = (page: Page) => timingRuns(page);

test.describe('a wrong move', () => {
  test('a card that is not lit says "Not yet…" and adds a blocked attempt', async ({
    page,
  }, info) => {
    await startAt(page, 2);
    await expect(page.getByTestId('tutorial-notice')).toHaveCount(0);
    // Bonney is in the hand and legal in a real game; this step teaches Jinbe.
    await hand(page, 'Jewelry Bonney').click();
    await expect(page.getByTestId('tutorial-notice')).toHaveText(
      /^Not yet\. First, play Jinbe: he costs 2 and you have 2 DON!! active\.$/,
    );
    await expect(page.getByRole('menuitem')).toHaveCount(0);
    await check(page, info, 'not-yet');
    let log = (await stored(page)).at(-1)!;
    expect(log.steps.find((s) => s.stepId === 't2-first-turn')!.blockedAttempts).toBe(1);
    // End turn is not allowed either: another line, another attempt, and nothing changes.
    await page.locator('#endturn-btn').click();
    await expect(page.getByTestId('tutorial-notice')).toBeVisible();
    log = (await stored(page)).at(-1)!;
    expect(log.steps.find((s) => s.stepId === 't2-first-turn')!.blockedAttempts).toBe(2);
    await expect(page.locator('.mid-turn')).toContainText('Turn 2');
    // The right move clears the line.
    await hand(page, 'Jinbe').click();
    await page.getByRole('menuitem', { name: /^Play/ }).click();
    await expect(page.getByTestId('tutorial-done')).toBeVisible();
    await expect(page.getByTestId('tutorial-notice')).toHaveCount(0);
  });

  test('t5: "Take the hit" is inert and says why; the counter then ends the step', async ({
    page,
  }, info) => {
    await startAt(page, 5);
    await myTurn(page, 'block');
    await page.locator('#take-hit').click();
    await expect(page.getByTestId('tutorial-notice')).toHaveText(
      'Not in this step: this one teaches countering. Stage Jinbe, then press Counter.',
    );
    await check(page, info, 'take-the-hit-inert');
    // Still five Life: nothing was taken.
    await expect(page.getByRole('button', { name: /^Your Life, 5 cards/ })).toBeVisible();
    await myTurn(page, 'counter');
    await hand(page, 'Jinbe').click();
    await page.locator('#commit-defence').click();
    await expect(page.getByTestId('tutorial-done')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /^Your Life, 5 cards/ })).toBeVisible();
  });
});

test.describe('leave and continue', () => {
  test('leave at step 4, reload, Continue: the step restarts and focus is on its text', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto('./tutorial?restart=1');
    await expect(card(page)).toBeVisible({ timeout: 20_000 });
    // Steps 1 to 3 by pointer.
    for (const z of ['donDeck', 'life', 'deck', 'stage'])
      await page.locator(`[data-zid="${z}"]`).click();
    await page.locator('[data-zid="costArea"] .rowbtn').click();
    await page.locator('[data-zone="my-row"].bc-leader').click();
    await page.locator('[data-zone="my-chars"][data-item]').first().click();
    await hand(page, 'Jinbe').click();
    await page.locator('[data-zid="trash"]').click();
    await page.keyboard.press('Escape');
    await next(page);
    await hand(page, 'Jinbe').click();
    await page.getByRole('menuitem', { name: /^Play/ }).click();
    await next(page);
    await page.locator('[data-zid="costArea"] .rowbtn').click();
    await page.locator('[data-zone="my-row"].bc-leader').click();
    await next(page);
    await expect(card(page)).toHaveAttribute('data-step', 't4-attack');

    await page.getByRole('button', { name: 'Leave tutorial' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'OPTCG Sim' })).toBeVisible();
    const saved = await page.evaluate((k) => JSON.parse(window.localStorage.getItem(k)!), PROGRESS);
    expect(saved).toMatchObject({ step: 3 });

    await page.reload();
    const cont = page.getByTestId('continue-tutorial');
    await expect(cont).toHaveText('Continue the tutorial (step 4 of 8)');
    await cont.click();
    await expect(card(page)).toHaveAttribute('data-step', 't4-attack', { timeout: 20_000 });
    await expect(page.locator('#tutorial-text')).toBeFocused({ timeout: 5000 });
    // A fresh board: their Life is back to 5, and the Leave is one exit on step 4.
    await expect(page.getByRole('button', { name: /^Opponent’s Life, 5 cards/ })).toBeVisible();
    const log = (await stored(page)).at(-1)!;
    expect(log.runId).toBe(saved.runId);
    expect(log.steps.map((s) => s.stepId)).toEqual([
      't1-zones',
      't2-first-turn',
      't3-don-and-power',
      't4-attack',
    ]);
    expect(log.steps[3]!.exits).toBe(1);
    expect(log.steps[0]!.inputs.pointer).toBeGreaterThan(0);
  });

  test('Back goes to the start of the previous step', async ({ page }) => {
    await startAt(page, 3);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(card(page)).toHaveAttribute('data-step', 't2-first-turn');
    await expect(page.getByRole('button', { name: /^Your Jinbe/ })).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(card(page)).toHaveAttribute('data-step', 't1-zones');
    await expect(page.getByRole('button', { name: 'Back' })).toBeDisabled();
  });

  test('P puts focus on the step text, and Read again does too', async ({ page }) => {
    await startAt(page, 2);
    await page.locator('[data-zone="my-row"].bc-leader').focus();
    await page.keyboard.press('p');
    await expect(page.locator('#tutorial-text')).toBeFocused();
    await page.locator('[data-zone="my-row"].bc-leader').focus();
    await page.getByRole('button', { name: 'Read again' }).click();
    await expect(page.locator('#tutorial-text')).toBeFocused({ timeout: 3000 });
  });
});

test.describe('home and the first question', () => {
  test('Home asks once; "I’m new: teach me" starts the tutorial; "I know the rules" opens Setup', async ({
    page,
  }, info) => {
    await page.goto('./');
    const q = page.getByTestId('welcome');
    await expect(
      q.getByRole('heading', { name: 'Have you played One Piece Card Game before?' }),
    ).toBeVisible();
    await check(page, info, 'home-question');
    await q.getByRole('button', { name: /I know the rules/ }).click();
    await expect(page).toHaveURL(/\/play\?opp=pirate/);
    await expect(page.getByRole('radio', { name: /Pirate AI/ })).toBeChecked();
    await page.goto('./');
    await expect(page.getByTestId('welcome')).toHaveCount(0);
    // Not answered yet on a clean profile: "I'm new" goes to step 1.
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page
      .getByTestId('welcome')
      .getByRole('button', { name: /I’m new: teach me/ })
      .click();
    await expect(card(page)).toHaveAttribute('data-step', 't1-zones', { timeout: 20_000 });
  });
});

test.describe('reduced motion', () => {
  test('the lit card pulses once, and does not pulse under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await startAt(page, 2);
    const lit = page.locator('[data-tutorial-lit]').first();
    await expect(lit).toBeVisible();
    const anim = (p: Page) =>
      p.evaluate(() => {
        const el = document.querySelector('[data-tutorial-lit]')!;
        const cs = getComputedStyle(el);
        return { name: cs.animationName, width: cs.outlineWidth };
      });
    expect((await anim(page)).name).toBe('tut-pulse');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reduced = await anim(page);
    expect(reduced.name).toBe('none');
    // A thicker static ring stands in for the pulse.
    expect(parseFloat(reduced.width)).toBeGreaterThanOrEqual(5);
  });

  test('step 2 lights Jinbe only', async ({ page }) => {
    await startAt(page, 2);
    await expect(page.locator('[data-tutorial-lit]')).toHaveCount(1);
    await expect(page.locator('[data-tutorial-lit]')).toHaveAccessibleName(/^Your Jinbe/);
  });
});
