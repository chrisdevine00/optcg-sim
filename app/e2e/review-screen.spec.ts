/**
 * M8 WP6: the review screen, History and the lesson page in a real browser. A finished game is
 * saved by the game itself; its review opens from the post-game button and from History (the same
 * screen, loaded from the store), keyboard-only: the timeline's two rows with Up and Down, the flag
 * listbox, N, Study with Esc back to the same flag. A stored review that was cut short is resumed;
 * a turn the review never reached is analysed on request; a game from another version is read-only,
 * with the reason. Delete mode (the storage-full notice's link) deletes only what is picked and
 * confirmed. axe runs on every page.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { nextDecision, startGame } from './game-support.ts';

// These specs read and write the stored review through `new Function` inside the page (the
// helpers below take their IndexedDB step as source text). The app's Content-Security-Policy
// (M10 WP6: `script-src 'self'`, no 'unsafe-eval') blocks that, so the harness bypasses CSP here;
// the policy itself is tested in m10-release.spec.ts, including a review run.
test.use({ bypassCSP: true });

async function axe(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: `.cache/m8wp6/${info.project.name}-${name}.png` });
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

/** Reads and writes the app's IndexedDB directly: what is stored, not what the page remembers. */
async function idb<T>(page: Page, fn: string, arg?: unknown): Promise<T> {
  return page.evaluate(
    ([code, a]) =>
      new Promise<unknown>((resolve, reject) => {
        const open = indexedDB.open('optcg-sim');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const run = new Function('db', 'arg', `return (${code})(db, arg)`) as (
            db: IDBDatabase,
            arg: unknown,
          ) => Promise<unknown>;
          run(db, a).then(
            (v) => {
              db.close();
              resolve(v);
            },
            (e) => reject(e),
          );
        };
      }),
    [fn, arg] as const,
  ) as Promise<T>;
}

const GAME_IDS = `(db) => new Promise((res) => {
  const r = db.transaction('games').objectStore('games').getAllKeys();
  r.onsuccess = () => res(r.result);
})`;
const GET_REVIEW = `(db, id) => new Promise((res) => {
  const r = db.transaction('reviews').objectStore('reviews').get(id);
  r.onsuccess = () => res(r.result ?? null);
})`;
const PUT_REVIEW = `(db, review) => new Promise((res, rej) => {
  const tx = db.transaction('reviews', 'readwrite');
  tx.objectStore('reviews').put(review);
  tx.oncomplete = () => res(true);
  tx.onerror = () => rej(tx.error);
})`;
const BREAK_GAME = `(db, id) => new Promise((res, rej) => {
  const tx = db.transaction('games', 'readwrite');
  const s = tx.objectStore('games');
  const g = s.get(id);
  g.onsuccess = () => {
    const game = g.result;
    // A position this build no longer reaches: the first snapshot's hash is wrong.
    game.record.snapshots[0].hash = 'not-the-hash';
    s.put(game);
  };
  tx.oncomplete = () => res(true);
  tx.onerror = () => rej(tx.error);
})`;

const gameId = async (page: Page): Promise<string> => {
  await expect.poll(async () => (await idb<string[]>(page, GAME_IDS)).length).toBe(1);
  return (await idb<string[]>(page, GAME_IDS))[0]!;
};

const status = (page: Page) => page.getByTestId('review-status');

