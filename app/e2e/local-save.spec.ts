/**
 * M8 WP5: local save in a real browser. A finished game against the AI is saved to IndexedDB by the
 * game itself; Settings → Data shows it, exports it, imports it back (with the Replace / Keep both /
 * Cancel question), deletes it, and survives a reload. The two M7 logs migrate out of localStorage
 * once; a browser with no IndexedDB gets the one "Saving is off" notice. axe runs on the panels.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { nextDecision, startGame } from './game-support.ts';

async function axe(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: `.cache/m8wp5/${info.project.name}-${name}.png` });
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(
    r.violations.map(
      (v) => `${name}: ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

/** A finished game against the AI: the lethal demo, then concede. The save seam stores it. */
async function playAndConcede(page: Page) {
  await startGame(page, 'scenario=lethalDemo&speed=4&opp=rookie');
  await nextDecision(page);
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('menuitem', { name: 'Concede…' }).click();
  await page.getByRole('button', { name: 'Concede', exact: true }).click();
  await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'over');
}

const count = (page: Page) => page.getByTestId('data-count');
const status = (page: Page) => page.getByTestId('settings-status');

test('a finished game is saved, exported, imported with the conflict question, and deleted', async ({
  page,
}, info) => {
  await playAndConcede(page);
  await page.goto('./settings');
  await expect(count(page)).toHaveText('1 saved game in this browser.');

  // It survives a reload (it is in IndexedDB, not memory).
  await page.reload();
  await expect(count(page)).toHaveText('1 saved game in this browser.');
  await axe(page, info, 'settings-data');

  // Export everything: a JSON file with the game in it, nothing sent anywhere.
  const requests: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('blob:') && !r.url().includes('localhost')) requests.push(r.url());
  });
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export everything' }).click(),
  ]);
  expect(dl.suggestedFilename()).toMatch(/^optcg-sim-export-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await dl.path();
  const exported = JSON.parse(readFileSync(path, 'utf8')) as {
    schema: string;
    games: { id: string; meta: { result: string } }[];
  };
  expect(exported.schema).toBe('optcg-sim/export/1');
  expect(exported.games).toHaveLength(1);
  expect(exported.games[0]!.meta.result).toBe('lost');
  await expect(status(page)).toHaveText('Exported everything to a file.');
  expect(requests).toEqual([]);

  // Delete all: the inline question, by keyboard; focus returns to the button.
  await page.getByRole('button', { name: 'Delete all saved games' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /^Delete for good/ })).toBeFocused();
  await page.getByRole('button', { name: 'Keep it' }).click();
  await expect(page.getByRole('button', { name: 'Delete all saved games' })).toBeFocused();
  await expect(count(page)).toHaveText('1 saved game in this browser.');
  await page.getByRole('button', { name: 'Delete all saved games' }).click();
  await page.getByRole('button', { name: /^Delete for good/ }).click();
  await expect(count(page)).toHaveText('No saved games yet.');
  await page.reload();
  await expect(count(page)).toHaveText('No saved games yet.');

  // Import the file back: no conflict, so it goes straight in.
  await page.getByLabel('Import a file').setInputFiles(path);
  await expect(status(page)).toHaveText('Imported 1 game.');
  await expect(count(page)).toHaveText('1 saved game in this browser.');

  // Import it again: the id exists, so the question appears, focused, and Escape cancels it.
  await page.getByLabel('Import a file').setInputFiles(path);
  const ask = page.getByRole('group', { name: /already saved here/ });
  await expect(ask).toBeVisible();
  await expect(page.getByRole('heading', { name: /already saved here/ })).toBeFocused();
  await axe(page, info, 'import-conflict');
  await page.keyboard.press('Escape');
  await expect(ask).toHaveCount(0);
  await expect(status(page)).toHaveText('Import cancelled. Nothing was changed.');
  await expect(page.getByLabel('Import a file')).toBeFocused();
  await expect(count(page)).toHaveText('1 saved game in this browser.');

  // And once more, keeping both.
  await page.getByLabel('Import a file').setInputFiles(path);
  await page.getByRole('button', { name: 'Keep both' }).click();
  await expect(count(page)).toHaveText('2 saved games in this browser.');
  // Replace puts the file's copy over the one that has its id.
  await page.getByLabel('Import a file').setInputFiles(path);
  await page.getByRole('button', { name: 'Replace 1' }).click();
  await expect(status(page)).toContainText('1 replaced');
  await expect(count(page)).toHaveText('2 saved games in this browser.');
});

