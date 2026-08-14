import * as THREE from 'three';

export const HUMIDIFIER_TIMELINE_OWNER = 'AppliancePerformanceSystem';

export type HumidifierPerformancePhase =
  | 'startup'
  | 'high-mist'
  | 'cloud-forming'
  | 'rainstorm'
  | 'wind-down';

export type HumidifierPerformanceDiagnostics = {
  timelineOwner: typeof HUMIDIFIER_TIMELINE_OWNER;
  modelOwner: 'humidifier-model-rig';
  sharedSpectacleEffects: 'disabled';
  phase: HumidifierPerformancePhase;
  time: number;
  mistStrength: number;
  cloudStrength: number;
  cloudVisualAreaRatio: number;
  lightningFlash: number;
  rainStrength: number;
  visibleMistVolumes: number;
  visibleRainDrops: number;
  rainDropsTargetingMachine: number;
  rainDropsNearMachine: number;
};

function pulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function fract(value: number): number {
  return ((value % 1) + 1) % 1;
}

function phaseAt(time: number): HumidifierPerformancePhase {
  if (time < 0.38) return 'startup';
  if (time < 1.42) return 'high-mist';
  if (time < 2.74) return 'cloud-forming';
  if (time < 4.7) return 'rainstorm';
  return 'wind-down';
}

function prefixedNodes(root: THREE.Object3D, prefix: string): THREE.Object3D[] {
  const result: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (object.name.startsWith(prefix)) result.push(object);
  });
  return result;
}

function setEffectMaterialResponse(
  root: THREE.Object3D,
  kind: string,
  opacity: number,
  emissiveIntensity?: number,
): void {
  const seen = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const entries = Array.isArray(object.material) ? object.material : [object.material];
    entries.forEach((material) => {
      if (seen.has(material) || material.userData.humidifierEffectMaterial !== kind) return;
      seen.add(material);
      material.opacity = opacity;
      if (emissiveIntensity !== undefined) {
        const toon = material as THREE.MeshToonMaterial;
        toon.emissiveIntensity = emissiveIntensity;
      }
    });
  });
}

/**
 * The authored humidifier performance used by both gameplay and gallery.
 * ApplianceMechanics owns the clock and restores the model baseline before
 * each sample; this function only poses the named model-owned rig.
 */
