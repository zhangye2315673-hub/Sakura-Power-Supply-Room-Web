import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createRadioModel } from '../src/appliances/models/radio';

const build = createRadioModel({ id: 'radio', accent: 0xe8aec4 });
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
  'radio-speaker-diaphragm-pivot', 'radio-speaker-socket', 'radio-frequency-pointer-pivot',
  'radio-volume-knob-pivot', 'radio-tuning-knob-pivot', 'radio-antenna-hinge-pivot',
  'radio-antenna-root-socket', 'radio-antenna-extension-pivot-1', 'radio-antenna-extension-pivot-2',
  'radio-antenna-extension-pivot-3', 'radio-antenna-tip-extension-pivot',
]) parts.push({ name, kind: name.endsWith('socket') ? 'socket' : 'pivot', triangles: 0 });
const specified = [
  'radio-outer-shell', 'radio-front-panel', 'radio-speaker-frame', 'radio-speaker-cavity',
  'radio-frequency-frame', 'radio-frequency-face', 'radio-volume-knob', 'radio-tuning-knob',
  'radio-rear-access-panel', 'radio-antenna-hinge-bracket', 'radio-antenna-tip-cap',
];
const names = new Set(parts.map((part) => part.name));
const missing = specified.filter((name) => !names.has(name));
const manifest = { model: 'radio', parts: parts.sort((a, b) => a.name.localeCompare(b.name)), unnamedMeshes };
const coverage = { model: 'radio', passed: missing.length === 0 && unnamedMeshes === 0, specified: specified.length, covered: specified.length - missing.length, missing, unnamedMeshes, note: 'Coverage proves named assembly exists; it does not independently score visual fidelity.' };
mkdirSync('artifacts/appliance-v2/radio/assembly', { recursive: true });
writeFileSync('artifacts/appliance-v2/radio/assembly/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync('artifacts/appliance-v2/radio/assembly/part-coverage.json', `${JSON.stringify(coverage, null, 2)}\n`);
console.log(JSON.stringify(coverage, null, 2));
if (!coverage.passed) process.exitCode = 1;
