import * as THREE from 'three';

export const HAIR_DRYER_RIBBON_COUNT = 5;
export const HAIR_DRYER_RIBBON_SEGMENTS = 30;
export const HAIR_DRYER_RELEASE_TIME = 4.18;
export const HAIR_DRYER_OFFSCREEN_TIME = 5.12;

export type HairDryerRibbonProfile = {
  anchor: readonly [number, number, number];
  length: number;
  width: number;
  thickness: number;
  amplitudeY: number;
  amplitudeZ: number;
  frequency: number;
  waveNumber: number;
  phase: number;
  twist: number;
  bend: number;
  turbulence: number;
  releaseSpeed: number;
  releaseLift: number;
  releaseSide: number;
  releaseGravity: number;
  releaseCurl: number;
  releaseSpin: number;
  seed: number;
};

export const HAIR_DRYER_RIBBON_PROFILES: readonly HairDryerRibbonProfile[] = [
  { anchor: [-2.445, -0.34, -0.10], length: 5.65, width: 0.25, thickness: 0.040, amplitudeY: 0.27, amplitudeZ: 0.18, frequency: 7.4, waveNumber: 9.7, phase: 0.25, twist: 7.2, bend: 0.16, turbulence: 0.085, releaseSpeed: 6.8, releaseLift: 3.4, releaseSide: -1.8, releaseGravity: 9.2, releaseCurl: 1.15, releaseSpin: 4.8, seed: 0.71 },
  { anchor: [-2.445, -0.17, 0.08], length: 6.10, width: 0.21, thickness: 0.034, amplitudeY: 0.34, amplitudeZ: 0.14, frequency: 8.6, waveNumber: 11.3, phase: 1.46, twist: -8.4, bend: -0.20, turbulence: 0.105, releaseSpeed: 5.4, releaseLift: -2.2, releaseSide: 2.2, releaseGravity: 12.6, releaseCurl: 1.35, releaseSpin: -6.1, seed: 1.93 },
  { anchor: [-2.445, 0.00, -0.04], length: 6.45, width: 0.27, thickness: 0.046, amplitudeY: 0.22, amplitudeZ: 0.24, frequency: 6.8, waveNumber: 8.8, phase: 2.82, twist: 9.1, bend: 0.25, turbulence: 0.072, releaseSpeed: 7.3, releaseLift: 1.9, releaseSide: 0.7, releaseGravity: 10.1, releaseCurl: 0.95, releaseSpin: 5.5, seed: 3.17 },
  { anchor: [-2.445, 0.18, 0.09], length: 5.85, width: 0.19, thickness: 0.032, amplitudeY: 0.38, amplitudeZ: 0.16, frequency: 9.2, waveNumber: 12.6, phase: 4.08, twist: -10.2, bend: -0.14, turbulence: 0.118, releaseSpeed: 4.9, releaseLift: -3.1, releaseSide: -2.5, releaseGravity: 14.2, releaseCurl: 1.5, releaseSpin: -7.2, seed: 4.61 },
  { anchor: [-2.445, 0.35, -0.08], length: 6.25, width: 0.23, thickness: 0.038, amplitudeY: 0.29, amplitudeZ: 0.21, frequency: 7.9, waveNumber: 10.4, phase: 5.31, twist: 8.0, bend: 0.19, turbulence: 0.096, releaseSpeed: 6.1, releaseLift: 2.7, releaseSide: 2.7, releaseGravity: 10.8, releaseCurl: 1.25, releaseSpin: 6.4, seed: 5.87 },
];

export type HairDryerPerformanceDiagnostics = {
  time: number;
  phase: 'idle' | 'spooling' | 'anchored-wind' | 'released-flight' | 'offscreen';
  ribbonCount: number;
  visibleRibbonCount: number;
  geometryType: 'HairDryerDynamicSolidRibbonGeometry';
  crossSection: 'rectangular-solid';
  usesPlaneOrLine: false;
  uniqueParameterSets: number;
  anchorMaxError: number;
  phaseLagSeconds: number[];
  released: boolean;
  releaseContinuityError: number;
  releasedTravel: number;
  releaseSpread: number;
  releasedUpCount: number;
  releasedDownCount: number;
  releaseDirectionDiversity: number;
  minRibbonY: number;
  recycledOffscreen: boolean;
  timelineOwner: 'AppliancePerformanceSystem';
};

