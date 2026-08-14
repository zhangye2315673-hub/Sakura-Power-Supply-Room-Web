import * as THREE from 'three';
import { createStandMixerModel } from '../src/appliances/models/standMixer';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';

const build = createStandMixerModel({ id: 'stand-mixer-fit-check', accent: 0xe8a7b7, referencePath: null });
const animation = createApplianceMechanicalAnimation('stand-mixer', build.root);
const runtime = build.root.userData.sculptRuntime as {
  nodes: Record<string, THREE.Object3D>;
};
const nodes = runtime.nodes;

build.root.updateMatrixWorld(true);
const bounds = (name: string): THREE.Box3 => new THREE.Box3().setFromObject(nodes[name]);
const baseBounds = bounds('stand-mixer-stepped-base-shell');
const columnBounds = bounds('stand-mixer-tapered-rear-column');
const bowlBounds = bounds('stand-mixer-deep-mixing-bowl');
const rimBounds = bounds('stand-mixer-rolled-bowl-rim');
const bowlColumnGap = bowlBounds.min.z - columnBounds.max.z;
const rimColumnGap = rimBounds.min.z - columnBounds.max.z;
const baseCoversAssembly = baseBounds.min.z <= columnBounds.min.z
  && baseBounds.max.z >= bowlBounds.max.z;

const bowlCenter = nodes['stand-mixer-bowl-pivot'].getWorldPosition(new THREE.Vector3());
const beaterCenter = nodes['stand-mixer-beater-spin-pivot'].getWorldPosition(new THREE.Vector3());
const beaterToBowlCenter = Math.hypot(beaterCenter.x - bowlCenter.x, beaterCenter.z - bowlCenter.z);

const animatedNames = [
  'stand-mixer-motor-head-pivot',
  'stand-mixer-head-release-lever-pivot',
  'stand-mixer-front-speed-dial-pivot',
  'stand-mixer-lower-control-dial-pivot',
  'stand-mixer-planetary-pivot',
  'stand-mixer-beater-spin-pivot',
  'stand-mixer-mixture-pivot',
];
const snapshot = (): number[][] => animatedNames.map((name) => {
  const node = nodes[name];
  return [
    node.position.x, node.position.y, node.position.z,
    node.rotation.x, node.rotation.y, node.rotation.z,
    node.scale.x, node.scale.y, node.scale.z,
  ];
});

animation.stop();
const before = snapshot();
animation.update(2.7, 1);
const during = snapshot();
animation.stop();
const after = snapshot();
const changedDuringPower = JSON.stringify(before) !== JSON.stringify(during);
const exactReset = JSON.stringify(before) === JSON.stringify(after) && animation.signal() === 0;

type Diagnostics = {
  run: number;
  overspeed: number;
  activeDrops: number;
  activeSplats: number;
  shake: number;
};
const diagnostics = (): Diagnostics => build.root.userData.standMixerAnimation as Diagnostics;
const advanceTo = (target: number): void => {
  for (let time = 0; time <= target; time += 1 / 60) animation.update(time, 1);
};
animation.stop();
advanceTo(2.2);
const splashCue = { ...diagnostics() };
advanceTo(4.48);
const overspeedCue = { ...diagnostics() };
animation.stop();
const resetDiagnostics = diagnostics();
const effectsReset = resetDiagnostics.activeDrops === 0
  && resetDiagnostics.activeSplats === 0
  && resetDiagnostics.run === 0
  && resetDiagnostics.shake === 0;

const passed = bowlColumnGap >= 0.07
  && rimColumnGap >= 0.04
  && baseCoversAssembly
  && beaterToBowlCenter <= 0.16
  && changedDuringPower
  && exactReset
  && splashCue.activeDrops >= 1
  && splashCue.activeDrops + splashCue.activeSplats >= 8
  && splashCue.shake > 0
  && splashCue.overspeed > 0.9
  && overspeedCue.run > 0
  && overspeedCue.run < splashCue.run
  && effectsReset;

console.log(JSON.stringify({
  bowlColumnGap,
  rimColumnGap,
  baseCoversAssembly,
  beaterToBowlCenter,
  changedDuringPower,
  exactReset,
  splashCue,
  overspeedCue,
  effectsReset,
  passed,
}, null, 2));

if (!passed) process.exitCode = 1;
