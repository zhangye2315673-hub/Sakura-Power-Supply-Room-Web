import * as THREE from 'three';

export type StandMixerPerformancePhase =
  | 'idle'
  | 'dial-start'
  | 'slow-whisk'
  | 'acceleration'
  | 'overspeed'
  | 'wind-down'
  | 'inertia-settle'
  | 'settled';

export type StandMixerPerformanceDiagnostics = {
  time: number;
  phase: StandMixerPerformancePhase;
  dialRotation: number;
  beaterAngularVelocity: number;
  planetaryAngularVelocity: number;
  bowlSwingRadians: number;
  bowlSwingAmplitude: number;
  bowlShake: number;
  bowlHop: number;
  machineShake: number;
  vortexStrength: number;
  peakStrength: number;
  visiblePullArcs: number;
  visibleLargeDollops: number;
  visibleDroplets: number;
  returnedLiquidBodies: number;
  run: number;
  overspeed: number;
  activeDrops: number;
  activeSplats: number;
  shake: number;
  timelineOwner: 'AppliancePerformanceSystem';
  effectOwner: 'stand-mixer-model-rig';
  sharedSpectacleEffects: 'disabled';
  forbiddenPrimitives: readonly ['PlaneGeometry', 'Sprite', 'Line'];
};

const SLOW_START = 0.28;
const ACCEL_START = 0.62;
const HIGH_SPEED_START = 1.25;
const DECEL_START = 4.1;
const SPIN_END = 4.72;
const ACTIVE_END = 5.2;
const SLOW_SPEED = 5.5;
const HIGH_SPEED = 34;

