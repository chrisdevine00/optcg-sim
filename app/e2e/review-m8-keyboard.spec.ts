/**
 * M8 WP7: the review walked with the keyboard only (no pointer events): History, Enter on the game,
 * N for the first flag, Tab to the flag list and Enter for Study, Esc back, Tab to Practice and
 * Enter, the line played by keys until it is solved, back to the review where "Practised: solved"
 * shows, and History says so too. axe on Study on the way (WCAG 2.2 AA).
 */
import { expect, test, type Page } from '@playwright/test';
import { nextDecision } from './game-support.ts';
import { active, axe, load, planted, status, tabTo } from './review-m8-support.ts';

async function focusLeader(page: Page) {
  await page.keyboard.press('g');
  await page.keyboard.press('l');
  for (let i = 0; i < 10; i++) {
    if ((await active(page)).cls.includes('bc-leader')) return;
    await page.keyboard.press('ArrowRight');
  }
  throw new Error('No Leader');
}

async function keyboardAttack(page: Page, from: 'leader' | 'characters') {
  if (from === 'leader') await focusLeader(page);
  else {
    await page.keyboard.press('g');
    await page.keyboard.press('c');
  }
  await page.keyboard.press('a');
  // One legal target (their Leader): the attack goes straight to its confirm step; with a choice,
  // the focus is on their row and Enter picks the Leader.
  await expect
    .poll(
      async () =>
        (await active(page)).zone === 'opp-row' ||
        (await page.locator('#confirm-attack').isVisible()),
    )
    .toBe(true);
  if ((await active(page)).zone === 'opp-row') await page.keyboard.press('Enter');
  await expect(page.locator('#confirm-attack')).toBeVisible();
  await tabTo(page, (a) => a.id === 'confirm-attack');
  await page.keyboard.press('Enter');
  // Kaido's [When Attacking] asks whether to use it: decline, by keyboard.
  for (let i = 0; i < 40; i++) {
    const kind = await nextDecision(page);
    if (kind === 'optional') {
      await tabTo(page, (a) => a.id === 'skip-btn');
      await page.keyboard.press('Enter');
    } else if (kind === 'main' || kind === 'over') break;
    else await page.waitForTimeout(100);
  }
}

test('History, Enter, N, Enter for Study, Esc, Practice, solved, Practised', async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  await load(page, Object.values(planted()));
  // History: Tab to the newest game's "Review." link (the missed lethal), Enter.
  await expect(page.getByTestId('history-table')).toBeVisible();
  await tabTo(page, (a) => /\bReview\.$/.test(a.text));
  await page.keyboard.press('Enter');
  await expect(status(page)).toHaveText(/^1 flag · 1 severe$/, { timeout: 45_000 });
  await expect(page.locator('#rv-title')).toBeFocused();

  // N picks the next flag and says so.
  await page.keyboard.press('n');
  await expect(page.getByTestId('review-announce')).toContainText('Flag 1 of 1 selected.');
  // The flag list is a tab stop; Enter opens Study; Escape comes back to the same flag.
  await tabTo(page, (a) => a.role === 'listbox');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('study-rail')).toBeVisible();
  await axe(page, info, 'study');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('selected-flag')).toBeVisible();
  await expect(page.getByRole('listbox', { name: /^Flags/ })).toBeFocused();

  // Practice this: Tab to it, Enter; play the line from the explanation by keys.
  await tabTo(page, (a) => a.id === 'practice-btn');
  await page.keyboard.press('Enter');
  await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'main', {
    timeout: 15_000,
  });
  await expect(page.getByTestId('puzzle-chip')).toHaveText('Practice');
  // The board takes focus to its heading and says where the player is; keys wait for that.
  await expect.poll(async () => (await active(page)).id).toBe('decision-title');
  await expect(page.locator('#announce-polite')).toContainText('Practice: turn 9 as it stood.');
  await focusLeader(page);
  await page.keyboard.press('+');
  await expect(page.getByRole('dialog', { name: /Give DON!!/ })).toBeVisible();
  await page.keyboard.press('4');
  await page.keyboard.press('Enter');
  await keyboardAttack(page, 'leader');
  await keyboardAttack(page, 'characters');
  await expect(page.getByTestId('puzzle-result')).toContainText('Solved', { timeout: 30_000 });
  await expect(page.getByTestId('puzzle-chip')).toHaveText('Practice · solved');

  // Back to the review, still by keyboard: the flag says it was practised.
  await tabTo(page, (a) => /Leave the game/.test(a.text));
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('practised')).toHaveText('Practised: solved');
  await expect(page.locator('#practice-btn')).toHaveText('Practice again');
  await expect(page.getByRole('listbox', { name: /^Flags/ })).toBeFocused();
});
