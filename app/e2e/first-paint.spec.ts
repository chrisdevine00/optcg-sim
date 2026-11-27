/**
 * M10 WP1: the saved-data store is off the first paint's critical path. An init script holds the
 * app's IndexedDB `open` request (its success is delivered only when the test releases it, a promise;
 * no sleeps), and with it held: Home shows its h1 and the nav, Cards lists cards, Play shows the
 * gate (the heading, "Opening your saved data…") and does not start a game. After release Play
 * proceeds, a game saved earlier is still in the store, and a game started while the store was held
 * is saved to it. With the database never opening, the 3 s cap in `open()` gives the memory store
 * and the page. Reverts: `await initStore()` back in `main.tsx` (Home's h1 is absent while held);
 * StoreGate removed from Play (the board starts against an unready store: `#decision` shows while
 * held).
 *
 * The wait itself, navigation to a playable board at 4x CPU with the database 2 s late, is measured
 * with `PERF=1` and written to `test-results/first-paint.json`; it is asserted (4.5 s) only with
 * `PERF_ASSERT=1` (the perf workflow), never in a push run.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';
import { throttle } from './support/perf.ts';

const KEY = 'optcg-first-paint-hold';

/**
 * Wraps `indexedDB.open('optcg-sim')` so its `success` handler runs only after `__releaseIdb()`.
 * `sessionStorage[KEY]` turns it on for a page load: `hold` (until released) or `ms:<n>` (released
 * after n ms, the delay of the measurement). Upgrade and the real database work happen at once.
 */
const HOLD_SCRIPT = `(() => {
  const mode = sessionStorage.getItem('${KEY}');
  if (!mode) return;
  let release;
  const gate = new Promise((r) => (release = r));
  window.__releaseIdb = release;
  window.__idbHeld = 0;
  if (mode.startsWith('ms:')) setTimeout(release, Number(mode.slice(3)));
  let proto = IDBRequest.prototype, desc;
  while (proto && !(desc = Object.getOwnPropertyDescriptor(proto, 'onsuccess'))) proto = Object.getPrototypeOf(proto);
  const open = IDBFactory.prototype.open;
  IDBFactory.prototype.open = function (...args) {
    const req = open.apply(this, args);
    if (args[0] !== 'optcg-sim') return req;
    let handler = null;
    window.__idbHeld++;
    Object.defineProperty(req, 'onsuccess', {
      configurable: true,
      get: () => handler,
      set: (f) => {
        handler = f;
        desc.set.call(req, f ? (e) => gate.then(() => f.call(req, e)) : null);
      },
    });
    return req;
  };
})();`;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(HOLD_SCRIPT);
});

async function setHold(page: Page, mode: string | null) {
  await page.evaluate(
    ([k, m]) => (m ? sessionStorage.setItem(k!, m) : sessionStorage.removeItem(k!)),
    [KEY, mode] as const,
  );
}
const release = (page: Page) =>
  page.evaluate(() => (window as never as { __releaseIdb(): void }).__releaseIdb());
const held = (page: Page) =>
  page.evaluate(() => (window as never as { __idbHeld: number }).__idbHeld);

async function concede(page: Page) {
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('menuitem', { name: 'Concede…' }).click();
  await page.getByRole('button', { name: 'Concede', exact: true }).click();
  await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'over');
}

const GAME = 'scenario=lethalDemo&speed=4&opp=rookie';
const count = (page: Page) => page.getByTestId('data-count');
const gateStatus = (page: Page) => page.getByText('Opening your saved data…');

