/**
 * Content-Security-Policy for the production build (M10 WP6). GitHub Pages cannot set headers, so the
 * policy is a `<meta http-equiv>` in `app/dist/index.html`, written after the build (`postbuild`).
 * The policy is built from the same list of art hosts the app uses (`IMAGE_SOURCES`), so a new host
 * is allowed in exactly one place. Only enabled sources are allowed: a switched-off host is blocked.
 *
 *   tsx scripts/csp.ts    inserts the policy into app/dist/index.html (idempotent)
 */
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { IMAGE_SOURCES } from '../app/src/art/sources.ts';

type Source = { base: string; enabled: boolean };

/** The policy text for a set of image sources. */
export function buildCsp(sources: Record<string, Source> = IMAGE_SOURCES): string {
  const imgHosts = Object.values(sources)
    .filter((s) => s.enabled)
    .map((s) => new URL(s.base).origin);
  return [
    "default-src 'self'",
    "script-src 'self'",
    // React sets style attributes; the boot style in index.html is inline.
    "style-src 'self' 'unsafe-inline'",
    ['img-src', "'self'", 'data:', 'blob:', ...imgHosts].join(' '),
    "font-src 'self' data:",
    // The AI runs in module workers from the same origin.
    "worker-src 'self' blob:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

const MARK = 'http-equiv="Content-Security-Policy"';

/** `html` with the policy meta as the first thing in `<head>` (a policy applies to what follows it). */
export function withCsp(html: string, csp: string = buildCsp()): string {
  if (html.includes(MARK)) return html;
  const tag = `<meta ${MARK} content="${csp}" />`;
  if (!/<head>/.test(html)) throw new Error('csp: no <head> in index.html');
  return html.replace(/<head>\s*/, (m) => `${m}${tag}\n    `);
}

if (process.argv[1] && import.meta.filename === realpathSync(process.argv[1])) {
  const file = join(import.meta.dirname, '../app/dist/index.html');
  writeFileSync(file, withCsp(readFileSync(file, 'utf8')));
  console.log('csp: wrote the policy into app/dist/index.html');
}
