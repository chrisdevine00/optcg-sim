/**
 * M10 WP6: the release shell in a real production build. About (heading focus, version line from the
 * real version.json, axe at both sizes), the 404, the error boundary with a really throwing route (the
 * header stays, the saved deck survives, Copy details has no stack, a removed chunk says "updated"),
 * the offline line with real offline events, the head and icons, and the Content-Security-Policy over
 * the home page, a Rookie turn (the AI worker), the builder and a drill, with the image fallback intact.
 *
 * Nothing here asserts a time. Reverts that fail it: delete `getDerivedStateFromError` (the throw
 * test); render the About `<h1>` without `tabIndex` (focus); drop `worker-src` or an image host from the
 * policy (the Rookie turn or the art step records a violation); loosen `connect-src` (the blocked-fetch
 * check fails).
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { nextDecision, playMainPhase, resolveChoose, serveArt, startGame } from './game-support.ts';

const SHOTS = '.cache/m10wp6';

/** A screenshot kept for the reviewer, then axe at WCAG 2.2 AA and best practice must find nothing. */
async function axe(page: Page, info: TestInfo, name: string, fullPage = true) {
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-${name}.png`, fullPage });
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(
    r.violations.map(
      (v) => `${name}: ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

/** The saved decks (localStorage) and a probe record written into IndexedDB, read straight from storage. */
async function stored(page: Page): Promise<{ decks: number; probe: string | null }> {
  return page.evaluate(
    () =>
      new Promise<{ decks: number; probe: string | null }>((resolve, reject) => {
        const decks = (JSON.parse(localStorage.getItem('optcg.decks.v1') ?? '[]') as unknown[])
          .length;
        const open = indexedDB.open('optcg-sim');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const req = db.transaction('meta').objectStore('meta').get('m10wp6-probe');
          req.onsuccess = () => {
            db.close();
            resolve({ decks, probe: (req.result as string | undefined) ?? null });
          };
          req.onerror = () => reject(req.error);
        };
      }),
  );
}

/** Puts a record in the app's IndexedDB `meta` store, so "the saved data is untouched" covers IDB too. */
async function writeProbe(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('optcg-sim');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('meta', 'readwrite');
          tx.objectStore('meta').put('kept', 'm10wp6-probe');
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
}

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

