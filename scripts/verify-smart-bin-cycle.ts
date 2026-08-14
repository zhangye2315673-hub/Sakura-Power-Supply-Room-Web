import * as THREE from 'three';
import { createSmartBinModel } from '../src/appliances/models/smartBin';
import { createSmartBinPerformance } from '../src/appliances/performance/SmartBinPerformance';

const EPSILON = 1e-6;
const build = createSmartBinModel({
  id: 'smart-bin-cycle-check',
  accent: 0xe8a7b7,
  referencePath: null,
});
const runtime = build.root.userData.sculptRuntime as {
  nodes: Record<string, THREE.Object3D>;
};
const nodes = runtime.nodes;
const lidPivot = nodes['smart-bin-lid-hinge-pivot'];
const lidShell = nodes['smart-bin-rose-lid-shell'] as THREE.Mesh<THREE.BufferGeometry>;
const bodyShell = nodes['smart-bin-body-shell'];
const hingeSocket = nodes['smart-bin-lid-hinge-axis-socket'];
const sensorGlow = nodes['smart-bin-sensor-glow-strip'];
const trashPieces = [
  nodes['smart-bin-trash-paper-ball-pivot'],
  nodes['smart-bin-trash-banana-peel-pivot'],
  nodes['smart-bin-trash-aluminum-can-pivot'],
  nodes['smart-bin-trash-plastic-bottle-pivot'],
  nodes['smart-bin-trash-apple-core-pivot'],
  nodes['smart-bin-trash-coffee-cup-pivot'],
  nodes['smart-bin-trash-chip-bag-pivot'],
  nodes['smart-bin-trash-takeout-box-pivot'],
];
const performance = createSmartBinPerformance(build.root);

function snapshot(): string {
  const animatedNodes = [lidPivot, sensorGlow, ...trashPieces].map((node) => ({
    name: node.name,
    position: node.position.toArray(),
    quaternion: node.quaternion.toArray(),
    scale: node.scale.toArray(),
    visible: node.visible,
  }));
  const materials = [...build.materials].map((material) => {
    const toon = material as THREE.MeshToonMaterial;
    return {
      emissive: toon.emissive?.getHex() ?? null,
      emissiveIntensity: toon.emissiveIntensity ?? null,
    };
  });
  return JSON.stringify({ animatedNodes, materials });
}

build.root.updateMatrixWorld(true);
lidShell.geometry.computeBoundingBox();
const lidBounds = lidShell.geometry.boundingBox;
if (!lidBounds) throw new Error('Smart-bin lid is missing local bounds.');
const lidRearCenter = new THREE.Vector3(0, lidBounds.min.y, lidBounds.min.z)
  .applyMatrix4(lidShell.matrixWorld);
const lidCenter = lidShell.getWorldPosition(new THREE.Vector3());
const bodyCenter = bodyShell.getWorldPosition(new THREE.Vector3());
const hingeCenter = hingeSocket.getWorldPosition(new THREE.Vector3());
const hingeAligned = lidRearCenter.distanceTo(hingeCenter) < EPSILON;
const lidOffsetFromHinge = Math.abs(lidCenter.z - hingeCenter.z) > 0.25;
const lidCenteredOnBody = Math.abs(lidCenter.x - bodyCenter.x) < EPSILON
  && Math.abs(lidCenter.z - bodyCenter.z) < EPSILON;

const initialIdle = snapshot();
const defaultClosed = Math.abs(lidPivot.rotation.x) < EPSILON
  && !sensorGlow.visible
  && trashPieces.every((piece) => !piece.visible);

let firstOpeningAt = Number.POSITIVE_INFINITY;
let fullyOpenAt = Number.POSITIVE_INFINITY;
let firstWasteAt = Number.POSITIVE_INFINITY;
let lastWasteAt = Number.NEGATIVE_INFINITY;
let closeStartedAt = Number.POSITIVE_INFINITY;
let deepestLidAngle = 0;
const wasteSeen = new Set<string>();

for (let elapsed = 0; elapsed <= 5.2 + EPSILON; elapsed += 0.02) {
  performance.update(elapsed, 1);
  const angle = lidPivot.rotation.x;
  if (angle < -0.001 && firstOpeningAt === Number.POSITIVE_INFINITY) firstOpeningAt = elapsed;
  if (angle <= -1.15 && fullyOpenAt === Number.POSITIVE_INFINITY) fullyOpenAt = elapsed;
  if (angle < deepestLidAngle) deepestLidAngle = angle;

  const visibleWaste = trashPieces.filter((piece) => piece.visible);
  if (visibleWaste.length > 0) {
    if (firstWasteAt === Number.POSITIVE_INFINITY) firstWasteAt = elapsed;
    lastWasteAt = elapsed;
    visibleWaste.forEach((piece) => wasteSeen.add(piece.name));
  }
  if (
    firstWasteAt !== Number.POSITIVE_INFINITY
    && closeStartedAt === Number.POSITIVE_INFINITY
    && angle > deepestLidAngle + 0.01
  ) {
    closeStartedAt = elapsed;
  }
}

const endedClosed = Math.abs(lidPivot.rotation.x) < EPSILON
  && trashPieces.every((piece) => !piece.visible);
const sequenceValid = firstOpeningAt >= 0.16
  && fullyOpenAt < firstWasteAt
  && lastWasteAt < closeStartedAt
  && wasteSeen.size >= 2
  && endedClosed;

performance.stop();
const stoppedIdle = snapshot();
const exactReset = stoppedIdle === initialIdle && performance.signal() === 0;
const passed = hingeAligned
  && lidOffsetFromHinge
  && lidCenteredOnBody
  && defaultClosed
  && sequenceValid
  && exactReset;

console.log(JSON.stringify({
  hingeAligned,
  lidRearZ: lidRearCenter.z,
  hingeZ: hingeCenter.z,
  lidOffsetFromHinge,
  lidCenteredOnBody,
  defaultClosed,
  sequence: {
    firstOpeningAt,
    fullyOpenAt,
    firstWasteAt,
    lastWasteAt,
    closeStartedAt,
    wasteModelsSeen: wasteSeen.size,
    endedClosed,
  },
  exactReset,
  passed,
}, null, 2));

if (!passed) process.exitCode = 1;
