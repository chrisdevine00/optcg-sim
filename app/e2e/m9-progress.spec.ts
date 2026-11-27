/**
 * M9 WP6: Learn and Progress by keyboard, storage and axe. The hub's heading takes focus, a lesson
 * with no drill can be marked read and the mark survives a reload, seeded drill sessions show on the
 * Progress page (chart and its table) and the recommendation says what it is built from; axe runs on
 * each screen.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

async function axe(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: `.cache/m9wp6/${info.project.name}-${name}.png`, fullPage: true });
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(
    r.violations.map(
      (v) => `${name}: ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.route(/\.(png|jpe?g|webp)(\?.*)?$/, (r) => r.abort());
});

/** Writes `progress.v1` straight into the app's IndexedDB, as a drill shell would have. */
async function seed(page: Page, value: unknown) {
  await page.goto('learn');
  await expect(page.getByRole('heading', { level: 1, name: 'Learn' })).toBeFocused();
  await page.evaluate(
    (v) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('optcg-sim');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('progress', 'readwrite');
          tx.objectStore('progress').put(v, 'v1');
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    value,
  );
}

test('the hub: heading, 27 lessons in 4 stages, rows are links, a lesson opens', async ({
  page,
}, info) => {
  await page.goto('learn');
  await expect(page.getByRole('heading', { level: 1, name: 'Learn' })).toBeFocused();
  await expect(
    page.getByText('27 lessons in 4 stages. Untimed; leave and come back any time.'),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(5);
  const l10 = page.getByRole('link', { name: /^L10 , Counter or take , not started/ });
  await expect(l10).toBeVisible();
  await expect(page.getByRole('link', { name: /^Tutorial/ })).toBeVisible();
  await axe(page, info, 'hub');
  await l10.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/learn\/L10-counter-or-take$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'L10 · Counter or take' }),
  ).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Worked examples' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Practise: Counter or take it' })).toBeVisible();
  await expect(page.getByText('In numbers: 8 of 10.')).toBeVisible();
  await axe(page, info, 'lesson-drill');
});

test('a lesson with no drill: Mark as read by keyboard, read in the hub and after a reload', async ({
  page,
}, info) => {
  await page.goto('learn/L18-hand-management');
  await expect(
    page.getByRole('heading', { level: 1, name: 'L18 · Hand management' }),
  ).toBeFocused();
  await expect(page.getByText('Lesson only: no drill yet.').first()).toBeVisible();
  const mark = page.getByRole('button', { name: 'Mark as read' });
  await mark.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Marked as read: undo' })).toBeVisible();
  await expect(page.getByText('L18 marked as read.')).toBeAttached();
  await axe(page, info, 'lesson-read');
  await page.goto('learn');
  await expect(page.getByRole('link', { name: /^L18 , Hand management , read/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: /^L18 , Hand management , read/ })).toBeVisible();
});

test('a rules lesson links Show me to its demo', async ({ page }) => {
  await page.goto('learn/L05-block-and-counter');
  await expect(page.getByRole('heading', { name: 'Show me' })).toBeVisible();
  const demo = page.getByRole('link', { name: 'Block first, Counter after' });
  await expect(demo).toHaveAttribute('href', /\/rules\/block-before-counter\/show$/);
});

test('progress with nothing yet: the course comes first, honestly', async ({ page }, info) => {
  await page.goto('progress');
  await expect(page.getByRole('heading', { level: 1, name: 'Progress' })).toBeFocused();
  await expect(page.getByText('Not enough games yet: next in the course is L01.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start lesson L01' })).toBeVisible();
  await expect(page.getByText('No Counter or take it sessions yet.')).toBeVisible();
  await expect(page.getByText('No counted games yet.')).toBeVisible();
  await axe(page, info, 'progress-empty');
});

test('progress with drill sessions: the chart has a table, and exporting progress only downloads', async ({
  page,
}, info) => {
  const at = (n: number) => `2026-11-2${n}T10:00:00.000Z`;
  const s = (id: string, n: number, correct: number, day: number, factor: number | null) => ({
    id,
    drill: 'counter',
    lesson: 'L10-counter-or-take',
    at: at(day),
    n,
    correct,
    shown: 0,
    factor,
    itemIds: Array.from({ length: n }, (_, i) => `c${i}`),
  });
  await seed(page, {
    v: 1,
    lessons: {},
    sessions: [s('a', 10, 5, 1, null), s('b', 10, 8, 2, null), s('c', 10, 9, 3, 1)],
  });
  await page.goto('progress');
  await expect(page.getByRole('heading', { level: 1, name: 'Progress' })).toBeFocused();
  const table = page.getByText('Counter or take it sessions as a table');
  await expect(table).toBeVisible();
  await table.click();
  await expect(page.getByRole('cell', { name: 'Timed at 100%' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '9 of 10', exact: true })).toBeVisible();
  await expect(
    page.getByRole('row', { name: /L10 Counter or take.*passed \(timed\)/ }),
  ).toBeVisible();
  await axe(page, info, 'progress-sessions');
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export progress only' }).click(),
  ]);
  expect(dl.suggestedFilename()).toMatch(/^optcg-sim-progress-\d{4}-\d{2}-\d{2}\.json$/);
  const body = JSON.parse(
    await (await import('node:fs/promises')).readFile((await dl.path())!, 'utf8'),
  ) as {
    games: unknown[];
    progress: { v1: { sessions: unknown[] } };
  };
  expect(body.games).toEqual([]);
  expect(body.progress.v1.sessions).toHaveLength(3);
});
