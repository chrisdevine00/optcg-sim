import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'app/e2e',
  timeout: 120_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173/optcg-sim/',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: '720p', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } },
  ],
  webServer: {
    command: 'npm run build -w @optcg/app && npm run preview',
    url: 'http://localhost:4173/optcg-sim/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
