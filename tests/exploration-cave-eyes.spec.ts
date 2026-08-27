import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';

const OUTPUT = path.resolve('artifacts/exploration-mode');

function countPeripheralRedPixels(buffer: Buffer): number {
  const png = PNG.sync.read(buffer);
  let count = 0;
  for (let y = 0; y < png.height * 0.72; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const peripheral = x < png.width * 0.3 || x > png.width * 0.7;
      if (!peripheral) continue;
      const offset = (y * png.width + x) * 4;
      const red = png.data[offset];
      const green = png.data[offset + 1];
      const blue = png.data[offset + 2];
      if (red > 72 && red > green * 1.75 && red > blue * 1.5) count += 1;
    }
  }
  return count;
}

test('exploration cave eyes and powered appliances stay readable in extreme night', async ({ page }, testInfo) => {
  test.setTimeout(260_000);
  await mkdir(OUTPUT, { recursive: true });
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=night&seed=1&mode=explore&direct=1');
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.ready === true && diagnostics.totalArrows > 0;
    },
    null,
    { timeout: 120_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.theme.explorationEyes.progress ?? 0) > 0.98,
  );
  await page.waitForTimeout(450);

  const canvas = page.locator('#game-canvas');
  const firstFrame = await canvas.screenshot();
  await page.waitForTimeout(650);
  const secondFrame = await canvas.screenshot();
  await writeFile(path.join(OUTPUT, 'cave-eyes-open.png'), firstFrame);
  await writeFile(path.join(OUTPUT, 'cave-eyes-blink.png'), secondFrame);
  await testInfo.attach('cave-eyes-open', { body: firstFrame, contentType: 'image/png' });
  await testInfo.attach('cave-eyes-blink', { body: secondFrame, contentType: 'image/png' });

  const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.theme.explorationEyes);
  expect(diagnostics.pairs).toBeGreaterThanOrEqual(10);
  expect(diagnostics.progress).toBeGreaterThan(0.98);
  expect(countPeripheralRedPixels(firstFrame)).toBeGreaterThan(8);
  expect(countPeripheralRedPixels(secondFrame)).toBeGreaterThan(8);
  expect(firstFrame.equals(secondFrame)).toBe(false);

  const activatedKind = await page.evaluate(() => {
    const preferred = ['induction-cooktop', 'toaster', 'blender', 'printer', 'coffee-maker', 'gumball-machine'];
    const available = window.__THREE_GAME_DIAGNOSTICS__?.appliances.map((item) => item.kind) ?? [];
    const candidates = [...preferred.filter((kind) => available.includes(kind)), ...available];
    return candidates.find((kind) => window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.(kind)) ?? null;
  });
  expect(activatedKind).not.toBeNull();
  await page.evaluate(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0.86;
  });
  await page.waitForFunction(
    (kind) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      const appliance = diagnostics?.appliances.find((item) => item.kind === kind);
      const sensory = diagnostics?.sensory.find((item) => item.kind === kind);
      return appliance?.state === 'active'
        && (appliance.animationSignal ?? 0) > 0.01
        && (sensory?.poweredReveal ?? 0) > 0.7
        && (sensory?.lightIntensity ?? 0) > 0.8;
    },
    activatedKind,
    { timeout: 30_000 },
  );
  const poweredFrame = await canvas.screenshot();
  await writeFile(path.join(OUTPUT, 'cave-eyes-powered-appliance.png'), poweredFrame);
  await testInfo.attach('cave-eyes-powered-appliance', { body: poweredFrame, contentType: 'image/png' });
});
