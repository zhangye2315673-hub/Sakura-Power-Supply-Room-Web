#!/usr/bin/env node
import { chromium } from '@playwright/test';

const [url, outputPath, waitArg = '900'] = process.argv.slice(2);
if (!url || !outputPath) throw new Error('Usage: capture-model-review-page.mjs <url> <output> [wait-ms]');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true);
await page.waitForFunction(() => document.querySelector('#model-title')?.textContent !== '加载模型…');
await page.evaluate(() => window.__MODEL_REVIEW_SET_POWER__?.(true));
await page.waitForTimeout(Number(waitArg));
await page.screenshot({ path: outputPath });
console.log(JSON.stringify(await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__), null, 2));
await browser.close();
