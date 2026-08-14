import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createMicrowaveModel } from '../src/appliances/models/microwave';

const build = createMicrowaveModel({ id: 'microwave', accent: 0xe85f67 });
const componentNodes: Record<string, string> = {
  root: 'appliance-model-microwave',
  'cabinet-frame': 'microwave-cabinet-shell',
  'door-assembly': 'microwave-door-hinge-pivot',
  'cavity-assembly': 'microwave-interior-back-wall',
  'control-assembly': 'microwave-control-panel',
  'rear-service-assembly': 'microwave-rear-service-panel',
  'performance-rig': 'microwave-volumetric-heat-wave-root',
  'top-hood': 'microwave-top-hood',
  'side-shell-system': 'microwave-side-facet-panel',
  'lower-plinth': 'microwave-lower-rail',
  'door-outer-frame': 'microwave-door-outer-frame-left-rail',
  'door-inner-gasket': 'microwave-door-inner-frame-left-rail',
  'smoked-glass-panel': 'microwave-smoked-door-glass',
  'window-mesh': 'microwave-window-mesh-layer',
  'door-handle': 'microwave-door-handle',
  'door-hinge': 'microwave-door-hinge-socket',
  'tray-food-system': 'microwave-tray-rotor-pivot',
  'display-system': 'microwave-control-display',
  'small-button': 'microwave-small-button-pivot',
  'dial-system': 'microwave-control-dial-pivot',
  'dial-ticks': 'microwave-control-dial-tick-1',
  'lower-button': 'microwave-lower-button-pivot',
  'rear-service-panel': 'microwave-rear-vent-recess',
  'rear-vent-system': 'microwave-rear-vent-r1-c1',
  'rear-fasteners': 'microwave-rear-fastener-1',
  'power-entry': 'microwave-rear-power-inlet',
  'foot-system': 'microwave-foot-left-rear',
  'steam-system': 'microwave-steam-puff-1',
  'heat-wave-system': 'microwave-heat-energy-wave-1',
  'scene-edge-sockets': 'microwave-left-connection-socket',
};

function directTriangles(node: THREE.Object3D): number {
  if (!(node instanceof THREE.Mesh)) return 0;
  const position = node.geometry.getAttribute('position');
  const instanceCount = node instanceof THREE.InstancedMesh ? node.count : 1;
  return Math.round((node.geometry.index ? node.geometry.index.count / 3 : position.count / 3) * instanceCount);
}

const missingNodes: string[] = [];
const parts = Object.entries(componentNodes).map(([component, nodeName]) => {
  const node = build.root.getObjectByName(nodeName);
  if (!node) missingNodes.push(`${component}:${nodeName}`);
  return {
    name: component,
    kind: node instanceof THREE.Mesh ? 'mesh' : node?.userData.socket ? 'socket' : 'pivot',
    module: nodeName,
    triangles: node ? directTriangles(node) : 0,
  };
});

let unnamedMeshes = 0;
let integralMeshes = 0;
const runtimePartTags = new Set<string>();
build.root.traverse((node) => {
  if (!(node instanceof THREE.Mesh)) return;
  integralMeshes += 1;
  if (!node.name) unnamedMeshes += 1;
  if (typeof node.userData.part === 'string') runtimePartTags.add(node.userData.part);
});

const manifest = {
  model: 'microwave',
  parts,
  unnamedMeshes,
  integralMeshes,
  missingNodes,
  runtimePartTags: [...runtimePartTags].sort(),
};

mkdirSync('artifacts/img2threejs/microwave', { recursive: true });
writeFileSync('artifacts/img2threejs/microwave/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));

build.root.traverse((node) => {
  if (node instanceof THREE.Mesh) node.geometry.dispose();
});
build.materials.forEach((material) => material.dispose());
if (missingNodes.length > 0 || unnamedMeshes > 0) process.exit(1);
