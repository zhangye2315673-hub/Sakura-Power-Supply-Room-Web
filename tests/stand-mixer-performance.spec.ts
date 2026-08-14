import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createStandMixerModel } from '../src/appliances/models/standMixer';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import type { StandMixerPerformanceDiagnostics } from '../src/appliances/performance/StandMixerPerformance';
import {
  AppliancePerformanceSystem,
  type AppliancePerformanceTarget,
} from '../src/systems/AppliancePerformanceSystem';
import { PetalField } from '../src/systems/PetalField';

function rigPose(root: THREE.Group): string {
  const values: Array<[string, number[], boolean]> = [];
  root.traverse((object) => {
    if (object.userData.isOutline || object.name === 'status-indicator') return;
    values.push([
      object.name || object.type,
      [
        object.position.x, object.position.y, object.position.z,
        object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w,
        object.scale.x, object.scale.y, object.scale.z,
      ].map((value) => Number(value.toFixed(7))),
      object.visible,
    ]);
  });
  return JSON.stringify(values);
}

function diagnostics(root: THREE.Group): StandMixerPerformanceDiagnostics {
  return root.userData.standMixerPerformanceDiagnostics as StandMixerPerformanceDiagnostics;
}

test('stand mixer liquid performance uses only named volumetric forms', () => {
  const model = createStandMixerModel({ id: 'stand-mixer', accent: 0xe8aec4, referencePath: null });
  const effects: THREE.Mesh[] = [];
  const forbidden: string[] = [];
  model.root.traverse((object) => {
    if (object instanceof THREE.Sprite || object instanceof THREE.Line) forbidden.push(`${object.name}:${object.type}`);
    if (!(object instanceof THREE.Mesh)) return;
    if (object.geometry.type === 'PlaneGeometry') forbidden.push(`${object.name}:${object.geometry.type}`);
    if (object.userData.performanceEffect) effects.push(object);
  });

  expect(forbidden).toEqual([]);
  expect(model.root.getObjectByName('stand-mixer-mixture-vortex')).toBeUndefined();
  expect(model.root.getObjectByName('stand-mixer-splash-effects')).toBeUndefined();
  expect(effects.filter((entry) => entry.name.startsWith('stand-mixer-mixture-wave-ridge-'))).toHaveLength(3);
  expect(effects.filter((entry) => entry.name.startsWith('stand-mixer-liquid-pull-arc-'))).toHaveLength(7);
  expect(effects.filter((entry) => entry.name.startsWith('stand-mixer-volumetric-cream-dollop-'))).toHaveLength(9);
  expect(effects.filter((entry) => entry.name.startsWith('stand-mixer-volumetric-liquid-droplet-'))).toHaveLength(16);
  expect(effects.some((entry) => entry.name === 'stand-mixer-whipped-cream-settle-peak')).toBe(true);

  effects.forEach((effect) => {
    effect.geometry.computeBoundingBox();
    const size = effect.geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3();
    expect(Math.min(size.x, size.y, size.z), `${effect.name} must have real thickness`).toBeGreaterThan(0.035);
    expect(effect.userData.effectKind, `${effect.name} must have a semantic effect role`).toBeTruthy();
  });
  expect(model.root.userData.standMixerPerformanceRig.forbiddenPrimitives).toEqual([
    'PlaneGeometry', 'Sprite', 'Line',
  ]);
});

