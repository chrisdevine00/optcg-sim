/**
 * The M9 screen-reader script (accessibility.md §11.8): the learning layer's new screens. M1 the
 * matchup grid as a table, D1 the mulligan item (no answer before the choice), D2 the drill timer's
 * pause and its 10-second warning, R1 the rules search's result count, P1 the Progress page's
 * recommendation card.
 *
 * Same method as m8.ts: keys go through the reader; where the keyboard path does not reach the place
 * a step needs, the harness moves focus itself and records an "assist". The verdicts are written by a
 * person (or a subagent) comparing each step's log with its Expect column.
 */
import type { Focus, Pass } from './pass.ts';

/** The first page: the matchup grid. The other steps load their own. */
export const M9_URL = 'meta/matchups';

const MULLIGAN = 'drills/mulligan/run?source=bank&count=5&sid=a11y-m9';
/** Counter or take it at 50%: 15 s an item, so the 10-second warning comes after 5 s (the mulligan's 10 s base never reaches it). */
const TIMED = 'drills/counter/run?source=bank&count=5&sid=a11y-m9&timer=50';

const live = async (p: Pass) =>
  (
    (await p.page
      .getByTestId('drill-live')
      .textContent({ timeout: 1000 })
      .catch(() => '')) ?? ''
  ).trim();

