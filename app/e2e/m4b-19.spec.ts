/**
 * M4b-19: face-up Life cards are drawn with their art, fanned so each is identifiable, and are
 * inspectable like any public card (pointer, keyboard, accessible name); face-down Life is not.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';

const FILLER = 'ST05-007';
const NAMI = 'OP01-016';
const ZORO = 'OP01-025';
const OTAMA = 'OP01-006';

const scenario = (p1Life: unknown[], p2Life: unknown[]) => ({
  mode: 'ai',
  seed: 9,
  turn: 3,
  activePlayer: 'p1',
  firstPlayer: 'p1',
  p1: {
    leader: 'OP17-058',
    life: p1Life,
    hand: [],
    characters: [],
    costArea: { active: 5, rested: 0 },
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

const SIZES = [
  [1280, 720],
  [1920, 1080],
] as const;

const up = (card: string) => ({ card, faceUp: true });

test.describe('M4b-19: face-up Life cards', () => {
  for (const [w, h] of SIZES) {
    test(`one and two face-up cards at ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      const spec = scenario([up(NAMI), FILLER, FILLER], [up(OTAMA), up(NAMI), FILLER]);
      await startGame(page, query(spec));
      expect(await nextDecision(page)).toBe('main');
      const mine = page.locator('[data-zone="my-row"].lface');
      const theirs = page.locator('[data-zone="opp-row"].lface');
      await expect(mine).toHaveCount(1);
      await expect(theirs).toHaveCount(2);
      // Art is shown (not a name tile), and every name is visible and unclipped.
      for (const el of await page.locator('.lface').all()) {
        await expect(el.locator('.face')).toBeVisible();
        const clip = await el.locator('.lface-name').evaluate((n) => n.scrollWidth > n.clientWidth);
        expect(clip).toBe(false);
        await expect(el.locator('.lface-name')).toBeVisible();
      }
      const names = await theirs.locator('.lface-name').allTextContents();
      expect(new Set(names).size).toBe(2);
      // The two cards are offset, and stay inside the Life zone.
      const a = (await theirs.nth(0).boundingBox())!;
      const b = (await theirs.nth(1).boundingBox())!;
      expect(Math.abs(a.y - b.y)).toBeGreaterThan(14);
      const zone = (await page.locator('[data-zone="opp-row"].z.life').boundingBox())!;
      for (const r of [a, b]) {
        expect(r.x).toBeGreaterThanOrEqual(zone.x - 1);
        expect(r.y).toBeGreaterThanOrEqual(zone.y - 1);
        expect(r.y + r.height).toBeLessThanOrEqual(zone.y + zone.height + 1);
      }
      // Accessible names follow the board pattern.
      await expect(mine.first().locator('.sr-only')).toContainText(/Nami, face-up Life card/);
      await page.screenshot({ path: `.cache/m4b-19/life-${w}x${h}.png` });
      await axe(page);
    });

    test(`two on my seat, one on theirs at ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      const spec = scenario([up(OTAMA), up(NAMI), FILLER], [FILLER, up(NAMI), FILLER]);
      await startGame(page, query(spec));
      expect(await nextDecision(page)).toBe('main');
      await expect(page.locator('[data-zone="my-row"].lface')).toHaveCount(2);
      await expect(page.locator('[data-zone="opp-row"].lface')).toHaveCount(1);
      const names = await page.locator('[data-zone="my-row"].lface .lface-name').allTextContents();
      expect(new Set(names).size).toBe(2);
      await page.screenshot({ path: `.cache/m4b-19/life-mine2-${w}x${h}.png` });
      await axe(page);
    });

    test(`pointer and keyboard inspect a face-up card, never a face-down one at ${w}x${h}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: w, height: h });
      const spec = scenario([up(NAMI), FILLER, FILLER], [up(OTAMA), up(NAMI), FILLER]);
      await startGame(page, query(spec));
      expect(await nextDecision(page)).toBe('main');
      // Hover (own seat and opponent's) previews the card.
      const mine = page.locator('[data-zone="my-row"].lface').first();
      await mine.hover();
      await expect(page.locator('.dock .dock-name')).toHaveText('Nami');
      const theirs = page.locator('[data-zone="opp-row"].lface').first();
      await theirs.hover();
      await expect(page.locator('.dock .dock-name')).not.toHaveText('Nami');
      await page.screenshot({ path: `.cache/m4b-19/hover-${w}x${h}.png` });
      // Keyboard: focus, then "i" opens the pinned inspector.
      await mine.focus();
      await page.keyboard.press('i');
      const dlg = page.getByRole('dialog', { name: /Inspector: Nami/ });
      await expect(dlg).toBeVisible();
      await page.screenshot({ path: `.cache/m4b-19/inspector-${w}x${h}.png` });
      await axe(page);
      await page.keyboard.press('Escape');
      await expect(dlg).toBeHidden();
      // Enter opens the card menu, with Inspect.
      await mine.focus();
      await page.keyboard.press('Enter');
      await page.getByRole('menuitem', { name: /^Inspect/ }).click();
      await expect(page.getByRole('dialog', { name: /Inspector: Nami/ })).toBeVisible();
      await page.keyboard.press('Escape');
      // Face-down Life: one summary item, no card, no name.
      const down = page.locator('[data-zone="my-row"].z.life');
      await down.focus();
      await page.keyboard.press('i');
      await expect(page.getByRole('dialog', { name: /Inspector/ })).toHaveCount(0);
      // The face-up card covers the middle of the zone: hover the bottom edge, where a back shows.
      await down.hover({ position: { x: 10, y: (await down.boundingBox())!.height - 3 } });
      await page.waitForTimeout(600);
      await expect(page.locator('.dock.pinned')).toHaveCount(0);
      await expect(down.locator('.sr-only')).not.toContainText(ZORO);
    });
  }
});
