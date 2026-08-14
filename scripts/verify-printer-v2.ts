import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createPrinterModel as createV2 } from '../src/appliances/models/printer';
import { createPrinterModel as createV1 } from '../docs/history/appliance-model-v1-2026-08-11/src/appliances/models/printer';

const options = { id: 'printer', accent: 0xe8aec4 };
const frozenPattern = /(?:pivot|socket|printer-performance-paper-rig|printer-performance-page-\d+)$/;
const round = (value: number): number => Number(value.toFixed(6));

function bounds(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  return {
    min: box.min.toArray().map(round),
    max: box.max.toArray().map(round),
    size: box.getSize(new THREE.Vector3()).toArray().map(round),
  };
}

function localTransform(root: THREE.Object3D, name: string) {
  const object = root.getObjectByName(name);
  if (!object) return null;
  return {
    parent: object.parent?.name ?? null,
    position: object.position.toArray().map(round),
    quaternion: object.quaternion.toArray().map(round),
    scale: object.scale.toArray().map(round),
    visible: object.visible,
  };
}

function frozenNames(root: THREE.Object3D): string[] {
  const names: string[] = [];
  root.traverse((object) => {
    if (object.name && frozenPattern.test(object.name)) names.push(object.name);
  });
  return names.sort();
}

function inspectGeometry(root: THREE.Object3D) {
  const outlineTiers = { main: 0, structure: 0, detail: 0 };
  let unnamedMeshes = 0;
  let finiteGeometry = true;
  let triangles = 0;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (!object.name) unnamedMeshes += 1;
    const tier = object.userData.outlineTier as keyof typeof outlineTiers | undefined;
    if (tier) outlineTiers[tier] += 1;
    const position = object.geometry.getAttribute('position');
    if (!position) return;
    for (let index = 0; index < position.count; index += 1) {
      finiteGeometry &&= Number.isFinite(position.getX(index))
        && Number.isFinite(position.getY(index))
        && Number.isFinite(position.getZ(index));
    }
    triangles += object.geometry.index ? object.geometry.index.count / 3 : position.count / 3;
  });
  return { outlineTiers, unnamedMeshes, finiteGeometry, triangles: Math.round(triangles) };
}

function dispose(build: ReturnType<typeof createV2>): void {
  build.root.traverse((object) => {
    if (object instanceof THREE.Mesh) object.geometry.dispose();
  });
  build.materials.forEach((material) => material.dispose());
}

const v1 = createV1(options);
const v2 = createV2(options);
const frozen = frozenNames(v1.root);
const v1Bounds = bounds(v1.root);
const v2Bounds = bounds(v2.root);
const relativeDelta = v2Bounds.size.map((value, index) => (
  Math.abs(value - v1Bounds.size[index]) / Math.max(v1Bounds.size[index], 1e-9)
));
const frozenTransforms = Object.fromEntries(frozen.map((name) => [
  name,
  JSON.stringify(localTransform(v1.root, name)) === JSON.stringify(localTransform(v2.root, name)),
]));
const v1Geometry = inspectGeometry(v1.root);
const v2Geometry = inspectGeometry(v2.root);
const triangleRatio = v2Geometry.triangles / Math.max(v1Geometry.triangles, 1);
const rebuilds = Array.from({ length: 3 }, () => createV2(options));
const rebuildBounds = rebuilds.map((build) => bounds(build.root));
const runtime = v2.root.userData.sculptRuntime as {
  nodes: Record<string, THREE.Object3D>;
  sockets: Record<string, THREE.Object3D>;
  colliders: unknown[];
  destructionGroups: unknown[];
};
const paperRig = v2.root.userData.printerPerformanceRig as Record<string, unknown>;
const failures: string[] = [];

if (Math.max(...relativeDelta) > 0.02) failures.push(`bounds delta exceeds 2%: ${relativeDelta.map(round).join(', ')}`);
for (const [name, matches] of Object.entries(frozenTransforms)) {
  if (!matches) failures.push(`frozen local transform changed: ${name}`);
  if (!runtime.nodes[name]) failures.push(`runtime node missing: ${name}`);
}
for (const name of frozen.filter((candidate) => candidate.endsWith('socket'))) {
  if (!runtime.sockets[name]) failures.push(`runtime socket missing: ${name}`);
}
if (v2Geometry.unnamedMeshes > 0) failures.push(`${v2Geometry.unnamedMeshes} unnamed meshes`);
if (!v2Geometry.finiteGeometry) failures.push('non-finite geometry');
if (Object.values(v2Geometry.outlineTiers).some((count) => count === 0)) failures.push(`missing outline tier: ${JSON.stringify(v2Geometry.outlineTiers)}`);
if (triangleRatio > 1.35) failures.push(`triangle ratio exceeds 1.35: ${round(triangleRatio)}`);
if (new Set(rebuildBounds.map((value) => JSON.stringify(value))).size !== 1) failures.push('rebuild bounds are not deterministic');
if (runtime.colliders.length !== 4) failures.push(`expected 4 colliders, got ${runtime.colliders.length}`);
if (runtime.destructionGroups.length !== 5) failures.push(`expected 5 destruction groups, got ${runtime.destructionGroups.length}`);
if (paperRig.pageCount !== 5) failures.push(`expected 5 paper pages, got ${String(paperRig.pageCount)}`);
if (paperRig.owner !== 'PrinterPerformance') failures.push(`unexpected paper owner: ${String(paperRig.owner)}`);
if (paperRig.sourceSocket !== 'printer-paper-exit-socket') failures.push(`unexpected paper source: ${String(paperRig.sourceSocket)}`);

const report = {
  model: 'printer', v1Bounds, v2Bounds, relativeDelta: relativeDelta.map(round), frozenTransforms,
  v1Geometry, v2Geometry, triangleRatio: round(triangleRatio), colliders: runtime.colliders.length,
  destructionGroups: runtime.destructionGroups.length, paperRig, rebuildBounds, failures,
  passed: failures.length === 0,
};
mkdirSync('artifacts/appliance-v2/printer/diagnostics', { recursive: true });
writeFileSync(
  'artifacts/appliance-v2/printer/diagnostics/printer-v2-verification.json',
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
[v2, ...rebuilds].forEach(dispose);
dispose(v1);
if (failures.length > 0) process.exitCode = 1;
