/**
 * The M8 screen-reader script (accessibility.md §11.6): the review of a finished game. A game is
 * finished the way learning.spec.ts finishes the planted missed-lethal game (scenario `lethalDemo`,
 * concede through the Game menu); the game saves itself, and the script then opens "Review this
 * game" and walks the review: the progress and "Review ready" announcements, the turn timeline's
 * two rows and `N`, the flag list and Study (Escape returns to the same flag), History and its
 * row sentence, and Practice, where the review must say nothing while the board is live.
 *
 * Same method as l.ts: keys go through the reader; where the keyboard path does not reach the
 * place a step needs, the harness moves focus itself and records an "assist". The verdicts are
 * written by a person (or a subagent) comparing each step's log with its Expect column.
 */
import type { Focus, Pass } from './pass.ts';
import { named } from './m3.ts';

/** The planted missed-lethal game (scenarios.ts `lethalDemo`), as learning.spec.ts plays it. */
export const M8_URL = 'play?scenario=lethalDemo&speed=step&opp=pirate&aibudget=iterations&start=1';

/** What the review says in its own words; none of it may be spoken while a board is live. */
const REVIEW_WORDS = /Analysing turn|Review ready|Review\. \d/;

const polite = async (p: Pass) =>
  (await p.page
    .locator('#announce-polite')
    .textContent({ timeout: 1000 })
    .catch(() => '')) ?? '';

const reviewSaid = async (p: Pass) =>
  (await p.page
    .getByTestId('review-announce')
    .textContent({ timeout: 1000 })
    .catch(() => '')) ?? '';

const isListbox = (f: Focus) => /^listbox/.test(f.aria);