function wrap(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function angularVelocityAt(time: number): number {
  if (time < SLOW_START || time >= SPIN_END) return 0;
  if (time < ACCEL_START) return SLOW_SPEED;
  if (time < HIGH_SPEED_START) {
    const progress = (time - ACCEL_START) / (HIGH_SPEED_START - ACCEL_START);
    return THREE.MathUtils.lerp(SLOW_SPEED, HIGH_SPEED, progress);
  }
  if (time < DECEL_START) return HIGH_SPEED;
  const progress = (time - DECEL_START) / (SPIN_END - DECEL_START);
  return THREE.MathUtils.lerp(HIGH_SPEED, 0, THREE.MathUtils.clamp(progress, 0, 1));
}

/** Integral of angularVelocityAt(), keeping the sampled rig deterministic. */
function rotationPhaseAt(time: number): number {
  if (time <= SLOW_START) return 0;
  const slowDuration = ACCEL_START - SLOW_START;
  const accelDuration = HIGH_SPEED_START - ACCEL_START;
  const highDuration = DECEL_START - HIGH_SPEED_START;
  const slowPhase = SLOW_SPEED * slowDuration;
  const accelPhase = (SLOW_SPEED + HIGH_SPEED) * 0.5 * accelDuration;
  const highPhase = HIGH_SPEED * highDuration;

  if (time <= ACCEL_START) return SLOW_SPEED * (time - SLOW_START);
  if (time <= HIGH_SPEED_START) {
    const elapsed = time - ACCEL_START;
    const acceleration = (HIGH_SPEED - SLOW_SPEED) / accelDuration;
    return slowPhase + SLOW_SPEED * elapsed + 0.5 * acceleration * elapsed * elapsed;
  }
  if (time <= DECEL_START) return slowPhase + accelPhase + HIGH_SPEED * (time - HIGH_SPEED_START);
  if (time <= SPIN_END) {
    const elapsed = time - DECEL_START;
    const deceleration = HIGH_SPEED / (SPIN_END - DECEL_START);
    return slowPhase + accelPhase + highPhase
      + HIGH_SPEED * elapsed - 0.5 * deceleration * elapsed * elapsed;
  }
  return slowPhase + accelPhase + highPhase + HIGH_SPEED * (SPIN_END - DECEL_START) * 0.5;
}

function phaseAt(time: number, power: number): StandMixerPerformancePhase {
  if (power <= 0.01) return 'idle';
  if (time < SLOW_START) return 'dial-start';
  if (time < ACCEL_START) return 'slow-whisk';
  if (time < HIGH_SPEED_START) return 'acceleration';
  if (time < DECEL_START) return 'overspeed';
  if (time < SPIN_END) return 'wind-down';
  if (time < ACTIVE_END) return 'inertia-settle';
  return 'settled';
}

function resetDiagnostics(root: THREE.Group): void {
  const diagnostics: StandMixerPerformanceDiagnostics = {
    time: 0,
    phase: 'idle',
    dialRotation: 0,
    beaterAngularVelocity: 0,
    planetaryAngularVelocity: 0,
    bowlSwingRadians: 0,
    bowlSwingAmplitude: 0,
    bowlShake: 0,
    bowlHop: 0,
    machineShake: 0,
    vortexStrength: 0,
    peakStrength: 0,
    visiblePullArcs: 0,
    visibleLargeDollops: 0,
    visibleDroplets: 0,
    returnedLiquidBodies: 0,
    run: 0,
    overspeed: 0,
    activeDrops: 0,
    activeSplats: 0,
    shake: 0,
    timelineOwner: 'AppliancePerformanceSystem',
    effectOwner: 'stand-mixer-model-rig',
    sharedSpectacleEffects: 'disabled',
    forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
  };
  root.userData.standMixerPerformanceDiagnostics = diagnostics;
  root.userData.standMixerAnimation = diagnostics;
}

/**
 * Mixer-only authored performance. ApplianceMechanics restores the captured
 * baseline before each sample; this module adds deterministic offsets to the
 * model-owned action rig used by both the live game and the gallery preview.
 */
export function applyStandMixerPerformance(root: THREE.Group, time: number, power: number): void {
  const p = THREE.MathUtils.clamp(power, 0, 1);
  const powered = p > 0.01 ? 1 : 0;
  const node = <T extends THREE.Object3D = THREE.Object3D>(name: string): T | null => (
    root.getObjectByName(name) as T | undefined
  ) ?? null;

  const waveRidges: THREE.Object3D[] = [];
  const pullArcs: THREE.Object3D[] = [];
  const dollops: THREE.Object3D[] = [];
  const droplets: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (object.name.startsWith('stand-mixer-mixture-wave-ridge-')) waveRidges.push(object);
    else if (object.name.startsWith('stand-mixer-liquid-pull-arc-')) pullArcs.push(object);
    else if (object.name.startsWith('stand-mixer-volumetric-cream-dollop-')) dollops.push(object);
    else if (object.name.startsWith('stand-mixer-volumetric-liquid-droplet-')) droplets.push(object);
  });

  const dialProgress = THREE.MathUtils.smoothstep(time, 0.035, 0.3)
    * (1 - THREE.MathUtils.smoothstep(time, 4.5, 4.96)) * powered;
  const dialRotation = -1.08 * dialProgress;
  const dial = node('stand-mixer-front-speed-dial-pivot');
  if (dial) dial.rotation.z += dialRotation;

  const beaterAngularVelocity = angularVelocityAt(time) * powered;
  const planetaryAngularVelocity = beaterAngularVelocity * 0.42;
  // First integrate the physical deceleration. Once velocity reaches zero,
  // return only the remaining wrapped angle along the shortest path. Fading
  // the full accumulated phase would visibly reverse dozens of rotations.
  const terminalPhase = rotationPhaseAt(SPIN_END);
  const terminalOffset = Math.atan2(Math.sin(terminalPhase), Math.cos(terminalPhase));
  const returnProgress = THREE.MathUtils.smootherstep(time, SPIN_END, ACTIVE_END);
  const rotationPhase = (
    time <= SPIN_END
      ? rotationPhaseAt(time)
      : terminalOffset * (1 - returnProgress)
  ) * powered;
  const planetary = node('stand-mixer-planetary-pivot');
  const beater = node('stand-mixer-beater-spin-pivot');
  if (planetary) planetary.rotation.y += rotationPhase * 0.42;
  if (beater) beater.rotation.y -= rotationPhase;

  const run = THREE.MathUtils.smoothstep(time, SLOW_START, 0.82)
    * (1 - THREE.MathUtils.smoothstep(time, 4.18, SPIN_END)) * powered;
  const overspeed = THREE.MathUtils.smoothstep(time, 1.08, 1.65)
    * (1 - THREE.MathUtils.smoothstep(time, 3.98, 4.36)) * powered;
  const inertia = THREE.MathUtils.smoothstep(time, 4.08, 4.36)
    * (1 - THREE.MathUtils.smoothstep(time, 4.98, 5.16)) * powered;

  const bowlSwingAmplitude = (0.055 + overspeed * 0.085) * run + inertia * 0.045;
  const bowlSwingRadians = Math.sin(time * 20.8) * bowlSwingAmplitude
    + Math.sin(time * 12.1 + 0.7) * (0.018 + overspeed * 0.02) * run;
  const bowlPitch = Math.sin(time * 17.2 + 1.15) * (0.025 + overspeed * 0.032) * run
    + Math.sin(time * 8.6) * 0.026 * inertia;
  const bowlShakeAmplitude = (0.025 + overspeed * 0.052) * run + inertia * 0.024;
  const bowlShake = Math.sin(time * 32.5 + 0.4) * bowlShakeAmplitude;
  const bowlHop = Math.abs(Math.sin(time * 27.8 + 0.6))
    * (0.014 + overspeed * 0.035) * run
    + Math.abs(Math.sin(time * 12.4)) * 0.018 * inertia;

  const machineShake = ((0.018 + overspeed * 0.034) * run + inertia * 0.016) * powered;
  root.position.x += Math.sin(time * 20.8 + 0.12) * machineShake;
  root.position.z += Math.sin(time * 14.6 + 1.1) * machineShake * 0.38;
  root.rotation.z += Math.sin(time * 20.8 + 0.38) * machineShake * 0.52;
  root.rotation.x += Math.sin(time * 14.6 + 0.72) * machineShake * 0.24;

  const bowl = node('stand-mixer-bowl-pivot');
  if (bowl) {
    bowl.rotation.z += bowlSwingRadians;
    bowl.rotation.x += bowlPitch;
    bowl.position.x += bowlShake;
    bowl.position.z += Math.sin(time * 29.3) * bowlShakeAmplitude * 0.42;
    bowl.position.y += bowlHop;
  }

  // Local counter-torque supplements the whole-machine response while the
  // bowl remains the strongest moving part.
  const base = node('stand-mixer-base-pivot');
  if (base) {
    base.position.x -= Math.sin(time * 20.8) * (0.014 + overspeed * 0.012) * run;
    base.rotation.z -= Math.sin(time * 20.8) * (0.008 + overspeed * 0.008) * run;
  }
  const head = node('stand-mixer-motor-head-pivot');
  if (head) {
    head.rotation.z -= Math.sin(time * 20.8 + 0.25) * (0.012 + overspeed * 0.012) * run;
    head.rotation.x += Math.sin(time * 14.5) * (0.007 + overspeed * 0.008) * run;
  }

  const mixturePivot = node('stand-mixer-mixture-pivot');
  const mixtureSurface = node('stand-mixer-visible-mixture-surface');
  const vortexStrength = THREE.MathUtils.smoothstep(time, 0.58, 1.52)
    * (1 - THREE.MathUtils.smoothstep(time, 4.28, 5.02)) * powered;
  const liquidInertia = Math.max(vortexStrength, inertia * 0.78);
  if (mixturePivot) {
    mixturePivot.rotation.y -= rotationPhase * 0.21;
    mixturePivot.rotation.x += Math.sin(time * 10.8) * 0.026 * liquidInertia;
    mixturePivot.rotation.z += Math.sin(time * 13.2 + 0.6) * 0.032 * liquidInertia;
  }
  if (mixtureSurface) {
    mixtureSurface.scale.x *= 1 + Math.sin(time * 9.6) * 0.035 * liquidInertia;
    mixtureSurface.scale.z *= 1 - Math.sin(time * 9.6) * 0.035 * liquidInertia;
    mixtureSurface.scale.y *= 1 + (0.16 + overspeed * 0.17) * liquidInertia
      + Math.sin(time * 15.4) * 0.045 * liquidInertia;
  }

  const peakStrength = THREE.MathUtils.smoothstep(time, 4.42, 5.04) * powered;
  waveRidges.forEach((ridge, index) => {
    const wave = liquidInertia * (0.72 + index * 0.11);
    ridge.visible = wave > 0.07 && peakStrength < 0.94;
    ridge.rotation.y += rotationPhase * (0.12 + index * 0.025) * (index % 2 === 0 ? 1 : -1);
    ridge.position.y += Math.sin(time * (10.5 + index * 1.8) + index) * 0.035 * wave;
    ridge.scale.set(
      0.88 + wave * 0.15,
      0.62 + wave * (0.58 + index * 0.08),
      0.88 + wave * 0.15,
    );
  });
  const peak = node('stand-mixer-whipped-cream-settle-peak');
  if (peak) {
    peak.visible = peakStrength > 0.025;
    const peakScale = 0.34 + peakStrength * 0.9;
    peak.scale.set(peakScale, 0.18 + peakStrength * 1.12, peakScale);
    peak.position.y -= (1 - peakStrength) * 0.3;
    peak.rotation.y += rotationPhaseAt(Math.min(time, SPIN_END)) * 0.08;
    peak.rotation.z += Math.sin(time * 7.6) * 0.055 * inertia;
  }

  const splashGate = THREE.MathUtils.smoothstep(time, 1.18, 1.62)
    * (1 - THREE.MathUtils.smoothstep(time, 4.02, 4.48)) * powered;
  let visiblePullArcs = 0;
  pullArcs.forEach((arc, index) => {
    const local = wrap(time - 1.26 - index * 0.105, 0.82);
    const progress = local / 0.82;
    const life = Math.sin(progress * Math.PI) * splashGate;
    arc.visible = life > 0.075;
    if (!arc.visible) return;
    visiblePullArcs += 1;
    arc.scale.set(0.72 + life * 0.48, 0.48 + life * 0.78, 0.72 + life * 0.34);
    arc.rotation.z += Math.sin(time * 8.2 + index) * 0.12 * life;
    arc.rotation.y += Math.sin(time * 4.1 + index * 0.7) * 0.1;
  });

  let visibleLargeDollops = 0;
  let returnedLiquidBodies = 0;
  dollops.forEach((dollop, index) => {
    const cycle = 1.18 + (index % 3) * 0.08;
    const offset = time - 1.34 - index * 0.12;
    const progress = offset >= 0 ? wrap(offset, cycle) / cycle : 0;
    const life = Math.sin(progress * Math.PI) * splashGate;
    dollop.visible = offset >= 0 && life > 0.045;
    if (!dollop.visible) return;
    visibleLargeDollops += 1;
    const angle = Number(dollop.userData.launchAngle ?? index / dollops.length * Math.PI * 2);
    const startRadius = 0.42 + (index % 2) * 0.08;
    // Overshoot the bowl rim and distribute bodies across the broad base.
    const landingRadius = index % 3 === 0 ? 1.78 : index % 3 === 1 ? 1.34 : 0.82;
    const radius = THREE.MathUtils.lerp(startRadius, landingRadius, progress)
      + Math.sin(progress * Math.PI) * (0.42 + (index % 3) * 0.1);
    const landingY = index % 3 === 0 ? -1.68 : index % 3 === 1 ? -0.2 : 0.02;
    dollop.position.set(
      Math.cos(angle) * radius,
      THREE.MathUtils.lerp(0.02, landingY, progress)
        + Math.sin(progress * Math.PI) * (0.66 + (index % 4) * 0.11),
      Math.sin(angle) * radius,
    );
    dollop.rotation.set(time * (2.2 + index * 0.12), angle, time * (1.5 + index * 0.08));
    dollop.scale.multiplyScalar(0.72 + life * 0.68);
    if (progress > 0.68) returnedLiquidBodies += 1;
  });

  let visibleDroplets = 0;
  droplets.forEach((drop, index) => {
    const cycle = 0.72 + (index % 4) * 0.055;
    const offset = time - 1.18 - index * 0.055;
    const progress = offset >= 0 ? wrap(offset, cycle) / cycle : 0;
    const life = Math.sin(progress * Math.PI) * splashGate;
    drop.visible = offset >= 0 && life > 0.035;
    if (!drop.visible) return;
    visibleDroplets += 1;
    const angle = Number(drop.userData.launchAngle ?? index / droplets.length * Math.PI * 2);
    const landingRadius = index % 4 === 0 ? 1.96 : 0.72 + (index % 3) * 0.34;
    const radius = THREE.MathUtils.lerp(0.48, landingRadius, progress)
      + Math.sin(progress * Math.PI) * (0.24 + (index % 5) * 0.055);
    const landingY = index % 4 === 0 ? -1.78 : -0.24;
    drop.position.set(
      Math.cos(angle) * radius,
      THREE.MathUtils.lerp(0.03, landingY, progress)
        + Math.sin(progress * Math.PI) * (0.52 + (index % 4) * 0.12),
      Math.sin(angle) * radius,
    );
    drop.rotation.z = -angle + Math.sin(time * 6 + index) * 0.25;
    drop.scale.set(0.68 + life * 0.58, 0.78 + life * 0.92, 0.68 + life * 0.58);
    if (progress > 0.7) returnedLiquidBodies += 1;
  });

  const diagnostics: StandMixerPerformanceDiagnostics = {
    time,
    phase: phaseAt(time, p),
    dialRotation,
    beaterAngularVelocity,
    planetaryAngularVelocity,
    bowlSwingRadians,
    bowlSwingAmplitude,
    bowlShake,
    bowlHop,
    machineShake,
    vortexStrength,
    peakStrength,
    visiblePullArcs,
    visibleLargeDollops,
    visibleDroplets,
    returnedLiquidBodies,
    run,
    overspeed,
    activeDrops: visibleLargeDollops + visibleDroplets,
    activeSplats: visiblePullArcs,
    shake: bowlSwingAmplitude + bowlShakeAmplitude + machineShake,
    timelineOwner: 'AppliancePerformanceSystem',
    effectOwner: 'stand-mixer-model-rig',
    sharedSpectacleEffects: 'disabled',
    forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
  };
  root.userData.standMixerPerformanceDiagnostics = diagnostics;
  root.userData.standMixerAnimation = diagnostics;
}

export function resetStandMixerPerformance(root: THREE.Group): void {
  resetDiagnostics(root);
}
