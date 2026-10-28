import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const here = fileURLToPath(new URL('.', import.meta.url));

// GitHub Pages serves the site under /<repo>/.
export default defineConfig({
  base: '/optcg-sim/',
  plugins: [react()],
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    sourcemap: true,
    // The manifest lets scripts/bundle-budget.ts measure the initial JS (PROMPT.md: under 300 KB gzipped).
    manifest: true,
    rollupOptions: {
      input: { main: resolve(here, 'index.html'), sw: resolve(here, 'src/sw.ts') },
      // The service worker must sit at the base path with a stable name so its scope covers the app.
      output: {
        entryFileNames: (chunk) => (chunk.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
});
