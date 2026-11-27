/**
 * M10 WP0: the wiring the later packages share (no browser; App.tsx is read as text because its
 * routes are lazy). The route exists, the shell and each route sit in an ErrorBoundary, the routes
 * that read saved data sit in a StoreGate, the footer links to About, and the extracted pieces
 * render. WP6 turns the boundary test into a real failure test; WP1 does the same for the gate.
 * Reverts, each failing its test: delete the `/about` branch; drop the ErrorBoundary from Guard or
 * the shell; drop the StoreGate from Guard; remove the footer link.
 */
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AboutRoute from '../src/about/AboutRoute.tsx';
import { Footer } from '../src/Footer.tsx';
import { ErrorBoundary } from '../src/shell/ErrorBoundary.tsx';
import { NotFound } from '../src/shell/NotFound.tsx';
import { StoreGate } from '../src/store/StoreGate.tsx';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

describe('M10 wiring in App.tsx', () => {
  it('routes /about to a lazy AboutRoute', () => {
    expect(app).toContain("lazy(() => import('./about/AboutRoute.tsx'))");
    expect(app).toMatch(/path === '\/about'/);
    expect(app).toContain('<AboutRoute />');
  });
  it('mounts an ErrorBoundary around the shell and every route (through Guard)', () => {
    expect(app).toMatch(/<ErrorBoundary scope="shell">/);
    expect(app).toMatch(/<ErrorBoundary scope=\{name\}>/);
    // The Suspense of every lazy route is Guard's own: no route renders outside one.
    expect((app.match(/<Suspense /g) ?? []).length).toBe(1);
    expect((app.match(/<Guard /g) ?? []).length).toBeGreaterThanOrEqual(12);
  });
  it('gates the routes that read saved data, and only those', () => {
    expect(app).toContain('<StoreGate path={path}>');
    for (const name of ['play', 'review', 'tutorial', 'decks', 'settings', 'reviews', 'lesson'])
      expect(app, name).toMatch(new RegExp(`<Guard name="${name}" path=\\{path\\} gated>`));
    for (const name of ['cards', 'about', 'home'])
      expect(app, name).toMatch(new RegExp(`<Guard name="${name}" path=\\{path\\}>`));
    expect(app).toMatch(
      /GATED_M9[^=]*= new Set\(\['drills', 'drill-start', 'drill-run', 'progress'\]\)/,
    );
  });
  it('uses NotFound for an unknown path', () => {
    expect(app).toContain('<NotFound />');
    expect(app).not.toContain('Page not found');
  });
});

describe('the shared pieces', () => {
  it('export a StoreGate and an ErrorBoundary that render their children (the gate for a path that needs no store; WP1 fills the rest, WP6 the boundary)', () => {
    expect(typeof StoreGate).toBe('function');
    const inner = createElement('p', null, 'page body');
    expect(
      renderToStaticMarkup(createElement(StoreGate, { path: '/cards', children: inner })),
    ).toBe('<p>page body</p>');
    expect(
      renderToStaticMarkup(createElement(ErrorBoundary, { scope: 'x', children: inner })),
    ).toBe('<p>page body</p>');
  });
  it('render the About heading (focus target) and the unchanged not-found page', () => {
    const about = renderToStaticMarkup(createElement(AboutRoute));
    expect(about).toMatch(/<h1 id="page-title" tabindex="-1">About<\/h1>/);
    expect(renderToStaticMarkup(createElement(NotFound))).toBe(
      '<main class="page" id="main"><h1>Page not found</h1><p>There is nothing at this address.</p></main>',
    );
  });
  it('puts an About link after the unchanged legal notice in the footer', () => {
    const footer = renderToStaticMarkup(createElement(Footer));
    const notice =
      'OPTCG Sim is an unofficial, non-commercial fan tool, not affiliated with or endorsed by Bandai, Shueisha, or Toei Animation. One Piece and all card names, text, and art belong to their respective owners.';
    expect(footer).toContain(notice);
    expect(footer.indexOf('>About<')).toBeGreaterThan(footer.indexOf(notice));
    expect(footer).toMatch(/href="[^"]*\/about"/);
  });
});
