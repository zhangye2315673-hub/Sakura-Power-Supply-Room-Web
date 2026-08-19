import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createRefrigeratorModel } from '../src/appliances/models/refrigerator';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import {
  AppliancePerformanceSystem,
  type AppliancePerformanceTarget,
} from '../src/systems/AppliancePerformanceSystem';
import { APPLIANCE_CATALOG } from '../src/systems/ApplianceCatalog';
import { ApplianceTarget } from '../src/systems/ApplianceScene';
import { PetalField } from '../src/systems/PetalField';

const V1_SIZE = new THREE.Vector3(2.885, 5.145, 2.6395);

const REQUIRED_PROPS = [
  ['milk-carton', 'milk', 'main-upper-shelf'],
  ['fish', 'fish', 'freezer-left-shelf'],
  ['steak', 'steak', 'freezer-right-shelf'],
  ['storage-box', 'food-container', 'main-middle-shelf'],
  ['fruit-basket', 'fruit', 'main-lower-shelf'],
  ['vegetables', 'vegetables', 'produce-drawer'],
  ['drink-bottle', 'drink', 'lower-door-bin'],
] as const;

function expectPosition(root: THREE.Object3D, name: string, expected: readonly [number, number, number]): void {
  const object = root.getObjectByName(name);
  expect(object, `${name} must exist`).toBeTruthy();
  expect(object!.position.x, `${name}.position.x`).toBeCloseTo(expected[0], 6);
  expect(object!.position.y, `${name}.position.y`).toBeCloseTo(expected[1], 6);
  expect(object!.position.z, `${name}.position.z`).toBeCloseTo(expected[2], 6);
}

