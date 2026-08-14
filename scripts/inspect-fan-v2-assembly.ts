import { writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createFanModel } from '../src/appliances/models/fan';

const build = createFanModel({ id: 'fan', accent: 0xe8a7b7 });
const parts = new Map<string, { name: string; kind: string; meshes: number; triangles: number }>();
let unnamedMeshes = 0;
let invalidGeometry = 0;
build.root.traverse((node) => {
  if (!(node instanceof THREE.Mesh)) return;
  if (!node.name) unnamedMeshes += 1;
  const position = node.geometry.getAttribute('position');
  if (position) for (let index = 0; index < position.count; index += 1) {
    if (![position.getX(index), position.getY(index), position.getZ(index)].every(Number.isFinite)) invalidGeometry += 1;
  }
  const part = typeof node.userData.part === 'string' ? node.userData.part : node.name.replace(/^fan-/, '').replace(/-ink$/, '');
  const triangles = node.geometry.index ? node.geometry.index.count / 3 : position.count / 3;
  const entry = parts.get(part) ?? { name: part, kind: node.userData.isOutline ? 'outline' : 'mesh', meshes: 0, triangles: 0 };
  entry.meshes += 1;
  entry.triangles += Math.round(triangles);
  parts.set(part, entry);
});
const runtime = build.root.userData.sculptRuntime as { nodes: Record<string, THREE.Object3D>; sockets: Record<string, THREE.Object3D>; colliders: unknown[]; destructionGroups: unknown[] };
const manifest = { model: 'fan', parts: [...parts.values()].sort((a, b) => a.name.localeCompare(b.name)), unnamedMeshes, invalidGeometry, runtimeNodes: Object.keys(runtime.nodes).length, sockets: Object.keys(runtime.sockets).length, colliders: runtime.colliders.length, destructionGroups: runtime.destructionGroups.length };
writeFileSync('artifacts/appliance-v2/fan/assembly-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
if (unnamedMeshes !== 0 || invalidGeometry !== 0 || manifest.runtimeNodes < 20 || manifest.sockets < 7 || manifest.colliders < 2 || manifest.destructionGroups < 4) process.exit(1);
