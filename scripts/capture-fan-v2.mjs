#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5191/model-review.html';
const outputRoot = process.argv[3] ?? 'artifacts/appliance-v2/fan';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader-webgl', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

async function capture(view, state, elapsed, directory) {
  const url = new URL(baseUrl);
  url.searchParams.set('model', 'fan');
  url.searchParams.set('view', view);
  url.searchParams.set('spin', '0');
  url.searchParams.set('power', '0');
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true);
  if (elapsed === null) await page.evaluate(() => window.__MODEL_REVIEW_SET_POWER__?.(false));
  else await page.evaluate((time) => window.__MODEL_REVIEW_SET_ELAPSED__?.(time), elapsed);
  await page.waitForTimeout(220);
  const canvas = page.locator('#model-review-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('fan review canvas has no bounds');
  await mkdir(directory, { recursive: true });
  const screenshotPath = path.join(directory, `render-${state}-${view}.png`);
  await page.screenshot({ path: screenshotPath, clip: box });
  return { state, view, elapsed, screenshotPath, diagnostics: await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__) };
}

const captures = [];
for (const view of ['front', 'side', 'back', 'three-quarter']) captures.push(await capture(view, 'off', null, path.join(outputRoot, 'static')));
for (const [state, elapsed] of [['startup', 0.6], ['climax', 2.8], ['wind-down', 4.75]]) captures.push(await capture('three-quarter', state, elapsed, path.join(outputRoot, 'animation', state)));
await browser.close();
await writeFile(path.join(outputRoot, 'capture-report.json'), `${JSON.stringify({ model: 'fan', captures, errors }, null, 2)}\n`);
console.log(JSON.stringify({ captures: captures.length, errors }, null, 2));
if (errors.length > 0) process.exit(1);
