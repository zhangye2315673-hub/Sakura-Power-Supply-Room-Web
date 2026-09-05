import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createLampModel } from '../src/appliances/models/lamp';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import {
  LAMP_BEAM_FAR_TO_NEAR_RATIO,
  LAMP_BEAM_SOURCE_RADIUS_LOCAL,
  LAMP_HEAD_KEYFRAMES,
  sampleLampHeadPose,
} from '../src/appliances/performance/LampPerformance';
import {
  AppliancePerformanceSystem,
  type AppliancePerformanceTarget,
} from '../src/systems/AppliancePerformanceSystem';
import { PetalField } from '../src/systems/PetalField';

test('lamp head uses one continuous left-center-right-center-up-center timeline', () => {
  const model = createLampModel({ id: 'lamp', accent: 0xe8aec4 });
  const animation = createApplianceMechanicalAnimation('lamp', model.root);
  const head = model.root.getObjectByName('lamp-head-hinge-pivot');
  expect(head).toBeTruthy();
  const restPitch = head!.rotation.x;

  const samples = [
    { time: 0.84, phase: 'look-left', rollSign: 1 },
    { time: 1.38, phase: 'return-from-left', rollSign: 0 },
    { time: 1.96, phase: 'look-right', rollSign: -1 },
    { time: 2.54, phase: 'return-from-right', rollSign: 0 },
    { time: 3.30, phase: 'look-up', rollSign: 0 },
    { time: 4.36, phase: 'settle', rollSign: 0 },
  ] as const;

  for (const sample of samples) {
    animation.update(sample.time, 1);
    expect(head!.userData.performancePhase).toBe(sample.phase);
    if (sample.rollSign > 0) expect(head!.rotation.z).toBeGreaterThan(0.42);
    else if (sample.rollSign < 0) expect(head!.rotation.z).toBeLessThan(-0.42);
    else expect(Math.abs(head!.rotation.z)).toBeLessThan(0.025);
  }
  animation.update(3.30, 1);
  expect(head!.rotation.x).toBeLessThan(restPitch - 0.44);
  animation.update(5.20, 1);
  expect(head!.rotation.x).toBeCloseTo(restPitch, 7);
  expect(head!.rotation.z).toBeCloseTo(0, 7);

  for (const frame of LAMP_HEAD_KEYFRAMES.slice(1, -1)) {
    const before = sampleLampHeadPose(frame.time - 0.0001);
    const after = sampleLampHeadPose(frame.time + 0.0001);
    expect(Math.abs(after.pitch - before.pitch), `pitch jump at ${frame.time}s`).toBeLessThan(0.002);
    expect(Math.abs(after.roll - before.roll), `roll jump at ${frame.time}s`).toBeLessThan(0.002);
  }

  animation.stop();
  expect(head!.rotation.x).toBeCloseTo(restPitch, 7);
  expect(head!.rotation.z).toBeCloseTo(0, 7);
});

