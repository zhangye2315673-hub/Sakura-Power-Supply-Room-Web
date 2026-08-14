import * as THREE from 'three';
import { createHairDryerModel } from '../src/appliances/models/hairDryer';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import {
  HAIR_DRYER_RELEASE_TIME,
  HAIR_DRYER_RIBBON_COUNT,
  HAIR_DRYER_RIBBON_PROFILES,
  type HairDryerPerformanceDiagnostics,
} from '../src/appliances/performance/HairDryerPerformance';

const build = createHairDryerModel({ id: 'hair-dryer', accent: 0xe8a7b7 });
const animation = createApplianceMechanicalAnimation('hair-dryer', build.root);
animation.stop();

function ribbons(): THREE.Mesh[] {
  const result: THREE.Mesh[] = [];
  build.root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.name.startsWith('hair-dryer-solid-wind-ribbon-')) result.push(object);
  });
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function legacyEffectNames(): string[] {
  const names: string[] = [];
  build.root.traverse((object) => {
    if (/blown-mint-strand|warm-airflow/.test(object.name)) names.push(object.name);
  });
  return names;
}

function geometrySnapshot(): string {
  return JSON.stringify(ribbons().map((mesh) => Array.from(
    (mesh.geometry.getAttribute('position') as THREE.BufferAttribute).array,
  )));
}

function firstCenter(mesh: THREE.Mesh): THREE.Vector3 {
  const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  const result = new THREE.Vector3();
  for (let corner = 0; corner < 4; corner += 1) {
    result.x += position.getX(corner);
    result.y += position.getY(corner);
    result.z += position.getZ(corner);
  }
  return result.multiplyScalar(0.25);
}

function freeEndCenter(mesh: THREE.Mesh): THREE.Vector3 {
  const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  const start = position.count - 4;
  const result = new THREE.Vector3();
  for (let corner = 0; corner < 4; corner += 1) {
    result.x += position.getX(start + corner);
    result.y += position.getY(start + corner);
    result.z += position.getZ(start + corner);
  }
  return result.multiplyScalar(0.25);
}

function maxGeometryDelta(before: readonly number[][], after: readonly number[][]): number {
  let max = 0;
  before.forEach((values, ribbonIndex) => values.forEach((value, index) => {
    max = Math.max(max, Math.abs(value - after[ribbonIndex][index]));
  }));
  return max;
}

const ribbonMeshes = ribbons();
const initialGeometry = geometrySnapshot();
animation.update(3.7, 1);
const anchored = build.root.userData.hairDryerPerformanceDiagnostics as HairDryerPerformanceDiagnostics;
const anchoredFreeEnds = ribbonMeshes.map((mesh) => {
  const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  const start = position.count - 4;
  return new THREE.Vector3(
    (position.getX(start) + position.getX(start + 1) + position.getX(start + 2) + position.getX(start + 3)) * 0.25,
    (position.getY(start) + position.getY(start + 1) + position.getY(start + 2) + position.getY(start + 3)) * 0.25,
    (position.getZ(start) + position.getZ(start + 1) + position.getZ(start + 2) + position.getZ(start + 3)) * 0.25,
  );
});

animation.update(HAIR_DRYER_RELEASE_TIME - 0.00001, 1);
const justBeforeRelease = ribbonMeshes.map((mesh) => Array.from(
  (mesh.geometry.getAttribute('position') as THREE.BufferAttribute).array,
));
animation.update(HAIR_DRYER_RELEASE_TIME + 0.00001, 1);
const justAfterRelease = ribbonMeshes.map((mesh) => Array.from(
  (mesh.geometry.getAttribute('position') as THREE.BufferAttribute).array,
));
const measuredReleaseDelta = maxGeometryDelta(justBeforeRelease, justAfterRelease);
const releaseStartFreeEnds = ribbonMeshes.map(freeEndCenter);

animation.update(HAIR_DRYER_RELEASE_TIME + 0.14, 1);
const earlyReleasedFreeEnds = ribbonMeshes.map(freeEndCenter);
const earlyVerticalDeltas = earlyReleasedFreeEnds.map((point, index) => point.y - releaseStartFreeEnds[index].y);
const earlyUpCount = earlyVerticalDeltas.filter((value) => value > 0.08).length;
const earlyDownCount = earlyVerticalDeltas.filter((value) => value < -0.08).length;
let earlyPairwiseSpread = 0;
earlyReleasedFreeEnds.forEach((point, index) => {
  earlyReleasedFreeEnds.slice(index + 1).forEach((other) => {
    earlyPairwiseSpread = Math.max(earlyPairwiseSpread, point.distanceTo(other));
  });
});

