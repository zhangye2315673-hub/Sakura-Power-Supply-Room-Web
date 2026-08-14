import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createSmartBinModel } from '../src/appliances/models/smartBin';

const build = createSmartBinModel({ id: 'smart-bin', accent: 0xe8aec4 });
const runtime = build.root.userData.sculptRuntime as {
  nodes: Record<string, THREE.Object3D>;
  sockets: Record<string, THREE.Object3D>;
  colliders: unknown[];
  destructionGroups: unknown[];
};
const parts: Array<Record<string, unknown>> = [];
let unnamedMeshes = 0;
let invalidGeometry = 0;
let integralMeshes = 0;

build.root.traverse((object) => {
  if (object.userData.isOutline) return;
  if (object instanceof THREE.Mesh) {
    if (!object.name) unnamedMeshes += 1;
    const position = object.geometry.getAttribute('position');
    const triangles = position ? (object.geometry.index ? object.geometry.index.count / 3 : position.count / 3) : 0;
    if (!position || !Number.isFinite(triangles)) invalidGeometry += 1;
    integralMeshes += 1;
    parts.push({ name: object.name, kind: 'part', module: object.name, triangles: Math.round(triangles) });
    return;
  }
  if (object instanceof THREE.Group && object.name) parts.push({ name: object.name, kind: 'group', module: object.name, triangles: 0 });
  else if (object.userData.socket === true && object.name) parts.push({ name: object.name, kind: 'socket', module: object.name, triangles: 0 });
});

for (const component of ['root', 'body-shell', 'lid-shell', 'inner-opening', 'trash-rig', 'front-door', 'upper-rail', 'bottom-skirt', 'lid-hinge-array', 'sensor-window', 'rear-handle-recess', 'power-inlet', 'foot-array', 'status-indicator', 'outline-system', 'trash-prop-family']) {
  parts.push({ name: component, kind: 'style', module: component, triangles: 0 });
}

const manifest = {
  model: 'smart-bin',
  parts,
  integralMeshes,
  unnamedMeshes,
  invalidGeometry,
  runtimeNodes: Object.keys(runtime.nodes).length,
  sockets: Object.keys(runtime.sockets).length,
  colliders: runtime.colliders.length,
  destructionGroups: runtime.destructionGroups.length,
};
mkdirSync('artifacts/appliance-v2/smart-bin/assembly', { recursive: true });
writeFileSync('artifacts/appliance-v2/smart-bin/assembly/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ model: manifest.model, parts: parts.length, integralMeshes, unnamedMeshes, invalidGeometry }, null, 2));
