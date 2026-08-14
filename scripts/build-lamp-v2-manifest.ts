import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createLampModel } from '../src/appliances/models/lamp';

const build = createLampModel({ id: 'lamp', accent: 0xe8aec4 });
const aliases = {
  base: ['lamp-base-lower-ring', 'lamp-base-body', 'lamp-base-top-plate'],
  stem: ['lamp-stem'], hinge: ['lamp-hinge-yoke', 'lamp-hinge-axle'], shade: ['lamp-shade-shell'],
  'base-rings': ['lamp-base-lower-ring', 'lamp-base-body', 'lamp-base-top-plate'], 'stem-collar': ['lamp-stem-foot-collar'],
  'hinge-caps': ['lamp-hinge-cap-left', 'lamp-hinge-cap-right'], 'shade-rim': ['lamp-shade-front-rim'], reflector: ['lamp-inner-reflector'],
  bulb: ['lamp-bulb-volume'], diffuser: ['lamp-warm-diffuser'], 'top-button': ['lamp-shade-top-button-pivot'], indicator: ['status-indicator'], feet: ['lamp-base-foot-left', 'lamp-base-foot-right'],
};
let unnamedMeshes = 0;
const parts = Object.entries(aliases).map(([name, nodes]) => ({ name, kind: 'part', module: nodes.join(','), triangles: nodes.reduce((sum, nodeName) => { const object = build.root.getObjectByName(nodeName); if (!(object instanceof THREE.Mesh)) return sum; const position = object.geometry.getAttribute('position'); return sum + (object.geometry.index ? object.geometry.index.count / 3 : position.count / 3); }, 0) }));
build.root.traverse((object) => { if (object instanceof THREE.Mesh && !object.name) unnamedMeshes += 1; });
mkdirSync('artifacts/appliance-v2/lamp/assembly', { recursive: true });
writeFileSync('artifacts/appliance-v2/lamp/assembly/parts-manifest.json', `${JSON.stringify({ model: 'lamp', parts, unnamedMeshes, notes: ['Named visual modules map directly to the v2 component contract.', 'Explode groups remain under sculptRuntime.destructionGroups.'] }, null, 2)}\n`);
build.root.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); }); build.materials.forEach((material) => material.dispose());
