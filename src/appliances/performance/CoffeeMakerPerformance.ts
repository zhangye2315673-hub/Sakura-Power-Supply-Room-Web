import * as THREE from 'three';

export type CoffeeMakerPerformancePhase =
  | 'startup'
  | 'pre-infusion'
  | 'main-extraction'
  | 'pressure-peak'
  | 'drip-tail'
  | 'satisfied-settle';

export type CoffeeMakerPerformanceDiagnostics = {
  time: number;
  phase: CoffeeMakerPerformancePhase;
  dialRotation: number;
  pressureStrength: number;
  bodyCompression: number;
  visibleBeans: number;
  jumpingBeans: number;
  visiblePreInfusionDrops: number;
  visibleExtractionColumns: number;
  flowStrength: number;
  cupFill: number;
  liquidWobble: number;
  visibleSteamVolumes: number;
  visibleAromaCurls: number;
  visibleWarmLightPoints: number;
  timelineOwner: 'AppliancePerformanceSystem';
  effectOwner: 'coffee-maker-model-rig';
  sharedSpectacleEffects: 'disabled';
  forbiddenPrimitives: readonly ['PlaneGeometry', 'Sprite', 'Line'];
};

function fract(value: number): number {
  return ((value % 1) + 1) % 1;
}

function pulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function phaseAt(time: number): CoffeeMakerPerformancePhase {
  if (time < 0.46) return 'startup';
  if (time < 1.38) return 'pre-infusion';
  if (time < 3.18) return 'main-extraction';
  if (time < 4.24) return 'pressure-peak';
  if (time < 5.05) return 'drip-tail';
  return 'satisfied-settle';
}

function prefixed(root: THREE.Object3D, prefix: string): THREE.Object3D[] {
  const result: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (object.name.startsWith(prefix)) result.push(object);
  });
  return result;
}

function setEffectMaterial(root: THREE.Object3D, kind: string, opacity: number, emission: number): void {
  const seen = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (seen.has(material) || material.userData.coffeeMakerEffectMaterial !== kind) return;
      seen.add(material);
      material.opacity = opacity;
      const toon = material as THREE.MeshToonMaterial;
      toon.emissiveIntensity = emission;
    });
  });
}

