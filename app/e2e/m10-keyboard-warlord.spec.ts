/**
 * M10 WP4: a whole game against the Warlord, keyboard events only (nightly: `E2E_FULL=1`). The automated half
 * of accessibility §11.7's "full keyboard-only game vs Warlord"; the human half is the S3 kit's task 3.7.
 *
 * "Keyboard only" is enforced, not promised: `Locator.click`, `.focus`, `.hover`, `.fill`, `.check` and
 * `.press` on a locator, and `Page.click`, `.focus`, `.hover`, `.fill`, `.check`, `.dblclick` and `.tap`, are
 * replaced for the whole test by functions that throw, so the spec fails the moment it must reach for a
 * pointer or a `.focus()` on a control. Every move is `page.keyboard.press`. The AI is on `aibudget=iterations`,
 * so its choices (and so the length of the game) do not depend on the machine's speed.
 *
 * Reports the number of keystrokes, the longest run of Tab presses between two other keys (the longest focus
 * travel), and the result, to the test's annotations and `test-results/audit-keyboard-warlord.json`, whatever
 * the verdict. Nothing is timed. Revert that fails it: make the rail's "Take the hit" unreachable by Tab (the
 * game stalls on a block decision and the decision cap is hit), or drop the keyboard handler of `E`, `A` or
 * `K` (no game result).
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { countKeys } from './support/audit.ts';
import { serveArt } from './game-support.ts';

/** The page's state read without touching it: decision kind. */
const kind = (page: Page) => page.locator('#decision').getAttribute('data-kind');

/** Waits for a decision the player owes (or the end); polling is a hang guard, never a bound. */
async function owed(page: Page): Promise<string> {
  for (let i = 0; i < 4000; i++) {
    const k = await kind(page);
    if (k && k !== 'waiting' && k !== 'none') return k;
    await page.waitForTimeout(40);
  }
  throw new Error('no decision came');
}

const active = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return {
      id: el?.id ?? '',
      zone: el?.dataset.zone ?? '',
      cls: el?.className ?? '',
      glyph: el?.dataset.glyph ?? '',
    };
  });

