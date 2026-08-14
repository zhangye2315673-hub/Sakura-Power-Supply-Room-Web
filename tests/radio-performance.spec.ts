import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createRadioModel } from '../src/appliances/models/radio';
import {
  AppliancePerformanceSystem,
  type AppliancePerformanceTarget,
} from '../src/systems/AppliancePerformanceSystem';
import { PetalField } from '../src/systems/PetalField';

function makeCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(31, 16 / 9, 0.1, 80);
  camera.position.set(4, 3, 8);
  camera.lookAt(0, 0.8, 0);
  camera.updateMatrixWorld(true);
  return camera;
}

function pose(root: THREE.Group): string {
  const values: Array<[string, number[]]> = [];
  root.traverse((object) => {
    if (object.userData.isOutline) return;
    values.push([object === root ? 'root' : object.name || object.type, [
      object.position.x, object.position.y, object.position.z,
      object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w,
      object.scale.x, object.scale.y, object.scale.z,
    ].map((value) => Number(value.toFixed(7)))]);
  });
  return JSON.stringify(values);
}

function visibleWaves(root: THREE.Object3D): THREE.Mesh[] {
  const waves: THREE.Mesh[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.visible && object.name.startsWith('spectacle-wave-')) {
      waves.push(object);
    }
  });
  return waves;
}

function makeTarget(root: THREE.Group, elapsed: { value: number }): AppliancePerformanceTarget {
  return {
    root,
    state: 'active',
    kind: 'radio',
    facingSide: 1,
    getActiveElapsed: () => elapsed.value,
  };
}

