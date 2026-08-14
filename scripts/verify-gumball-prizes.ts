import * as THREE from 'three';
import { createGumballMachineModel } from '../src/appliances/models/gumballMachine';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import type { GumballMachinePerformanceDiagnostics } from '../src/appliances/performance/GumballMachinePerformance';

const CAPSULE_COUNT = 17;
const CAPSULE_INNER_RADIUS = 0.245;
const MAX_TRIANGLES = 72_000;

type NodeSnapshot = Record<string, number[]>;

function round(value: number): number {
  return Math.round(value * 1e10) / 1e10;
}

function snapshot(nodes: readonly THREE.Object3D[]): NodeSnapshot {
  return Object.fromEntries(nodes.map((node) => [
    node.name,
    [
      node.position.x,
      node.position.y,
      node.position.z,
      node.quaternion.x,
      node.quaternion.y,
      node.quaternion.z,
      node.quaternion.w,
      node.scale.x,
      node.scale.y,
      node.scale.z,
      node.visible ? 1 : 0,
    ].map(round),
  ]));
}

function triangleCount(root: THREE.Object3D): number {
  let triangles = 0;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    triangles += object.geometry.index
      ? object.geometry.index.count / 3
      : (object.geometry.getAttribute('position')?.count ?? 0) / 3;
  });
  return Math.round(triangles);
}

function prizeFitsCapsule(capsule: THREE.Object3D, prize: THREE.Mesh): {
  fits: boolean;
  maxLocalRadius: number;
} {
  capsule.updateWorldMatrix(true, false);
  prize.updateWorldMatrix(true, false);
  prize.geometry.computeBoundingBox();
  const bounds = prize.geometry.boundingBox;
  if (!bounds) return { fits: false, maxLocalRadius: Number.POSITIVE_INFINITY };

  const toCapsule = capsule.matrixWorld.clone().invert().multiply(prize.matrixWorld);
  let maxLocalRadius = 0;
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        maxLocalRadius = Math.max(
          maxLocalRadius,
          new THREE.Vector3(x, y, z).applyMatrix4(toCapsule).length(),
        );
      }
    }
  }
  return {
    fits: maxLocalRadius <= CAPSULE_INNER_RADIUS,
    maxLocalRadius: round(maxLocalRadius),
  };
}

function mesh(name: string): THREE.Mesh {
  const object = build.root.getObjectByName(name);
  if (!(object instanceof THREE.Mesh)) throw new Error(`missing mesh: ${name}`);
  return object;
}

function group(name: string): THREE.Group {
  const object = build.root.getObjectByName(name);
  if (!(object instanceof THREE.Group)) throw new Error(`missing group: ${name}`);
  return object;
}

function diagnostics(): GumballMachinePerformanceDiagnostics {
  return build.root.userData.gumballMachinePerformanceDiagnostics as GumballMachinePerformanceDiagnostics;
}

const build = createGumballMachineModel({
  id: 'gumball-machine-prize-verification',
  accent: 0xe58da8,
  referencePath: 'references/intake/gumball-machine/front.png',
});
const animation = createApplianceMechanicalAnimation('gumball-machine', build.root);
animation.stop();

const trackedNodes: THREE.Object3D[] = [];
const capsuleChecks = Array.from({ length: CAPSULE_COUNT }, (_, index) => {
  const capsuleNumber = index + 1;
  const capsule = build.root.getObjectByName(`gumball-machine-capsule-${capsuleNumber}-pivot`);
  const prizePivot = build.root.getObjectByName(`gumball-machine-capsule-${capsuleNumber}-prize-pivot`);
  const prizes: THREE.Mesh[] = [];
  prizePivot?.traverse((object) => {
    if (object instanceof THREE.Mesh && object.userData.capsulePrize === true) prizes.push(object);
  });
  if (capsule) trackedNodes.push(capsule);
  if (prizePivot) trackedNodes.push(prizePivot);

  const prize = prizes[0];
  const size = new THREE.Vector3();
  if (prize) {
    prize.geometry.computeBoundingBox();
    prize.geometry.boundingBox?.getSize(size);
    size.multiply(prize.scale);
  }
  const fit = capsule && prize
    ? prizeFitsCapsule(capsule, prize)
    : { fits: false, maxLocalRadius: Number.POSITIVE_INFINITY };

  return {
    capsule: capsuleNumber,
    capsuleFound: Boolean(capsule),
    prizePivotFound: Boolean(prizePivot),
    prizeMeshCount: prizes.length,
    kind: prize?.userData.prizeKind ?? null,
    opaque: prize ? !(prize.material as THREE.Material).transparent : false,
    solidDimensions: size.toArray().map(round),
    hasVisibleThickness: size.z >= 0.04,
    contained: fit.fits,
    maxLocalRadius: fit.maxLocalRadius,
  };
});