function pose(root: THREE.Object3D): string {
  const values: Array<[string, number[], boolean]> = [];
  root.traverse((object) => {
    if (object.userData.isOutline) return;
    values.push([
      object === root ? 'root' : object.name || object.type,
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

function camera(): THREE.PerspectiveCamera {
  const result = new THREE.PerspectiveCamera(31, 16 / 9, 0.1, 80);
  result.position.set(4.5, 3.5, 9);
  result.lookAt(0, 2.5, 0);
  result.updateMatrixWorld(true);
  return result;
}

function target(root: THREE.Group, elapsed: { value: number }): AppliancePerformanceTarget {
  return {
    root,
    state: 'active',
    kind: 'refrigerator',
    facingSide: 1,
    getActiveElapsed: () => elapsed.value,
  };
}

test('refrigerator v2 preserves frozen pivots, semantic sockets, edge anchors and envelope', () => {
  const model = createRefrigeratorModel({ id: 'refrigerator', accent: 0xe8aec4 });
  const runtime = model.root.userData.sculptRuntime as {
    nodes: Record<string, THREE.Object3D>;
    sockets: Record<string, THREE.Object3D>;
    colliders: Array<{ id: string }>;
    destructionGroups: Array<{ id: string }>;
  };

  const pivots = {
    'refrigerator-upper-door-pivot': [1.38, 4.31, 1.02],
    'refrigerator-lower-door-pivot': [1.38, 2, 1.02],
    'refrigerator-upper-interior-content': [0, 0, 0],
    'refrigerator-lower-interior-content': [0, 0, 0],
    'refrigerator-food-performance-root': [0, 0, 0],
    'refrigerator-compressor-pivot': [0, 0, 0],
    'refrigerator-prop-milk-carton-pivot': [-0.72, 2.79, 0.08],
    'refrigerator-prop-fish-pivot': [-0.48, 4.35, 0.08],
    'refrigerator-prop-steak-pivot': [0.55, 4.35, 0.08],
    'refrigerator-prop-storage-box-pivot': [0.56, 1.92, 0.03],
    'refrigerator-prop-fruit-basket-pivot': [-0.5, 1.88, 0.05],
    'refrigerator-prop-vegetables-pivot': [0.05, 0.96, 0.05],
    'refrigerator-prop-drink-bottle-pivot': [0.02, 1.5, 0.6],
  } as const;
  Object.entries(pivots).forEach(([name, position]) => expectPosition(model.root, name, position));
  expect(model.root.getObjectByName('refrigerator-upper-door-pivot')?.parent?.name).toBe('appliance-model-refrigerator');
  expect(model.root.getObjectByName('refrigerator-lower-door-pivot')?.parent?.name).toBe('appliance-model-refrigerator');
  expect(model.root.getObjectByName('refrigerator-prop-drink-bottle-pivot')?.parent?.name).toBe('refrigerator-food-performance-root');

  const sockets = {
    'refrigerator-upper-door-socket': [0, 0, 0],
    'refrigerator-lower-door-socket': [0, 0, 0],
    'refrigerator-rear-service-socket': [0, 0, -0.055],
    'refrigerator-power-entry-socket': [0, 0, -0.04],
    'refrigerator-freezer-exit-socket': [0, 4.32, 1.42],
    'refrigerator-main-exit-socket': [0, 2.2, 1.42],
    'refrigerator-party-left-front-waypoint': [-1.92, 2.8, 1.42],
    'refrigerator-party-left-rear-waypoint': [-1.92, 2.8, -1.42],
    'refrigerator-party-right-front-waypoint': [1.92, 2.8, 1.42],
    'refrigerator-party-right-rear-waypoint': [1.92, 2.8, -1.42],
    'refrigerator-left-connection-socket': [-1.455, 2.5725, 1.485],
    'refrigerator-right-connection-socket': [1.5, 2.5725, 1.485],
    'refrigerator-top-connection-socket': [0.0225, 5.18, 1.485],
    'refrigerator-bottom-connection-socket': [0.0225, -0.035, 1.485],
  } as const;
  Object.entries(sockets).forEach(([name, position]) => {
    expect(runtime.sockets[name], `${name} must be published`).toBeTruthy();
    expectPosition(model.root, name, position);
  });

  const bounds = new THREE.Box3().setFromObject(model.root);
  const size = bounds.getSize(new THREE.Vector3());
  expect(Math.abs(size.x / V1_SIZE.x - 1)).toBeLessThanOrEqual(0.02);
  expect(Math.abs(size.y / V1_SIZE.y - 1)).toBeLessThanOrEqual(0.02);
  expect(Math.abs(size.z / V1_SIZE.z - 1)).toBeLessThanOrEqual(0.02);
  expect(bounds.min.y).toBeCloseTo(0, 6);
  expect(runtime.colliders.map(({ id }) => id)).toEqual([
    'refrigerator-left-wall',
    'refrigerator-right-wall',
    'refrigerator-rear-wall',
    'refrigerator-freezer-opening',
    'refrigerator-main-opening',
  ]);
  expect(runtime.destructionGroups).toEqual([]);
});

test('refrigerator v2 uses stable unequal outline tiers without heavy transparent or micro contours', () => {
  const model = createRefrigeratorModel({ id: 'refrigerator', accent: 0xe8aec4 });
  const tierCounts = { main: 0, structure: 0, detail: 0 };
  model.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object.userData.isOutline !== true) return;
    const tier = object.userData.outlineTier as keyof typeof tierCounts;
    expect(['main', 'structure', 'detail']).toContain(tier);
    tierCounts[tier] += 1;
    expect(object.material).toBeInstanceOf(THREE.ShaderMaterial);
    const material = object.material as THREE.ShaderMaterial;
    expect(material.uniforms.uVariation.value).toBeCloseTo(0.18, 6);
    expect(material.uniforms.uThickness.value).toBeCloseTo(
      tier === 'main' ? 0.0048 : tier === 'structure' ? 0.0041 : 0.0033,
      6,
    );
    const parentName = object.parent?.name ?? '';
    if (/interior|shelf|drawer-inset|prop-|rear-fastener|foot-/.test(parentName)) expect(tier).not.toBe('main');
  });
  expect(tierCounts.main).toBeGreaterThanOrEqual(6);
  expect(tierCounts.structure).toBeGreaterThanOrEqual(18);
  expect(tierCounts.detail).toBeGreaterThanOrEqual(4);
  expect(model.root.getObjectByName('refrigerator-prop-milk-carton-body-ink')).toBeUndefined();
  expect(model.root.getObjectByName('refrigerator-prop-drink-bottle-body-ink')).toBeUndefined();
  expect(model.root.userData.previewLightingProfile).toBe('sakura-appliance-v2');
});

test('refrigerator v2 resolves all four outward cable directions from frozen sockets', () => {
  const definition = APPLIANCE_CATALOG.find((candidate) => candidate.id === 'refrigerator');
  expect(definition).toBeTruthy();
  if (!definition) return;
  const placements = [
    { position: new THREE.Vector2(0.1, 0.5), edge: 'left', rotation: [0, -Math.PI * 0.5, 0] },
    { position: new THREE.Vector2(0.9, 0.5), edge: 'right', rotation: [0, Math.PI * 0.5, 0] },
    { position: new THREE.Vector2(0.5, 0.1), edge: 'top', rotation: [-Math.PI * 0.5, 0, 0] },
    { position: new THREE.Vector2(0.5, 0.9), edge: 'bottom', rotation: [Math.PI * 0.5, 0, 0] },
  ] as const;
  for (const placement of placements) {
    const appliance = new ApplianceTarget(definition, 0xe8aec4, [placement.position.x, placement.position.y]);
    appliance.setScreenPlacement(placement.position);
    appliance.root.updateMatrixWorld(true);
    expect(appliance.outwardEdge).toBe(placement.edge);
    const socket = appliance.root.getObjectByName(`refrigerator-${placement.edge}-connection-socket`);
    expect(socket).toBeTruthy();
    expect(appliance.getConnectionWorldPosition().distanceTo(socket!.getWorldPosition(new THREE.Vector3()))).toBeLessThan(1e-7);
    expect(appliance.connectionAnchor.rotation.x).toBeCloseTo(placement.rotation[0], 7);
    expect(appliance.connectionAnchor.rotation.y).toBeCloseTo(placement.rotation[1], 7);
    expect(appliance.connectionAnchor.rotation.z).toBeCloseTo(placement.rotation[2], 7);
    appliance.dispose();
  }
});

test('refrigerator v2 rebuilds deterministically with finite geometry and complete disposal', () => {
  const signatures: string[] = [];
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const model = createRefrigeratorModel({ id: 'refrigerator', accent: 0xe8aec4 });
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    let visibleTriangles = 0;
    model.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
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
      for (let parent = object.parent; parent && effectivelyVisible; parent = parent.parent) effectivelyVisible = parent.visible;
      if (effectivelyVisible) visibleTriangles += (object.geometry.index?.count ?? positions.count) / 3;
    });
    const bounds = new THREE.Box3().setFromObject(model.root);
    const runtime = model.root.userData.sculptRuntime as { nodes: Record<string, THREE.Object3D>; sockets: Record<string, THREE.Object3D> };
    signatures.push(JSON.stringify({
      bounds: [bounds.min.toArray(), bounds.max.toArray()],
      visibleTriangles,
      nodes: Object.keys(runtime.nodes).length,
      sockets: Object.keys(runtime.sockets).length,
      interactiveMeshes: model.interactiveMeshes.length,
      geometries: geometries.size,
      materials: materials.size,
    }));
    expect(visibleTriangles).toBeLessThan(84_366);
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

test('refrigerator has a true cavity hierarchy and seven volumetric semantic props', () => {
  const model = createRefrigeratorModel({ id: 'refrigerator', accent: 0xe8aec4 });
  expect(model.root.getObjectByName('refrigerator-cabinet-shell')).toBeFalsy();
  expect(model.root.getObjectByName('refrigerator-freezer-cavity-back-panel')).toBeTruthy();
  expect(model.root.getObjectByName('refrigerator-main-cavity-back-panel')).toBeTruthy();
  expect(model.root.getObjectByName('refrigerator-produce-drawer')).toBeTruthy();
  for (let index = 1; index <= 3; index += 1) {
    const shelf = model.root.getObjectByName(`refrigerator-interior-shelf-${index}`) as THREE.Mesh | undefined;
    expect(shelf).toBeTruthy();
    shelf?.geometry.computeBoundingBox();
    expect(shelf?.geometry.boundingBox?.getSize(new THREE.Vector3()).z ?? 0).toBeGreaterThan(1.2);
  }
  for (const [id, category, homeZone] of REQUIRED_PROPS) {
    const prop = model.root.getObjectByName(`refrigerator-prop-${id}-pivot`);
    expect(prop, `${id} pivot`).toBeTruthy();
    expect(prop?.userData.refrigeratorProp).toMatchObject({ id, category, homeZone });
    expect(model.root.getObjectByName(`refrigerator-home-${id}-socket`), `${id} home socket`).toBeTruthy();
  }
  for (const name of [
    'refrigerator-upper-door-bin-1-base',
    'refrigerator-lower-door-bin-1-base',
    'refrigerator-lower-door-bin-2-base',
    'refrigerator-lower-door-bin-3-base',
  ]) expect(model.root.getObjectByName(name)).toBeTruthy();

  const forbidden: string[] = [];
  model.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (/refrigerator-(?:prop|interior|freezer-cavity|main-cavity)/.test(object.name)
      && object.geometry instanceof THREE.PlaneGeometry) forbidden.push(object.name);
  });
  expect(forbidden).toEqual([]);
  expect(model.root.getObjectByName('refrigerator-freezer-food-box-a')).toBeFalsy();
  expect(model.root.getObjectByName('refrigerator-bottle-1')).toBeFalsy();
  expect(model.root.getObjectByName('refrigerator-produce-piece-1')).toBeFalsy();
  expect(model.root.getObjectByName('refrigerator-cold-mist-socket')).toBeFalsy();
  expect(model.root.userData.sculptRuntime.colliders).toHaveLength(5);
  expect(model.root.userData.refrigeratorRouteContract.sideClearance).toBeGreaterThanOrEqual(0.48);
});

