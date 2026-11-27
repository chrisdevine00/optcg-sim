import { describe, expect, it } from 'vitest';
import {
  describeRoute,
  overCaps,
  routeSizes,
  staticClosure,
  type Manifest,
} from '../../scripts/bundle-routes.ts';

// M10 WP2: the pure part of `check:bundle`. A synthetic manifest stands in for Vite's; sizes are by file name.
//   entry (initial) -> vendor (initial, static)
//   routeA -> shared (static), vendor (initial: not counted), routeB (static: a page that imports a page)
//   routeB -> shared, routeA (a cycle)
//   routeC -> its own chunk only, and routeD by dynamic import (loads later: not counted)
const manifest: Manifest = {
  'index.html': {
    file: 'assets/index.js',
    isEntry: true,
    imports: ['_vendor.js'],
    dynamicImports: [
      'src/a/RouteA.tsx',
      'src/c/RouteC.tsx',
      'src/d/RouteD.tsx',
      '../cards/data/sets/OP-01.json',
    ],
  },
  '_vendor.js': { file: 'assets/vendor.js', name: 'vendor', imports: ['index.html'] },
  '_shared.js': { file: 'assets/shared.js', name: 'shared', imports: ['_vendor.js'] },
  'src/a/RouteA.tsx': {
    file: 'assets/RouteA.js',
    name: 'RouteA',
    imports: ['_vendor.js', '_shared.js', 'src/b/RouteB.tsx'],
  },
  'src/b/RouteB.tsx': {
    file: 'assets/RouteB.js',
    name: 'RouteB',
    imports: ['_shared.js', 'src/a/RouteA.tsx'],
  },
  'src/c/RouteC.tsx': {
    file: 'assets/RouteC.js',
    name: 'RouteC',
    imports: ['_vendor.js'],
    dynamicImports: ['src/d/RouteD.tsx'],
  },
  'src/d/RouteD.tsx': { file: 'assets/RouteD.js', name: 'RouteD', imports: ['_shared.js'] },
  '../cards/data/sets/OP-01.json': { file: 'assets/OP-01.js', name: 'OP-01' },
};

const SIZES: Record<string, number> = {
  'assets/index.js': 50_000,
  'assets/vendor.js': 1000,
  'assets/shared.js': 4000,
  'assets/RouteA.js': 300,
  'assets/RouteB.js': 20,
  'assets/RouteC.js': 700,
  'assets/RouteD.js': 90,
  'assets/OP-01.js': 99_999,
};
const sizeOf = (f: string) => SIZES[f]!;
const byRoute = (rows: ReturnType<typeof routeSizes>) =>
  Object.fromEntries(rows.map((r) => [r.route, r]));

describe('routeSizes', () => {
  const rows = byRoute(routeSizes(manifest, sizeOf));

  it('lists the lazy pages only, not the per-set card data', () => {
    expect(Object.keys(rows).sort()).toEqual(['RouteA', 'RouteC', 'RouteD']);
  });

  it('counts a chunk shared by two routes for each of them', () => {
    // RouteA: itself + shared + RouteB (static import) ; RouteD: itself + shared.
    expect(rows.RouteA!.gz).toBe(300 + 4000 + 20);
    expect(rows.RouteD!.gz).toBe(90 + 4000);
    expect(rows.RouteA!.parts.map((p) => p.name)).toContain('shared');
    expect(rows.RouteD!.parts.map((p) => p.name)).toContain('shared');
  });

  it('does not count a chunk the initial bundle already holds', () => {
    for (const r of Object.values(rows)) expect(r.parts.map((p) => p.name)).not.toContain('vendor');
  });

  it("does not count another route's lazy chunk (a dynamic import)", () => {
    expect(rows.RouteC!.gz).toBe(700);
    expect(rows.RouteC!.parts.map((p) => p.name)).toEqual(['RouteC']);
  });

  it('terminates on a cycle', () => {
    expect([...staticClosure(manifest, 'src/a/RouteA.tsx')].sort()).toEqual([
      '_shared.js',
      '_vendor.js',
      'index.html',
      'src/a/RouteA.tsx',
      'src/b/RouteB.tsx',
    ]);
  });

  it('orders parts largest first and prints the breakdown', () => {
    expect(rows.RouteA!.parts.map((p) => p.name)).toEqual(['shared', 'RouteA', 'RouteB']);
    expect(describeRoute(rows.RouteA!, 5000)).toBe(
      'Route RouteA: 4.2 KB gz (shared 3.9 + RouteA 0.3 + RouteB 0.0), cap 4.9',
    );
  });
});

describe('overCaps', () => {
  const sized = routeSizes(manifest, sizeOf);

  it('fails a route over its cap and names the route and both numbers', () => {
    const failures = overCaps(sized, { RouteA: 4000 });
    expect(failures).toEqual(['Route RouteA: 4.2 KB gz is over its cap of 3.9 KB.']);
  });

  it('passes a route at its cap and never fails a route that has none', () => {
    expect(overCaps(sized, { RouteA: 4320 })).toEqual([]);
    expect(overCaps(sized, {})).toEqual([]);
  });
});
