import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createFanModel } from '../src/appliances/models/fan';
import {
  FAN_MAX_ANGULAR_SPEED,
  FAN_TIMELINE,
  createFanPerformance,
  sampleFanRotorMotion,
} from '../src/appliances/performance/FanPerformance';

function worldBox(object: THREE.Object3D): THREE.Box3 {
  object.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(object);
}

test('fan rotor has analytic acceleration, constant cruise and continuous deceleration', () => {
  const step = 1 / 240;
  const samples = Array.from(
    { length: Math.ceil(FAN_TIMELINE.stopEnd / step) + 1 },
    (_, index) => sampleFanRotorMotion(index * step),
  );
  const derivedSpeeds = samples.slice(1).map((sample, index) => (
    -(sample.angle - samples[index].angle) / step
  ));

  expect(samples.every((sample, index) => index === 0 || sample.angle <= samples[index - 1].angle))
    .toBe(true);
  expect(Math.max(...derivedSpeeds)).toBeLessThanOrEqual(FAN_MAX_ANGULAR_SPEED * 1.001);
  expect(Math.min(...derivedSpeeds)).toBeGreaterThanOrEqual(-1e-8);
  const cruise = samples.filter((sample) => sample.time >= 1 && sample.time <= 4.2);
  expect(Math.max(...cruise.map((sample) => sample.angularSpeed))
    - Math.min(...cruise.map((sample) => sample.angularSpeed))).toBeLessThan(1e-9);
  const frameSpeedChanges = derivedSpeeds.slice(1).map((speed, index) => Math.abs(speed - derivedSpeeds[index]));
  expect(Math.max(...frameSpeedChanges)).toBeLessThan(0.2);

  const final = sampleFanRotorMotion(FAN_TIMELINE.stopEnd);
  expect(final.angularSpeed).toBe(0);
  expect(Math.sin(final.angle)).toBeCloseTo(0, 10);
  expect(Math.cos(final.angle)).toBeCloseTo(1, 10);
});

test('fan hierarchy and depth keep the fixed support, motor, guards and blades separated', () => {
  const build = createFanModel({ id: 'fan', accent: 0xe8aec4 });
  const support = build.root.getObjectByName('fan-support-column')!;
  const yaw = build.root.getObjectByName('fan-oscillation-pivot')!;
  const hinge = build.root.getObjectByName('fan-head-hinge')!;
  const barrel = build.root.getObjectByName('fan-motor-barrel')!;
  const rearGuard = build.root.getObjectByName('fan-rear-guard')!;
  const frontGuard = build.root.getObjectByName('fan-front-guard')!;
  const rotor = build.root.getObjectByName('fan-rotor-pivot')!;

  expect(support.parent).toBe(build.root);
  expect(yaw.parent).toBe(build.root);
  expect(hinge.parent).toBe(yaw);
  expect(rotor.parent).toBe(hinge);

  const supportBounds = worldBox(support);
  const motorBounds = worldBox(barrel);
  const rearBounds = worldBox(rearGuard);
  const frontBounds = worldBox(frontGuard);
  const bladeBounds = new THREE.Box3();
  const bladeMeshes: THREE.Mesh[] = [];
  rotor.traverse((object) => {
    if (object instanceof THREE.Mesh && /^fan-blade-\d+$/.test(object.name)) {
      bladeMeshes.push(object);
      bladeBounds.union(worldBox(object));
    }
  });

  expect(bladeMeshes).toHaveLength(5);
  expect(supportBounds.max.z).toBeLessThan(rearBounds.min.z);
  expect(motorBounds.max.z).toBeLessThan(rearBounds.min.z);
  expect(rearBounds.max.z).toBeLessThan(bladeBounds.min.z);
  expect(bladeBounds.max.z).toBeLessThan(frontBounds.min.z);

  rotor.updateWorldMatrix(true, true);
  let maximumRadius = 0;
  const point = new THREE.Vector3();
  bladeMeshes.forEach((blade) => {
    const positions = blade.geometry.getAttribute('position');
    for (let index = 0; index < positions.count; index += 1) {
      point.fromBufferAttribute(positions, index);
      blade.localToWorld(point);
      rotor.worldToLocal(point);
      maximumRadius = Math.max(maximumRadius, Math.hypot(point.x, point.y));
    }
  });
  expect(maximumRadius).toBeLessThan(0.59);
});

test('fan-specific controller is seek-stable and resets every animated pivot exactly', () => {
  const build = createFanModel({ id: 'fan', accent: 0xe8aec4 });
  const rotor = build.root.getObjectByName('fan-rotor-pivot')!;
  const yaw = build.root.getObjectByName('fan-oscillation-pivot')!;
  const hinge = build.root.getObjectByName('fan-head-hinge')!;
  const dial = build.root.getObjectByName('fan-speed-dial-pivot')!;
  const idle = [rotor.rotation.z, yaw.rotation.y, hinge.rotation.x, dial.rotation.z];
  const performance = createFanPerformance(build.root);

  performance.apply(4.2, 1);
  const first = [rotor.rotation.z, yaw.rotation.y, hinge.rotation.x, dial.rotation.z];
  performance.apply(1.35, 1);
  performance.apply(4.2, 1);
  expect([rotor.rotation.z, yaw.rotation.y, hinge.rotation.x, dial.rotation.z]).toEqual(first);
  expect(performance.signal()).toBe(1);

  performance.apply(FAN_TIMELINE.stopEnd, 0);
  expect(performance.diagnostics.finalOrientationError).toBeLessThan(1e-10);
  performance.reset();
  expect([rotor.rotation.z, yaw.rotation.y, hinge.rotation.x, dial.rotation.z]).toEqual(idle);
  expect(performance.signal()).toBe(0);
});
