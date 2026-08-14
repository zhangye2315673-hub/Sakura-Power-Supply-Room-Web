import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createGameControllerModel } from '../src/appliances/models/gameController';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import { APPLIANCE_CATALOG } from '../src/systems/ApplianceCatalog';
import { ApplianceTarget } from '../src/systems/ApplianceScene';

const V1_SIZE = new THREE.Vector3(6.190031601851114, 4.840483148097992, 2.073896792358216);

function expectPosition(root: THREE.Object3D, name: string, expected: readonly [number, number, number]): void {
  const object = root.getObjectByName(name);
  expect(object, `${name} must exist`).toBeTruthy();
  expect(object!.position.x, `${name}.position.x`).toBeCloseTo(expected[0], 6);
  expect(object!.position.y, `${name}.position.y`).toBeCloseTo(expected[1], 6);
  expect(object!.position.z, `${name}.position.z`).toBeCloseTo(expected[2], 6);
}

function rigSnapshot(root: THREE.Object3D): string {
  const runtime = root.userData.sculptRuntime as { nodes: Record<string, THREE.Object3D> };
  return JSON.stringify(Object.fromEntries(Object.keys(runtime.nodes).sort().map((name) => {
    const object = runtime.nodes[name];
    const materialState = object instanceof THREE.Mesh
      ? (Array.isArray(object.material) ? object.material : [object.material]).map((material) => {
          const toon = material as THREE.MeshToonMaterial;
          return {
            opacity: material.opacity,
            transparent: material.transparent,
            color: 'color' in material ? (material as THREE.MeshToonMaterial).color.getHex() : null,
            emissive: toon.emissive?.getHex() ?? null,
            emissiveIntensity: toon.emissiveIntensity ?? null,
          };
        })
      : [];
    return [name, {
      position: object.position.toArray(),
      quaternion: object.quaternion.toArray(),
      scale: object.scale.toArray(),
      visible: object.visible,
      materialState,
    }];
  })));
}

test('game controller v2 preserves frozen pivots, sockets, edge anchors and envelope', () => {
  const model = createGameControllerModel({ id: 'game-controller', accent: 0xe8a7b7 });
  const runtime = model.root.userData.sculptRuntime as {
    nodes: Record<string, THREE.Object3D>;
    sockets: Record<string, THREE.Object3D>;
    colliders: Array<{ id: string }>;
    destructionGroups: Array<{ id: string }>;
  };

  const pivots = {
    'game-controller-motion-pivot': [0, 1.67, 0],
    'game-controller-dpad-pivot': [-1.23, 0.55, 0.51],
    'game-controller-face-button-1-pivot': [1.28, 0.82, 0.56],
    'game-controller-face-button-2-pivot': [1.63, 0.49, 0.56],
    'game-controller-face-button-3-pivot': [1.31, 0.15, 0.56],
    'game-controller-face-button-4-pivot': [0.96, 0.48, 0.56],
    'game-controller-stick-1-pivot': [-0.58, -0.38, 0.59],
    'game-controller-stick-2-pivot': [0.58, -0.38, 0.59],
    'game-controller-home-button-pivot': [0, 0.92, 0.56],
    'game-controller-select-button-pivot': [0, 0.46, 0.56],
    'game-controller-left-bumper-pivot': [-1.53, 1.86, -0.35],
    'game-controller-right-bumper-pivot': [1.53, 1.86, -0.35],
    'game-controller-left-trigger-pivot': [-1.56, 1.73, -0.68],
    'game-controller-right-trigger-pivot': [1.56, 1.73, -0.68],
    'game-controller-ultimate-effects-pivot': [0, 0, 0],
    'game-controller-rear-service-pivot': [0, 0, 0],
  } as const;
  Object.entries(pivots).forEach(([name, position]) => expectPosition(model.root, name, position));

  const sockets = {
    'game-controller-centre-socket': [0, 0.15, 0],
    'game-controller-dpad-socket': [-1.23, 0.55, 0.51],
    'game-controller-stick-1-axis-socket': [-0.58, -0.38, 0.59],
    'game-controller-stick-2-axis-socket': [0.58, -0.38, 0.59],
    'game-controller-left-bumper-hinge-socket': [-1.53, 1.86, -0.35],
    'game-controller-right-bumper-hinge-socket': [1.53, 1.86, -0.35],
    'game-controller-left-trigger-hinge-socket': [-1.56, 1.73, -0.68],
    'game-controller-right-trigger-hinge-socket': [1.56, 1.73, -0.68],
    'game-controller-power-connection-socket-inferred': [0, 1.35, -0.87],
    'game-controller-left-connection-socket': [-3.13244048, 1.78511376, 1.14],
    'game-controller-right-connection-socket': [3.12759112, 1.78511376, 1.14],
    'game-controller-top-connection-socket': [-0.00242468, 4.24035533, 1.14],
    'game-controller-bottom-connection-socket': [-0.00242468, -0.67012782, 1.14],
  } as const;
  Object.entries(sockets).forEach(([name, position]) => {
    expect(runtime.sockets[name], `${name} must be published`).toBeTruthy();
    expectPosition(model.root, name, position);
  });
  for (let index = 1; index <= 4; index += 1) {
    expectPosition(model.root, `game-controller-face-button-${index}-burst-socket`, [0, 0, 0.16]);
  }

  const bounds = new THREE.Box3().setFromObject(model.root);
  const size = bounds.getSize(new THREE.Vector3());
  expect(Math.abs(size.x / V1_SIZE.x - 1)).toBeLessThanOrEqual(0.02);
  expect(Math.abs(size.y / V1_SIZE.y - 1)).toBeLessThanOrEqual(0.02);
  expect(Math.abs(size.z / V1_SIZE.z - 1)).toBeLessThanOrEqual(0.02);
  expect(bounds.min.y).toBeCloseTo(-0.6351278174, 6);

  expect(Object.keys(runtime.nodes).filter((name) => name.startsWith('game-controller-ultimate-star-'))).toHaveLength(5);
  expect(Object.keys(runtime.nodes).filter((name) => name.startsWith('game-controller-ultimate-electric-bolt-'))).toHaveLength(4);
  expect(Object.keys(runtime.nodes).filter((name) => name.startsWith('game-controller-ultimate-impact-shard-'))).toHaveLength(8);
  expect(Object.keys(runtime.nodes).filter((name) => name.startsWith('game-controller-ultimate-energy-point-'))).toHaveLength(6);
  expect(runtime.colliders.map(({ id }) => id)).toEqual(['controller-central-shell', 'controller-left-grip', 'controller-right-grip']);
  expect(runtime.destructionGroups.map(({ id }) => id)).toEqual([
    'controller-shells', 'controller-front-controls', 'controller-shoulders', 'controller-ultimate-effects', 'controller-rear-service',
  ]);
});