test('with the database held: Home, Cards and the Play gate paint; after release Play proceeds and a saved game is intact', async ({
  page,
}) => {
  // A game saved by an earlier visit (the store is not held yet).
  await startGame(page, GAME);
  await nextDecision(page);
  await concede(page);
  await page.goto('./settings');
  await expect(count(page)).toHaveText('1 saved game in this browser.');
  await setHold(page, 'hold');

  // Home: the h1 and the nav, with the open request pending.
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: 'OPTCG Sim' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await expect.poll(() => held(page)).toBe(1);
  // No "Saving is off" notice while the answer is not known.
  await expect(page.getByTestId('storage-notice')).toHaveCount(0);

  // Cards: the results list paints.
  await page.goto('./cards');
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('.card-btn').first()).toBeVisible({ timeout: 15_000 });

  // Play: the gate (the page's heading, focused, one status), and no setup form or board.
  await page.goto('./play');
  await expect(page.getByRole('heading', { level: 1, name: 'Play' })).toBeFocused();
  await expect(gateStatus(page)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'New game' })).toHaveCount(0);
  await expect(page.locator('#decision')).toHaveCount(0);
  await expect(page).toHaveTitle('Play · OPTCG Sim');
  expect(await held(page)).toBe(1);

  // Released: Play proceeds to Setup, the status goes, no storage notice.
  await release(page);
  await expect(page.getByRole('heading', { name: 'New game' })).toBeVisible();
  await expect(gateStatus(page)).toHaveCount(0);
  await expect(page.getByTestId('storage-notice')).toHaveCount(0);

  // The game saved before is still there (nothing was written to a stand-in store).
  await setHold(page, null);
  await page.goto('./settings');
  await expect(count(page)).toHaveText('1 saved game in this browser.');
});

test('a game never starts against a store that is still opening, and is saved once it is open', async ({
  page,
}) => {
  await page.goto('./about');
  await setHold(page, 'hold');
  await page.goto(`./play?${GAME}&start=1`);
  await expect(gateStatus(page)).toBeVisible();
  await expect(page.locator('#decision')).toHaveCount(0);
  await release(page);
  await expect(page.locator('#decision')).toBeVisible({ timeout: 15_000 });
  await nextDecision(page);
  await concede(page);
  await setHold(page, null);
  await page.reload();
  await page.goto('./settings');
  await expect(count(page)).toHaveText('1 saved game in this browser.');
});

test('a database that never opens: after the 3 s cap the page shows, in memory, with the one notice', async ({
  page,
}) => {
  await page.goto('./about');
  await setHold(page, 'hold');
  await page.goto('./decks');
  await expect(page.getByRole('heading', { level: 1, name: 'Decks' })).toBeVisible();
  await expect(gateStatus(page)).toBeVisible();
  await expect(page.getByTestId('storage-notice')).toHaveCount(0);
  // The cap (3 s in open()) falls back to memory: the page, and the notice that says why.
  await expect(gateStatus(page)).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByTestId('storage-notice')).toContainText('Saving is off');
});

test.describe('measurement', () => {
  test.skip(!process.env.PERF, 'PERF=1 switches the measurements on (npm run perf)');

  test('navigation to a playable board at 4x CPU with the database 2 s late', async ({
    page,
  }, info) => {
    test.setTimeout(120_000);
    await page.goto('./about');
    await setHold(page, 'ms:2000');
    await throttle(page, 4);
    const t0 = Date.now();
    await page.goto('./play?scenario=late&opp=pirate&speed=step&start=1');
    await expect(page.locator('#decision')).toBeVisible({ timeout: 60_000 });
    const ms = Date.now() - t0;
    const BOUND = 4500;
    mkdirSync('test-results', { recursive: true });
    writeFileSync(
      `test-results/first-paint-${info.project.name}.json`,
      JSON.stringify(
        {
          project: info.project.name,
          cpuSlowdown: 4,
          idbDelayMs: 2000,
          playableMs: ms,
          target: 3000,
          bound: BOUND,
        },
        null,
        2,
      ) + '\n',
    );
    if (process.env.PERF_ASSERT)
      expect(
        ms,
        `playable board at 4x with IndexedDB 2 s late: requirement 3000 ms, observed ${ms} ms, bound ${BOUND} ms`,
      ).toBeLessThan(BOUND);
  });
});
