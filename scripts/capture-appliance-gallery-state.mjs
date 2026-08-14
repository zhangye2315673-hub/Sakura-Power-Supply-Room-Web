#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const [baseUrl = 'http://127.0.0.1:5190', kind = 'humidifier', outputArg, timeArg = '4.2'] = process.argv.slice(2);
const time = Number(timeArg);
const outputPath = path.resolve(outputArg ?? `artifacts/browser-acceptance/gallery-${kind}-${time}.png`);
await mkdir(path.dirname(outputPath), { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const consoleErrors = [];
const pageErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));
await page.addInitScript((fixedTime) => {
  window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = fixedTime;
}, time);

await page.goto(`${baseUrl}/?seed=2679418801&mode=random&direct=1`);
await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
if (await page.locator('#start-game-button').isVisible()) await page.click('#start-game-button');
await page.waitForFunction(
  () => window.__THREE_GAME_DIAGNOSTICS__?.sceneVisibility.appliances === true
    && window.__THREE_GAME_DIAGNOSTICS__.opening.cameraPhase === 'idle',
  null,
  { timeout: 60_000 },
);
await page.click('#appliance-gallery-button');
await page.locator(`[data-appliance-kind="${kind}"]`).evaluate((button) => button.click());
await page.waitForFunction(
  ({ selected, fixedTime }) => {
    const diagnostics = window.__APPLIANCE_GALLERY_DIAGNOSTICS__;
    return diagnostics?.selected === selected
      && diagnostics.performanceSessions === 1
      && diagnostics.performanceTimelineOwners === 1
      && Math.abs(diagnostics.performanceElapsed - fixedTime) < 0.0001;
  },
  { selected: kind, fixedTime: time },
);
const orbitBefore = await page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.orbitAzimuth ?? 0);
await page.waitForTimeout(400);
const orbitAfter = await page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.orbitAzimuth ?? 0);
await page.screenshot({ path: outputPath });
const diagnostics = await page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__);
await browser.close();

const autoRotateDelta = Math.abs(orbitAfter - orbitBefore);
console.log(JSON.stringify({
  outputPath,
  kind,
  time,
  diagnostics,
  autoRotateDelta,
  consoleErrors,
  pageErrors,
}, null, 2));
if (autoRotateDelta <= 0.001 || consoleErrors.length > 0 || pageErrors.length > 0) process.exit(1);
