import * as THREE from 'three';
import type { PoweredAnimationDriver } from '../poweredAnimation';

const TAU = Math.PI * 2;

export const INDUCTION_COOKTOP_TIMELINE = Object.freeze({
  gentleSimmerStart: 0.12,
  heatBuildStart: 1.18,
  rollingBoilStart: 2.48,
  potLaunchStart: 3.28,
  potApex: 3.61,
  potLanding: 4.08,
  lastFoodLanding: 4.72,
  steamFadeStart: 4.78,
  settleEnd: 5.2,
  boilBubbleCount: 14,
  steamCloudCount: 18,
  foodPieceCount: 13,
});

export type InductionCooktopPhase =
  | 'idle'
  | 'gentle-simmer'
  | 'heating-up'
  | 'rolling-boil'
  | 'pot-jump'
  | 'food-return'
  | 'settling'
  | 'complete';

export type InductionCooktopPerformanceDiagnostics = {
  time: number;
  phase: InductionCooktopPhase;
  heatStrength: number;
  potLift: number;
  potLanded: boolean;
  airborneFood: number;
  returnedFood: number;
  highestFoodLift: number;
  foodHeightSpread: number;
  visibleBoilBubbles: number;
  visibleSteamClouds: number;
  soupRoll: number;
  returnImpact: number;
  volumetricOnly: true;
  effectOwner: 'InductionCooktopPerformance';
  timelineOwner: 'ApplianceMechanics/InductionCooktopPerformance';
  sharedSpectacleEffects: 'must-be-disabled-during-integration';
};

export type InductionCooktopPerformanceController = PoweredAnimationDriver & {
  start(): void;
  apply(time: number, power: number): void;
  reset(): void;
  diagnostics: InductionCooktopPerformanceDiagnostics;
};

type Pose = {
  object: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  visible: boolean;
};

type MaterialPose = {
  material: THREE.Material;
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  opacity: number;
};

type FoodRig = {
  object: THREE.Object3D;
  index: number;
  basePosition: THREE.Vector3;
  baseQuaternion: THREE.Quaternion;
  launch: number;
  duration: number;
  lift: number;
  driftX: number;
  driftZ: number;
  spin: THREE.Vector3;
};

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function pulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function phaseAt(time: number, power: number, airborne: number): InductionCooktopPhase {
  if (power <= 0.001 || time <= 0) return 'idle';
  if (time < INDUCTION_COOKTOP_TIMELINE.heatBuildStart) return 'gentle-simmer';
  if (time < INDUCTION_COOKTOP_TIMELINE.rollingBoilStart) return 'heating-up';
  if (time < INDUCTION_COOKTOP_TIMELINE.potLaunchStart) return 'rolling-boil';
  if (time < INDUCTION_COOKTOP_TIMELINE.potLanding) return 'pot-jump';
  if (airborne > 0) return 'food-return';
  if (time < INDUCTION_COOKTOP_TIMELINE.settleEnd) return 'settling';
  return 'complete';
}

function foodCandidates(root: THREE.Group): THREE.Object3D[] {
  const result: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (/^induction-cooktop-hotpot-meat-slice-\d+-pivot$/.test(object.name)
      || /^induction-cooktop-hotpot-tofu-cube-\d+$/.test(object.name)
      || /^induction-cooktop-hotpot-meatball-\d+$/.test(object.name)
      || /^induction-cooktop-hotpot-vegetable-\d+-pivot$/.test(object.name)) result.push(object);
  });
  return result.sort((first, second) => first.name.localeCompare(second.name));
}

