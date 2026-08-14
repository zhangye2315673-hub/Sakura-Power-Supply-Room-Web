import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createToasterModel } from '../src/appliances/models/toaster';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import {
  AppliancePerformanceSystem,
  type AppliancePerformanceTarget,
} from '../src/systems/AppliancePerformanceSystem';
import { PetalField } from '../src/systems/PetalField';

function toasterAt(x: number, facingSide: -1 | 1): {
  model: ReturnType<typeof createToasterModel>;
  target: AppliancePerformanceTarget;
} {
  const model = createToasterModel({ id: 'toaster', accent: 0xe8aec4 });
  model.root.position.x = x;
  const target: AppliancePerformanceTarget = {
    root: model.root,
    state: 'active',
    kind: 'toaster',
    facingSide,
    getActiveElapsed: () => 3.72,
  };
  return { model, target };
}

function visibleToast(root: THREE.Object3D): THREE.Mesh | null {
  let result: THREE.Mesh | null = null;
  root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.visible && object.name.startsWith('spectacle-toast-')) result = object;
  });
  return result;
}

test('toaster lever presses, holds above the dial, and releases with the launch latch', () => {
  const model = createToasterModel({ id: 'toaster', accent: 0xe8aec4 });
  const lever = model.root.getObjectByName('toaster-lever-pivot');
  const carriage = model.root.getObjectByName('toaster-toast-carriage');
  expect(lever).toBeTruthy();
  expect(carriage).toBeTruthy();
  const idleLeverY = lever!.position.y;
  const idleCarriageY = carriage!.position.y;
  const animation = createApplianceMechanicalAnimation('toaster', model.root);

  animation.update(0.35, 1);
  expect(lever!.position.y).toBeLessThan(idleLeverY - 0.08);
  animation.update(0.65, 1);
  const heldLeverY = lever!.position.y;
  expect(heldLeverY).toBeCloseTo(idleLeverY - 0.37, 5);
  expect(carriage!.position.y).toBeCloseTo(idleCarriageY - 0.32, 5);
  animation.update(3.55, 1);
  expect(lever!.position.y).toBeCloseTo(heldLeverY, 5);
  animation.update(3.80, 1);
  expect(lever!.position.y).toBeGreaterThan(heldLeverY + 0.1);
  animation.update(3.90, 1);
  expect(lever!.position.y).toBeCloseTo(idleLeverY, 5);
  expect(carriage!.position.y).toBeCloseTo(idleCarriageY, 5);

  animation.stop();
  expect(lever!.position.y).toBeCloseTo(idleLeverY, 7);
});

test('layered toast launches toward screen centre, tumbles near the top, and retires below the viewport', () => {
  const performances = new AppliancePerformanceSystem();
  const petals = new PetalField(1);
  const camera = new THREE.PerspectiveCamera(31, 16 / 9, 0.1, 80);
  camera.position.set(0, 3.0, 10);
  camera.lookAt(0, 1.2, 0);
  camera.updateMatrixWorld(true);

  const left = toasterAt(-2.8, -1);
  performances.update(1 / 60, 3.72, camera, [left.target], petals);
  const toast = visibleToast(performances.root);
  expect(toast).toBeTruthy();
  expect(toast!.userData.performanceProp).toBe('layered-toast-slice');
  expect(toast!.userData.components).toEqual([
    'toast-crust-volume',
    'toast-crumb-front',
    'toast-crumb-back',
    'toast-outline-hull',
  ]);
  expect(Array.isArray(toast!.material)).toBe(true);
  const materials = toast!.material as THREE.Material[];
  expect(materials).toHaveLength(4);
  expect(materials[1]).toBeInstanceOf(THREE.MeshToonMaterial);
  expect(materials[2]).toBeInstanceOf(THREE.MeshToonMaterial);
  expect((materials[1] as THREE.MeshToonMaterial).color.getHex()).not.toBe(
    (materials[2] as THREE.MeshToonMaterial).color.getHex(),
  );
  const leftVelocity = new THREE.Vector3().fromArray(toast!.userData.launchVelocity as number[]);
  expect(leftVelocity.dot(new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion))).toBeGreaterThan(0);

  const initialQuaternion = toast!.quaternion.clone();
  let maxNdcY = -Infinity;
  let lastVisibleNdcY = Infinity;
  for (let frame = 0; frame < 300 && toast!.visible; frame += 1) {
    if (frame === 12) left.target.state = 'idle';
    performances.update(1 / 120, 3.72 + frame / 120, camera, [left.target], petals);
    if (toast!.visible) {
      const ndc = toast!.position.clone().project(camera);
      maxNdcY = Math.max(maxNdcY, ndc.y);
      lastVisibleNdcY = ndc.y;
    }
  }
  expect(maxNdcY).toBeGreaterThan(0.52);
  expect(initialQuaternion.angleTo(toast!.quaternion)).toBeGreaterThan(0.5);
  expect(toast!.visible).toBe(false);
  expect(lastVisibleNdcY).toBeLessThan(-1.08);
  expect(performances.getStateSummary().timelineOwners).toBe(0);

  performances.reset();
  const right = toasterAt(2.8, 1);
  performances.update(1 / 60, 3.72, camera, [right.target], petals);
  const rightToast = visibleToast(performances.root);
  expect(rightToast).toBeTruthy();
  const rightVelocity = new THREE.Vector3().fromArray(rightToast!.userData.launchVelocity as number[]);
  expect(rightVelocity.dot(new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion))).toBeLessThan(0);

  performances.dispose();
  petals.dispose();
});
