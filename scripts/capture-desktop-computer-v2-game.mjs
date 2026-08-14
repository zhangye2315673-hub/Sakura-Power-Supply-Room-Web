#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5190';
const outputRoot = path.resolve(
  process.argv[3] ?? 'artifacts/img2threejs-v2/desktop-computer/game',
);
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
const captures = [];

const captureGame = async ({
  seed,
  viewport,
  label,
  requireDesktop,
  suppliedPage = null,
  navigate = true,
}) => {
  const ownsPage = suppliedPage === null;
  const page = suppliedPage ?? await browser.newPage({ viewport, deviceScaleFactor: 1 });
  if (page.viewportSize()?.width !== viewport.width || page.viewportSize()?.height !== viewport.height) {
    await page.setViewportSize(viewport);
  }
  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  };
  const onPageError = (error) => pageErrors.push(error.message);
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  if (navigate) {
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
  }
  await page.waitForFunction(
    ({ expectedSeed, needsDesktop }) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.seed === expectedSeed
        && diagnostics.sceneVisibility.appliances
        && diagnostics.appliances.length === 8
        && diagnostics.clickTarget !== null
        && (!needsDesktop || diagnostics.appliances.some((item) => item.id === 'desktop-computer'));
    },
    { expectedSeed: seed, needsDesktop: requireDesktop },
    { timeout: 150_000 },
  );
  await page.waitForTimeout(450);

  const frameTiming = {
    sampled: false,
    note: 'Skipped because headless SwiftShader frame sampling was too expensive on this workstation. Browser draw-call and triangle budgets are recorded by the model-review optimization evidence instead.',
  };

  const diagnostics = await page.evaluate(() => {
    const game = window.__THREE_GAME_DIAGNOSTICS__;
    const target = game.appliances.find((item) => item.id === 'desktop-computer') ?? null;
    return {
      seed: game.seed,
      applianceIds: game.appliances.map((item) => item.id),
      target,
      clickTarget: game.clickTarget,
      sceneVisibility: game.sceneVisibility,
    };
  });
  const target = diagnostics.target;
  const targetCenterInsideViewport = !requireDesktop || Boolean(
    target
    && Number.isFinite(target.screenX)
    && Number.isFinite(target.screenY)
    && target.screenX >= 0
    && target.screenX <= 1
    && target.screenY >= 0
    && target.screenY <= 1
  );
  const targetEnvelopeInsideViewport = !requireDesktop || Boolean(
    target
    && Number.isFinite(target.screenWidth)
    && Number.isFinite(target.screenHeight)
    && target.screenX - target.screenWidth / 2 >= 0
    && target.screenX + target.screenWidth / 2 <= 1
    && target.screenY - target.screenHeight / 2 >= 0
    && target.screenY + target.screenHeight / 2 <= 1
  );

  const prefix = `${label}-${viewport.width}x${viewport.height}`;
  const fullPagePath = path.join(outputRoot, `${prefix}-page.png`);
  const canvasPath = path.join(outputRoot, `${prefix}-canvas.png`);
  await page.screenshot({ path: fullPagePath, fullPage: true });
  await page.locator('#game-canvas').screenshot({ path: canvasPath });
  const result = {
    label,
    seed,
    viewport,
    fullPagePath,
    canvasPath,
    targetCenterInsideViewport,
    targetEnvelopeInsideViewport,
    frameTiming,
    diagnostics,
    consoleErrors,
    pageErrors,
  };
  captures.push(result);
  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  if (ownsPage) await page.close();
  return result;
};

const desktopPage = await browser.newPage({ viewport: viewports[0], deviceScaleFactor: 1 });
for (let index = 0; index < viewports.length; index += 1) {
  await captureGame({
    seed: 1,
    viewport: viewports[index],
    label: 'desktop-seed-1',
    requireDesktop: true,
    suppliedPage: desktopPage,
    navigate: index === 0,
  });
}
await desktopPage.close();
await captureGame({
  seed: 2679418801,
  viewport: { width: 1200, height: 900 },
  label: 'fixed-seed-2679418801',
  requireDesktop: false,
});

await browser.close();
const report = {
  model: 'desktop-computer',
  sequentialCapture: true,
  captures,
  passed: captures.every(
    (capture) => capture.targetCenterInsideViewport
      && capture.targetEnvelopeInsideViewport
      && capture.consoleErrors.length === 0
      && capture.pageErrors.length === 0,
  ),
};
await writeFile(path.join(outputRoot, 'capture-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  outputRoot,
  passed: report.passed,
  captures: captures.map((capture) => ({
    label: capture.label,
    viewport: capture.viewport,
    applianceIds: capture.diagnostics.applianceIds,
    targetCenterInsideViewport: capture.targetCenterInsideViewport,
    targetEnvelopeInsideViewport: capture.targetEnvelopeInsideViewport,
    frameTiming: capture.frameTiming,
    consoleErrors: capture.consoleErrors,
    pageErrors: capture.pageErrors,
  })),
}, null, 2));
if (!report.passed) process.exitCode = 1;
