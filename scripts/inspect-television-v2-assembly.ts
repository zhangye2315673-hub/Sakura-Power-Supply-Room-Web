import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createTelevisionModel } from '../src/appliances/models/television';

const build = createTelevisionModel({ id: 'television', accent: 0xe8aec4 });
const parts: Array<{ name: string; kind: string; triangles: number }> = [];
let unnamedMeshes = 0;
build.root.traverse((node) => {
  if (!(node instanceof THREE.Mesh) || node.userData.isOutline) return;
  if (!node.name) unnamedMeshes += 1;
  const position = node.geometry.getAttribute('position');
  const triangles = node.geometry.index ? node.geometry.index.count / 3 : position.count / 3;
  parts.push({ name: node.name || '(unnamed)', kind: 'mesh', triangles: Math.round(triangles) });
});
for (const name of [
  'television-crt-screen-pivot', 'television-screen-socket', 'television-picture-pivot',
  'television-channel-selector-pivot', 'television-channel-selector-socket',
  'television-channel-button-1-pivot', 'television-channel-button-2-pivot', 'television-channel-button-3-pivot',
  'television-power-button-pivot', 'television-speaker-socket', 'television-rear-connection-socket',
]) parts.push({ name, kind: name.endsWith('socket') ? 'socket' : 'pivot', triangles: 0 });
const specified = [
  'television-rear-shell', 'television-rear-cap', 'television-front-fascia',
  'television-side-shoulder-left', 'television-side-shoulder-right', 'television-screen-frame',
  'television-screen-cavity', 'television-crt-bulged-screen', 'television-control-panel',
  'television-channel-selector-dial', 'television-channel-button-1', 'television-power-button',
  'television-rear-service-panel', 'television-rear-port-panel', 'television-foot-left-front',
];
const names = new Set(parts.map((part) => part.name));
const missing = specified.filter((name) => !names.has(name));
const manifest = { model: 'television', parts: parts.sort((a, b) => a.name.localeCompare(b.name)), unnamedMeshes };
const coverage = {
  model: 'television', passed: missing.length === 0 && unnamedMeshes === 0,
  specified: specified.length, covered: specified.length - missing.length, missing, unnamedMeshes,
  note: 'Coverage proves named assembly exists; it does not independently score visual fidelity.',
};
mkdirSync('artifacts/appliance-v2/television/assembly', { recursive: true });
writeFileSync('artifacts/appliance-v2/television/assembly/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync('artifacts/appliance-v2/television/assembly/part-coverage.json', `${JSON.stringify(coverage, null, 2)}\n`);
console.log(JSON.stringify(coverage, null, 2));
if (!coverage.passed) process.exitCode = 1;
