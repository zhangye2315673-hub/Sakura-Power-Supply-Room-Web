#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5190';
const outputDir = path.resolve(process.argv[3] ?? 'tmp/night-visual-check');
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
await page.addInitScript(() => {
  localStorage.removeItem('sakura.theme');
  window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 2.8;
});

const luminance = (data, offset) => (
  data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722
) / 255;
const chroma = (data, offset) => (
  Math.max(data[offset], data[offset + 1], data[offset + 2])
  - Math.min(data[offset], data[offset + 1], data[offset + 2])
) / 255;

function analyze(dayBuffer, nightBuffer, lanternBuffer) {
  const day = PNG.sync.read(dayBuffer);
  const night = PNG.sync.read(nightBuffer);
  const lantern = PNG.sync.read(lanternBuffer);
  let subjectCount = 0;
  let subjectDayLight = 0;
  let subjectNightLight = 0;
  let subjectDayChroma = 0;
  let subjectNightChroma = 0;
  let starPixels = 0;
  let lanternDelta = 0;
  let lanternSamples = 0;

  for (let y = 0; y < day.height; y += 1) {
    for (let x = 0; x < day.width; x += 1) {
      const offset = (y * day.width + x) * 4;
      const dayLight = luminance(day.data, offset);
      const nightLight = luminance(night.data, offset);
      const dayColor = chroma(day.data, offset);
      const nightColor = chroma(night.data, offset);

      if (
        x > day.width * 0.08 && x < day.width * 0.92
        && y > day.height * 0.26 && y < day.height * 0.84
        && dayColor > 0.12 && dayLight > 0.09 && dayLight < 0.88
      ) {
        subjectCount += 1;
        subjectDayLight += dayLight;
        subjectNightLight += nightLight;
        subjectDayChroma += dayColor;
        subjectNightChroma += nightColor;
      }

      if (
        x > day.width * 0.08 && x < day.width * 0.92
        && y > day.height * 0.08 && y < day.height * 0.42
        && nightLight > 0.55
      ) {
        const neighborX = Math.max(0, x - 4);
        const neighborOffset = (y * night.width + neighborX) * 4;
        if (nightLight - luminance(night.data, neighborOffset) > 0.15) starPixels += 1;
      }

      const dx = (x / day.width) - 0.65;
      const dy = (y / day.height) - 0.42;
      if (dx * dx + dy * dy < 0.09 * 0.09) {
        lanternDelta += Math.abs(luminance(lantern.data, offset) - nightLight);
        lanternSamples += 1;
      }
    }
  }

  return {
    subjectSamples: subjectCount,
    subjectLightRatio: subjectNightLight / Math.max(0.0001, subjectDayLight),
    subjectChromaRatio: subjectNightChroma / Math.max(0.0001, subjectDayChroma),
    starContrastPixels: starPixels,
    lanternMeanDelta: lanternDelta / Math.max(1, lanternSamples),
  };
}

try {
  await page.goto(`${baseUrl}/?mode=random&direct=1&seed=2679418801`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 120_000 });
  if (await page.locator('#start-game-button').isVisible()) await page.click('#start-game-button');
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.opening.active === false
      && diagnostics.sceneVisibility.appliances
      && diagnostics.appliances.length > 0
      && diagnostics.opening.cameraPhase === 'idle';
  }, null, { timeout: 120_000 });
  await page.waitForTimeout(400);

  const canvas = page.locator('#game-canvas');
  const initialBox = await canvas.boundingBox();
  if (!initialBox) throw new Error('Canvas has no layout box.');
  const clip = {
    x: initialBox.x,
    y: initialBox.y,
    width: initialBox.width,
    height: initialBox.height,
  };
  const dayBuffer = await page.screenshot({ path: path.join(outputDir, 'day.png'), clip });
  await page.locator('#theme-button').click();
  await page.waitForFunction(() => (window.__THREE_GAME_DIAGNOSTICS__?.theme.progress ?? 0) > 0.99);
  await page.waitForTimeout(250);
  const nightBuffer = await page.screenshot({ path: path.join(outputDir, 'night.png'), clip });

  const box = initialBox;
  // Aim at the cable bundle, not empty sky: the lantern must reveal model form.
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.42);
  await page.waitForTimeout(220);
  const lanternBuffer = await page.screenshot({ path: path.join(outputDir, 'lantern.png'), clip });
  const metrics = analyze(dayBuffer, nightBuffer, lanternBuffer);
  const ui = await page.evaluate(() => {
    const existing = document.querySelector('#home-button')?.getBoundingClientRect();
    const controls = [...document.querySelectorAll('#global-toolbar button')]
      .map((button) => button.getBoundingClientRect());
    const toolbar = document.querySelector('#global-toolbar');
    const style = toolbar ? getComputedStyle(toolbar) : null;
    return {
      existingHeight: existing?.height ?? 0,
      controlHeights: controls.map((rect) => rect.height),
      toolbarBorderWidth: style?.borderTopWidth ?? '',
      toolbarBackground: style?.backgroundColor ?? '',
      toolbarShadow: style?.boxShadow ?? '',
    };
  });
  const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme);
  const report = { metrics, ui, diagnostics, errors };
  await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));

  const failures = [];
  if (ui.controlHeights.some((height) => Math.abs(height - ui.existingHeight) > 0.6)) {
    failures.push('global controls do not match the existing top-button height');
  }
  if (ui.toolbarBorderWidth !== '0px' || ui.toolbarShadow !== 'none') {
    failures.push('global controls are wrapped in an extra framed panel');
  }
  if (metrics.subjectLightRatio < 0.34) failures.push('night subjects collapse below readable brightness');
  if (metrics.subjectChromaRatio < 0.48) failures.push('night cable/appliance color is not retained');
  if (metrics.starContrastPixels < 24) failures.push('night sky has too few visible high-contrast star pixels');
  if (metrics.lanternMeanDelta < 0.006) failures.push('lantern movement does not produce a visible local response');
  if (errors.length > 0) failures.push(`browser errors: ${errors.join(' | ')}`);
  if (failures.length > 0) throw new Error(failures.join('\n'));
} finally {
  await browser.close();
}
