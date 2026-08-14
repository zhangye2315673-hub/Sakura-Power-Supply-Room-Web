import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createRiceCookerModel } from '../src/appliances/models/riceCooker';
import {
  createRiceCookerPerformance,
  RICE_COOKER_TIMELINE,
} from '../src/appliances/performance/RiceCookerPerformance';

function build() {
  return createRiceCookerModel({ id: 'rice-cooker', accent: 0xe8aec4 });
}

function namedPose(root: THREE.Group): string {
  const names = [
    'rice-cooker-body-pivot',
    'rice-cooker-lid-hinge-pivot',
    'rice-cooker-cook-switch-pivot',
    ...Array.from({ length: 28 }, (_, index) => `rice-cooker-airborne-kernel-${index + 1}-pivot`),
    ...Array.from({ length: 8 }, (_, index) => `rice-cooker-volumetric-steam-puff-${index + 1}-pivot`),
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

test('rice cooker uses the same outlined volumetric rice form inside and airborne', () => {
  const model = build();
  const bedBodies: THREE.Mesh[] = [];
  const airborneBodies: THREE.Mesh[] = [];
  const planes: string[] = [];
  model.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (object.geometry.type === 'PlaneGeometry') planes.push(object.name);
    if (/^rice-cooker-bed-kernel-\d+-body$/.test(object.name)) bedBodies.push(object);
    if (/^rice-cooker-airborne-kernel-\d+-body$/.test(object.name)) airborneBodies.push(object);
  });
  expect(bedBodies).toHaveLength(30);
  expect(airborneBodies).toHaveLength(28);
  expect(planes).toEqual([]);
  expect(airborneBodies.every((grain) => grain.geometry === bedBodies[0].geometry)).toBe(true);
  expect(airborneBodies.every((grain) => grain.material === bedBodies[0].material)).toBe(true);
  const airborneCrease = model.root.getObjectByName('rice-cooker-airborne-kernel-1-crease');
  expect(airborneCrease).toBeInstanceOf(THREE.Mesh);
  expect((airborneCrease as THREE.Mesh).geometry.type).toBe('TubeGeometry');
  expect(model.root.userData.riceCookerEffectContract).toMatchObject({
    modelOwner: 'rice-cooker-model-rig',
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
    riceBedKernels: 30,
    airborneRiceKernels: 28,
    steamVolumes: 8,
    flatEffects: 0,
  });
});

test('rice erupts from the pot-lid side seam in high wide radial sprays', () => {
  const model = build();
  const performance = createRiceCookerPerformance(model.root);
  const kernels = Array.from({ length: 28 }, (_, index) => (
    model.root.getObjectByName(`rice-cooker-airborne-kernel-${index + 1}-pivot`) as THREE.Object3D
  ));
  kernels.forEach((kernel) => {
    const start = new THREE.Vector3().fromArray(kernel.userData.startPosition as number[]);
    expect(Math.hypot(start.x, start.z)).toBeGreaterThan(0.5);
    expect(start.y).toBeLessThanOrEqual(1.2);
    expect(Number(kernel.userData.apexHeight)).toBeGreaterThanOrEqual(1);
    const launch = Number(kernel.userData.launchTime);
    const duration = Number(kernel.userData.flightDuration);
    performance.apply(launch + duration * 0.5, 1);
    expect(kernel.visible).toBe(true);
    expect(kernel.position.y - start.y).toBeGreaterThan(0.8);
    expect(Math.hypot(kernel.position.x - start.x, kernel.position.z - start.z)).toBeGreaterThan(0.6);
  });
  const launchAngles = kernels.map((kernel) => (
    Math.atan2(Number(kernel.userData.driftZ), Number(kernel.userData.driftX))
  ));
  const signedSteps = launchAngles.slice(1).map((angle, index) => (
    Math.atan2(Math.sin(angle - launchAngles[index]), Math.cos(angle - launchAngles[index]))
  ));
  const signChanges = signedSteps.slice(1).filter((step, index) => (
    Math.sign(step) !== Math.sign(signedSteps[index])
  )).length;
  expect(signedSteps.some((step) => step < 0)).toBe(true);
  expect(signedSteps.some((step) => step > 0)).toBe(true);
  expect(signChanges).toBeGreaterThanOrEqual(8);
  expect(signedSteps.reduce((sum, step) => sum + Math.abs(step), 0) / signedSteps.length)
    .toBeGreaterThan(0.8);
});

