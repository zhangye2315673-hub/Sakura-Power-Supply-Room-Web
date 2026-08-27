import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';

const SEED = 2679418801;
const OUTPUT = path.resolve('artifacts/exploration-mode');

function regionLuminance(
  buffer: Buffer,
  region: { x: number; y: number; width: number; height: number },
): number {
  const png = PNG.sync.read(buffer);
  const left = Math.max(0, Math.floor(region.x));
  const top = Math.max(0, Math.floor(region.y));
  const right = Math.min(png.width, Math.ceil(region.x + region.width));
  const bottom = Math.min(png.height, Math.ceil(region.y + region.height));
  let total = 0;
  let count = 0;
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const offset = (y * png.width + x) * 4;
      total += png.data[offset] * 0.2126
        + png.data[offset + 1] * 0.7152
        + png.data[offset + 2] * 0.0722;
      count += 1;
    }
  }
  return count > 0 ? total / count : 0;
}

async function capturePrepared(page: import('@playwright/test').Page, mode: 'random' | 'explore') {
  await page.goto(`/?theme=night&seed=${SEED}&mode=${mode}&direct=1`);
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 120_000 },
  );
  if (await page.locator('#start-game-button').isVisible()) await page.click('#start-game-button');
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.opening.transitioning === false
        && diagnostics.sceneVisibility.arrows
        && diagnostics.sceneVisibility.appliances
        && diagnostics.totalArrows > 0
        && diagnostics.appliances.length > 0;
    },
    null,
    { timeout: 150_000 },
  );
  await page.waitForFunction(() => {
    const curtain = document.querySelector<HTMLElement>('#scene-transition-curtain');
    return !curtain || Number.parseFloat(getComputedStyle(curtain).opacity) < 0.01;
  });
  await page.waitForFunction(() => (window.__THREE_GAME_DIAGNOSTICS__?.theme.progress ?? 0) > 0.98);
  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Game canvas is not measurable');
  await canvas.dispatchEvent('pointermove', {
    pointerType: 'mouse',
    clientX: box.x + box.width * 0.08,
    clientY: box.y + box.height * 0.08,
  });
  await page.waitForTimeout(500);
  const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  return {
    screenshot: await page.screenshot(),
    box,
    diagnostics,
  };
}

test('exploration entry reuses the random challenge contract and locks extreme night', async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto('/');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  await page.click('#challenge-mode-button');
  await expect(page.locator('#start-explore-button')).toHaveText('探索模式');
  await page.click('#start-explore-button');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === false, null, { timeout: 120_000 });
  await page.waitForURL((url) => url.searchParams.get('mode') === 'explore', { timeout: 90_000 });
  const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(diagnostics.mode).toBe('random');
  expect(diagnostics.exploration).toEqual({
    active: true,
    environmentScale: 0.015,
    lanternPreserved: true,
  });
  expect(diagnostics.randomLives).toBe(3);
  expect(diagnostics.theme.targetMode).toBe('night');
  await expect(page.locator('#theme-button')).toBeDisabled();
  expect(new URL(page.url()).searchParams.get('mode')).toBe('explore');
});

