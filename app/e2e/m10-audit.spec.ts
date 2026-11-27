/**
 * M10 WP4: the WCAG 2.2 AA audit, automated. Every entry of `support/audit-routes.ts` at both design sizes
 * gets axe (WCAG 2.2 A and AA, zero violations; `incomplete` saved), the level-one heading (found, and focused
 * on a first load where the page says it takes focus), the Tab sweep (no stop fully hidden under another
 * element: 2.4.11) and the target-size check (2.5.8). The `AUDIT_DEEP` states also get 200% and 400% zoom
 * (1.4.4, 1.4.10), the 1.4.12 text-spacing override, forced colours, reduced motion, and the three
 * `AUDIT_VISION` states four colour-vision emulations (screenshots under `.cache/m10/`, read by hand: WP5).
 *
 * Results go to `test-results/audit-<project>.json` (read by `scripts/a11y-audit-report.ts`) whatever the
 * verdict. Nothing here asserts a time. Reverts that fail it: remove `lang`-style structure, a label or a
 * heading from any page (axe), `tabIndex` from a page `<h1>` (focus), `min-width: 24px` from a small control
 * (targets), `overflow-wrap` from a long-word container (zoom).
 */
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { AUDIT_DEEP, AUDIT_ROUTES, AUDIT_VISION, type AuditEntry } from './support/audit-routes.ts';
import {
  axeAll,
  focusHeading,
  forced,
  navFit,
  recordIncomplete,
  reduced,
  spacing,
  tabSweep,
  targets,
  VISIONS,
  vision,
  zoom,
} from './support/audit.ts';
import { noArt } from './m9-support.ts';

/** Merged into the project's file on every write: a failed test restarts its worker, which loses memory. */
function save(project: string, name: string, record: unknown) {
  const file = `test-results/audit-${project}.json`;
  let all: Record<string, unknown> = {};
  try {
    all = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  } catch {
    /* first write */
  }
  all[name] = record;
  mkdirSync('test-results', { recursive: true });
  writeFileSync(file, JSON.stringify(all, null, 1));
}

async function reach(page: Page, info: TestInfo, e: AuditEntry) {
  await noArt(page);
  if (e.setup && e.own) await e.setup(page, info);
  else {
    // A route change inside the app (what a link does), not a first load: the heading must take focus.
    await page.goto(e.path === '/about' ? './' : './about');
    await page.locator('h1').first().waitFor();
    const from = (await page.locator('h1').first().innerText()).trim();
    await page.evaluate(
      (to) => {
        const base = '/optcg-sim';
        window.history.pushState(null, '', base + to);
        window.dispatchEvent(new PopStateEvent('popstate'));
      },
      `${e.path}${e.query ? `?${e.query}` : ''}`,
    );
    await page.waitForFunction(
      (prev) => {
        const t = (document.querySelector('h1')?.textContent ?? '').trim();
        return t !== '' && t !== prev;
      },
      from,
      { timeout: 30_000 },
    );
  }
  await page.locator('h1, #decision, [role="dialog"]').first().waitFor({ timeout: 30_000 });
  // Lazy routes and the settled state: the page is quiet when its heading is up and the network is idle.
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(350);
}

