import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { enterPreparedGame } from './helpers/enterGame';

const ARTIFACT_DIR = path.resolve('artifacts/render-cost-map-20260831');

test('profiles production render cost by scene root without changing game state', async ({ page }) => {
  test.setTimeout(300_000);
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
  });

  await page.goto('/?seed=2679418801&mode=random&direct=1&theme=night&diagnostics=1');
  await enterPreparedGame(page);
  await page.waitForTimeout(1_000);

  const before = await page.evaluate(() => ({
    sceneVisibility: window.__THREE_GAME_DIAGNOSTICS__?.sceneVisibility ?? null,
    remainingArrows: window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows ?? null,
    orbit: window.__THREE_GAME_DIAGNOSTICS__?.orbit ?? null,
    appliances: window.__THREE_GAME_DIAGNOSTICS__?.appliances.map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      instanceId: entry.instanceId,
      state: entry.state,
    })) ?? [],
  }));

  const profile = await page.evaluate(() => window.__PROFILE_RENDER_BREAKDOWN__?.() ?? null);
  expect(profile).not.toBeNull();
  await page.waitForTimeout(350);

  const after = await page.evaluate(() => ({
    sceneVisibility: window.__THREE_GAME_DIAGNOSTICS__?.sceneVisibility ?? null,
    remainingArrows: window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows ?? null,
    orbit: window.__THREE_GAME_DIAGNOSTICS__?.orbit ?? null,
    appliances: window.__THREE_GAME_DIAGNOSTICS__?.appliances.map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      instanceId: entry.instanceId,
      state: entry.state,
    })) ?? [],
  }));

  const report = {
    scenario: {
      url: page.url(),
      viewport: page.viewportSize(),
      devicePixelRatio: await page.evaluate(() => window.devicePixelRatio),
      browser: await page.evaluate(() => navigator.userAgent),
      buildMode: 'vite-preview-production',
    },
    before,
    profile,
    after,
    consoleErrors,
    pageErrors,
    failedRequests,
  };
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'render-cost-map.json'), JSON.stringify(report, null, 2));

  expect(profile?.sceneRenderer.calls).toBeGreaterThan(0);
  expect(profile?.entries.find((entry) => entry.name === 'arrows')?.calls ?? 0).toBeGreaterThan(0);
  expect(profile?.entries.find((entry) => entry.name === 'appliances')?.calls ?? 0).toBeGreaterThan(0);
  expect(after).toEqual(before);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
