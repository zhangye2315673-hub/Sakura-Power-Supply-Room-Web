import * as THREE from 'three';
import type { PoweredAnimationDriver } from '../poweredAnimation';

const TAU = Math.PI * 2;

export const RICE_COOKER_TIMELINE = Object.freeze({
  engageEnd: 0.32,
  warmupEnd: 1.22,
  alternatingStart: 1.22,
  alternatingEnd: 4.48,
  settleEnd: 5.2,
  lidBeatSeconds: 0.38,
  highLidAngle: 0.44,
  lowLidAngle: 0.22,
  steamCycleSeconds: 2.45,
  steamRiseHeight: 2.85,
});

export type RiceCookerPhase = 'idle' | 'engage' | 'warm-up' | 'high-low-boil' | 'natural-settle';
export type RiceCookerLidBeat = 'none' | 'high' | 'low' | 'settle';

export type RiceCookerPerformanceDiagnostics = {
  time: number;
  phase: RiceCookerPhase;
  steamEnvelope: number;
  lidBeat: RiceCookerLidBeat;
  lidBeatIndex: number;
  lidLiftAngle: number;
  bodyBounce: number;
  visibleSteamVolumes: number;
  maxSteamOpacity: number;
  maxSteamHeight: number;
  plumeTopWorldY: number;
  visibleAirborneRice: number;
  landedRice: number;
  sharedRiceGeometry: true;
  lidAttachedToHinge: boolean;
  timelineOwner: 'RiceCookerPerformance';
  modelOwner: 'rice-cooker-model-rig';
};

export type RiceCookerPerformanceController = PoweredAnimationDriver & {
  apply(time: number, power: number): void;
  reset(): void;
  diagnostics: RiceCookerPerformanceDiagnostics;
};

type Pose = {
  object: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  visible: boolean;
};

type MaterialState = {
  material: THREE.MeshToonMaterial;
  color: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
  opacity: number;
};

type SteamVolume = {
  pivot: THREE.Object3D;
  index: number;
  materials: THREE.MeshToonMaterial[];
};

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function collect(root: THREE.Group, prefix: string, suffix = ''): THREE.Object3D[] {
  const result: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (object.name.startsWith(prefix) && object.name.endsWith(suffix)) result.push(object);
  });
  return result;
}

function phaseAt(time: number, power: number): RiceCookerPhase {
  if (power <= 0.001 || time <= 0) return 'idle';
  if (time < RICE_COOKER_TIMELINE.engageEnd) return 'engage';
  if (time < RICE_COOKER_TIMELINE.alternatingStart) return 'warm-up';
  if (time < RICE_COOKER_TIMELINE.alternatingEnd) return 'high-low-boil';
  return 'natural-settle';
}

/** Rice-cooker-only closed performance rig. The model owns every grain and
 * steam volume; this controller only samples their deterministic poses. */
