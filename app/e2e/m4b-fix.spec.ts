/**
 * M4b fix round 1 (app): face-up Life cards are drawn, the look-at-top panel lists every card it
 * looked at, a look with nothing to take can be finished, and the log says where the rest went.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { decisionKind, nextDecision, startGame } from './game-support.ts';

const SAUL = 'OP17-089';
const RODO = 'OP17-094'; // {Elbaph}
const FILLER = 'ST05-007'; // not {Elbaph}

const scenario = (p1: Record<string, unknown>, p2Life: unknown[]) => ({
  mode: 'ai',
  seed: 9,
  turn: 3,
  activePlayer: 'p1',
  firstPlayer: 'p1',
  p1: {
    leader: 'OP17-058',
    life: [FILLER, FILLER, FILLER],
    hand: [SAUL],
    characters: [],
    costArea: { active: 5, rested: 0 },
    ...p1,
  },
  p2: {
    leader: 'ST04-001',
    life: p2Life,
    hand: [],
    characters: [],
    deck: Array.from({ length: 10 }, () => 'OP01-012'),
    costArea: { active: 0, rested: 2 },
  },
});
const query = (spec: unknown) =>
  `scenario=json:${Buffer.from(JSON.stringify(spec)).toString('base64url')}&speed=4`;

async function axe(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
}

async function playSaul(page: Page) {
  expect(await nextDecision(page)).toBe('main');
  await page.locator(`[data-zone="hand"][data-card="${SAUL}"]`).click();
  await page.getByRole('menuitem', { name: /^Play/ }).click();
}

const SIZES = [
  [1280, 720],
  [1920, 1080],
] as const;

test.describe('M4b fix round 1: Life, look panel and log', () => {
  for (const [w, h] of SIZES) {
    test(`face-up Life cards are drawn and named at ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      const spec = scenario({ life: [{ card: 'OP01-016', faceUp: true }, FILLER, FILLER] }, [
        'OP01-025',
        { card: 'OP01-006', faceUp: true },
      ]);
      await startGame(page, query(spec));
      expect(await nextDecision(page)).toBe('main');
      const mine = page.locator('.z.life').nth(1);
      const theirs = page.locator('.z.life').first();
      await expect(page.locator('.lface')).toHaveCount(2);
      await expect(
        page.locator('[data-zone="my-row"].z.life .sr-only, .z.life .sr-only').nth(1),
      ).toContainText(/Life, 3 cards, 1 face-up: Nami/);
      await expect(theirs.locator('.sr-only')).toContainText(/Life, 2 cards, 1 face-up: /);
      await expect(page.locator('[data-zone="my-row"].lface')).toHaveCount(1);
      void mine;
      // A hidden Life card never names itself.
      await expect(theirs.locator('.sr-only')).not.toContainText('Roronoa Zoro');
      await page.screenshot({ path: `.cache/m4b-fix/faceup-life-${w}x${h}.png` });
      await axe(page);
    });

    test(`the look panel lists every card, ineligible ones marked, at ${w}x${h}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: w, height: h });
      const spec = scenario(
        {
          deck: [FILLER, RODO, FILLER, ...Array.from({ length: 10 }, () => FILLER)],
        },
        [FILLER, FILLER],
      );
      await startGame(page, query(spec));
      await playSaul(page);
      expect(await nextDecision(page)).toBe('choose');
      const opts = page.locator('#decision .opts button');
      await expect(opts).toHaveCount(3);
      const off = page.locator('#decision .opts button[aria-disabled="true"]');
      await expect(off).toHaveCount(2);
      await expect(off.first()).toContainText('can’t be chosen');
      await page.screenshot({ path: `.cache/m4b-fix/look-panel-${w}x${h}.png` });
      await axe(page);
      await page.locator('#decision .opts button:not([aria-disabled="true"])').click();
      await page.locator('#choose-done').click();
      expect(await nextDecision(page)).toBe('main');
      // The rest went to the trash, face up: the log names them and says where.
      const log = page.locator('.log-row').filter({ hasText: 'from the top of your deck' });
      await expect(log.first()).toBeVisible();
      await page.screenshot({ path: `.cache/m4b-fix/look-log-${w}x${h}.png` });
      await axe(page);
    });
  }

  test('a look with nothing to take can be finished (review M4b-05)', async ({ page }) => {
    const spec = scenario({ deck: Array.from({ length: 13 }, () => FILLER) }, [FILLER, FILLER]);
    // ask=1: forced decisions are shown, as the review saw this one.
    await startGame(page, `${query(spec)}&ask=1`);
    await playSaul(page);
    await expect(page.locator('.log-row').filter({ hasText: 'Look at the top 3' })).toBeVisible();
    // The engine may ask nothing (no eligible card) or ask with "Choose none": it must finish.
    for (let i = 0; i < 40; i++) {
      const k = await decisionKind(page);
      if (k === 'main') break;
      if (k === 'choose') {
        const done = page.locator('#choose-done');
        if (await done.isVisible()) await done.click();
      }
      await page.waitForTimeout(100);
    }
    expect(await decisionKind(page)).toBe('main');
    await expect(
      page.locator('.log-row').filter({ hasText: 'from the top of your deck' }).first(),
    ).toBeVisible();
  });
});
