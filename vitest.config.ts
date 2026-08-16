import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The specs under e2e/ belong to Playwright, which has its own runner.
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
    },
    snapshotFormat: {
      maxOutputLength: Number.MAX_SAFE_INTEGER,
    },
  },
});
