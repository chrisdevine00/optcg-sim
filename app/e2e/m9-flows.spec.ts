/**
 * M9 WP8: the flows the PROMPT's "every drill" line asks for that the sibling specs do not walk.
 * Keyboard-only mulligan with nothing pre-selected and no answer spoken before the choice; the lethal
 * puzzle's Submit turn and "No lethal"; a Counter staged and committed; DON!! board play; a puzzle
 * from a planted review ("From your game, turn 9") with the harder-hand header on the any-hand one and
 * "Their real hand: one way to see it" on the Hindsight one; Play this matchup starting a game; the
 * rules search "7-1-4-1" through Show me and Esc; progress that survives export and import into a
 * fresh profile; and the tutorial's rule citation opening the rules entry in a new tab.
 *
 * Screenshots go to `.cache/m9/` (saved and read by the review), axe runs on every screen.
 */
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { nextDecision, serveArt, startGame } from './game-support.ts';
import { axe, noArt, shot } from './m9-support.ts';
import { load, planted, status } from './review-m8-support.ts';

const verdict = (page: Page) =>
  page.getByRole('heading', { level: 1, name: /^[✓✗◌]?\s*(Correct|Not this time|Answer shown)/ });
const nextBtn = (page: Page) => page.getByRole('button', { name: /^(Next|See summary)/ });