test('lamp shares one socket-driven physical spotlight, widening volume and ground pool', () => {
  const model = createLampModel({ id: 'lamp', accent: 0xe8aec4 });
  expect(model.root.getObjectByName('lamp-inner-reflector')).toBeTruthy();
  expect(model.root.getObjectByName('lamp-bulb-volume')).toBeTruthy();
  const socket = model.root.getObjectByName('lamp-light-socket');
  expect(socket?.userData.apertureRadius).toBe(LAMP_BEAM_SOURCE_RADIUS_LOCAL);

  const performances = new AppliancePerformanceSystem();
  const petals = new PetalField(1);
  const camera = new THREE.PerspectiveCamera(31, 16 / 9, 0.1, 80);
  camera.position.set(4, 3, 8);
  camera.lookAt(0, 1.8, 0);
  camera.updateMatrixWorld(true);
  let elapsed = 3.30;
  const target: AppliancePerformanceTarget = {
    root: model.root,
    state: 'active',
    kind: 'lamp',
    facingSide: 1,
    getActiveElapsed: () => elapsed,
  };
  performances.update(1 / 60, elapsed, camera, [target], petals);

  const state = performances.getStateSummary();
  expect(state.sessions).toBe(1);
  expect(state.timelineOwners).toBe(1);
  expect(state.elapsedByKind.lamp).toBeCloseTo(elapsed, 7);
  expect(state.lampBeam).not.toBeNull();
  expect(state.lampBeam!.geometryAxis).toBe('-Y-near/+Y-far');
  expect(state.lampBeam!.sourceRadius).toBeCloseTo(LAMP_BEAM_SOURCE_RADIUS_LOCAL, 7);
  expect(state.lampBeam!.farToNearRatio).toBeCloseTo(LAMP_BEAM_FAR_TO_NEAR_RATIO, 7);
  expect(state.lampBeam!.farRadius).toBeGreaterThan(state.lampBeam!.sourceRadius * 3);
  expect(state.lampBeam!.spotAngle).toBeGreaterThanOrEqual(0.18);
  expect(state.lampBeam!.headPhase).toBe('look-up');

  const beam = performances.root.getObjectByName('lamp-volumetric-light-cone') as THREE.Mesh;
  const pool = performances.root.getObjectByName('lamp-ground-light-pool-volume') as THREE.Mesh;
  const spot = performances.root.getObjectByName('lamp-physical-spotlight') as THREE.SpotLight;
  expect(beam.userData.performanceEffect).toBe(true);
  expect(pool.userData.performanceEffect).toBe(true);
  expect(spot.userData.performanceEffect).toBe(true);
  expect(beam.visible).toBe(true);
  expect(beam.material).toBeInstanceOf(THREE.ShaderMaterial);
  expect(beam.geometry).toBeInstanceOf(THREE.CylinderGeometry);
  expect(pool.visible).toBe(true);
  expect(pool.material).toBeInstanceOf(THREE.ShaderMaterial);
  expect(pool.geometry).toBeInstanceOf(THREE.CylinderGeometry);
  expect(spot.visible).toBe(true);
  expect(spot.target.position.distanceTo(new THREE.Vector3(...state.lampBeam!.groundSpot))).toBeLessThan(0.02);

  const position = beam.geometry.getAttribute('position');
  let nearRadius = 0;
  let farRadius = 0;
  for (let index = 0; index < position.count; index += 1) {
    const radius = Math.hypot(position.getX(index), position.getZ(index));
    if (Math.abs(position.getY(index) + 0.5) < 0.001) nearRadius = Math.max(nearRadius, radius);
    if (Math.abs(position.getY(index) - 0.5) < 0.001) farRadius = Math.max(farRadius, radius);
  }
  expect(nearRadius).toBeCloseTo(1, 5);
  expect(farRadius).toBeCloseTo(LAMP_BEAM_FAR_TO_NEAR_RATIO, 5);

  elapsed = 4.36;
  performances.update(1 / 60, elapsed, camera, [target], petals);
  expect(performances.getStateSummary().lampBeam?.headPhase).toBe('settle');
  performances.stop(target);
  expect(beam.visible).toBe(false);
  expect(pool.visible).toBe(false);
  expect(spot.visible).toBe(true);
  expect(spot.intensity).toBe(0);
  performances.dispose();
  petals.dispose();
});