test('refrigerator keeps food inside while opening, holding cold, and closing', () => {
  const model = createRefrigeratorModel({ id: 'refrigerator', accent: 0xe8aec4 });
  const animation = createApplianceMechanicalAnimation('refrigerator', model.root);
  const baseline = pose(model.root);

  animation.update(0.76, 1);
  expect(model.root.userData.refrigeratorPerformanceDiagnostics.phase).toBe('open');
  expect(model.root.userData.refrigeratorPerformanceDiagnostics.doorOpen).toBeGreaterThan(0.98);
  expect(model.root.userData.refrigeratorPerformanceDiagnostics.upperDoorAngle).toBeGreaterThan(2.5);
  expect(model.root.userData.refrigeratorPerformanceDiagnostics.lowerDoorAngle).toBeGreaterThan(2.35);
  expect(model.root.getObjectByName('refrigerator-upper-interior-content')?.visible).toBe(true);
  expect(model.root.getObjectByName('refrigerator-food-performance-root')?.visible).toBe(true);

  animation.update(0.94, 1);
  const opened = model.root.userData.refrigeratorPerformanceDiagnostics;
  expect(opened.launchedProps).toBe(0);
  expect(opened.props.every((prop: { phase: string; distanceFromHome: number }) => (
    prop.phase === 'home' && prop.distanceFromHome < 1e-7
  ))).toBe(true);

  animation.update(2.32, 1);
  const orbit = model.root.userData.refrigeratorPerformanceDiagnostics;
  expect(orbit.pathClearancePass).toBe(true);
  orbit.props.forEach((prop: { routeWaypoints: number[][]; minimumSideClearance: number }) => {
    expect(prop.minimumSideClearance).toBeGreaterThanOrEqual(0.48);
    const crossing = prop.routeWaypoints.slice(1, 6);
    expect(crossing.every((point) => Math.abs(point[0]) >= 1.9 || point[2] >= 2.55)).toBe(true);
    expect(prop.routeWaypoints.every((point) => point[2] >= 2.55 || Math.abs(point[0]) >= 1.9)).toBe(true);
  });

  animation.update(3.4, 1);
  const hold = model.root.userData.refrigeratorPerformanceDiagnostics;
  expect(hold.phase).toBe('hold');
  expect(hold.gatheredProps).toBe(0);
  expect(hold.visibleProps).toBe(REQUIRED_PROPS.length);
  expect(hold.props.every((prop: { phase: string; distanceFromHome: number }) => (
    prop.phase === 'home' && prop.distanceFromHome < 1e-7
  ))).toBe(true);

  animation.update(4.62, 1);
  const held = model.root.userData.refrigeratorPerformanceDiagnostics;
  expect(held.returnedProps).toBe(0);
  expect(held.props.every((prop: { distanceFromHome: number }) => prop.distanceFromHome < 1e-7)).toBe(true);
  expect(held.doorOpen).toBeGreaterThan(0.98);

  animation.update(5.17, 0.05);
  const closed = model.root.userData.refrigeratorPerformanceDiagnostics;
  expect(closed.phase).toBe('close');
  expect(closed.doorOpen).toBeLessThan(0.001);
  expect(model.root.getObjectByName('refrigerator-food-performance-root')?.visible).toBe(false);

  animation.stop();
  expect(pose(model.root)).toBe(baseline);
  expect(model.root.userData.refrigeratorPerformanceDiagnostics).toBeUndefined();
});

