import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createDehumidifierModel as createV2 } from '../src/appliances/models/dehumidifier';
import { createDehumidifierModel as createV1 } from '../docs/history/appliance-model-v1-2026-08-11/src/appliances/models/dehumidifier';

const options = { id: 'dehumidifier', accent: 0xe8a7b7 };
const round = (value: number): number => Number(value.toFixed(6));
const frozenPattern = /(?:pivot|socket)$/;

function bounds(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  return { min: box.min.toArray().map(round), max: box.max.toArray().map(round), size: box.getSize(new THREE.Vector3()).toArray().map(round) };
}

function localTransform(root: THREE.Object3D, name: string) {
  const object = root.getObjectByName(name);
  if (!object) return null;
  return { parent: object.parent?.name ?? null, position: object.position.toArray().map(round), quaternion: object.quaternion.toArray().map(round), scale: object.scale.toArray().map(round), visible: object.visible };
}

function frozenNames(root: THREE.Object3D): string[] {
  const names: string[] = [];
  root.traverse((object) => { if (object.name && (object instanceof THREE.Group || frozenPattern.test(object.name))) names.push(object.name); });
  return [...new Set(names)].sort();
}

function geometry(root: THREE.Object3D) {
  const outlineTiers = { main: 0, structure: 0, detail: 0, excluded: 0 };
  let triangles = 0; let unnamedMeshes = 0; let finite = true; let transparentVisibleOutlines = 0;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (!object.name) unnamedMeshes += 1;
    if (object.userData.isOutline) {
      const tier = object.userData.outlineTier as keyof typeof outlineTiers | undefined;
      if (tier) outlineTiers[tier] += 1;
      const parentMaterial = object.parent instanceof THREE.Mesh ? object.parent.material : null;
      const materials = Array.isArray(parentMaterial) ? parentMaterial : parentMaterial ? [parentMaterial] : [];
      if (object.visible && materials.some((material) => material.transparent)) transparentVisibleOutlines += 1;
      return;
    }
    const position = object.geometry.getAttribute('position');
    if (!position) return;
    const count = object instanceof THREE.InstancedMesh ? object.count : 1;
    triangles += (object.geometry.index ? object.geometry.index.count / 3 : position.count / 3) * count;
    for (let index = 0; index < position.count; index += 1) finite &&= Number.isFinite(position.getX(index)) && Number.isFinite(position.getY(index)) && Number.isFinite(position.getZ(index));
  });
  return { triangles: Math.round(triangles), unnamedMeshes, finite, outlineTiers, transparentVisibleOutlines };
}

function dispose(build: ReturnType<typeof createV2>): void {
  const geometries = new Set<THREE.BufferGeometry>();
  build.root.traverse((object) => { if (object instanceof THREE.Mesh) geometries.add(object.geometry); });
  geometries.forEach((item) => item.dispose());
  build.materials.forEach((item) => item.dispose());
}

const v1 = createV1(options); const v2 = createV2(options);
const names = frozenNames(v1.root);
const v1Bounds = bounds(v1.root); const v2Bounds = bounds(v2.root);
const relativeDelta = v2Bounds.size.map((value, index) => Math.abs(value - v1Bounds.size[index]) / Math.max(v1Bounds.size[index], 1e-9));
const groundDelta = Math.abs(v2Bounds.min[1] - v1Bounds.min[1]);
const frozenTransforms = Object.fromEntries(names.map((name) => [name, JSON.stringify(localTransform(v1.root, name)) === JSON.stringify(localTransform(v2.root, name))]));
const v1Geometry = geometry(v1.root); const v2Geometry = geometry(v2.root);
const triangleRatio = v2Geometry.triangles / Math.max(v1Geometry.triangles, 1);
const runtime = v2.root.userData.sculptRuntime as { nodes: Record<string, THREE.Object3D>; sockets: Record<string, THREE.Object3D>; colliders: unknown[]; destructionGroups: unknown[] };
const rebuilds = Array.from({ length: 3 }, () => createV2(options));
const rebuildBounds = rebuilds.map((build) => bounds(build.root));
const failures: string[] = [];
if (Math.max(...relativeDelta) > 0.02) failures.push(`bounds delta exceeds 2%: ${relativeDelta.map(round).join(', ')}`);
if (groundDelta > 0.005) failures.push(`ground delta exceeds 0.005: ${round(groundDelta)}`);
for (const [name, matches] of Object.entries(frozenTransforms)) {
  if (!matches) failures.push(`frozen local transform changed: ${name}`);
  if (name !== v2.root.name && !runtime.nodes[name]) failures.push(`runtime node missing: ${name}`);
}
for (const name of names.filter((candidate) => candidate.endsWith('socket'))) if (!runtime.sockets[name]) failures.push(`runtime socket missing: ${name}`);
if (v2Geometry.unnamedMeshes > 0) failures.push(`${v2Geometry.unnamedMeshes} unnamed meshes`);
if (!v2Geometry.finite) failures.push('non-finite geometry');
for (const tier of ['main', 'structure', 'detail'] as const) if (v2Geometry.outlineTiers[tier] === 0) failures.push(`missing outline tier ${tier}`);
if (v2Geometry.transparentVisibleOutlines > 0) failures.push(`${v2Geometry.transparentVisibleOutlines} transparent/effect outlines remain visible`);
if (triangleRatio > 1.35) failures.push(`triangle ratio exceeds 1.35: ${round(triangleRatio)}`);
if (new Set(rebuildBounds.map(JSON.stringify)).size !== 1) failures.push('rebuild bounds are not deterministic');

const report = { model: 'dehumidifier', v1Bounds, v2Bounds, relativeDelta: relativeDelta.map(round), groundDelta: round(groundDelta), frozenTransforms, v1Geometry, v2Geometry, triangleRatio: round(triangleRatio), colliders: runtime.colliders.length, destructionGroups: runtime.destructionGroups.length, rebuildBounds, failures, passed: failures.length === 0 };
mkdirSync('artifacts/appliance-v2/dehumidifier/diagnostics', { recursive: true });
writeFileSync('artifacts/appliance-v2/dehumidifier/diagnostics/dehumidifier-v2-verification.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
[v1, v2, ...rebuilds].forEach(dispose);
if (failures.length) process.exitCode = 1;
