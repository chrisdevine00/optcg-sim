/**
 * M10 WP6: the offline line. The component reads `navigator.onLine` and the window's `online` and
 * `offline` events; the suite has no DOM, so the events go to a stand-in window (an EventTarget) and
 * the markup is rendered from the pure view. Real events in a real browser: `m10-release.spec.ts`.
 * Reverts: render the text always and the markup test fails; subscribe to `document` instead of
 * `window` and the events test fails; drop the unsubscribe and the cleanup test fails.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  OFFLINE_TEXT,
  OfflineLine,
  OfflineView,
  isOffline,
  subscribe,
} from '../src/shell/OfflineLine.tsx';

afterEach(() => vi.unstubAllGlobals());

function stubBrowser(onLine: boolean) {
  const win = new EventTarget();
  const nav = { onLine };
  vi.stubGlobal('window', win);
  vi.stubGlobal('navigator', nav);
  return { win, nav };
}

describe('OfflineView', () => {
  it('is an empty live region while online (it must exist before its text does)', () => {
    const html = renderToStaticMarkup(createElement(OfflineView, { offline: false }));
    expect(html).toMatch(/^<div class="offline-line" role="status"[^>]*><\/div>$/);
  });
  it('carries the plan\'s sentence once, as role="status", while offline', () => {
    const html = renderToStaticMarkup(createElement(OfflineView, { offline: true }));
    expect(html).toContain('role="status"');
    expect(html).toContain(OFFLINE_TEXT);
    expect(html.split(OFFLINE_TEXT)).toHaveLength(2);
    expect(OFFLINE_TEXT).toBe(
      'You are offline. Everything works; card art you have not seen yet shows as text.',
    );
  });
  it('renders the live region on the server too (the first snapshot is "online")', () => {
    expect(renderToStaticMarkup(createElement(OfflineLine))).toContain('role="status"');
  });
});

describe('the online and offline events', () => {
  it('reports navigator.onLine === false as offline, and unknown as online', () => {
    stubBrowser(false);
    expect(isOffline()).toBe(true);
    stubBrowser(true);
    expect(isOffline()).toBe(false);
  });
  it('calls the listener when the window fires offline and online, and not after unsubscribing', () => {
    const { win, nav } = stubBrowser(true);
    const seen: boolean[] = [];
    const stop = subscribe(() => seen.push(isOffline()));
    nav.onLine = false;
    win.dispatchEvent(new Event('offline'));
    nav.onLine = true;
    win.dispatchEvent(new Event('online'));
    expect(seen).toEqual([true, false]);
    stop();
    win.dispatchEvent(new Event('offline'));
    expect(seen).toHaveLength(2);
  });
});
