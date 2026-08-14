#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:4201/';
const outDir = process.argv[3] ?? 'artifacts/random-challenge-review';
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, {
  timeout: 90_000,
});
await page.click('#start-game-button');
await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === false, null, {
  timeout: 15_000,
});
const alreadyRandom = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.mode === 'random');
if (!alreadyRandom) await page.click('#new-button');
await page.waitForFunction(
  () => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.mode === 'random' && diagnostics.totalArrows >= 40 && diagnostics.sceneVisibility.arrows;
  },
  null,
  { timeout: 90_000 },
);
await page.waitForFunction(
  () => document.querySelector('#puzzle-loader')?.getAttribute('aria-hidden') === 'true',
  null,
  { timeout: 90_000 },
);
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(outDir, 'random-challenge.png'), fullPage: true });

const report = await page.evaluate(() => ({
  diagnostics: window.__THREE_GAME_DIAGNOSTICS__,
  lives: [...document.querySelectorAll('#random-lives i')].map((icon) => ({
    className: icon.className,
    before: getComputedStyle(icon, '::before').clipPath,
    afterBackground: getComputedStyle(icon, '::after').backgroundImage,
  })),
}));
await writeFile(
  path.join(outDir, 'report.json'),
  `${JSON.stringify({ ...report, consoleErrors, pageErrors }, null, 2)}\n`,
);
await browser.close();
console.log(JSON.stringify({
  count: report.diagnostics?.totalArrows,
  initiallyFree: report.diagnostics?.initiallyFree,
  shape: report.diagnostics?.shape,
  consoleErrors,
  pageErrors,
}, null, 2));

if (consoleErrors.length > 0 || pageErrors.length > 0) process.exitCode = 1;
