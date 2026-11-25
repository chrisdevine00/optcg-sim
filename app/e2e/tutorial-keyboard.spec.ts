/**
 * M7 WP6: a full run of the guided tutorial from the keyboard alone, using only the keys the step
 * text names (flows F2 "the tutorial teaches only real inputs").
 */
import { expect, test, type Page } from '@playwright/test';
import {
  card,
  check,
  focusIs,
  fresh,
  IDS,
  leaderSel,
  myTurn,
  rightUntil,
  tabUntil,
} from './tutorial-support.ts';

test.beforeEach(async ({ page }) => {
  await fresh(page);
});

async function keyAttack(page: Page, attacker: 'leader' | 'character') {
  await page.keyboard.press('g');
  if (attacker === 'leader') {
    await page.keyboard.press('l');
    await rightUntil(page, leaderSel);
  } else await page.keyboard.press('c');
  await page.keyboard.press('a');
  // Target mode puts focus on their Leader, the one legal target.
  await expect(page.locator('[data-zone="opp-row"].bc-leader')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#confirm-attack')).toBeFocused();
  await page.keyboard.press('Enter');
}

const KEYS: Record<string, (page: Page) => Promise<void>> = {
  't1-zones': async (page) => {
    await page.keyboard.press('g');
    await page.keyboard.press('l');
    for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
    // Up and Down between rows: the Characters above, the hand below.
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    for (let i = 0; i < 3 && !(await focusIs(page, '[data-zone="hand"]')); i++)
      await page.keyboard.press('ArrowDown');
  },
  't2-first-turn': async (page) => {
    await page.keyboard.press('g');
    await page.keyboard.press('h');
    await page.keyboard.press('Enter');
    await page.keyboard.press('p');
  },
  't3-don-and-power': async (page) => {
    await page.keyboard.press('g');
    await page.keyboard.press('l');
    await rightUntil(page, leaderSel);
    await page.keyboard.press('+');
    await page.keyboard.press('Enter');
  },
  't4-attack': (page) => keyAttack(page, 'leader'),
  't5-defend': async (page) => {
    await myTurn(page, 'block');
    await page.keyboard.press('g');
    await page.keyboard.press('h');
    await page.keyboard.press(' ');
    await page.keyboard.press('p');
    await page.keyboard.press('Enter');
  },
  't6-trigger': async (page) => {
    await myTurn(page, 'block');
    await tabUntil(page, '#take-hit');
    await page.keyboard.press('Enter');
    await myTurn(page, 'trigger');
    await expect(page.locator('#trigger-activate')).toBeFocused();
    // Tab and Enter adds the card to the hand: either choice finishes the step.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
  },
  't7-leader': async (page) => {
    await page.keyboard.press('g');
    await page.keyboard.press('l');
    await rightUntil(page, leaderSel);
    await page.keyboard.press('Enter');
    await page.keyboard.press('e');
    await myTurn(page, 'choose');
    for (let i = 0; i < 30; i++) {
      const t = await page.evaluate(() => document.activeElement?.textContent ?? '');
      if (/^2 DON/.test(t)) break;
      await page.keyboard.press('Tab');
    }
    await page.keyboard.press('Enter');
  },
  't8-winning': async (page) => {
    await keyAttack(page, 'leader');
    await myTurn(page, 'main');
    await page.waitForTimeout(700);
    await keyAttack(page, 'character');
  },
};

test('the eight steps from the keyboard with the keys the step text names', async ({
  page,
}, info) => {
  test.setTimeout(240_000);
  await page.goto('./tutorial?restart=1');
  await expect(card(page)).toBeVisible({ timeout: 20_000 });
  for (const [i, id] of IDS.entries()) {
    await expect(card(page)).toHaveAttribute('data-step', id);
    // Focus starts on the step text, and the keys are on the screen in it.
    await expect(page.locator('#tutorial-text')).toBeFocused({ timeout: 5000 });
    if (id !== 't8-winning') await expect(card(page)).toContainText('Or ');
    await KEYS[id]!(page);
    await expect(page.getByTestId('tutorial-done')).toBeVisible({ timeout: 30_000 });
    if (i === 3) await check(page, info, 'keyboard-step-4-done');
    // "Next" has focus: Enter goes on.
    await expect(page.getByTestId('tutorial-next')).toBeFocused({ timeout: 5000 });
    await page.keyboard.press('Enter');
  }
  await expect(page.getByRole('heading', { name: /Tutorial complete in \d+ min/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play your first full game' })).toBeFocused();
});
