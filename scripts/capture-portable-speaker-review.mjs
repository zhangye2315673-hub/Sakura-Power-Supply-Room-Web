#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4173/model-review.html';
const outputDirectory = process.argv[3]
  ?? 'artifacts/img2threejs/portable-speaker/bass-redesign';
const sampleTime = Number(process.argv[4] ?? 4.56);
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));
const captures = [];

for (const view of ['front', 'three-quarter']) {
  const url = new URL(baseUrl);
  url.searchParams.set('model', 'portable-speaker');
  url.searchParams.set('view', view);
  url.searchParams.set('spin', '0');
  url.searchParams.set('power', '0');
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true);
  await page.evaluate((time) => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = time;
    window.__MODEL_REVIEW_SET_POWER__?.(true);
  }, sampleTime);
  await page.waitForTimeout(350);
  const screenshotPath = path.join(outputDirectory, `render-bass-${sampleTime}-${view}.png`);
  await page.locator('#model-review-canvas').screenshot({ path: screenshotPath });
  captures.push({
    view,
    screenshotPath,
    diagnostics: await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__),
    nodes: await page.evaluate(() => window.__MODEL_REVIEW_GET_NODE_STATE__?.([
      'portable-speaker-whole-machine-pivot',
      'portable-speaker-driver-pulse-pivot',
      'portable-speaker-bass-wave-ring-7',
      'portable-speaker-bass-wave-ring-8',
    ])),
  });
}

await browser.close();
console.log(JSON.stringify({ sampleTime, captures, errors }, null, 2));
if (errors.length > 0) process.exit(1);

