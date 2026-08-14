#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';

const url = process.argv[2] ?? 'http://127.0.0.1:4202/?seed=2679418801';
const outputDirectory = process.argv[3] ?? 'artifacts/appliance-depth';
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.clickTarget !== null, null, {
  timeout: 45_000,
});

const toaster = await page.evaluate(() =>
  window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((appliance) => appliance.id === 'toaster'),
);
if (!toaster) throw new Error('Missing toaster diagnostics.');
await page.mouse.move(toaster.screenX * 1280, toaster.screenY * 720);
await page.mouse.down();
await page.mouse.move(640, 360, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(720);

const buffer = await page.screenshot({ path: path.join(outputDirectory, 'behind-center.png'), fullPage: true });
const png = PNG.sync.read(buffer);
const centerColors = new Set();
for (let y = 325; y < 395; y += 4) {
  for (let x = 600; x < 680; x += 4) {
    const offset = (y * png.width + x) * 4;
    centerColors.add(`${png.data[offset] >> 4},${png.data[offset + 1] >> 4},${png.data[offset + 2] >> 4}`);
  }
}

const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
const report = { url, centerColorBuckets: centerColors.size, diagnostics, consoleErrors, pageErrors };
await writeFile(path.join(outputDirectory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify(report, null, 2));

if (centerColors.size < 8 || consoleErrors.length > 0 || pageErrors.length > 0) process.exit(1);