test('正式技能入口第一次点亮台灯时不产生独立的整画面长帧', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 3.3;
    window.__COLLECT_ALL_CLICK_TARGETS_FOR_EVIDENCE__ = false;
  });
  await page.goto('/?theme=day&mode=skill&direct=1&seed=20260829');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.opening.active === false
      && diagnostics.opening.transitioning === false
      && diagnostics.skill?.inputLocked === false
      && diagnostics.applianceReplacement.warmupPendingCount === 0
      && diagnostics.appliances.some(({ kind }) => kind === 'lamp');
  }, null, { timeout: 45_000 });

  await page.evaluate(() => {
    const samples: Array<{
      ms: number;
      activationRequested: boolean;
      lampActive: boolean;
      prepareCount: number;
      preparedCount: number;
      warmupPendingCount: number;
      lastFromKind: string | null;
      lastToKind: string | null;
      lastWarmupMs: number;
    }> = [];
    let previous = performance.now();
    let active = true;
    let activationRequested = false;
    Reflect.set(window, '__LAMP_FIRST_USE_FRAME_SAMPLES__', samples);
    Reflect.set(window, '__REQUEST_LAMP_FIRST_USE__', () => { activationRequested = true; });
    Reflect.set(window, '__STOP_LAMP_FIRST_USE_FRAME_SAMPLES__', () => { active = false; });
    const measure = (now: number): void => {
      const lampActive = window.__THREE_GAME_DIAGNOSTICS__?.appliances.some(
        ({ kind, state }) => kind === 'lamp' && state === 'active',
      ) === true;
      const replacement = window.__THREE_GAME_DIAGNOSTICS__?.applianceReplacement;
      samples.push({
        ms: now - previous,
        activationRequested,
        lampActive,
        prepareCount: replacement?.prepareCount ?? -1,
        preparedCount: replacement?.preparedCount ?? -1,
        warmupPendingCount: replacement?.warmupPendingCount ?? -1,
        lastFromKind: replacement?.lastFromKind ?? null,
        lastToKind: replacement?.lastToKind ?? null,
        lastWarmupMs: replacement?.lastWarmupMs ?? -1,
      });
      previous = now;
      if (active) requestAnimationFrame(measure);
    };
    requestAnimationFrame(measure);
  });
  await page.waitForFunction(() => (
    (Reflect.get(window, '__LAMP_FIRST_USE_FRAME_SAMPLES__') as unknown[] | undefined)?.length ?? 0
  ) >= 12);
  const activated = await page.evaluate(() => {
    const mark = Reflect.get(window, '__REQUEST_LAMP_FIRST_USE__') as (() => void) | undefined;
    mark?.();
    return window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.('lamp') ?? false;
  });
  expect(activated).toBe(true);
  await page.waitForFunction(() => {
    const samples = Reflect.get(window, '__LAMP_FIRST_USE_FRAME_SAMPLES__') as Array<{
      activationRequested: boolean;
      lampActive: boolean;
    }> | undefined;
    return (samples?.filter(({ activationRequested, lampActive }) => activationRequested && lampActive).length ?? 0) >= 8;
  }, null, { timeout: 45_000 });

  const frameStats = await page.evaluate(() => {
    const stop = Reflect.get(window, '__STOP_LAMP_FIRST_USE_FRAME_SAMPLES__') as (() => void) | undefined;
    stop?.();
    const samples = (Reflect.get(window, '__LAMP_FIRST_USE_FRAME_SAMPLES__') as Array<{
      ms: number;
      activationRequested: boolean;
      lampActive: boolean;
      prepareCount: number;
      preparedCount: number;
      warmupPendingCount: number;
      lastFromKind: string | null;
      lastToKind: string | null;
      lastWarmupMs: number;
    }> | undefined) ?? [];
    const baseline = samples.filter(({ activationRequested }) => !activationRequested).slice(-8).map(({ ms }) => ms);
    const activeSamples = samples
      .filter(({ activationRequested, lampActive }) => activationRequested && lampActive)
      .map(({ ms }) => ms);
    const orderedBaseline = [...baseline].sort((a, b) => a - b);
    const baselineP75 = orderedBaseline[Math.max(0, Math.ceil(orderedBaseline.length * 0.75) - 1)] ?? 0;
    const activeMaximum = Math.max(0, ...activeSamples);
    return {
      baselineCount: baseline.length,
      activeCount: activeSamples.length,
      baselineP75,
      activeMaximum,
      activeToBaselineRatio: baselineP75 > 0 ? activeMaximum / baselineP75 : Number.POSITIVE_INFINITY,
      samples: samples.map(({ ms, ...state }) => ({ ms: Number(ms.toFixed(1)), ...state })),
    };
  });
  console.log(`LAMP_FIRST_USE ${JSON.stringify(frameStats)}`);
  expect(frameStats.baselineCount).toBe(8);
  expect(frameStats.activeCount).toBeGreaterThanOrEqual(8);
  expect(frameStats.baselineP75).toBeGreaterThan(0);
  expect(frameStats.activeMaximum).toBeLessThan(frameStats.baselineP75 * 3 + 750);
  expect(frameStats.activeToBaselineRatio).toBeLessThan(4.5);
});
