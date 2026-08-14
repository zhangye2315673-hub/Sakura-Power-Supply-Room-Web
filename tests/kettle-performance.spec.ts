import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createKettleModel } from '../src/appliances/models/kettle';
import {
  createKettlePerformance,
  KETTLE_TIMELINE,
  type KettlePerformanceDiagnostics,
} from '../src/appliances/performance/KettlePerformance';
import { poweredAnimationState } from '../src/appliances/poweredAnimation';

function namedPose(root: THREE.Group): string {
  const names = [
    'kettle-body-pivot',
    'kettle-lid-hinge-pivot',
    'kettle-power-switch-pivot',
    ...Array.from({ length: 7 }, (_, index) => `kettle-volumetric-steam-puff-${index + 1}-pivot`),
  ];
  return JSON.stringify(names.map((name) => {
    const object = root.getObjectByName(name);
    if (!object) return [name, null];
    return [
      name,
      object.visible,
      ...object.position.toArray().map((value) => Number(value.toFixed(7))),
      ...object.quaternion.toArray().map((value) => Number(value.toFixed(7))),
      ...object.scale.toArray().map((value) => Number(value.toFixed(7))),
    ];
  }));
}

test('kettle steam is seven socket-bound faceted 3D assemblies with no flat fallback', () => {
  const model = createKettleModel({ id: 'kettle', accent: 0xe8aec4 });
  const socket = model.root.getObjectByName('kettle-spout-steam-socket');
  expect(socket).toBeTruthy();
  const puffs = Array.from({ length: 7 }, (_, index) => (
    model.root.getObjectByName(`kettle-volumetric-steam-puff-${index + 1}-pivot`)
  ));
  expect(puffs.every(Boolean)).toBe(true);
  expect(puffs.every((puff) => puff?.parent === socket)).toBe(true);
  expect(model.root.getObjectByName('kettle-lid-hinge-pivot')?.parent?.name).toBe('kettle-body-pivot');

  const handle = model.root.getObjectByName('kettle-handle-accent-outer-strap');
  const spout = model.root.getObjectByName('kettle-short-metal-spout');
  expect(handle).toBeTruthy();
  expect(spout).toBeTruthy();
  const handleBounds = new THREE.Box3().setFromObject(handle!);
  const spoutBounds = new THREE.Box3().setFromObject(spout!);
  expect(handleBounds.min.x).toBeGreaterThan(0.35);
  expect(handleBounds.max.x).toBeLessThan(1.3);
  expect(spoutBounds.max.x).toBeLessThan(-0.4);

  for (const [index, puff] of puffs.entries()) {
    if (!puff) continue;
    const lobes: THREE.Mesh[] = [];
    puff.traverse((object) => {
      expect(object instanceof THREE.Sprite, `puff ${index + 1} must not contain Sprite`).toBe(false);
      expect(object instanceof THREE.Line, `puff ${index + 1} must not contain Line`).toBe(false);
      if (object instanceof THREE.Mesh) lobes.push(object);
    });
    expect(lobes).toHaveLength(5);
    expect(lobes.every((lobe) => lobe.geometry.type === 'IcosahedronGeometry')).toBe(true);
    const bounds = new THREE.Box3().setFromObject(puff);
    const extent = bounds.getSize(new THREE.Vector3());
    expect(Math.min(extent.x, extent.y, extent.z), `puff ${index + 1} needs real XYZ volume`).toBeGreaterThan(0.2);
  }
});

