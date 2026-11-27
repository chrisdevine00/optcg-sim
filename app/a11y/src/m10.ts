/**
 * The M10 screen-reader script (accessibility.md §11.9): the release shell. A1 the About page, E1
 * the page for an unknown address, S1 the skip link and the shortcut sheet, O1 offline, U1 the
 * update prompt.
 *
 * Same method as m9.ts: keys go through the reader; where the keyboard path does not reach the place
 * a step needs, the harness moves focus itself and records an "assist". The verdicts are written by
 * a person (or a subagent) comparing each step's log with its Expect column.
 *
 * Two parts of the script need the production build's service worker, so its specs run with service
 * workers allowed (the other scripts block them): O1 goes offline after the shell is cached, and U1
 * rewrites `app/dist/sw.js` with another build id so a new worker installs and waits, as
 * `app/e2e/update.spec.ts` does. U1 runs last, and puts the file back whatever happens.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import type { Focus, Pass } from './pass.ts';
import { M3_URL } from './m3.ts';
import { startAtTop } from './art.ts';
import { stepArgs, type StepDef } from './steps.ts';

export const M10_STEPS: readonly StepDef[] = [
  {
    id: 'A1',
    title: 'About: heading, version line, credits and licences',
    do: 'Load About; read the heading and the Version section; Tab from the heading through the credits links to the licences link',
    expect:
      'The heading "About" has focus; the version facts read as a list of term and value pairs (Release, Build, Built, Cards through, Tournament lists as of, Rules engine); each credit link reads its source name and then "(opens in a new tab)"; the licences link reads "third-party.txt (plain text, opens in a new tab)"; nothing is spoken that no key asked for',
  },
  {
    id: 'E1',
    title: 'An unknown address: "Page not found" and the way home',
    do: 'Load an address no page has; read the heading; Tab to the first link; Enter',
    expect:
      'The heading "Page not found" has focus, and "There is nothing at this address." follows; the first link in the page is "Home"; Enter opens Home with its heading ("OPTCG Sim") taking focus; nothing is assertive',
  },
  {
    id: 'S1',
    title: 'The skip link, and the shortcut sheet with "?"',
    do: 'On Learn: Tab once from the top of the page; Enter; Tab. Then on the board: "?"; read the sheet; Escape',
    expect:
      'The first Tab stop on a page is "Skip to content"; after Enter the next Tab lands inside the main region, not back in the header. On the board "?" opens a dialog named "Keyboard shortcuts" and focus moves into it; Escape closes it and focus returns to the control it came from',
  },
  {
    id: 'O1',
    title: 'Offline: the app loads, one polite line, art falls back to names',
    do: 'Load Settings with the service worker installed; go offline; read what is said; reload; open Cards and Tab to a card',
    expect:
      'Going offline speaks one polite line, "You are offline. Everything works; card art you have not seen yet shows as text.", once and nothing assertive; the reload still loads Settings; on Cards a card whose art was never cached is read by its name, number and type, never as "image" or "graphic"',
  },
  {
    id: 'U1',
    title: 'The update prompt: polite, a real button, focus stays',
    do: 'On Learn with the service worker installed, Tab to any control; a new build is installed and waits; read the page; Tab to the prompt’s button (do not press it)',
    expect:
      'A polite status says "A new version of the app is ready, with the latest cards and fixes."; its button is "Reload to update" and nothing presses it; keyboard focus stays on the control it was on (the prompt never takes focus); nothing is assertive',
  },
];

/** The first page: About. The other steps load their own. */
export const M10_URL = 'about';

const NO_SUCH_PAGE = 'no-such-page';
const OFFLINE_RE =
  /You are offline\. Everything works; card art you have not seen yet shows as text\./;
const UPDATE_RE = /A new version of the app is ready, with the latest cards and fixes\./;
/** The production service worker the update step rewrites (the preview server serves `app/dist`). */
export const SW_FILE = fileURLToPath(new URL('../../dist/sw.js', import.meta.url));

const ART_HOSTS = /https:\/\/(optcgapi\.com|optcg-api\.arjunbansal-ai\.workers\.dev)\/.*/;

