/**
 * M10 WP1: the store is off the first paint's critical path. `initStore` runs in parallel with the
 * render and marks the store ready; the routes that read saved data wait under `StoreGate` (heading
 * and one polite status first, the page after); the rest never wait. Deterministic: the IndexedDB
 * open is held and released by the test (a promise), the 3 s cap runs on a fake clock, and the
 * markup is rendered to a string before and after (no sleeps). The swap in a real browser, with
 * focus, is `app/e2e/first-paint.spec.ts`.
 *
 * Reverts, each failing a test below: `initStore` that does not call `markStoreReady` (the ready and
 * the memory-fallback tests); a gate that renders its children while not ready (the "page absent"
 * test); a gate that omits the status (the "announced once" test); `main.tsx` awaiting `initStore`
 * before `render` (the main.tsx source test); a reader that is not re-read after ready (the stale
 * tests).
 */
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readLethalProgress } from '../src/play/coach/profile.ts';
import { appProgress } from '../src/progress/store.ts';
import { m9Route } from '../src/routes/m9.ts';
import { IdbStore } from '../src/store/idb.ts';
import { getStore } from '../src/store/index.ts';
import { initStore, resetStoreForTests, storeStatus } from '../src/store/open.ts';
import { isStoreReady, markStoreReady, storeWanted, whenStoreReady } from '../src/store/ready.ts';
import { StoreGate } from '../src/store/StoreGate.tsx';
import { LETHAL_KEY } from '../src/store/validate.ts';
import {
  IdbTimingStore,
  LocalTimingStore,
  MemoryTimingStore,
  TimingTracker,
  timingStore,
  type TimingEnv,
} from '../src/tutorial/timing.ts';
import { FakeStorage } from './store-support.ts';

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

const body = createElement('p', { id: 'page-body' }, 'page body');
const gate = (path: string) =>
  renderToStaticMarkup(createElement(StoreGate, { path, children: body }));

/** A factory whose `open` is held until `release()`: the database opens when the test says so. */
function heldFactory() {
  const real = new IDBFactory();
  let release!: () => void;
  const released = new Promise<void>((r) => (release = r));
  const factory = {
    open(name: string, version?: number) {
      const held: Record<string, unknown> = {};
      void released.then(() => {
        const req = real.open(name, version);
        const bind = (k: 'onsuccess' | 'onerror' | 'onupgradeneeded' | 'onblocked') =>
          (req[k] = (e: Event) => (held[k] as ((e: Event) => void) | undefined)?.(e) as never);
        bind('onsuccess');
        bind('onerror');
        bind('onupgradeneeded');
        bind('onblocked');
        Object.defineProperty(held, 'result', { get: () => req.result });
        Object.defineProperty(held, 'error', { get: () => req.error });
        Object.defineProperty(held, 'transaction', { get: () => req.transaction });
      });
      return held as unknown as IDBOpenDBRequest;
    },
  } as unknown as IDBFactory;
  return { real, factory, release };
}

beforeEach(() => resetStoreForTests());
afterEach(() => {
  vi.useRealTimers();
  resetStoreForTests();
});

describe('the gate', () => {
  it('before ready: the heading and a skeleton render, the page does not', () => {
    for (const [path, h1] of [
      ['/play', 'Play'],
      ['/tutorial', 'Tutorial'],
      ['/decks', 'Decks'],
      ['/reviews', 'Reviews'],
      ['/reviews/abc', 'Review'],
      ['/progress', 'Progress'],
      ['/settings', 'Settings'],
      ['/drills/lethal/run', 'Drills'],
      ['/learn/L05', 'Lesson'],
    ] as const) {
      const html = gate(path);
      expect(html, path).toContain(`<h1 id="page-title" tabindex="-1">${h1}</h1>`);
      expect(html, path).not.toContain('page body');
    }
  });

  it('announces once: one polite status, "Opening your saved data…"', () => {
    const html = gate('/play');
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).toContain('Opening your saved data…');
    // The wait is not announced as an alert, and the region is NOT aria-busy (M10-R11: some readers skip a busy region's status).
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('aria-busy');
  });

  it('after ready: the page, no heading of its own, no status', () => {
    markStoreReady();
    expect(gate('/play')).toBe('<p id="page-body">page body</p>');
  });

  it('a route that paints without the store is never held', () => {
    for (const p of ['/', '/cards', '/meta', '/rules', '/about', '/learn', '/nowhere'])
      expect(gate(p), p).toBe('<p id="page-body">page body</p>');
  });

  it('a fallback replaces the skeleton but keeps the heading', () => {
    const html = renderToStaticMarkup(
      createElement(StoreGate, {
        path: '/decks',
        fallback: createElement('p', null, 'Custom wait'),
        children: body,
      }),
    );
    expect(html).toContain('>Decks</h1>');
    expect(html).toContain('Custom wait');
    expect(html).not.toContain('Opening your saved data');
  });
});

