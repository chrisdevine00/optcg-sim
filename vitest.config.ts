import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['{engine,cards,ai,app}/{src,test}/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
