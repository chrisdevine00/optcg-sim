/**
 * The M7 screen-reader script (accessibility.md §11.5): the guided tutorial (steps t1 to t3, the
 * step text announced, focus on Next, Read again, leave and resume), the hint (`H` moves focus to
 * the result, which is a polite status; a step is read), Settings (the coach checkboxes and the
 * tutorial timing list), and the blunder note (polite, the commit control described by it).
 *
 * Same method as m3.ts and l.ts: keys go through the reader; where the plain keyboard path does
 * not reach the place a step needs, the harness moves focus itself and records an "assist". The
 * verdicts are written by a person (or a subagent) comparing each step's log with its Expect
 * column. Where §11.5 expects something that was not built, the step says "Note: not built".
 *
 * Parts, in order (each loads its own page; the browser context, and so the tutorial's progress and
 * timing log, carries across): T tutorial, H hint, S settings, B blunder.
 */
import type { Focus, Pass } from './pass.ts';
import { named } from './m3.ts';

/** Part T: the tutorial from its first step (a fresh profile starts here from "I'm new"). */
export const M7_TUTORIAL_URL = 'tutorial?restart=1';
/** Part H: a Main Phase where the hint returns a line (scenarios: usability-scenarios.ts). */
export const M7_HINT_URL =
  'play?scenario=ub-hint-1&speed=step&opp=pirate&aibudget=iterations&start=1';
/** Part S: Settings. */
export const M7_SETTINGS_URL = 'settings';
/** Part B: a turn with a proven lethal; ending it is the planted blunder. */
export const M7_BLUNDER_URL =
  'play?scenario=ub-blunder-1&speed=step&opp=pirate&aibudget=iterations&start=1';

const LEADER = '[data-zone="my-row"].bc-leader';
const isDry = (p: Pass) => p.reader.name.startsWith('dry');

const polite = async (p: Pass) =>
  (await p.page
    .locator('#announce-polite')
    .textContent({ timeout: 1000 })
    .catch(() => '')) ?? '';

const testId = (p: Pass) =>
  p.page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? '');

const text = async (p: Pass, selector: string) =>
  (
    (await p.page
      .locator(selector)
      .first()
      .innerText({ timeout: 2000 })
      .catch(() => '')) ?? ''
  )
    .replace(/\s+/g, ' ')
    .trim();

/** The accessible description of an element, from aria-describedby. */
async function describedBy(p: Pass, selector: string) {
  return await p.page
    .locator(selector)
    .evaluate((e) =>
      (e.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .map((id) => (document.getElementById(id)?.textContent ?? '').trim())
        .join(' '),
    )
    .catch(() => '');
}

/** Waits for the tutorial's step text to hold focus (it takes it ~150 ms after a step starts). */
async function stepTextFocused(p: Pass, n: number, ms = 8000): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const title = await text(p, '#tut-title');
    if (title.startsWith(`Step ${n} of 8`) && (await p.focus()).id === 'tutorial-text') return true;
    await p.page.waitForTimeout(150);
  }
  return false;
}

/** Waits for the step's "done" line (the card's `tutorial-done` paragraph). */
async function stepDone(p: Pass, ms = 15_000): Promise<boolean> {
  return await p.page
    .locator('[data-testid="tutorial-done"]')
    .waitFor({ timeout: ms })
    .then(() => true)
    .catch(() => false);
}

/**
 * The step text names "press G then L" (or H). From the step text those keys must reach the board;
 * if NVDA's browse mode kept them, the step records it and the harness moves focus (an assist).
 */
async function toBoardKey(p: Pass, keys: string[], zone: string, fallback: string) {
  let f: Focus | null = null;
  for (const k of keys) f = await p.press(k);
  if (f && f.inBoard && f.zone === zone) return;
  p.note(
    `After ${keys.join(' then ')} from the step text, focus was on ${f?.aria ?? '(nothing)'}; the step text promises the ${zone} zone.`,
  );
  await p.assist(`focus moved to the ${zone} zone (the keys did not get there)`, fallback);
}