test('refrigerator uses one shared timeline with no flying food or generic frost particles', () => {
  const gameModel = createRefrigeratorModel({ id: 'refrigerator', accent: 0xe8aec4 });
  const galleryModel = createRefrigeratorModel({ id: 'refrigerator', accent: 0xe8aec4 });
  const gameSystem = new AppliancePerformanceSystem();
  const gallerySystem = new AppliancePerformanceSystem();
  const gamePetals = new PetalField(1);
  const galleryPetals = new PetalField(1);
  const gameElapsed = { value: 3.4 };
  const galleryElapsed = { value: 3.4 };
  const gameTarget = target(gameModel.root, gameElapsed);
  const galleryTarget = target(galleryModel.root, galleryElapsed);
  const view = camera();

  gameSystem.update(1 / 60, 3.4, view, [gameTarget], gamePetals);
  gallerySystem.update(1 / 60, 3.4, view, [galleryTarget], galleryPetals);
  const gameSummary = gameSystem.getStateSummary();
  const gallerySummary = gallerySystem.getStateSummary();
  expect(gameSummary.sessions).toBe(1);
  expect(gameSummary.timelineOwners).toBe(1);
  expect(gameSummary.elapsedByKind.refrigerator).toBeCloseTo(3.4, 7);
  expect(gameSummary.refrigerator?.gatheredProps).toBe(0);
  expect(gameSummary.refrigerator?.launchedProps).toBe(0);
  expect(gameSummary.refrigerator?.forbiddenLegacyEffects).toContain('flying-food');
  expect(gameSummary.activeByKind.food).toBeUndefined();
  expect(gameSummary.activeByKind.debris).toBe(0);
  expect(gameSummary.refrigerator).toEqual(gallerySummary.refrigerator);
  expect(pose(gameModel.root)).toBe(pose(galleryModel.root));

  gameSystem.dispose();
  gallerySystem.dispose();
  gamePetals.dispose();
  galleryPetals.dispose();
});