test('rice cooker steam is eight socket-bound 3D volumes and lid has a regular high-low beat', () => {
  const model = build();
  const socket = model.root.getObjectByName('rice-cooker-steam-socket');
  const puffs = Array.from({ length: 8 }, (_, index) => (
    model.root.getObjectByName(`rice-cooker-volumetric-steam-puff-${index + 1}-pivot`)
  ));
  expect(socket).toBeTruthy();
  expect(puffs.every((puff) => puff?.parent === socket)).toBe(true);
  expect(model.root.getObjectByName('rice-cooker-lid-hinge-pivot')?.parent?.name).toBe('rice-cooker-body-pivot');
  expect(model.root.getObjectByName('rice-cooker-rear-latch-pivot')?.parent?.name).toBe('rice-cooker-body-pivot');
  expect(model.root.getObjectByName('rice-cooker-rear-lid-hinge')?.parent?.name).toBe('rice-cooker-body-pivot');
  expect(puffs.every((puff) => {
    let meshCount = 0;
    let hasFlat = false;
    puff?.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        meshCount += 1;
        hasFlat ||= object.geometry.type === 'PlaneGeometry';
      }
      expect(object instanceof THREE.Sprite).toBe(false);
      expect(object instanceof THREE.Line).toBe(false);
    });
    return meshCount === 4 && !hasFlat;
  })).toBe(true);
  const performance = createRiceCookerPerformance(model.root);
  const peaks: Array<{ beat: string; lift: number }> = [];
  for (let index = 0; index < 6; index += 1) {
    performance.apply(RICE_COOKER_TIMELINE.alternatingStart + (index + 0.5) * RICE_COOKER_TIMELINE.lidBeatSeconds, 1);
    peaks.push({ beat: performance.diagnostics.lidBeat, lift: performance.diagnostics.lidLiftAngle });
  }
  expect(peaks.map(({ beat }) => beat)).toEqual(['high', 'low', 'high', 'low', 'high', 'low']);
  expect(peaks[0].lift).toBeGreaterThan(peaks[1].lift * 1.6);
  expect(peaks[2].lift).toBeGreaterThan(peaks[3].lift * 1.6);
  expect(performance.diagnostics.lidAttachedToHinge).toBe(true);
});

test('rice cooker airborne grains arc out and settle while steam naturally weakens', () => {
  const model = build();
  const performance = createRiceCookerPerformance(model.root);
  performance.apply(1.85, 1);
  expect(performance.diagnostics.visibleAirborneRice).toBeGreaterThan(0);
  expect(performance.diagnostics.visibleSteamVolumes).toBeGreaterThan(3);
  expect(performance.diagnostics.steamEnvelope).toBeGreaterThan(0.4);
  performance.apply(4.78, 1);
  expect(performance.diagnostics.visibleAirborneRice).toBeGreaterThanOrEqual(1);
  expect(performance.diagnostics.landedRice).toBeGreaterThan(5);
  const tail = [4.5, 4.7, 4.9, 5.1].map((time) => {
    performance.apply(time, 1);
    return performance.diagnostics.steamEnvelope;
  });
  for (let index = 1; index < tail.length; index += 1) {
    expect(tail[index]).toBeLessThanOrEqual(tail[index - 1] + 1e-8);
  }
  expect(tail.at(-1)).toBeLessThan(0.1);
  performance.apply(5.1, 1);
  expect(performance.diagnostics.visibleAirborneRice).toBe(0);
  expect(performance.diagnostics.landedRice).toBe(28);
  performance.reset();
  expect(performance.diagnostics.phase).toBe('idle');
  expect(performance.diagnostics.visibleSteamVolumes).toBe(0);
  expect(performance.diagnostics.visibleAirborneRice).toBe(0);
  for (let index = 1; index <= 8; index += 1) {
    expect(model.root.getObjectByName(`rice-cooker-volumetric-steam-puff-${index}-pivot`)?.visible).toBe(false);
  }
});

test('same rice cooker timestamp produces identical game and gallery poses', () => {
  const gameModel = build();
  const galleryModel = build();
  const gamePerformance = createRiceCookerPerformance(gameModel.root);
  const galleryPerformance = createRiceCookerPerformance(galleryModel.root);
  gamePerformance.apply(2.35, 1);
  galleryPerformance.apply(2.35, 1);
  expect(namedPose(gameModel.root)).toBe(namedPose(galleryModel.root));
  expect(gameModel.root.userData.riceCookerPerformance).toEqual(galleryModel.root.userData.riceCookerPerformance);
  expect(RICE_COOKER_TIMELINE.settleEnd).toBe(5.2);
});
