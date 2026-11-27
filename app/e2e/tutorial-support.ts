/** Helpers for the guided tutorial's end-to-end tests (M7 WP6). */
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';
import { serveArt } from './game-support.ts';

export const PROGRESS = 'optcg.tutorial.progress.v1';
export const TIMING = 'optcg.tutorial.timing.v1';

export const IDS = [
  't1-zones',
  't2-first-turn',
  't3-don-and-power',
  't4-attack',
  't5-defend',
  't6-trigger',
  't7-leader',
  't8-winning',
];

/** Art is served locally and storage starts empty (once per browser context, so a reload keeps it). */
export async function fresh(page: Page) {
  await serveArt(page);
  await page.addInitScript(() => {
    try {
      if (!window.sessionStorage.getItem('wp6-kept')) {
        window.localStorage.clear();
        window.sessionStorage.setItem('wp6-kept', '1');
      }
    } catch {
      /* blocked */
    }
  });
}

export const card = (page: Page) => page.getByTestId('tutorial-card');

export const hand = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^Your ${name}`) });

/** Start the tutorial at step `n` (1-based) with the progress a "Leave" would have saved. */
export async function startAt(page: Page, n: number) {
  await page.addInitScript(
    ([key, step]) => {
      try {
        if (!window.sessionStorage.getItem('wp6-seeded')) {
          window.localStorage.setItem(key as string, JSON.stringify({ runId: 'e2e', step }));
          window.sessionStorage.setItem('wp6-seeded', '1');
        }
      } catch {
        /* blocked */
      }
    },
    [PROGRESS, n - 1],
  );
  await page.goto('./tutorial');
  await expect(card(page)).toHaveAttribute('data-step', IDS[n - 1]!, { timeout: 20_000 });
  await expect(page.locator('#decision')).toBeVisible();
}

/** A screenshot (kept under .cache/wp6/) and axe at WCAG 2.2 AA. */
export async function check(page: Page, info: TestInfo, name: string) {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `.cache/wp6/${info.project.name}-${name}.png` });
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(
    r.violations.map(
      (v) => `${name}: ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

export async function next(page: Page) {
  const n = page.getByTestId('tutorial-next');
  await expect(n).toBeVisible({ timeout: 30_000 });
  await n.click();
}

/** Wait until the screen's player owes a decision (of this kind, when given). */
export async function myTurn(page: Page, kind?: string) {
  await expect
    .poll(
      async () => {
        const k = await page.locator('#decision').getAttribute('data-kind');
        return kind ? k === kind : k !== 'waiting' && k !== 'none';
      },
      { timeout: 30_000 },
    )
    .toBe(true);
}

export const focusIs = (page: Page, sel: string) =>
  page.evaluate((s) => !!document.activeElement?.matches(s), sel);

/** "Press Right until your Leader is focused." */
export async function rightUntil(page: Page, sel: string) {
  for (let i = 0; i < 12 && !(await focusIs(page, sel)); i++)
    await page.keyboard.press('ArrowRight');
  expect(await focusIs(page, sel)).toBe(true);
}

/** "Press Tab until you reach X." A person sees X before tabbing to it, so wait for it first
 * (under load the decision's kind can change a frame before its buttons are drawn). */
export async function tabUntil(page: Page, sel: string) {
  await expect(page.locator(sel)).toBeEnabled({ timeout: 30_000 });
  for (let i = 0; i < 30 && !(await focusIs(page, sel)); i++) await page.keyboard.press('Tab');
  expect(await focusIs(page, sel)).toBe(true);
}

export const leaderSel = '[data-zone="my-row"].bc-leader';
