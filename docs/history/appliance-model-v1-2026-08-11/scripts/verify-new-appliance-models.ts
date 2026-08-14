import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createApplianceModel } from '../src/appliances/models';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import type { ApplianceKind } from '../src/systems/ApplianceCatalog';

const NEW_APPLIANCES: ApplianceKind[] = [
  'bubble-machine',
  'gumball-machine',
  'popcorn-machine',
  'alarm-clock',
  'smart-bin',
  'record-player',
  'stand-mixer',
  'printer',
  'induction-cooktop',
  'blender',
  'dehumidifier',
  'portable-speaker',
  'hair-dryer',
  'desktop-computer',
  'game-controller',
];

type Snapshot = {
  objects: Record<string, number[] | boolean>;
  materials: Record<string, number[] | number | boolean>;
};

function round(value: number): number {
  return Math.round(value * 1e12) / 1e12;
}

function snapshot(root: THREE.Object3D, materials: Set<THREE.Material>): Snapshot {
  const objects: Snapshot['objects'] = {};
  let ordinal = 0;
  root.traverse((object) => {
    const key = `${ordinal}:${object.name || object.type}`;
    ordinal += 1;
    objects[`${key}:transform`] = [
      object.position.x,
      object.position.y,
      object.position.z,
      object.quaternion.x,
      object.quaternion.y,
      object.quaternion.z,
      object.quaternion.w,
      object.scale.x,
      object.scale.y,
      object.scale.z,
    ].map(round);
    objects[`${key}:visible`] = object.visible;
  });

  const materialState: Snapshot['materials'] = {};
  [...materials].forEach((material, index) => {
    const candidate = material as THREE.Material & {
      color?: THREE.Color;
      emissive?: THREE.Color;
      emissiveIntensity?: number;
      opacity: number;
      transparent: boolean;
    };
    if (candidate.color) materialState[`${index}:color`] = candidate.color.toArray().map(round);
    if (candidate.emissive) materialState[`${index}:emissive`] = candidate.emissive.toArray().map(round);
    if (candidate.emissiveIntensity !== undefined) {
      materialState[`${index}:emissiveIntensity`] = round(candidate.emissiveIntensity);
    }
    materialState[`${index}:opacity`] = round(candidate.opacity);
    materialState[`${index}:transparent`] = candidate.transparent;
  });
  return { objects, materials: materialState };
}

function diffSnapshotKeys(before: Snapshot, after: Snapshot): string[] {
  const differences: string[] = [];
  for (const section of ['objects', 'materials'] as const) {
    const keys = new Set([...Object.keys(before[section]), ...Object.keys(after[section])]);
    for (const key of keys) {
      if (JSON.stringify(before[section][key]) !== JSON.stringify(after[section][key])) {
        differences.push(`${section}.${key}: ${JSON.stringify(before[section][key])} -> ${JSON.stringify(after[section][key])}`);
      }
    }
  }
  return differences;
}

function triangleCount(root: THREE.Object3D): number {
  let triangles = 0;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const geometry = object.geometry;
    triangles += geometry.index
      ? geometry.index.count / 3
      : (geometry.getAttribute('position')?.count ?? 0) / 3;
  });
  return Math.round(triangles);
}

function dispose(root: THREE.Object3D, materials: Set<THREE.Material>): void {
  const geometries = new Set<THREE.BufferGeometry>();
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) geometries.add(object.geometry);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

const results = NEW_APPLIANCES.map((id, index) => {
  const build = createApplianceModel(id, {
    id,
    accent: [0xe58da8, 0x89cbbf, 0xf1c96b][index % 3],
    referencePath: `references/intake/${id}/front.png`,
  });
  const animation = createApplianceMechanicalAnimation(id, build.root);
  // The animation contract defines stop() as the canonical idle state. Some
  // factories intentionally construct transient helper state before the first
  // gallery frame, so normalize once before recording the reset baseline.
  animation.stop();
  const before = snapshot(build.root, build.materials);
  const baselineJson = JSON.stringify(before);
  let peakSignal = 0;
  let changedDuringPower = false;
  for (const time of [0.12, 1.4, 2.8, 4.9]) {
    animation.update(time, 1);
    peakSignal = Math.max(peakSignal, Math.abs(animation.signal()));
    changedDuringPower ||= JSON.stringify(snapshot(build.root, build.materials)) !== baselineJson;
  }
  animation.stop();
  const afterStop = snapshot(build.root, build.materials);
  const resetDiffKeys = diffSnapshotKeys(before, afterStop);
  const runtime = build.root.userData.sculptRuntime as {
    nodes?: Record<string, THREE.Object3D>;
    sockets?: Record<string, THREE.Object3D>;
    colliders?: unknown[];
  } | undefined;
  const allObjects: THREE.Object3D[] = [];
  build.root.traverse((object) => allObjects.push(object));
  const meshes = allObjects.filter((object): object is THREE.Mesh => object instanceof THREE.Mesh);
  const result = {
    id,
    objects: allObjects.length,
    meshes: meshes.length,
    interactiveMeshes: build.interactiveMeshes.length,
    unnamedInteractiveMeshes: build.interactiveMeshes.filter((mesh) => !mesh.name).length,
    materials: build.materials.size,
    triangles: triangleCount(build.root),
    pivots: allObjects.filter((object) => object.name.includes('pivot')).length,
    sockets: Object.keys(runtime?.sockets ?? {}).length,
    runtimeNodes: Object.keys(runtime?.nodes ?? {}).length,
    colliders: runtime?.colliders?.length ?? 0,
    changedDuringPower,
    peakAnimationSignal: round(peakSignal),
    exactReset: resetDiffKeys.length === 0,
    resetDiffKeys,
    reconstructed: build.accuracy.reconstructed,
    inferred: build.accuracy.inferred,
  };
  dispose(build.root, build.materials);
  return result;
});

const failures = results.flatMap((result) => {
  const messages: string[] = [];
  if (result.interactiveMeshes < 2) messages.push(`${result.id}: compound model has fewer than two interactive meshes`);
  if (result.unnamedInteractiveMeshes > 0) messages.push(`${result.id}: unnamed interactive meshes`);
  if (result.runtimeNodes < 2 || result.colliders < 1) messages.push(`${result.id}: incomplete sculptRuntime`);
  if (!result.changedDuringPower || result.peakAnimationSignal <= 0) messages.push(`${result.id}: powered animation has no observable signal`);
  if (!result.exactReset) messages.push(`${result.id}: stop() did not restore exact baseline state`);
  return messages;
});

const report = {
  generatedAt: new Date().toISOString(),
  appliances: results,
  failures,
  passed: failures.length === 0,
};

mkdirSync('artifacts/img2threejs', { recursive: true });
writeFileSync('artifacts/img2threejs/new-appliance-runtime-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length > 0) process.exitCode = 1;
