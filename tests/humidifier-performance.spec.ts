import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createHumidifierModel } from '../src/appliances/models/humidifier';
import {
  applyHumidifierPerformance,
  resetHumidifierPerformance,
  type HumidifierPerformanceDiagnostics,
} from '../src/appliances/performance/HumidifierPerformance';

const LEGACY_HUMIDIFIER_EFFECT = /^humidifier-(?:mist-particle|storm-cloud$|cloud-(?:lightning|rain))/;

function build() {
  return createHumidifierModel({ id: 'humidifier', accent: 0xe8a7b7 });
}

function diagnostics(root: THREE.Group): HumidifierPerformanceDiagnostics {
  return root.userData.humidifierPerformance as HumidifierPerformanceDiagnostics;
}

test('humidifier owns only closed volumetric weather geometry', () => {
  const model = build();
  const legacy: string[] = [];
  const planes: string[] = [];
  const mistLobes: THREE.Mesh[] = [];
  const rainDrops: THREE.Mesh[] = [];
  model.root.traverse((object) => {
    if (LEGACY_HUMIDIFIER_EFFECT.test(object.name)) legacy.push(object.name);
    if (object instanceof THREE.Mesh && object.geometry.type === 'PlaneGeometry') planes.push(object.name);
    if (/^humidifier-mist-volume-\d+-lobe-\d+$/.test(object.name)) mistLobes.push(object as THREE.Mesh);
    if (/^humidifier-rain-drop-\d+$/.test(object.name)) rainDrops.push(object as THREE.Mesh);
  });

  expect(legacy).toEqual([]);
  expect(planes).toEqual([]);
  expect(mistLobes).toHaveLength(72);
  expect(mistLobes.every((mesh) => mesh.geometry.type === 'IcosahedronGeometry')).toBe(true);
  expect(rainDrops).toHaveLength(36);
  expect(rainDrops.every((mesh) => mesh.geometry.type === 'LatheGeometry')).toBe(true);
  expect(model.root.getObjectByName('humidifier-cloud-volumetric-lightning-bolt')).toBeTruthy();
  expect((model.root.getObjectByName('humidifier-cloud-volumetric-lightning-bolt') as THREE.Mesh).geometry.type)
    .toBe('TubeGeometry');
  expect(model.root.userData.humidifierEffectContract).toMatchObject({
    modelOwner: 'humidifier-model-rig',
    usesPlaneGeometry: false,
    usesSprite: false,
    mistVolumes: 18,
    cloudLobes: 9,
    internalLightBodies: 3,
    volumetricRainDrops: 36,
  });
});

test('storm cloud reaches about one and a half appliance visual areas', () => {
  const model = build();
  const cloud = model.root.getObjectByName('humidifier-volumetric-weather-cloud-rig')!;
  cloud.visible = true;
  cloud.position.set(0, 0, 0);
  cloud.scale.setScalar(1);
  cloud.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(cloud).getSize(new THREE.Vector3());
  const cloudArea = size.x * size.y;
  const bodyArea = 2.34 * 2.93;

  expect(size.x).toBeGreaterThan(3.8);
  expect(size.y).toBeGreaterThan(2.1);
  expect(cloudArea / bodyArea).toBeGreaterThan(1.3);
  expect(cloudArea / bodyArea).toBeLessThan(1.8);
});

test('one model-owned timeline progresses from high mist to cloud, lightning and rain', () => {
  const gameModel = build();
  const galleryModel = build();

  applyHumidifierPerformance(gameModel.root, 0.92, 1);
  expect(diagnostics(gameModel.root).phase).toBe('high-mist');
  expect(diagnostics(gameModel.root).visibleMistVolumes).toBeGreaterThan(10);
  expect(diagnostics(gameModel.root).cloudStrength).toBeLessThan(0.05);

  applyHumidifierPerformance(gameModel.root, 2.34, 1);
  expect(diagnostics(gameModel.root).phase).toBe('cloud-forming');
  expect(diagnostics(gameModel.root).cloudStrength).toBeGreaterThan(0.98);
  expect(diagnostics(gameModel.root).cloudVisualAreaRatio).toBeCloseTo(1.5, 2);
  expect(gameModel.root.getObjectByName('humidifier-volumetric-weather-cloud-rig')?.visible).toBe(true);

  applyHumidifierPerformance(gameModel.root, 3.6, 1);
  applyHumidifierPerformance(galleryModel.root, 3.6, 1);
  const game = diagnostics(gameModel.root);
  const gallery = diagnostics(galleryModel.root);
  expect(game.phase).toBe('rainstorm');
  expect(game.timelineOwner).toBe('AppliancePerformanceSystem');
  expect(game.modelOwner).toBe('humidifier-model-rig');
  expect(game.sharedSpectacleEffects).toBe('disabled');
  expect(game.lightningFlash).toBeGreaterThan(0.9);
  expect(game.visibleRainDrops).toBe(36);
  expect(game.rainDropsTargetingMachine).toBeGreaterThan(0);
  expect(game.rainDropsNearMachine).toBeGreaterThan(0);
  expect(gallery).toEqual(game);

  resetHumidifierPerformance(gameModel.root);
  expect(gameModel.root.userData.humidifierPerformance).toBeUndefined();
  expect(gameModel.root.getObjectByName('humidifier-volumetric-weather-cloud-rig')?.visible).toBe(false);
  expect(gameModel.root.getObjectByName('humidifier-volumetric-rain-rig')?.visible).toBe(false);
});