test('radio aerial telescopes, overshoots and keeps crossing both sides of vertical', () => {
  const model = createRadioModel({ id: 'radio', accent: 0xe8aec4 });
  const performances = new AppliancePerformanceSystem();
  const petals = new PetalField(1);
  const camera = makeCamera();
  const elapsed = { value: 0 };
  const target = makeTarget(model.root, elapsed);
  const idle = pose(model.root);

  const hinge = model.root.getObjectByName('radio-antenna-hinge-pivot');
  const segment2 = model.root.getObjectByName('radio-antenna-extension-pivot-2');
  const segment3 = model.root.getObjectByName('radio-antenna-extension-pivot-3');
  const tip = model.root.getObjectByName('radio-antenna-tip-extension-pivot');
  const tipCap = model.root.getObjectByName('radio-antenna-tip-cap') as THREE.Mesh | undefined;
  expect(hinge).toBeTruthy();
  expect(tipCap?.geometry.type).toBe('SphereGeometry');
  expect(tipCap?.userData.persistentAntennaTip).toBe(true);
  expect(segment2?.position.y).toBeCloseTo(0.34, 6);
  expect(segment3?.position.y).toBeCloseTo(0.59, 6);
  expect(tip?.position.y).toBeCloseTo(1.64, 6);

  const expectTipOnHighestSection = () => {
    const highestTop = Math.max(
      (model.root.getObjectByName('radio-antenna-extension-pivot-1')?.position.y ?? 0) + 1.35,
      (segment2?.position.y ?? 0) + 1.2,
      (segment3?.position.y ?? 0) + 1.05,
    );
    expect(tip?.position.y).toBeCloseTo(highestTop, 6);
    expect(tipCap?.visible).toBe(true);
    expect(model.root.userData.radioPerformanceDiagnostics?.tipTopError ?? 0).toBeLessThan(1e-6);
  };

  elapsed.value = 0.48;
  performances.update(1 / 60, elapsed.value, camera, [target], petals);
  const uprightBeforeExtension = model.root.userData.radioPerformanceDiagnostics;
  expect(uprightBeforeExtension.nearVertical).toBe(true);
  expect(uprightBeforeExtension.segmentExtensions.every((value: number) => value < 0.001)).toBe(true);
  expect(uprightBeforeExtension.tipCapVisible).toBe(true);
  expect(uprightBeforeExtension.tipTracksHighestSection).toBe(true);
  expectTipOnHighestSection();

  elapsed.value = 0.75;
  performances.update(1 / 60, elapsed.value, camera, [target], petals);
  const snap = model.root.userData.radioPerformanceDiagnostics;
  expect(snap.segmentExtensions[0]).toBeGreaterThan(0.4);
  expect(snap.segmentExtensions[0]).toBeLessThan(0.8);
  expect(snap.segmentExtensions.slice(1).every((value: number) => value < 0.001)).toBe(true);
  expectTipOnHighestSection();

  elapsed.value = 1.9;
  performances.update(1 / 60, elapsed.value, camera, [target], petals);
  const fullyExtended = model.root.userData.radioPerformanceDiagnostics;
  expect(fullyExtended.segmentExtensions[3]).toBeGreaterThan(0.9);
  expect(tip?.position.y).toBeGreaterThan(3.2);
  expect(fullyExtended.tipCapVisible).toBe(true);
  expectTipOnHighestSection();

  const settledAngles: number[] = [];
  for (const time of [1.15, 2.1, 2.9, 3.75]) {
    elapsed.value = time;
    performances.update(1 / 60, time, camera, [target], petals);
    settledAngles.push(Number(model.root.userData.radioPerformanceDiagnostics.hingeAngle));
  }
  expect(Math.min(...settledAngles), 'aerial must sway left of vertical').toBeLessThan(0);
  expect(Math.max(...settledAngles), 'aerial must sway right of vertical').toBeGreaterThan(0.055);
  expect(settledAngles.every((angle) => Math.abs(angle) < 0.16)).toBe(true);

  const retractionSamples = [
    { time: 4.43, phase: 'tip', high: [0, 1, 2], shrinking: 3 },
    { time: 4.6, phase: 'segment-3', high: [0, 1], shrinking: 2 },
    { time: 4.76, phase: 'segment-2', high: [0], shrinking: 1 },
    { time: 4.92, phase: 'segment-1', high: [], shrinking: 0 },
  ] as const;
  retractionSamples.forEach((sample) => {
    elapsed.value = sample.time;
    performances.update(1 / 60, elapsed.value, camera, [target], petals);
    const diagnostics = model.root.userData.radioPerformanceDiagnostics;
    expect(diagnostics.retractionPhase).toBe(sample.phase);
    sample.high.forEach((index) => expect(diagnostics.segmentExtensions[index]).toBeGreaterThan(0.95));
    expect(diagnostics.segmentExtensions[sample.shrinking]).toBeGreaterThan(0.05);
    expect(diagnostics.segmentExtensions[sample.shrinking]).toBeLessThan(0.95);
    expect(diagnostics.nearVertical).toBe(true);
    expect(diagnostics.tipCapVisible).toBe(true);
    expect(tipCap?.visible).toBe(true);
    expectTipOnHighestSection();
  });

  // All nested sections are stored before the hinge begins returning.
  elapsed.value = 5.01;
  performances.update(1 / 60, elapsed.value, camera, [target], petals);
  expect(model.root.userData.radioPerformanceDiagnostics.segmentExtensions.every((value: number) => value < 0.001)).toBe(true);
  expect(model.root.userData.radioPerformanceDiagnostics.nearVertical).toBe(true);

  elapsed.value = 5.16;
  performances.update(1 / 60, elapsed.value, camera, [target], petals);
  expect(model.root.userData.radioPerformanceDiagnostics.retractionPhase).toBe('hinge-return');
  expect(model.root.userData.radioPerformanceDiagnostics.segmentExtensions.every((value: number) => value < 0.001)).toBe(true);
  expect(model.root.userData.radioPerformanceDiagnostics.tipCapVisible).toBe(true);
  model.root.updateWorldMatrix(true, true);
  const antennaBase = hinge!.getWorldPosition(new THREE.Vector3());
  const antennaTip = model.root.getObjectByName('radio-antenna-tip-cap')!
    .getWorldPosition(new THREE.Vector3());
  const worldAngle = antennaTip.sub(antennaBase).angleTo(new THREE.Vector3(0, 1, 0));
  expect(THREE.MathUtils.radToDeg(worldAngle), 'retracted aerial must return toward its authored rest angle')
    .toBeGreaterThan(45);
  expect(Math.abs(Number(model.root.userData.radioPerformanceDiagnostics.hingeAngle) - 1.12))
    .toBeLessThan(0.08);

  performances.stop(target);
  expect(pose(model.root)).toBe(idle);
  expect(model.root.userData.radioPerformanceDiagnostics).toBeUndefined();
  expect(model.root.userData.radioWaveDiagnostics).toBeUndefined();
  performances.dispose();
  petals.dispose();
});

