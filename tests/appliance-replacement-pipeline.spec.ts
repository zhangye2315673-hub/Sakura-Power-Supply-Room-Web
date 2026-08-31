import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { APPLIANCE_CATALOG } from '../src/systems/ApplianceCatalog';
import {
  ApplianceScene,
  type ApplianceTarget,
} from '../src/systems/ApplianceScene';
import { enterPreparedGame } from './helpers/enterGame';

test('second-cycle replacement uses the bounded preload queue without a runtime model build', async () => {
  const colors = [
    0xffc857, 0x5f9ee8, 0xff5575, 0x4fc7b2,
    0xa987e8, 0xff8f4f, 0x8dc95f, 0xd47ab1,
  ];
  const scene = new ApplianceScene();
  scene.configure(1, APPLIANCE_CATALOG.slice(0, 8), colors);
  scene.setRequiredColors(colors);
  const camera = new THREE.PerspectiveCamera(26, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 13.6);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const internals = scene as unknown as {
    replaceTarget(
      previous: ApplianceTarget,
      camera: THREE.PerspectiveCamera,
      screenDepth: number,
      now: number,
    ): void;
  };
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    queueMicrotask(() => callback(performance.now()));
    return 1;
  };
  try {
    await scene.prepareInitialReplacementsAsync();
    const preloaded = scene.getReplacementDiagnostics();
    expect(preloaded.prepareCount).toBe(scene.targets.length * 3);
    expect(preloaded.preparedCount).toBe(scene.targets.length);
    expect(preloaded.queuedPreparedCount).toBe(scene.targets.length * 2);

    const prepareCount = preloaded.prepareCount;
    internals.replaceTarget(scene.targets[0], camera, 18.8, 0);
    const firstCommit = scene.getReplacementDiagnostics();
    internals.replaceTarget(scene.targets[0], camera, 18.8, 1);
    const secondCommit = scene.getReplacementDiagnostics();

    console.log(JSON.stringify({ preloaded, firstCommit, secondCommit }));
    expect(firstCommit.preparedHitCount).toBe(1);
    expect(firstCommit.prepareCount).toBe(prepareCount);
    expect(firstCommit.preparedCount).toBe(scene.targets.length);
    expect(firstCommit.queuedPreparedCount).toBe(scene.targets.length * 2 - 1);
    expect(secondCommit.preparedHitCount).toBe(2);
    expect(secondCommit.preparedMissCount).toBe(0);
    expect(secondCommit.prepareCount).toBe(prepareCount);
    expect(secondCommit.lastFallbackBuildMs).toBe(0);
    expect(secondCommit.lastCommitMs).toBeLessThanOrEqual(8);

    for (let index = 1; index < scene.targets.length; index += 1) {
      internals.replaceTarget(scene.targets[index], camera, 18.8, index * 2);
      internals.replaceTarget(scene.targets[index], camera, 18.8, index * 2 + 1);
      expect(new Set(scene.targets.map((target) => target.kind)).size).toBe(scene.targets.length);
    }
    const allSecondCycles = scene.getReplacementDiagnostics();
    expect(allSecondCycles.preparedHitCount).toBe(scene.targets.length * 2);
    expect(allSecondCycles.preparedMissCount).toBe(0);
    expect(allSecondCycles.prepareCount).toBe(prepareCount);
    expect(scene.getRoutingSummary().allRequiredCovered).toBe(true);
  } finally {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    scene.dispose();
  }
});

test('deep-cycle replacement commits a prepared model instead of building during the switch', async () => {
  const color = 0xffc857;
  const scene = new ApplianceScene();
  scene.configure(1, APPLIANCE_CATALOG.slice(0, 1), [color]);
  scene.setRequiredColors([color]);
  const camera = new THREE.PerspectiveCamera(26, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 13.6);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const internals = scene as unknown as {
    prepareReplacement(previous: ApplianceTarget): void;
    replaceTarget(
      previous: ApplianceTarget,
      camera: THREE.PerspectiveCamera,
      screenDepth: number,
      now: number,
    ): void;
  };
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    queueMicrotask(() => callback(performance.now()));
    return 1;
  };
  try {
    await scene.prepareInitialReplacementsAsync();
    internals.replaceTarget(scene.targets[0], camera, 18.8, 0);
    internals.replaceTarget(scene.targets[0], camera, 18.8, 1);

    internals.replaceTarget(scene.targets[0], camera, 18.8, 2);
    const thirdCommit = scene.getReplacementDiagnostics();
    console.log(JSON.stringify({ thirdCommit }));
    expect(thirdCommit.preparedHitCount).toBe(3);
    expect(thirdCommit.preparedMissCount).toBe(0);
    expect(thirdCommit.lastFallbackBuildMs).toBe(0);
    expect(thirdCommit.lastCommitMs).toBeLessThanOrEqual(8);
    expect(scene.getRoutingSummary().allRequiredCovered).toBe(true);
  } finally {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    scene.dispose();
  }
});

