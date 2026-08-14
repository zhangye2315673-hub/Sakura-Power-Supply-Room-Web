import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createBlenderModel } from '../src/appliances/models/blender';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import {
  AppliancePerformanceSystem,
  type AppliancePerformanceTarget,
} from '../src/systems/AppliancePerformanceSystem';
import { PetalField } from '../src/systems/PetalField';

const RESET_NODES = [
  'blender-motor-base-pivot',
  'blender-removable-jar-pivot',
  'blender-removable-lid-pivot',
  'blender-whole-fruit-pivot',
  'blender-cut-fruit-chunk-pivot',
  'blender-powered-liquid-vortex-pivot',
  'blender-powered-rising-smoothie-volume',
  'blender-powered-smoothie-concave-surface',
] as const;

function snapshot(root: THREE.Object3D): string {
  return JSON.stringify(Object.fromEntries(RESET_NODES.map((name) => {
    const object = root.getObjectByName(name);
    return [name, object ? {
      position: object.position.toArray(),
      quaternion: object.quaternion.toArray(),
      scale: object.scale.toArray(),
      visible: object.visible,
    } : null];
  })));
}

function expectPosition(root: THREE.Object3D, name: string, expected: readonly [number, number, number]): void {
  const object = root.getObjectByName(name);
  expect(object, `${name} must exist`).toBeTruthy();
  expect(object!.position.x, `${name}.position.x`).toBeCloseTo(expected[0], 6);
  expect(object!.position.y, `${name}.position.y`).toBeCloseTo(expected[1], 6);
  expect(object!.position.z, `${name}.position.z`).toBeCloseTo(expected[2], 6);
}

test('blender v2 preserves the frozen rig, socket, edge-anchor and envelope contract', () => {
  const model = createBlenderModel({ id: 'blender', accent: 0xe8a7b7 });
  const runtime = model.root.userData.sculptRuntime as {
    nodes: Record<string, THREE.Object3D>;
    sockets: Record<string, THREE.Object3D>;
  };

  const frozenPivots = {
    'blender-motor-base-pivot': [0, 0, 0],
    'blender-jar-seat-pivot': [0, 1.74, 0],
    'blender-removable-jar-pivot': [0, 1.81, 0],
    'blender-four-blade-rotation-pivot': [0, 0.19, 0],
    'blender-powered-liquid-vortex-pivot': [0, 0.23, 0],
    'blender-jar-handle-attachment-pivot': [0, 0, 0],
    'blender-removable-lid-pivot': [0, 2.58, 0],
    'blender-front-speed-dial-pivot': [0, 0.77, 1.52],
    'blender-rear-service-pivot': [0, 0, 0],
  } as const;
  Object.entries(frozenPivots).forEach(([name, position]) => expectPosition(model.root, name, position));

  const frozenSockets = {
    'blender-jar-lock-socket': [0, 0.05, 0],
    'blender-handle-upper-socket': [1.05, 2.19, 0],
    'blender-handle-lower-socket': [1.12, 0.18, 0],
    'blender-lid-seat-socket': [0, 2.56, 0],
    'blender-blade-bearing-socket': [0, 0.16, 0],
    'blender-blade-axis-socket': [0, 0, 0],
    'blender-liquid-effect-socket': [0, 0, 0],
    'blender-splash-mouth-socket': [-0.98, 2.52, 0.02],
    'blender-splash-right-gap-socket': [0.98, 2.52, 0.02],
    'blender-speed-control-socket': [0, 0, 0],
    'blender-power-cable-socket': [0, 0.42, -1.16],
    'blender-left-connection-socket': [-1.64728263, 2.42, 1.6975],
    'blender-right-connection-socket': [2.15408197, 2.42, 1.6975],
    'blender-top-connection-socket': [0.25339967, 4.835, 1.6975],
    'blender-bottom-connection-socket': [0.25339967, 0.005, 1.6975],
  } as const;
  Object.entries(frozenSockets).forEach(([name, position]) => {
    expect(runtime.sockets[name], `${name} must be published`).toBeTruthy();
    expectPosition(model.root, name, position);
  });

  const bounds = new THREE.Box3().setFromObject(model.root);
  expect(bounds.min.x).toBeCloseTo(-1.61228263, 4);
  expect(bounds.min.y).toBeCloseTo(0.04, 4);
  expect(bounds.min.z).toBeCloseTo(-1.51306522, 4);
  expect(bounds.max.x).toBeCloseTo(2.11908197, 4);
  expect(bounds.max.y).toBeCloseTo(4.8, 4);
  expect(bounds.max.z).toBeCloseTo(1.6625, 4);

  expect(Object.keys(runtime.nodes).filter((name) => name.startsWith('blender-canted-metal-blade-'))).toHaveLength(4);
  expect(Object.keys(runtime.nodes).filter((name) => name.startsWith('blender-molded-jar-rib-'))).toHaveLength(8);
  expect(Object.keys(runtime.nodes).filter((name) => name.startsWith('blender-rear-horizontal-vent-slot-'))).toHaveLength(5);
  expect(Object.keys(runtime.nodes).filter((name) => name.startsWith('blender-rubber-foot-'))).toHaveLength(4);
});

