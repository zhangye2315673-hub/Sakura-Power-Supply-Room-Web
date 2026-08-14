import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createDesktopComputerModel } from '../src/appliances/models/desktopComputer';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import {
  AppliancePerformanceSystem,
  type AppliancePerformanceTarget,
} from '../src/systems/AppliancePerformanceSystem';
import { PetalField } from '../src/systems/PetalField';

const POSE_NODES = [
  'desktop-computer-monitor-assembly-pivot',
  'desktop-computer-screen-tilt-pivot',
  'desktop-computer-tower-assembly-pivot',
  'desktop-computer-mouse-assembly-pivot',
  'desktop-computer-screen-state-pivot',
  'desktop-computer-classic-blue-screen-pivot',
] as const;

function snapshot(root: THREE.Object3D): string {
  return JSON.stringify(Object.fromEntries(POSE_NODES.map((name) => {
    const object = root.getObjectByName(name);
    return [name, object ? {
      position: object.position.toArray(),
      quaternion: object.quaternion.toArray(),
      scale: object.scale.toArray(),
      visible: object.visible,
    } : null];
  })));
}

function smokePuffs(root: THREE.Object3D): THREE.Mesh[] {
  const result: THREE.Mesh[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.name.startsWith('desktop-computer-volumetric-smoke-puff-')) {
      result.push(object);
    }
  });
  return result;
}

function target(root: THREE.Group, elapsed: { value: number }): AppliancePerformanceTarget {
  return {
    root,
    state: 'active',
    kind: 'desktop-computer',
    facingSide: 1,
    getActiveElapsed: () => elapsed.value,
  };
}

function expectPosition(root: THREE.Object3D, name: string, expected: readonly [number, number, number]): void {
  const object = root.getObjectByName(name);
  expect(object, `${name} must exist`).toBeTruthy();
  expect(object!.position.x, `${name}.position.x`).toBeCloseTo(expected[0], 6);
  expect(object!.position.y, `${name}.position.y`).toBeCloseTo(expected[1], 6);
  expect(object!.position.z, `${name}.position.z`).toBeCloseTo(expected[2], 6);
}

test('desktop v2 preserves the frozen rig, socket, bounds and ground-contact contract', () => {
  const model = createDesktopComputerModel({ id: 'desktop-computer', accent: 0xe8a7b7 });
  const runtime = model.root.userData.sculptRuntime as {
    nodes: Record<string, THREE.Object3D>;
    sockets: Record<string, THREE.Object3D>;
  };

  const frozenPivots = {
    'desktop-computer-monitor-assembly-pivot': [-1.7, 0, 0],
    'desktop-computer-monitor-stand-pivot': [0, 0, 0],
    'desktop-computer-monitor-column-pivot': [0, 0.5, -0.58],
    'desktop-computer-screen-tilt-pivot': [0, 3, 0.12],
    'desktop-computer-tower-assembly-pivot': [3.65, 0, -0.72],
    'desktop-computer-keyboard-assembly-pivot': [-1.75, 0, 2.2],
    'desktop-computer-keybed-pivot': [0, 0, 0],
    'desktop-computer-mouse-assembly-pivot': [2.55, 0, 2.55],
    'desktop-computer-mouse-button-pivot': [0, 0.76, 0.44],
    'desktop-computer-mouse-wheel-pivot': [0, 0.08, -0.05],
    'desktop-computer-power-button-pivot': [0, 0.65, 0.09],
    'desktop-computer-screen-state-pivot': [0, 0, 0.342],
    'desktop-computer-overheat-smoke-pivot': [0.3, 5.26, 0],
  } as const;
  Object.entries(frozenPivots).forEach(([name, position]) => expectPosition(model.root, name, position));

  const frozenSockets = {
    'desktop-computer-monitor-hinge-socket': [0, 1, 0],
    'desktop-computer-top-vent-socket': [0.3, 5.28, 0],
    'desktop-computer-monitor-power-socket': [2.65, 2.2, -0.24],
    'desktop-computer-monitor-display-socket': [1.9, 2.2, -0.24],
    'desktop-computer-tower-power-socket': [0.75, 1.05, -1.64],
    'desktop-computer-keyboard-link-socket': [2.55, 0.35, -0.72],
    'desktop-computer-mouse-link-socket': [0, 0.25, 0.8],
    'desktop-computer-screen-effect-socket': [0, 0, 0.08],
    'desktop-computer-left-connection-socket': [-4.595, 3.0208085, 3.445],
    'desktop-computer-right-connection-socket': [5.1075, 3.0208085, 3.445],
    'desktop-computer-top-connection-socket': [0.25625005, 6.056617, 3.445],
    'desktop-computer-bottom-connection-socket': [0.25625005, -0.015, 3.445],
  } as const;
  Object.entries(frozenSockets).forEach(([name, position]) => {
    expect(runtime.sockets[name], `${name} must be published`).toBeTruthy();
    expectPosition(model.root, name, position);
  });

  const bounds = new THREE.Box3().setFromObject(model.root);
  expect(bounds.min.x).toBeCloseTo(-4.5599999, 5);
  expect(bounds.min.y).toBeCloseTo(0.02, 5);
  expect(bounds.min.z).toBeCloseTo(-3.215, 5);
  expect(bounds.max.x).toBeCloseTo(5.0725, 5);
  expect(bounds.max.y).toBeCloseTo(6.021617, 5);
  expect(bounds.max.z).toBeCloseTo(3.41, 5);
  expect(runtime.nodes['desktop-computer-tower-top-smoke-vent-grid']).toBeTruthy();
});