test('stand mixer starts at the dial, accelerates, loses bowl control, then settles with inertia', () => {
  const model = createStandMixerModel({ id: 'stand-mixer', accent: 0xe8aec4, referencePath: null });
  const animation = createApplianceMechanicalAnimation('stand-mixer', model.root);
  const idlePose = rigPose(model.root);
  const base = model.root.getObjectByName('stand-mixer-base-pivot') as THREE.Group;
  const bowl = model.root.getObjectByName('stand-mixer-bowl-pivot') as THREE.Group;
  const beater = model.root.getObjectByName('stand-mixer-beater-spin-pivot') as THREE.Group;
  const lockPlate = model.root.getObjectByName('stand-mixer-bowl-lock-plate-pivot') as THREE.Group;
  const idleBaseY = base.position.y;
  const idleLockPose = [lockPlate.position.toArray(), lockPlate.quaternion.toArray()];

  animation.update(0.18, 1);
  const start = { ...diagnostics(model.root) };
  expect(start.phase).toBe('dial-start');
  expect(Math.abs(start.dialRotation)).toBeGreaterThan(0.2);
  expect(start.beaterAngularVelocity).toBe(0);
  expect(start.bowlSwingAmplitude).toBe(0);
  expect(base.position.y, 'startup must not begin with whole-machine down-pressure').toBe(idleBaseY);

  animation.update(0.46, 1);
  const slow = { ...diagnostics(model.root) };
  expect(slow.phase).toBe('slow-whisk');
  expect(slow.beaterAngularVelocity).toBeCloseTo(5.5, 5);

  animation.update(1.82, 1);
  const fast = { ...diagnostics(model.root) };
  expect(fast.phase).toBe('overspeed');
  expect(fast.beaterAngularVelocity).toBeGreaterThan(slow.beaterAngularVelocity * 5);
  expect(fast.vortexStrength).toBeGreaterThan(0.8);

  animation.update(3.24, 1);
  const violent = { ...diagnostics(model.root) };
  expect(violent.bowlSwingAmplitude).toBeGreaterThan(0.12);
  expect(Math.abs(bowl.rotation.z) + Math.abs(bowl.rotation.x)).toBeGreaterThan(0.04);
  expect(violent.visiblePullArcs).toBeGreaterThanOrEqual(5);
  expect(violent.visibleLargeDollops).toBeGreaterThanOrEqual(6);
  expect(violent.visibleDroplets).toBeGreaterThanOrEqual(10);
  expect(violent.returnedLiquidBodies).toBeGreaterThan(0);
  expect(violent.machineShake).toBeGreaterThan(0.04);
  expect(Math.abs(model.root.position.x) + Math.abs(model.root.rotation.z)).toBeGreaterThan(0.015);
  expect([lockPlate.position.toArray(), lockPlate.quaternion.toArray()]).toEqual(idleLockPose);

  animation.update(4.7, 0.9);
  const decel = { ...diagnostics(model.root) };
  expect(decel.phase).toBe('wind-down');
  expect(decel.beaterAngularVelocity).toBeGreaterThan(0);
  expect(decel.beaterAngularVelocity).toBeLessThan(fast.beaterAngularVelocity);
  expect(decel.peakStrength).toBeGreaterThan(0.2);

  animation.update(5.05, 0.25);
  const settle = { ...diagnostics(model.root) };
  expect(settle.phase).toBe('inertia-settle');
  expect(settle.beaterAngularVelocity).toBe(0);
  expect(settle.bowlSwingAmplitude).toBeGreaterThan(0);
  expect(Math.abs(beater.rotation.y)).toBeLessThan(Math.PI);
  expect(settle.peakStrength).toBeGreaterThan(0.9);
  expect(model.root.getObjectByName('stand-mixer-whipped-cream-settle-peak')?.visible).toBe(true);

  const returnAngles = [4.75, 4.9, 5.05, 5.15, 5.2].map((time) => {
    animation.update(time, 1);
    return Math.abs(Math.atan2(Math.sin(beater.rotation.y), Math.cos(beater.rotation.y)));
  });
  for (let index = 1; index < returnAngles.length; index += 1) {
    expect(returnAngles[index]).toBeLessThanOrEqual(returnAngles[index - 1]);
  }
  expect(Math.abs(beater.rotation.y)).toBeLessThan(0.0001);

  animation.stop();
  expect(rigPose(model.root)).toBe(idlePose);
  expect(diagnostics(model.root).phase).toBe('idle');
  expect(animation.signal()).toBe(0);
});

test('stand mixer disables shared blue drop and camera-facing yellow sheet effects', () => {
  const model = createStandMixerModel({ id: 'stand-mixer', accent: 0xe8aec4, referencePath: null });
  const performances = new AppliancePerformanceSystem();
  const petals = new PetalField(1);
  const camera = new THREE.PerspectiveCamera(31, 16 / 9, 0.1, 80);
  camera.position.set(4, 3, 8);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const target: AppliancePerformanceTarget = {
    root: model.root,
    state: 'active',
    kind: 'stand-mixer',
    facingSide: 1,
    getActiveElapsed: () => 3.24,
  };

  performances.update(1 / 60, 3.24, camera, [target], petals);
  const state = performances.getStateSummary();
  expect(state.sessions).toBe(1);
  expect(state.timelineOwners).toBe(1);
  expect(state.activeByKind.drop ?? 0).toBe(0);
  expect(state.activeByKind.sheet ?? 0).toBe(0);
  expect(diagnostics(model.root).effectOwner).toBe('stand-mixer-model-rig');
  expect(diagnostics(model.root).sharedSpectacleEffects).toBe('disabled');
  expect(model.root.userData.performanceDefinition).toBe('stand-mixer');

  performances.stop(target);
  performances.dispose();
  petals.dispose();
});