test('blender v2 uses stable unequal appliance outlines without blackening transparent systems', () => {
  const model = createBlenderModel({ id: 'blender', accent: 0xe8a7b7 });
  const tierCounts = { main: 0, structure: 0, detail: 0 };
  model.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object.userData.isOutline !== true) return;
    const tier = object.userData.outlineTier as keyof typeof tierCounts;
    expect(['main', 'structure', 'detail']).toContain(tier);
    tierCounts[tier] += 1;
    expect(object.material).toBeInstanceOf(THREE.ShaderMaterial);
    const material = object.material as THREE.ShaderMaterial;
    expect(material.uniforms.uVariation.value).toBeCloseTo(0.18, 6);
    const expectedThickness = tier === 'main' ? 0.0048 : tier === 'structure' ? 0.0041 : 0.0033;
    expect(material.uniforms.uThickness.value).toBeCloseTo(expectedThickness, 6);
  });
  expect(tierCounts.main).toBeGreaterThanOrEqual(4);
  expect(tierCounts.structure).toBeGreaterThanOrEqual(8);
  expect(tierCounts.detail).toBeGreaterThanOrEqual(2);

  const transparentNames = [
    'blender-transparent-tapered-jar-shell',
    'blender-powered-rising-smoothie-volume',
    'blender-powered-smoothie-concave-surface',
    'blender-powered-smoothie-vortex-highlight',
  ];
  transparentNames.forEach((name) => {
    const object = model.root.getObjectByName(name);
    expect(object, `${name} must exist`).toBeTruthy();
    const outlines: THREE.Object3D[] = [];
    object!.traverse((child) => {
      if (child.userData.isOutline === true) outlines.push(child);
    });
    expect(outlines, `${name} must not receive a hull outline`).toEqual([]);
  });
  expect(model.root.userData.previewLightingProfile).toBe('sakura-appliance-v2');
});