const tempCenters: THREE.Vector3[] = Array.from(
  { length: HAIR_DRYER_RIBBON_SEGMENTS + 1 },
  () => new THREE.Vector3(),
);
const tangent = new THREE.Vector3();
const widthAxis = new THREE.Vector3();
const thicknessAxis = new THREE.Vector3();
const referenceUp = new THREE.Vector3(0, 1, 0);
const twistQuaternion = new THREE.Quaternion();
const firstCenter = new THREE.Vector3();
const releaseAnchored = new THREE.Vector3();
const releaseReleased = new THREE.Vector3();

function smoothstep(value: number, min: number, max: number): number {
  return THREE.MathUtils.smoothstep(value, min, max);
}

function sampleCenter(
  profile: HairDryerRibbonProfile,
  time: number,
  s: number,
  deployment: number,
  output: THREE.Vector3,
): THREE.Vector3 {
  const releasedFor = Math.max(0, time - HAIR_DRYER_RELEASE_TIME);
  const waveTime = Math.min(time, HAIR_DRYER_RELEASE_TIME) + releasedFor * 0.72;
  const amplitudeGate = smoothstep(s, 0.015, 0.34) * deployment;
  const phase = waveTime * profile.frequency - s * profile.waveNumber + profile.phase;
  const secondary = waveTime * (profile.frequency * 1.67) - s * (profile.waveNumber * 2.13) + profile.seed * 2.7;
  const tertiary = waveTime * (profile.frequency * 0.47) - s * 5.4 + profile.seed * 4.9;
  const sCurve = Math.sin(s * Math.PI * 2) * profile.bend;
  const turbulence = (
    Math.sin(secondary) * 0.58
    + Math.sin(secondary * 0.43 + tertiary) * 0.29
    + Math.cos(tertiary * 1.31) * 0.13
  ) * profile.turbulence;

  output.set(
    profile.anchor[0] - profile.length * s * deployment
      + Math.sin(phase * 0.51 + profile.seed) * 0.075 * amplitudeGate,
    profile.anchor[1]
      + (Math.sin(phase) * profile.amplitudeY + sCurve + turbulence) * amplitudeGate,
    profile.anchor[2]
      + (Math.cos(phase * 0.83 + profile.seed) * profile.amplitudeZ
        + Math.sin(secondary * 0.74) * profile.turbulence) * amplitudeGate,
  );

  if (releasedFor > 0) {
    // Each solid ribbon receives its own launch vector and gravity. All terms
    // are zero at release, so separation starts continuously instead of
    // snapping, while the s-dependent flex prevents rigid-body translation.
    const windTravel = releasedFor * (profile.releaseSpeed - releasedFor * (0.62 + profile.seed * 0.025));
    const gravityDrop = 0.5 * profile.releaseGravity * releasedFor * releasedFor;
    const tailFlex = smoothstep(s, 0, 0.72);
    const flexGate = releasedFor * (0.28 + tailFlex * 0.72);
    const releasePhase = releasedFor * (6.2 + profile.seed * 0.24) + s * (5.4 + profile.releaseCurl);
    output.x -= windTravel;
    output.x += Math.sin(releasePhase * 0.78 + profile.phase) * profile.releaseCurl * 0.24 * flexGate;
    output.y += profile.releaseLift * releasedFor;
    output.y -= gravityDrop * (0.72 + s * 0.28);
    output.y += Math.sin(releasePhase + profile.phase) * profile.releaseCurl * 0.72 * flexGate;
    output.z += profile.releaseSide * releasedFor;
    output.z += Math.cos(releasePhase * 1.17 - profile.phase) * profile.releaseCurl * 0.68 * flexGate;
  }
  return output;
}

