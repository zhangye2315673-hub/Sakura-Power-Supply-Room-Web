import { writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createPortableSpeakerModel } from '../src/appliances/models/portableSpeaker';

const build = createPortableSpeakerModel({ id: 'portable-speaker', accent: 0xe8a7b7 });
const aliases: Record<string, string> = {
  'front-fascia-seam': 'front-fascia',
  'handle-hinge-1': 'handle-hinges',
  'handle-hinge-2': 'handle-hinges',
  'foot-1': 'feet',
  'foot-2': 'feet',
  'sound-wave-effect': 'sound-wave-emitter',
};
const pivotParts = new Map([
  ['portable-speaker-cabinet-pivot', 'cabinet-shell'],
  ['portable-speaker-front-fascia-pivot', 'front-fascia'],
  ['portable-speaker-driver-pulse-pivot', 'internal-driver'],
  ['portable-speaker-handle-pivot', 'carry-handle'],
  ['portable-speaker-right-hinge-pivot', 'carry-handle-right-root'],
  ['portable-speaker-rear-service-pivot', 'rear-service-panel'],
]);
const parts = new Map<string, { name: string; kind: string; module: string; triangles: number }>();
let unnamedMeshes = 0;
let integralMeshes = 0;

build.root.traverse((node) => {
  const pivotPart = pivotParts.get(node.name);
  if (pivotPart && !parts.has(pivotPart)) parts.set(pivotPart, { name: pivotPart, kind: 'pivot', module: pivotPart, triangles: 0 });
  if (!(node instanceof THREE.Mesh)) return;
  if (!node.name) unnamedMeshes += 1;
  const rawPart = typeof node.userData.part === 'string' ? node.userData.part : null;
  if (!rawPart) return;
  integralMeshes += 1;
  const part = aliases[rawPart] ?? rawPart;
  const position = node.geometry.getAttribute('position');
  const instanceCount = node instanceof THREE.InstancedMesh ? node.count : 1;
  const triangles = (node.geometry.index ? node.geometry.index.count / 3 : position.count / 3) * instanceCount;
  const entry = parts.get(part) ?? { name: part, kind: 'part', module: part, triangles: 0 };
  entry.triangles += Math.round(triangles);
  parts.set(part, entry);
});

const manifest = {
  model: 'portable-speaker',
  parts: [...parts.values()].sort((a, b) => a.name.localeCompare(b.name)),
  unnamedMeshes,
  integralMeshes,
};
writeFileSync('artifacts/img2threejs/portable-speaker/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
if (unnamedMeshes !== 0) process.exit(1);
