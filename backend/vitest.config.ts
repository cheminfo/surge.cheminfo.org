import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // A test here spawns the real surge, and only four of them may run at a
    // time, so a whole suite under coverage queues well past five seconds.
    testTimeout: 30_000,
    coverage: {
      include: ['src/**/*.ts'],
      provider: 'v8',
    },
    snapshotFormat: {
      maxOutputLength: Number.MAX_SAFE_INTEGER,
    },
  },
});
