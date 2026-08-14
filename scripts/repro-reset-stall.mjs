#!/usr/bin/env node
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://127.0.0.1:4201/?seed=3&mode=random&direct=1';
const limitMs = Number(process.env.RESET_LOAD_LIMIT_MS ?? 3000);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, {
  timeout: 90_000,
});
await page.click('#start-game-button');
await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === false, null, {
  timeout: 15_000,
});

const startedAt = performance.now();
const browserDurationMs = await page.evaluate(() => new Promise((resolve, reject) => {
  const app = document.querySelector('#app');
  const button = document.querySelector('#reset-button');
  if (!app || !(button instanceof HTMLButtonElement)) {
    reject(new Error('Missing reset test controls'));
    return;
  }
  const started = performance.now();
  const observer = new MutationObserver(() => {
    if (app.getAttribute('aria-busy') !== 'false') return;
    observer.disconnect();
    resolve(Math.round(performance.now() - started));
  });
  observer.observe(app, { attributes: true, attributeFilter: ['aria-busy'] });
  button.click();
  window.setTimeout(() => {
    observer.disconnect();
    reject(new Error('Reset did not clear aria-busy'));
  }, 20_000);
}));
const samples = [];
let completed = false;
while (performance.now() - startedAt < 20_000) {
  const sample = await page.evaluate(() => {
    const loader = document.querySelector('#puzzle-loader');
    const progress = document.querySelector('#puzzle-loader-percent');
    return {
      hidden: loader?.getAttribute('aria-hidden'),
      text: loader?.textContent?.replace(/\s+/g, ' ').trim(),
      progressText: progress?.textContent?.trim(),
      progressStyle: progress?.getAttribute('style'),
    };
  });
  samples.push({ elapsedMs: Math.round(performance.now() - startedAt), ...sample });
  if (sample.hidden === 'true') {
    completed = true;
    break;
  }
  await page.waitForTimeout(100);
}

const durationMs = Math.round(performance.now() - startedAt);
await browser.close();
console.log(JSON.stringify({ durationMs, browserDurationMs, limitMs, completed, samples }, null, 2));
if (!completed || browserDurationMs > limitMs) process.exitCode = 1;
