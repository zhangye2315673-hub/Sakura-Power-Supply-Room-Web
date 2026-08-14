import { writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createPrinterModel } from '../src/appliances/models/printer';

const build = createPrinterModel({ id: 'printer', accent: 0xe8a7b7 });
const byPart = new Map<string, { name: string; kind: string; module: string; triangles: number }>();
const pivotPartByNodeName = new Map([
  ['printer-rear-paper-support-pivot', 'rear-paper-support-pivot'],
  ['printer-output-tray-hinge-pivot', 'output-tray-pivot'],
]);
let unnamedMeshes = 0;
let integralMeshes = 0;

build.root.traverse((node) => {
  const pivotPart = pivotPartByNodeName.get(node.name);
  if (pivotPart) {
    byPart.set(pivotPart, { name: pivotPart, kind: 'pivot', module: pivotPart, triangles: 0 });
  }
  if (!(node instanceof THREE.Mesh)) return;
  if (!node.name) unnamedMeshes += 1;
  const part = typeof node.userData.part === 'string' ? node.userData.part : null;
  if (!part) return;
  integralMeshes += 1;
  const position = node.geometry.getAttribute('position');
  const triangles = node.geometry.index ? node.geometry.index.count / 3 : position.count / 3;
  const existing = byPart.get(part) ?? { name: part, kind: 'part', module: part, triangles: 0 };
  existing.triangles += Math.round(triangles);
  byPart.set(part, existing);
});

const manifest = {
  model: 'printer',
  parts: [...byPart.values()].sort((a, b) => a.name.localeCompare(b.name)),
  unnamedMeshes,
  integralMeshes,
};
writeFileSync('artifacts/img2threejs/printer/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