export async function runM8(p: Pass) {
  const page = p.page;
  const origin = new URL(page.url()).href.replace(/[^/]*$/, '');
  let reviewed = false;

  // R1 -----------------------------------------------------------------------------------------
  await p.step(
    'R1',
    'Finish a game and open its review',
    'Load the planted missed-lethal game; Game menu, Concede, Concede; Tab to "Review this game"; Enter',
    'The review opens with focus on its heading "Game review"; a polite "Review. Analysing turn n of N." (once per turn, never twice), then "Review ready: 1 flag."; the status line reads "1 flag · 1 severe"',
    async () => {
      await page.goto(new URL(M8_URL, origin).href);
      await page.locator('#decision').waitFor({ timeout: 30_000 });
      await page.waitForTimeout(1500);
      await p.focusPage('after loading the game');
      await p.assist(
        'harness focuses the Game menu button (a user Tabs to it)',
        'button[aria-label="Game menu"]',
      );
      await p.press('Enter');
      if (!(await p.until('ArrowDown', named(/^Concede/), 8)))
        await p.assist('the Concede item was not reached', '[role="menuitem"]:has-text("Concede")');
      await p.press('Enter');
      // "Keep playing" has focus in the dialog and "Concede" comes before it: Shift+Tab.
      if (!(await p.until('Shift+Tab', (f) => f.name === 'Concede', 3)))
        await p.assist(
          'the Concede button was not reached',
          'dialog button:has-text("Concede"), [role="dialog"] button:has-text("Concede")',
        );
      await p.press('Enter');
      await page.locator('#decision[data-kind="over"]').waitFor({ timeout: 15_000 });
      if (!(await p.until('Tab', (f) => f.id === 'review-btn', 14)))
        await p.assist('Tab did not reach "Review this game"', '#review-btn');
      await p.press('Enter');
      await page
        .getByTestId('review-status')
        .filter({ hasText: /1 flag/ })
        .waitFor({ timeout: 45_000 });
      await page.waitForTimeout(800);
      reviewed = true;
      p.note(`Status: ${(await page.getByTestId('review-status').textContent()) ?? ''}`);
      p.note(`The review's own live region: "${await reviewSaid(p)}"`);
      const f = await p.focus();
      p.note(`Focus after the review opened: ${f.aria}`);
      await p.reached('focus on the review heading', f.id === 'rv-title');
    },
  );

  // R2 -----------------------------------------------------------------------------------------
  await p.step(
    'R2',
    'The turn timeline: two rows, and N',
    'Tab to the timeline; Left, Right, Down, Up, Home, End; N',
    'One tab stop for the timeline (an application region); each cell is read as "Turn 9, your turn: missed lethal, severe, holds whatever they held."; Down and Up move between "You" and the opponent\'s notable moves; N says "Flag 1 of 1 selected." and the flag\'s sentence, politely',
    async () => {
      if (!(await p.reached('the review (R2)', reviewed))) return 'not reached';
      if (!(await p.until('Tab', (f) => /^(Turn \d|Mulligan)/.test(f.name), 14)))
        await p.assist('Tab did not reach the timeline', '[data-cell][tabindex="0"]');
      p.note(`On the timeline: ${(await p.focus()).aria}`);
      for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Home', 'End']) {
        const f = await p.press(k);
        p.note(`${k}: ${f.aria}`);
      }
      await p.press('n');
      await page.waitForTimeout(500);
      const said = await reviewSaid(p);
      p.note(`After N the review said: "${said}"`);
      await p.reached('the N announcement', /Flag 1 of 1 selected/.test(said));
    },
  );

  // R3 -----------------------------------------------------------------------------------------
  await p.step(
    'R3',
    'The flag list, Study, Escape',
    'Tab to the Flags list; Enter; read the rail; Escape',
    'The list is one listbox and one tab stop: its option reads turn, kind, severity, certainty; Enter opens Study (the board restored read-only, the explanation in the rail); Escape returns to the Overview with focus on the same flag list',
    async () => {
      if (!(await p.reached('the review (R3)', reviewed))) return 'not reached';
      if (!(await p.until('Tab', isListbox, 14)))
        await p.assist('Tab did not reach the Flags list', '[role="listbox"]');
      p.note(`The list: ${(await p.focus()).aria}`);
      await p.press('Enter');
      await page.getByTestId('study-rail').waitFor({ timeout: 15_000 });
      await page.waitForTimeout(600);
      p.note(`Focus after Study opens: ${(await p.focus()).aria}`);
      p.note(
        `Study rail: ${(await page.getByTestId('study-rail').innerText()).replace(/\s+/g, ' ').slice(0, 400)}`,
      );
      await p.press('Escape');
      await page.waitForTimeout(500);
      const f = await p.focus();
      p.note(`After Escape, focus: ${f.aria}`);
      await p.reached('focus back on the flag list', isListbox(f));
    },
  );

  // R4 -----------------------------------------------------------------------------------------
  await p.step(
    'R4',
    'History: the row sentence, Enter, and the same review from the store',
    'Shift+Tab to the "Reviews" link in the main navigation; Enter; Tab to the game\'s Review link; Enter',
    'History is a table; the game\'s link is read as one sentence ("Lost to …, Rookie, …, 9 turns, 1 severe flag. Review."); Enter opens the review from the store; a polite "Review. 1 flag." (no progress: the review is whole)',
    async () => {
      if (!(await p.reached('the review (R4)', reviewed))) return 'not reached';
      // The main navigation's "Reviews" link is the way to History from a review opened after a game.
      const nav = (f: Focus) => f.tag === 'a' && /^Reviews$/.test(f.name);
      if (!(await p.until('Shift+Tab', nav, 40)))
        await p.assist(
          'Shift+Tab did not reach the "Reviews" link in the main navigation',
          'nav[aria-label="Main"] a:has-text("Reviews")',
        );
      await p.press('Enter');
      await page.getByTestId('history-table').waitFor({ timeout: 15_000 });
      const link = (f: Focus) => /Review\.$/.test(f.name);
      if (!(await p.until('Tab', link, 30)))
        await p.assist("Tab did not reach the game's Review link", 'a:has-text("Review")');
      p.note(`The row: ${(await p.focus()).aria}`);
      await p.press('Enter');
      await page
        .getByTestId('review-status')
        .filter({ hasText: /1 flag/ })
        .waitFor({ timeout: 30_000 });
      await page.waitForTimeout(800);
      const said = await reviewSaid(p);
      p.note(`The review said: "${said}"`);
      await p.reached('"Review. 1 flag." when opened from History', /Review\. 1 flag\./.test(said));
      await p.reached('no progress line for a whole review', !/Analysing/.test(said));
    },
  );

  // R5 -----------------------------------------------------------------------------------------
  await p.step(
    'R5',
    'Practice: the review is silent while the board is live',
    'Tab to "Practice this"; Enter; wait five seconds on the board',
    'Practice opens with focus on "Your Main phase"; one polite "Practice: turn 9 as it stood. Nothing is timed."; for the next five seconds nothing of the review ("Analysing", "Review ready", "Review. 1 flag.") is spoken; the review\'s own live region is not in the page',
    async () => {
      if (!(await p.reached('the review (R5)', reviewed))) return 'not reached';
      // Everything the polite and assertive regions write from here on.
      await page.evaluate(() => {
        const heard: string[] = [];
        (window as unknown as { __m8Heard: string[] }).__m8Heard = heard;
        new MutationObserver(() => {
          for (const r of document.querySelectorAll('[aria-live]'))
            if (r.textContent) heard.push(r.textContent.trim());
        }).observe(document.body, { subtree: true, childList: true, characterData: true });
      });
      if (!(await p.until('Tab', (f) => f.id === 'practice-btn', 40)))
        await p.until('Shift+Tab', (f) => f.id === 'practice-btn', 40);
      if ((await p.focus()).id !== 'practice-btn')
        await p.assist('Tab did not reach "Practice this"', '#practice-btn');
      await p.press('Enter');
      await page.locator('#decision[data-kind="main"]').waitFor({ timeout: 20_000 });
      await page.waitForTimeout(5000);
      const heard = await page.evaluate(
        () => (window as unknown as { __m8Heard?: string[] }).__m8Heard ?? [],
      );
      p.note(
        `Spoken by live regions since Enter: ${heard.map((h) => `"${h}"`).join(' | ') || '(nothing)'}`,
      );
      p.note(`Polite region now: "${await polite(p)}"; focus ${(await p.focus()).aria}`);
      await p.reached(
        'no review words while the board is live',
        !heard.some((h) => REVIEW_WORDS.test(h)),
      );
      await p.reached(
        "the review's live region gone while the board is live",
        (await page.getByTestId('review-announce').count()) === 0,
      );
    },
  );
}
