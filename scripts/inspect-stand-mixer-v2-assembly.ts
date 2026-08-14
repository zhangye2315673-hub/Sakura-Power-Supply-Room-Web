import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createStandMixerModel } from '../src/appliances/models/standMixer';

const build = createStandMixerModel({ id: 'stand-mixer', accent: 0xe8aec4, referencePath: null });
const runtime = build.root.userData.sculptRuntime as { nodes: Record<string, THREE.Object3D>; sockets: Record<string, THREE.Object3D>; colliders: unknown[]; destructionGroups: unknown[] };
const matchers: Record<string, RegExp> = {
  'base-shell': /base|foot|bowl-seat|locking-lug/,
  'rear-column': /column|lower-control/,
  'motor-head': /motor-head|head-band|head-rail|side-hinge|release-lever|rear-vent/,
  'controls': /speed-dial|status-indicator/,
  'planetary-drive': /planetary|beater-shaft|beater-collar/,
  'whisk-array': /whisk-wire|whisk-lower-ring/,
  'bowl-system': /deep-mixing-bowl|bowl-rim|bowl-handle/,
  'mixture-system': /mixture|cream-settle/,
  'liquid-effects': /liquid-pull|cream-dollop|liquid-droplet/,
  'outline-system': /-ink$/,
};
const parts = new Map(Object.keys(matchers).map((name) => [name, { name, triangles: 0, meshes: 0 }]));
let unnamedMeshes = 0; let invalidGeometry = 0;
build.root.traverse((node) => { if (!(node instanceof THREE.Mesh)) return; if (!node.name) unnamedMeshes += 1; const position = node.geometry.getAttribute('position'); if (position) for (let index = 0; index < position.count; index += 1) if (![position.getX(index), position.getY(index), position.getZ(index)].every(Number.isFinite)) invalidGeometry += 1; const triangles = Math.round(node.geometry.index ? node.geometry.index.count / 3 : (position?.count ?? 0) / 3); for (const [name, matcher] of Object.entries(matchers)) if (matcher.test(node.name)) { const part = parts.get(name)!; part.triangles += triangles; part.meshes += 1; } });
const emptyComponents = [...parts.values()].filter((part) => part.meshes === 0).map((part) => part.name);
const manifest = { model: 'stand-mixer', parts: [...parts.values()], unnamedMeshes, invalidGeometry, runtimeNodes: Object.keys(runtime.nodes).length, sockets: Object.keys(runtime.sockets).length, colliders: runtime.colliders.length, destructionGroups: runtime.destructionGroups.length, emptyComponents };
mkdirSync('artifacts/appliance-v2/stand-mixer/assembly', { recursive: true }); writeFileSync('artifacts/appliance-v2/stand-mixer/assembly/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`); console.log(JSON.stringify(manifest, null, 2)); if (unnamedMeshes || invalidGeometry || emptyComponents.length) process.exitCode = 1;