test('exploration hides the cable bundle away from the unchanged lantern', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  await mkdir(OUTPUT, { recursive: true });
  const exploration = await capturePrepared(page, 'explore');
    const centralRegion = {
      x: exploration.box.x + exploration.box.width * 0.27,
      y: exploration.box.y + exploration.box.height * 0.18,
      width: exploration.box.width * 0.46,
      height: exploration.box.height * 0.64,
    };
    const darkLuma = regionLuminance(exploration.screenshot, centralRegion);
    await writeFile(path.join(OUTPUT, 'exploration-dark.png'), exploration.screenshot);
    await writeFile(path.join(OUTPUT, 'exploration-diagnostics.json'), `${JSON.stringify(exploration.diagnostics, null, 2)}\n`);
    await testInfo.attach('exploration-dark', { body: exploration.screenshot, contentType: 'image/png' });

    await page.locator('#game-canvas').dispatchEvent('pointermove', {
      pointerType: 'mouse',
      clientX: exploration.box.x + exploration.box.width * 0.5,
      clientY: exploration.box.y + exploration.box.height * 0.5,
    });
    await page.waitForTimeout(500);
    const litScreenshot = await page.screenshot();
    const lanternAfter = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.theme.lantern);
    await writeFile(path.join(OUTPUT, 'exploration-lantern.png'), litScreenshot);
    const lanternRegion = {
      x: exploration.box.x + exploration.box.width * 0.5 - 100,
      y: exploration.box.y + exploration.box.height * 0.5 - 100,
      width: 200,
      height: 200,
    };
    const darkLocalLuma = regionLuminance(exploration.screenshot, lanternRegion);
    const litLocalLuma = regionLuminance(litScreenshot, lanternRegion);
    await writeFile(path.join(OUTPUT, 'diagnostics.json'), `${JSON.stringify({
      darkLuma,
      darkLocalLuma,
      litLocalLuma,
      lanternBefore: exploration.diagnostics.theme.lantern,
      lanternAfter,
    }, null, 2)}\n`);
    await testInfo.attach('exploration-lantern', { body: litScreenshot, contentType: 'image/png' });
    await testInfo.attach('lantern-luminance', {
      body: Buffer.from(JSON.stringify({ darkLuma, darkLocalLuma, litLocalLuma }, null, 2)),
      contentType: 'application/json',
    });
    expect(darkLuma).toBeLessThan(72);
    expect(litLocalLuma).toBeGreaterThan(darkLocalLuma * 1.35);
    expect(lanternAfter.position[0]).toBeGreaterThan(-0.08);
    expect(lanternAfter.position[0]).toBeLessThan(0.08);
    expect(lanternAfter.position[1]).toBeGreaterThan(-0.08);
    expect(lanternAfter.position[1]).toBeLessThan(0.08);
    expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.intensity ?? 0))
      .toBeGreaterThan(0.95);
    expect(exploration.diagnostics.sensory.some((item) => item.neonMaterialCount > 0)).toBe(true);
});

test('exploration strengthens appliance neon and fades in the powered appliance', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  await mkdir(OUTPUT, { recursive: true });
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0.08;
  });
  const exploration = await capturePrepared(page, 'explore');
  expect(exploration.diagnostics.sensory.every((item) => item.neonIntensity > 0.52)).toBe(true);
  expect(exploration.diagnostics.sensory.every((item) => item.neonIntensity < 0.82)).toBe(true);

  const activatedKind = await page.evaluate(() => {
    const kinds = window.__THREE_GAME_DIAGNOSTICS__?.appliances.map((item) => item.kind) ?? [];
    return kinds.find((kind) => window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.(kind)) ?? null;
  });
  expect(activatedKind).not.toBeNull();
  await page.waitForFunction(
    (kind) => window.__THREE_GAME_DIAGNOSTICS__?.sensory.some((item) => (
      item.kind === kind && item.state === 'active'
    )),
    activatedKind,
    { timeout: 30_000 },
  );
  const earlyReveal = await page.evaluate((kind) => (
    window.__THREE_GAME_DIAGNOSTICS__?.sensory.find((item) => item.kind === kind)?.poweredReveal ?? 1
  ), activatedKind);
  expect(earlyReveal).toBeLessThan(0.1);
  await page.evaluate(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0.72;
  });
  await page.waitForFunction(
    (kind) => window.__THREE_GAME_DIAGNOSTICS__?.sensory.some((item) => (
      item.kind === kind
      && item.state === 'active'
      && item.poweredReveal > 0.7
    )),
    activatedKind,
    { timeout: 30_000 },
  );
  await page.waitForFunction(
    (kind) => (window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === kind)?.animationSignal ?? 0) > 0.01,
    activatedKind,
    { timeout: 30_000 },
  );

  const activeScreenshot = await page.screenshot();
  await writeFile(path.join(OUTPUT, 'exploration-powered-appliance.png'), activeScreenshot);
  await testInfo.attach('exploration-powered-appliance', {
    body: activeScreenshot,
    contentType: 'image/png',
  });
  const active = await page.evaluate((kind) => {
    const appliance = window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === kind);
    const sensory = window.__THREE_GAME_DIAGNOSTICS__?.sensory.find((item) => item.kind === kind);
    return { appliance, sensory };
  }, activatedKind);
  expect(active.appliance?.state).toBe('active');
  expect(active.appliance?.animationSignal).toBeGreaterThan(0.01);
  expect(active.sensory?.poweredReveal).toBeGreaterThan(0.7);
});
