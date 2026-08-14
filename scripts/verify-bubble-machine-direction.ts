import * as THREE from 'three';
import { createBubbleMachineModel } from '../src/appliances/models/bubbleMachine';

const MINIMUM_BUBBLE_COUNT = 42;
const MAXIMUM_CROSS_AXIS_TO_FORWARD_RATIO = 0.25;
const SAMPLE_SECONDS = 1.1;

type BubbleState = {
  position: THREE.Vector3;
  visible: boolean;
};

function round(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

function snapshot(root: THREE.Object3D, materials: Set<THREE.Material>): string {
  const nodes: unknown[] = [];
  root.traverse((node) => {
    nodes.push({
      name: node.name,
      position: node.position.toArray().map(round),
      quaternion: node.quaternion.toArray().map(round),
      scale: node.scale.toArray().map(round),
      visible: node.visible,
    });
  });
  const materialState = [...materials].map((material) => {
    const toon = material as THREE.MeshToonMaterial;
    return {
      name: material.name,
      opacity: round(material.opacity),
      transparent: material.transparent,
      emissive: toon.emissive?.getHex() ?? null,
      emissiveIntensity: round(toon.emissiveIntensity ?? 0),
    };
  });
  return JSON.stringify({ nodes, materialState });
}

const build = createBubbleMachineModel({
  id: 'bubble-machine-direction-verification',
  accent: 0xe8a7b7,
});
build.animation.stop();

const bubbles: THREE.Mesh[] = [];
build.root.traverse((node) => {
  if (node instanceof THREE.Mesh && /^bubble-machine-powered-bubble-\d+$/.test(node.name)) {
    bubbles.push(node);
  }
});
bubbles.sort((first, second) => first.name.localeCompare(second.name, undefined, { numeric: true }));

const baseline = snapshot(build.root, build.materials);
build.animation.update(0, 1);
const start = new Map<THREE.Mesh, BubbleState>(bubbles.map((bubble) => [
  bubble,
  { position: bubble.position.clone(), visible: bubble.visible },
]));

build.animation.update(SAMPLE_SECONDS, 1);
const poweredVisibleCount = bubbles.filter((bubble) => bubble.visible).length;

// Only sample bubbles that cannot wrap from phase 1 back to phase 0 during
// this interval. Their delta is therefore a real forward flight segment.
const sampled = bubbles.filter((bubble) => (
  (bubble.userData.phase as number) + SAMPLE_SECONDS * 0.43 < 1
));
const deltas = sampled.map((bubble) => {
  const delta = bubble.position.clone().sub(start.get(bubble)!.position);
  const crossAxis = Math.hypot(delta.x, delta.y);
  return {
    name: bubble.name,
    forward: delta.z,
    crossAxis,
    ratio: crossAxis / Math.max(delta.z, Number.EPSILON),
  };
});

const minimumForward = Math.min(...deltas.map((delta) => delta.forward));
const averageForward = deltas.reduce((sum, delta) => sum + delta.forward, 0) / deltas.length;
const averageCrossAxis = deltas.reduce((sum, delta) => sum + delta.crossAxis, 0) / deltas.length;
const averageRatio = averageCrossAxis / averageForward;
const maximumRatio = Math.max(...deltas.map((delta) => delta.ratio));
const firstBubbleStart = start.get(bubbles[0])!.position;

build.animation.stop();
const reset = snapshot(build.root, build.materials);

const failures: string[] = [];
if (bubbles.length < MINIMUM_BUBBLE_COUNT) {
  failures.push(`expected at least ${MINIMUM_BUBBLE_COUNT} bubbles, found ${bubbles.length}`);
}
if (poweredVisibleCount !== bubbles.length) {
  failures.push(`only ${poweredVisibleCount}/${bubbles.length} bubbles are visible while powered`);
}
if (firstBubbleStart.z < 1.04) {
  failures.push(`bubble emission starts behind the front face at Z=${firstBubbleStart.z}`);
}
if (minimumForward <= 0) {
  failures.push(`at least one non-wrapping bubble does not move toward local +Z: ${minimumForward}`);
}
if (averageRatio > MAXIMUM_CROSS_AXIS_TO_FORWARD_RATIO) {
  failures.push(`average cross-axis/forward ratio ${averageRatio} exceeds ${MAXIMUM_CROSS_AXIS_TO_FORWARD_RATIO}`);
}
if (maximumRatio > MAXIMUM_CROSS_AXIS_TO_FORWARD_RATIO) {
  failures.push(`maximum cross-axis/forward ratio ${maximumRatio} exceeds ${MAXIMUM_CROSS_AXIS_TO_FORWARD_RATIO}`);
}
if (baseline !== reset) failures.push('stop() does not exactly restore node and material state');
if (build.animation.signal() !== 0) failures.push('animation signal remains active after stop()');

const report = {
  passed: failures.length === 0,
  modelConvention: '+Y up, +Z front',
  bubbleCount: bubbles.length,
  poweredVisibleCount,
  sampledFlightSegments: sampled.length,
  startZ: round(firstBubbleStart.z),
  minimumForwardDisplacement: round(minimumForward),
  averageForwardDisplacement: round(averageForward),
  averageCrossAxisDisplacement: round(averageCrossAxis),
  averageCrossAxisToForwardRatio: round(averageRatio),
  maximumIndividualRatio: round(maximumRatio),
  exactReset: baseline === reset,
  signalAfterStop: build.animation.signal(),
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
