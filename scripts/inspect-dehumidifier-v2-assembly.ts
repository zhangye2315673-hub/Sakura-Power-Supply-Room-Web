import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createDehumidifierModel } from '../src/appliances/models/dehumidifier';

const build = createDehumidifierModel({ id: 'dehumidifier', accent: 0xe8a7b7 });
const parts = new Map<string, { name: string; kind: string; module: string; triangles: number }>();
let unnamedMeshes = 0;
build.root.traverse((node) => {
  if (!(node instanceof THREE.Mesh) || node.userData.isOutline) return;
  if (!node.name) unnamedMeshes += 1;
  const part = typeof node.userData.part === 'string' ? node.userData.part : null;
  if (!part) return;
  const position = node.geometry.getAttribute('position');
  const count = node instanceof THREE.InstancedMesh ? node.count : 1;
  const triangles = (node.geometry.index ? node.geometry.index.count / 3 : position.count / 3) * count;
  const current = parts.get(part) ?? { name: part, kind: 'part', module: part, triangles: 0 };
  current.triangles += Math.round(triangles);
  parts.set(part, current);
});
for (const name of [
  'dehumidifier-water-tank-slide-pivot', 'dehumidifier-exhaust-fan-pivot',
  'dehumidifier-front-control-button-pivot', 'dehumidifier-rear-drain-port-pivot',
  'dehumidifier-dry-air-output-socket', 'dehumidifier-continuous-drain-hose-socket',
  'dehumidifier-power-cable-socket',
]) parts.set(name, { name, kind: 'pivot-or-socket', module: name, triangles: 0 });
for (const [name, module] of [
  ['root', 'appliance-model-dehumidifier'],
  ['tank-slide-pivot', 'dehumidifier-water-tank-slide-pivot'],
  ['exhaust-fan-pivot', 'dehumidifier-exhaust-fan-pivot'],
  ['control-button-pivot', 'dehumidifier-front-control-button-pivot'],
  ['status-indicator', 'control-button'],
  ['rear-drain-port-pivot', 'dehumidifier-rear-drain-port-pivot'],
  ['airborne-moisture', 'volumetric-humidity-effects'],
  ['dry-air-output-socket', 'dehumidifier-dry-air-output-socket'],
  ['drain-hose-socket', 'dehumidifier-continuous-drain-hose-socket'],
  ['power-cable-socket', 'dehumidifier-power-cable-socket'],
] as const) parts.set(name, { name, kind: 'component-alias', module, triangles: 0 });

const manifest = { model: 'dehumidifier', parts: [...parts.values()].sort((a, b) => a.name.localeCompare(b.name)), unnamedMeshes, notes: ['Explode and picking use stable userData.part names.', 'Transparent humidity effects remain named but excluded from heavy outline.'] };
mkdirSync('artifacts/appliance-v2/dehumidifier/assembly', { recursive: true });
writeFileSync('artifacts/appliance-v2/dehumidifier/assembly/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