export function applyHumidifierPerformance(
  root: THREE.Group,
  time: number,
  power: number,
): void {
  const p = THREE.MathUtils.clamp(power, 0, 1);
  const startup = THREE.MathUtils.smoothstep(time, 0.04, 0.38) * p;
  const mistStrength = THREE.MathUtils.smoothstep(time, 0.22, 0.62)
    * (1 - THREE.MathUtils.smoothstep(time, 4.66, 5.18)) * p;
  const cloudStrength = THREE.MathUtils.smoothstep(time, 1.28, 2.34)
    * (1 - THREE.MathUtils.smoothstep(time, 4.78, 5.18)) * p;
  const rainStrength = THREE.MathUtils.smoothstep(time, 2.68, 3.08)
    * (1 - THREE.MathUtils.smoothstep(time, 4.68, 5.18)) * p;
  const lightningFlash = Math.min(1,
    pulse(time, 2.42, 2.5, 2.64)
    + pulse(time, 2.86, 2.94, 3.08)
    + pulse(time, 3.52, 3.6, 3.75)) * cloudStrength;

  const dial = root.getObjectByName('humidifier-control-dial-pivot');
  if (dial) dial.rotation.z = -Math.PI * 0.72 * startup;
  const outlet = root.getObjectByName('humidifier-outlet-cap-pivot');
  if (outlet) outlet.rotation.y = Math.sin(time * 2.5) * 0.12 * mistStrength;
  const water = root.getObjectByName('humidifier-inner-water-volume');
  if (water) {
    water.position.y = Math.sin(time * 1.8) * 0.012 * mistStrength;
    water.scale.y = 1 + Math.sin(time * 1.35 + 0.4) * 0.009 * mistStrength;
  }
  prefixedNodes(root, 'humidifier-water-glint-').forEach((glint, index) => {
    glint.position.y = 1.66 + index * 0.25 + Math.sin(time * 2 + index * 1.7) * 0.038 * mistStrength;
    const ripple = 1 + Math.sin(time * 1.6 + index) * 0.028 * mistStrength;
    glint.scale.setScalar(ripple);
  });

  let visibleMistVolumes = 0;
  const mistVolumes = prefixedNodes(root, 'humidifier-mist-volume-pivot-');
  mistVolumes.forEach((volume, index) => {
    const phaseOffset = Number(volume.userData.phaseOffset ?? index / Math.max(1, mistVolumes.length));
    const phase = fract(time * 0.54 + phaseOffset);
    const lane = Number(volume.userData.lane ?? 0);
    const depthLane = Number(volume.userData.depthLane ?? 0);
    const baseScale = Number(volume.userData.baseScale ?? 1);
    const cycleEnvelope = THREE.MathUtils.smoothstep(phase, 0, 0.12)
      * (1 - THREE.MathUtils.smoothstep(phase, 0.82, 1));
    const active = mistStrength * cycleEnvelope;
    volume.visible = active > 0.025;
    if (!volume.visible) return;
    visibleMistVolumes += 1;
    const spread = 0.035 + phase * 0.072;
    volume.position.set(
      lane * spread + Math.sin(time * 2.2 + index * 0.91) * 0.075 * phase,
      phase * 2.45,
      depthLane * (0.018 + phase * 0.024) + Math.sin(time * 1.7 + index) * 0.055,
    );
    const size = baseScale * active * (0.72 + phase * 1.12);
    volume.scale.set(size * (0.96 + phase * 0.28), size * (1.08 + phase * 0.42), size);
    volume.rotation.y = time * (index % 2 === 0 ? 0.34 : -0.29) + phase * 0.8;
    volume.rotation.z = Math.sin(time * 1.45 + index * 0.57) * 0.1 * phase;
  });
  setEffectMaterialResponse(root, 'mist-shell', 0.18 + mistStrength * 0.34, 0.04 + mistStrength * 0.08);
  setEffectMaterialResponse(root, 'mist-shade', 0.12 + mistStrength * 0.25, 0.02 + mistStrength * 0.045);

  const cloud = root.getObjectByName('humidifier-volumetric-weather-cloud-rig');
  if (cloud) {
    cloud.visible = cloudStrength > 0.015;
    cloud.position.set(
      Math.sin(time * 0.88) * 0.08 * cloudStrength,
      5.2 + Math.sin(time * 1.15) * 0.065 * cloudStrength,
      Math.cos(time * 0.72) * 0.05 * cloudStrength,
    );
    const grown = Math.max(0.001, cloudStrength ** 0.72);
    cloud.scale.set(grown, grown * 0.98, grown);
  }
  prefixedNodes(root, 'humidifier-volumetric-weather-cloud-lobe-').forEach((lobe, index) => {
    const base = lobe.userData.basePosition;
    if (!Array.isArray(base) || base.length < 3) return;
    lobe.position.set(
      Number(base[0]) + Math.sin(time * 0.72 + index) * 0.035 * cloudStrength,
      Number(base[1]) + Math.sin(time * 1.08 + index * 0.83) * 0.055 * cloudStrength,
      Number(base[2]) + Math.cos(time * 0.64 + index * 0.51) * 0.03 * cloudStrength,
    );
  });

  const internalLight = root.getObjectByName('humidifier-cloud-internal-light-pivot');
  if (internalLight) {
    internalLight.visible = lightningFlash > 0.02;
    const flashScale = 0.72 + lightningFlash * 0.48;
    internalLight.scale.setScalar(flashScale);
  }
  const lightning = root.getObjectByName('humidifier-cloud-volumetric-lightning-bolt');
  if (lightning) {
    lightning.visible = lightningFlash > 0.025;
    lightning.scale.setScalar(0.82 + lightningFlash * 0.36);
    lightning.rotation.y = Math.sin(time * 13.7) * 0.09;
  }
  setEffectMaterialResponse(root, 'internal-lightning', lightningFlash * 0.96, lightningFlash * 3.4);

  const rainRig = root.getObjectByName('humidifier-volumetric-rain-rig');
  if (rainRig) rainRig.visible = rainStrength > 0.015;
  let visibleRainDrops = 0;
  let rainDropsTargetingMachine = 0;
  let rainDropsNearMachine = 0;
  const rainDrops = prefixedNodes(root, 'humidifier-rain-drop-pivot-');
  rainDrops.forEach((drop, index) => {
    const phaseOffset = Number(drop.userData.phaseOffset ?? index / Math.max(1, rainDrops.length));
    const progress = fract((time - 2.65) * 1.16 + phaseOffset);
    const lane = Number(drop.userData.lane ?? 0);
    const depthLane = Number(drop.userData.depthLane ?? 0);
    const x = lane * 3.82 + Math.sin(index * 2.31) * 0.06;
    const z = depthLane * 1.86 + Math.cos(index * 1.79) * 0.055;
    const targetsMachine = Math.abs(x) < 0.92 && Math.abs(z) < 0.72;
    const endY = targetsMachine ? 2.82 : 0.13 + Math.abs(x) * 0.055;
    const startY = 4.55 + Math.sin(index * 1.37) * 0.12;
    const active = rainStrength > 0.025;
    drop.visible = active;
    if (!active) return;
    visibleRainDrops += 1;
    if (targetsMachine) rainDropsTargetingMachine += 1;
    else rainDropsNearMachine += 1;
    const fall = progress * progress * (3 - 2 * progress);
    drop.position.set(x, THREE.MathUtils.lerp(startY, endY, fall), z);
    const baseScale = Number(drop.userData.baseScale ?? 0.8);
    const appear = THREE.MathUtils.smoothstep(progress, 0, 0.08)
      * (1 - THREE.MathUtils.smoothstep(progress, 0.91, 1));
    const size = Math.max(0.001, baseScale * rainStrength * appear);
    drop.scale.set(size * 0.72, size * (1.16 + progress * 0.32), size * 0.72);
    drop.rotation.z = Math.sin(index * 1.17 + time * 2.2) * 0.08;
  });
  setEffectMaterialResponse(root, 'rain-drop', 0.42 + rainStrength * 0.5, 0.08 + rainStrength * 0.18);

  root.userData.humidifierPerformance = {
    timelineOwner: HUMIDIFIER_TIMELINE_OWNER,
    modelOwner: 'humidifier-model-rig',
    sharedSpectacleEffects: 'disabled',
    phase: phaseAt(time),
    time,
    mistStrength,
    cloudStrength,
    cloudVisualAreaRatio: 1.5 * cloudStrength * cloudStrength,
    lightningFlash,
    rainStrength,
    visibleMistVolumes,
    visibleRainDrops,
    rainDropsTargetingMachine,
    rainDropsNearMachine,
  } satisfies HumidifierPerformanceDiagnostics;
}

