/**
 * M10 WP0: a static server for `app/dist` that behaves like GitHub Pages for what the performance
 * runs measure: the site under `/optcg-sim/`, gzip (and brotli with `--br`) for text types,
 * `cache-control: public, max-age=600` on everything, and 404 with the body of `404.html` (or
 * `index.html`, which deploy.yml copies to 404.html) for an unknown path.
 *
 * `--spa` answers a path with no file extension that is not a file with `index.html` and status 200.
 * Pages itself answers 404 there (the router lives in the 404 page), but Lighthouse refuses to
 * audit a document with a 4xx status, so the Lighthouse run uses `--spa`; the bytes are identical.
 *
 *   tsx scripts/serve-dist.ts [port] [--br] [--spa]     (port 0 or none: a free one)
 *
 * It prints `http://localhost:<port>/optcg-sim/` on its first line. No dependency.
 */
import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';

export const BASE = '/optcg-sim/';
export const DIST = join(import.meta.dirname, '../app/dist');

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};
const COMPRESSIBLE = /^(text\/|application\/json|application\/manifest|image\/svg)/;

export interface ServeOptions {
  dist?: string;
  port?: number;
  brotli?: boolean;
  spa?: boolean;
}

/** Starts the server; resolves with it and the port it listens on. */
export function serveDist(opts: ServeOptions = {}): Promise<{ server: Server; port: number }> {
  const dist = opts.dist ?? DIST;
  if (!existsSync(join(dist, 'index.html')))
    throw new Error(
      `No build at ${dist}: run \`npm run build\` first (this server builds nothing).`,
    );
  const cache = new Map<string, { raw: Buffer; gz?: Buffer; br?: Buffer }>();
  const load = (file: string, type: string) => {
    let hit = cache.get(file);
    if (!hit) {
      const raw = readFileSync(file);
      const squeeze = COMPRESSIBLE.test(type);
      hit = {
        raw,
        gz: squeeze ? gzipSync(raw) : undefined,
        br: squeeze && opts.brotli ? brotliCompressSync(raw) : undefined,
      };
      cache.set(file, hit);
    }
    return hit;
  };
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let rel = decodeURIComponent(url.pathname);
    let status = 200;
    let file: string | null = null;
    if (rel.startsWith(BASE)) {
      rel = rel.slice(BASE.length);
      const candidate = normalize(
        join(dist, rel === '' || rel.endsWith('/') ? rel + 'index.html' : rel),
      );
      // Stay inside dist (a path with .. would otherwise read any file).
      if (
        (candidate === dist || candidate.startsWith(dist + sep)) &&
        existsSync(candidate) &&
        statSync(candidate).isFile()
      )
        file = candidate;
    }
    if (!file) {
      const wantsPage = extname(rel) === '';
      const page = ['404.html', 'index.html'].map((n) => join(dist, n)).find((f) => existsSync(f));
      if (opts.spa && wantsPage && url.pathname.startsWith(BASE)) file = join(dist, 'index.html');
      else {
        file = page ?? null;
        status = 404;
      }
    }
    if (!file) {
      res.writeHead(404).end('Not found');
      return;
    }
    const type =
      status === 404 ? TYPES['.html']! : (TYPES[extname(file)] ?? 'application/octet-stream');
    const body = load(file, type);
    const accept = String(req.headers['accept-encoding'] ?? '');
    const headers: Record<string, string | number> = {
      'content-type': type,
      'cache-control': 'public, max-age=600',
      vary: 'accept-encoding',
    };
    let out = body.raw;
    if (body.br && /\bbr\b/.test(accept)) {
      out = body.br;
      headers['content-encoding'] = 'br';
    } else if (body.gz && /\bgzip\b/.test(accept)) {
      out = body.gz;
      headers['content-encoding'] = 'gzip';
    }
    headers['content-length'] = out.length;
    res.writeHead(status, headers);
    res.end(req.method === 'HEAD' ? undefined : out);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(opts.port ?? 0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: typeof addr === 'object' && addr ? addr.port : (opts.port ?? 0) });
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const portArg = args.find((a) => /^\d+$/.test(a));
  const { port } = await serveDist({
    port: portArg ? Number(portArg) : 0,
    brotli: args.includes('--br'),
    spa: args.includes('--spa'),
  });
  console.log(`http://127.0.0.1:${port}${BASE}`);
}
