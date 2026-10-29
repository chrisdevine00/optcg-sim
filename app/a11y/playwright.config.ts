/**
 * Scripted screen-reader passes (accessibility.md §11.2). `nvda-*` projects need Windows with NVDA
 * installed by `npx @guidepup/setup install` (the a11y-nvda workflow); `dry` runs the same script
 * with Playwright's keyboard and no screen reader, to check the harness locally.
 */
import { devices } from '@playwright/test';
import { withGuidepup } from '@guidepup/playwright';

const baseURL = process.env.A11Y_BASE_URL ?? 'http://localhost:4173/optcg-sim/';
const shared = {
  actionTimeout: 5000,
  baseURL,
  serviceWorkers: 'block' as const,
  viewport: { width: 1280, height: 720 },
};

const config = withGuidepup({
  testDir: '.',
  outputDir: 'test-results/playwright',
  timeout: 60 * 60 * 1000,
  retries: 0,
  reporter: [['list']],
  projects: [
    {
      name: 'nvda-chrome',
      testMatch: /\.nvda\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome', ...shared },
    },
    {
      name: 'nvda-firefox',
      testMatch: /\.nvda\.spec\.ts$/,
      use: { ...devices['Desktop Firefox'], ...shared },
    },
    {
      name: 'voiceover-webkit',
      testMatch: /\.voiceover\.spec\.ts$/,
      use: { ...devices['Desktop Safari'], ...shared },
    },
    {
      name: 'dry',
      testMatch: /\.dry\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], ...shared },
    },
  ],
});

// The dry run has no screen reader, so it can run headless.
for (const p of config.projects ?? []) if (p.name === 'dry') p.use = { ...p.use, headless: true };

export default config;
