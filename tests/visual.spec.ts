import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';
import { enterPreparedGame } from './helpers/enterGame';

type CanvasSample = {
  ok: boolean;
  reason: string;
  variance?: number;
  colorBuckets?: number;
};

async function sampleCanvas(page: import('@playwright/test').Page): Promise<CanvasSample> {
  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  if (!box || box.width < 32 || box.height < 32) {
    return { ok: false, reason: 'canvas-too-small' };
  }

  const buffer = await canvas.screenshot();
  const png = PNG.sync.read(buffer);
  let min = 255;
  let max = 0;
  let alphaPixels = 0;
  const buckets = new Set<string>();
  const stride = Math.max(1, Math.floor((png.width * png.height) / 4096));

  for (let pixel = 0; pixel < png.width * png.height; pixel += stride) {
    const offset = pixel * 4;
    const r = png.data[offset];
    const g = png.data[offset + 1];
    const b = png.data[offset + 2];
    const a = png.data[offset + 3];
    min = Math.min(min, r, g, b);
    max = Math.max(max, r, g, b);
    if (a > 0) alphaPixels += 1;
    buckets.add(`${r >> 4},${g >> 4},${b >> 4},${a >> 6}`);
  }

  const variance = max - min;
  return {
    ok: alphaPixels > 256 && (variance > 8 || buckets.size > 3),
    reason: 'sampled',
    variance,
    colorBuckets: buckets.size,
  };
}