/** No card art at all: every art host is refused, so cards are text faces (the pass never needs a picture). */
export async function blockArt(page: Page) {
  await page.route(ART_HOSTS, (r) => r.abort());
}

/**
 * A waiting build, simulated as `update.spec.ts` does: the same worker file with another build id.
 * Returns the function that puts the file back. Throws when the file is not a production worker.
 */
export function stubWaitingWorker(build: string): () => void {
  const original = readFileSync(SW_FILE, 'utf8');
  if (!original.includes(build)) throw new Error(`app/dist/sw.js does not hold build ${build}`);
  writeFileSync(SW_FILE, original.split(build).join('e2e0000next0'));
  return () => writeFileSync(SW_FILE, original);
}

/** Is the focus on a link? */
const links = (f: Focus) => f.tag === 'a';

const polite = async (p: Pass, selector: string) =>
  (
    (await p.page
      .locator(selector)
      .first()
      .textContent({ timeout: 1000 })
      .catch(() => '')) ?? ''
  )
    .replace(/\s+/g, ' ')
    .trim();

/** Everything a status element writes from now on, in order (the harness's recorder only watches #announce-*). */
async function watchStatus(p: Pass, selector: string, key: string) {
  await p.page.evaluate(
    ([sel, k]) => {
      const heard: string[] = [];
      (window as unknown as Record<string, string[]>)[k!] = heard;
      new MutationObserver(() => {
        const t = document.querySelector(sel!)?.textContent?.trim();
        if (t && heard[heard.length - 1] !== t) heard.push(t);
      }).observe(document.body, { subtree: true, childList: true, characterData: true });
    },
    [selector, key],
  );
}

const watched = (p: Pass, key: string) =>
  p.page.evaluate((k) => (window as unknown as Record<string, string[]>)[k] ?? [], key);

const assertiveSince = async (p: Pass, t: number) =>
  (await p.live()).filter((l) => l.region === 'announce-assertive' && l.t >= t).map((l) => l.text);

