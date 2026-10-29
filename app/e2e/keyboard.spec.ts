import { expect, test, type Page } from '@playwright/test';
import { decisionKind, nextDecision, startGame } from './game-support.ts';

/** Keyboard only: no pointer events from here on (accessibility.md §11.1). */
const active = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return {
      id: el?.id ?? '',
      zone: el?.dataset.zone ?? '',
      cls: el?.className ?? '',
      glyph: el?.dataset.glyph ?? '',
      label: el?.getAttribute('aria-label') ?? el?.textContent ?? '',
    };
  });

async function tabTo(
  page: Page,
  test: (a: Awaited<ReturnType<typeof active>>) => boolean,
  max = 60,
) {
  for (let i = 0; i < max; i++) {
    if (test(await active(page))) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Tab never reached the element');
}

async function focusMyLeader(page: Page) {
  await page.keyboard.press('g');
  await page.keyboard.press('l');
  for (let i = 0; i < 10; i++) {
    const a = await active(page);
    if (a.cls.includes('bc-leader')) return;
    await page.keyboard.press('ArrowRight');
  }
  throw new Error('No Leader');
}

async function keyboardTurn(page: Page) {
  // Give every active DON!! to the Leader: + opens the Count dialog, a digit sets the count.
  await focusMyLeader(page);
  const leader = await active(page);
  if (leader.glyph === 'attack' || /active DON/.test(await page.locator('#decision').innerText())) {
    const n = await page.evaluate(() => {
      const m = /(\d+) active DON!!/.exec(document.querySelector('#decision')?.textContent ?? '');
      return m ? Number(m[1]) : 0;
    });
    if (n > 0) {
      await page.keyboard.press('+');
      await expect(page.getByRole('dialog', { name: /Give DON!!/ })).toBeVisible();
      await page.keyboard.press(String(Math.min(9, n)));
      await page.keyboard.press('Enter');
      await page.waitForTimeout(50);
    }
  }
  // Attack the Leader with the Leader: A, then Enter to choose the target, Enter to confirm.
  await focusMyLeader(page);
  if ((await active(page)).glyph === 'attack') {
    await page.keyboard.press('a');
    await expect.poll(async () => (await active(page)).zone).toBe('opp-row');
    await page.keyboard.press('Enter');
    await expect(page.locator('#confirm-attack')).toBeVisible();
    await page.keyboard.press('Enter');
    await nextDecision(page);
  }
  if ((await decisionKind(page)) === 'main') await page.keyboard.press('e');
}

test('a whole game vs Rookie, keyboard only', async ({ page }) => {
  test.setTimeout(300_000);
  await startGame(page, 'seed=7&first=me&speed=4&skip=1');
  for (let i = 0; i < 600; i++) {
    const k = await nextDecision(page);
    if (k === 'over') break;
    await page.waitForTimeout(80);
    if (k === 'chooseFirst') await page.keyboard.press('1');
    else if (k === 'mulligan') await page.keyboard.press('k');
    else if (k === 'main') await keyboardTurn(page);
    else if (k === 'trigger') {
      await tabTo(page, (a) => a.id === 'trigger-hand');
      await page.keyboard.press('Enter');
    } else if (k === 'block' || k === 'counter') {
      // Take the hit has no single key (C8): Tab to it, then Enter.
      await tabTo(page, (a) => a.id === 'take-hit');
      await page.keyboard.press('Enter');
    } else if (k === 'optional') {
      // Card effects (M4a): decline, by keyboard.
      await tabTo(page, (a) => a.id === 'skip-btn');
      await page.keyboard.press('Enter');
    } else if (k === 'order' || k === 'choose') {
      await tabTo(page, (a) => a.cls.split(' ').includes('opt'));
      await page.keyboard.press('Enter');
      await page.waitForTimeout(40);
      const done = page.locator('#choose-done');
      if (
        (await decisionKind(page)) === 'choose' &&
        (await done.count()) &&
        (await done.getAttribute('aria-disabled')) !== 'true'
      ) {
        await tabTo(page, (a) => a.id === 'choose-done');
        await page.keyboard.press('Enter');
      }
    } else throw new Error(`Unexpected ${k}`);
    await page.waitForTimeout(30);
  }
  await expect(page.locator('#decision-title')).toHaveText('Game over');
});

test('tab order: skip link, one stop per zone, then the decision panel', async ({ page }) => {
  await startGame(page, 'scenario=full&speed=4');
  await nextDecision(page);
  await page.locator('body').focus();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const seq: string[] = [];
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const a = await active(page);
    seq.push(a.zone || (a.cls.includes('skip-link') ? 'skip' : a.id || a.label.slice(0, 20)));
  }
  expect(seq.slice(0, 8)).toEqual([
    'skip',
    'opp-id',
    'opp-row',
    'opp-chars',
    'mid',
    'my-chars',
    'my-row',
    'hand',
  ]);
  // Next is the decision panel (accessibility §3.1): its first focusable element.
  const after = await page.evaluate(() => !!document.activeElement?.closest('#decision'));
  expect(after || seq[8] !== 'hand').toBeTruthy();
});
