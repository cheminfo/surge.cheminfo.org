import { defineConfig, devices } from '@playwright/test';

const backendPort = Number(process.env.PORT ?? 31228);
const devServerPort = Number(process.env.VITE_PORT ?? backendPort + 1);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html']] : 'html',
  use: {
    baseURL: `http://localhost:${devServerPort}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      // Node directly, with no npm or --watch wrapper, so Playwright can
      // reliably kill the server when the tests are done.
      command: 'node --experimental-strip-types src/server.ts',
      url: `http://localhost:${backendPort}/v1/health`,
      reuseExistingServer: !process.env.CI,
      cwd: '../backend',
    },
    {
      command: 'npm run dev',
      url: `http://localhost:${devServerPort}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
