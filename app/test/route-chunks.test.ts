import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ROUTE_LABELS,
  routeEntries,
  staticClosure,
  type Manifest,
} from '../../scripts/bundle-routes.ts';

// M10 WP2: what a production build puts on the first-paint path and on each page, read from the build's
// own manifest (a real `vite build` into a temp directory, so no stale app/dist is trusted). The build is the
// slow part (a few seconds); the hang guard below is not a time assertion.
const root = fileURLToPath(new URL('../..', import.meta.url));
let out = '';
let manifest: Manifest;

beforeAll(() => {
  out = mkdtempSync(join(tmpdir(), 'optcg-chunks-'));
  execFileSync('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir', '--logLevel', 'error'], {
    cwd: join(root, 'app'),
    stdio: 'pipe',
  });
  manifest = JSON.parse(readFileSync(join(out, '.vite/manifest.json'), 'utf8')) as Manifest;
}, 180_000);

afterAll(() => {
  if (out) rmSync(out, { recursive: true, force: true });
});

const keyOf = (src: string) =>
  Object.keys(manifest).find((k) => manifest[k]!.src === src || k === src)!;
const closureOf = (key: string) => staticClosure(manifest, key);

describe('initial bundle', () => {
  it('is one JavaScript file: React jsx-runtime is not hoisted into a second initial chunk', () => {
    // Revert check: remove `codeSplitting.groups` from app/vite.config.ts and this is 2 files (and 3 with the runtime helper).
    const { entryKey } = routeEntries(manifest);
    const files = [...closureOf(entryKey)]
      .map((k) => manifest[k]!.file)
      .filter((f) => f.endsWith('.js'));
    expect(files).toHaveLength(1);
  });
});

describe('what the first paint and the read-only pages do not load', () => {
  // The rules digest (185 KB raw, 60 KB gz) is fetched with a dynamic import when a page asks for it.
  const digest = () => keyOf('src/rules/data.ts');

  it('keeps the rules digest a lazy entry that no chunk imports statically', () => {
    const key = digest();
    expect(manifest[key]!.isDynamicEntry).toBe(true);
    const importers = Object.keys(manifest).filter((k) =>
      (manifest[k]!.imports ?? []).includes(key),
    );
    expect(importers).toEqual([]);
  });

  it('Home, the Learn hub, About and Rules do not pull it in', () => {
    const { entryKey } = routeEntries(manifest);
    const pages: Record<string, string> = {
      'Home (the initial bundle)': entryKey,
      'Learn hub': 'src/learn/LearnRoute.tsx',
      About: 'src/about/AboutRoute.tsx',
      Rules: 'src/rules/RulesRoute.tsx',
    };
    for (const [name, key] of Object.entries(pages)) {
      expect(manifest[key], `${name} is in the manifest`).toBeDefined();
      expect(closureOf(key).has(digest()), `${name} imports the rules digest`).toBe(false);
    }
  });

  it('keeps card data out of every static closure: sets load per set on demand', () => {
    const { entryKey, keys } = routeEntries(manifest);
    for (const key of [entryKey, ...keys]) {
      const sets = [...closureOf(key)].filter((k) => k.includes('cards/data/sets/'));
      expect(sets, `${key} imports a card set statically`).toEqual([]);
    }
  });
});

describe('route table', () => {
  it('names every lazy page, so the table never prints a raw file name', () => {
    const { keys } = routeEntries(manifest);
    const unnamed = keys.filter((k) => !(k in ROUTE_LABELS));
    expect(unnamed).toEqual([]);
  });
});