/** Tab until `test` holds for what has focus; fails loudly rather than clicking for the user. */
async function tabTo(page: Page, name: RegExp, max = 40) {
  for (let i = 0; i < max; i++) {
    const f = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return (el?.getAttribute('aria-label') ?? el?.innerText ?? '').trim();
    });
    if (name.test(f)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Tab never reached ${name}`);
}

// ---------------------------------------------------------------------------------------------
// Drills
// ---------------------------------------------------------------------------------------------

test('mulligan with the keyboard only: Tab to Keep then Redraw, nothing chosen for you, Enter, Next, summary', async ({
  page,
}, info) => {
  await noArt(page);
  await page.goto('drills/mulligan/run?source=bank&count=5&sid=e2e-m2');
  const h1 = page.getByRole('heading', { level: 1, name: /Keep or redraw/ });
  await expect(h1).toBeFocused();
  const live = page.getByTestId('drill-live');
  // Nothing about the answer is spoken, shown or focused before the choice.
  await expect(live).not.toContainText(/Correct|Not this time|guide says/i);
  await expect(page.getByText(/The guide says/)).toHaveCount(0);

  // Tab: Keep first, then Redraw. Neither is checked, pressed or pre-focused.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /^Keep/ })).toBeFocused();
  await expect(page.getByRole('button', { name: /^Keep/ })).not.toHaveAttribute(
    'aria-pressed',
    /.+/,
  );
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /^Redraw/ })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: /^Keep/ })).toBeFocused();
  await expect(live).not.toContainText(/Correct|Not this time/);

  // Item 1: Enter on Keep.
  await page.keyboard.press('Enter');
  await expect(verdict(page)).toBeFocused();
  const spoken = (await live.innerText()).trim();
  expect(spoken).toMatch(/^(Correct|Not this time)/);
  await expect(page.locator('.drill-answer-line').first()).toContainText(/Keep|Redraw/);
  await shot(page, info, 'mulligan-answer-keyboard');
  await tabTo(page, /^(Next|See summary)/);
  await page.keyboard.press('Enter');

  // Item 2: Tab, Tab, Space on Redraw.
  await expect(page.getByRole('heading', { level: 1, name: /Keep or redraw/ })).toBeFocused();
  await expect(page.getByTestId('drill-progress')).toContainText('Item 2 of 5');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /^Redraw/ })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(verdict(page)).toBeFocused();
  await tabTo(page, /^(Next|See summary)/);
  await page.keyboard.press('Enter');

  // Item 3: K, the shortcut that works only while focus is on the two buttons.
  await expect(page.getByTestId('drill-progress')).toContainText('Item 3 of 5');
  await page.keyboard.press('k');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
  await expect(page.getByRole('heading', { level: 1, name: /Keep or redraw/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('k');
  await expect(verdict(page)).toBeFocused();
  await tabTo(page, /^Next/);
  await page.keyboard.press('Enter');
  // Items 4 and 5: Redraw by R, then Keep by Enter.
  await expect(page.getByTestId('drill-progress')).toContainText('Item 4 of 5');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('r');
  await expect(verdict(page)).toBeFocused();
  await tabTo(page, /^Next/);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('drill-progress')).toContainText('Item 5 of 5');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(verdict(page)).toBeFocused();
  await tabTo(page, /^See summary/);
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Mulligan trainer: summary' }),
  ).toBeFocused();
  await expect(page.getByTestId('drill-score')).toContainText(/\d of 5/);
  await axe(page, info, 'mulligan-summary-keyboard');
});

test('lethal: Submit turn is judged, N declares No lethal, both end in an answer', async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  await noArt(page);
  await page.goto('drills/lethal/run?source=bank&count=5&sid=e2e-l2');
  const submit = page.getByRole('button', { name: /Submit turn/ });
  await expect(submit).toBeVisible({ timeout: 30_000 });
  // The header names counts and a bound, never a card.
  await expect(page.getByTestId('drill-slot')).toContainText(
    /cards? in their hand, up to \+\d+ each|no cards in their hand/,
  );
  await shot(page, info, 'lethal-item-board');
  await submit.click();
  await expect(verdict(page)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.drill-answer-line').first()).toBeVisible();
  await shot(page, info, 'lethal-answer-submit');
  await nextBtn(page).click();

  // N, the key the button names, declares "No lethal" when focus is not in a field.
  await expect(page.getByRole('button', { name: /^No lethal/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('drill-progress')).toContainText('Item 2 of 5');
  await page.getByRole('button', { name: /^No lethal/ }).focus();
  await page.keyboard.press('n');
  await expect(verdict(page)).toBeVisible({ timeout: 30_000 });
  await axe(page, info, 'lethal-answer-no-lethal');
});

test('counter or take it: a Counter staged, the live maths, then committed as one move', async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  await noArt(page);
  // sid e2e-c2: the first item is a should-counter item, where staging stops the attack (the bank's
  // seeded order moved when EB02-010 and OP18-021 joined it, M11 Track C; e2e-c1 now opens a take item).
  await page.goto('drills/counter/run?source=bank&count=10&sid=e2e-c2');
  await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'counter', {
    timeout: 45_000,
  });
  const counters = page.locator('[data-zone="hand"][data-glyph="play"]');
  expect(await counters.count()).toBeGreaterThan(0);
  const before = await page.getByTestId('defender-power').innerText();
  await counters.first().click();
  // The maths follows the staged card; nothing was sent yet (still this item, still no answer).
  await expect(page.getByTestId('defender-power')).not.toHaveText(before);
  const commit = page.locator('#commit-defence');
  await expect(commit).toContainText(/Counter \+\d+/);
  await expect(page.locator('#take-hit')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: /Correct|Not this time/ })).toHaveCount(
    0,
  );
  await axe(page, info, 'counter-staged');
  await commit.click();
  // The Counter goes in as one move; the rest of their turn may owe more decisions (more attacks to
  // take, a Life card to add to the hand) until the judge decides.
  await expect(async () => {
    if (await verdict(page).isVisible()) return;
    const take = page.getByRole('button', { name: /^Take the hit/ });
    const primary = page
      .getByRole('application', { name: 'Decision actions' })
      .getByRole('button', { disabled: false })
      .last();
    if (await take.isVisible()) await take.click();
    else if (await primary.isVisible()) await primary.click();
    await expect(verdict(page)).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 90_000 });
  await expect(page.locator('.drill-answer-line').first()).toBeVisible();
  await shot(page, info, 'counter-committed-answer');
});

test('DON!!: the board played by keys (a Leader given DON!!), then Submit turn is judged', async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  await noArt(page);
  await page.goto('drills/don/run?source=bank&count=5&sid=e2e-d2');
  await expect(page.getByRole('button', { name: /Submit turn/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Choose a line' })).toBeVisible();
  await page.keyboard.press('g');
  await page.keyboard.press('l');
  for (let i = 0; i < 12; i++) {
    const cls = await page.evaluate(() => document.activeElement?.className ?? '');
    if (String(cls).includes('bc-leader')) break;
    await page.keyboard.press('ArrowRight');
  }
  await page.keyboard.press('+');
  await expect(page.getByRole('dialog', { name: /Give DON!!/ })).toBeVisible();
  await shot(page, info, 'don-give-dialog');
  await page.keyboard.press('1');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: /Give DON!!/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Submit turn/ }).click();
  await expect(async () => {
    if (await verdict(page).isVisible()) return;
    const order = page.getByRole('button', { name: /resolve|first/i }).first();
    if (await order.isVisible()) await order.click();
    await expect(verdict(page)).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 60_000 });
  await expect(page.locator('.drill-answer-line').first()).toBeVisible();
});

// ---------------------------------------------------------------------------------------------
// From a game: the planted reviews
// ---------------------------------------------------------------------------------------------

test.describe('a puzzle from a planted review', () => {
  test('any-hand missed lethal: "From your game, turn 9" with their harder hand, and the answer', async ({
    page,
  }, info) => {
    test.setTimeout(180_000);
    await noArt(page);
    const g = planted()['missed-lethal']!;
    await load(page, [g], `./reviews/${g.id}`);
    // The review is computed once and stored; the drills read the stored flags.
    await expect(status(page)).toHaveText(/^1 flag · 1 severe$/, { timeout: 60_000 });

    // Practice from the review: the harder hand in counts only, no "real hand" label.
    await page
      .getByRole('listbox', { name: /^Flags/ })
      .getByRole('option')
      .first()
      .click();
    await page.locator('#practice-btn').click();
    await expect(page.getByTestId('practice-header')).toHaveText(
      'Their hand is the strongest the guide allows: 2 cards, up to +2000 each.',
      { timeout: 30_000 },
    );
    await expect(page.getByTestId('hand-label')).toHaveCount(0);
    await shot(page, info, 'practice-harder-hand');

    // The same flag as a lethal puzzle in the drills.
    await page.goto('drills/lethal/run?source=mine&count=5&sid=e2e-f1');
    await expect(page.getByTestId('drill-progress')).toContainText('From your game, turn 9', {
      timeout: 45_000,
    });
    await expect(page.getByTestId('drill-slot')).toContainText(
      /2 cards in their hand, up to \+2000 each/,
    );
    await expect(page.getByTestId('hand-label')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Submit turn/ })).toBeVisible();
    await shot(page, info, 'flag-lethal-item');
    // Their real hand is never on the screen: the item reads only what the player could see.
    await page.getByRole('button', { name: 'Show answer' }).click();
    await expect(verdict(page)).toBeVisible();
    await expect(page.getByTestId('hand-label')).toHaveCount(0);
    await axe(page, info, 'flag-lethal-answer');
  });

  test('Hindsight: the real hand is kept and says so, on the board and on the answer', async ({
    page,
  }, info) => {
    test.setTimeout(180_000);
    await noArt(page);
    const g = planted().hindsight!;
    await load(page, [g], `./reviews/${g.id}`);
    await expect(status(page)).toHaveText(/^1 flag$/, { timeout: 60_000 });
    const option = page
      .getByRole('listbox', { name: /^Flags/ })
      .getByRole('option')
      .first();
    await expect(option).toContainText('Hindsight: needed their hidden cards');
    await option.click();
    await page.locator('#practice-btn').click();
    const label = page.getByTestId('hand-label');
    await expect(label).toHaveText(/Their real hand: one way to see it/, { timeout: 30_000 });
    await expect(page.getByTestId('practice-header')).toHaveCount(0);
    await shot(page, info, 'practice-hindsight-label');

    // The drills carry the same item, with the label on its answer screen.
    await page.goto('drills/counter/run?source=mine&count=5&sid=e2e-f2');
    await expect(page.getByTestId('drill-progress')).toContainText('From your game, turn 9', {
      timeout: 45_000,
    });
    await page.getByRole('button', { name: 'Show answer' }).click();
    await expect(verdict(page)).toBeVisible();
    await expect(page.getByTestId('hand-label')).toHaveText(/Their real hand: one way to see it/);
    await axe(page, info, 'flag-hindsight-answer');
  });
});

// ---------------------------------------------------------------------------------------------
// Meta, rules, tutorial
// ---------------------------------------------------------------------------------------------

test('Play this matchup opens the setup with both decks and starts the game', async ({
  page,
}, info) => {
  await serveArt(page);
  await page.goto('meta/matchups');
  await expect(page.getByRole('heading', { level: 1, name: 'Matchup grid' })).toBeFocused();
  await page.locator('[data-cell="0-1"]').focus();
  await page.keyboard.press('Enter');
  await page.getByRole('link', { name: 'Play this matchup' }).click();
  await expect(page).toHaveURL(/\/play\?p1=OP17-039-rocks%231&p2=OP09-062-nico-robin%231$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('50 cards · Nico Robin · source decklist')).toBeVisible();
  await axe(page, info, 'matchup-setup');
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.locator('#decision')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('main')).toBeVisible();
});

test('rules: search 7-1-4-1, the entry, Show me to the end, Esc back to the rule', async ({
  page,
}, info) => {
  test.setTimeout(120_000);
  await noArt(page);
  await page.goto('rules');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await axe(page, info, 'rules-home');
  const q = page.getByRole('combobox', { name: 'Search the rules' });
  await q.fill('7-1-4-1');
  await expect(page.locator('#rules-status')).toHaveText(/\d+ results? for “7-1-4-1”\./);
  await shot(page, info, 'rules-search');
  await q.press('Enter');
  await expect(page).toHaveURL(/\/rules\/cr\/7-1-4-1$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await axe(page, info, 'rules-entry');

  const show = page.getByRole('link', { name: /^Show me/ }).first();
  await show.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/rules\/battle-tie\/show/);
  const card = page.getByTestId('show-card');
  await expect(card).toContainText('A tie goes to the attacker');
  await expect(page.locator('#decision')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#show-text')).toBeFocused({ timeout: 5000 });
  await axe(page, info, 'show-me');

  // Their Elmy is rested: attack it with the Leader by keys, as the card says.
  await page.keyboard.press('g');
  await page.keyboard.press('l');
  for (let i = 0; i < 10; i++) {
    if (
      String(await page.evaluate(() => document.activeElement?.className ?? '')).includes(
        'bc-leader',
      )
    )
      break;
    await page.keyboard.press('ArrowRight');
  }
  await page.keyboard.press('a');
  // Target mode puts focus on the one legal target, their rested Elmy; Enter picks it, then confirms.
  await expect
    .poll(() =>
      page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.zone ?? ''),
    )
    .toBe('opp-chars');
  await page.keyboard.press('Enter');
  await expect(page.locator('#confirm-attack')).toBeVisible();
  await page.locator('#confirm-attack').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('show-done')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('show-done')).toContainText('Elmy is K.O.');
  await axe(page, info, 'show-me-done');

  // Esc goes back to the rule, focus on "Show me".
  await page.locator('body').press('Escape');
  await expect(page).toHaveURL(/\/rules\/cr\/7-1-4-1/);
  await expect(page.locator('#rule-show-link')).toBeFocused();
});

test('the tutorial card cites its rule and the link opens the rules entry in a new tab', async ({
  page,
  context,
}, info) => {
  await serveArt(page);
  await page.goto('tutorial?restart=1');
  await expect(page.getByTestId('tutorial-card')).toBeVisible({ timeout: 20_000 });
  const cite = page.getByRole('link', { name: /^Rule: CR 3-1-1/ });
  await expect(cite).toHaveAttribute('target', '_blank');
  await expect(cite).toContainText('(opens in a new tab)');
  const [tab] = await Promise.all([context.waitForEvent('page'), cite.click()]);
  await tab.waitForLoadState();
  await expect(tab).toHaveURL(/\/rules\/cr\/3-1-1$/);
  await expect(tab.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(tab.getByText('CR 3-1-1').first()).toBeVisible();
  // The tutorial is where it was.
  await expect(page).toHaveURL(/\/tutorial/);
  await expect(page.getByTestId('tutorial-card')).toHaveAttribute('data-step', 't1-zones');
  await shot(tab, info, 'rules-from-tutorial');
  await tab.close();
});

// ---------------------------------------------------------------------------------------------
// Progress: two sessions, a recommendation, export and import into a fresh profile
// ---------------------------------------------------------------------------------------------

async function mulliganSession(page: Page, sid: string) {
  await page.goto(`drills/mulligan/run?source=bank&count=5&sid=${sid}`);
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: /^Keep/ }).click();
    await nextBtn(page).click();
  }
  await expect(
    page.getByRole('heading', { level: 1, name: 'Mulligan trainer: summary' }),
  ).toBeFocused();
}

test('progress after two sessions names a lesson; exported and imported into a fresh profile it is the same', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(180_000);
  await noArt(page);
  await mulliganSession(page, 'e2e-p1');
  await mulliganSession(page, 'e2e-p2');
  await page.goto('progress');
  await expect(page.getByRole('heading', { level: 1, name: 'Progress' })).toBeFocused();
  const work = page.getByRole('heading', { level: 2, name: /^Work on: / });
  await expect(work).toBeVisible();
  const said = await work.innerText();
  await expect(page.getByRole('link', { name: /^Start lesson L\d+/ })).toBeVisible();
  await page.getByText('Mulligan trainer sessions as a table').click();
  const rows = page.getByRole('table', { name: /Mulligan trainer/ }).getByRole('row');
  const sessions = (await rows.count()) - 1;
  expect(sessions).toBe(2);
  await axe(page, info, 'progress-two-sessions', true);

  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export progress only' }).click(),
  ]);
  const file = (await dl.path())!;
  const body = JSON.parse(readFileSync(file, 'utf8')) as {
    progress: { v1: { sessions: unknown[] } };
  };
  expect(body.progress.v1.sessions).toHaveLength(2);

  // A fresh profile knows nothing; importing the file restores the page.
  const use = info.project.use;
  const fresh = await browser.newContext({
    baseURL: use.baseURL as string,
    viewport: use.viewport ?? { width: 1280, height: 720 },
    serviceWorkers: 'block',
  });
  const p2 = await fresh.newPage();
  await noArt(p2);
  try {
    await p2.goto('progress');
    await expect(p2.getByRole('heading', { level: 1, name: 'Progress' })).toBeFocused();
    await expect(p2.getByText('No Mulligan trainer sessions yet.')).toBeVisible();
    await p2.goto('settings');
    await p2.getByLabel('Import a file').setInputFiles(file);
    await expect(p2.getByTestId('settings-status')).toContainText(/Imported|progress/i);
    await p2.goto('progress');
    await expect(p2.getByRole('heading', { level: 1, name: 'Progress' })).toBeFocused();
    await expect(p2.getByRole('heading', { level: 2, name: /^Work on: / })).toHaveText(said);
    await p2.getByText('Mulligan trainer sessions as a table').click();
    await expect(p2.getByRole('table', { name: /Mulligan trainer/ }).getByRole('row')).toHaveCount(
      sessions + 1,
    );
    await p2.reload();
    await expect(p2.getByRole('heading', { level: 2, name: /^Work on: / })).toHaveText(said);
  } finally {
    await fresh.close();
  }
});

// The tutorial-keyboard flake (two packages saw it under load): the board's key handler is
// re-subscribed after a render, so "G" then "H" arriving before that render lost the "H". Both keys
// are dispatched in one task here, which is the worst case of any load.
test('G then H in the same task still reaches the hand (no race with the render)', async ({
  page,
}) => {
  await startGame(page, 'scenario=full&speed=4');
  expect(await nextDecision(page)).toBe('main');
  await page.evaluate(() => {
    for (const key of ['g', 'h'])
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });
  await expect(page.locator('[data-zone="hand"]:focus')).toHaveCount(1);
});