test('kettle maintains frequency and monotonically settles motion and steam to zero', () => {
  const model = createKettleModel({ id: 'kettle', accent: 0xe8aec4 });
  const performance = createKettlePerformance(model.root);
  const snapshots: Array<{ time: number; diagnostics: KettlePerformanceDiagnostics }> = [];

  for (const time of [0.8, 1.4, 2.8, 4.0, 4.72, 4.9, 5.1]) {
    const powered = poweredAnimationState(time);
    performance.apply(powered.time, powered.power);
    snapshots.push({
      time,
      diagnostics: { ...performance.diagnostics },
    });
  }

  expect(snapshots[0].diagnostics.visibleSteamPuffs).toBeGreaterThanOrEqual(3);
  expect(snapshots[0].diagnostics.maxSteamOpacity).toBeGreaterThan(0.1);
  expect(snapshots.some(({ diagnostics }) => diagnostics.maxSteamHeight > 4.7)).toBe(true);
  expect(snapshots.some(({ diagnostics }) => diagnostics.plumeTopWorldY > 6.2)).toBe(true);
  expect(snapshots.find(({ time }) => time === 4.9)?.diagnostics.visibleSteamPuffs).toBeGreaterThanOrEqual(3);
  expect(snapshots.every(({ diagnostics }) => diagnostics.oscillationFrequencyHz === 3.6)).toBe(true);
  expect(snapshots.every(({ diagnostics }) => diagnostics.lidJumpFrequencyHz === 7.2)).toBe(true);
  expect(snapshots.every(({ diagnostics }) => diagnostics.steamOwner === 'kettle-model-rig')).toBe(true);
  expect(snapshots.every(({ diagnostics }) => diagnostics.timelineOwner === 'ApplianceMechanics/KettlePerformance')).toBe(true);
  const tail = snapshots.slice(4).map(({ diagnostics }) => diagnostics.motionEnvelope);
  for (let index = 1; index < tail.length; index += 1) {
    expect(tail[index], `tail envelope increased at sample ${index}`).toBeLessThanOrEqual(tail[index - 1] + 1e-8);
  }
  expect(tail.at(-1)).toBeLessThan(0.021);
  expect(model.root.getObjectByName('kettle-power-base-pivot')?.position.toArray()).toEqual([0, 0, 0]);
  expect(Math.abs(model.root.getObjectByName('kettle-lid-hinge-pivot')?.rotation.x ?? 1)).toBeLessThanOrEqual(0.1121);

  let lidJumpSamples = 0;
  let previousLift = 0;
  for (let time = 0.8; time <= 4.7; time += 1 / 120) {
    performance.apply(time, 1);
    if (previousLift < 0.018 && performance.diagnostics.lidLift >= 0.018) lidJumpSamples += 1;
    previousLift = performance.diagnostics.lidLift;
  }
  expect(lidJumpSamples).toBeGreaterThanOrEqual(26);

  performance.reset();
  const stopped = performance.diagnostics;
  expect(stopped.phase).toBe('idle');
  expect(stopped.motionEnvelope).toBe(0);
  expect(stopped.visibleSteamPuffs).toBe(0);
  for (let index = 1; index <= 7; index += 1) {
    expect(model.root.getObjectByName(`kettle-volumetric-steam-puff-${index}-pivot`)?.visible).toBe(false);
  }
});

test('same kettle timestamp produces identical game and gallery rig poses', () => {
  const gameModel = createKettleModel({ id: 'kettle', accent: 0xe8aec4 });
  const galleryModel = createKettleModel({ id: 'kettle', accent: 0xe8aec4 });
  const gamePerformance = createKettlePerformance(gameModel.root);
  const galleryPerformance = createKettlePerformance(galleryModel.root);
  const elapsed = 2.35;
  gamePerformance.apply(elapsed, 1);
  galleryPerformance.apply(elapsed, 1);

  expect(namedPose(gameModel.root)).toBe(namedPose(galleryModel.root));
  expect(gameModel.root.userData.kettlePerformance).toEqual(galleryModel.root.userData.kettlePerformance);
  expect(KETTLE_TIMELINE.stopEnd).toBe(5.2);
});

test('kettle produces distinct beginning, middle and late steam silhouettes', () => {
  const model = createKettleModel({ id: 'kettle', accent: 0xe8aec4 });
  const performance = createKettlePerformance(model.root);
  const firstPuff = model.root.getObjectByName('kettle-volumetric-steam-puff-1-pivot') as THREE.Object3D;
  const silhouettes = [1.1, 2.95, 4.55].map((time) => {
    performance.apply(time, 1);
    expect(firstPuff.visible, `steam missing at ${time}s`).toBe(true);
    return {
      aspect: Number((firstPuff.scale.x / firstPuff.scale.y).toFixed(3)),
      lateral: Number(firstPuff.position.x.toFixed(3)),
    };
  });

  expect(KETTLE_TIMELINE.steamCycleSeconds).toBeLessThanOrEqual(2.1);
  expect(new Set(silhouettes.map(({ aspect }) => aspect)).size).toBe(3);
  expect(Math.max(...silhouettes.map(({ aspect }) => aspect))
    - Math.min(...silhouettes.map(({ aspect }) => aspect))).toBeGreaterThan(0.25);
  expect(new Set(silhouettes.map(({ lateral }) => lateral)).size).toBe(3);
});
