import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: [],
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: 'http://127.0.0.1:5190',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5190',
    reuseExistingServer: true,
    timeout: 20_000,
  },
  projects: [{
    name: 'desktop-chrome',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
  }],
});