export async function runM9(p: Pass) {
  const page = p.page;
  const origin = new URL(page.url()).href.replace(/meta\/.*$|[^/]*$/, '');
  const go = async (path: string) => {
    await page.goto(new URL(path, origin).href);
    await page.waitForTimeout(1200);
    await p.focusPage(`after loading ${path}`);
  };

  // M1 -----------------------------------------------------------------------------------------
  await p.step(
    'M1',
    'The matchup grid as a table',
    'Load the matchup grid; Tab to the table; Right along the first row to the Kaido column; Down; Enter; Escape',
    'The heading "Matchup grid" has focus; the grid is a table with row and column headers; the cell for Rocks against Kaido is read "Rocks against Kaido: plan available, inference" (what the sources say, never colour alone); Enter opens a dialog that names the matchup and Escape returns focus to the same cell',
    async () => {
      await go(M9_URL);
      p.note(`Focus on load: ${(await p.focus()).aria}`);
      const cell = (f: Focus) => /^Rocks against /.test(f.name);
      if (!(await p.until('Tab', cell, 40)))
        await p.assist('Tab did not reach a grid cell', '[data-cell="0-0"]');
      const kaido = (f: Focus) => /^Rocks against Kaido/.test(f.name);
      const hit = await p.until('ArrowRight', kaido, 14);
      p.note(`The cell: ${(await p.focus()).aria}`);
      await p.reached('the Rocks against Kaido cell read with its status', !!hit);
      await p.press('ArrowDown');
      await p.press('ArrowUp');
      await p.press('Enter');
      await page.getByRole('dialog').waitFor({ timeout: 5000 });
      p.note(`The dialog: ${(await p.focus()).aria}`);
      await p.press('Escape');
      const f = await p.focus();
      p.note(`After Escape: ${f.aria}`);
      await p.reached('focus back on the Kaido cell', kaido(f));
    },
  );

  // D1 -----------------------------------------------------------------------------------------
  await p.step(
    'D1',
    'The mulligan item: no answer before the choice',
    'Load the mulligan drill; read the heading; Tab to Keep, Tab to Redraw, Shift+Tab; Enter on Keep',
    'Focus is on the heading, which reads the seat and the hand; no answer, no hint and no "correct" is spoken or shown before the choice; Keep and Redraw are two buttons of equal weight, neither pressed; after Enter the answer heading ("Correct" or "Not this time") has focus and the polite region says what the guide says, once',
    async () => {
      await go(MULLIGAN);
      const f0 = await p.focus();
      p.note(`Focus on load: ${f0.aria}`);
      const before = await live(p);
      p.note(`Polite region before the choice: "${before}"`);
      await p.reached('the heading has focus', /Keep or redraw/.test(f0.name));
      await p.reached(
        'nothing of the answer before the choice',
        !/Correct|Not this time/.test(before),
      );
      await p.press('Tab');
      await p.press('Tab');
      await p.press('Shift+Tab');
      p.note(`Back on: ${(await p.focus()).aria}`);
      await p.press('Enter');
      await page.waitForTimeout(800);
      const f1 = await p.focus();
      const said = await live(p);
      p.note(`Focus after the choice: ${f1.aria}`);
      p.note(`Polite region after the choice: "${said}"`);
      await p.reached('the answer heading has focus', /Correct|Not this time/.test(f1.name));
      await p.reached('the answer spoken once, politely', /^(Correct|Not this time)/.test(said));
    },
  );

  // D2 -----------------------------------------------------------------------------------------
  await p.step(
    'D2',
    'The drill timer: Pause, Resume, and the 10-second warning',
    'Load the counter drill at 50%; Tab to Pause; Enter; Enter again; wait for the warning',
    'The timer is a button named Pause (Resume once paused, with the state in its name, never colour alone); pausing stops the count; a polite "10 seconds left." is spoken once when ten seconds remain, and nothing is assertive; the timer never answers for you',
    async () => {
      await go(TIMED);
      // Everything the polite region writes, so a later "Over time" cannot hide the warning.
      await page.evaluate(() => {
        const heard: string[] = [];
        (window as unknown as { __m9Heard: string[] }).__m9Heard = heard;
        new MutationObserver(() => {
          const t = document.querySelector('[data-testid="drill-live"]')?.textContent?.trim();
          if (t && heard[heard.length - 1] !== t) heard.push(t);
        }).observe(document.body, { subtree: true, childList: true, characterData: true });
      });
      const pause = (f: Focus) => /^Pause/.test(f.name);
      if (!(await p.until('Tab', pause, 80)))
        await p.assist('Tab did not reach Pause', 'button:has-text("Pause")');
      p.note(`The timer button: ${(await p.focus()).aria}`);
      await p.press('Enter');
      const paused = await p.focus();
      p.note(`After Enter: ${paused.aria}`);
      await p.reached('the button now says Resume', /^Resume/.test(paused.name));
      await p.press('Enter');
      p.note(`After the second Enter: ${(await p.focus()).aria}`);
      await page
        .waitForFunction(
          () =>
            (window as unknown as { __m9Heard?: string[] }).__m9Heard?.some((h) =>
              /10 seconds left/.test(h),
            ),
          undefined,
          { timeout: 60_000 },
        )
        .catch(() => undefined);
      const heard = await page.evaluate(
        () => (window as unknown as { __m9Heard?: string[] }).__m9Heard ?? [],
      );
      p.note(`Spoken by the polite region: ${heard.map((h) => `"${h}"`).join(' | ')}`);
      await p.reached(
        'the 10-second warning was spoken once',
        heard.filter((h) => /10 seconds left/.test(h)).length === 1,
      );
    },
  );

  // R1 -----------------------------------------------------------------------------------------
  await p.step(
    'R1',
    'The rules search: the result count',
    'Load the rules reference; Tab to the search; type "tie"; arrows; Escape',
    'The search is a combobox ("Search the rules"); typing says the count politely ("n results for “tie”."); Down moves through the results and each is read with its title and kind; Escape clears the query',
    async () => {
      await go('rules');
      p.note(`Focus on load: ${(await p.focus()).aria}`);
      const box = (f: Focus) => /Search the rules/.test(f.aria);
      if (!(await p.until('Tab', box, 20)))
        await p.assist('Tab did not reach the search', '#rules-q');
      p.note(`The search: ${(await p.focus()).aria}`);
      await p.page.keyboard.type('tie', { delay: 120 });
      await page.waitForTimeout(1000);
      const said = (await page.locator('#rules-status').textContent()) ?? '';
      p.note(`The status line: "${said}"`);
      await p.reached('the result count is spoken', /^\d+ results? for “tie”\./.test(said));
      p.note(`Down: ${(await p.press('ArrowDown')).aria}`);
      await p.press('Escape');
      const cleared = await page.locator('#rules-q').inputValue();
      await p.reached('Escape clears the query', cleared === '');
    },
  );

  // P1 -----------------------------------------------------------------------------------------
  await p.step(
    'P1',
    'Progress: the recommendation card',
    'Load Progress; read the page; Tab to the first link in the card',
    'The heading "Progress" has focus; the recommendation card has its own heading ("Work on: …", or "Not enough games yet" with the next lesson), says what it is built from in numbers, and offers one link named "Start lesson Lnn"; the chart is followed by its table',
    async () => {
      await go('progress');
      const f0 = await p.focus();
      p.note(`Focus on load: ${f0.aria}`);
      await p.reached('the heading has focus', f0.name === 'Progress');
      const card = page.locator('.pg-card').first();
      p.note(`The card: ${((await card.innerText()) || '').replace(/\s+/g, ' ').slice(0, 300)}`);
      const start = (f: Focus) => /^Start lesson L\d+/.test(f.name);
      if (!(await p.until('Tab', start, 20)))
        await p.assist('Tab did not reach "Start lesson"', 'a:has-text("Start lesson")');
      const f1 = await p.focus();
      p.note(`The link: ${f1.aria}`);
      await p.reached('the card names a lesson', start(f1));
    },
  );
}
