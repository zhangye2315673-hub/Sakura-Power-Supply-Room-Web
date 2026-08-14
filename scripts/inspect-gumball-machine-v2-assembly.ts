import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createGumballMachineModel } from '../src/appliances/models/gumballMachine';

const build = createGumballMachineModel({ id: 'gumball-machine', accent: 0xe8aec4 });
const runtime = build.root.userData.sculptRuntime as { nodes: Record<string, THREE.Object3D>; sockets: Record<string, THREE.Object3D>; colliders: unknown[]; destructionGroups: unknown[] };
const componentMatchers: Record<string, RegExp> = {
  'globe-system': /transparent-globe-shell|globe-(?:front|side)-silhouette-contour/,
  'lid-system': /domed-top-lid|wide-top-lid-rim|cream-lid-crown/,
  'pedestal-system': /rounded-frustum-base-shell|pink-shoulder-bracket/,
  'seat-system': /globe-seat|pink-lower-base-ring/,
  'dispense-system': /dispense-(?:cavity|frame|tray)|deep-arched|pink-arched|protruding-dispense/,
  'capsule-system': /capsule-\d+-(?:clear-upper-shell|pastel-lower-shell)/,
  'prize-system': /capsule-\d+-(?:star|flower|key|bear)-prize/,
  'divider-system': /internal-center-column|inferred-divider-hub/,
  'front-control': /front-crank-(?:seat|face|cross-grip|center-boss)/,
  'side-control': /side-crank-(?:hub|arm|ball-grip)/,
  'rear-service': /rear-(?:rounded-service-panel|service-panel-seam|cable-notch)/,
  feet: /gumball-machine-foot-/,
  'indicator-system': /purpose-status-indicator/,
  'output-capsule': /output-capsule-(?:left|right|equator)/,
  'output-prize': /output-flower-prize/,
  'success-system': /success-burst-\d+-volumetric-star/,
  'capsule-seams': /capsule-\d+-equator-seam/,
  'lid-details': /wide-top-lid-rim|cream-lid-crown/,
  'chute-details': /deep-arched-dispense-cavity|protruding-dispense-tray/,
  'outline-system': /-ink$/,
};
const parts = new Map(Object.keys(componentMatchers).map((name) => [name, { name, kind: name === 'outline-system' ? 'style' : 'part', module: name, triangles: 0 }]));
let unnamedMeshes = 0; let integralMeshes = 0; let invalidGeometry = 0;
build.root.traverse((node) => {
  if (!(node instanceof THREE.Mesh)) return; integralMeshes += 1; if (!node.name) unnamedMeshes += 1;
  const position = node.geometry.getAttribute('position'); if (position) for (let index = 0; index < position.count; index += 1) if (![position.getX(index), position.getY(index), position.getZ(index)].every(Number.isFinite)) invalidGeometry += 1;
  const triangles = Math.round(node.geometry.index ? node.geometry.index.count / 3 : (position?.count ?? 0) / 3);
  for (const [component, matcher] of Object.entries(componentMatchers)) if (matcher.test(node.name)) parts.get(component)!.triangles += triangles;
});
const emptyComponents = [...parts.values()].filter((part) => part.triangles === 0).map((part) => part.name);
const manifest = { model: 'gumball-machine', parts: [...parts.values()].sort((a, b) => a.name.localeCompare(b.name)), unnamedMeshes, integralMeshes, invalidGeometry, runtimeNodes: Object.keys(runtime.nodes).length, sockets: Object.keys(runtime.sockets).length, colliders: runtime.colliders.length, destructionGroups: runtime.destructionGroups.length, emptyComponents };
mkdirSync('artifacts/appliance-v2/gumball-machine/assembly', { recursive: true }); writeFileSync('artifacts/appliance-v2/gumball-machine/assembly/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`); console.log(JSON.stringify(manifest, null, 2));
if (unnamedMeshes || invalidGeometry || emptyComponents.length) process.exitCode = 1;
