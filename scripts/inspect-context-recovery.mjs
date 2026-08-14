#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';

const url = process.argv[2] ?? 'http://127.0.0.1:4203/?seed=2679418801';
const outputDirectory = process.argv[3] ?? 'artifacts/context-recovery';
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

const supported = await page.evaluate(() => {
  const canvas = document.querySelector('#game-canvas');
  const gl = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl');
  const extension = gl?.getExtension('WEBGL_lose_context');
  if (!extension) return false;
  window.__CONTEXT_RECOVERY_EXTENSION__ = extension;
  extension.loseContext();
  return true;
});
if (!supported) throw new Error('WEBGL_lose_context is unavailable.');

await page.waitForTimeout(220);
await page.evaluate(() => window.__CONTEXT_RECOVERY_EXTENSION__?.restoreContext());
await page.waitForFunction(
  () =>
    (window.__THREE_GAME_DIAGNOSTICS__?.context.losses ?? 0) >= 1 &&
    (window.__THREE_GAME_DIAGNOSTICS__?.context.restores ?? 0) >= 1,
  null,
  { timeout: 10_000 },
);
await page.waitForTimeout(900);

const screenshotPath = path.join(outputDirectory, 'recovered.png');
const buffer = await page.locator('#game-canvas').screenshot({ path: screenshotPath });
const png = PNG.sync.read(buffer);
let luminance = 0;
let samples = 0;
for (let y = 16; y < Math.min(150, png.height); y += 8) {
  for (let x = Math.floor(png.width * 0.35); x < Math.floor(png.width * 0.65); x += 8) {
    const offset = (y * png.width + x) * 4;
    luminance += png.data[offset] * 0.2126 + png.data[offset + 1] * 0.7152 + png.data[offset + 2] * 0.0722;
    samples += 1;
  }
}
const averageBackgroundLuminance = luminance / Math.max(1, samples);
const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
const report = {
  url,
  screenshotPath,
  averageBackgroundLuminance,
  diagnostics,
  consoleErrors,
  pageErrors,
};
await writeFile(path.join(outputDirectory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify(report, null, 2));

if (
  averageBackgroundLuminance < 90 ||
  (diagnostics?.context.losses ?? 0) < 1 ||
  (diagnostics?.context.restores ?? 0) < 1 ||
  consoleErrors.length > 0 ||
  pageErrors.length > 0
) process.exit(1);
