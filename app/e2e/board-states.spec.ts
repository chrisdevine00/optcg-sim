/**
 * Every board state at both design sizes: zero axe violations (accessibility.md §11.1) and a
 * screenshot in .cache/m3/ for review. Adapted sizes check that no tall body scrolls and no footer
 * label overflows (board.md §6.2, §6.3; review-1 UX-V2, UX-V12).
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { nextDecision, serveArt, startGame } from './game-support.ts';

async function check(page: Page, info: TestInfo, name: string) {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `.cache/m3/${info.project.name}-${name}.png` });
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(
    r.violations.map(
      (v) => `${name}: ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

async function attackInLethal(page: Page) {
  await startGame(page, 'scenario=lethal&speed=4');
  expect(await nextDecision(page)).toBe('main');
  await page.locator('[data-zone="my-row"].bc-leader').click();
  await page.locator('[data-zone="opp-row"].bc-leader').click();
}

test.describe('board states', () => {
  test('setup, mulligan, main, inspector and dialogs', async ({ page }, info) => {
    await serveArt(page);
    await page.goto('./play?seed=42&first=me');
    await expect(page.getByRole('heading', { name: 'New game' })).toBeVisible();
    await check(page, info, 'setup');
    await page.getByRole('button', { name: 'Start game' }).click();
    expect(await nextDecision(page)).toBe('chooseFirst');
    await check(page, info, 'choose-first');
    await page.locator('#first-btn').click();
    expect(await nextDecision(page)).toBe('mulligan');
    await expect(page.locator('#keep-btn')).toBeFocused();
    await check(page, info, 'mulligan');
    await page.locator('#keep-btn').click();
    expect(await nextDecision(page)).toBe('main');
    await check(page, info, 'main');
    // Inspector: I on a focused card; Escape returns focus.
    const card = page.locator('.bc[data-zone="hand"]').first();
    await card.focus();
    await page.keyboard.press('i');
    await expect(page.getByRole('dialog', { name: /^Inspector/ })).toBeVisible();
    await check(page, info, 'inspector');
    await page.keyboard.press('Escape');
    await expect(card).toBeFocused();
    await page.keyboard.press('?');
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
    await check(page, info, 'shortcuts');
    await page.keyboard.press('Escape');
    await page.locator('.z.trash').last().click();
    await expect(page.getByRole('dialog', { name: /trash/ })).toBeVisible();
    await check(page, info, 'trash');
  });

  test('attack confirm and game over', async ({ page }, info) => {
    await attackInLethal(page);
    await expect(page.locator('#confirm-attack')).toBeVisible();
    await check(page, info, 'attack-confirm');
    await page.locator('#confirm-attack').click();
    expect(await nextDecision(page)).toBe('over');
    await expect(page.locator('.banner')).toContainText('You win');
    await check(page, info, 'game-over');
  });

  test('defence planner states and the damage decision', async ({ page }, info) => {
    await startGame(page, 'scenario=defend&speed=4');
    await nextDecision(page);
    await page.locator('[data-zone="my-row"].bc-leader').click();
    await page.locator('[data-zone="opp-row"].bc-leader').click();
    await page.locator('#confirm-attack').click();
    expect(await nextDecision(page)).toBe('block');
    await check(page, info, 'defend-hidden');
    await page.keyboard.down('r');
    await check(page, info, 'defend-plan');
    await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
    await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
    await check(page, info, 'defend-tie');
    await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
    await check(page, info, 'defend-stop');
    await page.locator('.bc[data-zone="hand"]').first().hover();
    await page.waitForTimeout(400);
    await check(page, info, 'defend-preview');
    await page.locator('#decision .lanehd button').click();
    await page.locator('#take-hit').click();
    expect(await nextDecision(page)).toBe('trigger');
    await check(page, info, 'trigger');
    await page.keyboard.up('r');
  });

  test('choose (a full Character area) and the AI turn', async ({ page }, info) => {
    await startGame(page, 'scenario=full&speed=step');
    await nextDecision(page);
    await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
    await page.getByRole('menuitem', { name: /^▶ Play/ }).click();
    expect(await nextDecision(page)).toBe('choose');
    await check(page, info, 'choose');
    await page.locator('#decision .opts button').first().click();
    await page.locator('#choose-done').click();
    await nextDecision(page);
    await page.locator('#endturn-btn').click();
    await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'waiting');
    await expect(page.locator('#skip-btn')).toBeVisible();
    await check(page, info, 'ai-turn');
  });
});

test('forced colours keep the legal ring and the focus ring distinct (accessibility §4.1)', async ({
  page,
}, info) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await startGame(page, 'scenario=lethal&speed=4');
  await nextDecision(page);
  await page.locator('[data-zone="my-row"].bc-leader').focus();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `.cache/m3/${info.project.name}-forced-colours.png` });
  const outline = await page
    .locator('[data-zone="my-row"].bc-leader')
    .evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
});

/** One 20 px line plus a little: the margin every tall body keeps at the adapted sizes. */
const SLACK = 24;