/** Model-owned coffee performance; ApplianceMechanics restores the baseline first. */
export function applyCoffeeMakerPerformance(root: THREE.Group, time: number, power: number): void {
  const p = THREE.MathUtils.clamp(power, 0, 1);
  const startup = THREE.MathUtils.smootherstep(time, 0.03, 0.34) * p;
  const active = THREE.MathUtils.smoothstep(time, 0.3, 0.72)
    * (1 - THREE.MathUtils.smoothstep(time, 4.7, 5.28)) * p;
  const pressureStrength = THREE.MathUtils.smoothstep(time, 0.48, 3.42)
    * (1 - THREE.MathUtils.smoothstep(time, 4.12, 4.88)) * p;
  const peak = THREE.MathUtils.smoothstep(time, 3.02, 3.38)
    * (1 - THREE.MathUtils.smoothstep(time, 4.12, 4.46)) * p;
  const satisfaction = pulse(time, 5.0, 5.18, 5.52) * p;
  const dialRotation = -Math.PI * 0.76 * startup;

  const dial = root.getObjectByName('coffee-maker-control-dial-pivot');
  if (dial) dial.rotation.z += dialRotation;
  const indicator = root.getObjectByName('coffee-maker-narrow-status-light') as THREE.Mesh | undefined;
  if (indicator) {
    const material = indicator.material as THREE.MeshToonMaterial;
    material.color.setHex(time >= 4.72 ? 0xffd2a3 : 0xff8f78);
    material.emissive.setHex(time >= 4.72 ? 0xffa44d : 0xff5c63);
    material.emissiveIntensity = (0.42 + active * 1.9 + satisfaction * 0.8) * startup;
  }

  // Pressure builds causally: one complete preheat press, denser peak beats,
  // then a very small satisfied rebound after the flow is finished.
  const preheatPress = pulse(time, 0.34, 0.57, 0.88);
  const pressureBeat = Math.max(0, Math.sin(time * (15 + pressureStrength * 9))) * pressureStrength;
  const bodyCompression = (
    preheatPress * 0.035
    + pressureStrength * 0.004
    + pressureBeat * (0.008 + peak * 0.022)
  ) * p;
  root.scale.y *= 1 - bodyCompression;
  root.position.y += (Math.sin(time * 26) * (0.003 + peak * 0.012) * active) + satisfaction * 0.035;
  root.position.x += Math.sin(time * 31.2) * (0.003 + peak * 0.014) * active;
  root.rotation.z += Math.sin(time * 23.4) * (0.002 + peak * 0.009) * active;
  const head = root.getObjectByName('coffee-maker-brew-head-pivot');
  if (head) {
    head.position.y -= bodyCompression * 0.8;
    head.rotation.z += Math.sin(time * 29) * (0.004 + peak * 0.012) * active;
  }

  let jumpingBeans = 0;
  const beans = prefixed(root, 'coffee-maker-hopper-bean-pivot-');
  beans.forEach((bean, index) => {
    const hop = Math.abs(Math.sin(time * (11.5 + peak * 8.5) + index * 1.73))
      * (0.012 + pressureStrength * 0.025 + peak * 0.026) * active;
    bean.position.y += hop;
    bean.rotation.x += Math.sin(time * 7.2 + index) * 0.05 * active;
    bean.rotation.z += Math.cos(time * 6.3 + index * 0.7) * 0.04 * active;
    if (hop > 0.012) jumpingBeans += 1;
  });

  const dropPivots = prefixed(root, 'coffee-maker-extraction-drop-pivot-');
  let visiblePreInfusionDrops = 0;
  dropPivots.forEach((drop, index) => {
    const preStart = 0.64 + index * 0.25;
    const tailStart = 4.24 + index * 0.27;
    const start = time < 2 ? preStart : tailStart;
    const duration = time < 2 ? 0.3 : 0.42;
    const progress = THREE.MathUtils.clamp((time - start) / duration, 0, 1);
    const live = time >= start && time <= start + duration && p > 0.01;
    drop.visible = live;
    if (!live) return;
    visiblePreInfusionDrops += time < 2 ? 1 : 0;
    drop.position.set((index - 1) * 0.045, -0.04 - progress * 0.42, 0);
    drop.scale.setScalar((0.72 + Math.sin(progress * Math.PI) * 0.58) * p);
  });

  const flowGate = THREE.MathUtils.smoothstep(time, 1.25, 1.48)
    * (1 - THREE.MathUtils.smoothstep(time, 4.02, 4.38)) * p;
  const flowStrength = flowGate * (0.78 + pressureStrength * 0.28 + peak * 0.34);
  const flows = prefixed(root, 'coffee-maker-primary-extraction-flow-');
  let visibleExtractionColumns = 0;
  flows.forEach((flow, index) => {
    flow.visible = flowStrength > 0.035;
    if (!flow.visible) return;
    visibleExtractionColumns += 1;
    const thickness = 0.74 + flowStrength * 0.62 + Math.sin(time * 19 + index) * 0.08;
    flow.scale.set(thickness, 0.82 + flowStrength * 0.24, thickness);
  });

  const cupFill = THREE.MathUtils.smootherstep(time, 1.28, 4.38) * p;
  const liquidWobble = (1 - THREE.MathUtils.smoothstep(time, 4.48, 5.45))
    * (0.04 + pressureStrength * 0.11) * cupFill;
  const surface = root.getObjectByName('coffee-maker-cup-liquid-surface');
  if (surface) {
    surface.visible = cupFill > 0.015;
    surface.position.y = THREE.MathUtils.lerp(0.16, 0.445, cupFill);
    surface.scale.set(0.84 + cupFill * 0.16, 0.7 + cupFill * 0.3, 0.84 + cupFill * 0.16);
    surface.rotation.x += Math.sin(time * 13) * liquidWobble;
    surface.rotation.z += Math.cos(time * 11.3) * liquidWobble;
  }
  prefixed(root, 'coffee-maker-cup-liquid-ripple-').forEach((ripple, index) => {
    ripple.visible = flowStrength > 0.08;
    ripple.position.y = THREE.MathUtils.lerp(0.177, 0.462, cupFill) + index * 0.004;
    const rippleScale = 0.78 + fract(time * 2.8 + index * 0.46) * 0.68;
    ripple.scale.setScalar(rippleScale);
  });

  const steamStrength = THREE.MathUtils.smoothstep(time, 1.42, 2.05)
    * (1 - THREE.MathUtils.smoothstep(time, 5.2, 5.95)) * p;
  let visibleSteamVolumes = 0;
  const steamVolumes = prefixed(root, 'coffee-maker-steam-volume-pivot-');
  steamVolumes.forEach((volume, index) => {
    const phase = fract(time * (0.43 + pressureStrength * 0.13) + Number(volume.userData.phaseOffset ?? 0));
    const life = Math.sin(phase * Math.PI) * steamStrength;
    volume.visible = life > 0.08;
    if (!volume.visible) return;
    visibleSteamVolumes += 1;
    const lane = Number(volume.userData.lane ?? 0);
    volume.position.set(lane * 0.055 + Math.sin(time * 2 + index) * 0.05, phase * (0.8 + peak * 0.52), Math.cos(time * 1.6 + index) * 0.04);
    volume.scale.set(0.55 + life * 0.72, 0.7 + life * (0.8 + peak * 0.28), 0.55 + life * 0.72);
  });
  setEffectMaterial(root, 'steam', steamStrength * 0.48, steamStrength * 0.1);

  const aromaStrength = THREE.MathUtils.smoothstep(time, 1.7, 2.35)
    * (1 - THREE.MathUtils.smoothstep(time, 5.0, 5.72)) * p;
  let visibleAromaCurls = 0;
  prefixed(root, 'coffee-maker-volumetric-aroma-curl-').forEach((curl, index) => {
    const wave = 0.78 + Math.sin(time * 2.1 + index) * 0.16;
    curl.visible = aromaStrength > 0.08;
    if (!curl.visible) return;
    visibleAromaCurls += 1;
    curl.scale.set(wave, 0.65 + aromaStrength * (0.65 + peak * 0.2), wave);
    curl.rotation.y += Math.sin(time * 1.4 + index) * 0.18;
  });
  setEffectMaterial(root, 'aroma', aromaStrength * 0.44, aromaStrength * (0.18 + peak * 0.28));

  let visibleWarmLightPoints = 0;
  prefixed(root, 'coffee-maker-warm-aroma-light-point-').forEach((point, index) => {
    const phase = fract(time * 0.36 + Number(point.userData.phaseOffset ?? 0));
    const life = Math.sin(phase * Math.PI) * aromaStrength;
    point.visible = life > 0.14;
    if (!point.visible) return;
    visibleWarmLightPoints += 1;
    point.position.set(Number(point.userData.lane ?? 0) * 0.075, 0.12 + phase * (0.78 + peak * 0.35), Math.sin(index * 1.9) * 0.12);
    point.scale.setScalar(0.65 + life * 0.9);
  });
  setEffectMaterial(root, 'warm-light', aromaStrength * 0.86, aromaStrength * (0.9 + peak * 1.5));
  setEffectMaterial(root, 'coffee-liquid', Math.max(cupFill * 0.92, flowStrength * 0.88, visiblePreInfusionDrops > 0 ? 0.9 : 0), 0.06 + flowStrength * 0.15);

  root.userData.coffeeMakerPerformanceDiagnostics = {
    time,
    phase: phaseAt(time),
    dialRotation,
    pressureStrength,
    bodyCompression,
    visibleBeans: beans.length,
    jumpingBeans,
    visiblePreInfusionDrops,
    visibleExtractionColumns,
    flowStrength,
    cupFill,
    liquidWobble,
    visibleSteamVolumes,
    visibleAromaCurls,
    visibleWarmLightPoints,
    timelineOwner: 'AppliancePerformanceSystem',
    effectOwner: 'coffee-maker-model-rig',
    sharedSpectacleEffects: 'disabled',
    forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
  } satisfies CoffeeMakerPerformanceDiagnostics;
}

export function resetCoffeeMakerPerformance(root: THREE.Group): void {
  [
    'coffee-maker-extraction-drop-pivot-',
    'coffee-maker-primary-extraction-flow-',
    'coffee-maker-cup-liquid-ripple-',
    'coffee-maker-steam-volume-pivot-',
    'coffee-maker-volumetric-aroma-curl-',
    'coffee-maker-warm-aroma-light-point-',
  ].forEach((prefix) => prefixed(root, prefix).forEach((object) => { object.visible = false; }));
  const surface = root.getObjectByName('coffee-maker-cup-liquid-surface');
  if (surface) surface.visible = false;
  setEffectMaterial(root, 'steam', 0, 0);
  setEffectMaterial(root, 'aroma', 0, 0);
  setEffectMaterial(root, 'warm-light', 0, 0);
  setEffectMaterial(root, 'coffee-liquid', 0, 0);
  delete root.userData.coffeeMakerPerformanceDiagnostics;
}
