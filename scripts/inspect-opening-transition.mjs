#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:4201/';
const outDir = process.argv[3] ?? 'artifacts/opening-transition';

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const consoleErrors = [];
const pageErrors = [];

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));

await page.addInitScript(() => {
  window.__OPENING_LONG_TASKS__ = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__OPENING_LONG_TASKS__.push({
        startTime: entry.startTime,
        duration: entry.duration,
      });
    }
  }).observe({ type: 'longtask', buffered: true });
});

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(
  () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
  null,
  { timeout: 90_000 },
);
await page.screenshot({ path: path.join(outDir, 'opening-ready.png') });

const readyState = await page.evaluate(() => ({
  diagnostics: window.__THREE_GAME_DIAGNOSTICS__,
  longTasks: window.__OPENING_LONG_TASKS__ ?? [],
}));

await page.waitForFunction(
  () => {
    const opening = window.__THREE_GAME_DIAGNOSTICS__?.opening;
    return Boolean(
      opening
      && opening.impactCount > 0
      && opening.jellyScale.some((value) => Math.abs(value - 1) > 0.006),
    );
  },
  null,
  { timeout: 60_000, polling: 'raf' },
);
const impactState = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.opening);
await page.screenshot({ path: path.join(outDir, 'opening-impact.png') });
const peakJellyDeviation = await page.evaluate(async () => {
  let peak = 0;
  const startedAt = performance.now();
  while (performance.now() - startedAt < 650) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const scale = window.__THREE_GAME_DIAGNOSTICS__?.opening.jellyScale ?? [1, 1, 1];
    peak = Math.max(peak, ...scale.map((value) => Math.abs(value - 1)));
  }
  return peak;
});
await page.waitForTimeout(900);
const settledState = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.opening);

await page.click('#start-game-button');
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outDir, 'opening-contact.png') });
await page.waitForFunction(
  () => window.__THREE_GAME_DIAGNOSTICS__?.opening.cameraPhase === 'background-hold',
  null,
  { timeout: 10_000 },
);
await page.waitForTimeout(100);
await page.screenshot({ path: path.join(outDir, 'opening-fade-background.png') });
const backgroundHoldState = await page.evaluate(() => ({
  opening: window.__THREE_GAME_DIAGNOSTICS__?.opening,
  curtainOpacity: Number.parseFloat(
    getComputedStyle(document.querySelector('#scene-transition-curtain')).opacity,
  ),
}));
await page.waitForFunction(
  () => window.__THREE_GAME_DIAGNOSTICS__?.opening.cameraPhase === 'pull',
  null,
  { timeout: 10_000 },
);
await page.screenshot({ path: path.join(outDir, 'opening-pull-start.png') });
const pullState = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.opening);
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(outDir, 'opening-pull-mid.png') });
await page.waitForTimeout(1_100);
await page.screenshot({ path: path.join(outDir, 'opening-pull-late.png') });
await page.waitForFunction(
  () => window.__THREE_GAME_DIAGNOSTICS__?.opening.cameraPhase === 'idle',
  null,
  { timeout: 10_000 },
);
await page.screenshot({ path: path.join(outDir, 'opening-game.png') });
const finalState = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.opening);

const report = {
  url,
  readyState,
  impactState,
  peakJellyDeviation,
  settledState,
  backgroundHoldState,
  pullState,
  finalState,
  impactVerified: Boolean(
    impactState
    && impactState.impactCount > 0
    && impactState.jellyScale.some((value) => Math.abs(value - 1) > 0.006),
  ),
  jellySettled: Boolean(
    settledState
    && settledState.jellyScale.every((value) => Math.abs(value - 1) < 0.08),
  ),
  maxLongTaskMs: Math.max(0, ...readyState.longTasks.map((entry) => entry.duration)),
  longTaskCount: readyState.longTasks.length,
  consoleErrors,
  pageErrors,
};

await writeFile(path.join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify(report, null, 2));

if (
  !report.impactVerified
  || !report.jellySettled
  || backgroundHoldState.curtainOpacity < 0.999
  || consoleErrors.length > 0
  || pageErrors.length > 0
) {
  process.exitCode = 1;
}
