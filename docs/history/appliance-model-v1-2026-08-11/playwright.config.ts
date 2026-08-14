import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // The suite opens software-rendered WebGL scenes. Running several scenes in
  // parallel starves the generator workers and produces readiness timeouts on
  // Windows/SwiftShader, so keep the visual acceptance lane deterministic.
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5190',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5190',
    reuseExistingServer: true,
    timeout: 20_000,
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
