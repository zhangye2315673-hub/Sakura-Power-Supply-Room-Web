import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createSmartBinModel } from '../src/appliances/models/smartBin';
import {
  createSmartBinPerformance,
  SMART_BIN_TIMELINE,
  SMART_BIN_TRASH_TYPES,
} from '../src/appliances/performance/SmartBinPerformance';

function pose(root: THREE.Group): string {
  const values: unknown[] = [];
  root.traverse((object) => {
    if (!object.name.startsWith('smart-bin-trash-')
      && object.name !== 'smart-bin-body-pivot'
      && object.name !== 'smart-bin-lid-hinge-pivot') return;
    values.push([
      object.name,
      object.visible,
      [...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()]
        .map((value) => Number(value.toFixed(7))),
    ]);
  });
  return JSON.stringify(values);
}

test('smart bin has an open 0.82-deep well and eight named volumetric trash models', () => {
  const model = createSmartBinModel({ id: 'smart-bin', accent: 0xe8aec4 });
  const cavity = model.root.getObjectByName('smart-bin-inner-cavity');
  const floor = model.root.getObjectByName('smart-bin-inner-deep-floor');
  expect(cavity?.userData).toMatchObject({ openMouth: true, depth: SMART_BIN_TIMELINE.cavityDepth });
  expect(floor?.userData.depthBelowRim).toBe(SMART_BIN_TIMELINE.cavityDepth);
  expect(model.root.getObjectByName('smart-bin-recessed-opening')).toBeUndefined();
  expect(model.root.getObjectByName('smart-bin-translucent-inner-liner')).toBeUndefined();

  SMART_BIN_TRASH_TYPES.forEach((type) => {
    const item = model.root.getObjectByName(`smart-bin-trash-${type}-pivot`);
    expect(item, type).toBeInstanceOf(THREE.Group);
    expect(item?.children.length, type).toBeGreaterThan(0);
  });
  model.root.traverse((object) => {
    if (!object.name.startsWith('smart-bin-trash-')) return;
    expect(object instanceof THREE.Sprite, `${object.name} must not be a Sprite`).toBe(false);
    expect(object instanceof THREE.Line, `${object.name} must not be a Line`).toBe(false);
    if (object instanceof THREE.Mesh) {
      expect(object.geometry instanceof THREE.PlaneGeometry, `${object.name} must not be a Plane`).toBe(false);
    }
  });
  expect(model.root.userData.externalPerformanceCue).toMatchObject({
    type: 'smart-bin-owned-volumetric-trash',
    poolSize: 8,
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
  });
});

test('dedicated timeline senses, opens, catches all directions, sinks, rebounds and closes', () => {
  const model = createSmartBinModel({ id: 'smart-bin', accent: 0xe8aec4 });
  const performance = createSmartBinPerformance(model.root);
  let greatestVisible = 0;
  let greatestSink = 0;
  let greatestLid = 0;
  const seen = new Set<string>();
  for (let frame = 0; frame <= 624; frame += 1) {
    performance.apply(frame / 120, 1);
    greatestVisible = Math.max(greatestVisible, performance.diagnostics.visibleTrash);
    greatestSink = Math.max(greatestSink, performance.diagnostics.maximumBodySink);
    greatestLid = Math.max(greatestLid, performance.diagnostics.lidAngle);
    SMART_BIN_TRASH_TYPES.forEach((type) => {
      if (model.root.getObjectByName(`smart-bin-trash-${type}-pivot`)?.visible) seen.add(type);
    });
  }
  expect(seen).toEqual(new Set(SMART_BIN_TRASH_TYPES));
  expect(greatestVisible).toBeGreaterThanOrEqual(3);
  expect(greatestSink).toBeGreaterThan(0.03);
  expect(greatestLid).toBeGreaterThan(1.1);
  expect(performance.diagnostics.receivedTrash).toBe(8);
  expect(performance.diagnostics.phase).toBe('complete');
  expect(performance.diagnostics.directions).toBe(8);
  expect(performance.diagnostics.volumetricOnly).toBe(true);
  expect(model.root.getObjectByName('smart-bin-lid-hinge-pivot')?.rotation.x).toBeCloseTo(0, 5);
});

test('all trash arrives on long cross-screen parabolic throws from both sides', () => {
  const model = createSmartBinModel({ id: 'smart-bin', accent: 0xe8aec4 });
  const performance = createSmartBinPerformance(model.root);
  const samples = new Map<string, { maximumAbsX: number; maximumY: number; startSign: number }>();
  for (let frame = 0; frame <= 624; frame += 1) {
    performance.apply(frame / 120, 1);
    SMART_BIN_TRASH_TYPES.forEach((type) => {
      const item = model.root.getObjectByName(`smart-bin-trash-${type}-pivot`);
      if (!item?.visible) return;
      const current = samples.get(type) ?? {
        maximumAbsX: 0,
        maximumY: Number.NEGATIVE_INFINITY,
        startSign: Math.sign(item.position.x),
      };
      current.maximumAbsX = Math.max(current.maximumAbsX, Math.abs(item.position.x));
      current.maximumY = Math.max(current.maximumY, item.position.y);
      samples.set(type, current);
    });
  }

  expect(samples.size).toBe(8);
  expect([...samples.values()].every(({ maximumAbsX }) => maximumAbsX > 8)).toBe(true);
  expect(Math.max(...[...samples.values()].map(({ maximumAbsX }) => maximumAbsX))).toBeGreaterThan(10);
  expect(Math.min(...[...samples.values()].map(({ maximumY }) => maximumY))).toBeGreaterThan(4.2);
  expect(new Set([...samples.values()].map(({ startSign }) => startSign))).toEqual(new Set([-1, 1]));
});

test('can rolls twice, banana bends, bottle spins lightly, and reset is exact', () => {
  const model = createSmartBinModel({ id: 'smart-bin', accent: 0xe8aec4 });
  const controller = createSmartBinPerformance(model.root);
  const idle = pose(model.root);

  controller.apply(2.24, 1);
  const can = model.root.getObjectByName('smart-bin-trash-aluminum-can-pivot');
  expect(Math.abs(can?.rotation.z ?? 0)).toBeGreaterThan(Math.PI * 2);
  controller.apply(1.60, 1);
  const bananaLobe = model.root.getObjectByName('smart-bin-trash-banana-peel-pivot-curved-lobe-1');
  expect(Math.abs(bananaLobe?.rotation.z ?? 0)).toBeGreaterThan(0.05);
  controller.apply(2.54, 1);
  const bottle = model.root.getObjectByName('smart-bin-trash-plastic-bottle-pivot');
  expect(Math.abs(bottle?.rotation.y ?? 0)).toBeGreaterThan(0.2);

  controller.reset();
  expect(pose(model.root)).toBe(idle);
  expect(controller.signal()).toBe(0);
  expect(controller.diagnostics.phase).toBe('idle');
});
