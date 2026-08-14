#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [baseUrl, model, outputDirectory, state = 'off', waitArg = '500', viewsArg = 'front,side,back,three-quarter', elapsedArg] = process.argv.slice(2);
if (!baseUrl || !model || !outputDirectory) {
  throw new Error('Usage: capture-model-review-state.mjs <base-url> <model> <output-dir> [off|on] [wait-ms]');
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const captures = [];

for (const view of viewsArg.split(',')) {
  const reviewUrl = new URL(baseUrl);
  reviewUrl.searchParams.set('model', model);
  reviewUrl.searchParams.set('view', view);
  reviewUrl.searchParams.set('spin', '0');
  reviewUrl.searchParams.set('power', '0');
  await page.goto(reviewUrl.toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true);
  if (elapsedArg !== undefined) {
    await page.evaluate((elapsed) => window.__MODEL_REVIEW_SET_ELAPSED__?.(elapsed), Number(elapsedArg));
  } else {
    await page.evaluate((powered) => window.__MODEL_REVIEW_SET_POWER__?.(powered), state === 'on');
  }
  await page.waitForTimeout(Number(waitArg));
  const screenshotPath = path.join(outputDirectory, `render-${state}-${view}.png`);
  await page.locator('#model-review-canvas').screenshot({ path: screenshotPath });
  captures.push({ view, screenshotPath, diagnostics: await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__) });
}

await browser.close();
const payload = { model, state, captures };
await writeFile(path.join(outputDirectory, 'capture-manifest.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(payload, null, 2));