animation.update(4.55, 1);
const released = build.root.userData.hairDryerPerformanceDiagnostics as HairDryerPerformanceDiagnostics;
const releasedAnchorTravel = ribbonMeshes.map((mesh, index) => (
  firstCenter(mesh).distanceTo(new THREE.Vector3(...HAIR_DRYER_RIBBON_PROFILES[index].anchor))
));

animation.update(5.12, 0.14);
const offscreen = build.root.userData.hairDryerPerformanceDiagnostics as HairDryerPerformanceDiagnostics;
animation.stop();

const result = {
  ribbonCount: ribbonMeshes.length,
  allowedRibbonCount: HAIR_DRYER_RIBBON_COUNT,
  oldEffectsPhysicallyRemoved: legacyEffectNames().length === 0,
  noPlaneOrLine: ribbonMeshes.every((mesh) => (
    !(mesh instanceof THREE.Line)
    && mesh.geometry.type !== 'PlaneGeometry'
    && mesh.geometry.type === 'HairDryerDynamicSolidRibbonGeometry'
  )),
  solidCrossSections: ribbonMeshes.every((mesh) => (
    mesh.geometry.userData.crossSection === 'rectangular-solid'
    && mesh.geometry.userData.hasFrontBackAndEdgeFaces === true
  )),
  uniqueParameterSets: new Set(HAIR_DRYER_RIBBON_PROFILES.map((profile) => JSON.stringify(profile))).size,
  uniqueAnchoredFreeEnds: new Set(anchoredFreeEnds.map((point) => point.toArray().map((value) => value.toFixed(4)).join(','))).size,
  anchoredPhase: anchored.phase,
  anchoredVisibleCount: anchored.visibleRibbonCount,
  anchorMaxError: anchored.anchorMaxError,
  positivePropagationLags: anchored.phaseLagSeconds.every((lag) => lag > 0),
  releaseContinuityContractError: released.releaseContinuityError,
  measuredReleaseDelta,
  earlyVerticalDeltas,
  earlyUpCount,
  earlyDownCount,
  earlyPairwiseSpread,
  releasedPhase: released.phase,
  releasedAnchorTravelMin: Math.min(...releasedAnchorTravel),
  releasedTravel: released.releasedTravel,
  releaseSpread: released.releaseSpread,
  diagnosticUpCount: released.releasedUpCount,
  diagnosticDownCount: released.releasedDownCount,
  releaseDirectionDiversity: released.releaseDirectionDiversity,
  offscreenPhase: offscreen.phase,
  offscreenMinY: offscreen.minRibbonY,
  recycledOffscreen: offscreen.recycledOffscreen,
  exactGeometryReset: geometrySnapshot() === initialGeometry,
  signalAfterStop: animation.signal(),
};

console.log(JSON.stringify(result, null, 2));
if (
  result.ribbonCount !== 5
  || result.allowedRibbonCount !== 5
  || !result.oldEffectsPhysicallyRemoved
  || !result.noPlaneOrLine
  || !result.solidCrossSections
  || result.uniqueParameterSets !== 5
  || result.uniqueAnchoredFreeEnds !== 5
  || result.anchoredPhase !== 'anchored-wind'
  || result.anchoredVisibleCount !== 5
  || result.anchorMaxError > 0.0001
  || !result.positivePropagationLags
  || result.releaseContinuityContractError > 0.000001
  || result.measuredReleaseDelta > 0.001
  || result.earlyUpCount < 2
  || result.earlyDownCount < 2
  || result.earlyPairwiseSpread < 0.55
  || result.releasedPhase !== 'released-flight'
  || result.releasedAnchorTravelMin < 1.5
  || result.releasedTravel < 1.5
  || result.releaseSpread < 1
  || result.diagnosticUpCount < 2
  || result.diagnosticDownCount < 2
  || result.releaseDirectionDiversity !== 5
  || result.offscreenPhase !== 'offscreen'
  || result.offscreenMinY > -5
  || !result.recycledOffscreen
  || !result.exactGeometryReset
  || result.signalAfterStop !== 0
) process.exit(1);
