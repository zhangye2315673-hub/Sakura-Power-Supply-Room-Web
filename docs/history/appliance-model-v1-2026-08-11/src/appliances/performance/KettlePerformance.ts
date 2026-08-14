import * as THREE from 'three';

const TAU = Math.PI * 2;

export const KETTLE_TIMELINE = Object.freeze({
  engageEnd: 0.28,
  warmupEnd: 0.72,
  sustainedBoilEnd: 4.72,
  stopEnd: 5.2,
  bodyFrequencyHz: 3.6,
  lidFrequencyHz: 7.2,
  steamCycleSeconds: 1.9,
  steamRiseHeight: 4.9,
});

export type KettlePerformanceDiagnostics = {
  time: number;
  phase: 'idle' | 'engage' | 'warmup' | 'steady-boil' | 'smooth-settle';
  motionEnvelope: number;
  oscillationFrequencyHz: number;
  lidJumpFrequencyHz: number;
  bodyBounce: number;
  bodySway: number;
  bodyRoll: number;
  lidLift: number;
  visibleSteamPuffs: number;
  maxSteamOpacity: number;
  maxSteamHeight: number;
  plumeTopWorldY: number;
  steamOwner: 'kettle-model-rig';
  timelineOwner: 'ApplianceMechanics/KettlePerformance';
};

export type KettlePerformanceController = {
  apply(time: number, power: number): void;
  reset(): void;
  signal(): number;
  diagnostics: KettlePerformanceDiagnostics;
};

type PuffRig = {
  pivot: THREE.Object3D;
  index: number;
  materials: THREE.Material[];
};

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

