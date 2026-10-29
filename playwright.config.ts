import { defineConfig, devices } from '@playwright/test';

// Several working copies can run e2e on one machine: E2E_PORT keeps each on its own preview server,
// so a run never reuses another copy's build (review M4a, "test-setup trap").
const PORT = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: 'app/e2e',
  timeout: 120_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/optcg-sim/`,
    trace: 'retain-on-failure',
    // Image requests must reach page.route; the image service worker is unit-tested separately.
    serviceWorkers: 'block',
  },
  projects: [
    { name: '720p', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } },
    {
      name: '1080p',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
  ],
  webServer: {
    command: `npm run build -w @optcg/app && cd app && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/optcg-sim/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
