import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const [
  passId = 'blockout',
  baseUrl = 'http://127.0.0.1:5190',
  view = 'three-quarter',
  extraQuery = '',
] = process.argv.slice(2);
const outputDirectory = path.resolve('docs', 'sculpt-specs', 'plug-cable-family', 'reviews', passId);
fs.mkdirSync(outputDirectory, { recursive: true });
const viewSuffix = `${view === 'three-quarter' ? '' : `-${view}`}${extraQuery ? '-debug' : ''}`;

const browser = await chromium.launch({ headless: true });
const viewport = passId === 'optimization-pass'
  ? { width: 1280, height: 720 }
  : { width: 1728, height: 972 };
const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

const extra = extraQuery ? `&${extraQuery}` : '';
await page.goto(`${baseUrl}/?showcase=plugs&review=${encodeURIComponent(passId)}&view=${encodeURIComponent(view)}${extra}`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('body.showcase-mode');
await page.waitForTimeout(900);
if (extraQuery.includes('parts=1')) {
  const canvasBounds = await page.locator('#game-canvas').boundingBox();
  if (!canvasBounds) throw new Error('Missing showcase canvas bounds.');
  for (const xRatio of [0.13, 0.25, 0.38]) {
    for (const yRatio of [0.42, 0.5, 0.58]) {
      await page.mouse.click(
        canvasBounds.x + canvasBounds.width * xRatio,
        canvasBounds.y + canvasBounds.height * yRatio,
      );
      if (await page.evaluate(() => Boolean(document.body.dataset.selectedPlugPart))) break;
    }
    if (await page.evaluate(() => Boolean(document.body.dataset.selectedPlugPart))) break;
  }
}
const renderScreenshot = path.join(outputDirectory, `render-showcase${viewSuffix}.png`);
await page.screenshot({ path: renderScreenshot, fullPage: true });
const canvasScreenshot = path.join(outputDirectory, `render-canvas${viewSuffix}.png`);
await page.locator('#game-canvas').screenshot({ path: canvasScreenshot });
const averageFrameMs = await page.evaluate(() => new Promise((resolve) => {
  const samples = [];
  let previous = performance.now();
  const sample = (now) => {
    samples.push(now - previous);
    previous = now;
    if (samples.length < 61) requestAnimationFrame(sample);
    else resolve(samples.slice(1).reduce((sum, value) => sum + value, 0) / 60);
  };
  requestAnimationFrame(sample);
}));

const diagnostics = await page.evaluate(() => ({
  labelCount: document.querySelectorAll('.showcase-labels span').length,
  bodyClasses: document.body.className,
  canvas: {
    width: document.querySelector('canvas')?.width ?? 0,
    height: document.querySelector('canvas')?.height ?? 0,
  },
  plug: window.__PLUG_SHOWCASE_DIAGNOSTICS__,
}));
diagnostics.frameBudget = {
  averageFrameMs,
  estimatedFps: 1000 / averageFrameMs,
};
fs.writeFileSync(
  path.join(outputDirectory, `capture-diagnostics${viewSuffix}.json`),
  `${JSON.stringify({ passId, baseUrl, view, diagnostics, errors }, null, 2)}\n`,
);
await browser.close();

if (errors.length) throw new Error(`Showcase emitted browser errors: ${errors.join(' | ')}`);
if (diagnostics.labelCount !== 7) throw new Error(`Expected 7 plug labels, found ${diagnostics.labelCount}`);
if (extraQuery.includes('parts=1') && !diagnostics.plug?.selectedPart) {
  throw new Error('Part debug mode did not select a component after raycast clicks.');
}
console.log(JSON.stringify({ renderScreenshot, canvasScreenshot, view, diagnostics }, null, 2));