export function createKettlePerformance(root: THREE.Group): KettlePerformanceController {
  const body = root.getObjectByName('kettle-body-pivot');
  const lid = root.getObjectByName('kettle-lid-hinge-pivot');
  const powerSwitch = root.getObjectByName('kettle-power-switch-pivot');
  const waterVolume = root.getObjectByName('kettle-gauge-water-volume') as THREE.Mesh | undefined;
  const indicator = root.getObjectByName('status-indicator') as THREE.Mesh | undefined;
  const bodyRest = body ? { position: body.position.clone(), quaternion: body.quaternion.clone() } : null;
  const lidRest = lid ? { position: lid.position.clone(), quaternion: lid.quaternion.clone() } : null;
  const switchRest = powerSwitch?.quaternion.clone();
  const waterScaleRest = waterVolume?.scale.clone();
  const waterEmissiveRest = (waterVolume?.material as THREE.MeshToonMaterial | undefined)?.emissiveIntensity ?? 0;
  const indicatorMaterial = indicator?.material as THREE.MeshToonMaterial | undefined;
  const indicatorRest = indicatorMaterial ? {
    color: indicatorMaterial.color.clone(),
    emissive: indicatorMaterial.emissive.clone(),
    emissiveIntensity: indicatorMaterial.emissiveIntensity,
  } : null;
  const puffs: PuffRig[] = [];

  root.traverse((object) => {
    if (!object.name.startsWith('kettle-volumetric-steam-puff-') || !object.name.endsWith('-pivot')) return;
    const materials = new Set<THREE.Material>();
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      (Array.isArray(child.material) ? child.material : [child.material]).forEach((material) => materials.add(material));
    });
    puffs.push({
      pivot: object,
      index: Number(object.userData.steamPuffIndex ?? puffs.length),
      materials: [...materials],
    });
  });
  puffs.sort((a, b) => a.index - b.index);

  let signalValue = 0;
  const diagnostics: KettlePerformanceDiagnostics = {
    time: 0,
    phase: 'idle',
    motionEnvelope: 0,
    oscillationFrequencyHz: KETTLE_TIMELINE.bodyFrequencyHz,
    lidJumpFrequencyHz: KETTLE_TIMELINE.lidFrequencyHz,
    bodyBounce: 0,
    bodySway: 0,
    bodyRoll: 0,
    lidLift: 0,
    visibleSteamPuffs: 0,
    maxSteamOpacity: 0,
    maxSteamHeight: 0,
    plumeTopWorldY: 0,
    steamOwner: 'kettle-model-rig',
    timelineOwner: 'ApplianceMechanics/KettlePerformance',
  };
  root.userData.kettlePerformance = diagnostics;

  const reset = (): void => {
    if (body && bodyRest) {
      body.position.copy(bodyRest.position);
      body.quaternion.copy(bodyRest.quaternion);
    }
    if (lid && lidRest) {
      lid.position.copy(lidRest.position);
      lid.quaternion.copy(lidRest.quaternion);
    }
    if (powerSwitch && switchRest) powerSwitch.quaternion.copy(switchRest);
    if (waterVolume && waterScaleRest) {
      waterVolume.scale.copy(waterScaleRest);
      (waterVolume.material as THREE.MeshToonMaterial).emissiveIntensity = waterEmissiveRest;
    }
    if (indicatorMaterial && indicatorRest) {
      indicatorMaterial.color.copy(indicatorRest.color);
      indicatorMaterial.emissive.copy(indicatorRest.emissive);
      indicatorMaterial.emissiveIntensity = indicatorRest.emissiveIntensity;
    }
    puffs.forEach(({ pivot, materials }) => {
      pivot.visible = false;
      pivot.position.set(0, 0, 0);
      pivot.rotation.set(0, 0, 0);
      pivot.scale.set(1, 1, 1);
      materials.forEach((material) => { material.opacity = 0; });
    });
    signalValue = 0;
    Object.assign(diagnostics, {
      time: 0,
      phase: 'idle',
      motionEnvelope: 0,
      bodyBounce: 0,
      bodySway: 0,
      bodyRoll: 0,
      lidLift: 0,
      visibleSteamPuffs: 0,
      maxSteamOpacity: 0,
      maxSteamHeight: 0,
      plumeTopWorldY: 0,
    });
  };

  const apply = (rawTime: number, rawPower: number): void => {
    const time = Math.max(0, rawTime);
    const power = clamp01(rawPower);
    const warmup = THREE.MathUtils.smoothstep(time, KETTLE_TIMELINE.engageEnd, KETTLE_TIMELINE.warmupEnd);
    const settle = 1 - THREE.MathUtils.smoothstep(time, KETTLE_TIMELINE.sustainedBoilEnd, KETTLE_TIMELINE.stopEnd);
    const boil = warmup * settle * power;
    const bodyPhase = time * TAU * KETTLE_TIMELINE.bodyFrequencyHz;
    const lidPhase = time * TAU * KETTLE_TIMELINE.lidFrequencyHz;
    const bounce = (0.5 + Math.sin(bodyPhase) * 0.5) * 0.076 * boil;
    const sway = Math.sin(bodyPhase + 0.42) * 0.068 * boil;
    const roll = Math.sin(bodyPhase + 0.86) * 0.057 * boil;
    const lidLift = Math.pow(0.5 + Math.sin(lidPhase - 0.62) * 0.5, 2.2) * 0.112 * boil;

    if (body && bodyRest) {
      body.position.copy(bodyRest.position).add(new THREE.Vector3(sway, bounce, 0));
      body.quaternion.copy(bodyRest.quaternion);
      body.rotateZ(roll);
      body.rotateX(Math.sin(bodyPhase - 0.28) * 0.01 * boil);
    }
    if (lid && lidRest) {
      lid.position.copy(lidRest.position);
      lid.quaternion.copy(lidRest.quaternion);
      lid.rotateX(-lidLift);
      lid.rotateZ(Math.sin(lidPhase - 0.44) * 0.018 * boil);
    }
    if (powerSwitch && switchRest) {
      powerSwitch.quaternion.copy(switchRest);
      powerSwitch.rotateX(-0.2 * THREE.MathUtils.smoothstep(time, 0.02, KETTLE_TIMELINE.engageEnd) * power);
      powerSwitch.rotateZ(-Math.PI * 0.56 * THREE.MathUtils.smoothstep(time, 0.02, KETTLE_TIMELINE.engageEnd) * power);
    }
    if (waterVolume && waterScaleRest) {
      waterVolume.scale.copy(waterScaleRest);
      waterVolume.scale.y *= 1 + Math.sin(time * 3.1) * 0.016 * boil;
      (waterVolume.material as THREE.MeshToonMaterial).emissiveIntensity = waterEmissiveRest + 0.075 * boil;
    }

    let visibleSteamPuffs = 0;
    let maxSteamOpacity = 0;
    let maxSteamHeight = 0;
    puffs.forEach(({ pivot, index, materials }) => {
      const localTime = time - 0.34 - index * 0.12;
      if (localTime < 0 || boil <= 0.004) {
        pivot.visible = false;
        materials.forEach((material) => { material.opacity = 0; });
        return;
      }
      const cycle = KETTLE_TIMELINE.steamCycleSeconds;
      const cycleIndex = Math.floor(localTime / cycle);
      const variant = ((cycleIndex % 3) + 3) % 3;
      const progress = ((localTime % cycle) + cycle) % cycle / cycle;
      const fadeIn = THREE.MathUtils.smoothstep(progress, 0.01, 0.1);
      const fadeOut = 1 - THREE.MathUtils.smoothstep(progress, 0.88, 1);
      const visibility = fadeIn * fadeOut * boil;
      if (visibility <= 0.006) {
        pivot.visible = false;
        materials.forEach((material) => { material.opacity = 0; });
        return;
      }
      const lateralBias = Number(pivot.userData.lateralBias ?? 0);
      const baseScale = Number(pivot.userData.baseScale ?? 1);
      const twistRate = Number(pivot.userData.twistRate ?? 0.4);
      const driftPhase = time * (1.18 + (index % 4) * 0.09) + index * 1.37;
      const expansion = baseScale * (0.88 + progress * 1.58);
      const variantOffset = variant === 0 ? -0.025 : variant === 1 ? 0.12 : -0.14;
      pivot.visible = true;
      pivot.position.set(
        lateralBias + variantOffset + Math.sin(driftPhase) * (0.035 + progress * 0.15),
        progress * (KETTLE_TIMELINE.steamRiseHeight + (index % 3) * 0.16),
        Math.cos(driftPhase * 0.83) * (0.025 + progress * 0.09),
      );
      const variantScale = variant === 0
        ? new THREE.Vector3(0.92, 1, 0.94)
        : variant === 1
          ? new THREE.Vector3(0.7, 1.2, 0.82)
          : new THREE.Vector3(1.2, 0.88, 1.08);
      pivot.scale.set(
        expansion * variantScale.x * (1 + Math.sin(driftPhase) * 0.05),
        expansion * variantScale.y,
        expansion * variantScale.z,
      );
      pivot.rotation.y = time * twistRate + index * 0.51;
      pivot.rotation.z = Math.sin(driftPhase * 0.72) * 0.2 + (variant - 1) * 0.16;
      const top = pivot.position.y + expansion * 0.46;
      maxSteamHeight = Math.max(maxSteamHeight, top);
      materials.forEach((material, materialIndex) => {
        const opacity = visibility * (materialIndex === materials.length - 1 ? 0.34 : 0.66);
        material.opacity = opacity;
        maxSteamOpacity = Math.max(maxSteamOpacity, opacity);
      });
      visibleSteamPuffs += 1;
    });

    if (indicatorMaterial && indicatorRest) {
      indicatorMaterial.color.setHex(boil > 0.02 ? 0xffd9e5 : indicatorRest.color.getHex());
      indicatorMaterial.emissive.setHex(boil > 0.02 ? 0xff4d68 : indicatorRest.emissive.getHex());
      indicatorMaterial.emissiveIntensity = indicatorRest.emissiveIntensity + boil * 1.8;
    }
    root.updateMatrixWorld(true);
    const outlet = root.getObjectByName('kettle-spout-steam-socket');
    const outletWorldY = outlet?.getWorldPosition(new THREE.Vector3()).y ?? 0;
    signalValue = boil;
    Object.assign(diagnostics, {
      time,
      phase: time < KETTLE_TIMELINE.engageEnd
        ? 'engage'
        : time < KETTLE_TIMELINE.warmupEnd
          ? 'warmup'
          : time < KETTLE_TIMELINE.sustainedBoilEnd
            ? 'steady-boil'
            : 'smooth-settle',
      motionEnvelope: boil,
      bodyBounce: bounce,
      bodySway: sway,
      bodyRoll: roll,
      lidLift,
      visibleSteamPuffs,
      maxSteamOpacity,
      maxSteamHeight,
      plumeTopWorldY: outletWorldY + maxSteamHeight,
    });
  };

  return { apply, reset, signal: () => signalValue, diagnostics };
}