export async function runM10(p: Pass) {
  const page = p.page;
  const origin = new URL(page.url()).href.replace(/about\/?(\?.*)?$/, '');
  const go = async (path: string) => {
    await page.goto(new URL(path, origin).href);
    await page.waitForTimeout(1200);
    await p.focusPage(`after loading ${path}`);
  };
  /** The service worker controls the page and has cached the shell, so offline can work. */
  const shellCached = async () => {
    const ok = await page
      .waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
        timeout: 30_000,
      })
      .then(() => true)
      .catch(() => false);
    if (!ok) return false;
    const build = await page.evaluate(async (base) => {
      const r = await fetch(`${base}version.json`, { cache: 'no-store' });
      return ((await r.json()) as { build: string }).build;
    }, origin);
    return page
      .waitForFunction(
        async (name) => (await (await caches.open(name)).keys()).length > 50,
        `optcg-shell-${build}`,
        { timeout: 60_000 },
      )
      .then(() => true)
      .catch(() => false);
  };

  // A1 -----------------------------------------------------------------------------------------
  await p.step(...stepArgs(M10_STEPS, 'A1'), async () => {
    await go(M10_URL);
    const f0 = await p.focus();
    p.note(`Focus on load: ${f0.aria}`);
    await p.reached('the heading "About" has focus', f0.name === 'About');
    const facts = (await polite(p, '[data-testid="about-version"]')) || '(not shown)';
    p.note(`The version facts: ${facts}`);
    await p.reached(
      'the version facts name Release, Build and Rules engine',
      /Release/.test(facts) && /Build/.test(facts) && /Rules engine/.test(facts),
    );
    const credit = (f: Focus) => links(f) && /\(opens in a new tab\)/.test(f.name);
    const first = await p.until('Tab', credit, 40);
    if (!first) await p.assist('Tab did not reach a credit link', '.about-credits a');
    p.note(`The first credit link: ${(await p.focus()).aria}`);
    await p.reached('a credit link reads its source and "(opens in a new tab)"', !!first);
    const seen: string[] = [];
    const licences = (f: Focus) => {
      if (links(f) && f.name && seen[seen.length - 1] !== f.name) seen.push(f.name);
      return /third-party\.txt/.test(f.name);
    };
    const hit = await p.until('Tab', licences, 20);
    if (!hit) await p.assist('Tab did not reach the licences link', 'a[href$="third-party.txt"]');
    p.note(`Links passed on the way: ${seen.join(' | ')}`);
    p.note(`The licences link: ${(await p.focus()).aria}`);
    await p.reached('the licences link reads "third-party.txt" and "plain text"', !!hit);
    await p.reached(
      'the licences link says it is plain text and opens in a new tab',
      /plain text, opens in a new tab/.test((await p.focus()).name),
    );
  });

  // E1 -----------------------------------------------------------------------------------------
  await p.step(...stepArgs(M10_STEPS, 'E1'), async () => {
    const t0 = Date.now();
    await go(NO_SUCH_PAGE);
    const f0 = await p.focus();
    p.note(`Focus on load: ${f0.aria}`);
    await p.reached('the heading "Page not found" has focus', f0.name === 'Page not found');
    p.note(`The page says: ${await polite(p, 'main')}`);
    const link = await p.until('Tab', (f) => links(f) && f.name === 'Home', 12);
    if (!link) await p.assist('Tab did not reach the Home link', 'main >> a:has-text("Home")');
    p.note(`The first link: ${(await p.focus()).aria}`);
    await p.reached('the Home link is reached by Tab', !!link);
    await p.press('Enter');
    await page.waitForTimeout(800);
    const f1 = await p.focus();
    p.note(`After Enter: ${f1.aria}; the address is ${new URL(page.url()).pathname}`);
    await p.reached('Home opened with its heading focused', f1.name === 'OPTCG Sim');
    await p.reached('nothing assertive', (await assertiveSince(p, t0)).length === 0);
  });

  // S1 -----------------------------------------------------------------------------------------
  await p.step(...stepArgs(M10_STEPS, 'S1'), async () => {
    await go('learn');
    await startAtTop(page);
    const f0 = await p.press('Tab');
    p.note(`The first Tab stop: ${f0.aria}`);
    await p.reached('the first Tab stop is "Skip to content"', /^Skip to content/.test(f0.name));
    await p.press('Enter');
    const f1 = await p.press('Tab');
    const inMain = await page.evaluate(() => !!document.activeElement?.closest('main'));
    p.note(`After Enter and Tab: ${f1.aria}${inMain ? ' (inside the main region)' : ''}`);
    await p.reached('the next Tab stop after the skip link is inside main', inMain);

    // The sheet, on a board.
    await go(M3_URL);
    await startAtTop(page);
    await p.press('Tab');
    const from = await p.press('Tab');
    p.note(`Before "?": ${from.aria}`);
    await p.press('?');
    await page.getByRole('dialog', { name: 'Keyboard shortcuts' }).waitFor({ timeout: 5000 });
    const f2 = await p.focus();
    p.note(`The sheet: ${f2.aria}`);
    await p.reached('"?" opened the Keyboard shortcuts dialog with focus inside it', f2.inDialog);
    await p.press('Escape');
    const f3 = await p.focus();
    p.note(`After Escape: ${f3.aria}`);
    await p.reached('Escape closed the sheet', (await page.getByRole('dialog').count()) === 0);
    await p.reached(
      'focus is back where it was',
      f3.aria === from.aria && f3.id === from.id && !f3.inDialog,
    );
  });

  // O1 -----------------------------------------------------------------------------------------
  await p.step(...stepArgs(M10_STEPS, 'O1'), async () => {
    const context = page.context();
    await blockArt(page);
    await go('settings');
    await p.reached(
      'the service worker controls the page and the shell is cached',
      await shellCached(),
    );
    await watchStatus(p, '[data-testid="offline-line"]', '__m10Offline');
    const t0 = Date.now();
    try {
      await context.setOffline(true);
      await page.waitForTimeout(1500);
      const said = await watched(p, '__m10Offline');
      p.note(`The status line wrote: ${said.map((s) => `"${s}"`).join(' | ') || '(nothing)'}`);
      await p.reached(
        'one polite offline line',
        said.length === 1 && OFFLINE_RE.test(said[0] ?? ''),
      );
      p.note(`The line's role: ${await page.getByTestId('offline-line').getAttribute('role')}`);
      await p.reached('nothing assertive', (await assertiveSince(p, t0)).length === 0);

      await page.reload();
      await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 20_000 });
      await p.focusPage('after the offline reload');
      p.note(
        `After the offline reload: focus ${(await p.focus()).aria}; the line says: ${await polite(p, '[data-testid="offline-line"]')}`,
      );
      await p.reached(
        'Settings loaded from the cache',
        (await page.getByRole('heading', { level: 1, name: 'Settings' }).count()) === 1,
      );

      await page.goto(new URL('cards', origin).href);
      await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 20_000 });
      await p.focusPage('on Cards, offline');
      await page.waitForTimeout(1000);
      const card = await p.until(
        'Tab',
        (f) => f.tag === 'button' && /^[^,]+, /.test(f.name) && f.name.length > 20,
        40,
      );
      if (!card) await p.assist('Tab did not reach a card', '#results [tabindex="0"]');
      const f2 = await p.focus();
      p.note(`A card, offline: ${f2.aria}`);
      await p.reached(
        'the card is read by name, never as an image',
        f2.name.length > 3 && !/\b(image|graphic|img)\b/i.test(f2.aria),
      );
    } finally {
      await context.setOffline(false);
    }
  });

  // U1 -----------------------------------------------------------------------------------------
  await p.step(...stepArgs(M10_STEPS, 'U1'), async () => {
    await go('learn');
    await p.reached('the service worker controls the page', await shellCached());
    const build = await page.evaluate(async (base) => {
      const r = await fetch(`${base}version.json`, { cache: 'no-store' });
      return ((await r.json()) as { build: string }).build;
    }, origin);
    await startAtTop(page);
    await p.press('Tab');
    await page.evaluate(() => {
      (window as unknown as { __u1Focus: Element | null }).__u1Focus = document.activeElement;
    });
    const before = await p.focus();
    p.note(`Focus before the update: ${before.aria}`);
    const t0 = Date.now();
    await watchStatus(p, '.update-prompt', '__m10Update');
    const restore = stubWaitingWorker(build);
    try {
      await page.evaluate(async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        await reg!.update();
      });
      const shown = await page
        .locator('.update-prompt')
        .waitFor({ timeout: 30_000 })
        .then(() => true)
        .catch(() => false);
      await p.reached('the update prompt appeared', shown);
      await page.waitForTimeout(1500);
      const said = await watched(p, '__m10Update');
      p.note(`The prompt wrote: ${said.map((s) => `"${s}"`).join(' | ') || '(nothing)'}`);
      await p.reached(
        'the prompt says what is ready',
        said.some((s) => UPDATE_RE.test(s)),
      );
      const role = await page.locator('.update-prompt').getAttribute('role');
      p.note(`The prompt's role: ${role}`);
      await p.reached('the prompt is a polite status', role === 'status');
      const same = await page.evaluate(
        () =>
          (window as unknown as { __u1Focus: Element | null }).__u1Focus === document.activeElement,
      );
      const after = await p.focus();
      p.note(`Focus after the prompt appeared: ${after.aria}`);
      await p.reached('focus stayed where it was', same);
      await p.reached('nothing assertive', (await assertiveSince(p, t0)).length === 0);
      const button = await p.until('Tab', (f) => /^Reload to update/.test(f.name), 40);
      if (!button) await p.assist('Tab did not reach the button', '.update-prompt button');
      const fb = await p.focus();
      p.note(`The button: ${fb.aria}`);
      await p.reached('the button is "Reload to update"', /^Reload to update/.test(fb.name));
      await p.reached('it is a real button', fb.tag === 'button');
    } finally {
      restore();
    }
  });
}
