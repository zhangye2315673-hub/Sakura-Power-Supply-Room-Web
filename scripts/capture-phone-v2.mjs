#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5196/model-review.html';
const output = process.argv[3] ?? 'artifacts/appliance-v2/phone/evidence/models/phone';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));
const captures = [];

async function open(view) {
  const url = new URL(baseUrl);
  url.searchParams.set('model', 'phone');
  url.searchParams.set('view', view);
  url.searchParams.set('spin', '0');
  url.searchParams.set('power', '0');
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true);
}

for (const view of ['front', 'side', 'back', 'three-quarter']) {
  await open(view);
  await page.evaluate(() => window.__MODEL_REVIEW_SET_POWER__?.(false));
  await page.waitForTimeout(500);
  const screenshotPath = path.resolve(output, `render-off-${view}.png`);
  await page.locator('#model-review-canvas').screenshot({ path: screenshotPath });
  captures.push({ state: 'idle', view, elapsed: null, screenshotPath, diagnostics: await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__) });
}

for (const [state, elapsed] of [['startup', 0.6], ['climax', 2.8], ['wind-down', 4.75]]) {
  await open('three-quarter');
  await page.evaluate((time) => window.__MODEL_REVIEW_SET_ELAPSED__?.(time), elapsed);
  await page.waitForTimeout(500);
  const screenshotPath = path.resolve(output, `render-${state}-three-quarter.png`);
  await page.locator('#model-review-canvas').screenshot({ path: screenshotPath });
  captures.push({ state, view: 'three-quarter', elapsed, screenshotPath, diagnostics: await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__) });
}

await browser.close();
const archived = JSON.parse(await readFile('docs/history/appliance-model-v1-2026-08-11/screenshots/models/phone/capture-report.json', 'utf8'));
const performance = captures.map((capture) => {
  const baseline = archived.captures.find((item) => item.view === capture.view && item.state === capture.state);
  const baselineDrawCalls = Number(baseline?.diagnostics?.drawCalls ?? 0);
  const drawCalls = Number(capture.diagnostics?.drawCalls ?? 0);
  return {
    state: capture.state,
    view: capture.view,
    baselineDrawCalls,
    drawCalls,
    drawCallRatio: Number((drawCalls / Math.max(baselineDrawCalls, 1)).toFixed(6)),
    baselineTriangles: Number(baseline?.diagnostics?.triangles ?? 0),
    triangles: Number(capture.diagnostics?.triangles ?? 0),
  };
});
const maxDrawCallRatio = Math.max(...performance.map((item) => item.drawCallRatio));
const performanceBudget = { maximumAllowedDrawCallRatio: 1.2, maxDrawCallRatio, samples: performance, passed: maxDrawCallRatio <= 1.2 };
await mkdir('artifacts/appliance-v2/phone/diagnostics', { recursive: true });
await writeFile('artifacts/appliance-v2/phone/diagnostics/phone-v2-browser-performance.json', `${JSON.stringify(performanceBudget, null, 2)}\n`);
const report = { model: 'phone', baseUrl, captures, performanceBudget, errors, passed: errors.length === 0 && captures.length === 7 && performanceBudget.passed };
await writeFile(path.join(output, 'capture-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
