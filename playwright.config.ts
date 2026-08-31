import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5190';

export default defineConfig({
  testDir: './tests',
  // These suites drive the removed production `mode=skill-test` URL. Keep the
  // fixtures as historical references, but do not report their unreachable
  // browser flows as regressions in the formal game suite.
  testIgnore: [
    '**/skill-test-mode.spec.ts',
    '**/*-skill-test.spec.ts',
    '**/microwave-skill-visual.spec.ts',
    '**/television-first-switch-performance.spec.ts',
  ],
  // The suite opens software-rendered WebGL scenes. Running several scenes in
  // parallel starves the generator workers and produces readiness timeouts on
  // Windows/SwiftShader, so keep the visual acceptance lane deterministic.
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: baseURL,
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