export function resetHumidifierPerformance(root: THREE.Group): void {
  const dial = root.getObjectByName('humidifier-control-dial-pivot');
  if (dial) dial.rotation.z = 0;
  const outlet = root.getObjectByName('humidifier-outlet-cap-pivot');
  if (outlet) outlet.rotation.y = 0;
  const water = root.getObjectByName('humidifier-inner-water-volume');
  if (water) {
    water.position.y = 0;
    water.scale.setScalar(1);
  }
  prefixedNodes(root, 'humidifier-water-glint-').forEach((glint, index) => {
    glint.position.y = 1.66 + index * 0.25;
    glint.scale.setScalar(1);
  });
  prefixedNodes(root, 'humidifier-mist-volume-pivot-').forEach((volume) => {
    volume.visible = false;
    volume.position.set(0, 0, 0);
    volume.rotation.set(0, 0, 0);
    volume.scale.setScalar(1);
  });
  const cloud = root.getObjectByName('humidifier-volumetric-weather-cloud-rig');
  if (cloud) {
    cloud.visible = false;
    cloud.position.set(0, 0, 0);
    cloud.scale.setScalar(0.001);
  }
  prefixedNodes(root, 'humidifier-volumetric-weather-cloud-lobe-').forEach((lobe) => {
    const base = lobe.userData.basePosition;
    if (Array.isArray(base) && base.length >= 3) {
      lobe.position.set(Number(base[0]), Number(base[1]), Number(base[2]));
    }
  });
  const internalLight = root.getObjectByName('humidifier-cloud-internal-light-pivot');
  if (internalLight) {
    internalLight.visible = false;
    internalLight.scale.setScalar(1);
  }
  const lightning = root.getObjectByName('humidifier-cloud-volumetric-lightning-bolt');
  if (lightning) {
    lightning.visible = false;
    lightning.rotation.set(0, 0, 0);
    lightning.scale.set(1.05, 1.18, 1.05);
  }
  const rainRig = root.getObjectByName('humidifier-volumetric-rain-rig');
  if (rainRig) rainRig.visible = false;
  prefixedNodes(root, 'humidifier-rain-drop-pivot-').forEach((drop) => {
    drop.visible = false;
    drop.position.set(0, 0, 0);
    drop.rotation.set(0, 0, 0);
    drop.scale.setScalar(1);
  });
  setEffectMaterialResponse(root, 'internal-lightning', 0, 0);
  setEffectMaterialResponse(root, 'mist-shell', 0.48, 0.08);
  setEffectMaterialResponse(root, 'mist-shade', 0.34, 0.035);
  setEffectMaterialResponse(root, 'rain-drop', 0.84, 0.12);
  delete root.userData.humidifierPerformance;
}
