#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:4202/?seed=2679418801';
const outputDirectory = process.argv[3] ?? 'artifacts/appliance-drag';
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
const before = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.appliances ?? []);
await page.screenshot({ path: path.join(outputDirectory, 'before.png'), fullPage: true });

await page.mouse.move(650, 360);
await page.mouse.down();
await page.mouse.move(760, 310, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(240);
const afterOrbit = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.appliances ?? []);
await page.screenshot({ path: path.join(outputDirectory, 'after-orbit.png'), fullPage: true });

const toaster = afterOrbit.find((appliance) => appliance.id === 'toaster');
if (!toaster) throw new Error('Missing toaster diagnostics.');
await page.mouse.move(toaster.screenX * 1280, toaster.screenY * 720);
await page.mouse.down();
await page.waitForTimeout(220);
await page.mouse.move(300, 300, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(100);
await page.screenshot({ path: path.join(outputDirectory, 'dropping.png'), fullPage: true });
await page.waitForFunction(
  () => !window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((appliance) => appliance.id === 'toaster')?.dropping,
  null,
  { timeout: 4_000 },
);
const afterDrag = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.appliances ?? []);
await page.screenshot({ path: path.join(outputDirectory, 'settled-left.png'), fullPage: true });

const stableLayout = before.every((appliance, index) => {
  const rotated = afterOrbit[index];
  return rotated && Math.abs(appliance.screenX - rotated.screenX) < 0.001 && Math.abs(appliance.screenY - rotated.screenY) < 0.001;
});
const movedToLeft = afterDrag.find((appliance) => appliance.id === 'toaster');
const report = {
  url,
  stableLayout,
  movedToLeft,
  before,
  afterOrbit,
  afterDrag,
  consoleErrors,
  pageErrors,
};
await writeFile(path.join(outputDirectory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
await browser.close();

console.log(JSON.stringify(report, null, 2));
if (
  !stableLayout ||
  !movedToLeft ||
  movedToLeft.screenX >= 0.4 ||
  movedToLeft.facingSide !== -1 ||
  movedToLeft.dragging ||
  movedToLeft.dropping ||
  consoleErrors.length > 0 ||
  pageErrors.length > 0
) {
  process.exit(1);
}
