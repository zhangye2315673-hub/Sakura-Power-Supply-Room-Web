import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createKettleModel } from '../src/appliances/models/kettle';
import { createKettlePerformance } from '../src/appliances/performance/KettlePerformance';
import { poweredAnimationState } from '../src/appliances/poweredAnimation';

const outputPath = 'artifacts/img2threejs/kettle/runtime-diagnostics.json';
const model = createKettleModel({ id: 'kettle', accent: 0xe8aec4 });
const animation = createKettlePerformance(model.root);
const round = (value: number): number => Number(value.toFixed(6));
const pose = (name: string): Record<string, unknown> => {
  const object = model.root.getObjectByName(name);
  if (!object) return { name, missing: true };
  return {
    name,
    visible: object.visible,
    position: object.position.toArray().map(round),
    rotation: object.rotation.toArray().slice(0, 3).map((value) => round(Number(value))),
    scale: object.scale.toArray().map(round),
  };
};

const timeline = [0.2, 0.8, 1.2, 2.35, 3.9, 4.2, 4.5, 4.8, 5.1].map((time) => {
  const powered = poweredAnimationState(time);
  animation.apply(powered.time, powered.power);
  model.root.updateMatrixWorld(true);
  const diagnostics = { ...(model.root.userData.kettlePerformance as Record<string, unknown>) };
  const visiblePuffs = Array.from({ length: 7 }, (_, index) => (
    model.root.getObjectByName(`kettle-volumetric-steam-puff-${index + 1}-pivot`)
  )).filter((puff): puff is THREE.Object3D => Boolean(puff?.visible));
  return {
    time,
    powered,
    diagnostics,
    body: pose('kettle-body-pivot'),
    lid: pose('kettle-lid-hinge-pivot'),
    switch: pose('kettle-power-switch-pivot'),
    visiblePuffs: visiblePuffs.map((puff) => ({
      name: puff.name,
      worldPosition: puff.getWorldPosition(new THREE.Vector3()).toArray().map(round),
      scale: puff.scale.toArray().map(round),
    })),
  };
});

const tailEnvelope = timeline.filter(({ time }) => time >= 3.9)
  .map(({ diagnostics }) => Number(diagnostics.motionEnvelope));
const tailMonotonic = tailEnvelope.every((value, index) => index === 0 || value <= tailEnvelope[index - 1] + 1e-9);
const puffPivots = Array.from({ length: 7 }, (_, index) => (
  model.root.getObjectByName(`kettle-volumetric-steam-puff-${index + 1}-pivot`)
));
const socket = model.root.getObjectByName('kettle-spout-steam-socket');
const flatFallbacks: string[] = [];
puffPivots.forEach((puff) => puff?.traverse((object) => {
  if (object instanceof THREE.Sprite || object instanceof THREE.Line) flatFallbacks.push(object.name || object.type);
  if (object instanceof THREE.Mesh && object.geometry.type === 'PlaneGeometry') flatFallbacks.push(object.name);
}));

animation.reset();
const report = {
  generatedAt: new Date().toISOString(),
  model: 'kettle',
  qualityContract: 'docs/sculpt-specs/kettle/quality-contract.md',
  timeline,
  structure: {
    puffAssemblies: puffPivots.filter(Boolean).length,
    lobesPerPuff: puffPivots.map((puff) => {
      let count = 0;
      puff?.traverse((object) => { if (object instanceof THREE.Mesh) count += 1; });
      return count;
    }),
    allPuffsParentedToSpoutSocket: puffPivots.every((puff) => puff?.parent === socket),
    flatFallbacks,
  },
  gates: {
    constantFrequencyHz: timeline.every(({ diagnostics }) => diagnostics.oscillationFrequencyHz === 3.6),
    highFrequencyLid: timeline.every(({ diagnostics }) => diagnostics.lidJumpFrequencyHz === 7.2),
    nearTopSteam: timeline.some(({ diagnostics }) => Number(diagnostics.maxSteamHeight) > 4.7),
    tailEnvelope,
    tailMonotonic,
    tailNearZero: tailEnvelope.at(-1)! < 0.021,
    noFlatFallbacks: flatFallbacks.length === 0,
    exactStop: puffPivots.every((puff) => puff?.visible === false) && animation.signal() === 0,
  },
};
const failures = Object.entries(report.gates).filter(([, passed]) => passed === false).map(([name]) => name);
mkdirSync(outputPath.slice(0, outputPath.lastIndexOf('/')), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify({ ...report, failures, passed: failures.length === 0 }, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, failures, passed: failures.length === 0 }, null, 2));
if (failures.length > 0) process.exitCode = 1;
