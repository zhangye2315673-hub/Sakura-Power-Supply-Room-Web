import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const [passId = 'form-refinement', baseUrl = 'http://127.0.0.1:5190'] = process.argv.slice(2);
const outputDirectory = path.resolve('docs', 'sculpt-specs', 'plug-cable-family', 'reviews', passId);
fs.mkdirSync(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

await page.goto(`${baseUrl}/?seed=2679418801&mode=random&direct=1`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
if (await page.locator('#start-game-button').isVisible()) await page.click('#start-game-button');
await page.waitForFunction(
  () => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.seed === 2679418801
      && diagnostics.sceneVisibility.appliances
      && diagnostics.appliances.length === 8
      && diagnostics.clickTarget !== null;
  },
  null,
  { timeout: 150_000 },
);
await page.waitForTimeout(650);
const fullScreenshot = path.join(outputDirectory, 'render-game-seed-2679418801.png');
await page.screenshot({ path: fullScreenshot, fullPage: true });
const canvasScreenshot = path.join(outputDirectory, 'render-game-canvas.png');
await page.locator('#game-canvas').screenshot({ path: canvasScreenshot });
const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__);
fs.writeFileSync(
  path.join(outputDirectory, 'game-diagnostics.json'),
  `${JSON.stringify({ passId, diagnostics, errors }, null, 2)}\n`,
);
await browser.close();

if (errors.length) throw new Error(`Game emitted browser errors: ${errors.join(' | ')}`);
console.log(JSON.stringify({ fullScreenshot, canvasScreenshot, seed: diagnostics?.seed }, null, 2));