test.describe('WCAG 2.2 AA audit (M10 WP4)', () => {
  for (const e of AUDIT_ROUTES) {
    test(`${e.name}`, async ({ page }, info) => {
      test.setTimeout(150_000);
      const project = info.project.name;
      const base = page.viewportSize()!;
      const size = `${base.width}x${base.height}`;
      const problems: string[] = [];
      const deep = AUDIT_DEEP.has(e.name);
      const rec: Record<string, unknown> = { name: e.name, path: e.path, project, size, deep };

      await reach(page, info, e);
      rec['url'] = new URL(page.url()).pathname + new URL(page.url()).search;
      rec['title'] = await page.title();

      // Axe.
      const ax = await axeAll(page, e.name);
      recordIncomplete(project, e.name, ax.incomplete);
      rec['axe'] = { violations: ax.violations, incomplete: ax.incomplete };
      problems.push(...ax.violations);

      // The heading.
      const h = await focusHeading(page, e.heading);
      rec['heading'] = { ...h, noFocus: e.noFocus ?? null };
      if (!h.found && !e.board) problems.push(`${e.name}: no <h1> matching ${String(e.heading)}`);
      if (h.found && !h.focused && !e.noFocus)
        problems.push(`${e.name}: the <h1> "${h.text}" does not hold focus on load`);

      // Tab sweep (2.4.11).
      const sweep = await tabSweep(page);
      const fully = sweep.stops.filter((s) => s.obscured === 'fully');
      rec['tabs'] = {
        stops: sweep.stops.length,
        ended: sweep.ended,
        fully: fully.map((s) => s.name),
        partly: sweep.stops.filter((s) => s.obscured === 'partly').map((s) => s.name),
        offscreen: sweep.stops.filter((s) => s.obscured === 'offscreen').length,
        unnamed: sweep.stops.filter((s) => !s.name).length,
      };
      for (const s of fully)
        problems.push(`${e.name}: focus stop "${s.name}" is fully hidden (2.4.11)`);
      for (const s of sweep.stops.filter((x) => !x.name))
        problems.push(`${e.name}: a tab stop (${s.tag}) has no name (4.1.2)`);

      // Targets (2.5.8).
      const t = await targets(page);
      rec['targets'] = t;
      for (const f of t.failing)
        problems.push(
          `${e.name}: target "${f.name}" ${f.w}x${f.h} at (${f.x},${f.y}) under 24 px with a neighbour (2.5.8)`,
        );

      if (deep) {
        // Zoom: 200% and 400% (1.4.4, 1.4.10).
        const z: unknown[] = [];
        for (const f of [2, 4]) {
          const r = await zoom(page, f, base, !!e.board || e.name === 'cards-inspector');
          z.push(r);
          if (!e.board && r.overflowX > 1)
            problems.push(`${e.name}: scrolls sideways at ${f * 100}% (${r.overflowX} px, 1.4.10)`);
          for (const c of r.clipped) problems.push(`${e.name}: at ${f * 100}%, ${c}`);
        }
        rec['zoom'] = z;

        // Text spacing (1.4.12).
        const sp = await spacing(page);
        rec['spacing'] = sp;
        for (const c of sp.clipped) problems.push(`${e.name}: text spacing clips ${c} (1.4.12)`);
        for (const c of sp.overlaps)
          problems.push(`${e.name}: text spacing overlaps ${c} (1.4.12)`);

        // Forced colours (1.4.11, 2.4.7).
        const fc = await forced(page);
        rec['forced'] = fc;
        for (const n of fc.noRing)
          problems.push(`${e.name}: forced colours, no focus ring on ${n}`);

        // Reduced motion (2.3.3, the project's own rule).
        const rm = await reduced(page);
        rec['reduced'] = rm;
        for (const r of rm.running) problems.push(`${e.name}: reduced motion, still running ${r}`);

        // Colour vision (1.4.1): screenshots only.
        if (AUDIT_VISION.has(e.name)) {
          const shots: string[] = [];
          for (const k of VISIONS) shots.push(await vision(page, k, e.name, size));
          rec['vision'] = shots;
        }
      }

      const known = problems.filter((p) => e.known?.some((k) => k.match.test(p)));
      const open = problems.filter((p) => !known.includes(p));
      save(project, e.name, {
        ...rec,
        problems: open,
        known: known.map((p) => ({ finding: p, why: e.known!.find((k) => k.match.test(p))!.why })),
      });
      expect(open, `${e.name} at ${size}`).toEqual([]);
    });
  }

  test('the nine-item nav at 1280 and 1920, and at 200% zoom (M9 open item)', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== '720p', 'one pass measures every size');
    await noArt(page);
    await page.goto('./about');
    await page.locator('header.app-header').waitFor();
    const sizes: [string, number, number][] = [
      ['1280x720', 1280, 720],
      ['1280 at 200% (640x360 CSS px)', 640, 360],
      ['1280 at 400% (320x180 CSS px)', 320, 180],
      ['1920x1080', 1920, 1080],
      ['1920 at 200% (960x540 CSS px)', 960, 540],
      ['1536x864 (a common laptop)', 1536, 864],
      ['1024x768', 1024, 768],
    ];
    const out: Record<string, unknown> = {};
    for (const [label, w, h] of sizes) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(200);
      out[label] = await navFit(page);
    }
    mkdirSync('test-results', { recursive: true });
    writeFileSync('test-results/audit-nav.json', JSON.stringify(out, null, 1));
    // The requirement is the owner's decision; the check is that the header never makes the page scroll
    // sideways at 1280 and above, and no link is clipped there.
    for (const label of ['1280x720', '1920x1080', '1536x864 (a common laptop)']) {
      const n = out[label] as Awaited<ReturnType<typeof navFit>>;
      expect(n.pageOverflow, `${label}: page scrolls sideways`).toBeLessThanOrEqual(1);
      expect(n.truncated, `${label}: clipped nav links`).toEqual([]);
    }
  });
});
