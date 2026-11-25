/**
 * M7 WP5: the blunder warning on a planted position (a lethal turn, End turn pressed) and the
 * minimal Settings page. Keyboard-complete, axe-clean, screenshots to `.cache/wp5/`.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';
import { timingRuns } from './idb-support.ts';

const GAME = 'scenario=lethalDemo&speed=4&opp=pirate&aibudget=iterations';

async function axe(page: Page, info: TestInfo, name: string) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: `.cache/wp5/${info.project.name}-${name}.png` });
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(
    r.violations.map(
      (v) => `${name}: ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

/** Seed the coach profile once per tab (a reload keeps what the page wrote). */
async function seed(
  page: Page,
  profile: Record<string, unknown>,
  extra: Record<string, string> = {},
) {
  await page.addInitScript(
    ([p, more]) => {
      try {
        if (!window.sessionStorage.getItem('wp5-seeded')) {
          window.localStorage.clear();
          window.localStorage.setItem('optcg.coach.v1', JSON.stringify(p));
          for (const [k, v] of Object.entries(more as Record<string, string>))
            window.localStorage.setItem(k, v);
          window.sessionStorage.setItem('wp5-seeded', '1');
        }
      } catch {
        /* blocked */
      }
    },
    [profile, extra] as const,
  );
}

test.describe('the blunder warning', () => {
  test('End turn with lethal on the board: held, "Commit anyway", a described note, once', async ({
    page,
  }, info) => {
    await seed(page, { blunder: true });
    await startGame(page, GAME);
    expect(await nextDecision(page)).toBe('main');
    // The analysis starts with the decision; give it its moment so the answer is ready at the press.
    await page.waitForTimeout(1500);
    const end = page.locator('#endturn-btn');
    await end.focus();
    await page.keyboard.press('Enter');
    const note = page.locator('.blunder-note');
    await expect(note).toBeVisible();
    await expect(note).toContainText(/lethal/i);
    await expect(end).toContainText('Commit anyway');
    // The note is the button's accessible description, and it is spoken politely.
    const describedBy = await end.getAttribute('aria-describedby');
    expect(describedBy ?? '').toContain('blunder-note');
    await expect(page.locator('#announce-polite')).toContainText(/Warning:/);
    await expect(page.locator('#announce-assertive')).toHaveText('');
    // Nothing moved focus to the coach, and the turn did not end.
    expect(
      await page.evaluate(() => !!document.activeElement?.closest('[aria-label="Coach"]')),
    ).toBe(false);
    expect(await page.locator('#decision').getAttribute('data-kind')).toBe('main');
    await axe(page, info, 'blunder-note');
    // "Commit anyway" commits, with no further check.
    await end.click();
    await expect(page.locator('.blunder-note')).toHaveCount(0);
    await expect
      .poll(async () => page.locator('#decision').getAttribute('data-kind'), { timeout: 15_000 })
      .not.toBe('main');
  });

  test('"Use the better choice" plays the lethal line instead', async ({ page }) => {
    await seed(page, { blunder: true });
    await startGame(page, GAME);
    await nextDecision(page);
    await page.waitForTimeout(1500);
    await page.locator('#endturn-btn').click();
    await expect(page.locator('.blunder-note')).toBeVisible();
    await page.getByRole('button', { name: 'Use the better choice' }).click();
    await expect(page.locator('.blunder-note')).toHaveCount(0);
    // The turn is still the player's: a line step was played, not End turn.
    await page.waitForTimeout(300);
    const kind = await page.locator('#decision').getAttribute('data-kind');
    expect(['main', 'block', 'counter', 'over', 'waiting']).toContain(kind);
  });

  test('"Don’t warn me about this" mutes the kind, and Settings lists it', async ({ page }) => {
    await seed(page, { blunder: true });
    await startGame(page, GAME);
    await nextDecision(page);
    await page.waitForTimeout(1500);
    await page.locator('#endturn-btn').click();
    await expect(page.locator('.blunder-note')).toBeVisible();
    await page.getByRole('button', { name: /Don’t warn me about this/ }).click();
    await expect(page.locator('.blunder-note')).toHaveCount(0);
    const stored = await page.evaluate(() => window.localStorage.getItem('optcg.coach.v1'));
    expect(JSON.parse(stored!).muted).toContain('missed-lethal');
    await page.goto('./settings');
    await expect(page.getByText('giving up a lethal turn', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Warn me again/ }).click();
    await expect(page.getByText(/None\./)).toBeVisible();
  });

  test('off by default: End turn just ends the turn', async ({ page }) => {
    await seed(page, {});
    await startGame(page, GAME);
    await nextDecision(page);
    await page.waitForTimeout(800);
    await page.locator('#endturn-btn').click();
    await expect(page.locator('.blunder-note')).toHaveCount(0);
    await expect
      .poll(async () => page.locator('#decision').getAttribute('data-kind'), { timeout: 15_000 })
      .not.toBe('main');
  });
});

