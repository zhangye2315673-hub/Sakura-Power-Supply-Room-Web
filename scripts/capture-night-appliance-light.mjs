#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5190';
const outputDir = path.resolve(process.argv[3] ?? 'tmp/night-appliance-light');
const kind = process.argv[4] ?? 'lamp';
const seed = Number(process.argv[5] ?? 9);
const time = Number(process.argv[6] ?? 3.3);
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
await page.addInitScript((fixedTime) => {
  localStorage.removeItem('sakura.theme');
  window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = fixedTime;
}, time);

try {
  await page.goto(`${baseUrl}/?theme=night&seed=${seed}&mode=random&direct=1`);
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 120_000 });
  await page.click('#start-game-button');
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.sceneVisibility.appliances === true
      && diagnostics.opening.cameraPhase === 'idle'
      && diagnostics.clickTarget !== null;
  }, null, { timeout: 120_000 });

  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no layout box.');
  const clip = { x: box.x, y: box.y, width: box.width, height: box.height };
  const idleBuffer = await page.screenshot({ path: path.join(outputDir, `${kind}-idle.png`), clip });
  const activated = await page.evaluate((selected) => (
    window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.(selected) ?? false
  ), kind);
  if (!activated) throw new Error(`Unable to activate ${kind}.`);
  await page.waitForFunction(([selected, fixedTime]) => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    const active = diagnostics?.appliances.find((item) => item.kind === selected)?.state === 'active';
    const elapsed = diagnostics?.performances.elapsedByKind[selected] ?? -1;
    return active && Math.abs(elapsed - Number(fixedTime)) < 0.001;
  }, [kind, time], { timeout: 60_000 });
  await page.waitForTimeout(200);
  const activeBuffer = await page.screenshot({ path: path.join(outputDir, `${kind}-active.png`), clip });
  const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__);

  const idle = PNG.sync.read(idleBuffer);
  const active = PNG.sync.read(activeBuffer);
  let changedPixels = 0;
  let positiveLight = 0;
  for (let offset = 0; offset < idle.data.length; offset += 4) {
    const idleLight = idle.data[offset] * 0.2126 + idle.data[offset + 1] * 0.7152 + idle.data[offset + 2] * 0.0722;
    const activeLight = active.data[offset] * 0.2126 + active.data[offset + 1] * 0.7152 + active.data[offset + 2] * 0.0722;
    const delta = activeLight - idleLight;
    if (Math.abs(delta) > 10) changedPixels += 1;
    if (delta > 8) positiveLight += delta / 255;
  }
  const sensory = diagnostics?.sensory.find((item) => item.kind === kind);
  const report = {
    kind,
    time,
    changedPixels,
    positiveLight,
    sensory,
  };
  await writeFile(path.join(outputDir, `${kind}-report.json`), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!sensory || sensory.missingFunctionalNode || sensory.lightIntensity <= 0) {
    throw new Error(`${kind} has no active functional light.`);
  }
  if (changedPixels < 120 || positiveLight < 25) {
    throw new Error(`${kind} activation has no meaningful visible light response.`);
  }
} finally {
  await browser.close();
}
