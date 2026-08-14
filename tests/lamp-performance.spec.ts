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
  expect(spot.visible).toBe(false);
  performances.dispose();
  petals.dispose();
});
