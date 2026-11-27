/**
 * M10 WP4: the audit's route manifest (`app/e2e/support/audit-routes.ts`) covers every route, and only
 * routes. App.tsx and routes/m9.ts are read as text: every path literal (`path === '/x'`,
 * `startsWith('/x/')`, a `case 'x':` head in the M9 table) must have a manifest entry, and every entry's
 * path must be handled by a route (the not-found entry by none). Reverts, each failing here: add
 * `path === '/newroute'` to App.tsx with no entry; delete the `/about` entry; give an entry a path no
 * route handles.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AUDIT_DEEP, AUDIT_ROUTES, AUDIT_VISION } from '../e2e/support/audit-routes.ts';
import { m9Route } from '../src/routes/m9.ts';

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

/** Path literals of App.tsx: exact (`path === '/x'`) and prefix (`startsWith('/x/')`). */
export function appLiterals(src: string): { exact: string[]; prefix: string[] } {
  const exact = [...src.matchAll(/path === '(\/[^']*)'/g)].map((m) => m[1]!);
  const prefix = [...src.matchAll(/startsWith\('(\/[^']*)'\)/g)].map((m) => m[1]!);
  return { exact: [...new Set(exact)], prefix: [...new Set(prefix)] };
}

/** The first path segment of each `case 'x':` in routes/m9.ts. */
export function m9Heads(src: string): string[] {
  return [...src.matchAll(/case '([a-z-]+)':/g)].map((m) => `/${m[1]}`);
}

const app = appLiterals(read('../src/App.tsx'));
const heads = m9Heads(read('../src/routes/m9.ts'));

const handled = (path: string): boolean =>
  app.exact.includes(path) ||
  app.prefix.some((p) => path.startsWith(p)) ||
  m9Route(path) !== null ||
  path === '/';

describe('route manifest', () => {
  it('reads the routes it should (a guard against the scan going blind)', () => {
    expect(app.exact).toEqual(expect.arrayContaining(['/play', '/tutorial', '/cards', '/about']));
    expect(app.prefix).toEqual(expect.arrayContaining(['/reviews/', '/decks/', '/learn/']));
    expect(heads).toEqual(expect.arrayContaining(['/meta', '/drills', '/rules', '/progress']));
  });

  it('has an entry for every exact path in App.tsx', () => {
    const have = new Set(AUDIT_ROUTES.map((e) => e.path));
    const missing = app.exact.filter((p) => !have.has(p));
    expect(missing, `App.tsx routes with no audit entry: ${missing.join(', ')}`).toEqual([]);
  });

  it('has an entry under every prefix route in App.tsx', () => {
    const missing = app.prefix.filter((p) => !AUDIT_ROUTES.some((e) => e.path.startsWith(p)));
    expect(missing, `App.tsx prefix routes with no audit entry: ${missing.join(', ')}`).toEqual([]);
  });

  it('has an entry under every head of routes/m9.ts, and one deeper where the route has parts', () => {
    const missing = heads.filter(
      (h) => !AUDIT_ROUTES.some((e) => e.path === h || e.path.startsWith(`${h}/`)),
    );
    expect(missing, `routes/m9.ts heads with no audit entry: ${missing.join(', ')}`).toEqual([]);
    // Every page of the M9 table is reached by some entry.
    const pages = new Set(AUDIT_ROUTES.map((e) => m9Route(e.path)?.page).filter(Boolean));
    for (const p of [
      'meta',
      'meta-matchups',
      'meta-guide',
      'learn',
      'drills',
      'drill-start',
      'drill-run',
      'rules',
      'rules-entry',
      'rules-show',
      'progress',
    ])
      expect(pages.has(p as never), `M9 page ${p} has no audit entry`).toBe(true);
  });

  it('names every entry once, and every entry path is handled by a route (the unknown one by none)', () => {
    const names = AUDIT_ROUTES.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
    for (const e of AUDIT_ROUTES) {
      if (e.unknown) expect(handled(e.path), `${e.name} ${e.path} must be unhandled`).toBe(false);
      else expect(handled(e.path), `${e.name}: no route handles ${e.path}`).toBe(true);
    }
    expect(AUDIT_ROUTES.some((e) => e.unknown)).toBe(true);
  });

  it('keeps the deep and vision sets to named entries (eight and three)', () => {
    const names = new Set(AUDIT_ROUTES.map((e) => e.name));
    expect([...AUDIT_DEEP].filter((n) => !names.has(n))).toEqual([]);
    expect([...AUDIT_VISION].filter((n) => !names.has(n))).toEqual([]);
    expect(AUDIT_DEEP.size).toBe(8);
    expect(AUDIT_VISION.size).toBe(3);
  });

  it('covers the states the spec names', () => {
    const names = new Set(AUDIT_ROUTES.map((e) => e.name));
    for (const n of [
      'board-explore',
      'board-target',
      'board-count',
      'board-pick',
      'board-order',
      'board-defend',
      'tutorial',
      'decks-builder',
      'decks-import',
      'decks-export',
      'cards-inspector',
      'review-flag',
      'review-study',
      'rules-show-me',
      'drill-mulligan',
      'drill-lethal',
      'drill-counter',
      'drill-don',
      'about',
      'not-found',
      'error-page',
      'shortcut-sheet',
      'coach-panel',
    ])
      expect(names.has(n), `entry ${n}`).toBe(true);
  });
});