test('desktop computer is a deep CRT set with no fan prop and model-owned volumetric smoke', () => {
  const model = createDesktopComputerModel({ id: 'desktop-computer', accent: 0xe8a7b7 });
  const tower = model.root.getObjectByName('desktop-computer-tower-assembly-pivot');
  expect(tower?.position.z).toBeCloseTo(-0.72, 6);
  expect(model.root.getObjectByName('desktop-computer-crt-tapered-rear-bell')).toBeTruthy();
  expect(model.root.getObjectByName('desktop-computer-crt-rear-service-cap')).toBeTruthy();
  expect(model.root.getObjectByName('desktop-computer-recessed-screen-glass')).toBeTruthy();
  expect(model.root.getObjectByName('desktop-computer-screen-state-pivot')).toBeTruthy();
  expect(model.root.userData.referenceDimensions.monitorOuter[2]).toBeGreaterThan(3);

  const forbiddenFans: string[] = [];
  model.root.traverse((object) => {
    if (/desktop-computer.*fan/i.test(object.name)) forbiddenFans.push(object.name);
  });
  expect(forbiddenFans).toEqual([]);

  const puffs = smokePuffs(model.root);
  expect(puffs).toHaveLength(10);
  expect(puffs.every((puff) => !puff.visible)).toBe(true);
  for (const puff of puffs) {
    expect(puff.geometry).not.toBeInstanceOf(THREE.PlaneGeometry);
    expect(puff.geometry.userData.performanceProp).toBe('desktop-computer-irregular-volumetric-smoke');
    expect(puff.userData.forbiddenPrimitives).toEqual(['PlaneGeometry', 'Sprite', 'Line']);
    puff.geometry.computeBoundingBox();
    const size = puff.geometry.boundingBox!.getSize(new THREE.Vector3());
    expect(Math.min(size.x, size.y, size.z)).toBeGreaterThan(0.24);
  }
});

test('desktop v2 uses the appliance-only irregular outline hierarchy and visible dark CRT screen', () => {
  const model = createDesktopComputerModel({ id: 'desktop-computer', accent: 0xe8a7b7 });
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
  expect(tierCounts.main).toBeGreaterThanOrEqual(6);
  expect(tierCounts.structure).toBeGreaterThanOrEqual(4);
  expect(tierCounts.detail).toBeGreaterThanOrEqual(2);

  const shell = model.root.getObjectByName('desktop-computer-rounded-monitor-shell') as THREE.Mesh;
  const screen = model.root.getObjectByName('desktop-computer-recessed-screen-glass') as THREE.Mesh;
  shell.geometry.computeBoundingBox();
  expect(screen.material).toBeInstanceOf(THREE.MeshBasicMaterial);
  expect((screen.material as THREE.MeshBasicMaterial).toneMapped).toBe(false);
  expect(screen.position.z).toBeGreaterThan(shell.position.z + shell.geometry.boundingBox!.max.z);
});

