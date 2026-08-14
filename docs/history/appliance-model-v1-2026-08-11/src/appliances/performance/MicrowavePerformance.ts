import * as THREE from 'three';

export const MICROWAVE_TIMELINE_OWNER = 'AppliancePerformanceSystem';

export type MicrowavePerformancePhase =
  | 'dial-start'
  | 'indicator-sequence'
  | 'heating'
  | 'steam-build'
  | 'energy-climax'
  | 'inertial-wind-down'
  | 'final-settle';

export type MicrowavePerformanceDiagnostics = {
  timelineOwner: typeof MICROWAVE_TIMELINE_OWNER;
  effectOwner: 'microwave-model-rig';
  phase: MicrowavePerformancePhase;
  timeline: number;
  dialTurn: number;
  litIndicatorCount: number;
  interiorLightStrength: number;
  trayAngle: number;
  trayAngularSpeed: number;
  foodScale: number;
  wholeMachineCompression: number;
  wholeMachineRebound: number;
  wholeMachineShake: number;
  visibleSteamPuffs: number;
  maximumSteamOpacity: number;
  activeHeatWaveCount: number;
  finalSettle: number;
  steamGeometry: 'clustered-irregular-icosahedra';
  heatWaveGeometry: 'thick-irregular-torus';
  forbiddenFlatEffects: readonly ['PlaneGeometry', 'Sprite', 'Line'];
};

const STEAM_STARTS = [1.24, 1.58, 1.91, 2.2, 2.48, 2.74, 3.02, 3.28] as const;
const HEAT_WAVE_STARTS = [3.12, 3.42, 3.72, 4.02] as const;

function pulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function phaseAt(time: number): MicrowavePerformancePhase {
  if (time < 0.3) return 'dial-start';
  if (time < 0.68) return 'indicator-sequence';
  if (time < 1.28) return 'heating';
  if (time < 3.12) return 'steam-build';
  if (time < 4.45) return 'energy-climax';
  if (time < 4.92) return 'inertial-wind-down';
  return 'final-settle';
}

function meshMaterial(mesh: THREE.Mesh | null): THREE.MeshToonMaterial | null {
  if (!mesh || Array.isArray(mesh.material)) return null;
  return mesh.material as THREE.MeshToonMaterial;
}

function setGlow(mesh: THREE.Mesh | null, strength: number, color: number): void {
  const material = meshMaterial(mesh);
  if (!material) return;
  material.emissive?.setHex(strength > 0.001 ? color : 0x000000);
  material.emissiveIntensity = strength;
}

function trayMotion(time: number): { angle: number; speed: number } {
  const rampStart = 0.64;
  const rampEnd = 0.94;
  const decelStart = 4.34;
  const decelEnd = 5.08;
  const maximumSpeed = 6.2;
  if (time <= rampStart) return { angle: 0, speed: 0 };
  if (time < rampEnd) {
    const elapsed = time - rampStart;
    const duration = rampEnd - rampStart;
    const progress = elapsed / duration;
    return {
      angle: maximumSpeed * elapsed * progress * 0.5,
      speed: maximumSpeed * progress,
    };
  }
  const rampAngle = maximumSpeed * (rampEnd - rampStart) * 0.5;
  if (time < decelStart) {
    return {
      angle: rampAngle + maximumSpeed * (time - rampEnd),
      speed: maximumSpeed,
    };
  }
  const fullSpeedAngle = rampAngle + maximumSpeed * (decelStart - rampEnd);
  const duration = decelEnd - decelStart;
  const elapsed = Math.min(duration, time - decelStart);
  return {
    angle: fullSpeedAngle + maximumSpeed * (elapsed - elapsed * elapsed / (2 * duration)),
    speed: maximumSpeed * Math.max(0, 1 - elapsed / duration),
  };
}