test.describe('the review screen from the post-game button and from History', () => {
  test('timeline keys, the flag list, N, Study and Esc, announcements, History, delete mode', async ({
    page,
  }, info) => {
    await playAndConcede(page);
    await page.locator('#review-btn').click();
    await expect(status(page)).toHaveText('1 flag · 1 severe', { timeout: 30_000 });
    // The announcements: said once, politely, and the finished review says what it found.
    await expect(page.getByTestId('review-announce')).toContainText('Review ready: 1 flag.', {
      timeout: 5000,
    });
    await expect(page.locator('#rv-title')).toBeFocused();

    // The timeline: the mulligan is column 0; Left and Right move between turns, Up and Down
    // between "You" and the opponent's notable moves.
    const cell = (turn: number, row: 'you' | 'opp') => page.locator(`[data-cell="${turn}-${row}"]`);
    await cell(9, 'you').focus();
    await page.keyboard.press('ArrowDown');
    await expect(cell(9, 'opp')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(cell(9, 'you')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(cell(0, 'you')).toBeFocused();
    await page.keyboard.press('End');
    await expect(cell(9, 'you')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(cell(0, 'you')).toBeFocused();
    // Roving: exactly one cell is a tab stop.
    await expect(page.locator('[data-cell][tabindex="0"]')).toHaveCount(1);

    // N chooses the next flag, and says so.
    await page.keyboard.press('n');
    await expect(page.getByTestId('review-announce')).toContainText('Flag 1 of 1 selected.');
    await expect(page.getByTestId('review-announce')).toContainText(
      'Turn 9, your turn: missed lethal, severe, holds whatever they held.',
    );

    // The flag list is a tab stop of its own: Enter opens Study, Esc comes back to the list.
    const list = page.getByRole('listbox', { name: /^Flags/ });
    await list.focus();
    await expect(list.getByRole('option', { selected: true })).toHaveCount(1);
    await axe(page, info, 'overview');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('study-rail')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous flag (Shift+N)' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Next flag (N)' })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('selected-flag')).toBeVisible();
    await expect(page.getByRole('listbox', { name: /^Flags/ })).toBeFocused();

    // The lesson link opens the minimal lesson page.
    await page
      .getByRole('link', { name: /Lethal math \(L15\)/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/learn\/L15-lethal-math$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('L15 · Lethal math');
    await expect(page.getByRole('heading', { name: 'The idea' })).toBeVisible();
    await axe(page, info, 'lesson');

    // History: one row, the sentence a screen reader reads, and Review opens it from the store.
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Reviews' })
      .click();
    await expect(page.getByTestId('history-table')).toBeVisible();
    const open = page.getByRole('link', {
      name: /^Lost to .*, Rookie, .*, 9 turns?, 1 severe flag\. Review\.$/,
    });
    await expect(open).toHaveCount(1);
    await axe(page, info, 'history');

    // Export this game: a file in the shared format, nothing sent anywhere.
    const [dl] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /^Export / }).click(),
    ]);
    expect(dl.suggestedFilename()).toMatch(/^optcg-sim-game-.*\.json$/);
    const bundle = JSON.parse(readFileSync((await dl.path())!, 'utf8')) as {
      schema: string;
      games: unknown[];
      reviews: { status: string }[];
    };
    expect(bundle.schema).toBe('optcg-sim/export/1');
    expect(bundle.games).toHaveLength(1);
    expect(bundle.reviews[0]!.status).toBe('complete');

    await open.click();
    await expect(page).toHaveURL(/\/reviews\/g/);
    await expect(status(page)).toHaveText('1 flag · 1 severe', { timeout: 30_000 });
    await expect(page.getByTestId('selected-flag')).toContainText('You had lethal this turn.');
    await expect(page.getByTestId('review-announce')).toContainText('Review. 1 flag.');
    await axe(page, info, 'review-from-history');
    // A reload opens the same review from the store.
    await page.reload();
    await expect(status(page)).toHaveText('1 flag · 1 severe', { timeout: 30_000 });
    await page.getByRole('button', { name: /All reviews/ }).click();

    // Delete mode, as the storage-full notice links to it: nothing goes without a pick and a yes.
    await page.goto('./reviews?mode=delete');
    await expect(
      page.getByText('Saved games are full. Delete old reviews to keep saving.'),
    ).toBeVisible();
    const del = page.getByRole('button', { name: /^Delete selected/ });
    await expect(del).toBeDisabled();
    await page.getByRole('checkbox', { name: /^Select / }).check();
    await del.click();
    await expect(page.getByRole('alertdialog')).toContainText('This cannot be undone.');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('history-table')).toBeVisible();
    await del.click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByTestId('history-empty')).toContainText(
      'No games yet: play a game and its review appears here.',
    );
    await expect(page.getByTestId('history-status')).toHaveText('Deleted 1 game.');
    await expect(page.getByRole('link', { name: 'Play a game' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Try the tutorial' })).toBeVisible();
    await axe(page, info, 'history-empty');
  });
});

test.describe('a stored review that is not whole', () => {
  test('a turn the review never reached is analysed on request, and the flag appears', async ({
    page,
  }, info) => {
    await playAndConcede(page);
    await page.locator('#review-btn').click();
    await expect(status(page)).toHaveText('1 flag · 1 severe', { timeout: 30_000 });
    const id = await gameId(page);
    // The stored review says the deadline hit before turn 9: no results, one marker.
    await expect
      .poll(async () => (await idb<{ status: string } | null>(page, GET_REVIEW, id))?.status)
      .toBe('complete');
    const stored = await idb<Record<string, unknown>>(page, GET_REVIEW, id);
    await idb(page, PUT_REVIEW, {
      ...stored,
      results: {},
      markers: [{ turn: 9, kind: null, reason: 'deadline' }],
      practised: {},
    });
    await page.goto(`./reviews/${id}`);
    await expect(status(page)).toHaveText('0 flags · 1 not fully checked', { timeout: 15_000 });
    // The unreached turn is hatched and says so; its detail has Analyse now.
    const cell = page.locator('[data-cell="9-you"]');
    await expect(cell).toHaveClass(/hatched/);
    await expect(cell).toHaveAccessibleName('Turn 9, your turn: not analysed.');
    await cell.click();
    await expect(page.getByTestId('marker-note')).toContainText('Not analysed.');
    await axe(page, info, 'not-analysed');
    await page.getByRole('button', { name: 'Analyse now' }).click();
    await expect(status(page)).toHaveText('1 flag · 1 severe', { timeout: 30_000 });
    await expect(page.locator('[data-cell="9-you"]')).not.toHaveClass(/hatched/);
    // What it found is saved: the marker is gone from the store.
    await expect
      .poll(
        async () =>
          (await idb<{ markers: unknown[] } | null>(page, GET_REVIEW, id))?.markers.length,
      )
      .toBe(0);
  });

  test('a review cut short is resumed when the game is opened', async ({ page }) => {
    await playAndConcede(page);
    await page.locator('#review-btn').click();
    await expect(status(page)).toHaveText('1 flag · 1 severe', { timeout: 30_000 });
    const id = await gameId(page);
    await expect
      .poll(async () => (await idb<{ status: string } | null>(page, GET_REVIEW, id))?.status)
      .toBe('complete');
    const stored = await idb<Record<string, unknown>>(page, GET_REVIEW, id);
    await idb(page, PUT_REVIEW, { ...stored, results: {}, markers: [], status: 'partial' });
    // History says so.
    await page.goto('./reviews');
    await expect(page.getByRole('link', { name: 'Analysis incomplete · Resume' })).toBeVisible();
    await page.getByRole('link', { name: 'Analysis incomplete · Resume' }).click();
    await expect(status(page)).toHaveText('1 flag · 1 severe', { timeout: 30_000 });
    await expect
      .poll(async () => (await idb<{ status: string } | null>(page, GET_REVIEW, id))?.status)
      .toBe('complete');
  });
});