describe('storeWanted and the route table', () => {
  it('lists the gated routes and no others', () => {
    for (const p of [
      '/play',
      '/tutorial',
      '/decks',
      '/decks/new',
      '/reviews',
      '/reviews/x',
      '/progress',
      '/settings',
      '/drills',
      '/drills/lethal',
      '/drills/lethal/run',
      '/learn/L05',
    ])
      expect(storeWanted(p), p).toBe(true);
    for (const p of [
      '/',
      '/cards',
      '/meta',
      '/meta/matchups',
      '/learn',
      '/learn/',
      '/rules',
      '/rules/cr/7-1-4-1/show',
      '/about',
      '/nowhere',
    ])
      expect(storeWanted(p), p).toBe(false);
  });

  it('agrees with the pages App.tsx gates (GATED_M9, and the Guard `gated` flags)', () => {
    const app = read('../src/App.tsx');
    const set = /GATED_M9[^=]*= new Set\(\[([^\]]*)\]\)/.exec(app)![1]!;
    const gated = new Set([...set.matchAll(/'([^']+)'/g)].map((m) => m[1]!));
    for (const p of [
      '/meta',
      '/meta/matchups',
      '/learn',
      '/drills',
      '/drills/lethal',
      '/drills/lethal/run',
      '/rules',
      '/rules/cr/7-1-4-1',
      '/rules/cr/7-1-4-1/show',
      '/progress',
    ]) {
      const page = m9Route(p)!.page;
      expect(gated.has(page), p).toBe(storeWanted(p));
    }
  });
});

describe('main.tsx renders before the store opens', () => {
  it('calls render, then initStore, and never awaits it', () => {
    const main = read('../src/main.tsx');
    expect(main).not.toMatch(/await\s+initStore|initStore\(\)\s*\.then/);
    expect(main.indexOf('.render(')).toBeGreaterThan(-1);
    expect(main.indexOf('.render(')).toBeLessThan(main.indexOf('void initStore()'));
  });
});

describe('initStore marks ready', () => {
  it('held IndexedDB: not ready and status "opening" (no notice) until released, then ready', async () => {
    const { factory, release } = heldFactory();
    const done = initStore({ factory, storage: new FakeStorage() });
    await Promise.resolve();
    expect(isStoreReady()).toBe(false);
    expect(storeStatus().kind).toBe('opening');
    let woke = false;
    void whenStoreReady().then(() => (woke = true));
    expect(gate('/play')).toContain('Opening your saved data');
    release();
    await done;
    expect(isStoreReady()).toBe(true);
    expect(woke).toBe(true);
    expect(storeStatus().kind).toBe('indexeddb');
    expect(getStore().kind).toBe('indexeddb');
    expect(gate('/play')).toBe('<p id="page-body">page body</p>');
  });

  it('a database that never opens: after the 3 s cap (fake clock) the memory store and ready', async () => {
    vi.useFakeTimers();
    const silent = { open: () => ({}) as IDBOpenDBRequest } as unknown as IDBFactory;
    const done = initStore({ factory: silent, storage: new FakeStorage() });
    await vi.advanceTimersByTimeAsync(2999);
    expect(isStoreReady()).toBe(false);
    expect(gate('/play')).toContain('Opening your saved data');
    await vi.advanceTimersByTimeAsync(1);
    await done;
    expect(isStoreReady()).toBe(true);
    expect(storeStatus().kind).toBe('memory');
    expect(getStore().kind).toBe('memory');
    expect(gate('/play')).toBe('<p id="page-body">page body</p>');
  });

  it('no IndexedDB at all: ready at once, in memory', async () => {
    await initStore({ factory: null, storage: new FakeStorage() });
    expect(isStoreReady()).toBe(true);
    expect(storeStatus().kind).toBe('memory');
  });
});

describe('no reader returns stale data after ready', () => {
  const env: TimingEnv = {
    appVersion: '0',
    engineVersion: '0',
    tutorialVersion: 't',
    settings: {
      reducedMotion: false,
      aiPace: '2x',
      singleKeyShortcuts: true,
      cardAnnouncements: 'standard',
    },
  };

  it('tutorial timing, lethal progress and the progress document are the stored ones once ready', async () => {
    // What an earlier visit left in IndexedDB.
    const { real, factory, release } = heldFactory();
    const seed = await IdbStore.open(real);
    const tracker = TimingTracker.start({ now: () => 1000 }, new MemoryTimingStore(), env);
    const run = tracker.snapshot();
    await seed.timing.set(run.runId, run);
    await seed.progress.set(LETHAL_KEY, [{ game: 1, turn: 3, furthest: 'tier2' }]);
    seed.close();

    const done = initStore({ factory, storage: new FakeStorage() });
    await Promise.resolve();
    // Not ready: the readers see nothing (the empty value), never another store's data.
    expect(timingStore()).toBeInstanceOf(LocalTimingStore);
    expect(readLethalProgress()).toEqual([]);

    release();
    await done;
    expect(timingStore()).toBeInstanceOf(IdbTimingStore);
    expect(
      timingStore()
        .load()
        .map((r) => r.runId),
    ).toEqual([run.runId]);
    expect(readLethalProgress()).toEqual([{ game: 1, turn: 3, furthest: 'tier2' }]);
    // A write after ready goes to the store and reads back.
    await appProgress().get();
    timingStore().save([...timingStore().load()]);
    expect(timingStore().load()).toHaveLength(1);
  });
});