async function importDeck(page: Page, text: string) {
  await page.goto('./decks');
  await page.getByRole('button', { name: 'New deck' }).click();
  await expect(page.locator('.builder')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('#import-text').fill(text);
  await page.getByRole('button', { name: /^Import \d+ cards$/ }).click();
  await expect(page.locator('#import-text')).toHaveCount(0);
}

test.describe('About', () => {
  test('takes focus on its heading, shows the real version line, passes axe', async ({
    page,
  }, info) => {
    await page.goto('./about');
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeFocused();
    await expect(page).toHaveTitle('About · OPTCG Sim');
    const h2s = await page.getByRole('heading', { level: 2 }).allInnerTexts();
    expect(h2s).toEqual([
      'About',
      'Unofficial notice',
      'Version',
      'Credits',
      'Third-party licences',
      'Your data',
      'Report a problem',
    ]);
    // The version line is the build's own version.json, not a constant.
    const live = (await (await page.request.get('./version.json')).json()) as {
      release: string;
      build: string;
      cardsThrough: string;
      engine: string;
    };
    const facts = page.getByTestId('about-version');
    await expect(facts).toContainText(live.release);
    await expect(facts).toContainText(live.build);
    await expect(facts).toContainText(live.cardsThrough);
    await expect(facts).toContainText(live.engine);
    expect(live.release).toBe('1.0.0');
    await expect(page.getByText('Licence: to be chosen by the owner.')).toBeVisible();
    await expect(page.getByTestId('about-notice')).toContainText(
      'unofficial, non-commercial fan tool',
    );
    // The licences file is in the build.
    const licences = await page.request.get('./third-party.txt');
    expect(licences.status()).toBe(200);
    expect(await licences.text()).toContain('SIL OPEN FONT LICENSE');
    await axe(page, info, 'about');
  });

  test('is reachable from the footer and from Settings, and reachable by keyboard', async ({
    page,
  }) => {
    await page.goto('./');
    await page.locator('footer').getByRole('link', { name: 'About' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeFocused();
    await page.goto('./settings');
    await page.getByRole('link', { name: /About OPTCG Sim/ }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeFocused();
  });
});

test.describe('Page not found', () => {
  test('a deep unknown path keeps the header, focuses the heading and links home', async ({
    page,
  }, info) => {
    await page.goto('./nope/nope');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeFocused();
    await expect(page).toHaveTitle('Page not found - OPTCG Sim');
    await expect(page.getByText('There is nothing at this address.')).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    for (const name of ['Home', 'Play', 'Learn', 'Cards']) {
      await expect(page.locator('main').getByRole('link', { name, exact: true })).toBeVisible();
    }
    await axe(page, info, 'not-found');
    await page.locator('main').getByRole('link', { name: 'Cards', exact: true }).click();
    await expect(page).toHaveURL(/\/optcg-sim\/cards$/);
    await page.goBack();
    await page.locator('main').getByRole('link', { name: 'Home', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'OPTCG Sim' })).toBeVisible();
  });
});

/** The Settings chunk is replaced by a module that throws, or removed (as a deploy does). */
const SETTINGS_CHUNK = '**/assets/SettingsRoute-*.js';

test.describe('error boundary', () => {
  test('a route that throws shows the failure page; the header stays; the saved deck survives', async ({
    page,
  }, info) => {
    await serveArt(page);
    await importDeck(page, ROCKS);
    await expect.poll(async () => (await stored(page)).decks, { timeout: 15_000 }).toBe(1);
    await writeProbe(page);
    const before = await stored(page);
    expect(before).toEqual({ decks: 1, probe: 'kept' });

    await page.route(SETTINGS_CHUNK, (r) =>
      r.fulfill({
        contentType: 'text/javascript',
        body: 'export default function Settings() { throw new Error("boom in settings"); }',
      }),
    );
    const logged: string[] = [];
    page.on('console', (m) => m.type() === 'error' && logged.push(m.text()));
    await page.getByRole('link', { name: 'Settings', exact: true }).first().click();

    const h1 = page.getByRole('heading', { level: 1, name: 'Something went wrong on this page' });
    await expect(h1).toBeVisible();
    await expect(h1).toBeFocused();
    await expect(page.getByText('Your saved games and decks are not affected.')).toBeVisible();
    // The shell stays up.
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    expect(logged.filter((l) => l.includes('[optcg]'))).toHaveLength(1);
    await axe(page, info, 'error-page');

    // The data is untouched, and a route change resets the boundary.
    expect(await stored(page)).toEqual(before);
    await page.getByRole('banner').getByRole('link', { name: 'Decks' }).click();
    await expect(page.locator('main').getByRole('heading', { level: 1 })).not.toHaveText(
      'Something went wrong on this page',
    );
    await expect(page.getByText('Something went wrong on this page')).toHaveCount(0);
    expect(await stored(page)).toEqual(before);
  });

  test('Copy details puts release, build, route and the error line on the clipboard, and no stack', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.route(SETTINGS_CHUNK, (r) =>
      r.fulfill({
        contentType: 'text/javascript',
        body: 'export default function Settings() { throw new Error("boom in settings\\nat secret (/Users/x/y.ts:1:1)"); }',
      }),
    );
    await page.goto('./');
    await page.getByRole('link', { name: 'Settings', exact: true }).first().click();
    await expect(
      page.getByRole('heading', { level: 1, name: /Something went wrong/ }),
    ).toBeFocused();
    const live = (await (await page.request.get('./version.json')).json()) as { build: string };
    await page.getByRole('button', { name: 'Copy details' }).click();
    await expect(page.getByTestId('failure-status')).toHaveText('Details copied.');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text.split('\n')).toEqual([
      `OPTCG Sim 1.0.0 (build ${live.build})`,
      'Route: /settings',
      'Where: settings',
      'Error: Error: boom in settings',
    ]);
    expect(text).not.toMatch(/Users|secret|\.ts:/);
  });

  test('without a clipboard the details appear in a text box to copy by hand', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined });
    });
    await page.route(SETTINGS_CHUNK, (r) =>
      r.fulfill({
        contentType: 'text/javascript',
        body: 'export default function Settings() { throw new Error("no clipboard"); }',
      }),
    );
    await page.goto('./');
    await page.getByRole('link', { name: 'Settings', exact: true }).first().click();
    await page.getByRole('button', { name: 'Copy details' }).click();
    const box = page.getByLabel('Details to send with a report');
    await expect(box).toBeVisible();
    await expect(box).toHaveValue(/Error: Error: no clipboard/);
    await expect(page.getByTestId('failure-status')).toHaveText(
      'Select the details below and copy them.',
    );
  });

  test('a chunk an update removed says the app was updated, with one Reload that works', async ({
    page,
  }, info) => {
    await page.goto('./');
    await page.route(SETTINGS_CHUNK, (r) => r.abort());
    await page.getByRole('link', { name: 'Settings', exact: true }).first().click();
    const h1 = page.getByRole('heading', { level: 1, name: 'The app was updated' });
    await expect(h1).toBeFocused();
    await expect(page.getByText('Reload to get the new version.')).toBeVisible();
    await expect(page.locator('main').getByRole('button')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Copy details' })).toHaveCount(0);
    await axe(page, info, 'app-updated');
    await page.unroute(SETTINGS_CHUNK);
    await page.getByRole('button', { name: 'Reload' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  });
});

test.describe('offline line', () => {
  test('says it once when the browser goes offline, and is gone when it comes back', async ({
    page,
    context,
  }) => {
    await page.goto('./settings');
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
    const line = page.getByTestId('offline-line');
    await expect(line).toHaveAttribute('role', 'status');
    await expect(line).toBeEmpty();
    await context.setOffline(true);
    await expect(line).toHaveText(
      'You are offline. Everything works; card art you have not seen yet shows as text.',
    );
    await context.setOffline(false);
    await expect(line).toBeEmpty();
  });
});

test.describe('head and icons', () => {
  test('the manifest, favicon and icons are served, and every <link> in the page resolves', async ({
    page,
  }) => {
    await page.goto('./');
    const hrefs = await page.$$eval(
      'link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]',
      (els) => els.map((e) => (e as HTMLLinkElement).href),
    );
    expect(hrefs).toHaveLength(3);
    for (const href of hrefs) expect((await page.request.get(href)).status(), href).toBe(200);
    const manifestUrl = hrefs.find((h) => h.endsWith('manifest.webmanifest'))!;
    const manifest = (await (await page.request.get(manifestUrl)).json()) as {
      start_url: string;
      scope: string;
      icons: { src: string; type: string }[];
    };
    expect(new URL(manifest.start_url, manifestUrl).pathname).toBe('/optcg-sim/');
    expect(new URL(manifest.scope, manifestUrl).pathname).toBe('/optcg-sim/');
    for (const icon of manifest.icons) {
      const res = await page.request.get(new URL(icon.src, manifestUrl).href);
      expect(res.status(), icon.src).toBe(200);
      expect(res.headers()['content-type']).toContain('image/png');
    }
    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
  });
});

/** Records every Content-Security-Policy violation the page reports, and the browser's console lines. */
async function watchCsp(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      (window as unknown as { __csp: string[] }).__csp.push(
        `${e.violatedDirective} ${e.blockedURI}`,
      ),
    );
  });
  const consoleLines: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) consoleLines.push(m.text());
  });
  return {
    violations: async () => [
      ...(await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? [])),
      ...consoleLines,
    ],
  };
}