test('a bad import file changes nothing and says why', async ({ page }) => {
  await page.goto('./settings');
  const input = page.getByLabel('Import a file');
  await input.setInputFiles({
    name: 'x.json',
    mimeType: 'application/json',
    buffer: Buffer.from('not json'),
  });
  await expect(status(page)).toHaveText(/not readable JSON/);
  await input.setInputFiles({
    name: 'y.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"schema":"optcg-sim/export/9"}'),
  });
  await expect(status(page)).toHaveText(/newer version/);
  await input.setInputFiles({
    name: 'z.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        schema: 'optcg-sim/export/1',
        games: [
          { id: '../x', meta: {}, record: {} },
          { id: 'ok', surprise: true },
        ],
      }),
    ),
  });
  await expect(status(page)).toHaveText(
    'Imported 0 games. 2 items in the file could not be read and were left out.',
  );
  await expect(count(page)).toHaveText('No saved games yet.');
  await expect(
    page.getByRole('list', { name: 'Left out of the import' }).getByRole('listitem'),
  ).toHaveCount(2);
});

test('the two M7 logs move from localStorage into IndexedDB once, and are still there after', async ({
  page,
}) => {
  const run = {
    schema: 'tutorial-timing/1',
    runId: 'migrated-run',
    appVersion: '0.0.0',
    engineVersion: '0.5.18',
    tutorialVersion: '1',
    startedAt: '2026-11-20T10:00:00.000Z',
    settings: {
      reducedMotion: false,
      aiPace: '2x',
      singleKeyShortcuts: true,
      cardAnnouncements: 'standard',
    },
    steps: [],
    completedMs: null,
    totalActiveMs: 60000,
    totalWallMs: 60000,
  };
  await page.addInitScript((r) => {
    if (window.localStorage.getItem('seeded-by-test')) return;
    window.localStorage.setItem('seeded-by-test', '1');
    window.localStorage.setItem('optcg.tutorial.timing.v1', JSON.stringify([r]));
    window.localStorage.setItem(
      'optcg.progress.lethal.v1',
      JSON.stringify([{ game: 1, turn: 2, furthest: 'tier1' }]),
    );
    window.localStorage.setItem('optcg.coach.v1', '{"tab":"math"}');
  }, run);
  await page.goto('./settings');
  const list = page.getByRole('list', { name: 'Tutorial runs' });
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list).toContainText('1 min active, not finished');
  const keys = await page.evaluate(() => ({
    timing: window.localStorage.getItem('optcg.tutorial.timing.v1'),
    progress: window.localStorage.getItem('optcg.progress.lethal.v1'),
    coach: window.localStorage.getItem('optcg.coach.v1'),
  }));
  expect(keys).toEqual({ timing: null, progress: null, coach: '{"tab":"math"}' });
  await page.reload();
  await expect(page.getByRole('list', { name: 'Tutorial runs' }).getByRole('listitem')).toHaveCount(
    1,
  );
  // Delete it through the inline question; it stays deleted after a reload.
  await page
    .getByRole('button', { name: /^Delete the run of|^Delete$/ })
    .first()
    .click();
  await page
    .getByRole('button', { name: /^Delete for good/ })
    .first()
    .click();
  await expect(page.getByText('No tutorial runs are stored.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('No tutorial runs are stored.')).toBeVisible();
});

test('no IndexedDB: one notice, and saving is off', async ({ page }, info) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true });
  });
  await page.goto('./');
  const notice = page.getByTestId('storage-notice');
  await expect(notice).toContainText('Saving is off in this browser; Export keeps a copy.');
  await axe(page, info, 'saving-off');
  await notice.getByRole('link', { name: 'Settings → Data' }).click();
  await expect(page.getByRole('note')).toContainText('Saving is off in this browser');
  await expect(count(page)).toHaveText('No saved games yet.');
  await notice.getByRole('button', { name: 'Dismiss' }).click();
  await expect(notice).toHaveCount(0);
  // Export still works, as a copy of this session.
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export everything' }).click(),
  ]);
  expect(dl.suggestedFilename()).toMatch(/^optcg-sim-export-/);
});

test('Keep my saved games asks the browser only when pressed', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __persistCalls: number }).__persistCalls = 0;
    const s = navigator.storage;
    s.persisted = () => Promise.resolve(false);
    s.persist = () => {
      (window as unknown as { __persistCalls: number }).__persistCalls++;
      return Promise.resolve(true);
    };
  });
  await page.goto('./settings');
  await expect(page.getByTestId('data-count')).toBeVisible();
  expect(
    await page.evaluate(() => (window as unknown as { __persistCalls: number }).__persistCalls),
  ).toBe(0);
  const keep = page.getByRole('button', { name: 'Keep my saved games' });
  await expect(keep).not.toHaveAttribute('aria-disabled', 'true');
  await keep.click();
  await expect(status(page)).toHaveText('Your browser will keep your saved games.');
  expect(
    await page.evaluate(() => (window as unknown as { __persistCalls: number }).__persistCalls),
  ).toBe(1);
});
