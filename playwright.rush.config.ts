import { defineConfig, devices } from '@playwright/test';

const port = 5194;
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: externalBaseURL ?? `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: `npm run preview -- --port ${port} --strictPort`,
        url: `http://127.0.0.1:${port}`,
        reuseExistingServer: false,
        timeout: 20_000,
      },
  projects: [{
    name: 'desktop-chrome',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 720 },
    },
  }],
});