test.describe('Content-Security-Policy', () => {
  test('the built page carries the policy, and it blocks a request to an unlisted origin', async ({
    page,
  }) => {
    const csp = await watchCsp(page);
    await page.goto('./');
    const policy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain('https://optcgapi.com');
    const blocked = await page.evaluate(() =>
      fetch('https://example.com/').then(
        () => 'allowed',
        () => 'blocked',
      ),
    );
    expect(blocked).toBe('blocked');
    expect((await csp.violations()).join('\n')).toContain('connect-src');
  });

  test('home, a Rookie turn (AI worker), the builder and a drill run with no violation, and the image fallback holds', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const csp = await watchCsp(page);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // Home, with art served: images from the allowed host load.
    await serveArt(page);
    await page.goto('./cards');
    await expect(page.locator('.face[data-art="image"]').first()).toBeVisible({ timeout: 20_000 });

    // A Rookie turn: the AI answers from its worker, so a blocked worker would stall here.
    await startGame(page, 'seed=202&first=me&speed=4');
    // Our first Main Phase, then answer whatever we owe until the AI's turn has come and gone and
    // the second Main Phase is ours (a hang guard of 40 decisions; the worker must have played).
    let mains = 0;
    for (let i = 0; i < 40 && mains < 2; i++) {
      const k = await nextDecision(page, 60_000);
      if (k === 'chooseFirst') await page.locator('#first-btn').click();
      else if (k === 'mulligan') await page.locator('#keep-btn').click();
      else if (k === 'main') {
        mains++;
        if (mains === 1) await playMainPhase(page);
      } else if (k === 'order') await page.locator('#order-0').click();
      else if (k === 'choose') await resolveChoose(page);
      else if (k === 'optional') await page.locator('#skip-btn').click();
      else if (k === 'trigger') await page.locator('#trigger-hand').click();
      else if (k === 'counter' || k === 'block') await page.locator('#take-hit').click();
      else if (k === 'over') break;
      else throw new Error(`Unexpected decision ${k}`);
    }
    expect(mains).toBe(2);

    // The builder.
    await importDeck(page, ROCKS);
    await expect(page.getByLabel('Deck checks')).toContainText('50 cards (50)');

    // A drill item.
    await page.goto('./drills/mulligan/run?source=bank&count=5&sid=e2e-m10-csp');
    await expect(page.getByRole('heading', { level: 1, name: /Keep or redraw/ })).toBeFocused();

    // The fallback: every art host fails, the card is drawn as text.
    await page.unroute(/https:\/\/(optcgapi\.com|optcg-api\.arjunbansal-ai\.workers\.dev)\/.*/);
    await page.route(/https:\/\/optcgapi\.com\/.*/, (r) => r.abort());
    await page.goto('./cards');
    await expect(page.locator('.face[data-art="text"]').first()).toBeVisible({ timeout: 20_000 });

    expect(await csp.violations()).toEqual([]);
    expect(errors).toEqual([]);
  });
});
