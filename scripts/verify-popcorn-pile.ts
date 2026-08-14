import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import * as THREE from 'three';
import { createPopcornMachineModel } from '../src/appliances/models/popcornMachine';
import { createPopcornMachinePerformance } from '../src/appliances/performance/PopcornMachinePerformance';

type PieceState = {
  position: THREE.Vector3;
  radius: number;
  kind: 'static' | 'powered';
};

const build = createPopcornMachineModel({
  id: 'popcorn-machine-verification',
  accent: 0xe58da8,
});
const controller = createPopcornMachinePerformance(build.root);

const staticBatches: THREE.InstancedMesh[] = [];
build.root.traverse((object) => {
  if (object instanceof THREE.InstancedMesh && object.name.includes('popped-kernel')) {
    staticBatches.push(object);
  }
});

assert.equal(staticBatches.length, 2, 'the static pile should use two material batches');

const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
const scale = new THREE.Vector3();
const readVisiblePieces = (): PieceState[] => {
  const states: PieceState[] = [];
  for (const batch of staticBatches) {
    batch.geometry.computeBoundingSphere();
    const geometryRadius = batch.geometry.boundingSphere?.radius ?? 0;
    for (let index = 0; index < batch.count; index += 1) {
      batch.getMatrixAt(index, matrix);
      matrix.decompose(position, quaternion, scale);
      states.push({
        position: position.clone(),
        radius: geometryRadius * Math.max(scale.x, scale.y, scale.z),
        kind: 'static',
      });
    }
  }
  build.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)
      || !object.visible
      || !object.name.includes('powered-pop')) return;
    object.geometry.computeBoundingSphere();
    states.push({
      position: object.position.clone(),
      radius: (object.geometry.boundingSphere?.radius ?? 0)
        * Math.max(object.scale.x, object.scale.y, object.scale.z),
      kind: 'powered',
    });
  });
  return states;
};

const pieces = readVisiblePieces();

assert.ok(pieces.length >= 48, `expected a visually full pile, received ${pieces.length} pieces`);

const severeOverlaps: Array<{ distance: number; permitted: number }> = [];
let minimumClearanceRatio = Number.POSITIVE_INFINITY;
for (let first = 0; first < pieces.length; first += 1) {
  for (let second = first + 1; second < pieces.length; second += 1) {
    const distance = pieces[first].position.distanceTo(pieces[second].position);
    const combinedRadius = pieces[first].radius + pieces[second].radius;
    const clearanceRatio = distance / combinedRadius;
    minimumClearanceRatio = Math.min(minimumClearanceRatio, clearanceRatio);
    if (clearanceRatio < 0.48) {
      severeOverlaps.push({ distance, permitted: combinedRadius * 0.48 });
    }
  }
}
assert.equal(
  severeOverlaps.length,
  0,
  `${severeOverlaps.length} static popcorn pairs have severe center overlap`,
);

const xs = pieces.map((piece) => piece.position.x);
const ys = pieces.map((piece) => piece.position.y);
const zs = pieces.map((piece) => piece.position.z);
assert.ok(Math.max(...xs) - Math.min(...xs) > 1.25, 'pile should fill most of the chamber width');
assert.ok(Math.max(...ys) - Math.min(...ys) > 0.45, 'pile should have an uneven, visibly full mound');
assert.ok(Math.max(...zs) - Math.min(...zs) > 0.62, 'pile should fill most of the chamber depth');

let poweredMinimumClearanceRatio = Number.POSITIVE_INFINITY;
let poweredSevereOverlaps = 0;
// The five-lobe kernel's bounding sphere intentionally encloses large empty
// corner volumes. A 0.30 centre-clearance ratio still rejects real centre
// collapse while allowing adjacent irregular lobes to interleave naturally.
const poweredSevereClearanceRatio = 0.30;
const poweredOverlapFrames: Array<{ frame: number; overlaps: number }> = [];
for (let frame = 0; frame <= 300; frame += 5) {
  controller.apply(frame / 60, 1);
  const poweredPieces = readVisiblePieces();
  let frameOverlaps = 0;
  for (let first = 0; first < poweredPieces.length; first += 1) {
    for (let second = first + 1; second < poweredPieces.length; second += 1) {
      const combinedRadius = poweredPieces[first].radius + poweredPieces[second].radius;
      if (combinedRadius <= 0) continue;
      const clearanceRatio = poweredPieces[first].position.distanceTo(poweredPieces[second].position)
        / combinedRadius;
      poweredMinimumClearanceRatio = Math.min(poweredMinimumClearanceRatio, clearanceRatio);
      if (clearanceRatio < poweredSevereClearanceRatio) {
        poweredSevereOverlaps += 1;
        frameOverlaps += 1;
        console.error(`${frame}:${poweredPieces[first].kind}-${poweredPieces[second].kind}:${clearanceRatio.toFixed(3)}`);
      }
    }
  }
  if (frameOverlaps > 0) poweredOverlapFrames.push({ frame, overlaps: frameOverlaps });
}
if (poweredOverlapFrames.length > 0) console.error(JSON.stringify(poweredOverlapFrames));
assert.equal(
  poweredSevereOverlaps,
  0,
  `${poweredSevereOverlaps} powered popcorn samples have severe center overlap`,
);
controller.reset();

const beforeMatrices = staticBatches.map((batch) => Array.from(batch.instanceMatrix.array));
const start = performance.now();
for (let frame = 0; frame < 300; frame += 1) {
  controller.apply(frame / 60, 1);
}
const updateMilliseconds = performance.now() - start;
controller.reset();

staticBatches.forEach((batch, index) => {
  assert.deepEqual(
    Array.from(batch.instanceMatrix.array),
    beforeMatrices[index],
    `${batch.name} should reset to its exact idle transforms`,
  );
});
assert.ok(
  updateMilliseconds < 500,
  `300 animation updates took ${updateMilliseconds.toFixed(1)}ms`,
);

console.log(JSON.stringify({
  passed: true,
  staticPieceCount: pieces.length,
  minimumClearanceRatio: Number(minimumClearanceRatio.toFixed(3)),
  poweredMinimumClearanceRatio: Number(poweredMinimumClearanceRatio.toFixed(3)),
  pileSpan: {
    x: Number((Math.max(...xs) - Math.min(...xs)).toFixed(3)),
    y: Number((Math.max(...ys) - Math.min(...ys)).toFixed(3)),
    z: Number((Math.max(...zs) - Math.min(...zs)).toFixed(3)),
  },
  animationUpdates: 300,
  updateMilliseconds: Number(updateMilliseconds.toFixed(1)),
  exactReset: true,
}, null, 2));
