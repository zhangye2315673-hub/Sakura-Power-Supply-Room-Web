import { test, expect } from '@playwright/test';

type CableEffect = { id: string; overheatAmount: number };

function heatedCableId(effects: CableEffect[]): string {
  const heated = effects.find((effect) => effect.overheatAmount > 0.5);
  if (!heated) throw new Error('Expected one overheated cable');
  return heated.id;
}

test('microwave overheat marker is readable across the full cable in a multi-line board', async ({ page }, testInfo) => {
  test.setTimeout(420_000);
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 1.25;
    window.__COLLECT_ALL_CLICK_TARGETS_FOR_EVIDENCE__ = false;
  });
  const measureFps = async (): Promise<number> => page.evaluate(async () => {
    const start = performance.now();
    let frames = 0;
    await new Promise<void>((resolve) => {
      const countFrame = (now: number): void => {
        frames += 1;
        if (now - start >= 1_800) resolve();
        else requestAnimationFrame(countFrame);
      };
      requestAnimationFrame(countFrame);
    });
    return frames / ((performance.now() - start) / 1_000);
  });
  await page.goto('/?theme=day&mode=skill&direct=1&seed=20260825');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.mode === 'skill'
        && diagnostics.skill?.inputLocked === false
        && diagnostics.appliances.some(({ kind }) => kind === 'microwave')
        && diagnostics.totalArrows > 4
        && diagnostics.opening.transitioning === false;
    },
    null,
    { timeout: 90_000 },
  );
  await page.screenshot({ path: testInfo.outputPath('microwave-before-trigger.png'), fullPage: true });
  const baselineFps = await measureFps();

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(await page.evaluate(() => (
    window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.('microwave') ?? false
  ))).toBe(true);
  await page.waitForFunction(
    (initialTotal) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.remainingArrows === initialTotal - 1
        && diagnostics.skill?.debuff === 'overheated-plug'
        && diagnostics.skill.screenEffect.mode === 'microwave-heat'
        && diagnostics.skill.screenEffect.progress > 0
        && diagnostics.skill.effectAssets.includes('microwave-double-heat-ring');
    },
    initial.totalArrows,
    { timeout: 45_000 },
  );

  await page.screenshot({ path: testInfo.outputPath('microwave-overheat-reveal-start.png'), fullPage: true });
  await page.waitForTimeout(220);
  await page.screenshot({ path: testInfo.outputPath('microwave-overheat-reveal-mid.png'), fullPage: true });
  await page.waitForTimeout(500);
  await page.screenshot({ path: testInfo.outputPath('microwave-overheat-two-chances.png'), fullPage: true });
  await page.screenshot({
    path: testInfo.outputPath('microwave-overheat-plug-continuity.png'),
    clip: { x: 470, y: 285, width: 440, height: 360 },
  });

  const markerDiagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.microwaveMarkers);
  const screenEffect = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.screenEffect);
  expect(screenEffect.mode).toBe('microwave-heat');
  expect(screenEffect.progress).toBeGreaterThan(0);
  expect(markerDiagnostics).toHaveLength(1);
  expect(markerDiagnostics[0].cableId).toBe(heatedCableId(await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__!.skill!.cableEffects,
  )));
  expect(markerDiagnostics[0].rings.map((ring) => ring.type)).toEqual(['Mesh', 'Mesh']);
  expect(markerDiagnostics[0].rings.every((ring) => ring.depthTest)).toBe(true);

  const orbitBefore = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.orbit);
  const canvasBox = await page.locator('canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  await page.mouse.move(canvasBox!.x + canvasBox!.width * 0.62, canvasBox!.y + canvasBox!.height * 0.52);
  await page.mouse.down();
  await page.mouse.move(
    canvasBox!.x + canvasBox!.width * 0.26,
    canvasBox!.y + canvasBox!.height * 0.52,
    { steps: 4 },
  );
  await page.mouse.up();
  await page.waitForTimeout(700);
  const orbitAfter = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.orbit);
  expect(Math.abs(orbitAfter.yaw - orbitBefore.yaw)).toBeGreaterThan(0.25);
  await page.screenshot({ path: testInfo.outputPath('microwave-overheat-side-view.png'), fullPage: true });

  const heated = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.cableEffects
    .filter((cable) => cable.overheatAmount > 0.5));
  expect(heated).toHaveLength(1);
  expect(heated[0].overheatReveal).toBeGreaterThan(0.95);
  expect(heated[0].overheatTurns).toBe(2);
  expect(heated[0].plugOverheatAmount).toBeGreaterThan(0.5);
  expect(heated[0].plugOverheatReveal).toBeGreaterThan(0.95);
  expect(heated[0].plugOverheatMaterialCount).toBe(5);
  expect(heated[0].plugOverheatPathScale).toBeGreaterThan(0);
  expect(heated[0].plugOverheatPathScale).toBeLessThan(0.3);
  expect(heated[0].glowStrength).toBeGreaterThan(0.3);
  expect(heated[0].glowStrength).toBeLessThan(0.55);

  const heatedFps = await measureFps();
  console.log(JSON.stringify({ baselineFps, heatedFps, ratio: heatedFps / baselineFps }));
  expect(heatedFps).toBeGreaterThan(Math.min(2, baselineFps * 0.72));
  expect(heatedFps / baselineFps).toBeGreaterThan(0.72);
  expect(consoleErrors.filter((entry) => (
    /shader error|glsl|validate_status.*false|program.*not valid|webgl.*invalid|context lost/i.test(entry)
  ))).toEqual([]);
});