/**
 * Model-owned microwave performance. ApplianceMechanics restores the exact
 * authored pose before every sample, so game, gallery and review use the same
 * deterministic 5.2 second timeline without stacking a second effect owner.
 */
export function applyMicrowavePerformance(root: THREE.Group, time: number, power: number): void {
  const p = THREE.MathUtils.clamp(power, 0, 1);
  const dial = root.getObjectByName('microwave-control-dial-pivot');
  const tray = root.getObjectByName('microwave-tray-rotor-pivot');
  const food = root.getObjectByName('microwave-food-pivot');
  const interiorLight = root.getObjectByName('microwave-interior-work-light') as THREE.PointLight | null;
  const interior = root.getObjectByName('microwave-interior-back-wall') as THREE.Mesh | null;
  const foodMesh = root.getObjectByName('microwave-food-main-volume') as THREE.Mesh | null;
  const display = root.getObjectByName('microwave-control-display') as THREE.Mesh | null;

  const turnOn = THREE.MathUtils.smoothstep(time, 0.04, 0.27);
  const returnToStop = THREE.MathUtils.smoothstep(time, 4.48, 4.9);
  const dialTurn = -Math.PI * 0.72 * turnOn * (1 - returnToStop);
  if (dial) dial.rotation.z += dialTurn;

  let litIndicatorCount = 0;
  for (let index = 0; index < 3; index += 1) {
    const indicator = root.getObjectByName(`microwave-sequence-indicator-${index + 1}`) as THREE.Mesh | null;
    const on = time >= 0.28 + index * 0.11 && time < 4.56;
    const completion = time >= 4.56 && index === 2;
    const strength = (on ? 1 : completion ? 0.42 : 0) * p;
    if (strength > 0.02) litIndicatorCount += 1;
    const material = meshMaterial(indicator);
    if (material) {
      material.color.setHex(strength > 0.02 ? (completion ? 0xb6f0bd : 0xffb0a4) : 0x6e6677);
      material.emissive?.setHex(strength > 0.02 ? (completion ? 0x67e783 : 0xff735f) : 0x000000);
      material.emissiveIntensity = strength * 1.8;
    }
  }

  const lampGate = time >= 0.57 ? 1 : 0;
  const lampDim = 1 - THREE.MathUtils.smoothstep(time, 4.46, 5.08) * 0.57;
  const lightStrength = lampGate * lampDim * p;
  if (interiorLight) interiorLight.intensity = lightStrength * 2.15;
  setGlow(interior, lightStrength * 1.25, 0xffb462);
  setGlow(foodMesh, lightStrength * 0.48, 0xff9d62);
  setGlow(display, (turnOn * (1 - returnToStop) * 0.38 + returnToStop * 0.12) * p, 0xff9a7f);
  for (let index = 1; index <= 4; index += 1) {
    const digit = root.getObjectByName(`microwave-display-digit-${index}`) as THREE.Mesh | null;
    const digitStep = time >= 0.34 + index * 0.045 ? 1 : 0;
    setGlow(digit, digitStep * (1 - returnToStop * 0.68) * p * 1.2, 0xffb27d);
  }

  const traySample = trayMotion(time);
  if (tray) tray.rotation.y += traySample.angle;

  const heatingEnvelope = THREE.MathUtils.smoothstep(time, 0.72, 1.16)
    * (1 - THREE.MathUtils.smoothstep(time, 4.46, 5.08)) * p;
  const climaxEnvelope = THREE.MathUtils.smoothstep(time, 3.08, 3.42)
    * (1 - THREE.MathUtils.smoothstep(time, 4.28, 4.62)) * p;
  const finalFoodWobble = pulse(time, 4.62, 4.78, 5.04) * p;
  const foodScale = 1
    + THREE.MathUtils.smoothstep(time, 0.88, 3.35) * (1 - returnToStop * 0.66) * 0.19 * p
    + Math.abs(Math.sin(time * 10.8)) * 0.035 * heatingEnvelope
    + Math.abs(Math.sin(time * 18.5)) * 0.075 * climaxEnvelope;
  if (food) {
    food.scale.set(
      foodScale + Math.sin(time * 14.2) * 0.018 * climaxEnvelope,
      foodScale + Math.abs(Math.sin(time * 12.4)) * 0.055 * climaxEnvelope,
      foodScale - Math.sin(time * 14.2) * 0.014 * climaxEnvelope,
    );
    food.position.y += Math.abs(Math.sin(time * 9.3)) * 0.026 * heatingEnvelope
      + Math.abs(Math.sin(time * 20.4)) * 0.055 * climaxEnvelope
      + finalFoodWobble * 0.035;
    food.rotation.x += Math.sin(time * 13.7) * 0.026 * heatingEnvelope
      + Math.sin(time * 22.5) * 0.055 * climaxEnvelope
      + finalFoodWobble * 0.045;
    food.rotation.z += Math.sin(time * 11.1 + 0.4) * 0.022 * heatingEnvelope
      + Math.sin(time * 19.2) * 0.048 * climaxEnvelope;
  }

  const workCompression = (
    pulse(time, 0.54, 0.61, 0.74) * 0.62
    + pulse(time, 1.25, 1.34, 1.5) * 0.42
    + pulse(time, 2.0, 2.1, 2.28) * 0.52
    + pulse(time, 2.72, 2.82, 3.0) * 0.62
    + pulse(time, 3.28, 3.37, 3.54) * 0.88
    + pulse(time, 3.7, 3.79, 3.96) * 1.0
    + pulse(time, 4.08, 4.17, 4.35) * 1.12
  ) * p;
  const workRebound = (
    pulse(time, 0.66, 0.76, 0.91) * 0.42
    + pulse(time, 1.4, 1.51, 1.67) * 0.26
    + pulse(time, 2.16, 2.28, 2.46) * 0.33
    + pulse(time, 2.9, 3.02, 3.18) * 0.38
    + pulse(time, 3.43, 3.55, 3.7) * 0.58
    + pulse(time, 3.85, 3.98, 4.12) * 0.68
    + pulse(time, 4.24, 4.37, 4.5) * 0.74
  ) * p;
  const rhythmShake = Math.sin(time * 38) * (0.014 * heatingEnvelope + 0.036 * climaxEnvelope);
  const finalSettleAge = time - 4.82;
  const finalSettle = finalSettleAge >= 0
    ? Math.sin(finalSettleAge * 39) * Math.exp(-finalSettleAge * 12.5) * p
    : 0;
  const wholeMachineShake = rhythmShake + finalSettle * 0.07;
  root.scale.set(
    root.scale.x * (1 + workCompression * 0.035 + workRebound * 0.016),
    root.scale.y * (1 - workCompression * 0.052 + workRebound * 0.042),
    root.scale.z * (1 + workCompression * 0.03 + workRebound * 0.018),
  );
  root.position.x += wholeMachineShake;
  root.position.y += workRebound * 0.018 + Math.abs(finalSettle) * 0.012;
  root.rotation.z += wholeMachineShake * 0.12 + finalSettle * 0.025;

  let visibleSteamPuffs = 0;
  let maximumSteamOpacity = 0;
  const steamIntensity = THREE.MathUtils.smoothstep(time, 1.18, 3.48)
    * (1 + climaxEnvelope * 0.75)
    * (1 - THREE.MathUtils.smoothstep(time, 4.68, 5.2) * 0.38) * p;
  STEAM_STARTS.forEach((start, index) => {
    const puff = root.getObjectByName(`microwave-steam-puff-${index + 1}`);
    if (!puff) return;
    const age = time - start;
    const visible = age >= 0 && p > 0.01;
    puff.visible = visible;
    if (!visible) return;
    visibleSteamPuffs += 1;
    const rise = Math.min(0.63, age * (time >= 4.45 ? 0.12 : 0.17));
    const spread = THREE.MathUtils.smoothstep(age, 0, 2.4);
    puff.position.y += rise;
    puff.position.x += Math.sin(age * 2.2 + index * 1.41) * (0.035 + spread * 0.045);
    puff.position.z += Math.cos(age * 1.8 + index * 0.77) * 0.025;
    puff.rotation.y += age * (index % 2 === 0 ? 0.42 : -0.36);
    puff.rotation.z += Math.sin(age * 1.7 + index) * 0.13;
    const growth = 0.54 + THREE.MathUtils.smoothstep(age, 0, 1.5) * (0.48 + climaxEnvelope * 0.16);
    puff.scale.set(growth * (1 + Math.sin(age * 2.4) * 0.08), growth * 1.08, growth * 0.9);
    const firstLobe = puff.getObjectByName(`microwave-steam-puff-${index + 1}-lobe-1`) as THREE.Mesh | null;
    const material = meshMaterial(firstLobe);
    if (material) {
      const opacity = Math.min(0.72, steamIntensity * (0.22 + index * 0.025));
      material.opacity = opacity;
      material.emissiveIntensity = lightStrength * 0.2 + climaxEnvelope * 0.18;
      maximumSteamOpacity = Math.max(maximumSteamOpacity, opacity);
    }
  });

  let activeHeatWaveCount = 0;
  HEAT_WAVE_STARTS.forEach((start, index) => {
    const wave = root.getObjectByName(`microwave-heat-energy-wave-${index + 1}`) as THREE.Mesh | null;
    if (!wave) return;
    const age = time - start;
    const life = 0.84;
    const progress = THREE.MathUtils.clamp(age / life, 0, 1);
    const visible = age >= 0 && age < life && p > 0.01;
    wave.visible = visible;
    if (!visible) return;
    activeHeatWaveCount += 1;
    const growth = 0.42 + THREE.MathUtils.smoothstep(progress, 0, 0.92) * 2.72;
    const wobble = Math.sin(progress * Math.PI * 4 + index) * (1 - progress) * 0.08;
    wave.scale.set(growth * (1 + wobble), growth * (0.9 - wobble * 0.55), 0.8 + progress * 0.45);
    wave.rotation.z += (index % 2 === 0 ? 1 : -1) * progress * 0.22;
    const material = meshMaterial(wave);
    if (material) {
      const appear = THREE.MathUtils.smoothstep(progress, 0, 0.08);
      const fade = 1 - THREE.MathUtils.smoothstep(progress, 0.48, 1);
      material.opacity = appear * fade * 0.68 * p;
      material.emissiveIntensity = fade * (0.78 + index * 0.1) * p;
    }
  });

  root.userData.microwavePerformanceDiagnostics = {
    timelineOwner: MICROWAVE_TIMELINE_OWNER,
    effectOwner: 'microwave-model-rig',
    phase: phaseAt(time),
    timeline: time,
    dialTurn,
    litIndicatorCount,
    interiorLightStrength: lightStrength,
    trayAngle: traySample.angle,
    trayAngularSpeed: traySample.speed,
    foodScale,
    wholeMachineCompression: workCompression,
    wholeMachineRebound: workRebound,
    wholeMachineShake,
    visibleSteamPuffs,
    maximumSteamOpacity,
    activeHeatWaveCount,
    finalSettle,
    steamGeometry: 'clustered-irregular-icosahedra',
    heatWaveGeometry: 'thick-irregular-torus',
    forbiddenFlatEffects: ['PlaneGeometry', 'Sprite', 'Line'],
  } satisfies MicrowavePerformanceDiagnostics;
}

export function resetMicrowavePerformance(root: THREE.Group): void {
  const interiorLight = root.getObjectByName('microwave-interior-work-light') as THREE.PointLight | null;
  if (interiorLight) interiorLight.intensity = 0;
  delete root.userData.microwavePerformanceDiagnostics;
}
