import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const here = fileURLToPath(new URL('.', import.meta.url));

/**
 * Builds src/sw.ts as one self-contained classic script at <base>/sw.js. A service worker registered as a
 * classic script cannot `import`, so it must not share chunks with the app (M1-review service-worker check).
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
      await build({
        configFile: false,
        logLevel: 'warn',
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
  plugins: [react(), serviceWorker()],
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    sourcemap: true,
    // The manifest lets scripts/bundle-budget.ts measure the initial JS (PROMPT.md: under 300 KB gzipped).
    manifest: true,
  },
});
