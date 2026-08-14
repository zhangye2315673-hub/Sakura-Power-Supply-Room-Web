import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createBubbleMachineModel } from '../src/appliances/models/bubbleMachine';

const build = createBubbleMachineModel({ id: 'bubble-machine', accent: 0xe8aec4 });
const runtime = build.root.userData.sculptRuntime as { nodes: Record<string, THREE.Object3D>; sockets: Record<string, THREE.Object3D>; colliders: unknown[]; destructionGroups: unknown[] };
const componentMatchers: Record<string, RegExp> = {
  'housing-shell': /bubble-machine-(?:housing-shell|upper-shoulder|lower-panel)/,
  'front-assembly': /bubble-machine-front-(?:assembly|cavity|window)/,
  'liquid-reservoir': /bubble-machine-(?:liquid-reservoir|translucent-liquid-reservoir|reservoir-)/,
  'rear-assembly': /bubble-machine-rear-(?:fan|grille|fastener)/,
  'front-window-rim': /bubble-machine-front-window-(?:outer|inner)-rim/,
  'front-window': /bubble-machine-smoked-front-window/,
  'bubble-wheel': /bubble-machine-bubble-wheel-pivot|bubble-machine-wheel-/,
  'wheel-hub': /bubble-machine-wheel-hub/,
  'drip-tray': /bubble-machine-drip-tray/,
  'control-knob': /bubble-machine-control-/,
  'reservoir-cap': /bubble-machine-reservoir-fill-cap/,
  'rear-fan-rotor': /bubble-machine-rear-fan-(?:blade|hub)/,
  'rear-fan-grille': /bubble-machine-rear-grille/,
  'foot-array': /bubble-machine-foot-/,
  'power-inlet': /bubble-machine-power-inlet/,
  'side-vent-array': /bubble-machine-side-vent/,
  'shell-seam': /bubble-machine-lower-panel-seam/,
  'bubble-ring-array': /bubble-machine-bubble-ring-/,
  'bubble-spokes': /bubble-machine-wheel-spoke/,
  'fan-blade-array': /bubble-machine-rear-fan-blade/,
  'grille-band-array': /bubble-machine-rear-grille-ring/,
  'rear-fastener-array': /bubble-machine-rear-fastener/,
  'control-index': /bubble-machine-control-index/,
  'reservoir-bracket': /bubble-machine-reservoir-bracket/,
  'bubble-effect-array': /bubble-machine-(?:performance-bubble|giant-bubble|burst-)/,
  'runtime-action-rig': /bubble-machine-(?:performance-bubble|giant-bubble|burst-)/,
};
const parts = new Map(Object.keys(componentMatchers).map((name) => [name, { name, kind: 'part', module: name, triangles: 0 }]));
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
const manifest = { model: 'bubble-machine', parts: [...parts.values()].sort((a, b) => a.name.localeCompare(b.name)), unnamedMeshes, integralMeshes, invalidGeometry, runtimeNodes: Object.keys(runtime.nodes).length, sockets: Object.keys(runtime.sockets).length, colliders: runtime.colliders.length, destructionGroups: runtime.destructionGroups.length, emptyComponents };
mkdirSync('artifacts/appliance-v2/bubble-machine/assembly', { recursive: true });
writeFileSync('artifacts/appliance-v2/bubble-machine/assembly/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
if (unnamedMeshes !== 0 || invalidGeometry !== 0 || emptyComponents.length !== 0) process.exitCode = 1;
