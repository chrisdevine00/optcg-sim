/**
 * M10 WP6: the About page and its credits. The page reads a version object and a date, so every
 * claim is checked with fixed inputs and no clock. Reverts that fail these tests: edit the notice in
 * one of the three places (footer, About, README); add a host to IMAGE_SOURCES without a credit;
 * regenerate CREDITS.md by hand; change the 60-day rule in meta/stale.ts.
 */
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AboutView } from '../src/about/AboutRoute.tsx';
import {
  ACCESSIBILITY_CLAIM,
  ACCESSIBILITY_LIMITS,
  CREDITS,
  LICENCE_LINE,
  NOTICE,
  OWN_HOSTS,
  PRIVACY,
  creditsMarkdown,
} from '../src/about/credits.ts';
import { dayWords, parseVersion, type VersionInfo } from '../src/about/version.ts';
import { IMAGE_SOURCES } from '../src/art/sources.ts';
import { Footer } from '../src/Footer.tsx';

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
const text = (html: string) =>
  squash(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&'),
  );

const VERSION: VersionInfo = {
  release: '1.0.0',
  build: 'abc123def456',
  commit: '0123456789abcdef0123456789abcdef01234567',
  builtAt: '2026-11-27T09:30:00.000Z',
  cardsThrough: 'OP-17',
  cardCount: 3654,
  metaAsOf: '2026-10-28',
  engine: '0.5.16',
};
const view = (version: VersionInfo | null | undefined, today: string) =>
  renderToStaticMarkup(createElement(AboutView, { version, today: new Date(today) }));

describe('the unofficial notice', () => {
  it('is the same words in the footer, the About page and the README', () => {
    const footer = text(renderToStaticMarkup(createElement(Footer)));
    const about = text(view(VERSION, '2026-11-27'));
    const readme = squash(read('../../README.md'));
    expect(footer).toContain(NOTICE);
    expect(about).toContain(NOTICE);
    expect(readme).toContain(NOTICE);
  });
});

describe('About page', () => {
  const html = view(VERSION, '2026-11-27');
  it('has one main and one h1 that can take focus, and the eight sections in order', () => {
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('<h1 id="page-title" tabindex="-1">About</h1>');
    const h2s = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map((m) => m[1]);
    expect(h2s).toEqual([
      'About',
      'Unofficial notice',
      'Version',
      'Credits',
      'Third-party licences',
      'Accessibility',
      'Your data',
      'Report a problem',
    ]);
  });
  it('shows the version line: release, build, built date, cards through and count, meta as-of, engine', () => {
    const t = text(html);
    expect(t).toContain('Release 1.0.0');
    expect(t).toContain('Build abc123def456');
    expect(t).toContain('Commit 0123456789ab');
    expect(t).toContain('Built 27 Nov 2026');
    expect(t).toContain('Cards through OP-17, 3,654 cards');
    expect(t).toContain('Tournament lists as of 28 Oct 2026');
    expect(t).toContain('Rules engine 0.5.16');
  });
  it('says the licence is not chosen yet, and does not claim one', () => {
    expect(text(html)).toContain(LICENCE_LINE);
    expect(html).not.toMatch(/MIT License|Apache License/);
  });
  it('states the privacy promises in plain words and links to Settings', () => {
    const t = text(html);
    for (const p of PRIVACY) expect(t).toContain(text(p));
    expect(html).toContain('href="/settings"');
    expect(t).toMatch(/no account/i);
    expect(t).toMatch(/no analytics/i);
  });
  // M10-R8: what the art host learns is said, not implied. Revert: drop either sentence from PRIVACY.
  it('says an image address names the card, that the page sends no referrer and where the app comes from', () => {
    const t = text(html);
    expect(t).toContain('An image address names the card');
    expect(t).toContain('The page sends no referrer');
    expect(t).toContain('GitHub Pages');
  });
  it('links the licences file and the issue tracker', () => {
    expect(html).toContain('third-party.txt');
    expect(html).toContain('github.com/chrisdevine00/optcg-sim/issues');
  });
  it('shows a loading line, then a plain message when there is no version.json', () => {
    expect(text(view(undefined, '2026-11-27'))).toContain('Reading the version');
    expect(text(view(null, '2026-11-27'))).toContain('Version details could not be loaded');
  });
});

describe('the staleness line (same 60-day rule as the Meta Explorer)', () => {
  // metaAsOf 2026-10-28: day 60 is 2026-12-27 (still fresh), day 61 is 2026-12-28.
  it('is absent on day 60 and present on day 61, with the date', () => {
    expect(view(VERSION, '2026-12-27')).not.toContain('are out of date');
    const stale = text(view(VERSION, '2026-12-28'));
    expect(stale).toContain('The tournament lists are out of date');
    expect(stale).toContain('28 Oct 2026');
  });
  it('is words as well as colour (a bold lead-in)', () => {
    expect(view(VERSION, '2027-03-01')).toContain('<strong>Out of date.</strong>');
  });
});

