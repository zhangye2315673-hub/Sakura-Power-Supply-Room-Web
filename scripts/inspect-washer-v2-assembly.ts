import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createWasherModel } from '../src/appliances/models/washer';

const build = createWasherModel({ id: 'washer', accent: 0xe8aec4 });
const runtime = build.root.userData.sculptRuntime as {
  nodes: Record<string, THREE.Object3D>;
  sockets: Record<string, THREE.Object3D>;
  colliders: unknown[];
  destructionGroups: unknown[];
};

const componentMatchers: Record<string, RegExp> = {
  'cabinet-system': /washer-(?:cabinet-|top-cap|front-(?:left|right)-stile|front-(?:lower|upper)-apron)/,
  'control-system': /washer-(?:control-band|detergent-drawer|program-dial|display|control-button)/,
  'door-system': /washer-(?:fixed-rubber-door-gasket|door-)/,
  'drum-system': /washer-(?:deep-|stainless-drum-mouth)/,
  drawer: /washer-detergent-drawer/,
  'program-dial': /washer-program-dial/,
  'display-controls': /washer-(?:display|control-button)/,
  gasket: /washer-(?:fixed-rubber-door-gasket|door-gasket-depth-throat)/,
  'door-glass': /washer-door-glass/,
  'door-handle': /washer-door-handle/,
  'drum-baffles': /washer-drum-lifter-baffle/,
  'laundry-array': /washer-laundry-volume/,
  'wet-effects': /washer-(?:volumetric-suds-bubble|volumetric-glass-droplet)/,
  'side-panels': /washer-side-service-panel/,
  'rear-system': /washer-rear-(?:inset-panel|pressed-panel|lower-access-panel|fastener)/,
  'rear-connections': /washer-(?:drain-|power-|stowed-power-plug)/,
  feet: /washer-foot-/,
  'drum-perforations': /washer-drum-perforation/,
  'rear-fasteners': /washer-rear-fastener/,
  'outline-system': /-ink$/,
};

const parts = new Map<string, { name: string; kind: string; module: string; triangles: number }>();
for (const name of Object.keys(componentMatchers)) {
  parts.set(name, { name, kind: name === 'outline-system' ? 'style' : 'part', module: name, triangles: 0 });
}

let unnamedMeshes = 0;
let integralMeshes = 0;
let invalidGeometry = 0;
build.root.traverse((node) => {
  if (!(node instanceof THREE.Mesh)) return;
  integralMeshes += 1;
  if (!node.name) unnamedMeshes += 1;
  const position = node.geometry.getAttribute('position');
  if (position) {
    for (let index = 0; index < position.count; index += 1) {
      if (![position.getX(index), position.getY(index), position.getZ(index)].every(Number.isFinite)) invalidGeometry += 1;
    }
  }
  const triangles = Math.round(node.geometry.index ? node.geometry.index.count / 3 : position.count / 3);
  for (const [component, matcher] of Object.entries(componentMatchers)) {
    if (!matcher.test(node.name)) continue;
    const entry = parts.get(component)!;
    entry.triangles += triangles;
  }
});

const emptyComponents = [...parts.values()].filter((part) => part.triangles === 0).map((part) => part.name);
const manifest = {
  model: 'washer',
  parts: [...parts.values()].sort((a, b) => a.name.localeCompare(b.name)),
  unnamedMeshes,
  integralMeshes,
  invalidGeometry,
  runtimeNodes: Object.keys(runtime.nodes).length,
  sockets: Object.keys(runtime.sockets).length,
  colliders: runtime.colliders.length,
  destructionGroups: runtime.destructionGroups.length,
  emptyComponents,
};
mkdirSync('artifacts/appliance-v2/washer/assembly', { recursive: true });
writeFileSync('artifacts/appliance-v2/washer/assembly/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
if (unnamedMeshes !== 0 || invalidGeometry !== 0 || emptyComponents.length !== 0) process.exitCode = 1;