const motion = group('gumball-machine-motion-pivot');
const sideCrank = group('gumball-machine-side-crank-pivot');
const output = group('gumball-machine-output-capsule-motion-pivot');
const outputLeft = group('gumball-machine-output-capsule-left-shell-pivot');
const outputRight = group('gumball-machine-output-capsule-right-shell-pivot');
const outputToy = group('gumball-machine-output-prize-pivot');
const bursts = Array.from({ length: 3 }, (_, index) => (
  group(`gumball-machine-success-burst-${index + 1}-pivot`)
));
trackedNodes.push(motion, sideCrank, output, outputLeft, outputRight, outputToy, ...bursts);
const baseline = snapshot(trackedNodes);
const failures = capsuleChecks.flatMap((check) => {
  const messages: string[] = [];
  if (!check.capsuleFound) messages.push(`capsule ${check.capsule}: capsule pivot missing`);
  if (!check.prizePivotFound) messages.push(`capsule ${check.capsule}: prize pivot missing`);
  if (check.prizeMeshCount !== 1) messages.push(`capsule ${check.capsule}: expected exactly one prize mesh`);
  if (!check.opaque) messages.push(`capsule ${check.capsule}: prize must remain opaque through the clear shell`);
  if (!check.hasVisibleThickness) messages.push(`capsule ${check.capsule}: prize is too flat to read from oblique views`);
  if (!check.contained) messages.push(`capsule ${check.capsule}: prize exceeds the capsule interior`);
  return messages;
});

// The enlarged transparent globe must now compete with the full body width,
// not read as a small jar perched on the pedestal.
const globeSize = new THREE.Box3().setFromObject(mesh('gumball-machine-transparent-globe-shell')).getSize(new THREE.Vector3());
const baseSize = new THREE.Box3().setFromObject(mesh('gumball-machine-rounded-frustum-base-shell')).getSize(new THREE.Vector3());
const globeToBaseWidth = globeSize.x / baseSize.x;
if (globeToBaseWidth < 0.96) failures.push(`globe is not the visual subject: width ratio ${round(globeToBaseWidth)} < 0.96`);
if (globeSize.y < 1.95) failures.push(`globe is vertically undersized: ${round(globeSize.y)} < 1.95`);

// Dense sampling proves a complete side-crank revolution followed by a real
// reverse rebound instead of a continuous spinner.
let maxCrank = Number.NEGATIVE_INFINITY;
let minCrankAfterPeak = Number.POSITIVE_INFINITY;
let peakSeen = false;
let maxTopImpacts = 0;
for (let step = 0; step <= 80; step += 1) {
  const time = step * 0.02;
  animation.update(time, 1);
  const value = diagnostics().crankRotationRadians;
  if (value > maxCrank) {
    maxCrank = value;
    minCrankAfterPeak = value;
    peakSeen = true;
  } else if (peakSeen) {
    minCrankAfterPeak = Math.min(minCrankAfterPeak, value);
  }
  maxTopImpacts = Math.max(maxTopImpacts, diagnostics().topImpactCapsules);
}
if (maxCrank < Math.PI * 2) failures.push(`side crank never completes a full turn: ${round(maxCrank)} rad`);
if (maxCrank - minCrankAfterPeak < 0.12) failures.push('side crank has no readable reverse rebound after its full turn');
if (maxTopImpacts < 2) failures.push(`capsule frenzy does not drive enough capsules into the globe top: ${maxTopImpacts}`);

animation.update(0.82, 1);
const frenzy = diagnostics();
const frenzySnapshot = snapshot(trackedNodes.slice(0, CAPSULE_COUNT * 2));
const movedCapsules = Array.from({ length: CAPSULE_COUNT }, (_, index) => {
  const capsule = trackedNodes[index * 2];
  return JSON.stringify(frenzySnapshot[capsule.name]) !== JSON.stringify(baseline[capsule.name]);
}).filter(Boolean).length;
if (frenzy.agitatedCapsules !== CAPSULE_COUNT || movedCapsules !== CAPSULE_COUNT) {
  failures.push(`capsule frenzy coverage ${movedCapsules}/${CAPSULE_COUNT}`);
}

animation.update(1.72, 1);
const pause = diagnostics();
if (!pause.selectionPaused || pause.phase !== 'selection-pause') failures.push('selection contrast pause is missing');
const pauseSnapshot = snapshot(trackedNodes.slice(0, CAPSULE_COUNT * 2));
const movingDuringPause = Array.from({ length: CAPSULE_COUNT }, (_, index) => {
  const capsule = trackedNodes[index * 2];
  const current = pauseSnapshot[capsule.name];
  const idle = baseline[capsule.name];
  return current.slice(0, 7).some((value, component) => value !== idle[component]);
}).filter(Boolean).length;
if (movingDuringPause !== 0) failures.push(`${movingDuringPause} capsules still translate/rotate during selection pause`);

