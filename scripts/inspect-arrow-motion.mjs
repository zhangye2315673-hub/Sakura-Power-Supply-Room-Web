#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] ?? 'http://127.0.0.1:4201/?seed=2679418801';
const output = process.argv[3] ?? 'artifacts/arrow-motion-mid.png';
await mkdir('artifacts', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.clickTarget !== null);
const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.clickTarget ?? null);
if (!target) throw new Error('No visible click target');
await page.locator('#game-canvas').click({ position: { x: target.x, y: target.y } });
await page.waitForTimeout(260);
await page.screenshot({ path: output, fullPage: true });
console.log(JSON.stringify({ output, diagnostics: await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__) }, null, 2));
await browser.close();