test('desktop v2 rebuilds deterministically with finite geometry and disposes every geometry and material', () => {
  const signatures: string[] = [];
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const model = createDesktopComputerModel({ id: 'desktop-computer', accent: 0xe8a7b7 });
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
        const triangles = (object.geometry.index?.count ?? positions.count) / 3;
        visibleTriangles += triangles * (object instanceof THREE.InstancedMesh ? object.count : 1);
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
    expect(visibleTriangles).toBeLessThan(92_336 * 1.35);
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

test('desktop timeline escalates from working strain to smoky overload and fully settles', () => {
  const model = createDesktopComputerModel({ id: 'desktop-computer', accent: 0xe8a7b7 });
  const animation = createApplianceMechanicalAnimation('desktop-computer', model.root);
  const baseline = snapshot(model.root);

  animation.update(1.4, 1);
  expect(model.root.userData.desktopComputerPerformanceDiagnostics).toMatchObject({
    phase: 'working',
    visibleSmokePuffs: 0,
    fanPropRemoved: true,
    screenContentPreserved: true,
  });

  animation.update(3.2, 1);
  const straining = model.root.userData.desktopComputerPerformanceDiagnostics;
  expect(straining.phase).toBe('straining');
  expect(straining.strain).toBeGreaterThan(0.75);
  expect(straining.visibleSmokePuffs).toBeGreaterThanOrEqual(4);

  animation.update(4.04, 1);
  const overload = model.root.userData.desktopComputerPerformanceDiagnostics;
  expect(overload.phase).toBe('overload');
  expect(overload.overload).toBeGreaterThan(0.95);
  expect(overload.visibleSmokePuffs).toBeGreaterThanOrEqual(4);
  expect(model.root.getObjectByName('desktop-computer-classic-blue-screen-pivot')?.visible).toBe(true);

  animation.update(4.95, (5.2 - 4.95) / 0.55);
  const settle = model.root.userData.desktopComputerPerformanceDiagnostics;
  expect(settle.phase).toBe('settle');
  expect(settle.towerShake).toBeLessThan(overload.towerShake);
  expect(settle.monitorWobble).toBeLessThan(overload.monitorWobble);

  animation.stop();
  expect(snapshot(model.root)).toBe(baseline);
  expect(model.root.userData.desktopComputerPerformanceDiagnostics).toBeUndefined();
  expect(smokePuffs(model.root).every((puff) => !puff.visible)).toBe(true);
});

test('game and gallery instances share the same desktop model rig and timeline samples', () => {
  const camera = new THREE.PerspectiveCamera(31, 16 / 9, 0.1, 80);
  camera.position.set(4, 3, 9);
  camera.lookAt(0, 2.2, 0);
  camera.updateMatrixWorld(true);
  const game = createDesktopComputerModel({ id: 'desktop-computer', accent: 0xe8a7b7 });
  const gallery = createDesktopComputerModel({ id: 'desktop-computer', accent: 0xe8a7b7 });
  const gameSystem = new AppliancePerformanceSystem();
  const gallerySystem = new AppliancePerformanceSystem();
  const gamePetals = new PetalField(1);
  const galleryPetals = new PetalField(1);
  const gameElapsed = { value: 0 };
  const galleryElapsed = { value: 0 };
  const gameTarget = target(game.root, gameElapsed);
  const galleryTarget = target(gallery.root, galleryElapsed);

  for (const time of [0.35, 1.4, 3.2, 4.04, 4.95]) {
    gameElapsed.value = time;
    galleryElapsed.value = time;
    gameSystem.update(1 / 60, time, camera, [gameTarget], gamePetals);
    gallerySystem.update(1 / 60, time, camera, [galleryTarget], galleryPetals);
    expect(game.root.userData.desktopComputerPerformanceDiagnostics)
      .toEqual(gallery.root.userData.desktopComputerPerformanceDiagnostics);
    expect(snapshot(game.root)).toBe(snapshot(gallery.root));
    expect(gameSystem.getStateSummary().timelineOwners).toBe(1);
    expect(gallerySystem.getStateSummary().timelineOwners).toBe(1);
    expect(gameSystem.getStateSummary().activeByKind.steam).toBe(0);
    expect(gallerySystem.getStateSummary().activeByKind.steam).toBe(0);
  }

  gameSystem.dispose();
  gallerySystem.dispose();
  gamePetals.dispose();
  galleryPetals.dispose();
});