export function createInductionCooktopPerformance(
  root: THREE.Group,
): InductionCooktopPerformanceController {
  const cookware = root.getObjectByName('induction-cooktop-powered-cookware-pivot');
  const soup = root.getObjectByName('induction-cooktop-powered-simmer-surface');
  const knob = root.getObjectByName('induction-cooktop-rotary-knob-pivot');
  const fan = root.getObjectByName('induction-cooktop-inferred-fan-rotor-pivot');
  const heatRings: THREE.Object3D[] = [];
  const boilBubbles: THREE.Object3D[] = [];
  const steamClouds: THREE.Object3D[] = [];
  const indicator = root.getObjectByName('induction-cooktop-status-indicator') as THREE.Mesh | undefined;
  root.traverse((object) => {
    if (/^induction-cooktop-powered-heat-ring-\d+$/.test(object.name)) heatRings.push(object);
    if (/^induction-cooktop-soup-rolling-bubble-\d+$/.test(object.name)) boilBubbles.push(object);
    if (/^induction-cooktop-steam-cloud-\d+-pivot$/.test(object.name)) steamClouds.push(object);
  });
  if (!cookware || !soup || !knob || !fan) throw new Error('Incomplete induction-cooktop performance rig');
  const food = foodCandidates(root).map((object, index): FoodRig => ({
    object,
    index,
    basePosition: object.position.clone(),
    baseQuaternion: object.quaternion.clone(),
    launch: 3.32 + index * 0.026,
    duration: 0.92 + (index % 5) * 0.065,
    lift: 2.55 + (index % 4) * 0.32 + Math.floor(index / 4) * 0.08,
    driftX: ((index % 5) - 2) * 0.09,
    driftZ: (((index * 3) % 7) - 3) * 0.065,
    spin: new THREE.Vector3(2.4 + index * 0.17, 3.1 + (index % 4) * 0.45, (index % 2 ? -1 : 1) * (2.2 + index * 0.12)),
  }));
  if (food.length !== INDUCTION_COOKTOP_TIMELINE.foodPieceCount) {
    throw new Error(`Expected 13 induction-cooktop food rigs, found ${food.length}`);
  }

  const animatedSet = new Set<THREE.Object3D>();
  [cookware, soup, knob, fan, indicator, ...heatRings, ...boilBubbles, ...steamClouds]
    .forEach((object) => { if (object) object.traverse((node) => animatedSet.add(node)); });
  food.forEach(({ object }) => object.traverse((node) => animatedSet.add(node)));
  const poses: Pose[] = [...animatedSet].map((object) => ({
    object,
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
    visible: object.visible,
  }));
  const seenMaterials = new Set<THREE.Material>();
  const materials: MaterialPose[] = [];
  animatedSet.forEach((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const entries = Array.isArray(object.material) ? object.material : [object.material];
    entries.forEach((material) => {
      if (seenMaterials.has(material)) return;
      seenMaterials.add(material);
      const toon = material as THREE.MeshToonMaterial;
      materials.push({
        material,
        color: toon.color?.clone(),
        emissive: toon.emissive?.clone(),
        emissiveIntensity: toon.emissiveIntensity,
        opacity: material.opacity,
      });
    });
  });

  let signalValue = 0;
  let running = false;
  const diagnostics: InductionCooktopPerformanceDiagnostics = {
    time: 0,
    phase: 'idle',
    heatStrength: 0,
    potLift: 0,
    potLanded: true,
    airborneFood: 0,
    returnedFood: 0,
    highestFoodLift: 0,
    foodHeightSpread: 0,
    visibleBoilBubbles: 0,
    visibleSteamClouds: 0,
    soupRoll: 0,
    returnImpact: 0,
    volumetricOnly: true,
    effectOwner: 'InductionCooktopPerformance',
    timelineOwner: 'ApplianceMechanics/InductionCooktopPerformance',
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
  };
  root.userData.inductionCooktopPerformance = diagnostics;

  const restore = (): void => {
    poses.forEach((pose) => {
      pose.object.position.copy(pose.position);
      pose.object.quaternion.copy(pose.quaternion);
      pose.object.scale.copy(pose.scale);
      pose.object.visible = pose.visible;
    });
    materials.forEach(({ material, color, emissive, emissiveIntensity, opacity }) => {
      const toon = material as THREE.MeshToonMaterial;
      if (color && toon.color) toon.color.copy(color);
      if (emissive && toon.emissive) toon.emissive.copy(emissive);
      if (emissiveIntensity !== undefined) toon.emissiveIntensity = emissiveIntensity;
      material.opacity = opacity;
    });
  };

  const reset = (): void => {
    restore();
    running = false;
    signalValue = 0;
    Object.assign(diagnostics, {
      time: 0,
      phase: 'idle',
      heatStrength: 0,
      potLift: 0,
      potLanded: true,
      airborneFood: 0,
      returnedFood: 0,
      highestFoodLift: 0,
      foodHeightSpread: 0,
      visibleBoilBubbles: 0,
      visibleSteamClouds: 0,
      soupRoll: 0,
      returnImpact: 0,
    });
  };

  const start = (): void => {
    reset();
    running = true;
  };

  const apply = (rawTime: number, rawPower: number): void => {
    restore();
    running = true;
    const time = Math.max(0, rawTime);
    const power = clamp01(rawPower);
    const startup = THREE.MathUtils.smoothstep(time, 0.02, 0.42);
    const heatStrength = startup * (0.28 + THREE.MathUtils.smoothstep(time, 0.72, 2.76) * 0.72) * power;
    const steamFade = 1 - THREE.MathUtils.smoothstep(time, INDUCTION_COOKTOP_TIMELINE.steamFadeStart, INDUCTION_COOKTOP_TIMELINE.settleEnd);
    const activeEnvelope = startup * power;
    cookware.visible = true;
    knob.rotation.y += THREE.MathUtils.smoothstep(time, 0.04, 0.42) * -1.28 * power;
    fan.rotation.y += time * (5 + heatStrength * 17);

    heatRings.forEach((ring, index) => {
      const ringGate = THREE.MathUtils.smoothstep(time, 0.18 + index * 0.15, 0.48 + index * 0.17) * steamFade * power;
      ring.visible = ringGate > 0.01;
      ring.scale.setScalar(0.96 + Math.sin(time * (3.2 + index * 0.28) + index) * 0.045 * ringGate);
      const mesh = ring as THREE.Mesh;
      const material = mesh.material as THREE.MeshToonMaterial;
      material.opacity = 0.2 + ringGate * 0.64;
      material.emissiveIntensity = ringGate * 1.75;
    });

    if (indicator) {
      const material = indicator.material as THREE.MeshToonMaterial;
      material.emissive.setHex(0xff5f4a);
      material.emissiveIntensity = heatStrength * 2.1;
      material.color.setHex(heatStrength > 0.02 ? 0xffd08d : 0x81798f);
    }

    const simmer = THREE.MathUtils.smoothstep(time, INDUCTION_COOKTOP_TIMELINE.gentleSimmerStart, 1.0) * power;
    const rolling = THREE.MathUtils.smoothstep(time, 1.55, INDUCTION_COOKTOP_TIMELINE.rollingBoilStart) * power;
    const soupRoll = (0.018 * simmer + 0.055 * rolling) * (0.65 + 0.35 * Math.sin(time * (5.2 + rolling * 7.4)));
    soup.position.y += soupRoll;
    soup.scale.set(1 + Math.sin(time * 8.4) * 0.012 * rolling, 1 + soupRoll * 0.9, 1 + Math.cos(time * 7.7) * 0.014 * rolling);
    soup.rotation.y += Math.sin(time * 2.8) * 0.035 * rolling;

    let visibleBoilBubbles = 0;
    boilBubbles.forEach((bubble, index) => {
      const gate = THREE.MathUtils.smoothstep(time, 1.18 + index * 0.018, 1.72 + index * 0.022) * steamFade * power;
      const wave = 0.5 + 0.5 * Math.sin(time * (7.2 + rolling * 8.6) + index * 1.73);
      bubble.visible = gate > 0.04 && wave > 0.17;
      if (!bubble.visible) return;
      visibleBoilBubbles += 1;
      const base = bubble.userData.basePosition as number[];
      bubble.position.set(base[0], base[1] + wave * (0.035 + rolling * 0.095), base[2]);
      bubble.scale.setScalar((0.52 + wave * (0.55 + rolling * 0.42)) * gate);
    });

    let potLift = 0;
    if (time >= INDUCTION_COOKTOP_TIMELINE.potLaunchStart && time < INDUCTION_COOKTOP_TIMELINE.potLanding) {
      const progress = (time - INDUCTION_COOKTOP_TIMELINE.potLaunchStart)
        / (INDUCTION_COOKTOP_TIMELINE.potLanding - INDUCTION_COOKTOP_TIMELINE.potLaunchStart);
      potLift = Math.sin(progress * Math.PI) * 0.96 * power;
      cookware.position.y += potLift;
      cookware.rotation.z += Math.sin(progress * Math.PI) * Math.sin(progress * TAU) * 0.11 * power;
      cookware.rotation.x += Math.sin(progress * Math.PI) * -0.075 * power;
    }
    const landingImpact = pulse(time, 4.04, 4.11, 4.24) * power;
    cookware.position.y -= landingImpact * 0.055;
    cookware.scale.set(1 + landingImpact * 0.045, 1 - landingImpact * 0.09, 1 + landingImpact * 0.045);

    let airborneFood = 0;
    let returnedFood = 0;
    let highestFoodLift = 0;
    const foodHeights: number[] = [];
    let returnImpact = 0;
    food.forEach((item) => {
      const gentle = Math.sin(time * (1.55 + item.index * 0.045) + item.index * 1.27) * (0.014 + rolling * 0.035) * simmer;
      const drift = Math.cos(time * (0.92 + item.index * 0.03) + item.index) * (0.012 + rolling * 0.028) * simmer;
      item.object.position.copy(item.basePosition);
      item.object.quaternion.copy(item.baseQuaternion);
      item.object.position.y += gentle;
      item.object.position.x += drift;
      item.object.position.z += Math.sin(time * 1.15 + item.index * 0.77) * (0.01 + rolling * 0.022) * simmer;
      item.object.rotation.y += Math.sin(time * (1.1 + item.index * 0.025) + item.index) * (0.09 + rolling * 0.22) * simmer;
      const flightProgress = (time - item.launch) / item.duration;
      if (flightProgress >= 0 && flightProgress < 1) {
        airborneFood += 1;
        const arc = Math.sin(flightProgress * Math.PI);
        const lift = arc * item.lift * power;
        highestFoodLift = Math.max(highestFoodLift, lift);
        foodHeights.push(lift);
        // Cookware motion is inherited. Subtract it so food follows its own ballistic path in world space.
        item.object.position.y += lift - potLift;
        item.object.position.x += Math.sin(flightProgress * Math.PI) * item.driftX * power;
        item.object.position.z += Math.sin(flightProgress * Math.PI) * item.driftZ * power;
        item.object.rotation.x += item.spin.x * flightProgress * power;
        item.object.rotation.y += item.spin.y * flightProgress * power;
        item.object.rotation.z += item.spin.z * flightProgress * power;
      } else if (flightProgress >= 1) {
        returnedFood += 1;
        const impactAt = item.launch + item.duration;
        const pieceImpact = pulse(time, impactAt - 0.035, impactAt + 0.025, impactAt + 0.16) * power;
        returnImpact = Math.max(returnImpact, pieceImpact);
        item.object.position.y -= pieceImpact * 0.045;
        item.object.rotation.z += Math.sin((time - impactAt) * 28) * pieceImpact * 0.08;
      }
    });
    soup.position.y -= returnImpact * 0.035;
    soup.scale.x += returnImpact * 0.045;
    soup.scale.z += returnImpact * 0.045;

    let visibleSteamClouds = 0;
    steamClouds.forEach((cloud, index) => {
      const spawn = 1.82 + index * 0.037;
      const intensity = THREE.MathUtils.smoothstep(time, spawn, spawn + 0.42) * steamFade * power;
      const age = Math.max(0, time - spawn);
      const cycle = 1.08 + (index % 4) * 0.08;
      const progress = (age % cycle) / cycle;
      cloud.visible = intensity > 0.035 && progress < 0.9;
      if (!cloud.visible) return;
      visibleSteamClouds += 1;
      const base = cloud.userData.basePosition as number[];
      const climaxBoost = 1 + rolling * 0.28 + pulse(time, 2.86, 3.48, 4.3) * 0.24;
      cloud.position.set(
        base[0] + Math.sin(time * 2.3 + index * 1.17) * (0.05 + progress * 0.16),
        base[1] + progress * (1.05 + (index % 5) * 0.12) * climaxBoost,
        base[2] + Math.cos(time * 1.9 + index * 0.83) * (0.04 + progress * 0.12),
      );
      const scale = (0.32 + progress * 0.46) * intensity * climaxBoost;
      cloud.scale.set(scale * (0.88 + (index % 3) * 0.08), scale, scale * 0.86);
      cloud.rotation.y = time * (0.32 + (index % 4) * 0.06) + index;
    });

    signalValue = activeEnvelope * (0.32 + heatStrength * 0.68);
    const spread = foodHeights.length > 1 ? Math.max(...foodHeights) - Math.min(...foodHeights) : 0;
    Object.assign(diagnostics, {
      time,
      phase: phaseAt(time, power, airborneFood),
      heatStrength,
      potLift,
      potLanded: time < INDUCTION_COOKTOP_TIMELINE.potLaunchStart || time >= INDUCTION_COOKTOP_TIMELINE.potLanding,
      airborneFood,
      returnedFood,
      highestFoodLift,
      foodHeightSpread: spread,
      visibleBoilBubbles,
      visibleSteamClouds,
      soupRoll,
      returnImpact,
    });
  };

  reset();
  return {
    start,
    apply,
    update: apply,
    reset,
    stop: reset,
    signal: () => running ? signalValue : 0,
    diagnostics,
  };
}
