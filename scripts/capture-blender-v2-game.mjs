#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5190';
const outputRoot = path.resolve(
  process.argv[3] ?? 'artifacts/img2threejs-v2/blender/game',
);
const seed = 2679418801;
const viewports = [
  { width: 1280, height: 720 },
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 },
];

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: viewports[0], deviceScaleFactor: 1 });
const consoleErrors = [];
const pageErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));

await page.goto(`${baseUrl}/?seed=${seed}&mode=random&direct=1`, {
  waitUntil: 'domcontentloaded',
});
await page.waitForFunction(
  () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
  null,
  { timeout: 90_000 },
);
if (await page.locator('#start-game-button').isVisible()) {
  await page.click('#start-game-button');
}
await page.waitForFunction(
  (expectedSeed) => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.seed === expectedSeed
      && diagnostics.sceneVisibility.appliances
      && diagnostics.appliances.length === 8
      && diagnostics.clickTarget !== null
      && diagnostics.appliances.some((item) => item.id === 'blender');
  },
  seed,
  { timeout: 150_000 },
);
await page.waitForTimeout(450);

const captures = [];
for (const viewport of viewports) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(250);
  const diagnostics = await page.evaluate(() => {
    const game = window.__THREE_GAME_DIAGNOSTICS__;
    return {
      seed: game.seed,
      applianceIds: game.appliances.map((item) => item.id),
      target: game.appliances.find((item) => item.id === 'blender') ?? null,
      clickTarget: game.clickTarget,
      sceneVisibility: game.sceneVisibility,
    };
  });
  const target = diagnostics.target;
  const targetCenterInsideViewport = Boolean(
    target
    && Number.isFinite(target.screenX)
    && Number.isFinite(target.screenY)
    && target.screenX >= 0
    && target.screenX <= 1
    && target.screenY >= 0
    && target.screenY <= 1,
  );
  const targetEnvelopeInsideViewport = Boolean(
    target
    && Number.isFinite(target.screenWidth)
    && Number.isFinite(target.screenHeight)
    && target.screenX - target.screenWidth / 2 >= 0
    && target.screenX + target.screenWidth / 2 <= 1
    && target.screenY - target.screenHeight / 2 >= 0
    && target.screenY + target.screenHeight / 2 <= 1,
  );
  const prefix = `fixed-seed-${seed}-${viewport.width}x${viewport.height}`;
  const fullPagePath = path.join(outputRoot, `${prefix}-page.png`);
  const canvasPath = path.join(outputRoot, `${prefix}-canvas.png`);
  await page.screenshot({ path: fullPagePath, fullPage: true });
  await page.locator('#game-canvas').screenshot({ path: canvasPath });
  captures.push({
    seed,
    viewport,
    fullPagePath,
    canvasPath,
    targetCenterInsideViewport,
    targetEnvelopeInsideViewport,
    diagnostics,
  });
}

await browser.close();
const report = {
  model: 'blender',
  seed,
  sequentialCapture: true,
  frameTiming: {
    sampled: false,
    note: 'SwiftShader frame sampling is intentionally skipped on this workstation; model-review draw-call and triangle budgets are the performance authority.',
  },
  consoleErrors,
  pageErrors,
  captures,
  passed: consoleErrors.length === 0
    && pageErrors.length === 0
    && captures.every((capture) => (
      capture.targetCenterInsideViewport && capture.targetEnvelopeInsideViewport
    )),
};
await writeFile(path.join(outputRoot, 'capture-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  outputRoot,
  passed: report.passed,
  consoleErrors,
  pageErrors,
  captures: captures.map((capture) => ({
    viewport: capture.viewport,
    applianceIds: capture.diagnostics.applianceIds,
    targetCenterInsideViewport: capture.targetCenterInsideViewport,
    targetEnvelopeInsideViewport: capture.targetEnvelopeInsideViewport,
  })),
}, null, 2));
if (!report.passed) process.exitCode = 1;
