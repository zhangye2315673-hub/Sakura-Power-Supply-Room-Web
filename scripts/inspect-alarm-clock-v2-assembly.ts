import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createAlarmClockModel } from '../src/appliances/models/alarmClock';

const build = createAlarmClockModel({ id: 'alarm-clock', accent: 0xe58da8 });
const groups: Record<string, RegExp> = {
  'main-shell': /circular-shell|shell-front-band|shell-inner-seam/,
  'dial-assembly': /ivory-dial|dial-raised-rim|dial-transparent-cover|dial-powered-backlight/,
  'dial-indices': /dial-tick-/,
  'clock-hands': /hour-hand$|minute-hand$|hands-center-cap/,
  'feet': /foot-[12]$/,
  'bell-shells': /bell-[12]-(?:dome|lower-lip|under-cavity|support-post)/,
  'bell-hammers': /bell-hammer-(?:cap-)?[12]$/,
  'carry-handle': /arched-carry-handle/,
  'alarm-lever': /top-alarm-lever-(?:post|bar)/,
  'ringing-feedback': /stereo-wave|vibration-arc/,
  'rear-service': /rear-circular-service-plate|rear-service-seam|rear-winding-knob|rear-power-inlet/,
};
const parts = Object.keys(groups).map((name) => ({ name, kind: 'part', meshes: 0, triangles: 0 })); let unnamedMeshes = 0; let invalidGeometry = 0; let integralMeshes = 0;
build.root.traverse((node) => { if (!(node instanceof THREE.Mesh) || node.userData.isOutline) return; integralMeshes += 1; if (!node.name) unnamedMeshes += 1; const position = node.geometry.getAttribute('position'); if (position) for (let i = 0; i < position.count; i += 1) if (![position.getX(i), position.getY(i), position.getZ(i)].every(Number.isFinite)) invalidGeometry += 1; const triangles = Math.round(node.geometry.index ? node.geometry.index.count / 3 : (position?.count ?? 0) / 3); for (const part of parts) if (groups[part.name].test(node.name)) { part.meshes += 1; part.triangles += triangles; break; } });
const missing = parts.filter((part) => part.meshes === 0).map((part) => part.name); const runtime = build.root.userData.sculptRuntime as { nodes: Record<string, THREE.Object3D>; sockets: Record<string, THREE.Object3D>; colliders: unknown[]; destructionGroups: unknown[] };
const runtimeParts = Object.entries(runtime.nodes).filter(([name]) => name !== 'root').map(([name, node]) => {
  const mesh = node instanceof THREE.Mesh ? node : null; const position = mesh?.geometry.getAttribute('position');
  return { name, kind: mesh ? 'part' : node.userData.socket ? 'socket' : 'group', module: name, triangles: mesh ? Math.round(mesh.geometry.index ? mesh.geometry.index.count / 3 : (position?.count ?? 0) / 3) : 0 };
});
const manifest = { model: 'alarm-clock', parts: [{ name: 'root', kind: 'group', module: 'appliance-model-alarm-clock', triangles: 0 }, ...runtimeParts, { name: 'alarm-clock-outline-system', kind: 'style', module: 'alarm-clock-outline-system', triangles: 0 }], groups: parts, integralMeshes, unnamedMeshes, invalidGeometry, runtimeNodes: Object.keys(runtime.nodes).length, sockets: Object.keys(runtime.sockets).length, colliders: runtime.colliders.length, destructionGroups: runtime.destructionGroups.length };
const coverage = { model: 'alarm-clock', passed: missing.length === 0 && unnamedMeshes === 0 && invalidGeometry === 0, specified: parts.length, covered: parts.length - missing.length, missing, unnamedMeshes, invalidGeometry, note: 'Coverage proves named assembly realization, not visual fidelity.' };
mkdirSync('artifacts/appliance-v2/alarm-clock/assembly', { recursive: true }); writeFileSync('artifacts/appliance-v2/alarm-clock/assembly/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`); writeFileSync('artifacts/appliance-v2/alarm-clock/assembly/part-coverage.json', `${JSON.stringify(coverage, null, 2)}\n`); console.log(JSON.stringify(coverage, null, 2)); build.root.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); }); build.materials.forEach((material) => material.dispose()); if (!coverage.passed) process.exitCode = 1;
