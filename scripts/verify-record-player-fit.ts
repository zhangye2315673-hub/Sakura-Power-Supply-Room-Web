import * as THREE from 'three';
import { createRecordPlayerModel } from '../src/appliances/models/recordPlayer';

const build = createRecordPlayerModel({
  id: 'record-player-fit-check',
  accent: 0xe8a7b7,
  referencePath: null,
});
const runtime = build.root.userData.sculptRuntime as {
  nodes: Record<string, THREE.Object3D>;
};
const nodes = runtime.nodes;

const bounds = (name: string): THREE.Box3 => {
  build.root.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(nodes[name]);
};
const unionBounds = (...names: string[]): THREE.Box3 => {
  const result = new THREE.Box3();
  names.forEach((name) => result.union(bounds(name)));
  return result;
};
const footprintSize = (box: THREE.Box3): { width: number; depth: number } => ({
  width: box.max.x - box.min.x,
  depth: box.max.z - box.min.z,
});
const footprintClearance = (outer: THREE.Box3, inner: THREE.Box3) => ({
  left: inner.min.x - outer.min.x,
  right: outer.max.x - inner.max.x,
  rear: inner.min.z - outer.min.z,
  front: outer.max.z - inner.max.z,
});
const minimumClearance = (clearance: ReturnType<typeof footprintClearance>): number => Math.min(
  clearance.left,
  clearance.right,
  clearance.rear,
  clearance.front,
);

build.animation.stop();
const bodyBounds = bounds('record-player-rounded-body-shell');
const deckBounds = bounds('record-player-top-deck');
const platterBounds = unionBounds(
  'record-player-black-vinyl-platter',
  'record-player-pink-platter-perimeter',
);
const bodySize = footprintSize(bodyBounds);
const platterSize = footprintSize(platterBounds);
const bodyClearance = footprintClearance(bodyBounds, platterBounds);
const deckClearance = footprintClearance(deckBounds, platterBounds);

const lidPivot = nodes['record-player-lid-hinge-pivot'];
const openLidRotation = lidPivot.rotation.x;
lidPivot.rotation.x = Math.PI * 0.5;
const closedLidBounds = bounds('record-player-raised-lid-shell');
const closedLidClearance = footprintClearance(closedLidBounds, platterBounds);
lidPivot.rotation.x = openLidRotation;
build.root.updateMatrixWorld(true);

const animatedNames = [
  'record-player-platter-spin-pivot',
  'record-player-tonearm-pivot',
  'record-player-control-knob-pivot',
  'record-player-lid-hinge-pivot',
];
const indicator = build.root.getObjectByName('record-player-power-status-indicator') as THREE.Mesh;
const indicatorMaterial = indicator.material as THREE.MeshStandardMaterial;
const snapshot = () => ({
  transforms: animatedNames.map((name) => {
    const node = nodes[name];
    return [
      node.position.x, node.position.y, node.position.z,
      node.rotation.x, node.rotation.y, node.rotation.z,
      node.scale.x, node.scale.y, node.scale.z,
    ];
  }),
  indicator: [indicatorMaterial.emissive.getHex(), indicatorMaterial.emissiveIntensity],
});

build.animation.stop();
const before = snapshot();
build.animation.update(2.7, 1);
const during = snapshot();
build.animation.stop();
const after = snapshot();
const changedDuringPower = JSON.stringify(before) !== JSON.stringify(during);
const exactReset = JSON.stringify(before) === JSON.stringify(after)
  && build.animation.signal() === 0;

const bodyHeight = bodyBounds.max.y - bodyBounds.min.y;
const bodyHeightToDepth = bodyHeight / bodySize.depth;
const bodyDepthToPlatter = bodySize.depth / platterSize.depth;
const passed = minimumClearance(bodyClearance) >= 0.15
  && minimumClearance(deckClearance) >= 0.07
  && minimumClearance(closedLidClearance) >= 0.1
  && bodyDepthToPlatter >= 1.14
  && bodyHeightToDepth <= 0.36
  && changedDuringPower
  && exactReset;

console.log(JSON.stringify({
  bodySize,
  platterSize,
  bodyClearance,
  deckClearance,
  closedLidClearance,
  bodyDepthToPlatter,
  bodyHeightToDepth,
  changedDuringPower,
  exactReset,
  passed,
}, null, 2));

if (!passed) process.exitCode = 1;
