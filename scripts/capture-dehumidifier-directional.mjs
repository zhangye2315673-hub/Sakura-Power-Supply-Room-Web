import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5190/model-review.html';
const outputDirectory = 'artifacts/img2threejs/dehumidifier/moisture-directional-final';
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader-webgl', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const captures = [];

for (const scenario of [
  { id: 'gather', powered: true, time: 1.55 },
  { id: 'climax', powered: true, time: 3.56 },
]) {
  for (const view of ['front', 'three-quarter']) {
    const url = new URL(baseUrl);
    url.searchParams.set('model', 'dehumidifier');
    url.searchParams.set('view', view);
    url.searchParams.set('power', '0');
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true);
    await page.evaluate(({ powered, time }) => {
      window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = time;
      window.__MODEL_REVIEW_SET_POWER__?.(powered);
    }, scenario);
    await page.waitForTimeout(180);
    const path = `${outputDirectory}/render-${scenario.id}-${view}.png`;
    await page.screenshot({ path });
    captures.push({
      scenario: scenario.id,
      view,
      path,
      diagnostics: await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__),
    });
  }
}

await browser.close();
console.log(JSON.stringify({ captures }, null, 2));