test.describe('adapted sizes', () => {
  for (const [w, h] of [
    [1280, 600],
    [1024, 690],
    [1180, 740],
  ] as const) {
    test(`${w}×${h}: tall bodies never scroll; footer labels fit`, async ({ page }, info) => {
      test.skip(info.project.name !== '720p', 'one pass is enough');
      await page.setViewportSize({ width: w, height: h });
      await startGame(page, 'scenario=defend&speed=4');
      await nextDecision(page);
      await page.locator('[data-zone="my-row"].bc-leader').click();
      await page.locator('[data-zone="opp-row"].bc-leader').click();
      const fits = () =>
        page.evaluate(() => {
          const body = document.querySelector('.dec-body')!;
          // No label spills out of its button, and no button out of the window.
          const over = [...document.querySelectorAll('.dec-foot .btn')].filter((b) => {
            const r = b.getBoundingClientRect();
            const kids = [...b.querySelectorAll('*')].map((k) => k.getBoundingClientRect());
            return (
              r.bottom > window.innerHeight + 0.5 ||
              kids.some(
                (k) =>
                  k.bottom > r.bottom + 0.5 || k.right > r.right + 0.5 || k.left < r.left - 0.5,
              )
            );
          }).length;
          const primary =
            document.querySelector('.dec-foot .btn.primary')?.getBoundingClientRect().width ?? 999;
          // Slack: free height under the body's content. Fonts and wrapping differ across platforms
          // (Linux CI wrapped one more line than macOS), so every tall body keeps a line spare.
          const top = body.getBoundingClientRect().top;
          const bottom = Math.max(
            ...[...body.querySelectorAll('*')].map((el) => el.getBoundingClientRect().bottom),
          );
          const pad = parseFloat(getComputedStyle(body).paddingBottom);
          const slack = body.clientHeight - (bottom - top + pad);
          return { scroll: body.scrollHeight - body.clientHeight, slack, over, primary };
        });
      const ok = async (name: string) => {
        await page.waitForTimeout(300);
        await page.screenshot({ path: `.cache/m3/${w}x${h}-${name}.png` });
        const f = await fits();
        console.log(`${w}x${h} ${name}: slack ${Math.round(f.slack)} px`);
        expect(f.scroll, `${name} body scrolls`).toBeLessThanOrEqual(0);
        expect(f.slack, `${name} keeps a spare line`).toBeGreaterThanOrEqual(SLACK);
        expect(f.over, `${name} footer overflow`).toBe(0);
        expect(f.primary, `${name} primary width`).toBeGreaterThanOrEqual(136);
      };
      await ok('attack-confirm');
      await page.locator('#confirm-attack').click();
      await nextDecision(page);
      await page.keyboard.down('r');
      await ok('defend-plan');
      for (let i = 0; i < 2; i++)
        await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
      await ok('defend-tie');
      await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
      await ok('defend-stop');
      await page.locator('#decision .lanehd button').click();
      await page.locator('[data-zone="my-chars"][data-glyph="target"]').first().click();
      await ok('defend-block');
      await page.locator('#decision .lanehd button').click();
      await page.locator('#take-hit').click();
      await nextDecision(page);
      await ok('trigger');
      await page.keyboard.up('r');
    });
  }
});