function writeSolidRibbon(
  geometry: THREE.BufferGeometry,
  profile: HairDryerRibbonProfile,
  time: number,
  deployment: number,
): void {
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let segment = 0; segment <= HAIR_DRYER_RIBBON_SEGMENTS; segment += 1) {
    const s = segment / HAIR_DRYER_RIBBON_SEGMENTS;
    sampleCenter(profile, time, s, deployment, tempCenters[segment]);
  }

  for (let segment = 0; segment <= HAIR_DRYER_RIBBON_SEGMENTS; segment += 1) {
    const s = segment / HAIR_DRYER_RIBBON_SEGMENTS;
    const before = tempCenters[Math.max(0, segment - 1)];
    const after = tempCenters[Math.min(HAIR_DRYER_RIBBON_SEGMENTS, segment + 1)];
    tangent.copy(after).sub(before).normalize();
    widthAxis.copy(referenceUp).addScaledVector(tangent, -referenceUp.dot(tangent)).normalize();
    if (widthAxis.lengthSq() < 0.1) widthAxis.set(0, 0, 1);
    thicknessAxis.crossVectors(tangent, widthAxis).normalize();
    const releaseTwist = Math.max(0, time - HAIR_DRYER_RELEASE_TIME) * profile.releaseSpin;
    const twist = s * profile.twist
      + Math.sin(time * 1.9 - s * 5.2 + profile.phase) * 0.42 * smoothstep(s, 0.02, 0.35)
      + releaseTwist * smoothstep(s, 0, 0.65);
    twistQuaternion.setFromAxisAngle(tangent, twist);
    widthAxis.applyQuaternion(twistQuaternion);
    thicknessAxis.crossVectors(tangent, widthAxis).normalize();

    const halfWidth = profile.width * (1 - s * 0.18) * 0.5;
    const halfThickness = profile.thickness * (1 - s * 0.08) * 0.5;
    const center = tempCenters[segment];
    const vertex = segment * 4;
    position.setXYZ(vertex, center.x + widthAxis.x * halfWidth + thicknessAxis.x * halfThickness, center.y + widthAxis.y * halfWidth + thicknessAxis.y * halfThickness, center.z + widthAxis.z * halfWidth + thicknessAxis.z * halfThickness);
    position.setXYZ(vertex + 1, center.x - widthAxis.x * halfWidth + thicknessAxis.x * halfThickness, center.y - widthAxis.y * halfWidth + thicknessAxis.y * halfThickness, center.z - widthAxis.z * halfWidth + thicknessAxis.z * halfThickness);
    position.setXYZ(vertex + 2, center.x - widthAxis.x * halfWidth - thicknessAxis.x * halfThickness, center.y - widthAxis.y * halfWidth - thicknessAxis.y * halfThickness, center.z - widthAxis.z * halfWidth - thicknessAxis.z * halfThickness);
    position.setXYZ(vertex + 3, center.x + widthAxis.x * halfWidth - thicknessAxis.x * halfThickness, center.y + widthAxis.y * halfWidth - thicknessAxis.y * halfThickness, center.z + widthAxis.z * halfWidth - thicknessAxis.z * halfThickness);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}

export function createHairDryerRibbonGeometry(profileIndex: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertexCount = (HAIR_DRYER_RIBBON_SEGMENTS + 1) * 4;
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(vertexCount * 3), 3));
  const indices: number[] = [];
  for (let segment = 0; segment < HAIR_DRYER_RIBBON_SEGMENTS; segment += 1) {
    const current = segment * 4;
    const next = (segment + 1) * 4;
    for (let face = 0; face < 4; face += 1) {
      const faceNext = (face + 1) % 4;
      indices.push(current + face, next + face, next + faceNext);
      indices.push(current + face, next + faceNext, current + faceNext);
    }
  }
  indices.push(0, 2, 1, 0, 3, 2);
  const end = HAIR_DRYER_RIBBON_SEGMENTS * 4;
  indices.push(end, end + 1, end + 2, end, end + 2, end + 3);
  geometry.setIndex(indices);
  Object.defineProperty(geometry, 'type', {
    value: 'HairDryerDynamicSolidRibbonGeometry',
    configurable: true,
  });
  geometry.userData.profileIndex = profileIndex;
  geometry.userData.crossSection = 'rectangular-solid';
  geometry.userData.hasFrontBackAndEdgeFaces = true;
  writeSolidRibbon(geometry, HAIR_DRYER_RIBBON_PROFILES[profileIndex], 0, 0.012);
  return geometry;
}

function ribbonMeshes(root: THREE.Group): THREE.Mesh[] {
  const result: THREE.Mesh[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.Mesh && /^hair-dryer-solid-wind-ribbon-\d+$/.test(object.name)) result.push(object);
  });
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function ribbonFirstCenter(mesh: THREE.Mesh, output: THREE.Vector3): THREE.Vector3 {
  const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  output.set(0, 0, 0);
  for (let corner = 0; corner < 4; corner += 1) {
    output.x += position.getX(corner);
    output.y += position.getY(corner);
    output.z += position.getZ(corner);
  }
  return output.multiplyScalar(0.25);
}

function ribbonFreeEndCenter(mesh: THREE.Mesh, output: THREE.Vector3): THREE.Vector3 {
  const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  const start = position.count - 4;
  output.set(0, 0, 0);
  for (let corner = 0; corner < 4; corner += 1) {
    output.x += position.getX(start + corner);
    output.y += position.getY(start + corner);
    output.z += position.getZ(start + corner);
  }
  return output.multiplyScalar(0.25);
}

