import * as THREE from 'three';
import type { PoweredAnimationDriver } from '../poweredAnimation';

const TAU = Math.PI * 2;

export const SMART_BIN_TIMELINE = Object.freeze({
  sensorStart: 0.08,
  lidOpenStart: 0.18,
  lidOpenEnd: 0.58,
  firstLaunch: 0.72,
  lastLaunch: 3.24,
  lidCloseStart: 4.46,
  lidCloseEnd: 4.88,
  settleEnd: 5.2,
  lidAngle: 1.2,
  cavityDepth: 0.82,
  trashCount: 8,
});

export const SMART_BIN_TRASH_TYPES = [
  'paper-ball', 'banana-peel', 'aluminum-can', 'plastic-bottle',
  'apple-core', 'coffee-cup', 'chip-bag', 'takeout-box',
] as const;

export type SmartBinTrashType = typeof SMART_BIN_TRASH_TYPES[number];
export type SmartBinPhase = 'idle' | 'detecting' | 'catching' | 'impacting' | 'closing' | 'complete';

export type SmartBinPerformanceDiagnostics = {
  time: number;
  phase: SmartBinPhase;
  lidAngle: number;
  sensorStrength: number;
  visibleTrash: number;
  receivedTrash: number;
  maximumBodySink: number;
  cavityDepth: number;
  directions: number;
  trashTypes: readonly SmartBinTrashType[];
  volumetricOnly: true;
  effectOwner: 'smart-bin-model-rig';
  timelineOwner: 'SmartBinPerformance';
  sharedSpectacleEffects: 'must-be-disabled-during-integration';
};

export type SmartBinPerformanceController = PoweredAnimationDriver & {
  apply(time: number, power: number): void;
  reset(): void;
  diagnostics: SmartBinPerformanceDiagnostics;
};

type Pose = {
  object: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  visible: boolean;
};

type TrashFlight = {
  type: SmartBinTrashType;
  pivot: THREE.Group;
  launch: number;
  duration: number;
  start: THREE.Vector3;
  controlA: THREE.Vector3;
  controlB: THREE.Vector3;
  mouth: THREE.Vector3;
  landing: THREE.Vector3;
  spin: THREE.Vector3;
};

const PATHS: ReadonlyArray<Omit<TrashFlight, 'pivot'>> = [
  { type: 'paper-ball', launch: 0.72, duration: 1.62, start: new THREE.Vector3(-10.8, 2.1, 1.8), controlA: new THREE.Vector3(-7.6, 7.8, 1.15), controlB: new THREE.Vector3(-2.4, 6.2, 0.34), mouth: new THREE.Vector3(-0.18, 1.23, 0.04), landing: new THREE.Vector3(-0.12, 0.42, 0.02), spin: new THREE.Vector3(5.2, 3.4, 7.1) },
  { type: 'banana-peel', launch: 1.08, duration: 1.70, start: new THREE.Vector3(9.8, 3.0, 0.9), controlA: new THREE.Vector3(6.8, 8.1, 0.58), controlB: new THREE.Vector3(2.2, 6.4, -0.08), mouth: new THREE.Vector3(0.22, 1.22, -0.04), landing: new THREE.Vector3(0.18, 0.38, -0.05), spin: new THREE.Vector3(1.5, 2.2, 2.8) },
  { type: 'aluminum-can', launch: 1.44, duration: 1.58, start: new THREE.Vector3(-8.8, 1.7, -2.4), controlA: new THREE.Vector3(-6.2, 7.4, -1.42), controlB: new THREE.Vector3(-2.0, 6.0, -0.38), mouth: new THREE.Vector3(-0.24, 1.23, -0.08), landing: new THREE.Vector3(-0.20, 0.38, -0.10), spin: new THREE.Vector3(0.5, 1.1, 12.8) },
  { type: 'plastic-bottle', launch: 1.80, duration: 1.65, start: new THREE.Vector3(11.2, 2.2, -1.6), controlA: new THREE.Vector3(7.9, 8.3, -1.02), controlB: new THREE.Vector3(2.6, 6.5, -0.26), mouth: new THREE.Vector3(0.26, 1.24, 0), landing: new THREE.Vector3(0.22, 0.40, 0.05), spin: new THREE.Vector3(3.1, 1.6, 4.2) },
  { type: 'apple-core', launch: 2.16, duration: 1.54, start: new THREE.Vector3(-9.5, 4.0, 2.8), controlA: new THREE.Vector3(-6.8, 8.8, 1.72), controlB: new THREE.Vector3(-2.1, 6.7, 0.46), mouth: new THREE.Vector3(-0.08, 1.25, 0.10), landing: new THREE.Vector3(-0.05, 0.39, 0.08), spin: new THREE.Vector3(4.6, 5.3, 2.1) },
  { type: 'coffee-cup', launch: 2.52, duration: 1.60, start: new THREE.Vector3(8.9, 3.8, 2.5), controlA: new THREE.Vector3(6.3, 8.4, 1.58), controlB: new THREE.Vector3(2.0, 6.3, 0.44), mouth: new THREE.Vector3(0.12, 1.24, 0.10), landing: new THREE.Vector3(0.10, 0.38, 0.08), spin: new THREE.Vector3(5.4, 1.2, 3.6) },
  { type: 'chip-bag', launch: 2.88, duration: 1.68, start: new THREE.Vector3(-11.4, 2.9, 0.2), controlA: new THREE.Vector3(-8.0, 8.5, 0.14), controlB: new THREE.Vector3(-2.7, 6.5, 0.03), mouth: new THREE.Vector3(-0.18, 1.25, 0), landing: new THREE.Vector3(-0.15, 0.39, 0), spin: new THREE.Vector3(2.2, 4.5, 3.2) },
  { type: 'takeout-box', launch: 3.24, duration: 1.60, start: new THREE.Vector3(10.4, 3.2, -0.5), controlA: new THREE.Vector3(7.3, 8.0, -0.31), controlB: new THREE.Vector3(2.4, 6.1, -0.06), mouth: new THREE.Vector3(0.16, 1.25, 0), landing: new THREE.Vector3(0.14, 0.37, 0), spin: new THREE.Vector3(3.8, 5.1, 6.4) },
];

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function cubic(target: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, t: number): void {
  const inverse = 1 - t;
  target.copy(a).multiplyScalar(inverse ** 3)
    .addScaledVector(b, 3 * inverse * inverse * t)
    .addScaledVector(c, 3 * inverse * t * t)
    .addScaledVector(d, t ** 3);
}

function pulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function phaseAt(time: number, power: number, received: number): SmartBinPhase {
  if (power <= 0.001 || time <= 0) return 'idle';
  if (time < SMART_BIN_TIMELINE.firstLaunch) return 'detecting';
  if (time < 3.88) return 'catching';
  if (received < SMART_BIN_TIMELINE.trashCount) return 'impacting';
  if (time < SMART_BIN_TIMELINE.lidCloseEnd) return 'closing';
  return 'complete';
}

export function createSmartBinPerformance(root: THREE.Group): SmartBinPerformanceController {
  const body = root.getObjectByName('smart-bin-body-pivot');
  const lid = root.getObjectByName('smart-bin-lid-hinge-pivot');
  const sensorGlow = root.getObjectByName('smart-bin-sensor-glow-strip') as THREE.Mesh | undefined;
  const sensorWindow = root.getObjectByName('smart-bin-infrared-sensor-window') as THREE.Mesh | undefined;
  const flights: TrashFlight[] = PATHS.map((path) => {
    const pivot = root.getObjectByName(`smart-bin-trash-${path.type}-pivot`);
    if (!(pivot instanceof THREE.Group)) throw new Error(`Missing smart-bin trash rig: ${path.type}`);
    return { ...path, pivot };
  });
  const animatedSet = new Set<THREE.Object3D>();
  [body, lid, sensorGlow, sensorWindow].forEach((object) => { if (object) animatedSet.add(object); });
  flights.forEach(({ pivot }) => pivot.traverse((object) => animatedSet.add(object)));
  const animated = [...animatedSet];
  const poses: Pose[] = animated.map((object) => ({
    object,
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
    visible: object.visible,
  }));
  const sensorMaterials = [sensorGlow, sensorWindow]
    .flatMap((mesh) => mesh ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [])
    .map((material) => {
      const toon = material as THREE.MeshToonMaterial;
      return { material: toon, emissive: toon.emissive.clone(), intensity: toon.emissiveIntensity };
    });
  const sample = new THREE.Vector3();
  let signalValue = 0;
  const diagnostics: SmartBinPerformanceDiagnostics = {
    time: 0,
    phase: 'idle',
    lidAngle: 0,
    sensorStrength: 0,
    visibleTrash: 0,
    receivedTrash: 0,
    maximumBodySink: 0,
    cavityDepth: SMART_BIN_TIMELINE.cavityDepth,
    directions: 8,
    trashTypes: SMART_BIN_TRASH_TYPES,
    volumetricOnly: true,
    effectOwner: 'smart-bin-model-rig',
    timelineOwner: 'SmartBinPerformance',
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
  };
  root.userData.smartBinPerformance = diagnostics;

  const restore = (): void => {
    poses.forEach((pose) => {
      pose.object.position.copy(pose.position);
      pose.object.quaternion.copy(pose.quaternion);
      pose.object.scale.copy(pose.scale);
      pose.object.visible = pose.visible;
    });
    sensorMaterials.forEach(({ material, emissive, intensity }) => {
      material.emissive.copy(emissive);
      material.emissiveIntensity = intensity;
    });
  };

  const reset = (): void => {
    restore();
    flights.forEach(({ pivot }) => { pivot.visible = false; });
    if (sensorGlow) sensorGlow.visible = false;
    signalValue = 0;
    Object.assign(diagnostics, {
      time: 0,
      phase: 'idle',
      lidAngle: 0,
      sensorStrength: 0,
      visibleTrash: 0,
      receivedTrash: 0,
      maximumBodySink: 0,
    });
  };

  const apply = (rawTime: number, rawPower: number): void => {
    restore();
    const time = Math.max(0, rawTime);
    const power = clamp01(rawPower);
    const open = THREE.MathUtils.smoothstep(time, SMART_BIN_TIMELINE.lidOpenStart, SMART_BIN_TIMELINE.lidOpenEnd);
    const close = THREE.MathUtils.smoothstep(time, SMART_BIN_TIMELINE.lidCloseStart, SMART_BIN_TIMELINE.lidCloseEnd);
    const lidAngle = SMART_BIN_TIMELINE.lidAngle * open * (1 - close) * power;
    const sensorStrength = THREE.MathUtils.smoothstep(time, SMART_BIN_TIMELINE.sensorStart, 0.32)
      * (1 - THREE.MathUtils.smoothstep(time, 4.42, 4.92)) * power;
    if (lid) lid.rotation.x -= lidAngle;
    if (sensorGlow) sensorGlow.visible = sensorStrength > 0.01;
    sensorMaterials.forEach(({ material }) => {
      material.emissive.setHex(0xff5278);
      material.emissiveIntensity = sensorStrength * 2.2;
    });

    let visibleTrash = 0;
    let receivedTrash = 0;
    let maximumBodySink = 0;
    flights.forEach((flight, index) => {
      const progress = (time - flight.launch) / flight.duration;
      const impactTime = flight.launch + flight.duration * 0.78;
      const sink = pulse(time, impactTime - 0.045, impactTime + 0.035, impactTime + 0.14) * (0.035 + index % 3 * 0.006) * power;
      const rebound = pulse(time, impactTime + 0.10, impactTime + 0.16, impactTime + 0.24) * 0.015 * power;
      maximumBodySink = Math.max(maximumBodySink, sink);
      if (body) body.position.y += rebound - sink;
      if (progress < 0 || progress >= 1 || power <= 0.001) {
        flight.pivot.visible = false;
        if (progress >= 1) receivedTrash += 1;
        return;
      }
      flight.pivot.visible = true;
      visibleTrash += 1;
      if (progress < 0.72) {
        cubic(sample, flight.start, flight.controlA, flight.controlB, flight.mouth, progress / 0.72);
      } else {
        const drop = clamp01((progress - 0.72) / 0.28);
        sample.copy(flight.mouth).lerp(flight.landing, drop * drop);
        if (flight.type === 'paper-ball') sample.y += Math.sin(drop * Math.PI * 2) * 0.13 * (1 - drop);
        if (flight.type === 'banana-peel') sample.x += Math.sin(drop * Math.PI) * 0.08;
      }
      flight.pivot.position.copy(sample);
      flight.pivot.rotation.set(
        flight.spin.x * progress,
        flight.spin.y * progress,
        flight.spin.z * progress,
      );
      if (flight.type === 'aluminum-can') flight.pivot.rotation.z += progress * TAU * 2;
      if (flight.type === 'plastic-bottle') flight.pivot.rotation.y += Math.sin(progress * TAU) * 0.55;
      if (flight.type === 'banana-peel') {
        flight.pivot.children.forEach((child, childIndex) => {
          if (child.name.includes('curved-lobe')) child.rotation.z += Math.sin(progress * Math.PI + childIndex) * 0.34;
        });
      }
      if (flight.type === 'chip-bag') flight.pivot.scale.set(1 + Math.sin(progress * TAU * 3) * 0.08, 1 - Math.sin(progress * TAU * 3) * 0.12, 1.05);
      if (flight.type === 'takeout-box') flight.pivot.rotation.x += Math.sin(progress * Math.PI) * 1.2;
    });

    const finalBounce = pulse(time, 4.36, 4.46, 4.62) * power;
    if (body) body.position.y += finalBounce * 0.025;
    if (lid) lid.rotation.z += Math.sin(time * 24) * 0.012 * finalBounce;
    signalValue = Math.max(sensorStrength, lidAngle / SMART_BIN_TIMELINE.lidAngle, maximumBodySink * 18);
    Object.assign(diagnostics, {
      time,
      phase: phaseAt(time, power, receivedTrash),
      lidAngle,
      sensorStrength,
      visibleTrash,
      receivedTrash,
      maximumBodySink,
    });
  };

  reset();
  return { update: apply, stop: reset, signal: () => signalValue, apply, reset, diagnostics };
}
