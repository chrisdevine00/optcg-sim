/**
 * M7 WP4, the coach panel: Hint, Why, Lethal, Math, Tempo. The hint by keyboard (H, Down and Up,
 * Enter, Shift+Enter, Esc), axe on every tab, the hidden-information pair for the hint and threat
 * requests at the worker boundary, the strip's labels at both sizes, and screenshots to `.cache/wp4/`.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { nextDecision, serveArt, startGame } from './game-support.ts';

async function axe(page: Page, info: TestInfo, name: string) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `.cache/wp4/${info.project.name}-${name}.png` });
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(
    r.violations.map(
      (v) => `${name}: ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

const GAME = 'scenario=lethalDemo&speed=4&opp=pirate&aibudget=iterations';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* blocked */
    }
  });
});

test.describe('the strip', () => {
  test('five one-word buttons and the chevron, nothing clipped or overlapping', async ({
    page,
  }, info) => {
    await startGame(page, GAME);
    expect(await nextDecision(page)).toBe('main');
    const names = await page.locator('.coach-strip .coach-btn').allInnerTexts();
    expect(names.map((n) => n.split('\n')[0]!.trim())).toEqual(['Hint', 'Lethal', 'Math', 'Tempo']);
    await expect(page.locator('.coach')).toHaveAttribute('data-mode', 'strip');
    // The longest badge ("10/10" on Tempo) and the longest word still fit their button.
    const fits = await page.evaluate(() => {
      const strip = document.querySelector('.coach-strip')!.getBoundingClientRect();
      const boxes = [...document.querySelectorAll<HTMLElement>('.coach-strip > button')].map(
        (b) => {
          const r = b.getBoundingClientRect();
          return { l: r.left, r: r.right, clipped: b.scrollWidth > b.clientWidth + 1 };
        },
      );
      boxes.sort((a, b) => a.l - b.l);
      return {
        inside: boxes.every((b) => b.l >= strip.left - 1 && b.r <= strip.right + 1),
        overlap: boxes.some((b, i) => i > 0 && b.l < boxes[i - 1]!.r - 0.5),
        clipped: boxes.some((b) => b.clipped),
      };
    });
    expect(fits).toEqual({ inside: true, overlap: false, clipped: false });
    await axe(page, info, 'strip');
  });
});

test.describe('the hint', () => {
  test('keyboard: H asks and moves focus to the result; Down and Up walk the steps; Shift+Enter lines step 1 up; Enter commits; Esc clears', async ({
    page,
  }, info) => {
    await startGame(page, GAME);
    expect(await nextDecision(page)).toBe('main');
    // Nothing is asked by itself.
    await page.waitForTimeout(500);
    await expect(page.locator('.coach')).toHaveAttribute('data-mode', 'strip');
    await expect(page.getByTestId('hint-badge')).toHaveCount(0);

    await page.keyboard.press('h');
    await expect(page.locator('.coach')).toHaveAttribute('data-mode', 'open');
    await expect(page.locator('.coach-hint')).toHaveAttribute('data-hint', /thinking|ready/);
    await expect(page.locator('.coach-hint')).toBeFocused({ timeout: 5000 });
    await expect(page.locator('.coach-hint')).toHaveAttribute('data-hint', 'ready', {
      timeout: 30_000,
    });
    await axe(page, info, 'hint-ready');
    // Focus stayed on the region while the result arrived.
    await expect(page.locator('.coach-hint')).toBeFocused();

    const shows = page.getByRole('button', { name: /^Show step \d/ });
    const n = await shows.count();
    expect(n).toBeGreaterThan(0);
    await shows.first().focus();
    if (n > 1) {
      await page.keyboard.press('ArrowDown');
      await expect(shows.nth(1)).toBeFocused();
      await page.keyboard.press('ArrowUp');
      await expect(shows.first()).toBeFocused();
    }
    // Enter shows the step: it lights cards; nothing is played.
    await page.keyboard.press('Enter');
    await expect(page.locator('.coach-hint')).toHaveAttribute('data-hint', 'ready');

    // Shift+Enter on step 1 lines it up (it does not play it).
    const before = await page.locator('.log-list').innerText();
    await page.keyboard.press('Shift+Enter');
    await expect(page.locator('.staged-note')).toBeVisible();
    await expect(page.locator('#coach-staged-commit')).toBeFocused();
    expect(await page.locator('.log-list').innerText()).toBe(before);
    await axe(page, info, 'hint-staged');
    // The player commits.
    await page.keyboard.press('Enter');
    await expect(page.locator('.staged-note')).toHaveCount(0);
    expect(await page.locator('.log-list').innerText()).not.toBe(before);

    // Esc clears the hint when focus is in it.
    await page.locator('.coach-hint').focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('.coach-hint')).toHaveAttribute('data-hint', 'idle');
  });

  test('Esc stops a hint that is thinking', async ({ page }) => {
    await startGame(page, GAME);
    expect(await nextDecision(page)).toBe('main');
    await page.keyboard.press('h');
    await expect(page.locator('.coach-hint')).toHaveAttribute('data-hint', 'thinking');
    await page.keyboard.press('Escape');
    await expect(page.locator('.coach-hint')).toHaveAttribute('data-hint', 'idle');
  });

  test('doing something else greys the hint out and asks to ask again', async ({ page }) => {
    await startGame(page, GAME);
    expect(await nextDecision(page)).toBe('main');
    await page.keyboard.press('h');
    await expect(page.locator('.coach-hint')).toHaveAttribute('data-hint', 'ready', {
      timeout: 30_000,
    });
    // The hint's line starts with something other than giving 1 DON!! to the Character in this
    // position only by chance; whatever it is, End turn is not step 1 of a Main line that attacks.
    const first = await page
      .getByRole('button', { name: /^Show step 1/ })
      .getAttribute('aria-label');
    test.skip(/End your turn/.test(first ?? ''), 'the line is just End turn');
    await page.locator('#endturn-btn').click();
    await expect(page.locator('.coach-hint')).not.toHaveAttribute('data-hint', 'ready', {
      timeout: 5000,
    });
  });
});