test('renders, rotates, connects a cable, and activates an appliance', async ({ page }, testInfo) => {
  // The final full-page WebGL readback can take several seconds on software
  // or shared-GPU runners even after every gameplay assertion has passed.
  test.setTimeout(360_000);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/?seed=2679418801');
  await enterPreparedGame(page);
  await expect(page.locator('#game-canvas')).toBeVisible();
  await page.waitForFunction(
    () =>
      (window.__THREE_GAME_DIAGNOSTICS__?.frame ?? 0) > 10 &&
      window.__THREE_GAME_DIAGNOSTICS__?.clickTarget !== null,
  );

  const bootDiagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
  expect(bootDiagnostics?.seed).toBe(2679418801);
  expect(bootDiagnostics?.context.losses).toBe(0);
  expect(bootDiagnostics?.appliances.every((appliance) => appliance.state === 'idle')).toBe(true);

  const sample = await sampleCanvas(page);
  expect(sample, JSON.stringify(sample)).toMatchObject({ ok: true });

  const before = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows ?? 0);
  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.clickTarget ?? null);
  expect(target).not.toBeNull();
  if (target) {
    await page.locator('#game-canvas').click({
      position: { x: target.x, y: target.y },
    });
  }

  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.activeMotion?.pathDistance ?? 0) > 0.05,
  );
  const activeMotion = await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__?.activeMotion ?? null,
  );
  expect(activeMotion?.kind).toBe('exit');
  expect(activeMotion?.pathDistance ?? 0).toBeGreaterThan(0.05);
  expect(activeMotion?.rootOffset ?? 1).toBeLessThan(0.001);

  await expect
    .poll(
      async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows ?? 0),
      { timeout: 10_000 },
    )
    .toBe(before - 1);

  const duringFirstConnection = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
  expect(duringFirstConnection?.activeConnections ?? 0).toBeGreaterThan(0);
  const nextTarget = duringFirstConnection?.clickTarget;
  expect(nextTarget).not.toBeNull();
  if (nextTarget) {
    await page.locator('#game-canvas').click({
      position: { x: nextTarget.x, y: nextTarget.y },
    });
  }
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.activeMotion?.kind === 'exit',
  );
  await expect
    .poll(
      async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows ?? 0),
      { timeout: 10_000 },
    )
    .toBe(before - 2);
  await expect
    .poll(
      async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.activeConnections ?? 0),
      { timeout: 10_000 },
    )
    .toBe(0);


  const connectedDiagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
  expect(
    connectedDiagnostics?.appliances.filter((appliance) => appliance.state === 'active').length ?? 0,
  ).toBeGreaterThan(0);
  expect(
    connectedDiagnostics?.appliances.reduce((sum, appliance) => sum + appliance.connections, 0) ?? 0,
  ).toBeGreaterThan(0);
  await expect
    .poll(
      async () =>
        page.evaluate(
          () => window.__THREE_GAME_DIAGNOSTICS__?.appliances.filter((item) => item.state === 'active').length ?? 0,
        ),
      { timeout: 8_000 },
    )
    .toBe(0);
  const applianceLayoutBeforeOrbit = connectedDiagnostics?.appliances.map((appliance) => ({
    x: appliance.screenX,
    y: appliance.screenY,
  }));

  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.42, { steps: 8 });
    await page.mouse.up();
  }

  await page.waitForTimeout(160);
  const applianceLayoutAfterOrbit = await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__?.appliances ?? [],
  );
  expect(
    applianceLayoutAfterOrbit.map((appliance) => ({
      x: appliance.screenX,
      y: appliance.screenY,
    })),
  ).toEqual(applianceLayoutBeforeOrbit);

  // The expanded appliance catalog no longer guarantees that a specific model
  // (historically the toaster) is present for this deterministic seed. Exercise
  // the same drag contract against the first appliance in the generated cast.
  const dragTarget = applianceLayoutAfterOrbit[0];
  if (box && dragTarget) {
    await page.mouse.move(box.x + dragTarget.screenX * box.width, box.y + dragTarget.screenY * box.height);
    await page.mouse.down();
    await page.waitForTimeout(220);
    await page.mouse.move(box.x + box.width * 0.24, box.y + box.height * 0.4, { steps: 1 });
    await page.mouse.up();
    type LandingFrame = {
      dropping: boolean;
      dropOffset: number;
      rootScreenY: number;
      screenX: number;
      screenY: number;
      instanceId: string;
      landingImpactCount: number;
      landingContactSide: -1 | 0 | 1;
    };
    const landingFrames = await page.evaluate(async (id) => new Promise<LandingFrame[]>((resolve) => {
      const samples: LandingFrame[] = [];
      const startedAt = performance.now();
      const sample = () => {
        const frame = window.__THREE_GAME_DIAGNOSTICS__?.appliances.find(
          (appliance) => appliance.id === id,
        );
        if (!frame) {
          resolve(samples);
          return;
        }
        samples.push({
          dropping: frame.dropping,
          dropOffset: frame.dropOffset,
          rootScreenY: frame.rootScreenY,
          screenX: frame.screenX,
          screenY: frame.screenY,
          instanceId: frame.instanceId,
          landingImpactCount: frame.landingImpactCount,
          landingContactSide: frame.landingContactSide,
        });
        if (!frame.dropping || performance.now() - startedAt > 8_000) {
          resolve(samples);
          return;
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }), dragTarget.id);
    const finalDroppingFrame = [...landingFrames].reverse().find((frame) => frame.dropping);
    const settledFrame = [...landingFrames].reverse().find((frame) => !frame.dropping);
    expect(finalDroppingFrame).toBeDefined();
    expect(settledFrame).toBeDefined();
    // The last hard-surface contact may stop a few pixels of downward motion
    // instantly. Stable screen coordinates below verify that this impact does
    // not introduce a second landing offset.
    expect(Math.abs((settledFrame?.rootScreenY ?? 0) - (finalDroppingFrame?.rootScreenY ?? 0))).toBeLessThan(0.01);
    const observedTravel = Math.max(...landingFrames.map((frame) => frame.rootScreenY)) -
      Math.min(...landingFrames.map((frame) => frame.rootScreenY));
    expect(observedTravel).toBeGreaterThan(0.03);

    const reboundFrames = landingFrames.filter((frame) => frame.landingImpactCount > 0);
    expect(Math.max(...reboundFrames.map((frame) => frame.landingImpactCount))).toBe(5);
    expect(new Set(landingFrames.map((frame) => frame.instanceId))).toEqual(new Set([dragTarget.instanceId]));

    const contactSides = [1, 2, 3, 4, 5].map(
      (impact) => reboundFrames.find((frame) => frame.landingImpactCount === impact)?.landingContactSide ?? 0,
    );
    expect(contactSides.every((side) => side !== 0)).toBe(true);
    for (let index = 1; index < contactSides.length; index += 1) {
      expect(contactSides[index]).toBe(-contactSides[index - 1]);
    }

    const reboundPeaks = [1, 2, 3, 4, 5].map((impact) => Math.max(
      ...reboundFrames
        .filter((frame) => frame.landingImpactCount === impact)
        .map((frame) => -frame.dropOffset),
    ));
    for (let index = 1; index < reboundPeaks.length; index += 1) {
      expect(reboundPeaks[index]).toBeLessThan(reboundPeaks[index - 1] * 0.85);
    }

    const groundAnchor = reboundFrames[0];
    expect(groundAnchor).toBeDefined();
    expect(Math.max(...reboundFrames.map((frame) => Math.abs(frame.screenX - groundAnchor.screenX)))).toBeLessThan(0.00001);
    expect(Math.max(...reboundFrames.map((frame) => Math.abs(frame.screenY - groundAnchor.screenY)))).toBeLessThan(0.00001);
    expect(Math.abs((settledFrame?.screenX ?? 0) - groundAnchor.screenX)).toBeLessThan(0.00001);
    expect(Math.abs((settledFrame?.screenY ?? 0) - groundAnchor.screenY)).toBeLessThan(0.00001);
    await page.waitForFunction(
      (id) => !window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((appliance) => appliance.id === id)?.dropping,
      dragTarget.id,
      { timeout: 4_000 },
    );
  }
  const applianceAfterDrag = await page.evaluate(
    (id) => window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((appliance) => appliance.id === id),
    dragTarget?.id,
  );
  expect(applianceAfterDrag?.screenX ?? 1).toBeLessThan(0.4);
  expect(applianceAfterDrag?.facingSide).toBe(-1);
  expect(applianceAfterDrag?.dragging).toBe(false);
  expect(applianceAfterDrag?.dropping).toBe(false);

  const screenshot = await page.screenshot({ fullPage: true });
  await testInfo.attach(`${testInfo.project.name}-plug-cable-spirits`, {
    body: screenshot,
    contentType: 'image/png',
  });

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
