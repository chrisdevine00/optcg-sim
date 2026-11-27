/**
 * M9 WP0: every new route has a page and a heading, the nav marks the current one, and `bankFor`
 * covers every drill. Nothing here has behaviour: the contracts the work packages build on.
 */
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DRILL_IDS, MIN_BANK, type DrillId } from '@optcg/ai';
import { bankFor } from '@optcg/ai/drills';
import { isCurrent, navItems } from '../src/Header.tsx';
import { DRILL_LESSON, DRILL_NAMES, DRILL_SLUGS, isDrillId } from '../src/drills/types.ts';
import { m9Route, ruleIdOf, type M9Page } from '../src/routes/m9.ts';
import { lessonById } from '../src/learn/lessons.ts';

const PAGES: Record<M9Page, () => Promise<{ default: (p: { path: string }) => ReactNode }>> = {
  meta: () => import('../src/meta/MetaRoute.tsx'),
  'meta-matchups': () => import('../src/meta/MatchupGrid.tsx'),
  'meta-guide': () => import('../src/meta/GuideRoute.tsx'),
  learn: () => import('../src/learn/LearnRoute.tsx'),
  drills: () => import('../src/drills/DrillsHome.tsx'),
  'drill-start': () => import('../src/drills/DrillStart.tsx'),
  'drill-run': () => import('../src/drills/DrillRun.tsx'),
  rules: () => import('../src/rules/RulesRoute.tsx'),
  'rules-entry': () => import('../src/rules/RuleEntry.tsx'),
  'rules-show': () => import('../src/rules/ShowMe.tsx'),
  progress: () => import('../src/progress/ProgressRoute.tsx'),
};

const PATHS: [string, M9Page, boolean][] = [
  ['/meta', 'meta', false],
  ['/meta/matchups', 'meta-matchups', false],
  ['/meta/OP17-039', 'meta-guide', false],
  ['/learn', 'learn', false],
  ['/drills', 'drills', false],
  ['/drills/mulligan', 'drill-start', false],
  ['/drills/lethal/run', 'drill-run', true],
  ['/rules', 'rules', false],
  ['/rules/cr/7-1-4-1', 'rules-entry', false],
  ['/rules/RL-18', 'rules-entry', false],
  ['/rules/item/17', 'rules-entry', false],
  ['/rules/cr/7-1-4-1/show', 'rules-show', true],
  ['/rules/RL-18/show', 'rules-show', true],
  ['/progress', 'progress', false],
];

describe('M9 routes', () => {
  it.each(PATHS)('%s is the %s page (full-screen: %s)', (path, page, full) => {
    expect(m9Route(path)).toEqual({ page, full });
    expect(m9Route(path + '/')).toEqual({ page, full });
  });

  it('leaves the existing routes alone', () => {
    for (const p of ['/', '/play', '/learn/L10-counter-or-take', '/reviews', '/decks', '/nope'])
      expect(m9Route(p)).toBeNull();
    expect(m9Route('/drills/lethal/other')).toBeNull();
  });

  it('reads a rule id out of the path, with its slash', () => {
    expect(ruleIdOf('/rules/cr/7-1-4-1')).toBe('cr/7-1-4-1');
    expect(ruleIdOf('/rules/cr/7-1-4-1/show')).toBe('cr/7-1-4-1');
    expect(ruleIdOf('/rules/RL-18/show')).toBe('RL-18');
    expect(ruleIdOf('/rules/item%2F17')).toBe('item/17');
  });

  it('every page has a stub with a heading that can take focus', async () => {
    for (const [path, page] of PATHS) {
      const mod = await PAGES[page]();
      const html = renderToStaticMarkup(createElement(mod.default, { path }));
      expect(html, path).toMatch(/<h1 id="page-title" tabindex="-1">[^<]+<\/h1>/);
      expect(html, path).toContain(`data-path="${path}"`);
    }
  });
});

describe('the nav', () => {
  it('is Home, Play, Learn, Meta, Decks, Cards, Reviews, Progress, Settings', () => {
    expect(navItems.map((n) => n.label)).toEqual([
      'Home',
      'Play',
      'Learn',
      'Meta',
      'Decks',
      'Cards',
      'Reviews',
      'Progress',
      'Settings',
    ]);
  });

  it('marks exactly the current item for each path', () => {
    const cases: [string, string][] = [
      ['/', '/'],
      ['/play', '/play'],
      ['/learn', '/learn'],
      ['/learn/L10-counter-or-take', '/learn'],
      ['/drills', '/learn'],
      ['/drills/don/run', '/learn'],
      ['/rules/cr/7-1-4-1', '/learn'],
      ['/meta', '/meta'],
      ['/meta/matchups', '/meta'],
      ['/meta/OP17-039', '/meta'],
      ['/decks/abc', '/decks'],
      ['/cards', '/cards'],
      ['/reviews/g1', '/reviews'],
      ['/progress', '/progress'],
      ['/settings', '/settings'],
    ];
    for (const [path, want] of cases) {
      const marked = navItems.filter((n) => isCurrent(path, n.to)).map((n) => n.to);
      expect(marked, path).toEqual([want]);
    }
  });
});

describe('drill contracts', () => {
  it('bankFor answers every DrillId (stubs are empty until WP2 and WP3)', () => {
    const all: Record<DrillId, true> = { mulligan: true, lethal: true, counter: true, don: true };
    for (const d of Object.keys(all) as DrillId[]) {
      const b = bankFor(d);
      expect(b.drill).toBe(d);
      expect(Array.isArray(b.items)).toBe(true);
    }
    expect(MIN_BANK).toBe(20);
  });

  it('the app copy of the drill ids equals the ai list, and each drill names a lesson that exists', () => {
    expect([...DRILL_SLUGS]).toEqual([...DRILL_IDS]);
    for (const d of DRILL_IDS) {
      expect(isDrillId(d)).toBe(true);
      expect(DRILL_NAMES[d]).toBeTruthy();
      expect(lessonById(DRILL_LESSON[d]), d).toBeDefined();
    }
    expect(isDrillId('lethal/run')).toBe(false);
  });
});