export async function runM7(p: Pass) {
  const page = p.page;
  const origin = new URL(page.url()).href.replace(/[^/]*$/, '');
  const go = async (path: string, ready: string) => {
    await page.goto(new URL(path, origin).href);
    await page.locator(ready).first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    await p.focusPage(`after loading ${path}`);
  };

  // ============================================================== Part T: the tutorial
  await go(M7_TUTORIAL_URL, '#tutorial-text');

  // T0 -----------------------------------------------------------------------------------------
  await p.step(
    'T0',
    'The tutorial opens: the step text is read',
    'Load the tutorial from its first step (the "I\'m new" path); wait for the step text',
    'Focus is on the step text, a group named "Step 1 of 8: The zones"; the title, the two-sentence intro and the instruction ("Do this: ..." with the keys) are read; "Read again", "Back" (disabled), "Leave tutorial" follow it; no timers anywhere',
    async () => {
      await p.reached(
        'focus on the step text (#tutorial-text) when step 1 starts',
        stepTextFocused(p, 1),
      );
      const f = await p.focus();
      p.note(`Focus: ${f.aria}`);
      p.note(`Step text: ${await text(p, '#tutorial-text')}`);
      p.note(`Polite line at the start: "${await polite(p)}"`);
      // The virtual cursor reads the card line by line.
      for (let i = 0; i < 6; i++) await p.press('Browse:Next');
      p.note(
        'Note: not built: the "Show me" control the first draft of §11.5 named. A constrained step lights the cards it names and its text carries the keys; there is no Show me button.',
      );
    },
  );

  // T1 -----------------------------------------------------------------------------------------
  await p.step(
    'T1',
    'Step 1 (t1-zones): visit the nine zones by keyboard',
    'G, L; ArrowRight along the Leader row; Up to the Characters row; Down to your hand',
    'Each zone is spoken as focus lands; the first visit of each zone adds its one line ("Leader: starts the game face up...") politely; when all nine are visited the done line is spoken ("That is the whole board...Press Next to go on.") and focus is on Next',
    async () => {
      await toBoardKey(p, ['g', 'l'], 'my-row', LEADER);
      for (let i = 0; i < 8; i++) await p.press('ArrowRight');
      await p.press('ArrowUp');
      await p.press('ArrowDown');
      for (let i = 0; i < 3 && (await p.focus()).zone !== 'hand'; i++) await p.press('ArrowDown');
      const done = await stepDone(p);
      p.note(
        `Zone lines spoken so far (polite regions): ${(await p.live()).filter((l) => l.region === 'announce-polite').length}`,
      );
      await p.reached('the step done after visiting the zones (t1)', done);
      await page.waitForTimeout(400);
      const id = await testId(p);
      p.note(`Focus after the done line: ${(await p.focus()).aria} (data-testid "${id}")`);
      await p.reached('focus on Next once step 1 is done', id === 'tutorial-next');
      p.note(`Done line: ${await text(p, '[data-testid="tutorial-done"]')}`);
    },
  );

  // T2 -----------------------------------------------------------------------------------------
  await p.step(
    'T2',
    'Next, then step 2 (t2-first-turn): play Jinbe',
    'Enter on Next; the step text; G, H, Enter, P',
    'Enter on Next starts step 2 and focus goes to its step text, read as "Step 2 of 8: Your first turn"; G then H reaches the hand (Jinbe first), Enter opens his menu, P plays him; the done line is spoken and focus is on Next',
    async () => {
      await p.press('Enter');
      await p.reached('focus on the step 2 text after Enter on Next', stepTextFocused(p, 2));
      p.note(`Step text: ${await text(p, '#tutorial-text')}`);
      await toBoardKey(p, ['g', 'h'], 'hand', '[data-zone="hand"]');
      await p.press('Enter');
      await p.press('p');
      const done = await stepDone(p);
      await p.reached('the step done after playing Jinbe (t2)', done);
      await page.waitForTimeout(400);
      await p.reached('focus on Next once step 2 is done', (await testId(p)) === 'tutorial-next');
      p.note(`Done line: ${await text(p, '[data-testid="tutorial-done"]')}`);
    },
  );

  // T3 -----------------------------------------------------------------------------------------
  await p.step(
    'T3',
    'Step 3 (t3-don-and-power): P, Read again, then give 1 DON!! to the Leader',
    'Enter on Next; P from the board; Read again; G, L, Right to the Leader, plus, Enter',
    'P from the board moves focus to the step text; "Read again" speaks the step once more and puts focus back on the text; giving 1 DON!! makes the Leader read 6000; the done line states the number ("Your Leader shows 6000, which is its 5000 plus 1000") and focus is on Next',
    async () => {
      await p.press('Enter');
      await p.reached('focus on the step 3 text after Enter on Next', stepTextFocused(p, 3));
      // P from the board.
      await toBoardKey(p, ['g', 'l'], 'my-row', LEADER);
      const fp = await p.press('p');
      p.note(`After P from the board: ${fp.aria}`);
      await p.reached('P moving focus to the step text', fp.id === 'tutorial-text');
      // Read again.
      const before = (await p.live()).length;
      await p.until('Tab', named(/^Read again/), 6);
      if (!named(/^Read again/)(await p.focus()))
        await p.assist(
          'focus moved to Read again (Tab did not reach it)',
          'button:has-text("Read again")',
        );
      await p.press('Enter');
      await page.waitForTimeout(600);
      const again = (await p.live()).slice(before).filter((l) => l.region === 'announce-polite');
      p.note(
        `Read again wrote: ${again.map((l) => `"${l.text}"`).join(' | ') || '(nothing new: the live recorder keeps only a change of text, and the step text was the same)'}; focus now ${(await p.focus()).aria}`,
      );
      await p.reached(
        'Read again putting focus back on the step text',
        stepTextFocused(p, 3, 4000),
      );
      await toBoardKey(p, ['g', 'l'], 'my-row', LEADER);
      await p.until('ArrowRight', (f) => /^Your Leader\b/.test(f.name), 12);
      if (!/^Your Leader\b/.test((await p.focus()).name))
        await p.assist('focus moved to your Leader (the arrows did not reach it)', LEADER);
      await p.press('+');
      await p.press('Enter');
      const done = await stepDone(p);
      await p.reached('the step done after giving DON!! to the Leader (t3)', done);
      await page.waitForTimeout(400);
      await p.reached('focus on Next once step 3 is done', (await testId(p)) === 'tutorial-next');
      p.note(`Done line: ${await text(p, '[data-testid="tutorial-done"]')}`);
    },
  );

  // T4 -----------------------------------------------------------------------------------------
  await p.step(
    'T4',
    'Leave the tutorial and resume',
    'Press Next to step 4; Leave tutorial; on Home, the "Continue the tutorial" link; Enter',
    'Leave tutorial goes to Home, which offers "Continue the tutorial (step 4 of 8)"; Enter on it reopens step 4 with focus on its step text (resumes at the start of the step, not mid-step)',
    async () => {
      await p.press('Enter');
      await p.reached('focus on the step 4 text after Enter on Next', stepTextFocused(p, 4));
      await p.until('Tab', named(/^Leave tutorial/), 14);
      if (!named(/^Leave tutorial/)(await p.focus()))
        await p.assist(
          'focus moved to Leave tutorial (Tab did not reach it)',
          'button:has-text("Leave tutorial")',
        );
      await p.press('Enter');
      await page.waitForTimeout(800);
      p.note(`On Home: focus ${(await p.focus()).aria}; heading text: ${await text(p, 'h1')}`);
      // (The focus name of <body> is the page's text, so the match is the link's tag as well.)
      const isContinue = (f: Focus) => f.tag === 'a' && /^Continue the tutorial/.test(f.name);
      const link = await p.until('Tab', isContinue, 12);
      if (!link)
        await p.assist(
          'focus moved to "Continue the tutorial" (Tab did not reach it)',
          '[data-testid="continue-tutorial"]',
        );
      p.note(`Home offers: ${await text(p, '[data-testid="continue-tutorial"]')}`);
      await p.press('Enter');
      await p.reached('step 4 reopened with focus on its step text', stepTextFocused(p, 4));
      p.note(`Step text: ${await text(p, '#tutorial-text')}`);
    },
  );

  // ============================================================== Part H: the hint
  await go(M7_HINT_URL, '#decision[data-kind="main"]');

  // H1 -----------------------------------------------------------------------------------------
  await p.step(
    'H1',
    'H asks for a hint; focus moves to the result',
    'From the board, H; wait for the result',
    'Nothing is asked by itself. H opens the coach on Hint, focus moves to the hint region (a group named "Hint"), and the status is spoken politely: "Hint: thinking." then "Hint ready: Play Yamato, attack their Leader, and end with 5 DON!! active. 4 steps. Step 1: ..."; focus stays on the region while the result arrives',
    async () => {
      p.note(
        'Scenario ub-hint-1: your Main Phase, 4 active DON!!, Yamato and Basil Hawkins in hand; the expected line plays Yamato first (app/test/usability-s2.test.ts).',
      );
      p.note(
        `Before H: coach data-mode "${await page.locator('.coach').getAttribute('data-mode')}"; hint badge present: ${(await page.getByTestId('hint-badge').count()) > 0}`,
      );
      await p.assist('focus moved to the board (a user presses H from the board)', LEADER);
      const t0 = Date.now();
      const f = await p.press('h');
      p.note(`After H, focus: ${f.aria}`);
      await p.reached('H moving focus to the hint region', (await p.focus()).inCoach || f.inCoach);
      const ready = await page
        .locator('.coach-hint[data-hint="ready"]')
        .waitFor({ timeout: 30_000 })
        .then(() => true)
        .catch(() => false);
      await p.reached('the hint result (data-hint ready)', ready);
      const lines = (await p.live())
        .filter((l) => l.t >= t0)
        .map((l) => `${l.region === 'announce-assertive' ? '(assertive) ' : ''}${l.text}`);
      p.note(`Live lines after H: ${lines.join(' | ') || '(none)'}`);
      await p.reached(
        'a polite "Hint ready" line',
        lines.some((l) => /^Hint ready:/.test(l)),
      );
      await p.reached('no assertive coach line', !lines.some((l) => l.startsWith('(assertive)')));
      p.note(`Focus after the result arrived: ${(await p.focus()).aria}`);
      p.note(`Hint text: ${await text(p, '.coach-hint')}`);
    },
  );

  // H2 -----------------------------------------------------------------------------------------
  await p.step(
    'H2',
    'Read the hint, walk its steps',
    'Read the region with the virtual cursor; Tab to "Show step 1 on the board"; Down, Up; Enter',
    'Browse mode reads the claim, the certainty ("Works against any hand"), the numbered steps and the outcome; Down and Up move between the "Show step N on the board: ..." buttons, each named with its step text; Enter shows the step on the board and nothing is played',
    async () => {
      for (let i = 0; i < 12; i++) await p.press('Browse:Next');
      const log = await text(p, '.log-list');
      const first = await p.until('Tab', named(/^Show step 1/), 12);
      if (!first)
        await p.assist(
          'focus moved to "Show step 1" (Tab did not reach it)',
          'button[aria-label^="Show step 1"]',
        );
      p.note(`Focus: ${(await p.focus()).aria}`);
      const down = await p.press('ArrowDown');
      p.note(`ArrowDown: ${down.aria}`);
      await p.reached('ArrowDown moving to "Show step 2"', /Show step 2/.test(down.aria));
      const up = await p.press('ArrowUp');
      p.note(`ArrowUp: ${up.aria}`);
      await p.reached('ArrowUp returning to "Show step 1"', /Show step 1/.test(up.aria));
      await p.press('Enter');
      await page.waitForTimeout(500);
      p.note(
        `After Enter on a step: hint still ready: ${(await page.locator('.coach-hint').getAttribute('data-hint')) === 'ready'}; the log is unchanged (nothing played): ${(await text(p, '.log-list')) === log}`,
      );
      await p.reached('nothing played by showing a step', (await text(p, '.log-list')) === log);
      p.note(
        '"Do step 1" lines the first action up in the decision panel (Shift+Enter on step 1); it is not pressed here. Esc clears the hint.',
      );
    },
  );

  // ============================================================== Part S: Settings
  await go(M7_SETTINGS_URL, 'h1:has-text("Settings")');

  // S1 -----------------------------------------------------------------------------------------
  await p.step(
    'S1',
    'Settings: the coach checkboxes',
    'Read the page by heading; Tab to "Blunder warning"; Space',
    'The page has a Settings heading and a Coach section; "Blunder warning" is a checkbox with its hint as its description; Space checks it and the change is spoken politely: "Blunder warning: on."; nothing else on the page moves focus',
    async () => {
      p.note(
        'Settings is reached from the header link "Settings"; the script loads it directly (the header link is a plain link).',
      );
      for (let i = 0; i < 3; i++) await p.press('Browse:Heading');
      const box = await p.until('Tab', named(/Blunder warning/), 25);
      if (!box)
        await p.assist(
          'focus moved to the Blunder warning checkbox (Tab did not reach it)',
          '#set-blunder',
        );
      p.note(
        `Focus: ${(await p.focus()).aria}; description: ${await describedBy(p, '#set-blunder')}`,
      );
      await p.press('Space');
      await page.waitForTimeout(600);
      p.note(
        `Checked: ${await page.locator('#set-blunder').isChecked()}; status: "${await page.locator('[data-testid="settings-status"]').textContent()}"`,
      );
      await p.reached(
        'the checkbox checked by Space',
        await page.locator('#set-blunder').isChecked(),
      );
      // The page's own status line is a polite status, not one of the board's live regions, so the
      // live-region recorder does not see it: the speech column is the evidence.
      const status = page.locator('[data-testid="settings-status"]');
      p.note(
        `Status line: role "${await status.getAttribute('role')}", aria-live "${await status.getAttribute('aria-live')}"`,
      );
      await p.reached(
        'a polite status line saying "Blunder warning: on."',
        (await status.getAttribute('aria-live')) === 'polite' &&
          /Blunder warning: on\./.test((await status.textContent()) ?? ''),
      );
    },
  );

  // S2 -----------------------------------------------------------------------------------------
  await p.step(
    'S2',
    'Settings: the tutorial timing list',
    'Tab on to the "Tutorial timing" section',
    'A list named "Tutorial runs" shows the run from part T ("..: 3 of 8 steps, N min active, not finished"); its buttons are "Export JSON for <date>", "Export CSV for <date>" and "Delete the run of <date>"; Delete asks "Delete for good / Keep it" in place. Nothing is exported or deleted by this script',
    async () => {
      p.note(`Section text: ${(await text(p, '#set-timing + p')).slice(0, 220)}`);
      p.note(`Runs: ${await text(p, '[aria-label="Tutorial runs"]')}`);
      const exp = await p.until('Tab', named(/^Export JSON/), 25);
      if (!exp)
        await p.assist(
          'focus moved to Export JSON (Tab did not reach it)',
          'button:has-text("Export JSON")',
        );
      p.note(`Focus: ${(await p.focus()).aria}`);
      const csv = await p.press('Tab');
      p.note(`Next control: ${csv.aria}`);
      const del = await p.press('Tab');
      p.note(`Next control: ${del.aria}`);
      await p.reached(
        'the run from part T listed',
        (await page.locator('[aria-label="Tutorial runs"] li').count()) > 0,
      );
      p.note(
        'Not exercised: the download itself (a Blob; the e2e test blunder.spec.ts proves no request leaves the page).',
      );
    },
  );

  // ============================================================== Part B: the blunder note
  await go(M7_BLUNDER_URL, '#decision[data-kind="main"]');

  // B1 -----------------------------------------------------------------------------------------
  await p.step(
    'B1',
    'End turn with a lethal on the board: the note',
    'Wait for the analysis; Tab to End turn; Enter',
    'The turn does not end. A polite line is spoken: "Warning: You have lethal this turn, and this move gives it up. ... Choose the better move, or press Commit anyway."; the End turn button is now named "Commit anyway" and its description is the note; focus stays on it; no dialog, no assertive line',
    async () => {
      p.note(
        'Scenario ub-blunder-1: Rocks at 0 Life, your Kaido (12000) ready to attack; Settings → Blunder warning was switched on in S1 (it applies to the next game).',
      );
      await page.waitForTimeout(2000);
      const end = await p.until('Tab', (f) => f.id === 'endturn-btn', 30);
      if (!end) await p.assist('focus moved to End turn (Tab did not reach it)', '#endturn-btn');
      p.note(`Focus: ${(await p.focus()).aria}`);
      const t0 = Date.now();
      await p.press('Enter');
      await page.waitForTimeout(800);
      const kind = await p.kind();
      p.note(`Decision after Enter: "${kind}" (still main: the turn did not end)`);
      await p.reached('the turn held (decision still main)', kind === 'main');
      const f = await p.focus();
      p.note(`Focus after Enter: ${f.aria}`);
      await p.reached('focus staying on the End turn button', f.id === 'endturn-btn');
      const desc = await describedBy(p, '#endturn-btn');
      p.note(`End turn's accessible description: ${desc}`);
      await p.reached('the button described by the note (mentions lethal)', /lethal/i.test(desc));
      const lines = (await p.live()).filter((l) => l.t >= t0);
      p.note(
        `Live lines: ${lines.map((l) => `${l.region === 'announce-assertive' ? '(assertive) ' : ''}${l.text}`).join(' | ') || '(none)'}`,
      );
      await p.reached(
        'a polite "Warning:" line',
        lines.some((l) => l.region === 'announce-polite' && /^Warning:/.test(l.text)),
      );
      await p.reached(
        'no assertive line for the warning',
        !lines.some((l) => l.region === 'announce-assertive'),
      );
      await p.reached(
        'no dialog opened',
        (await page.locator('dialog[open], [role="dialog"]').count()) === 0,
      );
      p.note(
        isDry(p)
          ? 'Dry run: the speech itself is not heard; the live-region write above is what NVDA would be given.'
          : 'Judge the spoken log: the warning should be heard once, after the key, without the board being re-read.',
      );
    },
  );

  // B2 -----------------------------------------------------------------------------------------
  await p.step(
    'B2',
    'Commit anyway',
    'Enter again on the same button',
    'The second press is "Commit anyway": the warning is spent for this decision, the note goes, and the turn ends (the game moves on to the opponent)',
    async () => {
      await p.press('Enter');
      await page.waitForTimeout(1200);
      const note = await page.locator('.blunder-note').count();
      const kind = await p.kind();
      p.note(`After the second Enter: note present ${note > 0}; decision "${kind}"`);
      await p.reached('the note gone and the turn ended', note === 0 && kind !== 'main');
    },
  );
}
