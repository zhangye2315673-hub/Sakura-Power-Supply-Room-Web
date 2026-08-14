#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5190/model-review.html';
const outputPath = path.resolve(
  process.argv[3] ?? 'artifacts/browser-acceptance/model-review-16-summary.json',
);
const models = [
  'fan',
  'television',
  'humidifier',
  'coffee-maker',
  'washer',
  'kettle',
  'rice-cooker',
  'phone',
  'robot-vacuum',
  'popcorn-machine',
  'bubble-machine',
  'alarm-clock',
  'smart-bin',
  'record-player',
  'printer',
  'induction-cooktop',
];
const sampleTimes = [0.6, 2.8, 4.2, 5.1];

await mkdir(path.dirname(outputPath), { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const consoleErrors = [];
const pageErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));

const results = [];
const failures = [];
try {
  for (const model of models) {
    const url = new URL(baseUrl);
    url.searchParams.set('model', model);
    url.searchParams.set('view', 'three-quarter');
    url.searchParams.set('spin', '0');
    url.searchParams.set('power', '0');
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      (expected) => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true
        && window.__MODEL_REVIEW_DIAGNOSTICS__?.model === expected,
      model,
    );

    for (const time of sampleTimes) {
      await page.evaluate((elapsed) => window.__MODEL_REVIEW_SET_ELAPSED__?.(elapsed), time);
      await page.waitForFunction(
        ({ expectedModel, expectedTime }) => {
          const diagnostics = window.__MODEL_REVIEW_DIAGNOSTICS__;
          const performance = diagnostics?.performance;
          return diagnostics?.model === expectedModel
            && performance?.sessions === 1
            && performance.timelineOwners === 1
            && Math.abs((performance.elapsedByKind[expectedModel] ?? -1) - expectedTime) < 0.0001;
        },
        { expectedModel: model, expectedTime: time },
      );
      const diagnostics = await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__);
      const performance = diagnostics.performance;
      const result = {
        model,
        modelRootName: diagnostics.modelRootName,
        time,
        ready: diagnostics.ready,
        power: diagnostics.power,
        sessions: performance.sessions,
        timelineOwners: performance.timelineOwners,
        elapsed: performance.elapsedByKind[model],
        signal: performance.signalsByKind[model],
        triangles: diagnostics.triangles,
      };
      results.push(result);
      if (
        !result.ready
        || result.modelRootName !== `appliance-model-${model}`
        || result.sessions !== 1
        || result.timelineOwners !== 1
        || Math.abs(result.elapsed - time) > 0.0001
        || !(time >= 5.1 ? result.signal >= 0 : result.signal > 0)
        || !(result.triangles > 0)
      ) {
        failures.push(result);
      }
    }
  }
} finally {
  await browser.close();
}

const summary = {
  generatedAt: new Date().toISOString(),
  models: models.length,
  samples: results.length,
  failures,
  consoleErrors,
  pageErrors,
  results,
};
await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  outputPath,
  models: summary.models,
  samples: summary.samples,
  failures: failures.length,
  consoleErrors: consoleErrors.length,
  pageErrors: pageErrors.length,
}, null, 2));

if (failures.length > 0 || consoleErrors.length > 0 || pageErrors.length > 0) process.exit(1);
