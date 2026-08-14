import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createInductionCooktopModel } from '../src/appliances/models/inductionCooktop';
import {
  createInductionCooktopPerformance,
  INDUCTION_COOKTOP_TIMELINE,
} from '../src/appliances/performance/InductionCooktopPerformance';

function snapshot(root: THREE.Group): string {
  const values: unknown[] = [];
  const seen = new Set<THREE.Material>();
  root.traverse((object) => {
    values.push([
      object.name,
      object.visible,
      [...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()]
        .map((value) => Number(value.toFixed(7))),
    ]);
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (seen.has(material)) return;
      seen.add(material);
      const toon = material as THREE.MeshToonMaterial;
      values.push([
        'material',
        toon.color?.getHex(),
        toon.emissive?.getHex(),
        Number((toon.emissiveIntensity ?? 0).toFixed(7)),
        Number(material.opacity.toFixed(7)),
      ]);
    });
  });
  return JSON.stringify(values);
}

function foodPivots(root: THREE.Group): THREE.Object3D[] {
  const result: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (/^induction-cooktop-hotpot-meat-slice-\d+-pivot$/.test(object.name)
      || /^induction-cooktop-hotpot-tofu-cube-\d+$/.test(object.name)
      || /^induction-cooktop-hotpot-meatball-\d+$/.test(object.name)
      || /^induction-cooktop-hotpot-vegetable-\d+-pivot$/.test(object.name)) result.push(object);
  });
  return result;
}

test('hotpot owns four food types, fourteen soup volumes and eighteen volumetric steam clouds', () => {
  const model = createInductionCooktopModel({ id: 'induction-cooktop', accent: 0xe8aec4 });
  expect(model.root.getObjectByName('induction-cooktop-powered-cookware-pivot')?.visible).toBe(true);
  let bubbles = 0;
  let steamClouds = 0;
  model.root.traverse((object) => {
    if (/^induction-cooktop-soup-rolling-bubble-\d+$/.test(object.name)) bubbles += 1;
    if (/^induction-cooktop-steam-cloud-\d+-pivot$/.test(object.name)) steamClouds += 1;
    expect(object instanceof THREE.Sprite, `${object.name} must not be a Sprite`).toBe(false);
    expect(object instanceof THREE.Line, `${object.name} must not be a Line`).toBe(false);
    if (object instanceof THREE.Mesh) {
      expect(object.geometry instanceof THREE.PlaneGeometry, `${object.name} must not be a Plane`).toBe(false);
    }
  });
  expect(bubbles).toBe(INDUCTION_COOKTOP_TIMELINE.boilBubbleCount);
  expect(steamClouds).toBe(INDUCTION_COOKTOP_TIMELINE.steamCloudCount);
  expect(foodPivots(model.root)).toHaveLength(INDUCTION_COOKTOP_TIMELINE.foodPieceCount);
  expect(model.root.userData.externalPerformanceCue).toMatchObject({
    type: 'induction-cooktop-owned-volumetric-hotpot',
    boilBubbleCount: 14,
    steamCloudCount: 18,
    foodPieceCount: 13,
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
  });
});

test('timeline clearly progresses from simmer through eruption, pot jump and staggered food return', () => {
  const model = createInductionCooktopModel({ id: 'induction-cooktop', accent: 0xe8aec4 });
  const controller = createInductionCooktopPerformance(model.root);

  controller.start();
  controller.update(0.72, 1);
  expect(controller.diagnostics.phase).toBe('gentle-simmer');
  expect(controller.diagnostics.potLift).toBe(0);
  expect(controller.diagnostics.airborneFood).toBe(0);

  controller.update(2.82, 1);
  expect(controller.diagnostics.phase).toBe('rolling-boil');
  expect(controller.diagnostics.visibleBoilBubbles).toBeGreaterThanOrEqual(8);
  expect(controller.diagnostics.visibleSteamClouds).toBeGreaterThanOrEqual(12);
  expect(controller.diagnostics.soupRoll).toBeGreaterThan(0.01);
  const visibleSteamScales: number[] = [];
  model.root.traverse((object) => {
    if (/^induction-cooktop-steam-cloud-\d+-pivot$/.test(object.name) && object.visible) {
      visibleSteamScales.push(Math.max(object.scale.x, object.scale.y, object.scale.z));
    }
  });
  expect(Math.max(...visibleSteamScales)).toBeLessThan(1.25);

  controller.update(3.61, 1);
  expect(controller.diagnostics.phase).toBe('pot-jump');
  expect(controller.diagnostics.potLift).toBeGreaterThan(0.9);
  expect(controller.diagnostics.airborneFood).toBeGreaterThanOrEqual(10);
  expect(controller.diagnostics.highestFoodLift).toBeGreaterThan(1.8);
  expect(controller.diagnostics.foodHeightSpread).toBeGreaterThan(0.16);

  controller.update(4.18, 1);
  expect(controller.diagnostics.phase).toBe('food-return');
  expect(controller.diagnostics.potLanded).toBe(true);
  expect(controller.diagnostics.potLift).toBe(0);
  expect(controller.diagnostics.airborneFood).toBeGreaterThan(0);

  let peakReturnImpact = 0;
  for (let frame = 0; frame <= 100; frame += 1) {
    controller.update(4.18 + frame / 180, 1);
    peakReturnImpact = Math.max(peakReturnImpact, controller.diagnostics.returnImpact);
  }
  expect(peakReturnImpact).toBeGreaterThan(0.7);
  controller.update(5.2, 1);
  expect(controller.diagnostics.phase).toBe('complete');
  expect(controller.diagnostics.airborneFood).toBe(0);
  expect(controller.diagnostics.returnedFood).toBe(13);
});

test('food flies independently of the pot and start/update/stop restores the exact authored pose', () => {
  const model = createInductionCooktopModel({ id: 'induction-cooktop', accent: 0xe8aec4 });
  const controller = createInductionCooktopPerformance(model.root);
  const idle = snapshot(model.root);
  const cookware = model.root.getObjectByName('induction-cooktop-powered-cookware-pivot');
  const food = foodPivots(model.root);

  controller.start();
  controller.update(3.61, 1);
  model.root.updateWorldMatrix(true, true);
  const potWorldY = cookware?.getWorldPosition(new THREE.Vector3()).y ?? 0;
  const foodWorldHeights = food.map((object) => object.getWorldPosition(new THREE.Vector3()).y);
  expect(Math.max(...foodWorldHeights)).toBeGreaterThan(potWorldY + 1.15);
  expect(Math.max(...foodWorldHeights) - Math.min(...foodWorldHeights)).toBeGreaterThan(0.15);
  expect(controller.signal()).toBeGreaterThan(0);

  controller.stop();
  expect(snapshot(model.root)).toBe(idle);
  expect(cookware?.visible).toBe(true);
  expect(controller.signal()).toBe(0);
  expect(controller.diagnostics.phase).toBe('idle');
});
