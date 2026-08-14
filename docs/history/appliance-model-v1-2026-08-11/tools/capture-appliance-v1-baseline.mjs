#!/usr/bin/env node
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5190';
const outputRoot = path.resolve(
  process.argv[3] ?? 'docs/history/appliance-model-v1-2026-08-11/screenshots',
);
const requestedModels = process.argv.find((argument) => argument.startsWith('--models='))
  ?.slice('--models='.length)
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean);
const skipGame = process.argv.includes('--skip-game');
const onlyGame = process.argv.includes('--only-game');
const allModels = [
  'lamp', 'fan', 'radio', 'television', 'humidifier', 'toaster',
  'refrigerator', 'washer', 'microwave', 'coffee-maker', 'kettle',
  'rice-cooker', 'phone', 'robot-vacuum', 'bubble-machine', 'gumball-machine',
  'popcorn-machine', 'alarm-clock', 'smart-bin', 'record-player', 'stand-mixer',
  'printer', 'induction-cooktop', 'blender', 'dehumidifier', 'portable-speaker',
  'hair-dryer', 'desktop-computer', 'game-controller',
];
const models = onlyGame ? [] : (requestedModels?.length > 0 ? requestedModels : allModels);
const views = ['front', 'side', 'back', 'three-quarter'];
const phases = [
  { id: 'startup', time: 0.6 },
  { id: 'climax', time: 2.8 },
  { id: 'wind-down', time: 4.75 },
];

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
const report = [];

const fileExists = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

for (const model of models) {
  const modelDirectory = path.join(outputRoot, 'models', model);
  await mkdir(modelDirectory, { recursive: true });
  const captures = [];
  for (const view of views) {
    const screenshotPath = path.join(modelDirectory, `idle-${view}.png`);
    if (await fileExists(screenshotPath)) {
      captures.push({ state: 'idle', view, screenshotPath, resumed: true });
      continue;
    }
    await page.goto(
      `${baseUrl}/model-review.html?model=${encodeURIComponent(model)}&view=${view}&spin=0&power=0`,
      { waitUntil: 'domcontentloaded' },
    );
    await page.waitForFunction(() => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true, null, { timeout: 30_000 });
    await page.evaluate(() => window.__MODEL_REVIEW_SET_POWER__?.(false));
    await page.waitForTimeout(120);
    await page.locator('#model-review-canvas').screenshot({ path: screenshotPath });
    captures.push({
      state: 'idle',
      view,
      screenshotPath,
      diagnostics: await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__),
    });
  }

  const missingPhases = [];
  for (const phase of phases) {
    const screenshotPath = path.join(modelDirectory, `active-${phase.id}-${phase.time}.png`);
    if (await fileExists(screenshotPath)) {
      captures.push({
        state: phase.id,
        time: phase.time,
        view: 'three-quarter',
        screenshotPath,
        resumed: true,
      });
    } else {
      missingPhases.push({ ...phase, screenshotPath });
    }
  }
  if (missingPhases.length > 0) {
    await page.goto(
      `${baseUrl}/model-review.html?model=${encodeURIComponent(model)}&view=three-quarter&spin=0&power=0`,
      { waitUntil: 'domcontentloaded' },
    );
    await page.waitForFunction(() => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true, null, { timeout: 30_000 });
  }
  for (const phase of missingPhases) {
    await page.evaluate((elapsed) => window.__MODEL_REVIEW_SET_ELAPSED__?.(elapsed), phase.time);
    await page.waitForTimeout(100);
    await page.locator('#model-review-canvas').screenshot({ path: phase.screenshotPath });
    captures.push({
      state: phase.id,
      time: phase.time,
      view: 'three-quarter',
      screenshotPath: phase.screenshotPath,
      diagnostics: await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__),
    });
  }
  report.push({ model, captures });
  await writeFile(
    path.join(modelDirectory, 'capture-report.json'),
    `${JSON.stringify({ model, captures, errors: [...errors] }, null, 2)}\n`,
  );
}

let gameDiagnostics = null;
if (!skipGame) {
  await page.goto(`${baseUrl}/?seed=2679418801&mode=random&direct=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  if (await page.locator('#start-game-button').isVisible()) await page.click('#start-game-button');
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.seed === 2679418801
        && diagnostics.sceneVisibility.appliances
        && diagnostics.appliances.length === 8
        && diagnostics.clickTarget !== null;
    },
    null,
    { timeout: 150_000 },
  );
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(outputRoot, 'game-seed-2679418801.png'), fullPage: true });
  await page.locator('#game-canvas').screenshot({ path: path.join(outputRoot, 'game-seed-2679418801-canvas.png') });
  gameDiagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__);
}

await browser.close();
await writeFile(
  path.join(outputRoot, 'capture-report.json'),
  `${JSON.stringify({ models: report, gameDiagnostics, errors }, null, 2)}\n`,
);
console.log(JSON.stringify({ outputRoot, modelCount: report.length, errors }, null, 2));
if (errors.length > 0) process.exitCode = 1;