test('game controller v2 uses stable unequal outline tiers without outlining micro effects', () => {
  const model = createGameControllerModel({ id: 'game-controller', accent: 0xe8a7b7 });
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
  });
  expect(tierCounts.main).toBeGreaterThanOrEqual(6);
  expect(tierCounts.structure).toBeGreaterThanOrEqual(16);
  expect(tierCounts.detail).toBeGreaterThanOrEqual(2);

  model.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (!object.userData.performanceEffect && !/rose-status-lens|rear-screw-/.test(object.name)) return;
    const outlines: THREE.Object3D[] = [];
    object.traverse((child) => {
      if (child.userData.isOutline === true) outlines.push(child);
    });
    expect(outlines, `${object.name} must not receive a hull outline`).toEqual([]);
  });
  expect(model.root.userData.previewLightingProfile).toBe('sakura-appliance-v2');
});

test('game controller v2 resolves every outward cable direction from its frozen socket', () => {
  const definition = APPLIANCE_CATALOG.find((candidate) => candidate.id === 'game-controller');
  expect(definition).toBeTruthy();
  if (!definition) return;
  const placements = [
    { position: new THREE.Vector2(0.1, 0.5), edge: 'left', rotation: [0, -Math.PI * 0.5, 0] },
    { position: new THREE.Vector2(0.9, 0.5), edge: 'right', rotation: [0, Math.PI * 0.5, 0] },
    { position: new THREE.Vector2(0.5, 0.1), edge: 'top', rotation: [-Math.PI * 0.5, 0, 0] },
    { position: new THREE.Vector2(0.5, 0.9), edge: 'bottom', rotation: [Math.PI * 0.5, 0, 0] },
  ] as const;
  for (const placement of placements) {
    const target = new ApplianceTarget(definition, 0xe8a7b7, [placement.position.x, placement.position.y]);
    target.setScreenPlacement(placement.position);
    target.root.updateMatrixWorld(true);
    expect(target.outwardEdge).toBe(placement.edge);
    const socket = target.root.getObjectByName(`game-controller-${placement.edge}-connection-socket`);
    expect(socket).toBeTruthy();
    const expected = socket!.getWorldPosition(new THREE.Vector3());
    expect(target.getConnectionWorldPosition().distanceTo(expected)).toBeLessThan(1e-7);
    expect(target.connectionAnchor.rotation.x).toBeCloseTo(placement.rotation[0], 7);
    expect(target.connectionAnchor.rotation.y).toBeCloseTo(placement.rotation[1], 7);
    expect(target.connectionAnchor.rotation.z).toBeCloseTo(placement.rotation[2], 7);
    target.dispose();
  }
});

test('game controller v2 rebuilds deterministically with finite low-poly geometry and complete disposal', () => {
  const signatures: string[] = [];
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const model = createGameControllerModel({ id: 'game-controller', accent: 0xe8a7b7 });
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
    expect(visibleTriangles).toBeLessThan(78_840);
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

test('game controller v2 retains the complete model-owned performance sequence and exact reset', () => {
  const model = createGameControllerModel({ id: 'game-controller', accent: 0xe8a7b7 });
  const animation = createApplianceMechanicalAnimation('game-controller', model.root);
  animation.stop();
  const baseline = rigSnapshot(model.root);

  animation.update(0.6, 1);
  expect(model.root.userData.gameControllerPerformanceDiagnostics.phase).toBe('heartbeat-start');
  animation.update(1.6, 1);
  expect(model.root.userData.gameControllerPerformanceDiagnostics.phase).toBe('frenzy-input');
  animation.update(3.2, 1);
  const climax = model.root.userData.gameControllerPerformanceDiagnostics;
  expect(climax.phase).toBe('ultimate-burst');
  expect(climax.visibleStars).toBeGreaterThanOrEqual(3);
  expect(climax.visibleElectricBolts).toBeGreaterThanOrEqual(2);
  expect(climax.visibleImpactBodies).toBe(8);
  expect(climax.visibleEnergyPoints).toBe(6);
  expect(climax.timelineOwner).toBe('AppliancePerformanceSystem');
  expect(climax.effectOwner).toBe('game-controller-model-rig');
  animation.update(4.75, 1);
  expect(model.root.userData.gameControllerPerformanceDiagnostics.phase).toBe('ready-finale');
  animation.update(5.15, 1);
  expect(model.root.userData.gameControllerPerformanceDiagnostics.phase).toBe('settled');

  animation.stop();
  expect(rigSnapshot(model.root)).toBe(baseline);
});
