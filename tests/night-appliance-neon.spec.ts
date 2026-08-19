import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { APPLIANCE_CATALOG } from '../src/systems/ApplianceCatalog';
import { PAL } from '../src/style/palette';
import { enterPreparedGame } from './helpers/enterGame';

function canvasPixels(buffer: Buffer): { variance: number; coloredHighlights: number } {
  const png = PNG.sync.read(buffer);
  let minimum = 255;
  let maximum = 0;
  let coloredHighlights = 0;
  const stride = Math.max(1, Math.floor((png.width * png.height) / 12_000));
  for (let pixel = 0; pixel < png.width * png.height; pixel += stride) {
    const offset = pixel * 4;
    const red = png.data[offset];
    const green = png.data[offset + 1];
    const blue = png.data[offset + 2];
    minimum = Math.min(minimum, red, green, blue);
    maximum = Math.max(maximum, red, green, blue);
    if (Math.max(red, green, blue) > 105 && Math.max(red, green, blue) - Math.min(red, green, blue) > 28) {
      coloredHighlights += 1;
    }
  }
  return { variance: maximum - minimum, coloredHighlights };
}

test('all appliance neon stays on accent materials at night and clears in daylight', async ({ page }, testInfo) => {
  test.setTimeout(600_000);
  await page.goto('/?theme=night&seed=113148&mode=random&direct=1');
  await enterPreparedGame(page);
  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.theme.progress ?? 0) > 0.98
      && window.__THREE_GAME_DIAGNOSTICS__?.opening.cameraPhase === 'idle',
    null,
    { timeout: 30_000 },
  );
  const riskyAssignments = await page.evaluate(() => {
    const expected = new Set(['stand-mixer', 'dehumidifier', 'rice-cooker', 'smart-bin']);
    return (window.__THREE_GAME_DIAGNOSTICS__?.appliances ?? [])
      .filter((item) => expected.has(item.kind))
      .map((item) => [item.kind, item.accent] as const);
  });
  expect(Object.fromEntries(riskyAssignments)).toMatchObject({
    'stand-mixer': PAL.yellow,
    dehumidifier: PAL.orange,
    'rice-cooker': PAL.green,
    'smart-bin': PAL.blossomDeep,
  });

  const neon = await page.evaluate(() => (
    window.__THREE_GAME_DIAGNOSTICS__?.sensory.map((item) => ({
      kind: item.kind,
      materials: item.neonMaterialCount,
      intensity: item.neonIntensity,
      legacyLight: item.lightIntensity,
    })) ?? []
  ));
  expect(neon.length).toBeGreaterThan(0);
  expect(neon.every((item) => item.materials > 0 && item.intensity > 0.3)).toBe(true);
  expect(neon.every((item) => item.legacyLight === 0)).toBe(true);

  const desktopPixels = canvasPixels(await page.locator('#game-canvas').screenshot());
  expect(desktopPixels.variance).toBeGreaterThan(45);
  expect(desktopPixels.coloredHighlights).toBeGreaterThan(20);
  const screenshot = await page.screenshot({ fullPage: true });
  await testInfo.attach('night-appliance-neon-samples', {
    body: screenshot,
    contentType: 'image/png',
  });
  if (process.env.NEON_SCREENSHOT_PATH) {
    await writeFile(process.env.NEON_SCREENSHOT_PATH, screenshot);
  }

  await page.locator('#appliance-gallery-button').click();
  await expect(page.locator('#appliance-gallery')).toHaveAttribute('aria-hidden', 'false');
  const galleryKinds = APPLIANCE_CATALOG.map((definition) => definition.id);
  expect(galleryKinds).toHaveLength(29);
  for (const kind of galleryKinds) {
    await page.locator(`[data-appliance-kind="${kind}"]`).click();
    await page.waitForFunction(
      (selected) => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.selected === selected
        && (window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.neonMaterialCount ?? 0) > 0,
      kind,
    );
    const intensity = await page.evaluate(
      () => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.neonIntensity ?? 0,
    );
    expect(intensity).toBeGreaterThan(0.15);
    expect(intensity).toBeLessThan(0.24);
  }

  await page.locator('[data-appliance-kind="dehumidifier"]').click();
  await page.waitForFunction(
    () => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.selected === 'dehumidifier'
      && (window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.neonMaterialCount ?? 0) > 0,
  );
  const galleryNightIntensity = await page.evaluate(
    () => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.neonIntensity ?? 0,
  );
  expect(galleryNightIntensity).toBeGreaterThan(0.15);
  expect(galleryNightIntensity).toBeLessThan(0.24);
  const galleryNight = await page.locator('.appliance-gallery-canvas').screenshot();
  await testInfo.attach('dehumidifier-gallery-night-accent-neon', {
    body: galleryNight,
    contentType: 'image/png',
  });
  if (process.env.NEON_DEHUMIDIFIER_NIGHT_SCREENSHOT_PATH) {
    await writeFile(process.env.NEON_DEHUMIDIFIER_NIGHT_SCREENSHOT_PATH, galleryNight);
  }

  await page.locator('#theme-button').click();
  await expect.poll(
    async () => page.evaluate(() => document.documentElement.dataset.theme ?? ''),
    { timeout: 15_000 },
  ).toBe('day');
  for (const kind of galleryKinds) {
    await page.locator(`[data-appliance-kind="${kind}"]`).click();
    await expect.poll(
      async () => page.evaluate((selected) => {
        const diagnostics = window.__APPLIANCE_GALLERY_DIAGNOSTICS__;
        return diagnostics?.selected === selected ? diagnostics.neonIntensity : -1;
      }, kind),
      { timeout: 15_000 },
    ).toBe(0);
  }
  await page.locator('[data-appliance-kind="dehumidifier"]').click();
  const galleryDay = await page.locator('.appliance-gallery-canvas').screenshot();
  await testInfo.attach('dehumidifier-gallery-day-original-color', {
    body: galleryDay,
    contentType: 'image/png',
  });
  if (process.env.NEON_DEHUMIDIFIER_DAY_SCREENSHOT_PATH) {
    await writeFile(process.env.NEON_DEHUMIDIFIER_DAY_SCREENSHOT_PATH, galleryDay);
  }
  await page.locator('.appliance-gallery-header nav button:last-child').click();
  await page.locator('#theme-button').click();
  await expect.poll(
    async () => page.evaluate(() => document.documentElement.dataset.theme ?? ''),
    { timeout: 15_000 },
  ).toBe('night');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1_000);
  await enterPreparedGame(page);
  await expect(page.locator('#start-screen')).not.toBeVisible({ timeout: 150_000 });
  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.theme.progress ?? 0) > 0.98
      && window.__THREE_GAME_DIAGNOSTICS__?.sceneVisibility.appliances === true
      && window.__THREE_GAME_DIAGNOSTICS__?.opening.active === false
      && window.__THREE_GAME_DIAGNOSTICS__?.opening.cameraPhase === 'idle',
    null,
    { timeout: 150_000 },
  );
  const frame = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.frame ?? 0);
  await page.waitForFunction(
    (previousFrame) => (window.__THREE_GAME_DIAGNOSTICS__?.frame ?? 0) > previousFrame + 2,
    frame,
  );
  const mobilePixels = canvasPixels(await page.locator('#game-canvas').screenshot());
  expect(mobilePixels.variance).toBeGreaterThan(45);
  expect(mobilePixels.coloredHighlights).toBeGreaterThan(20);
  const mobileScreenshot = await page.screenshot({ fullPage: true });
  await testInfo.attach('night-appliance-neon-samples-mobile', {
    body: mobileScreenshot,
    contentType: 'image/png',
  });
  if (process.env.NEON_MOBILE_SCREENSHOT_PATH) {
    await writeFile(process.env.NEON_MOBILE_SCREENSHOT_PATH, mobileScreenshot);
  }
});
