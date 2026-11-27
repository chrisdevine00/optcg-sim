/**
 * M10 WP6: the error boundary's contract, without a DOM (the suite runs in node; the real throw, the
 * focus, the header staying up and the deck surviving are `app/e2e/m10-release.spec.ts`). Reverts:
 * delete `getDerivedStateFromError` and the first test fails; delete `getDerivedStateFromProps` and the
 * reset test fails; put the stack in `detailsText` and the details test fails; make `isChunkError`
 * return false and the chunk tests fail.
 */
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { VersionInfo } from '../src/about/version.ts';
import { Boundary, detailsText } from '../src/shell/ErrorBoundary.tsx';
import { isChunkError } from '../src/shell/ChunkError.ts';

const boom = new TypeError('Cannot read properties of undefined (reading "id")');
const child = createElement('p', null, 'the page');

function boundaryWith(error: Error | null, resetKey = '/decks', scope = 'decks') {
  const b = new Boundary({ children: child, resetKey, scope });
  b.state = { error, key: resetKey };
  return b;
}

describe('Boundary', () => {
  it('turns a render error into state (getDerivedStateFromError)', () => {
    expect(Boundary.getDerivedStateFromError(boom)).toEqual({ error: boom });
    // A thrown string or object is wrapped, so the page can still name it.
    expect(Boundary.getDerivedStateFromError('plain').error).toBeInstanceOf(Error);
  });

  it('renders its children when nothing has failed', () => {
    expect(renderToStaticMarkup(boundaryWith(null).render())).toBe('<p>the page</p>');
  });

  it('renders the failure page: a heading that can take focus, the reassurance, three actions', () => {
    const html = renderToStaticMarkup(boundaryWith(boom).render());
    expect(html).toContain('id="page-title" tabindex="-1">Something went wrong on this page</h1>');
    expect(html).toContain('Your saved games and decks are not affected.');
    expect(html).toContain('>Reload</button>');
    expect(html).toMatch(/<a class="btn" href="\/">Go home<\/a>/);
    expect(html).toContain('>Copy details</button>');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('the page');
  });

  it('clears the error when the route changes, and keeps it on the same route', () => {
    const failed = { error: boom, key: '/decks' };
    expect(Boundary.getDerivedStateFromProps({ resetKey: '/decks' }, failed)).toBeNull();
    expect(Boundary.getDerivedStateFromProps({ resetKey: '/play' }, failed)).toEqual({
      error: null,
      key: '/play',
    });
  });

  it('shows "The app was updated" with one Reload for a chunk that no longer exists', () => {
    const chunk = new TypeError(
      'Failed to fetch dynamically imported module: https://x.example/optcg-sim/assets/Decks-abc.js',
    );
    const html = renderToStaticMarkup(boundaryWith(chunk).render());
    expect(html).toContain('>The app was updated</h1>');
    expect(html).toContain('Reload to get the new version.');
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).not.toContain('Copy details');
    expect(html).not.toContain('Something went wrong');
  });

  it('never touches the store: the boundary does not import it', () => {
    const src = readFileSync(new URL('../src/shell/ErrorBoundary.tsx', import.meta.url), 'utf8');
    expect(src).not.toMatch(/from '\.\.\/store|from '\.\.\/session|IndexedDB|indexedDB/);
  });
});

describe('isChunkError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://x/assets/a.js', // Chrome
    'error loading dynamically imported module: https://x/assets/a.js', // Firefox
    'Importing a module script failed.', // Safari
    'Unable to preload CSS for /optcg-sim/assets/a.css', // Vite
    'Loading chunk 42 failed.',
  ])('is true for %s', (message) => {
    expect(isChunkError(new TypeError(message))).toBe(true);
  });
  it('is true for a ChunkLoadError by name', () => {
    expect(isChunkError(Object.assign(new Error('x'), { name: 'ChunkLoadError' }))).toBe(true);
  });
  it('is false for an ordinary error, a string and null', () => {
    expect(isChunkError(boom)).toBe(false);
    expect(isChunkError('Failed to fetch dynamically imported module')).toBe(false);
    expect(isChunkError(null)).toBe(false);
  });
});

describe('detailsText ("Copy details")', () => {
  const version: VersionInfo = {
    release: '1.0.0',
    build: 'abc123def456',
    builtAt: '',
    cardsThrough: '',
    cardCount: 0,
    metaAsOf: '',
    engine: '',
  };
  it('holds release, build, route, scope and the error name and first line, and nothing else', () => {
    const err = new RangeError('Invalid array length\n    at secret (/Users/someone/app.ts:1:1)');
    err.stack = 'RangeError: Invalid array length\n    at secret (/Users/someone/app.ts:1:1)';
    expect(detailsText({ version, route: '/decks/abc', scope: 'decks', error: err })).toBe(
      [
        'OPTCG Sim 1.0.0 (build abc123def456)',
        'Route: /decks/abc',
        'Where: decks',
        'Error: RangeError: Invalid array length',
      ].join('\n'),
    );
  });
  it('says unknown when version.json could not be read, and cuts a very long message', () => {
    const t = detailsText({
      version: null,
      route: '/',
      scope: 'shell',
      error: new Error('x'.repeat(1000)),
    });
    expect(t).toContain('OPTCG Sim unknown release (build unknown)');
    expect(t.split('\n').at(-1)!.length).toBeLessThan(330);
  });
});