test('production appliance replacement reports prebuild, warmup, and prepared commit separately', async ({ page }) => {
  test.setTimeout(300_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?seed=1&mode=random&direct=1&theme=night');
  await enterPreparedGame(page);

  const initialReplacementState = await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__!.applianceReplacement,
  );
  const applianceCount = await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__!.appliances.length,
  );
  const initialRenderer = await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__!.renderer,
  );
    expect(initialReplacementState.prepareCount).toBe(applianceCount * 3);
    expect(initialReplacementState.preparedCount).toBe(applianceCount);
    expect(initialReplacementState.queuedPreparedCount).toBe(applianceCount * 2);

  const activatedKind = await page.evaluate(() => {
    const kind = window.__THREE_GAME_DIAGNOSTICS__?.appliances[0]?.kind;
    if (!kind) return null;
    return window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.(kind) ? kind : null;
  });
  expect(activatedKind).toBeTruthy();

  await page.evaluate(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0.8;
  });
  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.applianceReplacement.prepareCount ?? 0) > 0,
    null,
    { timeout: 90_000 },
  );
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.applianceReplacement.warmupPendingCount === 0,
    null,
    { timeout: 90_000 },
  );

  const beforeCommit = await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__!.applianceReplacement,
  );
  const secondActivation = await page.evaluate((firstKind) => {
    const kinds = window.__THREE_GAME_DIAGNOSTICS__?.appliances
      .map((item) => item.kind)
      .filter((kind) => kind !== firstKind) ?? [];
    return kinds.find((kind) => window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.(kind)) ?? null;
  }, activatedKind);
  expect(secondActivation).toBeTruthy();
  expect(await page.evaluate(() => window.__SETTLE_APPLIANCE_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.applianceReplacement.preparedHitCount ?? 0) > 0,
    null,
    { timeout: 30_000 },
  );
  const deepCycleKinds: string[] = [secondActivation!];
  for (let expectedHit = 2; expectedHit <= 3; expectedHit += 1) {
    const nextActivation = await page.evaluate(() => {
      const kinds = window.__THREE_GAME_DIAGNOSTICS__?.appliances.map((item) => item.kind) ?? [];
      return kinds.find((kind) => window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.(kind)) ?? null;
    });
    expect(nextActivation).toBeTruthy();
    if (!nextActivation) break;
    deepCycleKinds.push(nextActivation);
    expect(await page.evaluate(() => window.__SETTLE_APPLIANCE_FOR_EVIDENCE__?.() ?? false)).toBe(true);
    await page.waitForFunction(
      (hit) => (window.__THREE_GAME_DIAGNOSTICS__?.applianceReplacement.preparedHitCount ?? 0) >= hit,
      expectedHit,
      { timeout: 30_000 },
    );
  }
  const afterCommit = await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__!.applianceReplacement,
  );
  await page.waitForTimeout(500);
  const rendererAfterCommit = await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__!.renderer,
  );

  console.log(JSON.stringify({
    activatedKind,
    secondActivation,
    deepCycleKinds,
    beforeCommit,
    afterCommit,
    initialRenderer,
    rendererAfterCommit,
  }));
  expect(beforeCommit.lastPrepareBuildMs).toBeGreaterThan(0);
  expect(beforeCommit.lastWarmupMs).toBeGreaterThanOrEqual(0);
  expect(afterCommit.preparedHitCount).toBe(3);
  expect(afterCommit.preparedMissCount).toBe(0);
  expect(afterCommit.prepareCount).toBe(beforeCommit.prepareCount);
  expect(afterCommit.lastFallbackBuildMs).toBe(0);
  expect(afterCommit.lastCommitMs).toBeGreaterThanOrEqual(0);
  expect(rendererAfterCommit.geometries).toBeLessThanOrEqual(initialRenderer.geometries);
  expect(rendererAfterCommit.textures).toBe(initialRenderer.textures);
});
