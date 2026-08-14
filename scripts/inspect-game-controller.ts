import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createGameControllerModel } from '../src/appliances/models/gameController';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import type { GameControllerPerformanceDiagnostics } from '../src/appliances/performance/GameControllerPerformance';

const build = createGameControllerModel({ id: 'game-controller', accent: 0xe8a7b7 });
const byPart = new Map<string, { name: string; kind: string; module: string; triangles: number }>();
let unnamedMeshes = 0;
let integralMeshes = 0;
let triangles = 0;
let planeEffects = 0;
let volumetricEffects = 0;

build.root.traverse((node) => {
  if (!(node instanceof THREE.Mesh)) return;
  if (!node.name) unnamedMeshes += 1;
  const position = node.geometry.getAttribute('position');
  const count = Math.round(node.geometry.index ? node.geometry.index.count / 3 : position.count / 3);
  triangles += count;
  if (node.userData.performanceEffect) {
    if (node.geometry instanceof THREE.PlaneGeometry) planeEffects += 1;
    const box = new THREE.Box3().setFromBufferAttribute(position as THREE.BufferAttribute);
    const size = box.getSize(new THREE.Vector3());
    if (size.x > 0.001 && size.y > 0.001 && size.z > 0.001) volumetricEffects += 1;
  }
  const part = typeof node.userData.part === 'string' ? node.userData.part : node.name;
  if (!part) return;
  integralMeshes += 1;
  const existing = byPart.get(part) ?? { name: part, kind: 'part', module: part, triangles: 0 };
  existing.triangles += count;
  byPart.set(part, existing);
});

// Semantic aggregate/pivot parts share the same assembly definition as the spec.
for (const name of [
  'root',
  'grip-shell-pair',
  'shoulder-deck',
  'pink-grip-panel-pair',
  'dpad-cross',
  'face-button-array',
  'left-stick-assembly',
  'right-stick-assembly',
  'bumper-pair',
  'trigger-pair',
  'perimeter-shell-seam',
  'stick-socket-ring-pair',
  'left-stick-cap-inset',
  'right-stick-cap-inset',
  'dpad-cavity-rim',
  'face-button-crown-insets',
  'grip-boundary-seams',
  'shoulder-hinge-caps',
]) {
  if (!byPart.has(name)) byPart.set(name, { name, kind: 'semantic-group', module: name, triangles: 0 });
}

const runtime = build.root.userData.sculptRuntime as { nodes: Record<string, THREE.Object3D> };
const tracked = [
  'game-controller-motion-pivot',
  'game-controller-stick-1-pivot',
  'game-controller-stick-2-pivot',
  'game-controller-dpad-pivot',
  'game-controller-face-button-1-pivot',
  'game-controller-left-bumper-pivot',
  'game-controller-right-trigger-pivot',
];
build.root.updateMatrixWorld(true);
const baseline = tracked.map((name) => runtime.nodes[name].matrix.clone());
const animation = createApplianceMechanicalAnimation('game-controller', build.root);
animation.update(2.2, 1);
build.root.updateMatrixWorld(true);
const animated = tracked.some((name, index) => !runtime.nodes[name].matrix.equals(baseline[index]));
const samples = [0.2, 0.62, 1.7, 3.2, 4.2, 4.7, 5.1].map((time) => {
  animation.update(time, 1);
  return { ...(build.root.userData.gameControllerPerformanceDiagnostics as GameControllerPerformanceDiagnostics) };
});
animation.stop();
build.root.updateMatrixWorld(true);
const exactReset = tracked.every((name, index) => runtime.nodes[name].matrix.equals(baseline[index]));

const phases = samples.map((sample) => sample.phase);
const expectedPhases = ['anticipation', 'heartbeat-start', 'frenzy-input', 'ultimate-burst', 'ready-finale', 'ready-finale', 'settled'];
const fullTimeline = phases.every((phase, index) => phase === expectedPhases[index]);
const ultimateSample = samples[3];
const ultimateIsVolumetric = planeEffects === 0
  && volumetricEffects >= 23
  && ultimateSample.visibleStars > 0
  && ultimateSample.visibleElectricBolts > 0
  && ultimateSample.visibleImpactBodies > 0
  && ultimateSample.visibleEnergyPoints > 0;

if (!animated) throw new Error('Game controller rig did not animate.');
if (!exactReset) throw new Error('Game controller animation did not restore exact transforms.');
if (!fullTimeline) throw new Error(`Unexpected game controller phases: ${phases.join(', ')}`);
if (!ultimateIsVolumetric) throw new Error('Game controller ultimate effects are incomplete or planar.');

const manifest = {
  model: 'game-controller',
  source: 'runtime traversal of createGameControllerModel',
  parts: [...byPart.values()].sort((a, b) => a.name.localeCompare(b.name)),
  unnamedMeshes,
  integralMeshes,
  triangles,
  animation: { animated, exactReset, fullTimeline, phases, samples },
  effects: { planeEffects, volumetricEffects, ultimateIsVolumetric },
};
mkdirSync('artifacts/img2threejs/game-controller', { recursive: true });
writeFileSync('artifacts/img2threejs/game-controller/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