export function createRiceCookerPerformance(root: THREE.Group): RiceCookerPerformanceController {
  const body = root.getObjectByName('rice-cooker-body-pivot');
  const lid = root.getObjectByName('rice-cooker-lid-hinge-pivot');
  const lidShell = root.getObjectByName('rice-cooker-domed-lid-shell');
  const cookSwitchPivot = root.getObjectByName('rice-cooker-cook-switch-pivot');
  const cookSwitch = root.getObjectByName('rice-cooker-cook-switch');
  const latch = root.getObjectByName('rice-cooker-rear-latch-pivot');
  const steamSocket = root.getObjectByName('rice-cooker-steam-socket');
  const bedKernels = collect(root, 'rice-cooker-bed-kernel-', '-pivot');
  const airborneKernels = collect(root, 'rice-cooker-airborne-kernel-', '-pivot')
    .sort((a, b) => Number(a.userData.flightIndex) - Number(b.userData.flightIndex));
  const steamVolumes: SteamVolume[] = collect(root, 'rice-cooker-volumetric-steam-puff-', '-pivot')
    .map((pivot) => {
      const materials = new Set<THREE.MeshToonMaterial>();
      pivot.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const entries = Array.isArray(object.material) ? object.material : [object.material];
        entries.forEach((material) => materials.add(material as THREE.MeshToonMaterial));
      });
      return {
        pivot,
        index: Number(pivot.userData.steamPuffIndex),
        materials: [...materials],
      };
    })
    .sort((a, b) => a.index - b.index);

  const animatedObjects = [
    body,
    lid,
    cookSwitchPivot,
    cookSwitch,
    latch,
    ...bedKernels,
    ...airborneKernels,
    ...steamVolumes.map(({ pivot }) => pivot),
  ].filter((object): object is THREE.Object3D => Boolean(object));
  const poses: Pose[] = animatedObjects.map((object) => ({
    object,
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
    visible: object.visible,
  }));
  const lightMaterials = new Set<THREE.MeshToonMaterial>();
  ['rice-cooker-status-lamp-left', 'rice-cooker-status-lamp-right'].forEach((name) => {
    const mesh = root.getObjectByName(name) as THREE.Mesh | undefined;
    if (!mesh) return;
    const entries = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    entries.forEach((material) => lightMaterials.add(material as THREE.MeshToonMaterial));
  });
  steamVolumes.forEach(({ materials }) => materials.forEach((material) => lightMaterials.add(material)));
  const materials: MaterialState[] = [...lightMaterials].map((material) => ({
    material,
    color: material.color.clone(),
    emissive: material.emissive.clone(),
    emissiveIntensity: material.emissiveIntensity,
    opacity: material.opacity,
  }));
  const lidRestParent = lidShell?.parent ?? null;
  let signalValue = 0;

  const diagnostics: RiceCookerPerformanceDiagnostics = {
    time: 0,
    phase: 'idle',
    steamEnvelope: 0,
    lidBeat: 'none',
    lidBeatIndex: -1,
    lidLiftAngle: 0,
    bodyBounce: 0,
    visibleSteamVolumes: 0,
    maxSteamOpacity: 0,
    maxSteamHeight: 0,
    plumeTopWorldY: 0,
    visibleAirborneRice: 0,
    landedRice: 0,
    sharedRiceGeometry: true,
    lidAttachedToHinge: lidRestParent === lid,
    timelineOwner: 'RiceCookerPerformance',
    modelOwner: 'rice-cooker-model-rig',
  };
  root.userData.riceCookerPerformance = diagnostics;

  const restore = (): void => {
    poses.forEach((pose) => {
      pose.object.position.copy(pose.position);
      pose.object.quaternion.copy(pose.quaternion);
      pose.object.scale.copy(pose.scale);
      pose.object.visible = pose.visible;
    });
    materials.forEach((state) => {
      state.material.color.copy(state.color);
      state.material.emissive.copy(state.emissive);
      state.material.emissiveIntensity = state.emissiveIntensity;
      state.material.opacity = state.opacity;
    });
  };

  const reset = (): void => {
    restore();
    airborneKernels.forEach((kernel) => { kernel.visible = false; });
    steamVolumes.forEach(({ pivot, materials: puffMaterials }) => {
      pivot.visible = false;
      puffMaterials.forEach((material) => { material.opacity = 0; });
    });
    signalValue = 0;
    Object.assign(diagnostics, {
      time: 0,
      phase: 'idle',
      steamEnvelope: 0,
      lidBeat: 'none',
      lidBeatIndex: -1,
      lidLiftAngle: 0,
      bodyBounce: 0,
      visibleSteamVolumes: 0,
      maxSteamOpacity: 0,
      maxSteamHeight: 0,
      plumeTopWorldY: 0,
      visibleAirborneRice: 0,
      landedRice: 0,
      lidAttachedToHinge: lidShell?.parent === lid,
    });
  };

  const apply = (rawTime: number, rawPower: number): void => {
    restore();
    const time = Math.max(0, rawTime);
    const power = clamp01(rawPower);
    const warmup = THREE.MathUtils.smoothstep(time, RICE_COOKER_TIMELINE.engageEnd, RICE_COOKER_TIMELINE.warmupEnd);
    const settle = 1 - THREE.MathUtils.smoothstep(
      time,
      RICE_COOKER_TIMELINE.alternatingEnd - 0.08,
      RICE_COOKER_TIMELINE.settleEnd,
    );
    const steamEnvelope = warmup * settle * power;
    const engaged = THREE.MathUtils.smoothstep(time, 0.04, RICE_COOKER_TIMELINE.engageEnd) * power;

    if (cookSwitchPivot) cookSwitchPivot.rotateX(-0.2 * engaged);
    if (cookSwitch) cookSwitch.position.z -= 0.018 * engaged;

    let lidBeat: RiceCookerLidBeat = 'none';
    let lidBeatIndex = -1;
    let lidLiftAngle = 0.025 * steamEnvelope;
    if (time >= RICE_COOKER_TIMELINE.alternatingStart && time < RICE_COOKER_TIMELINE.alternatingEnd) {
      const beatTime = time - RICE_COOKER_TIMELINE.alternatingStart;
      lidBeatIndex = Math.floor(beatTime / RICE_COOKER_TIMELINE.lidBeatSeconds);
      const beatProgress = (beatTime % RICE_COOKER_TIMELINE.lidBeatSeconds) / RICE_COOKER_TIMELINE.lidBeatSeconds;
      const beatPulse = Math.sin(beatProgress * Math.PI) ** 2;
      const isHigh = lidBeatIndex % 2 === 0;
      lidBeat = isHigh ? 'high' : 'low';
      const amplitude = isHigh
        ? RICE_COOKER_TIMELINE.highLidAngle
        : RICE_COOKER_TIMELINE.lowLidAngle;
      lidLiftAngle += amplitude * beatPulse * steamEnvelope;
    } else if (time >= RICE_COOKER_TIMELINE.alternatingEnd) {
      lidBeat = 'settle';
    }
    if (lid) {
      lid.rotateX(-lidLiftAngle);
      lid.rotateZ(Math.sin(time * TAU * 1.35) * 0.012 * steamEnvelope);
    }
    if (latch) latch.rotateZ(Math.sin(time * TAU * 2.1) * 0.035 * steamEnvelope);
    const bodyBounce = Math.abs(Math.sin(time * TAU * 2.35)) * 0.022 * steamEnvelope;
    if (body) {
      body.position.y += bodyBounce;
      body.rotateZ(Math.sin(time * TAU * 1.7) * 0.008 * steamEnvelope);
    }

    bedKernels.forEach((kernel, index) => {
      kernel.position.y += Math.abs(Math.sin(time * (4.8 + index % 3 * 0.25) + index * 0.73))
        * 0.01 * steamEnvelope;
      kernel.rotateZ(Math.sin(time * 3.2 + index) * 0.025 * steamEnvelope);
    });

    let visibleAirborneRice = 0;
    let landedRice = 0;
    airborneKernels.forEach((kernel, index) => {
      const launchTime = Number(kernel.userData.launchTime);
      const duration = Number(kernel.userData.flightDuration);
      const progress = (time - launchTime) / duration;
      const start = new THREE.Vector3().fromArray(kernel.userData.startPosition as number[]);
      if (progress < 0 || power <= 0.001) {
        kernel.visible = false;
        return;
      }
      if (progress >= 1) {
        kernel.position.copy(start);
        kernel.visible = false;
        landedRice += 1;
        return;
      }
      const arc = Math.sin(progress * Math.PI);
      const driftX = Number(kernel.userData.driftX);
      const driftZ = Number(kernel.userData.driftZ);
      kernel.visible = true;
      kernel.position.set(
        start.x + driftX * progress + Math.sin(progress * Math.PI * 2 + index) * 0.045 * arc,
        start.y + Number(kernel.userData.apexHeight) * arc - 0.28 * progress * progress,
        start.z + driftZ * progress + Math.cos(progress * Math.PI * 2 + index) * 0.04 * arc,
      );
      kernel.rotateX(progress * TAU * (1.1 + index % 3 * 0.25));
      kernel.rotateZ(progress * TAU * (0.7 + index % 2 * 0.3));
      visibleAirborneRice += 1;
    });

    let visibleSteamVolumes = 0;
    let maxSteamOpacity = 0;
    let maxSteamHeight = 0;
    steamVolumes.forEach(({ pivot, index, materials: puffMaterials }) => {
      const localTime = time - 0.46 - index * 0.14;
      if (localTime < 0 || steamEnvelope <= 0.004) {
        pivot.visible = false;
        puffMaterials.forEach((material) => { material.opacity = 0; });
        return;
      }
      const cycle = RICE_COOKER_TIMELINE.steamCycleSeconds;
      const progress = ((localTime % cycle) + cycle) % cycle / cycle;
      const fadeIn = THREE.MathUtils.smoothstep(progress, 0.01, 0.12);
      const fadeOut = 1 - THREE.MathUtils.smoothstep(progress, 0.84, 1);
      const visibility = fadeIn * fadeOut * steamEnvelope;
      if (visibility <= 0.006) {
        pivot.visible = false;
        puffMaterials.forEach((material) => { material.opacity = 0; });
        return;
      }
      const driftPhase = time * (1.55 + index * 0.04) + index * 0.91;
      const baseScale = Number(pivot.userData.baseScale);
      const expansion = baseScale * (0.78 + progress * 1.5);
      pivot.visible = true;
      pivot.position.set(
        Number(pivot.userData.lateralBias) + Math.sin(driftPhase) * (0.025 + progress * 0.12),
        progress * (RICE_COOKER_TIMELINE.steamRiseHeight + index % 3 * 0.12),
        Math.cos(driftPhase * 0.84) * (0.02 + progress * 0.08),
      );
      pivot.scale.set(expansion * 0.94, expansion, expansion * 0.9);
      pivot.rotation.y = driftPhase * 0.38;
      pivot.rotation.z = Math.sin(driftPhase * 0.65) * 0.16;
      const opacity = visibility * 0.62;
      puffMaterials.forEach((material) => {
        material.opacity = opacity;
        material.emissiveIntensity = 0.025 * steamEnvelope;
      });
      maxSteamOpacity = Math.max(maxSteamOpacity, opacity);
      maxSteamHeight = Math.max(maxSteamHeight, pivot.position.y + expansion * 0.36);
      visibleSteamVolumes += 1;
    });

    materials.slice(0, 2).forEach((state, index) => {
      state.material.color.setHex(index === 0 ? 0xffd7df : 0xffd7bd);
      state.material.emissive.setHex(index === 0 ? 0xff5575 : 0xff9d58);
      state.material.emissiveIntensity = engaged * (index === 0 ? 1.25 : 0.82);
    });
    root.updateMatrixWorld(true);
    const outletWorldY = steamSocket?.getWorldPosition(new THREE.Vector3()).y ?? 0;
    signalValue = Math.max(engaged, steamEnvelope, lidLiftAngle);
    Object.assign(diagnostics, {
      time,
      phase: phaseAt(time, power),
      steamEnvelope,
      lidBeat,
      lidBeatIndex,
      lidLiftAngle,
      bodyBounce,
      visibleSteamVolumes,
      maxSteamOpacity,
      maxSteamHeight,
      plumeTopWorldY: outletWorldY + maxSteamHeight,
      visibleAirborneRice,
      landedRice,
      lidAttachedToHinge: lidShell?.parent === lid,
    });
  };

  return {
    update: apply,
    stop: reset,
    signal: () => signalValue,
    apply,
    reset,
    diagnostics,
  };
}
