import { writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createDehumidifierModel } from '../src/appliances/models/dehumidifier';

const build = createDehumidifierModel({ id: 'dehumidifier', accent: 0xe8a7b7 });
const byPart = new Map<string, { name: string; kind: string; module: string; triangles: number }>();
const runtimePartByNodeName = new Map([
  ['dehumidifier-water-tank-slide-pivot', 'tank-slide-pivot'],
  ['dehumidifier-exhaust-fan-pivot', 'exhaust-fan-pivot'],
  ['dehumidifier-front-control-button-pivot', 'control-button-pivot'],
  ['dehumidifier-rear-drain-port-pivot', 'rear-drain-port-pivot'],
  ['dehumidifier-dry-air-output-socket', 'dry-air-output-socket'],
  ['dehumidifier-continuous-drain-hose-socket', 'drain-hose-socket'],
  ['dehumidifier-power-cable-socket', 'power-cable-socket'],
]);
let unnamedMeshes = 0;
let integralMeshes = 0;

build.root.traverse((node) => {
  const runtimePart = runtimePartByNodeName.get(node.name);
  if (runtimePart) {
    byPart.set(runtimePart, { name: runtimePart, kind: 'pivot-or-socket', module: runtimePart, triangles: 0 });
  }
  if (!(node instanceof THREE.Mesh) || node.userData.isOutline) return;
  if (!node.name) unnamedMeshes += 1;
  const part = typeof node.userData.part === 'string' ? node.userData.part : null;
  if (!part) return;
  integralMeshes += 1;
  const position = node.geometry.getAttribute('position');
  const instanceCount = node instanceof THREE.InstancedMesh ? node.count : 1;
  const triangles = (node.geometry.index ? node.geometry.index.count / 3 : position.count / 3) * instanceCount;
  const existing = byPart.get(part) ?? { name: part, kind: 'part', module: part, triangles: 0 };
  existing.triangles += Math.round(triangles);
  byPart.set(part, existing);
});

const manifest = {
  model: 'dehumidifier',
  parts: [...byPart.values()].sort((a, b) => a.name.localeCompare(b.name)),
  unnamedMeshes,
  integralMeshes,
  notes: [
    'Relief such as the shell highlight and tank seam rides its named parent part.',
    'Pivots and sockets are zero-triangle runtime parts backed by sculptRuntime nodes.',
  ],
};
writeFileSync(
  'artifacts/img2threejs/dehumidifier/parts-manifest.json',
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(JSON.stringify(manifest, null, 2));
