import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createPhoneModel } from '../src/appliances/models/phone';

const build = createPhoneModel({ id: 'phone', accent: 0xe8a7b7 });
const parts: Array<{ name: string; kind: string; triangles: number }> = [];
let unnamedMeshes = 0;
build.root.traverse((node) => {
  if (!(node instanceof THREE.Mesh) || node.userData.isOutline) return;
  if (!node.name) unnamedMeshes += 1;
  const position = node.geometry.getAttribute('position');
  parts.push({ name: node.name || '(unnamed)', kind: 'mesh', triangles: Math.round(node.geometry.index ? node.geometry.index.count / 3 : position.count / 3) });
});
const runtime = build.root.userData.sculptRuntime as { nodes: Record<string, THREE.Object3D> };
const specified = [
  'phone-accent-perimeter-rail', 'phone-cream-rear-shell', 'phone-faceted-corner-guard-top-left',
  'phone-front-cream-bezel', 'phone-layered-rounded-display-glass', 'phone-low-poly-screen-crown',
  'phone-incoming-avatar-pivot', 'phone-call-answer-button-pivot', 'phone-call-hangup-button-pivot',
  'phone-independent-power-button', 'phone-volume-button-1', 'phone-bottom-type-c-recess',
  'phone-rear-rounded-camera-island', 'phone-rear-camera-lens-1-pivot', 'phone-rear-camera-lens-2-pivot',
  'phone-rear-sakura-ring-motif', 'phone-call-feedback-rig',
];
const names = new Set(parts.map((part) => part.name));
const missing = specified.filter((name) => !runtime.nodes[name] || (!names.has(name) && !name.endsWith('pivot') && !name.endsWith('rig')));
const manifest = { model: 'phone', parts: parts.sort((a, b) => a.name.localeCompare(b.name)), unnamedMeshes };
const coverage = {
  model: 'phone', passed: missing.length === 0 && unnamedMeshes === 0,
  specified: specified.length, covered: specified.length - missing.length, missing, unnamedMeshes,
  note: 'Coverage proves the specified named assembly exists; visual quality is reviewed from rendered views.',
};
mkdirSync('artifacts/appliance-v2/phone/assembly', { recursive: true });
writeFileSync('artifacts/appliance-v2/phone/assembly/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync('artifacts/appliance-v2/phone/assembly/part-coverage.json', `${JSON.stringify(coverage, null, 2)}\n`);
console.log(JSON.stringify(coverage, null, 2));
build.root.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
build.materials.forEach((material) => material.dispose());
if (!coverage.passed) process.exitCode = 1;
