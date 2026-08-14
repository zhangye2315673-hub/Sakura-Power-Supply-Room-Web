import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5190';
const outputDir = path.resolve('artifacts', 'soft-deform');
const viewports = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 390, height: 844 },
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch();

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseUrl}/?seed=2`);
    await page.waitForFunction(() => (window.__THREE_GAME_DIAGNOSTICS__?.frame ?? 0) > 0);
    await page.click('#appliance-gallery-button');
    await page.locator('[data-appliance-kind="refrigerator"]').evaluate((button) => button.click());
    await page.waitForFunction(() =>
      window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.selected === 'refrigerator',
    );
    await page.getByRole('button', { name: '暂停自转' }).evaluate((button) => button.click());

    const canvas = page.locator('.appliance-gallery-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error(`Missing gallery canvas at ${viewport.name} viewport.`);
    const startX = box.x + box.width * 0.5;
    const startY = box.y + box.height * 0.5;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + Math.min(96, box.width * 0.24), startY - 20, { steps: 10 });
    await page.waitForFunction(() =>
      (window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.deformPull ?? 0) > 1,
    );

    const canvasImage = PNG.sync.read(await canvas.screenshot());
    const background = [canvasImage.data[0], canvasImage.data[1], canvasImage.data[2]];
    let foregroundPixels = 0;
    for (let index = 0; index < canvasImage.data.length; index += 4) {
      const difference =
        Math.abs(canvasImage.data[index] - background[0]) +
        Math.abs(canvasImage.data[index + 1] - background[1]) +
        Math.abs(canvasImage.data[index + 2] - background[2]);
      if (difference > 35) foregroundPixels += 1;
    }
    const foregroundRatio = foregroundPixels / (canvasImage.width * canvasImage.height);
    if (foregroundRatio < 0.015) {
      throw new Error(`Gallery canvas appears blank at ${viewport.name}: ${foregroundRatio.toFixed(4)}`);
    }

    const screenshotPath = path.join(outputDir, `refrigerator-squish-${viewport.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await page.mouse.up();

    const reboundSamples = [];
    for (let index = 0; index < 60; index += 1) {
      await page.waitForTimeout(50);
      reboundSamples.push(await page.evaluate(() =>
        window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.deformPull ?? 0,
      ));
    }
    let reboundPeaks = 0;
    for (let index = 1; index < reboundSamples.length - 1; index += 1) {
      if (
        reboundSamples[index] > 0.025 &&
        reboundSamples[index] > reboundSamples[index - 1] &&
        reboundSamples[index] >= reboundSamples[index + 1]
      ) reboundPeaks += 1;
    }
    if (reboundPeaks < 2) {
      throw new Error(`Expected multiple rebound peaks at ${viewport.name}, received ${reboundPeaks}.`);
    }

    console.log(JSON.stringify({
      viewport: viewport.name,
      foregroundRatio,
      reboundPeaks,
      screenshotPath,
    }));
    await page.close();
  }
} finally {
  await browser.close();
}
