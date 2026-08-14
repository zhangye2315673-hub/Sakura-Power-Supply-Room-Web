#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4203/model-review.html';
const model = process.argv[3] ?? 'toaster';
const outputDirectory = process.argv[4] ?? `artifacts/img2threejs/${model}`;
const waitMs = Number(process.argv[5] ?? 650);
const views = (process.argv[6] ?? 'front,side,back,three-quarter').split(',');

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader-webgl', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));
const captures = [];

for (const view of views) {
  const url = new URL(baseUrl);
  url.searchParams.set('model', model);
  url.searchParams.set('view', view);
  url.searchParams.set('spin', '0');
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true);
  await page.waitForTimeout(waitMs);
  const screenshotPath = path.join(outputDirectory, `render-${view}.png`);
  await page.locator('#model-review-canvas').screenshot({ path: screenshotPath });
  captures.push({ view, screenshotPath, diagnostics: await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__) });
}

await browser.close();
console.log(JSON.stringify({ baseUrl, model, captures, errors }, null, 2));
if (errors.length > 0) process.exit(1);
