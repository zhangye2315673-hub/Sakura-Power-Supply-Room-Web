#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5190/model-review.html';
const outputDirectory = process.argv[3] ?? 'artifacts/img2threejs/printer';
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const captures = [];

for (const view of ['front', 'side', 'back', 'three-quarter']) {
  await page.goto(`${baseUrl}?model=printer&view=${view}&spin=0&power=0`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true);
  await page.waitForTimeout(350);
  const path = `${outputDirectory}/idle-${view}.png`;
  await page.screenshot({ path });
  captures.push({ path, diagnostics: await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__) });
}

await page.goto(`${baseUrl}?model=printer&view=three-quarter&spin=0&power=0`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true);
await page.evaluate(() => window.__MODEL_REVIEW_SET_POWER__?.(true));
for (const [label, waitMs] of [['page-1-eject', 760], ['page-2-eject', 1440], ['page-3-eject', 1440]]) {
  await page.waitForTimeout(waitMs);
  const poweredPath = `${outputDirectory}/powered-${label}.png`;
  await page.screenshot({ path: poweredPath });
  captures.push({ path: poweredPath, diagnostics: await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__) });
}

console.log(JSON.stringify(captures, null, 2));
await browser.close();
