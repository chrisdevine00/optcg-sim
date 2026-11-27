/**
 * M10 WP8: pixel baselines of the screens at both design sizes (1280x720 and 1920x1080 projects).
 * Nightly and on dispatch only (`VISUAL=1`, `npm run test:visual`); each test skips itself, with the
 * reason, off Linux and while its baseline is absent, so these never fail a run that cannot compare.
 *
 * Determinism: every art host is aborted (cards draw as text faces; no Bandai art can enter a
 * baseline), the date is fixed, reduced motion is on, fonts are awaited, the game screens start from
 * fixed scenarios and seeds with the AI on iteration budgets at step speed. The five the PROMPT names
 * (board, inspector, coach, review timeline, meta explorer) come first and are never cut.
 *
 * Revert that fails it: change a token colour (app/src/styles/tokens.css) and run with a baseline
 * present; the diff is over `maxDiffPixelRatio`. Absent baseline: the skip message names the workflow.
 */
import { expect, test, type Page } from '@playwright/test';
import { nextDecision } from '../game-support.ts';
import { planted } from '../review-m8-support.ts';
import { prepare, settle, skipReason } from './support.ts';

const ROCKS = [
  '1 OP17-039',
  '3 OP08-051',
  '4 OP17-040',
  '1 OP17-042',
  '3 OP17-044',
  '4 OP17-045',
  '4 OP17-046',
  '4 OP17-048',
  '4 OP17-049',
  '3 OP17-050',
  '4 OP17-052',
  '4 OP17-054',
  '4 OP17-055',
  '4 OP17-056',
  '4 OP17-118',
].join('\n');

/** Starts a game screen: the board is up and the decision panel is on screen. */
async function play(page: Page, query: string): Promise<string> {
  await page.goto(`./play?${query}&start=1`);
  await expect(page.locator('#decision')).toBeVisible({ timeout: 15_000 });
  return nextDecision(page);
}

const SCENARIO = 'speed=step&opp=pirate&aibudget=iterations&seed=7';

/** Puts values into one IndexedDB store of the app's database, then leaves the page loaded. */
async function put(
  page: Page,
  stores: Record<string, { key?: string; value: unknown }[]>,
): Promise<void> {
  await page.evaluate(
    (s) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('optcg-sim');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(Object.keys(s), 'readwrite');
          for (const [store, rows] of Object.entries(s))
            for (const r of rows as { key?: string; value: unknown }[])
              if (r.key === undefined) tx.objectStore(store).put(r.value);
              else tx.objectStore(store).put(r.value, r.key);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    stores,
  );
}

async function withPlanted(page: Page, id: string, path: (id: string) => string): Promise<void> {
  const g = planted()[id]!;
  await page.goto('./reviews');
  await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible();
  await put(page, {
    games: [{ value: g }],
    summaries: [{ value: { id: g.id, meta: g.meta } }],
  });
  await page.goto(path(g.id));
}

const session = (id: string, n: number, correct: number, day: number, factor: number | null) => ({
  id,
  drill: 'counter',
  lesson: 'L10-counter-or-take',
  at: `2026-11-1${day}T10:00:00.000Z`,
  n,
  correct,
  shown: 0,
  factor,
  itemIds: Array.from({ length: n }, (_, i) => `c${i}`),
});

interface Screen {
  /** The file name (without extension): order, then what is on screen. */
  name: string;
  show: (page: Page) => Promise<void>;
}