test('blender v2 rebuilds deterministically with finite geometry and complete disposal', () => {
  const signatures: string[] = [];
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const model = createBlenderModel({ id: 'blender', accent: 0xe8a7b7 });
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    let visibleTriangles = 0;
    model.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
      meshMaterials.forEach((material) => materials.add(material));
      const positions = object.geometry.getAttribute('position');
      let finitePositions = true;
      for (let index = 0; index < positions.count; index += 1) {
        if (
          !Number.isFinite(positions.getX(index))
          || !Number.isFinite(positions.getY(index))
          || !Number.isFinite(positions.getZ(index))
        ) {
          finitePositions = false;
          break;
        }
      }
      expect(finitePositions, `${object.name} contains non-finite positions`).toBe(true);
      let effectivelyVisible = object.visible;
      for (let parent = object.parent; parent && effectivelyVisible; parent = parent.parent) {
        effectivelyVisible = parent.visible;
      }
      if (effectivelyVisible) {
        visibleTriangles += ((object.geometry.index?.count ?? positions.count) / 3)
          * (object instanceof THREE.InstancedMesh ? object.count : 1);
      }
    });
    const bounds = new THREE.Box3().setFromObject(model.root);
    const runtime = model.root.userData.sculptRuntime as {
      nodes: Record<string, THREE.Object3D>;
      sockets: Record<string, THREE.Object3D>;
    };
    signatures.push(JSON.stringify({
      bounds: [bounds.min.toArray(), bounds.max.toArray()],
      visibleTriangles,
      nodes: Object.keys(runtime.nodes).length,
      sockets: Object.keys(runtime.sockets).length,
      interactiveMeshes: model.interactiveMeshes.length,
      geometries: geometries.size,
      materials: materials.size,
    }));
    expect(visibleTriangles).toBeLessThan(29_082 * 1.35);
    expect(materials).toEqual(model.materials);

    let disposedGeometries = 0;
    let disposedMaterials = 0;
    geometries.forEach((geometry) => geometry.addEventListener('dispose', () => { disposedGeometries += 1; }));
    materials.forEach((material) => material.addEventListener('dispose', () => { disposedMaterials += 1; }));
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    expect(disposedGeometries).toBe(geometries.size);
    expect(disposedMaterials).toBe(materials.size);
  }
  expect(new Set(signatures).size).toBe(1);
});

test('blender uses recognizable volumetric fruit, progressive juice and a two-bounce inertial rig', () => {
  const model = createBlenderModel({ id: 'blender', accent: 0xe8a7b7 });
  const animation = createApplianceMechanicalAnimation('blender', model.root);
  const baseline = snapshot(model.root);

  const fruitPivots = ['strawberry', 'apple', 'orange', 'banana'].map((fruit) => (
    model.root.getObjectByName(`blender-fruit-${fruit}-pivot`)
  ));
  expect(fruitPivots.every(Boolean)).toBe(true);
  expect(model.root.getObjectByName('blender-fruit-blueberry-cluster-pivot')).toBeTruthy();
  fruitPivots.forEach((fruit) => {
    expect(Math.hypot(fruit!.position.x, fruit!.position.z)).toBeLessThan(0.7);
    expect(fruit!.position.y).toBeGreaterThan(0.55);
    expect(fruit!.position.y).toBeLessThan(1.7);
    expect(fruit!.scale.x).toBeGreaterThanOrEqual(1.28);
  });
  const fruitPile = model.root.getObjectByName('blender-whole-fruit-pivot')!;
  const jarPivot = model.root.getObjectByName('blender-removable-jar-pivot')!;
  model.root.updateMatrixWorld(true);
  const pileBounds = new THREE.Box3().setFromObject(fruitPile, true)
    .applyMatrix4(jarPivot.matrixWorld.clone().invert());
  const pileSize = pileBounds.getSize(new THREE.Vector3());
  expect(pileSize.x, 'enlarged fruit should read as a compact pile').toBeGreaterThan(1.3);
  expect(Math.max(Math.abs(pileBounds.min.x), Math.abs(pileBounds.max.x))).toBeLessThan(0.78);
  expect(Math.max(Math.abs(pileBounds.min.z), Math.abs(pileBounds.max.z))).toBeLessThan(0.78);
  expect(pileBounds.min.y).toBeGreaterThan(0.35);
  expect(pileBounds.max.y).toBeLessThan(2.34);

  const forbidden: string[] = [];
  model.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (!/fruit|smoothie|splash/i.test(object.name)) return;
    if (object.geometry instanceof THREE.PlaneGeometry) forbidden.push(object.name);
  });
  expect(forbidden).toEqual([]);

  animation.update(1.15, 1);
  const chop = model.root.userData.blenderPerformanceDiagnostics;
  expect(chop.phase).toBe('chop');
  expect(chop.wholeFruitScale).toBeGreaterThan(0.35);
  expect(chop.chunkScale).toBeGreaterThan(0.05);
  expect(model.root.getObjectByName('blender-cut-fruit-chunk-pivot')?.visible).toBe(true);

  animation.update(2.45, 1);
  const blend = model.root.userData.blenderPerformanceDiagnostics;
  expect(blend.juiceFill).toBeGreaterThan(0.55);
  expect(blend.wholeFruitScale).toBeLessThan(0.2);
  expect(Math.abs(blend.jarSway)).toBeGreaterThan(Math.abs(blend.baseSway));
  expect(model.root.getObjectByName('blender-powered-rising-smoothie-volume')?.visible).toBe(true);

  animation.update(3.4, 1);
  const firstBounce = model.root.userData.blenderPerformanceDiagnostics;
  expect(firstBounce.lidBounceCount).toBe(1);
  expect(firstBounce.lidLift).toBeGreaterThan(0.35);
  animation.update(3.76, 1);
  const secondBounce = model.root.userData.blenderPerformanceDiagnostics;
  expect(secondBounce.lidBounceCount).toBe(2);
  expect(secondBounce.lidLift).toBeGreaterThan(0.2);
  animation.update(4.24, 1);
  expect(model.root.userData.blenderPerformanceDiagnostics.lidLift).toBeLessThan(0.015);

  animation.stop();
  expect(snapshot(model.root)).toBe(baseline);
});

