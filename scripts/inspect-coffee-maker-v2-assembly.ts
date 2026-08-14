import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createCoffeeMakerModel } from '../src/appliances/models/coffeeMaker';

const build = createCoffeeMakerModel({ id: 'coffee-maker', accent: 0xe8aec4 });
const runtime = build.root.userData.sculptRuntime as { nodes: Record<string, THREE.Object3D>; sockets: Record<string, THREE.Object3D>; colliders: unknown[]; destructionGroups: unknown[] };
const componentMatchers: Record<string, RegExp> = {
  'upper-system': /coffee-maker-(?:upper-|control-|large-control|dial-index|narrow-status)/,
  'hopper-system': /coffee-maker-(?:bean-hopper|gray-translucent-bean-hopper|hopper-locking)/,
  'hopper-lid': /coffee-maker-white-hopper-lid/,
  'frame-system': /coffee-maker-(?:rear-l-shaped-spine|cavity-frame-post)/,
  'cavity-back': /coffee-maker-brewing-cavity-back-panel/,
  'base-system': /coffee-maker-(?:separated-base|base-accent-rail)/,
  'water-system': /coffee-maker-visible-side-water-tank/,
  'tank-service': /coffee-maker-water-tank-cap/,
  'control-system': /coffee-maker-(?:control-dial-seat|large-control-dial|dial-index|narrow-status-light)/,
  'brew-system': /coffee-maker-(?:brew-head-housing|brew-head-shower-plate|outlet-nozzle)/,
  'cup-system': /coffee-maker-(?:cup-body|cup-accent-foot-band|cup-rim|cup-handle|cup-liquid-surface)/,
  'tray-system': /coffee-maker-drip-tray$/,
  'tray-slots': /coffee-maker-drip-tray-slot/,
  'rear-service': /coffee-maker-(?:rear-service-panel|rear-power)/,
  'rear-vents': /coffee-maker-rear-vent/,
  'bean-array': /coffee-maker-sculpted-bean-/,
  'bean-creases': /coffee-maker-bean-central-crease-/,
  'extraction-system': /coffee-maker-primary-extraction-flow/,
  'liquid-details': /coffee-maker-(?:volumetric-extraction-drop|cup-liquid-ripple)/,
  'steam-system': /coffee-maker-(?:steam-volume|volumetric-aroma-curl|warm-aroma-light-point)/,
  feet: /coffee-maker-foot-/,
  'outline-system': /-ink$/,
};
const parts = new Map(Object.keys(componentMatchers).map((name) => [name, { name, kind: name === 'outline-system' ? 'style' : 'part', module: name, triangles: 0 }]));
let unnamedMeshes = 0; let integralMeshes = 0; let invalidGeometry = 0;
build.root.traverse((node) => {
  if (!(node instanceof THREE.Mesh)) return;
  integralMeshes += 1;
  if (!node.name) unnamedMeshes += 1;
  const position = node.geometry.getAttribute('position');
  if (position) for (let index = 0; index < position.count; index += 1) if (![position.getX(index), position.getY(index), position.getZ(index)].every(Number.isFinite)) invalidGeometry += 1;
  const triangles = Math.round(node.geometry.index ? node.geometry.index.count / 3 : (position?.count ?? 0) / 3);
  for (const [component, matcher] of Object.entries(componentMatchers)) if (matcher.test(node.name)) parts.get(component)!.triangles += triangles;
});
const emptyComponents = [...parts.values()].filter((part) => part.triangles === 0).map((part) => part.name);
const manifest = { model: 'coffee-maker', parts: [...parts.values()].sort((a, b) => a.name.localeCompare(b.name)), unnamedMeshes, integralMeshes, invalidGeometry, runtimeNodes: Object.keys(runtime.nodes).length, sockets: Object.keys(runtime.sockets).length, colliders: runtime.colliders.length, destructionGroups: runtime.destructionGroups.length, emptyComponents };
mkdirSync('artifacts/appliance-v2/coffee-maker/assembly', { recursive: true });
writeFileSync('artifacts/appliance-v2/coffee-maker/assembly/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
if (unnamedMeshes !== 0 || invalidGeometry !== 0 || emptyComponents.length !== 0) process.exitCode = 1;