const RUN = {
  schema: 'tutorial-timing/1',
  runId: 'abc123',
  appVersion: 'test',
  engineVersion: 'test',
  tutorialVersion: 'test',
  startedAt: '2026-11-20T10:00:00.000Z',
  settings: { reducedMotion: false, aiPace: '1', singleKeyShortcuts: true, cardAnnouncements: 'x' },
  steps: [
    {
      stepId: 't1-zones',
      enteredMs: 0,
      completedMs: 60000,
      activeMs: 60000,
      hiddenMs: 0,
      idleMs: 0,
      blockedAttempts: 1,
      hintsOpened: 0,
      explainOpened: 0,
      rewinds: 0,
      inputs: { pointer: 4, keyboard: 0 },
      exits: 0,
    },
  ],
  completedMs: null,
  totalActiveMs: 60000,
  totalWallMs: 61000,
};

test.describe('Settings', () => {
  test('the coach settings persist, are keyboard-operable and axe-clean', async ({
    page,
  }, info) => {
    await seed(page, {}, { 'optcg.tutorial.timing.v1': JSON.stringify([RUN]) });
    await page.goto('./settings');
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
    await axe(page, info, 'settings');
    // The blunder warning: a native checkbox, switched on with the keyboard.
    const blunder = page.getByLabel('Blunder warning');
    await blunder.focus();
    await page.keyboard.press('Space');
    await expect(blunder).toBeChecked();
    await expect(page.getByTestId('settings-status')).toHaveText('Blunder warning: on.');
    await page.getByLabel('Threat alerts').check();
    await page.getByLabel('Coach verbosity').selectOption('learner');
    await page.getByLabel('Lethal detector').selectOption('1');
    await page.reload();
    await expect(page.getByLabel('Blunder warning')).toBeChecked();
    await expect(page.getByLabel('Threat alerts')).toBeChecked();
    await expect(page.getByLabel('Coach verbosity')).toHaveValue('learner');
    await expect(page.getByLabel('Lethal detector')).toHaveValue('1');
    const p = JSON.parse(
      (await page.evaluate(() => window.localStorage.getItem('optcg.coach.v1')))!,
    );
    expect(p).toMatchObject({ blunder: true, alerts: true, verbosity: 'learner', alwaysOn: 1 });
  });

  test('tutorial timing: list, export JSON and CSV (no network), delete with a confirmation', async ({
    page,
  }) => {
    await seed(page, {}, { 'optcg.tutorial.timing.v1': JSON.stringify([RUN]) });
    const requests: string[] = [];
    page.on('request', (r) => {
      if (!r.url().startsWith('blob:') && !r.url().startsWith('data:')) requests.push(r.url());
    });
    await page.goto('./settings');
    await expect(page.getByText(/1 of 1 steps, 1 min active, not finished/)).toBeVisible();
    const before = requests.length;
    const [json] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Export JSON/ }).click(),
    ]);
    expect(json.suggestedFilename()).toBe('optcg-tutorial-timing-abc123.json');
    const body = JSON.parse(
      await (await import('node:fs/promises')).readFile((await json.path())!, 'utf8'),
    );
    expect(body.schema).toBe('tutorial-timing/1');
    const [csv] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Export CSV/ }).click(),
    ]);
    expect(csv.suggestedFilename()).toBe('optcg-tutorial-timing-abc123.csv');
    // Exporting sent nothing anywhere.
    expect(requests.length).toBe(before);
    await page.getByRole('button', { name: /^Delete the run/ }).click();
    await expect(page.getByRole('button', { name: /Delete for good/ })).toBeVisible();
    await page.getByRole('button', { name: 'Keep it' }).click();
    await expect(page.getByText(/1 of 1 steps/)).toBeVisible();
    await page.getByRole('button', { name: /^Delete the run/ }).click();
    await page.getByRole('button', { name: /Delete for good/ }).click();
    await expect(page.getByText('No tutorial runs are stored.')).toBeVisible();
    // The run lived in IndexedDB since the migration moved it; deleting it emptied that store, and
    // the old localStorage key is gone for good.
    expect(await timingRuns(page)).toEqual([]);
    expect(
      await page.evaluate(() => window.localStorage.getItem('optcg.tutorial.timing.v1')),
    ).toBeNull();
  });

  test('"Show the welcome question" brings the question back on Home', async ({ page }) => {
    await seed(page, {}, { 'optcg.welcome.v1': JSON.stringify('know-rules') });
    await page.goto('./');
    await expect(page.getByTestId('welcome')).toHaveCount(0);
    await page.goto('./settings');
    await page.getByRole('button', { name: 'Show the welcome question' }).click();
    await expect(page.getByTestId('settings-status')).toHaveText(/welcome question will show/);
    await page.goto('./');
    await expect(page.getByTestId('welcome')).toBeVisible();
  });
});