/** Tab until `want` holds; the number of Tabs is the focus travel. */
async function tabTo(page: Page, want: (a: Awaited<ReturnType<typeof active>>) => boolean) {
  for (let i = 0; i < 80; i++) {
    if (want(await active(page))) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Tab never reached the element');
}

async function focusMyLeader(page: Page) {
  await page.keyboard.press('g');
  await page.keyboard.press('l');
  for (let i = 0; i < 10; i++) {
    if ((await active(page)).cls.includes('bc-leader')) return;
    await page.keyboard.press('ArrowRight');
  }
  throw new Error('no Leader');
}

async function mainPhase(page: Page) {
  await focusMyLeader(page);
  const n = await page.evaluate(() => {
    const m = /(\d+) active DON!!/.exec(document.querySelector('#decision')?.textContent ?? '');
    return m ? Number(m[1]) : 0;
  });
  if (n > 0) {
    await page.keyboard.press('+');
    await page.getByRole('dialog', { name: /Give DON!!/ }).waitFor();
    await page.keyboard.press(String(Math.min(9, n)));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(50);
  }
  await focusMyLeader(page);
  if ((await active(page)).glyph === 'attack') {
    await page.keyboard.press('a');
    await expect.poll(async () => (await active(page)).zone).toBe('opp-row');
    await page.keyboard.press('Enter');
    await page.locator('#confirm-attack').waitFor();
    await page.keyboard.press('Enter');
    await owed(page);
  }
  if ((await kind(page)) === 'main') await page.keyboard.press('e');
}

/** The bans live on shared prototypes: put them back whatever happens, so a later test in the worker is whole. */
const restore: (() => void)[] = [];
test.afterEach(() => {
  while (restore.length) restore.pop()!();
});

test('a whole game against the Warlord, keyboard only (nightly)', async ({ page }, info) => {
  test.skip(!process.env.E2E_FULL, 'a whole game runs nightly (E2E_FULL=1)');
  test.skip(info.project.name !== '720p', 'one pass is enough');
  test.setTimeout(1_500_000);

  // The pointer is off the table: any use of it fails the test.
  const banned = (what: string) => () => {
    throw new Error(`keyboard-only game: ${what} is not allowed`);
  };
  const ban = (target: object, methods: string[], label: string) => {
    const t = target as Record<string, unknown>;
    for (const m of methods) {
      const original = t[m];
      t[m] = banned(`${label}.${m}`);
      restore.push(() => {
        t[m] = original;
      });
    }
  };
  const POINTER = ['click', 'dblclick', 'hover', 'focus', 'fill', 'check', 'uncheck', 'tap'];
  ban(
    Object.getPrototypeOf(page.locator('body')) as object,
    [...POINTER, 'press', 'type', 'selectOption'],
    'Locator',
  );
  ban(page, [...POINTER, 'type', 'selectOption'], 'Page');
  ban(page.mouse, ['click', 'dblclick', 'move', 'down', 'up', 'wheel'], 'Mouse');

  const keys = countKeys(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await serveArt(page);
  await page.goto('./play?seed=7&first=me&opp=warlord&speed=4&skip=1&aibudget=iterations&start=1');
  await page.locator('#decision').waitFor({ timeout: 30_000 });

  let decisions = 0;
  for (; decisions < 1500; decisions++) {
    const k = await owed(page);
    if (k === 'over') break;
    await page.waitForTimeout(60);
    if (k === 'chooseFirst') await page.keyboard.press('1');
    else if (k === 'mulligan') await page.keyboard.press('k');
    else if (k === 'main') await mainPhase(page);
    else if (k === 'trigger') {
      await tabTo(page, (a) => a.id === 'trigger-hand');
      await page.keyboard.press('Enter');
    } else if (k === 'block' || k === 'counter') {
      await tabTo(page, (a) => a.id === 'take-hit');
      await page.keyboard.press('Enter');
    } else if (k === 'optional') {
      await tabTo(page, (a) => a.id === 'skip-btn');
      await page.keyboard.press('Enter');
    } else if (k === 'order' || k === 'choose') {
      await tabTo(page, (a) => a.cls.split(' ').includes('opt'));
      await page.keyboard.press('Enter');
      await page.waitForTimeout(40);
      const done = page.locator('#choose-done');
      if (
        (await kind(page)) === 'choose' &&
        (await done.count()) &&
        (await done.getAttribute('aria-disabled')) !== 'true'
      ) {
        await tabTo(page, (a) => a.id === 'choose-done');
        await page.keyboard.press('Enter');
      }
    } else throw new Error(`unexpected decision ${k}`);
    await page.waitForTimeout(30);
  }
  const result = (
    await page
      .locator('.banner')
      .first()
      .innerText()
      .catch(() => '')
  ).trim();

  mkdirSync('test-results', { recursive: true });
  const report = {
    keystrokes: keys.keystrokes,
    longestTabRun: keys.longestTabRun,
    decisions,
    result,
    byKey: keys.byKey,
    errors,
  };
  writeFileSync('test-results/audit-keyboard-warlord.json', JSON.stringify(report, null, 1));
  info.annotations.push({
    type: 'keyboard-warlord',
    description: `${keys.keystrokes} keystrokes, longest Tab run ${keys.longestTabRun}, ${decisions} decisions, result "${result}"`,
  });
  console.log(`keyboard-warlord: ${JSON.stringify({ ...report, byKey: undefined })}`);

  await expect(page.locator('#decision-title')).toHaveText('Game over');
  expect(result, 'the game ends with a banner').toMatch(/win|lose|won|lost|draw/i);
  expect(errors).toEqual([]);
});