animation.update(2.2, 1);
const handoff = diagnostics();
const selected = group(`gumball-machine-capsule-${handoff.selectedCapsuleIndex}-pivot`);
if (selected.visible) failures.push('selected internal capsule remains visible after output handoff (double capsule)');
if (!handoff.outputCapsuleVisible || !output.visible) failures.push('same-language output capsule is missing at handoff');

animation.update(3.2, 1);
const firstBounceHeight = output.position.y;
if (diagnostics().bounceIndex !== 1) failures.push('first bounce phase is not reported');
animation.update(3.56, 1);
const secondBounceHeight = output.position.y;
if (diagnostics().bounceIndex !== 2) failures.push('second bounce phase is not reported');
if (firstBounceHeight <= secondBounceHeight + 0.18) {
  failures.push(`bounce hierarchy is unclear: first=${round(firstBounceHeight)} second=${round(secondBounceHeight)}`);
}
animation.update(3.73, 1);
const rollStartZ = output.position.z;
animation.update(4.04, 1);
const rollEndZ = output.position.z;
if (rollEndZ - rollStartZ < 0.1) failures.push('output capsule does not roll forward before settling');

animation.update(4.4, 1);
const reveal = diagnostics();
if (reveal.shellSeparation < 0.72) failures.push(`shell opening is not exaggerated enough: ${round(reveal.shellSeparation)}`);
if (!reveal.toyVisible || !outputToy.visible) failures.push('toy is not squeezed out of the opened capsule');
if (reveal.visibleSuccessBursts < 2 || reveal.visibleSuccessBursts > 3) {
  failures.push(`success feedback must stay restrained at 2-3 volumetric bursts: ${reveal.visibleSuccessBursts}`);
}

const internalClear = mesh('gumball-machine-capsule-1-clear-upper-shell');
const internalColor = mesh('gumball-machine-capsule-1-pastel-lower-shell');
const internalSeam = mesh('gumball-machine-capsule-1-equator-seam');
const outputClear = mesh('gumball-machine-output-capsule-left-clear-upper-shell');
const outputLower = mesh('gumball-machine-output-capsule-right-clear-upper-shell');
if (outputClear.material !== internalClear.material
  || outputLower.material === internalClear.material
  || (outputLower.material as THREE.Material).transparent) {
  failures.push('output capsule must open into a clear upper hemisphere and opaque colored lower hemisphere');
}

let forbiddenEffects = 0;
let volumetricBursts = 0;
build.root.traverse((object) => {
  if (object instanceof THREE.Sprite || object instanceof THREE.Line) forbiddenEffects += 1;
  if (!(object instanceof THREE.Mesh)) return;
  if (object.geometry instanceof THREE.PlaneGeometry) forbiddenEffects += 1;
  if (!object.name.includes('success-burst-') || !object.name.endsWith('-volumetric-star')) return;
  object.geometry.computeBoundingBox();
  const size = object.geometry.boundingBox?.getSize(new THREE.Vector3());
  if (size && size.x > 0.15 && size.y > 0.15 && size.z > 0.025) volumetricBursts += 1;
});
if (forbiddenEffects !== 0) failures.push(`found ${forbiddenEffects} forbidden Plane/Sprite/Line effects`);
if (volumetricBursts !== 3) failures.push(`expected three volumetric success stars, found ${volumetricBursts}`);

const triangles = triangleCount(build.root);
if (triangles > MAX_TRIANGLES) failures.push(`triangle budget exceeded: ${triangles} > ${MAX_TRIANGLES}`);

animation.stop();
const resetSnapshot = snapshot(trackedNodes);
const exactReset = JSON.stringify(resetSnapshot) === JSON.stringify(baseline);
if (!exactReset) failures.push('stop() does not exactly restore the full capsule/prize performance rig');
if (animation.signal() !== 0) failures.push('animation signal remains active after stop()');

const report = {
  passed: failures.length === 0,
  capsuleCoverage: `${capsuleChecks.filter((check) => check.prizeMeshCount === 1).length}/${CAPSULE_COUNT}`,
  variants: [...new Set(capsuleChecks.map((check) => check.kind).filter(Boolean))],
  globeToBaseWidth: round(globeToBaseWidth),
  globeHeight: round(globeSize.y),
  maxCrankRadians: round(maxCrank),
  crankReboundRadians: round(maxCrank - minCrankAfterPeak),
  maxTopImpacts,
  movedCapsules,
  movingDuringPause,
  firstBounceHeight: round(firstBounceHeight),
  secondBounceHeight: round(secondBounceHeight),
  rollDistance: round(rollEndZ - rollStartZ),
  shellSeparation: round(reveal.shellSeparation),
  visibleSuccessBursts: reveal.visibleSuccessBursts,
  sameLanguageMaterials: outputClear.material === internalClear.material
    && outputLower.material !== internalClear.material
    && !(outputLower.material as THREE.Material).transparent,
  forbiddenEffects,
  volumetricBursts,
  exactReset,
  animationSignalAfterStop: animation.signal(),
  triangles,
  capsuleChecks,
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