test.describe('a game from another version', () => {
  test('opens read-only with the reason; Play from here and Practice are off; History says so', async ({
    page,
  }, info) => {
    await playAndConcede(page);
    await page.locator('#review-btn').click();
    await expect(status(page)).toHaveText('1 flag · 1 severe', { timeout: 30_000 });
    const id = await gameId(page);
    await expect
      .poll(async () => (await idb<{ status: string } | null>(page, GET_REVIEW, id))?.status)
      .toBe('complete');
    await idb(page, BREAK_GAME, id);
    await page.goto(`./reviews/${id}`);
    // The stored review is shown; nothing is re-run.
    await expect(status(page)).toHaveText('1 flag · 1 severe · Read-only: older version', {
      timeout: 15_000,
    });
    const copy =
      'This game was played on an older version. You can read the review, but not replay it.';
    await expect(page.getByRole('note').filter({ hasText: copy })).toBeVisible();
    await expect(page.locator('#play-from-btn')).toBeDisabled();
    await expect(page.locator('#practice-btn')).toBeDisabled();
    await expect(page.getByTestId('practice-off')).toHaveText(copy);
    // The opponent's row says why it is empty; the timeline and flag still read.
    await expect(page.locator('[data-cell="9-opp"]')).toHaveAccessibleName(
      /not available for a game from an older version/,
    );
    await expect(page.getByTestId('selected-flag')).toContainText('You had lethal this turn.');
    await axe(page, info, 'read-only');
    await page.getByRole('button', { name: /All reviews/ }).click();
    await expect(page.getByText('Read-only: older version')).toBeVisible();
  });
});

test.describe('turn notes', () => {
  test('a note is shown as "Not flagged" in the turn detail, never as a flag or a marker', async ({
    page,
  }, info) => {
    await playAndConcede(page);
    await page.locator('#review-btn').click();
    await expect(status(page)).toHaveText('1 flag · 1 severe', { timeout: 30_000 });
    const id = await gameId(page);
    await expect
      .poll(async () => (await idb<{ status: string } | null>(page, GET_REVIEW, id))?.status)
      .toBe('complete');
    const stored = await idb<Record<string, unknown>>(page, GET_REVIEW, id);
    const note = {
      conceptId: 'lethal-math',
      claim: 'Hindsight check not finished',
      evidence: [
        {
          kind: 'fact',
          text: 'With their real cards there may have been a win you could not have seen.',
        },
      ],
      line: null,
      outcome: '',
      certainty: 'needed-hidden-info',
      nextTime: '',
      lessonId: 'L15-lethal-math',
      sources: [],
    };
    await idb(page, PUT_REVIEW, {
      ...stored,
      results: {
        'missed-lethal:9:0': { itemId: 'missed-lethal:9:0', turn: 9, flags: [], notes: [note] },
      },
      markers: [],
      practised: {},
    });
    await page.goto(`./reviews/${id}`);
    await expect(status(page)).toHaveText('Analysed: no flags found.', { timeout: 15_000 });
    // No flag and no marker on the timeline or in the list.
    await expect(page.locator('[data-cell="9-you"] .flag-shape')).toHaveCount(0);
    await expect(page.getByRole('listbox', { name: /^Flags/ })).toHaveCount(0);
    await expect(page.locator('[data-cell="9-you"]')).toHaveAccessibleName(
      'Turn 9, your turn: no flag, with a note.',
    );
    await page.locator('[data-cell="9-you"]').click();
    const notes = page.getByTestId('turn-notes');
    await expect(notes.getByRole('heading', { name: 'Not flagged' })).toBeVisible();
    await expect(notes).toContainText('Hindsight check not finished');
    await expect(notes).toContainText('there may have been a win you could not have seen');
    await axe(page, info, 'turn-note');
  });
});