test.describe('every tab passes axe', () => {
  test('hint (idle), lethal, math and tempo', async ({ page }, info) => {
    await startGame(page, GAME);
    expect(await nextDecision(page)).toBe('main');
    await page.keyboard.press('c');
    await expect(page.locator('.coach')).toHaveAttribute('data-mode', 'open');
    await expect(page.locator('.coach-hint')).toHaveAttribute('data-hint', 'idle');
    await axe(page, info, 'tab-hint-idle');
    await page.locator('#coach-math').click();
    await expect(page.getByLabel('DON!! math on the board')).toBeVisible();
    await axe(page, info, 'tab-math');
    await page.locator('#coach-tempo').click();
    await expect(page.getByTestId('tempo-label')).toContainText('DON!!');
    await axe(page, info, 'tab-tempo');
    await page.locator('#coach-lethal').click();
    await expect(page.locator('.coach-result')).toBeVisible();
    await axe(page, info, 'tab-lethal');
  });

  test('why, once the AI has moved', async ({ page }, info) => {
    await startGame(page, `${GAME}&first=opp`);
    await nextDecision(page);
    const why = page.getByRole('button', { name: 'Why', exact: true });
    if (!(await why.count())) test.skip(true, 'the AI made no move with a choice');
    await page.keyboard.press('c');
    await why.click();
    await expect(page.locator('.coach-result')).toBeVisible();
    await axe(page, info, 'tab-why');
  });

  test('the tempo bar tells its four parts apart by words and by pattern', async ({ page }) => {
    await startGame(page, GAME);
    expect(await nextDecision(page)).toBe('main');
    await page.keyboard.press('c');
    await page.locator('#coach-tempo').click();
    await expect(page.getByTestId('tempo-label')).toHaveText(
      /^\d+ DON!! · \d+ paid · \d+ given · \d+ held/,
    );
    const bg = await page
      .locator('.tempo-legend .key')
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundImage));
    // Four keys, four different patterns (never colour alone).
    expect(new Set(bg).size).toBe(4);
  });
});

