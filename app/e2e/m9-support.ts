/** Helpers shared by the M9 specs (WP8): axe at WCAG 2.2 AA with a screenshot kept under `.cache/m9/`. */
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';

/** `.cache/m9/<project>-<name>.png`: saved and read by the review; there are no pixel baselines. */
export async function shot(page: Page, info: TestInfo, name: string, fullPage = false) {
  await page.screenshot({ path: `.cache/m9/${info.project.name}-${name}.png`, fullPage });
}

/** A screenshot, then axe (WCAG 2.2 AA and best practice) must find nothing. */
export async function axe(page: Page, info: TestInfo, name: string, fullPage = false) {
  await shot(page, info, name, fullPage);
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(
    r.violations.map(
      (v) => `${name}: ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

/** Art hosts are not reachable in CI: the screens draw without them. */
export async function noArt(page: Page) {
  await page.route(/\.(png|jpe?g|webp)(\?.*)?$/, (r) => r.abort());
}

/** The text of what has focus, or "(nothing)": an answer must never be it. */
export const focusedText = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el && el !== document.body ? (el.innerText?.trim() ?? '') : '(nothing)';
  });