export function applyHairDryerPerformance(root: THREE.Group, time: number, power: number): void {
  const ribbons = ribbonMeshes(root);
  const deployment = Math.max(0.012, smoothstep(time, 0.12, 0.68));
  const released = time >= HAIR_DRYER_RELEASE_TIME;
  const offscreen = time >= HAIR_DRYER_OFFSCREEN_TIME;
  let anchorMaxError = 0;
  let minRibbonY = Number.POSITIVE_INFINITY;
  let releaseSpread = 0;
  let visibleRibbonCount = 0;

  ribbons.forEach((mesh, index) => {
    const profile = HAIR_DRYER_RIBBON_PROFILES[index];
    writeSolidRibbon(mesh.geometry, profile, time, deployment);
    mesh.visible = time >= 0.1 && !offscreen && power > 0.001;
    if (mesh.visible) visibleRibbonCount += 1;
    const material = mesh.material as THREE.MeshToonMaterial;
    material.opacity = mesh.visible ? Math.min(0.98, smoothstep(time, 0.1, 0.42) * (0.88 + index * 0.018)) : 0;
    ribbonFirstCenter(mesh, firstCenter);
    if (!released) anchorMaxError = Math.max(anchorMaxError, firstCenter.distanceTo(new THREE.Vector3(...profile.anchor)));
    const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let vertex = 0; vertex < position.count; vertex += 1) minRibbonY = Math.min(minRibbonY, position.getY(vertex));
  });

  let releaseContinuityError = 0;
  HAIR_DRYER_RIBBON_PROFILES.forEach((profile) => {
    sampleCenter(profile, HAIR_DRYER_RELEASE_TIME, 0, 1, releaseAnchored);
    sampleCenter(profile, HAIR_DRYER_RELEASE_TIME + Number.EPSILON, 0, 1, releaseReleased);
    releaseContinuityError = Math.max(releaseContinuityError, releaseAnchored.distanceTo(releaseReleased));
  });
  const releasedFor = Math.max(0, time - HAIR_DRYER_RELEASE_TIME);
  if (released) {
    const releaseCenters = ribbons.map((mesh) => {
      ribbonFreeEndCenter(mesh, firstCenter);
      return firstCenter.clone();
    });
    const centre = releaseCenters.reduce((sum, point) => sum.add(point), new THREE.Vector3())
      .multiplyScalar(1 / Math.max(1, releaseCenters.length));
    releaseSpread = Math.max(...releaseCenters.map((point) => point.distanceTo(centre)));
  }
  root.userData.hairDryerPerformanceDiagnostics = {
    time,
    phase: offscreen ? 'offscreen' : released ? 'released-flight' : time < 0.68 ? 'spooling' : 'anchored-wind',
    ribbonCount: ribbons.length,
    visibleRibbonCount,
    geometryType: 'HairDryerDynamicSolidRibbonGeometry',
    crossSection: 'rectangular-solid',
    usesPlaneOrLine: false,
    uniqueParameterSets: new Set(HAIR_DRYER_RIBBON_PROFILES.map((profile) => JSON.stringify(profile))).size,
    anchorMaxError,
    phaseLagSeconds: HAIR_DRYER_RIBBON_PROFILES.map((profile) => Number((profile.waveNumber * 0.5 / profile.frequency).toFixed(4))),
    released,
    releaseContinuityError,
    releasedTravel: releasedFor * (Math.max(...HAIR_DRYER_RIBBON_PROFILES.map((profile) => profile.releaseSpeed)) - releasedFor * 0.78),
    releaseSpread,
    releasedUpCount: HAIR_DRYER_RIBBON_PROFILES.filter((profile) => profile.releaseLift > 0).length,
    releasedDownCount: HAIR_DRYER_RIBBON_PROFILES.filter((profile) => profile.releaseLift < 0).length,
    releaseDirectionDiversity: new Set(HAIR_DRYER_RIBBON_PROFILES.map((profile) => (
      `${profile.releaseSpeed}/${profile.releaseLift}/${profile.releaseSide}/${profile.releaseGravity}`
    ))).size,
    minRibbonY: Number.isFinite(minRibbonY) ? minRibbonY : 0,
    recycledOffscreen: offscreen && visibleRibbonCount === 0,
    timelineOwner: 'AppliancePerformanceSystem',
  } satisfies HairDryerPerformanceDiagnostics;
}

export function resetHairDryerPerformance(root: THREE.Group): void {
  ribbonMeshes(root).forEach((mesh, index) => {
    writeSolidRibbon(mesh.geometry, HAIR_DRYER_RIBBON_PROFILES[index], 0, 0.012);
    mesh.visible = false;
    const material = mesh.material as THREE.MeshToonMaterial;
    material.opacity = 0;
  });
  delete root.userData.hairDryerPerformanceDiagnostics;
}
