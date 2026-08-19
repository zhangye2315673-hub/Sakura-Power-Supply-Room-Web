import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ARTIFACT_DIR = path.resolve('artifacts/toaster-skill-test');

test('toaster skill test shows double-sided toast and the current toaster performance', async ({ page }) => {
  test.setTimeout(240_000);
  await mkdir(ARTIFACT_DIR, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?theme=day&mode=skill-test&direct=1');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  await page.click('#start-game-button');
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.skill?.testId === 'toaster'
        && diagnostics.totalArrows === 4
        && diagnostics.clickTarget !== null;
    },
    null,
    { timeout: 90_000 },
  );

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['toaster']);
  expect(initial.skill?.invulnerable).toBe(true);
  expect(initial.skill?.effectAssets).toEqual([]);
  await expect(page.locator('#skill-cue-source')).toHaveText('烤面包机');
  await expect(page.locator('#skill-cue-title')).toHaveText('双面翻烤');
  await expect(page.locator('#skill-cue-detail')).toHaveText('交换最多两根线的插头端与尾端。');
  await writeFile(path.join(ARTIFACT_DIR, 'toaster-skill-test-before.png'), await page.screenshot({ fullPage: true }));

  await page.evaluate(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0.8; });
  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.remainingArrows === 3
        && diagnostics.skill?.inputLocked === true
        && diagnostics.performances?.kinds.includes('toaster') === true
        && diagnostics.skill.toasterHeatSwap.active === true
        && diagnostics.skill.toasterHeatSwap.targetIds.length === 2
        && diagnostics.skill.screenEffect.mode === 'toaster-heat';
    },
    null,
    { timeout: 45_000 },
  );
  const triggered = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(triggered.skill?.effectAssets).toEqual([]);
  expect(triggered.performances?.kinds).toContain('toaster');
  expect(triggered.skill?.toasterHeatSwap).toMatchObject({
    phase: 'preheat',
    previewCount: 2,
    committed: false,
  });
  const targetIds = new Set(triggered.skill?.toasterHeatSwap.targetIds ?? []);
  expect(triggered.skill?.cableEffects
    .filter(({ id }) => targetIds.has(id))
    .every(({ glowStrength }) => glowStrength === 0)).toBe(true);
  await writeFile(path.join(ARTIFACT_DIR, 'toaster-skill-test-triggered.png'), await page.screenshot({ fullPage: true }));

  const setToasterTime = async (time: number, phase: string): Promise<ThreeGameDiagnostics> => {
    await page.evaluate((value) => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = value; }, time);
    await page.waitForFunction(
      ({ time, phase }) => {
        const transition = window.__THREE_GAME_DIAGNOSTICS__?.skill?.toasterHeatSwap;
        return transition?.phase === phase && Math.abs(transition.elapsed - time) < 0.04;
      },
      { time, phase },
      { timeout: 30_000 },
    );
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    return page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  };

  const preheat = await setToasterTime(2.2, 'preheat');
  expect(preheat.skill?.toasterHeatSwap.swapProgress).toBe(0);
  expect(preheat.skill?.toasterHeatSwap.lineProgress).toBe(0);
  expect(preheat.skill?.toasterHeatSwap.terminalProgress).toBe(0);
  expect(preheat.skill?.toasterHeatSwap.isolation).toBeGreaterThan(0.4);
  expect(preheat.skill?.screenEffect).toMatchObject({ mode: 'toaster-heat' });
  await writeFile(path.join(ARTIFACT_DIR, 'toaster-skill-test-preheat.png'), await page.screenshot({ fullPage: true }));

  const launchMove = await setToasterTime(3.36, 'compression');
  expect(launchMove.skill?.toasterHeatSwap.swapProgress).toBe(0);
  expect(launchMove.skill?.toasterHeatSwap.lineProgress).toBeGreaterThan(0);
  expect(launchMove.skill?.toasterHeatSwap.terminalProgress).toBe(0);
  expect(launchMove.skill?.toasterHeatSwap.isolation).toBeGreaterThan(0.9);
  await writeFile(path.join(ARTIFACT_DIR, 'toaster-skill-test-heat-compression.png'), await page.screenshot({ fullPage: true }));

  await page.evaluate(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 3.88;
    window.__APPLIANCE_PERFORMANCE_FLIGHT_TIME_OVERRIDE__ = 0.16;
  });
  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.performances?.activeByKind.toast ?? 0) > 0
      && window.__THREE_GAME_DIAGNOSTICS__?.skill?.toasterHeatSwap.phase === 'swap'
      && (window.__THREE_GAME_DIAGNOSTICS__?.skill?.toasterHeatSwap.swapProgress ?? 0) > 0.5,
    null,
    { timeout: 30_000 },
  );
  const swap = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(swap.performances?.activeByKind.toast).toBeGreaterThan(0);
  expect(swap.skill?.toasterHeatSwap.currentTopology).toBe('blend');
  expect(swap.skill?.toasterHeatSwap.lineProgress).toBe(1);
  expect(swap.skill?.toasterHeatSwap.terminalProgress).toBeGreaterThan(0.5);
  await writeFile(path.join(ARTIFACT_DIR, 'toaster-skill-test-toast-swap.png'), await page.screenshot({ fullPage: true }));

  const cooldown = await setToasterTime(4.62, 'release');
  expect(cooldown.skill?.toasterHeatSwap.swapProgress).toBe(1);
  await writeFile(path.join(ARTIFACT_DIR, 'toaster-skill-test-swapped-hold.png'), await page.screenshot({ fullPage: true }));

  await page.evaluate(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 5.13; });
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.toasterHeatSwap.phase === 'complete'
      && window.__THREE_GAME_DIAGNOSTICS__?.skill?.toasterHeatSwap.committed === true,
    null,
    { timeout: 30_000 },
  );
  const committed = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(committed.skill?.toasterHeatSwap.committed).toBe(true);
  expect(committed.skill?.cableEffects
    .filter(({ id }) => targetIds.has(id))
    .every(({ glowStrength }) => glowStrength === 0)).toBe(true);
  await writeFile(path.join(ARTIFACT_DIR, 'toaster-skill-test-committed.png'), await page.screenshot({ fullPage: true }));
  await writeFile(
    path.join(ARTIFACT_DIR, 'runtime-diagnostics.json'),
    `${JSON.stringify({ initial, triggered, preheat, launchMove, swap, cooldown, committed }, null, 2)}\n`,
    'utf8',
  );
  await page.evaluate(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = undefined;
    window.__APPLIANCE_PERFORMANCE_FLIGHT_TIME_OVERRIDE__ = undefined;
  });
});
