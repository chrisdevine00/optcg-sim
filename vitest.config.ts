import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['{engine,cards,ai,app}/{src,test}/**/*.test.{ts,tsx}'],
    environment: 'node',
    // Every effect script, loaded once per test file (scripts load per set in the app; M6b-0).
    setupFiles: ['./test-setup/scripts.ts'],
  },
});
