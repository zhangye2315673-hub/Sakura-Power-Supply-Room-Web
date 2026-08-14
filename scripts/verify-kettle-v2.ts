import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createKettleModel as createV2 } from '../src/appliances/models/kettle';
import { createKettleModel as createV1 } from '../docs/history/appliance-model-v1-2026-08-11/src/appliances/models/kettle';

const options = { id: 'kettle', accent: 0xe8aec4 };
const frozenNodes = ['kettle-body-pivot', 'kettle-lid-hinge-pivot', 'kettle-power-switch-pivot', 'kettle-spout-pivot'];
const frozenSockets = ['kettle-lid-hinge-socket', 'kettle-spout-body-socket', 'kettle-spout-steam-socket', 'kettle-handle-upper-socket', 'kettle-handle-lower-socket', 'kettle-rear-power-socket'];
const round = (value: number): number => Number(value.toFixed(6));
const bounds = (root: THREE.Object3D) => {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  return { min: box.min.toArray().map(round), max: box.max.toArray().map(round), size: box.getSize(new THREE.Vector3()).toArray().map(round) };
};
const worldTransform = (root: THREE.Object3D, name: string) => {
  const object = root.getObjectByName(name);
  if (!object) return null;
  root.updateMatrixWorld(true);
  return { position: object.getWorldPosition(new THREE.Vector3()).toArray().map(round), quaternion: object.getWorldQuaternion(new THREE.Quaternion()).toArray().map(round) };
};
const dispose = (build: ReturnType<typeof createV2>) => {
  build.root.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
  build.materials.forEach((material) => material.dispose());
};

const v1 = createV1(options);
const v2 = createV2(options);
const v1Bounds = bounds(v1.root);
const v2Bounds = bounds(v2.root);
const relativeDelta = v2Bounds.size.map((value, index) => Math.abs(value - v1Bounds.size[index]) / Math.max(v1Bounds.size[index], 1e-9));
const transformDelta = (name: string) => {
  const before = worldTransform(v1.root, name);
  const after = worldTransform(v2.root, name);
  if (!before || !after) return Infinity;
  return Math.max(...before.position.map((value, index) => Math.abs(value - after.position[index])), ...before.quaternion.map((value, index) => Math.abs(value - after.quaternion[index])));
};
const outlineTiers = { main: 0, structure: 0, detail: 0 };
let unnamedMeshes = 0;
let finiteGeometry = true;
v2.root.traverse((object) => {
  if (!(object instanceof THREE.Mesh)) return;
  if (!object.name) unnamedMeshes += 1;
  const tier = object.userData.outlineTier as keyof typeof outlineTiers | undefined;
  if (tier) outlineTiers[tier] += 1;
  const position = object.geometry.getAttribute('position');
  if (position) for (let index = 0; index < position.count; index += 1) finiteGeometry &&= Number.isFinite(position.getX(index)) && Number.isFinite(position.getY(index)) && Number.isFinite(position.getZ(index));
});
const rebuilds = Array.from({ length: 3 }, () => createV2(options));
const rebuildBounds = rebuilds.map((build) => bounds(build.root));
const failures: string[] = [];
if (Math.max(...relativeDelta) > 0.02) failures.push(`bounds delta exceeds 2%: ${relativeDelta.map(round).join(', ')}`);
for (const name of [...frozenNodes, ...frozenSockets]) if (transformDelta(name) > 1e-4) failures.push(`frozen transform changed: ${name}`);
if (unnamedMeshes > 0) failures.push(`${unnamedMeshes} unnamed meshes`);
if (!finiteGeometry) failures.push('non-finite geometry');
if (Object.values(outlineTiers).some((count) => count === 0)) failures.push(`missing outline tier: ${JSON.stringify(outlineTiers)}`);
if (new Set(rebuildBounds.map((value) => JSON.stringify(value))).size !== 1) failures.push('rebuild bounds are not deterministic');
const runtime = v2.root.userData.sculptRuntime as { nodes: Record<string, THREE.Object3D>; sockets: Record<string, THREE.Object3D> };
for (const name of [...frozenNodes, ...frozenSockets]) if (!runtime.nodes[name]) failures.push(`runtime node missing: ${name}`);
for (const name of frozenSockets) if (!runtime.sockets[name]) failures.push(`runtime socket missing: ${name}`);
const report = { model: 'kettle', v1Bounds, v2Bounds, relativeDelta: relativeDelta.map(round), frozenTransforms: Object.fromEntries([...frozenNodes, ...frozenSockets].map((name) => [name, round(transformDelta(name))])), outlineTiers, unnamedMeshes, finiteGeometry, rebuildBounds, failures, passed: failures.length === 0 };
mkdirSync('artifacts/appliance-v2/kettle/diagnostics', { recursive: true });
writeFileSync('artifacts/appliance-v2/kettle/diagnostics/kettle-v2-verification.json', `${JSON.stringify(report, null, 2)}\n`);
[v2, ...rebuilds].forEach(dispose);
v1.root.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
v1.materials.forEach((material) => material.dispose());
console.log(JSON.stringify(report, null, 2));
if (failures.length > 0) process.exitCode = 1;