const SCREENS: Screen[] = [
  // The PROMPT's five, first.
  {
    name: '01-board-explore',
    show: async (page) => {
      expect(await play(page, `scenario=late&${SCENARIO}`)).toBe('main');
    },
  },
  {
    name: '02-inspector',
    show: async (page) => {
      await page.goto('./cards?card=OP17-087');
      await expect(page.getByRole('dialog', { name: 'Nico Robin' })).toBeVisible();
    },
  },
  {
    name: '03-coach-lethal',
    show: async (page) => {
      expect(await play(page, `scenario=lethalDemo&${SCENARIO}`)).toBe('main');
      await page.keyboard.press('c');
      await expect(page.locator('.coach')).toHaveAttribute('data-mode', 'open');
      await page.locator('#coach-lethal').click();
      await expect(page.locator('.coach-result')).toBeVisible({ timeout: 30_000 });
    },
  },
  {
    name: '04-review-timeline',
    show: async (page) => {
      await withPlanted(page, 'missed-lethal', (id) => `./reviews/${id}`);
      await expect(page.getByTestId('review-status')).toContainText(/\d flags?/, {
        timeout: 45_000,
      });
    },
  },
  {
    name: '05-meta-tiles',
    show: async (page) => {
      await page.goto('./meta');
      await expect(page.getByRole('heading', { level: 1, name: 'Meta Explorer' })).toBeFocused();
    },
  },
  // The rest of the screens, in the order of the nav.
  {
    name: '06-meta-matchups',
    show: async (page) => {
      await page.goto('./meta/matchups');
      await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    },
  },
  {
    name: '07-board-defend',
    show: async (page) => {
      // The defend scenario: Player 2's 7000 attack on Player 1's 5000 Leader, one Counter staged.
      expect(await play(page, `scenario=defend&speed=step&opp=rookie&seed=7`)).toBe('main');
      await page.locator('[data-zone="my-row"].bc-leader').click();
      await page.locator('[data-zone="opp-row"].bc-leader').click();
      await page.locator('#confirm-attack').click();
      expect(await nextDecision(page)).toBe('block');
      await page.keyboard.down('r');
      await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
      await expect(page.getByTestId('defender-power')).toHaveText('6000');
    },
  },
  {
    name: '08-study',
    show: async (page) => {
      await withPlanted(page, 'missed-lethal', (id) => `./reviews/${id}`);
      await expect(page.getByTestId('review-status')).toContainText(/\d flags?/, {
        timeout: 45_000,
      });
      const flags = page.getByRole('listbox', { name: /^Flags/ });
      await flags.getByRole('option').first().click();
      await flags.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('study-rail')).toBeVisible();
    },
  },
  {
    name: '09-drill-mulligan',
    show: async (page) => {
      await page.goto('./drills/mulligan/run?source=bank&count=5&sid=e2e-visual');
      await expect(page.getByRole('heading', { level: 1, name: /Keep or redraw/ })).toBeFocused();
    },
  },
  {
    name: '10-rules-search',
    show: async (page) => {
      await page.goto('./rules');
      await page.getByRole('combobox', { name: 'Search the rules' }).fill('7-1-4-1');
      await expect(page.locator('#rules-status')).toHaveText(/\d+ results? for “7-1-4-1”\./);
    },
  },
  {
    name: '11-progress',
    show: async (page) => {
      await page.goto('./learn');
      await expect(page.getByRole('heading', { level: 1, name: 'Learn' })).toBeFocused();
      await put(page, {
        progress: [
          {
            key: 'v1',
            value: {
              v: 1,
              lessons: {},
              sessions: [
                session('a', 10, 5, 1, null),
                session('b', 10, 8, 2, null),
                { ...session('c', 10, 9, 3, 1), timedOk: 9 },
              ],
            },
          },
        ],
      });
      await page.goto('./progress');
      await expect(page.getByRole('heading', { level: 1, name: 'Progress' })).toBeFocused();
    },
  },
  {
    name: '12-builder',
    show: async (page) => {
      await page.goto('./decks');
      await page.getByRole('button', { name: 'New deck' }).click();
      await expect(page.locator('.builder')).toBeVisible({ timeout: 20_000 });
      await page.getByRole('button', { name: 'Import', exact: true }).click();
      await page.locator('#import-text').fill(ROCKS);
      await page.getByRole('button', { name: /^Import \d+ cards$/ }).click();
      await expect(page.locator('#import-text')).toHaveCount(0);
      await expect(page.getByLabel('Deck checks')).toContainText('50 cards (50)');
    },
  },
  {
    name: '13-about',
    show: async (page) => {
      await page.goto('./about');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    },
  },
  {
    name: '14-settings',
    show: async (page) => {
      await page.goto('./settings');
      await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
    },
  },
  {
    name: '15-home',
    show: async (page) => {
      await page.goto('./');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    },
  },
];

for (const screen of SCREENS)
  test(`screen ${screen.name}`, async ({ page }, info) => {
    const why = skipReason(info, screen.name);
    test.skip(why !== null, why ?? '');
    test.setTimeout(120_000);
    await prepare(page);
    await screen.show(page);
    await settle(page);
    // maxDiffPixelRatio, animations and caret come from playwright.config.ts.
    await expect(page).toHaveScreenshot(`${screen.name}.png`);
  });