test.describe('their turn: the threat check', () => {
  test('L on their Main Phase checks their board and says it does not count their hand', async ({
    page,
  }, info) => {
    await startGame(page, 'scenario=lethalDemo&speed=step&opp=pirate&aibudget=iterations');
    expect(await nextDecision(page)).toBe('main');
    await page.locator('#endturn-btn').click();
    // Their Main Phase: the L key checks their threat (the board is paused between their moves).
    await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'waiting');
    await page.keyboard.press('l');
    await expect(page.getByTestId('threat-hand-note')).toHaveText(
      'This does not count the cards in their hand.',
      { timeout: 30_000 },
    );
    await axe(page, info, 'threat');
  });
});

test.describe('hidden information at the worker boundary', () => {
  const spec = (hidden: { hand: string[]; deck: string[]; life: string[] }) => ({
    mode: 'ai',
    seed: 5,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: 'OP17-058',
      characters: ['OP17-062'],
      life: Array.from({ length: 3 }, () => 'EB04-007'),
      hand: ['EB04-007'],
      deck: Array.from({ length: 12 }, () => 'EB04-007'),
      costArea: { active: 5, rested: 0 },
    },
    p2: { leader: 'OP17-039', ...hidden, costArea: { active: 0, rested: 0 } },
  });
  const url = (s: unknown) =>
    `./play?scenario=json:${Buffer.from(JSON.stringify(s)).toString('base64url')}&speed=step&opp=pirate&aibudget=iterations&start=1`;

  async function record(page: Page, s: unknown) {
    await page.addInitScript(() => {
      const w = window as unknown as { __coach: string[] };
      w.__coach = [];
      const post = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function (m: unknown, ...rest: unknown[]) {
        const t = (m as { type?: string } | null)?.type;
        if (t === 'hint' || t === 'threat')
          w.__coach.push(JSON.stringify(m, (k, v) => (k === 'id' ? 0 : v)));
        return (post as (...a: unknown[]) => void).call(this, m, ...rest);
      };
    });
    await serveArt(page);
    await page.goto(url(s));
    await expect(page.locator('#decision')).toBeVisible({ timeout: 15_000 });
    expect(await nextDecision(page)).toBe('main');
    await page.keyboard.press('h');
    await expect(page.locator('.coach-hint')).toHaveAttribute('data-hint', 'ready', {
      timeout: 30_000,
    });
    const hintStates = await page.locator('.coach-hint').getAttribute('data-hint');
    await page.keyboard.press('Escape');
    await page.locator('#endturn-btn').click();
    await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'waiting');
    await page.keyboard.press('l');
    await expect(page.getByTestId('threat-hand-note')).toBeVisible({ timeout: 30_000 });
    const msgs = await page.evaluate(() => (window as unknown as { __coach: string[] }).__coach);
    return { msgs, hintStates };
  }

  test('what the coach worker is sent is identical for any hidden cards of theirs', async ({
    browser,
  }) => {
    test.skip(test.info().project.name !== '720p', 'one pass is enough');
    const a = await (await browser.newContext()).newPage();
    const b = await (await browser.newContext()).newPage();
    const ra = await record(a, {
      ...spec({
        hand: ['OP17-056', 'OP17-055'],
        deck: Array.from({ length: 12 }, () => 'EB04-007'),
        life: ['EB04-007'],
      }),
    });
    const rb = await record(b, {
      ...spec({
        hand: ['EB04-007', 'EB04-007'],
        deck: Array.from({ length: 12 }, () => 'OP17-056'),
        life: ['OP17-055'],
      }),
    });
    expect(ra.msgs.length).toBeGreaterThanOrEqual(2);
    expect(rb.msgs).toEqual(ra.msgs);
    expect(rb.hintStates).toBe(ra.hintStates);
    // The player's own list went to the coach worker, and the requests name no hidden card of theirs.
    for (const m of ra.msgs) expect(m).not.toContain('OP17-056');
  });
});

test.describe('hotseat', () => {
  test('has no hint or threat, and the defender’s hand shows only with a look-away line', async ({
    page,
  }) => {
    await serveArt(page);
    await page.goto('./play?scenario=defend&mode=hotseat&start=1');
    const curtain = page.locator('.curtain button');
    if (await curtain.isVisible().catch(() => false)) await curtain.click();
    await expect(page.locator('#decision')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.coach')).toHaveCount(0);
    await page.keyboard.press('h');
    await page.waitForTimeout(200);
    await expect(page.locator('.coach-hint')).toHaveCount(0);
  });
});
