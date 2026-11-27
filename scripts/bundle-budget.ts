/**
 * Fails the build when the JavaScript the first paint needs, or a route's own JavaScript, exceeds its budget.
 *  - Initial = the entry chunk plus every chunk it imports statically; lazy chunks (card sets, pages) are
 *    excluded. M10 WP2 lowered the cap from PROMPT.md's 300 KB gzipped to 100 KB (83.7 KB measured).
 *  - Per route (M10 WP2): each lazy page's chunk plus the chunks it imports statically that the initial bundle
 *    does not hold, from the manifest (the pure part is bundle-routes.ts). `ROUTE_CAPS` fails a route over its
 *    cap; a route without a cap is printed only. The two worker bundles are reported, not capped.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  describeRoute,
  kb,
  overCaps,
  routeEntries,
  routeSizes,
  staticClosure,
  type Manifest,
} from './bundle-routes.ts';

const BUDGET = 100 * 1024;

/**
 * Gzip cap per route, by the name the table prints. Play is the heaviest page (the game screen, the engine,
 * the AI's shared chunk and the review flow): its cap is the M10 WP2 measurement plus 10%, rounded up. Raise
 * a cap only with a DECISIONS entry that says what the route gained.
 */
export const ROUTE_CAPS: Record<string, number> = {
  Play: 215 * 1024,
};

const dist = join(import.meta.dirname, '../app/dist');
const manifest = JSON.parse(readFileSync(join(dist, '.vite/manifest.json'), 'utf8')) as Manifest;
const gz = (file: string) => gzipSync(readFileSync(join(dist, file))).length;

const { entryKey } = routeEntries(manifest);
const files = [...staticClosure(manifest, entryKey)]
  .map((k) => manifest[k]!.file)
  .filter((f) => f.endsWith('.js'));
const sizes = files.map((f) => ({ f, gz: gz(f) }));
const total = sizes.reduce((n, s) => n + s.gz, 0);
const lazy = Object.values(manifest).filter(
  (v) => v.file.endsWith('.js') && !files.includes(v.file),
).length;
console.log(
  `Initial JS: ${kb(total)} KB gzipped in ${files.length} file(s); ${lazy} lazy chunks excluded. Budget ${BUDGET / 1024} KB.`,
);
for (const s of sizes) console.log(`  ${s.f}: ${kb(s.gz)} KB`);

const routes = routeSizes(manifest, gz);
console.log(
  'Per route (own chunk plus the chunks it imports statically that the initial bundle lacks):',
);
for (const r of routes) console.log(`  ${describeRoute(r, ROUTE_CAPS[r.route])}`);

for (const w of readdirSync(join(dist, 'assets')).filter((f) => /worker.*\.js$/.test(f))) {
  console.log(
    `  Worker ${w.replace(/-[\w-]{8}\.js$/, '')}: ${kb(gz(`assets/${w}`))} KB gz (not capped)`,
  );
}

const failures = overCaps(routes, ROUTE_CAPS);
if (total > BUDGET)
  failures.push(`Initial JS is over budget (${kb(total)} KB > ${BUDGET / 1024} KB).`);
for (const f of failures) console.error(f);
if (failures.length > 0) process.exit(1);
