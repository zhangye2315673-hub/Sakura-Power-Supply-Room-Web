import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createCoffeeMakerModel } from '../src/appliances/models/coffeeMaker';
import {
  applyCoffeeMakerPerformance,
  resetCoffeeMakerPerformance,
  type CoffeeMakerPerformanceDiagnostics,
} from '../src/appliances/performance/CoffeeMakerPerformance';

const LEGACY_EFFECT = /^coffee-maker-(?:coffee-stream|steam-particle|beer-foam|rim-foam|overflowing-foam)/;

function build() {
  return createCoffeeMakerModel({ id: 'coffee-maker', accent: 0xe8a7b7 });
}

function diagnostics(root: THREE.Group): CoffeeMakerPerformanceDiagnostics {
  return root.userData.coffeeMakerPerformanceDiagnostics as CoffeeMakerPerformanceDiagnostics;
}

test('coffee maker owns a transparent hopper with sculpted creased beans and no flat legacy FX', () => {
  const model = build();
  const beanBodies: THREE.Mesh[] = [];
  const beanCreases: THREE.Mesh[] = [];
  const beanPivots: THREE.Object3D[] = [];
  const planes: string[] = [];
  const legacy: string[] = [];
  model.root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.geometry.type === 'PlaneGeometry') planes.push(object.name);
    if (/^coffee-maker-sculpted-bean-\d+$/.test(object.name)) beanBodies.push(object as THREE.Mesh);
    if (/^coffee-maker-bean-central-crease-\d+$/.test(object.name)) beanCreases.push(object as THREE.Mesh);
    if (/^coffee-maker-hopper-bean-pivot-\d+$/.test(object.name)) beanPivots.push(object);
    if (LEGACY_EFFECT.test(object.name)) legacy.push(object.name);
  });

  expect(model.root.getObjectByName('coffee-maker-gray-translucent-bean-hopper')).toBeTruthy();
  const hopper = model.root.getObjectByName('coffee-maker-gray-translucent-bean-hopper') as THREE.Mesh;
  hopper.geometry.computeBoundingBox();
  const hopperSize = hopper.geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3();
  expect(hopper.geometry.type).toBe('RoundedBoxGeometry');
  expect(hopperSize.x).toBeGreaterThanOrEqual(1.28);
  expect(hopperSize.z).toBeGreaterThanOrEqual(0.72);
  expect(beanBodies).toHaveLength(30);
  expect(beanBodies.every((bean) => bean.scale.x > bean.scale.z)).toBe(true);
  expect(beanCreases).toHaveLength(30);
  expect(beanCreases.every((crease) => crease.geometry.type === 'TubeGeometry')).toBe(true);
  expect(beanPivots.every((bean) => bean.userData.restingPattern === 'deterministic-loose-pile')).toBe(true);
  expect(new Set(beanPivots.map((bean) => bean.position.y.toFixed(3))).size).toBeGreaterThan(12);
  expect(new Set(beanPivots.map((bean) => bean.position.x.toFixed(3))).size).toBeGreaterThan(24);
  expect(new Set(beanPivots.map((bean) => bean.position.z.toFixed(3))).size).toBeGreaterThan(24);
  expect(planes).toEqual([]);
  expect(legacy).toEqual([]);
  expect(model.root.userData.coffeeMakerEffectContract).toMatchObject({
    modelOwner: 'coffee-maker-model-rig',
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
    sculptedBeans: 30,
    preInfusionDrops: 3,
    extractionColumns: 1,
    steamVolumes: 12,
    aromaCurls: 5,
    warmLightPoints: 16,
  });
});

