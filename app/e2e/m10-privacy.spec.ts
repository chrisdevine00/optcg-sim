/**
 * M10 WP6: the privacy statement is true of the build. Every request origin across Home, Setup, a
 * Rookie turn, the builder (import and save), a drill item, Meta, Rules, a progress export, Settings
 * and About is the app's own or one of the art hosts in `IMAGE_SOURCES`; no cookie is set; nothing is
 * stored outside localStorage, IndexedDB and Cache storage. The service worker is on, so its own
 * fetches (the shell precache, image caching) are recorded too.
 *
 * Revert: add a `fetch('https://example.com')` (or an `<img>` from it) to Home and the first test
 * fails with that origin named; the second test shows the recorder reports such a request.
 */
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { IMAGE_SOURCES } from '../src/art/sources.ts';
import { nextDecision, playMainPhase, resolveChoose, startGame } from './game-support.ts';

test.use({ serviceWorkers: 'allow' });

const ART_ORIGINS = Object.values(IMAGE_SOURCES).map((s) => new URL(s.base).origin);
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

/**
 * Records every http(s) request origin the context makes (pages, workers and the service worker), and
 * the Referer each request to an art host carried (M10-R8: none).
 */
const referers: string[] = [];
const refererChecks: Promise<void>[] = [];
function recordOrigins(context: BrowserContext): Set<string> {
  const origins = new Set<string>();
  context.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol === 'http:' || u.protocol === 'https:') origins.add(u.origin);
    if (ART_ORIGINS.includes(u.origin))
      refererChecks.push(r.allHeaders().then((h) => void referers.push(h['referer'] ?? '')));
  });
  return origins;
}

/** The origins that are neither the app's nor an art host. */
const offenders = (origins: Iterable<string>, app: string) =>
  [...origins].filter((o) => o !== app && !ART_ORIGINS.includes(o)).sort();

/** Art hosts are not reachable in CI: a generated 1x1 PNG stands in (context-level, so the service worker's fetches too). */
async function serveArtOnContext(context: BrowserContext) {
  await context.route(
    (url) => ART_ORIGINS.includes(url.origin),
    (r) =>
      r.fulfill({
        status: 200,
        contentType: 'image/png',
        body: PNG,
        headers: { 'access-control-allow-origin': '*' },
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

async function heading(page: Page, name: string | RegExp) {
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 });
}

test('every request across the app goes to the app or an art host; no cookie; storage only where promised', async ({
  page,
  context,
}) => {
  test.setTimeout(240_000);
  await serveArtOnContext(context);
  const origins = recordOrigins(context);

  // Home and the service worker taking control (it precaches the shell, then keeps images).
  await page.goto('./');
  await heading(page, 'OPTCG Sim');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
    timeout: 30_000,
  });
  await page.reload();

  // Setup.
  await page.goto('./play');
  await expect(page.getByRole('button', { name: /start/i }).first()).toBeVisible({
    timeout: 20_000,
  });

  // A Rookie turn.
  await startGame(page, 'seed=202&first=me&speed=4');
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

  // The builder: import, which autosaves.
  await page.goto('./decks');
  await page.getByRole('button', { name: 'New deck' }).click();
  await expect(page.locator('.builder')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('#import-text').fill(ROCKS);
  await page.getByRole('button', { name: /^Import \d+ cards$/ }).click();
  await expect(page.locator('#import-text')).toHaveCount(0);

  // A drill item, Meta, Rules.
  await page.goto('./drills/mulligan/run?source=bank&count=5&sid=e2e-m10-privacy');
  await heading(page, /Keep or redraw/);
  await page.goto('./meta');
  await heading(page, /Meta/);
  await page.goto('./rules');
  await heading(page, /Rules/);

  // Progress export (a download made in the page, no request).
  await page.goto('./progress');
  await heading(page, 'Progress');
  const exportBtn = page.getByRole('button', { name: 'Export progress only' });
  if (await exportBtn.isVisible()) {
    const [dl] = await Promise.all([page.waitForEvent('download'), exportBtn.click()]);
    expect(dl.suggestedFilename()).toMatch(/^optcg-sim-progress-/);
  }

  // Settings and About (which fetches version.json from the app's own origin).
  await page.goto('./settings');
  await heading(page, 'Settings');
  await page.goto('./about');
  await heading(page, 'About');
  await expect(page.getByTestId('about-version')).toBeVisible();

  const app = new URL(page.url()).origin;
  console.log('request origins:', [...origins].sort().join(', '));
  expect(offenders(origins, app)).toEqual([]);
  expect(origins.has(app)).toBe(true);

  // M10-R8: art was asked for, and no request to an art host carried a Referer (the page's
  // `<meta name="referrer" content="no-referrer">`; the service worker re-sends the page's request).
  // Revert: delete that meta tag and the Referer is the app's origin.
  await Promise.all(refererChecks);
  expect(referers.length, 'no art request was seen').toBeGreaterThan(0);
  expect(referers.filter((r) => r !== '')).toEqual([]);

  // No cookie, anywhere.
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => document.cookie)).toBe('');

  // Storage: localStorage, IndexedDB and Cache storage only (the service worker's caches).
  const stores = await page.evaluate(async () => ({
    session: sessionStorage.length,
    databases: (await indexedDB.databases()).map((d) => d.name),
    caches: await caches.keys(),
  }));
  expect(stores.session).toBe(0);
  expect(stores.databases).toEqual(['optcg-sim']);
  for (const c of stores.caches) expect(c, c).toMatch(/^optcg-(shell|images)-/);
});

test('the recorder reports a request to any other origin (the check can fail)', async ({
  page,
  context,
}) => {
  await context.route('https://example.com/**', (r) =>
    r.fulfill({ status: 200, contentType: 'image/png', body: PNG }),
  );
  const origins = recordOrigins(context);
  // A blank page has no policy; the build's own page would block this request by CSP (a second line of defence).
  await page.goto('about:blank');
  await page.setContent('<img src="https://example.com/leak.png">');
  await expect.poll(() => [...origins]).toContain('https://example.com');
  expect(offenders(origins, 'http://localhost:1')).toEqual(['https://example.com']);
});
