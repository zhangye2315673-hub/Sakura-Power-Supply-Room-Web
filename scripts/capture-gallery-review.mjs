#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:4203/?seed=2679418801';
const outputDirectory = process.argv[3] ?? 'artifacts/gallery-review-current';
const kinds = process.argv.slice(4);
const targets = kinds.length > 0 ? kinds : ['rice-cooker', 'robot-vacuum', 'phone'];
const captureDelayOverride = Number(process.env.GALLERY_CAPTURE_DELAY_MS ?? '');
const captureDelayByKind = {
  lamp: 150,
  humidifier: 350,
  toaster: 1200,
  refrigerator: 700,
  washer: 350,
  microwave: 350,
  'coffee-maker': 350,
  kettle: 450,
  'rice-cooker': 1700,
  'robot-vacuum': 350,
};

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
await page.click('#appliance-gallery-button');
await page.click('.appliance-gallery-header nav button:nth-child(2)');

const captures = [];
for (const kind of targets) {
  await page.click(`[data-appliance-kind="${kind}"]`);
  await page.waitForFunction(
    (selected) =>
      window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.selected === selected &&
      (window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.drawCalls ?? 0) > 0,
    kind,
  );
  await page.waitForTimeout(Number.isFinite(captureDelayOverride) && captureDelayOverride >= 0
    ? captureDelayOverride
    : captureDelayByKind[kind] ?? 650);
  const screenshotPath = path.join(outputDirectory, `${kind}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const frameDiagnostics = await page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__ ?? null);
  captures.push({ kind, screenshotPath, diagnostics: frameDiagnostics });
}

const diagnostics = await page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__ ?? null);
await browser.close();
console.log(JSON.stringify({ url, captures, diagnostics, consoleErrors, pageErrors }, null, 2));
if (consoleErrors.length > 0 || pageErrors.length > 0) process.exit(1);
