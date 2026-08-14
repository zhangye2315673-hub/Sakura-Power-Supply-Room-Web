import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createMicrowaveModel } from '../src/appliances/models/microwave';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import type { MicrowavePerformanceDiagnostics } from '../src/appliances/performance/MicrowavePerformance';
import {
  AppliancePerformanceSystem,
  type AppliancePerformanceTarget,
} from '../src/systems/AppliancePerformanceSystem';
import { PetalField } from '../src/systems/PetalField';

function pose(root: THREE.Group): string {
  const values: Array<[string, number[], boolean]> = [];
  root.traverse((object) => {
    if (object.userData.isOutline) return;
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

function diagnostics(root: THREE.Group): MicrowavePerformanceDiagnostics {
  return root.userData.microwavePerformanceDiagnostics as MicrowavePerformanceDiagnostics;
}

test('microwave has a large readable window and model-owned volumetric heat effects', () => {
  const model = createMicrowaveModel({ id: 'microwave', accent: 0xe85f67, referencePath: null });
  const glass = model.root.getObjectByName('microwave-smoked-door-glass') as THREE.Mesh;
  const food = model.root.getObjectByName('microwave-food-main-volume') as THREE.Mesh;
  const cavityBack = model.root.getObjectByName('microwave-interior-back-wall') as THREE.Mesh;
  const trayPivot = model.root.getObjectByName('microwave-tray-rotor-pivot') as THREE.Group;
  glass.geometry.computeBoundingBox();
  food.geometry.computeBoundingBox();
  const glassSize = glass.geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3();
  const foodSize = food.geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3();

  expect(glassSize.x).toBeGreaterThan(2.2);
  expect(glassSize.y).toBeGreaterThan(1.4);
  expect((glass.material as THREE.Material).opacity).toBeLessThanOrEqual(0.08);
  expect(model.root.getObjectByName('microwave-front-fascia-left-rail')).toBeTruthy();
  expect(model.root.getObjectByName('microwave-front-fascia-right-rail')).toBeTruthy();
  expect(model.root.getObjectByName('microwave-cabinet-top-bridge')).toBeTruthy();
  expect(model.root.getObjectByName('microwave-cabinet-bottom-bridge')).toBeTruthy();
  expect(model.root.getObjectByName('microwave-cabinet-left-side-wall')).toBeTruthy();
  expect(model.root.getObjectByName('microwave-interior-back-wall')).toBeTruthy();
  expect((glass.material as THREE.Material).depthWrite).toBe(false);
  expect(glass.position.z - cavityBack.position.z).toBeGreaterThan(1.5);
  expect(trayPivot.position.z - cavityBack.position.z).toBeGreaterThan(0.6);
  expect(foodSize.x).toBeGreaterThan(0.8);
  expect(foodSize.y).toBeGreaterThan(0.29);
  const tray = model.root.getObjectByName('microwave-glass-tray') as THREE.Mesh;
  const plate = model.root.getObjectByName('microwave-food-plate') as THREE.Mesh;
  tray.geometry.computeBoundingBox();
  plate.geometry.computeBoundingBox();
  const traySize = tray.geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3();
  const plateSize = plate.geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3();
  expect(traySize.x).toBeGreaterThan(1.3);
  expect(plateSize.x).toBeGreaterThan(1.1);

  const effects: THREE.Mesh[] = [];
  const forbidden: string[] = [];
  model.root.traverse((object) => {
    if (object instanceof THREE.Sprite || object instanceof THREE.Line) forbidden.push(`${object.name}:${object.type}`);
    if (!(object instanceof THREE.Mesh)) return;
    if (object.geometry.type === 'PlaneGeometry') forbidden.push(`${object.name}:${object.geometry.type}`);
    if (object.userData.performanceProp === 'volumetric-low-poly-steam-lobe'
      || object.userData.performanceProp === 'thick-irregular-heat-energy-ring') effects.push(object);
  });

  expect(forbidden).toEqual([]);
  expect(effects.filter((effect) => effect.userData.performanceProp === 'volumetric-low-poly-steam-lobe')).toHaveLength(24);
  expect(effects.filter((effect) => effect.userData.performanceProp === 'thick-irregular-heat-energy-ring')).toHaveLength(4);
  effects.forEach((effect) => {
    effect.geometry.computeBoundingBox();
    const size = effect.geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3();
    expect(Math.min(size.x, size.y, size.z), `${effect.name} must have real thickness`).toBeGreaterThan(0.035);
  });
  expect(model.root.userData.microwavePerformanceRig).toMatchObject({
    timelineOwner: 'AppliancePerformanceSystem',
    effectOwner: 'microwave-model-rig',
    forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
  });
});

test('microwave runs startup, escalating heat burst, inertial wind-down and final settle', () => {
  const model = createMicrowaveModel({ id: 'microwave', accent: 0xe85f67, referencePath: null });
  const animation = createApplianceMechanicalAnimation('microwave', model.root);
  const idlePose = pose(model.root);

  animation.update(0.2, 1);
  expect(diagnostics(model.root).phase).toBe('dial-start');
  expect(Math.abs(diagnostics(model.root).dialTurn)).toBeGreaterThan(0.5);
  expect(diagnostics(model.root).trayAngularSpeed).toBe(0);

  animation.update(0.5, 1);
  expect(diagnostics(model.root).phase).toBe('indicator-sequence');
  expect(diagnostics(model.root).litIndicatorCount).toBe(3);
  expect(diagnostics(model.root).interiorLightStrength).toBe(0);

  animation.update(0.6, 1);
  expect(diagnostics(model.root).interiorLightStrength).toBe(1);

  animation.update(1.7, 1);
  const heating = { ...diagnostics(model.root) };
  expect(heating.phase).toBe('steam-build');
  expect(heating.trayAngularSpeed).toBeGreaterThan(6);
  expect(heating.visibleSteamPuffs).toBeGreaterThanOrEqual(2);
  expect(heating.foodScale).toBeGreaterThan(1);

  animation.update(3.8, 1);
  const climax = { ...diagnostics(model.root) };
  expect(climax.phase).toBe('energy-climax');
  expect(climax.visibleSteamPuffs).toBe(8);
  expect(climax.maximumSteamOpacity).toBeGreaterThan(0.35);
  expect(climax.activeHeatWaveCount).toBeGreaterThanOrEqual(3);
  expect(climax.wholeMachineCompression).toBeGreaterThan(0.8);
  expect(model.root.scale.y).toBeLessThan(0.97);

  animation.update(4.62, 1);
  const windDown = { ...diagnostics(model.root) };
  expect(windDown.phase).toBe('inertial-wind-down');
  expect(Math.abs(windDown.dialTurn)).toBeLessThan(Math.PI * 0.72);
  expect(windDown.trayAngularSpeed).toBeGreaterThan(0);
  expect(windDown.trayAngularSpeed).toBeLessThan(climax.trayAngularSpeed);

  animation.update(5.0, 0.36);
  const settle = { ...diagnostics(model.root) };
  expect(settle.phase).toBe('final-settle');
  expect(Math.abs(settle.dialTurn)).toBeLessThan(0.05);
  expect(settle.trayAngularSpeed).toBeGreaterThan(0);
  expect(settle.interiorLightStrength).toBeLessThan(0.3);
  expect(Math.abs(settle.finalSettle)).toBeGreaterThan(0.01);

  animation.stop();
  expect(pose(model.root)).toBe(idlePose);
  expect(model.root.userData.microwavePerformanceDiagnostics).toBeUndefined();
  expect(animation.signal()).toBe(0);
});

test('microwave game and gallery share one timeline and generic steam stays disabled', () => {
  const game = createMicrowaveModel({ id: 'microwave', accent: 0xe85f67, referencePath: null });
  const gallery = createMicrowaveModel({ id: 'microwave', accent: 0xe85f67, referencePath: null });
  const gameAnimation = createApplianceMechanicalAnimation('microwave', game.root);
  const galleryAnimation = createApplianceMechanicalAnimation('microwave', gallery.root);
  for (const [time, power] of [[0.2, 1], [0.6, 1], [1.7, 1], [3.8, 1], [4.62, 1], [5, 0.36]] as const) {
    gameAnimation.update(time, power);
    galleryAnimation.update(time, power);
    expect(pose(game.root), `game/gallery pose drifted at ${time}s`).toBe(pose(gallery.root));
    expect(diagnostics(game.root)).toEqual(diagnostics(gallery.root));
  }

  const system = new AppliancePerformanceSystem();
  const petals = new PetalField(1);
  const camera = new THREE.PerspectiveCamera(31, 16 / 9, 0.1, 80);
  camera.position.set(4, 3, 8);
  camera.lookAt(0, 1.2, 0);
  camera.updateMatrixWorld(true);
  const target: AppliancePerformanceTarget = {
    root: game.root,
    state: 'active',
    kind: 'microwave',
    facingSide: 1,
    getActiveElapsed: () => 3.8,
  };
  system.update(1 / 60, 3.8, camera, [target], petals);
  const state = system.getStateSummary();
  expect(state.timelineOwners).toBe(1);
  expect(state.activeByKind.steam ?? 0).toBe(0);
  expect(diagnostics(game.root).effectOwner).toBe('microwave-model-rig');
  expect(game.root.userData.performanceDefinition).toBe('microwave');

  system.dispose();
  petals.dispose();
});
