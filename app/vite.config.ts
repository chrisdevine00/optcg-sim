import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const here = fileURLToPath(new URL('.', import.meta.url));

/** Every built file the app shell precaches (M6b-6): pages, chunks, styles, fonts; not maps. */
function shellFiles(outDir: string): string[] {
  const walk = (d: string): string[] =>
    readdirSync(d).flatMap((f) => {
      const p = join(d, f);
      return statSync(p).isDirectory() ? walk(p) : [relative(outDir, p).split('\\').join('/')];
    });
  return walk(outDir)
    .filter((f) => !/\.map$|^sw\.js|^\.vite\/|^version\.json$/.test(f))
    .sort();
}

/** What data a build holds (ARCHITECTURE §5 "App updates"), for the About page and bug reports. */
function versionInfo(build: string) {
  const root = resolve(here, '..');
  const manifest = JSON.parse(readFileSync(join(root, 'cards/data/manifest.json'), 'utf8')) as {
    newestSet: string;
    fetchedAt: string;
    cardCount: number;
  };
  const meta = JSON.parse(readFileSync(join(root, 'docs/research/meta-lists.json'), 'utf8')) as {
    asOf: string;
  };
  // The release is the app's SemVer (M10 WP6); the engine's own version stays separate (it versions records).
  const release = (
    JSON.parse(readFileSync(join(here, 'package.json'), 'utf8')) as { version: string }
  ).version;
  const engine = /ENGINE_VERSION = '([^']+)'/.exec(
    readFileSync(join(root, 'engine/src/record.ts'), 'utf8'),
  )?.[1];
  // M10-R1: the commit this build was made from. The deploy workflow passes the commit CI passed
  // (BUILD_COMMIT); a local build asks git; neither is an empty string, never a failure.
  let commit = process.env.BUILD_COMMIT ?? '';
  if (!commit) {
    try {
      commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    } catch {
      commit = '';
    }
  }
  return {
    release,
    build,
    commit,
    builtAt: new Date().toISOString(),
    cardsThrough: manifest.newestSet,
    cardCount: manifest.cardCount,
    cardsFetchedAt: manifest.fetchedAt,
    metaAsOf: meta.asOf,
    engine,
  };
}

/**
 * Builds src/sw.ts as one self-contained classic script at <base>/sw.js. A service worker registered as a
 * classic script cannot `import`, so it must not share chunks with the app (M1-review service-worker check).
 * The worker gets the build's file list and an id hashed from their contents (M6b-6): a new deploy is a
 * new worker, which precaches the new shell and waits for the app's update prompt.
 */
function serviceWorker(): Plugin {
  let outDir = '';
  return {
    name: 'optcg-service-worker',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir;
    },
    async closeBundle() {
      const files = shellFiles(outDir);
      const hash = createHash('sha256');
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const id = hash.digest('hex').slice(0, 12);
      writeFileSync(join(outDir, 'version.json'), JSON.stringify(versionInfo(id), null, 2) + '\n');
      await build({
        configFile: false,
        logLevel: 'warn',
        define: {
          __BUILD_ID__: JSON.stringify(id),
          __SHELL_FILES__: JSON.stringify(files),
        },
        build: {
          outDir,
          emptyOutDir: false,
          copyPublicDir: false,
          sourcemap: true,
          target: 'es2022',
          lib: {
            entry: resolve(here, 'src/sw.ts'),
            formats: ['iife'],
            name: 'optcgSw',
            fileName: () => 'sw.js',
          },
        },
      });
    },
  };
}

// GitHub Pages serves the site under /<repo>/.
export default defineConfig({
  base: '/optcg-sim/',
  // The e2e build (PINNED_META=1, playwright.config.ts) uses the pinned meta, as the unit tests do,
  // so a weekly meta PR does not move what the e2e tests expect (M6b-0).
  ...(process.env.PINNED_META
    ? {
        resolve: {
          alias: [
            {
              find: /^(?:\.\.\/)+docs\/research\/meta-lists\.json$/,
              replacement: resolve(here, '../ai/test/fixtures/meta-lists.pinned.json'),
            },
          ],
        },
      }
    : {}),
  plugins: [react(), serviceWorker()],
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    sourcemap: true,
    // The manifest lets scripts/bundle-budget.ts measure the initial JS (PROMPT.md: under 300 KB gzipped).
    manifest: true,
    rolldownOptions: {
      output: {
        // M10 WP2: one initial file. Left alone, Rolldown hoists React's jsx-runtime (shared by every lazy
        // route) into a second initial chunk, a second gzip stream (+0.8 KB: 83.5 to 84.3 KB). Naming the
        // `$initial` modules (all that the entry reaches statically) as one group folds it back.
        codeSplitting: { groups: [{ name: 'index', tags: ['$initial'] }] },
      },
    },
  },
});
