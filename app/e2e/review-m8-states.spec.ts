/**
 * M8 WP7: axe (WCAG 2.2 AA, best practice) and a screenshot, at 1280x720 and 1920x1080, on the
 * Overview, History, the empty History, the storage-full states and a game from another version.
 * (Study is checked in the keyboard walk.) Screenshots go to `.cache/m8wp7/`, never committed.
 */
import { expect, test, type Page } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';
import { axe, load, planted, status } from './review-m8-support.ts';

test('Overview: the missed lethal, with its flag selected', async ({ page }, info) => {
  const g = planted()['missed-lethal']!;
  await load(page, [g], `./reviews/${g.id}`);
  await expect(status(page)).toHaveText('1 flag · 1 severe', { timeout: 45_000 });
  await axe(page, info, 'overview');
});

test('Overview: the E06 game, a flag whose Practice is not built yet says so', async ({
  page,
}, info) => {
  const g = planted()['don-unused']!;
  await load(page, [g], `./reviews/${g.id}`);
  await expect(status(page)).toContainText(/1 flag/, { timeout: 45_000 });
  await expect(page.getByTestId('practice-off')).toContainText(
    'Practice for this kind comes with the drills.',
  );
  await axe(page, info, 'overview-no-practice');
});

test('History with five games, then the empty History', async ({ page }, info) => {
  await load(page, Object.values(planted()));
  await expect(page.getByTestId('history-table').getByRole('row')).toHaveCount(6);
  await axe(page, info, 'history');
  await page.goto('./reviews?mode=delete');
  await expect(
    page.getByText('Saved games are full. Delete old reviews to keep saving.'),
  ).toBeVisible();
  await axe(page, info, 'history-delete-mode');
  // Delete them all by picking each and confirming; the empty page is the last state.
  for (const box of await page.getByRole('checkbox', { name: /^Select / }).all()) await box.check();
  await page.getByRole('button', { name: /^Delete selected/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByTestId('history-empty')).toBeVisible();
  await axe(page, info, 'history-empty');
});

/** Puts `n` copies of a game in the store (ids filler-0…), so the next save hits the 200-game cap. */
async function fill(page: Page, n: number) {
  await page.evaluate(
    (count) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('optcg-sim');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const read = db.transaction('games').objectStore('games').getAll();
          read.onsuccess = () => {
            const base = (read.result as { id: string; meta: { endedAt: number } }[])[0]!;
            const tx = db.transaction(['games', 'summaries'], 'readwrite');
            for (let i = 0; i < count; i++) {
              const g = { ...base, id: `filler-${i}`, meta: { ...base.meta, endedAt: 1_000 + i } };
              tx.objectStore('games').put(g);
              tx.objectStore('summaries').put({ id: g.id, meta: g.meta });
            }
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => reject(tx.error);
          };
        };
      }),
    n,
  );
}

test('storage full: a finished game that cannot be saved says so, and History offers to delete', async ({
  page,
}, info) => {
  test.setTimeout(120_000);
  await load(page, [planted()['target']!]);
  await fill(page, 199);
  await startGame(page, 'scenario=lethalDemo&speed=4&opp=rookie');
  await nextDecision(page);
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('menuitem', { name: 'Concede…' }).click();
  await page.getByRole('button', { name: 'Concede', exact: true }).click();
  await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'over');
  // The one notice, polite, with a link to History in delete mode. Nothing was deleted for the player.
  const notice = page.getByTestId('storage-notice');
  await expect(notice).toContainText('Saved games are full. Delete old reviews?');
  await expect(notice).toHaveAttribute('role', 'status');
  await axe(page, info, 'storage-full');
  await notice.getByRole('link', { name: 'Open saved games' }).click();
  await expect(page).toHaveURL(/mode=delete/);
  await expect(
    page.getByText('Saved games are full. Delete old reviews to keep saving.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^Delete selected/ })).toBeDisabled();
  await expect(page.getByRole('checkbox', { name: /^Select / })).toHaveCount(200);
  await axe(page, info, 'storage-full-history');
});

const GET_REVIEW_STATUS = `(db, id) => new Promise((res) => {
  const r = db.transaction('reviews').objectStore('reviews').get(id);
  r.onsuccess = () => res(r.result?.status ?? null);
})`;
const BREAK_GAME = `(db, id) => new Promise((res, rej) => {
  const tx = db.transaction('games', 'readwrite');
  const s = tx.objectStore('games');
  const g = s.get(id);
  g.onsuccess = () => {
    const game = g.result;
    game.record.snapshots[0].hash = 'not-the-hash';
    s.put(game);
  };
  tx.oncomplete = () => res(true);
  tx.onerror = () => rej(tx.error);
})`;

async function idb<T>(page: Page, fn: string, id: string): Promise<T> {
  return page.evaluate(
    ([code, arg]) =>
      new Promise<unknown>((resolve, reject) => {
        const open = indexedDB.open('optcg-sim');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const run = new Function('db', 'id', `return (${code})(db, id)`) as (
            db: IDBDatabase,
            id: string,
          ) => Promise<unknown>;
          run(db, arg).then((v) => {
            db.close();
            resolve(v);
          }, reject);
        };
      }),
    [fn, id] as const,
  ) as Promise<T>;
}

test('stale: a game from another version is read-only, with the reason', async ({ page }, info) => {
  const g = planted()['missed-lethal']!;
  await load(page, [g], `./reviews/${g.id}`);
  await expect(status(page)).toHaveText('1 flag · 1 severe', { timeout: 45_000 });
  await expect.poll(() => idb<string | null>(page, GET_REVIEW_STATUS, g.id)).toBe('complete');
  await idb(page, BREAK_GAME, g.id);
  await page.goto(`./reviews/${g.id}`);
  await expect(status(page)).toHaveText('1 flag · 1 severe · Read-only: older version', {
    timeout: 15_000,
  });
  await expect(page.locator('#play-from-btn')).toBeDisabled();
  await expect(page.locator('#practice-btn')).toBeDisabled();
  await axe(page, info, 'stale');
  await page.goto('./reviews');
  await expect(page.getByText('Read-only: older version')).toBeVisible();
  await axe(page, info, 'history-stale');
});