test('radio waves are varied physical tubes emitted only in front of the speaker', () => {
  const model = createRadioModel({ id: 'radio', accent: 0xe8aec4 });
  const performances = new AppliancePerformanceSystem();
  const petals = new PetalField(1);
  const camera = makeCamera();
  const elapsed = { value: 4.2 };
  const target = makeTarget(model.root, elapsed);

  performances.update(1 / 60, elapsed.value, camera, [target], petals);
  const waves = visibleWaves(performances.root);
  expect(waves.length).toBeGreaterThanOrEqual(4);
  expect(new Set(waves.map((wave) => wave.userData.geometryVariant)).size).toBeGreaterThan(1);
  expect(model.root.userData.radioWaveDiagnostics).toMatchObject({
    emitter: 'radio-speaker-socket',
    geometry: 'closed-irregular-tube',
    frontOnly: true,
  });

  const socket = model.root.getObjectByName('radio-speaker-socket');
  expect(socket).toBeTruthy();
  const socketWorld = socket!.getWorldPosition(new THREE.Vector3());
  const forward = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(socket!.getWorldQuaternion(new THREE.Quaternion()))
    .normalize();
  for (const wave of waves) {
    expect(wave.geometry.type).toBe('TubeGeometry');
    expect(wave.geometry.userData.performanceProp).toBe('irregular-volumetric-radio-wave');
    expect(wave.material).toBeInstanceOf(THREE.MeshPhysicalMaterial);
    wave.geometry.computeBoundingBox();
    expect(wave.geometry.boundingBox?.getSize(new THREE.Vector3()).z ?? 0).toBeGreaterThan(0.08);
    expect(wave.userData.radioWave.profile).toBe('closed-irregular-tube');
    expect(wave.userData.radioWave.noBodyCrossing).toBe(true);
    expect(wave.userData.radioWave.velocityDotForward).toBeGreaterThan(0);
    const source = new THREE.Vector3().fromArray(wave.userData.radioWave.source);
    expect(source.clone().sub(socketWorld).dot(forward)).toBeGreaterThan(0.08);
    expect(wave.position.clone().sub(socketWorld).dot(forward)).toBeGreaterThan(0.08);
  }

  performances.dispose();
  petals.dispose();
});

test('game and gallery radio instances share identical rig and spectacle timestamps', () => {
  const camera = makeCamera();
  const gameModel = createRadioModel({ id: 'game-radio', accent: 0xe8aec4 });
  const galleryModel = createRadioModel({ id: 'gallery-radio', accent: 0xe8aec4 });
  const gameSystem = new AppliancePerformanceSystem();
  const gallerySystem = new AppliancePerformanceSystem();
  const gamePetals = new PetalField(1);
  const galleryPetals = new PetalField(1);
  const gameElapsed = { value: 0 };
  const galleryElapsed = { value: 0 };
  const gameTarget = makeTarget(gameModel.root, gameElapsed);
  const galleryTarget = makeTarget(galleryModel.root, galleryElapsed);

  for (const time of [0.25, 0.59, 1.15, 2.1, 4.2]) {
    gameElapsed.value = time;
    galleryElapsed.value = time;
    gameSystem.update(1 / 60, time, camera, [gameTarget], gamePetals);
    gallerySystem.update(1 / 60, time, camera, [galleryTarget], galleryPetals);
    expect(gameModel.root.userData.radioPerformanceDiagnostics)
      .toEqual(galleryModel.root.userData.radioPerformanceDiagnostics);
    expect(gameModel.root.userData.radioWaveDiagnostics)
      .toEqual(galleryModel.root.userData.radioWaveDiagnostics);
    expect(pose(gameModel.root)).toBe(pose(galleryModel.root));
    expect(gameSystem.getStateSummary().elapsedByKind.radio).toBeCloseTo(time, 6);
    expect(gallerySystem.getStateSummary().elapsedByKind.radio).toBeCloseTo(time, 6);
  }

  const gameWaveSignature = visibleWaves(gameSystem.root).map((wave) => ({
    variant: wave.userData.geometryVariant,
    position: wave.position.toArray().map((value) => Number(value.toFixed(6))),
    scale: wave.scale.toArray().map((value) => Number(value.toFixed(6))),
  }));
  const galleryWaveSignature = visibleWaves(gallerySystem.root).map((wave) => ({
    variant: wave.userData.geometryVariant,
    position: wave.position.toArray().map((value) => Number(value.toFixed(6))),
    scale: wave.scale.toArray().map((value) => Number(value.toFixed(6))),
  }));
  expect(gameWaveSignature).toEqual(galleryWaveSignature);

  gameSystem.dispose();
  gallerySystem.dispose();
  gamePetals.dispose();
  galleryPetals.dispose();
});