test('coffee maker timeline shows pre-infusion, heavy extraction, pressure peak and settle', () => {
  const preInfusion = build();
  applyCoffeeMakerPerformance(preInfusion.root, 0.9, 1);
  expect(diagnostics(preInfusion.root).phase).toBe('pre-infusion');
  expect(diagnostics(preInfusion.root).visiblePreInfusionDrops).toBeGreaterThanOrEqual(1);
  expect(diagnostics(preInfusion.root).visibleExtractionColumns).toBe(0);

  const extraction = build();
  applyCoffeeMakerPerformance(extraction.root, 2.45, 1);
  expect(diagnostics(extraction.root).phase).toBe('main-extraction');
  expect(diagnostics(extraction.root).visibleExtractionColumns).toBe(1);
  expect(diagnostics(extraction.root).flowStrength).toBeGreaterThan(0.9);
  expect(diagnostics(extraction.root).cupFill).toBeGreaterThan(0.25);
  expect(diagnostics(extraction.root).visibleSteamVolumes).toBeGreaterThan(4);

  const peak = build();
  applyCoffeeMakerPerformance(peak.root, 3.65, 1);
  const peakState = diagnostics(peak.root);
  expect(peakState.phase).toBe('pressure-peak');
  expect(peakState.bodyCompression).toBeGreaterThan(0);
  expect(peakState.jumpingBeans).toBeGreaterThan(10);
  expect(peakState.visibleAromaCurls).toBe(5);
  expect(peakState.visibleWarmLightPoints).toBeGreaterThan(6);
  peak.root.updateWorldMatrix(true, true);
  const steamSocket = peak.root.getObjectByName('coffee-maker-steam-socket')!;
  const steamRigOrigin = peak.root.getObjectByName('coffee-maker-volumetric-steam-rig')!;
  expect(Math.abs(steamSocket.position.x)).toBeLessThan(0.001);
  expect(Math.abs(steamSocket.position.z)).toBeLessThan(0.001);
  expect(Math.abs(steamRigOrigin.position.x)).toBeLessThan(0.001);
  expect(Math.abs(steamRigOrigin.position.z)).toBeLessThan(0.001);
  const upperShell = peak.root.getObjectByName('coffee-maker-upper-rounded-shell')!;
  const upperShellBounds = new THREE.Box3().setFromObject(upperShell);
  const penetratingEffects: string[] = [];
  const steamRig = peak.root.getObjectByName('coffee-maker-volumetric-steam-rig')!;
  steamRig.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !object.visible) return;
    const positions = object.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let index = 0; index < positions.count; index += 1) {
      const vertex = new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(object.matrixWorld);
      if (!upperShellBounds.containsPoint(vertex)) continue;
      penetratingEffects.push(object.name);
      break;
    }
  });
  expect(penetratingEffects).toEqual([]);
  const visibleSteamPivots = Array.from({ length: 12 }, (_, index) => (
    peak.root.getObjectByName(`coffee-maker-steam-volume-pivot-${index + 1}`)!
  )).filter((object) => object.visible);
  const lowestSteam = visibleSteamPivots.reduce((lowest, object) => (
    object.position.y < lowest.position.y ? object : lowest
  ));
  const highestSteam = visibleSteamPivots.reduce((highest, object) => (
    object.position.y > highest.position.y ? object : highest
  ));
  expect(lowestSteam.position.z).toBeLessThan(0.16);
  expect(highestSteam.position.z).toBeGreaterThan(lowestSteam.position.z + 0.2);
  expect(peakState.timelineOwner).toBe('AppliancePerformanceSystem');
  expect(peakState.effectOwner).toBe('coffee-maker-model-rig');
  expect(peakState.sharedSpectacleEffects).toBe('disabled');

  const settled = build();
  applyCoffeeMakerPerformance(settled.root, 5.35, 1);
  expect(diagnostics(settled.root).phase).toBe('satisfied-settle');
  expect(diagnostics(settled.root).visibleExtractionColumns).toBe(0);
  expect(diagnostics(settled.root).cupFill).toBeGreaterThan(0.99);
  expect(diagnostics(settled.root).liquidWobble).toBeLessThan(0.03);

  resetCoffeeMakerPerformance(settled.root);
  expect(settled.root.userData.coffeeMakerPerformanceDiagnostics).toBeUndefined();
  expect(settled.root.getObjectByName('coffee-maker-cup-liquid-surface')?.visible).toBe(false);
});
