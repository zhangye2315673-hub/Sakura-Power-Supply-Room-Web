#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:4202/?seed=2679418801';
const outputDirectory = process.argv[3] ?? 'artifacts/plug-connection';
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
await page.screenshot({ path: path.join(outputDirectory, 'idle.png'), fullPage: true });

const before = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows ?? 0);
const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.clickTarget ?? null);
if (!target) throw new Error('No visible cable target.');
await page.mouse.click(target.x, target.y);
await page.waitForFunction(() => (window.__THREE_GAME_DIAGNOSTICS__?.activeConnections ?? 0) > 0, null, {
  timeout: 10_000,
});
await page.waitForTimeout(360);
await page.screenshot({ path: path.join(outputDirectory, 'connecting.png'), fullPage: true });

await page.waitForFunction(
  (remaining) =>
    window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows === remaining - 1 &&
    window.__THREE_GAME_DIAGNOSTICS__?.appliances.some((appliance) => appliance.state === 'active'),
  before,
  { timeout: 10_000 },
);
const activeDiagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
await page.screenshot({ path: path.join(outputDirectory, 'connected.png'), fullPage: true });

await page.waitForFunction(
  () =>
    window.__THREE_GAME_DIAGNOSTICS__?.appliances.some(
      (appliance) =>
        appliance.connections === 1 &&
        appliance.state === 'idle' &&
        appliance.activeTimeRemaining === 0,
    ),
  null,
  { timeout: 8_000 },
);
const stoppedDiagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
await page.screenshot({ path: path.join(outputDirectory, 'stopped.png'), fullPage: true });
await writeFile(
  path.join(outputDirectory, 'report.json'),
  `${JSON.stringify({ url, activeDiagnostics, stoppedDiagnostics, consoleErrors, pageErrors }, null, 2)}\n`,
);
await browser.close();

console.log(JSON.stringify({ outputDirectory, activeDiagnostics, stoppedDiagnostics, consoleErrors, pageErrors }, null, 2));
if (consoleErrors.length > 0 || pageErrors.length > 0 || stoppedDiagnostics?.context.losses > 0) process.exit(1);