describe('credits', () => {
  it('names every source the plan lists, each with a link and a terms sentence', () => {
    const names = CREDITS.map((c) => c.name).join(' | ');
    for (const n of [
      'optcgapi.com',
      'Limitless',
      'opmetagame',
      'Shonen TCG',
      'Bounty TCG',
      'Comprehensive Rules',
      'Inter',
      'Fraunces',
    ]) {
      expect(names, n).toContain(n);
    }
    for (const c of CREDITS) {
      expect(c.url, c.id).toMatch(/^https:\/\//);
      expect(c.terms.length, c.id).toBeGreaterThan(20);
    }
    expect(names).not.toMatch(/guidepup/i);
  });
  it('says the rules text is our paraphrase and the fonts are OFL 1.1 with their copyright lines', () => {
    const rules = CREDITS.find((c) => c.id === 'rules')!;
    expect(rules.role).toContain('version 1.2.1');
    expect(rules.role).toContain('paraphrase');
    for (const id of ['inter', 'fraunces']) {
      const c = CREDITS.find((x) => x.id === id)!;
      expect(c.terms).toContain('SIL Open Font License 1.1');
      expect(c.terms).toMatch(/Copyright \d{4} The \w+ Project Authors/);
    }
  });
  it('covers every host in IMAGE_SOURCES (fails when a host is added without a credit)', () => {
    const covered = new Set(CREDITS.flatMap((c) => c.hosts));
    for (const [name, s] of Object.entries(IMAGE_SOURCES)) {
      expect(covered.has(new URL(s.base).host), `${name}: ${s.base}`).toBe(true);
    }
  });
  it('covers every host in the data-source list (docs/content/sources.md)', () => {
    const covered = new Set(CREDITS.flatMap((c) => c.hosts));
    const hosts = new Set(
      [...read('../../docs/content/sources.md').matchAll(/https?:\/\/([A-Za-z0-9.-]+)/g)].map(
        (m) => m[1]!,
      ),
    );
    const missing = [...hosts].filter((h) => !covered.has(h) && !OWN_HOSTS.includes(h));
    expect(missing).toEqual([]);
  });
  it('is rendered on the page, one entry per credit', () => {
    const html = view(VERSION, '2026-11-27');
    for (const c of CREDITS) expect(html).toContain(`href="${c.url}"`);
  });
  it('is what docs/legal/CREDITS.md says (regenerate with `npx tsx scripts/licences.ts --credits`)', () => {
    expect(read('../../docs/legal/CREDITS.md')).toBe(creditsMarkdown());
  });
});

describe('version.json parsing and dates', () => {
  it('accepts a real file and rejects an HTML 404 body or a non-object', () => {
    expect(parseVersion({ ...VERSION, cardsFetchedAt: 'x' })).toEqual(VERSION);
    expect(parseVersion('<!doctype html>')).toBeNull();
    expect(parseVersion(null)).toBeNull();
    expect(parseVersion({})).toBeNull();
  });
  it('writes a day as "27 Nov 2026" and leaves a non-date alone', () => {
    expect(dayWords('2026-11-27T09:30:00.000Z')).toBe('27 Nov 2026');
    expect(dayWords('2026-01-05')).toBe('5 Jan 2026');
    expect(dayWords('soon')).toBe('soon');
  });
});

// M10-R2: the claim is what was done. Revert: reword it to "built to WCAG 2.2 AA" in any one place.
describe('the accessibility claim', () => {
  const html = view(VERSION, '2026-11-27');
  it('is the same sentence on the About page, in the README and in the CHANGELOG', () => {
    expect(ACCESSIBILITY_CLAIM).toBe(
      'Tested against WCAG 2.2 AA with automated checks on every route; manual screen-reader passes pending.',
    );
    expect(text(html)).toContain(ACCESSIBILITY_CLAIM);
    expect(squash(read('../../README.md'))).toContain(ACCESSIBILITY_CLAIM);
    expect(squash(read('../../CHANGELOG.md'))).toContain(ACCESSIBILITY_CLAIM);
  });
  it('lists the known limits on the About page and in the CHANGELOG', () => {
    expect(ACCESSIBILITY_LIMITS).toHaveLength(3);
    const log = squash(read('../../CHANGELOG.md'));
    for (const l of ACCESSIBILITY_LIMITS) {
      expect(text(html), l).toContain(text(l));
      expect(log, l).toContain(l);
    }
    expect(squash(ACCESSIBILITY_LIMITS.join(' '))).toMatch(
      /card art[\s\S]*1\.4\.12[\s\S]*VoiceOver/,
    );
  });
  it('no longer says "Built to WCAG 2.2 AA"', () => {
    expect(squash(read('../../CHANGELOG.md'))).not.toMatch(/Built to WCAG/);
  });
});