test('blender climax emits only model-like Sakura smoothie volumes from the cup mouth', () => {
  const model = createBlenderModel({ id: 'blender', accent: 0xe8a7b7 });
  const target: AppliancePerformanceTarget = {
    root: model.root,
    state: 'active',
    kind: 'blender',
    facingSide: 1,
    getActiveElapsed: () => 3.45,
  };
  const performances = new AppliancePerformanceSystem();
  const petals = new PetalField(1);
  const camera = new THREE.PerspectiveCamera(31, 16 / 9, 0.1, 80);
  camera.position.set(0, 3.2, 10);
  camera.lookAt(0, 2.1, 0);
  camera.updateMatrixWorld(true);

  performances.update(1 / 60, 3.45, camera, [target], petals);
  const summary = performances.getStateSummary();
  expect(summary.timelineOwners).toBe(1);
  expect(summary.elapsedByKind.blender).toBeCloseTo(3.45, 7);
  expect(summary.blender.mechanics?.juiceFill).toBeGreaterThan(0.9);
  expect(summary.blender.mechanics?.lidLift).toBeGreaterThan(0.25);
  expect(summary.blender.splash?.sourceSocket).toBe('blender-splash-mouth-socket');
  expect(summary.blender.splash?.activeDroplets).toBeGreaterThanOrEqual(6);
  expect(summary.blender.splash?.activeSplashes).toBeGreaterThanOrEqual(3);
  expect(summary.blender.splash?.geometryVariants.length).toBeGreaterThanOrEqual(3);
  expect(summary.activeByKind.drop).toBe(0);
  expect(summary.activeByKind.sheet).toBe(0);

  const activeVolumes: THREE.Mesh[] = [];
  performances.root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.visible && /^spectacle-blender-(drop|splash)-/.test(object.name)) {
      activeVolumes.push(object);
    }
  });
  expect(activeVolumes.length).toBeGreaterThanOrEqual(9);
  activeVolumes.forEach((volume) => {
    expect(volume.geometry).not.toBeInstanceOf(THREE.PlaneGeometry);
    expect(volume.material).toBeInstanceOf(THREE.MeshPhysicalMaterial);
    expect(volume.userData.forbiddenPrimitives).toEqual(['PlaneGeometry', 'Line', 'Sprite']);
    expect(['blender-splash-mouth-socket', 'blender-splash-right-gap-socket'])
      .toContain(volume.userData.blenderSplash.sourceSocket);
  });

  target.state = 'idle';
  performances.update(1 / 60, 3.46, camera, [target], petals);
  expect(performances.getStateSummary().timelineOwners).toBe(0);
  expect(activeVolumes.every((volume) => !volume.visible)).toBe(true);
  performances.dispose();
  petals.dispose();
});
