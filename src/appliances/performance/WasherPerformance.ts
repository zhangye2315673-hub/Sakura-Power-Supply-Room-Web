import * as THREE from 'three';
import type { PoweredAnimationDriver } from '../poweredAnimation';

export const WASHER_SLOW_TUMBLE_ROTATIONS = 2;
export const WASHER_SPIN_PEAK_TIME = 3.55;
export const WASHER_SETTLE_TIME = 5.18;

export type WasherPhase = 'idle' | 'controls' | 'tumble' | 'spin-up' | 'high-spin' | 'braking' | 'settled';

export type WasherPerformanceDiagnostics = {
  time: number;
  phase: WasherPhase;
  drumAngle: number;
  drumSpeed: number;
  slowTumbleRotations: number;
  laundryMode: 'bottom' | 'lift-and-drop' | 'centrifuged' | 'falling';
  cabinetRigidScale: [number, number, number];
  cabinetLift: number;
  cabinetSway: number;
  raisedSide: 'left' | 'right' | 'none';
  footLoads: [number, number, number, number];
  visibleSuds: number;
  visibleDroplets: number;
  finalThud: number;
  timelineOwner: 'AppliancePerformanceSystem';
  modelOwner: 'washer-model-rig';
};

type Pose = {
  object: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  visible: boolean;
};

function phaseAt(time: number, power: number): WasherPhase {
  if (power <= 0.001 || time < 0.08) return 'idle';
  if (time < 0.35) return 'controls';
  if (time < 2.25) return 'tumble';
  if (time < 2.72) return 'spin-up';
  if (time < 4.18) return 'high-spin';
  if (time < WASHER_SETTLE_TIME) return 'braking';
  return 'settled';
}

function ease(time: number, start: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, end);
}

function collect(root: THREE.Group, prefix: string): THREE.Object3D[] {
  const result: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (object.name.startsWith(prefix)) result.push(object);
  });
  return result;
}

/** Washer-only closed performance: one rigid cabinet, one drum and model-owned wet effects. */
export function createWasherPerformance(root: THREE.Group): PoweredAnimationDriver {
  const poses: Pose[] = [];
  root.traverse((object) => poses.push({
    object,
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
    visible: object.visible,
  }));
  const byName = (name: string): THREE.Object3D | null => root.getObjectByName(name) ?? null;
  const drum = byName('washer-drum-rotor');
  const dial = byName('washer-program-dial-pivot');
  const display = byName('washer-display') as THREE.Mesh<THREE.BufferGeometry, THREE.MeshToonMaterial> | null;
  const indicator = byName('status-indicator') as THREE.Mesh<THREE.BufferGeometry, THREE.MeshToonMaterial> | null;
  const laundry = collect(root, 'washer-laundry-volume-');
  const suds = collect(root, 'washer-volumetric-suds-bubble-');
  const droplets = collect(root, 'washer-volumetric-glass-droplet-');
  const feet = collect(root, 'washer-foot-');
  const lightMaterials = [display?.material, indicator?.material].filter((material): material is THREE.MeshToonMaterial => Boolean(material));
  const lightBaselines = lightMaterials.map((material) => ({
    material,
    color: material.color.clone(),
    emissive: material.emissive.clone(),
    emissiveIntensity: material.emissiveIntensity,
  }));
  let signal = 0;

  const restore = (): void => {
    poses.forEach((pose) => {
      pose.object.position.copy(pose.position);
      pose.object.quaternion.copy(pose.quaternion);
      pose.object.scale.copy(pose.scale);
      pose.object.visible = pose.visible;
    });
    lightBaselines.forEach((baseline) => {
      baseline.material.color.copy(baseline.color);
      baseline.material.emissive.copy(baseline.emissive);
      baseline.material.emissiveIntensity = baseline.emissiveIntensity;
    });
  };

  return {
    update(time, power) {
      restore();
      const p = THREE.MathUtils.clamp(power, 0, 1);
      const phase = phaseAt(time, p);
      const controls = ease(time, 0.08, 0.34) * p;
      const tumble = ease(time, 0.35, 0.52) * (1 - ease(time, 2.16, 2.34)) * p;
      const slowProgress = THREE.MathUtils.clamp((time - 0.35) / 1.9, 0, 1);
      const spinUp = ease(time, 2.2, 2.74) * p;
      const brake = 1 - ease(time, 4.18, WASHER_SETTLE_TIME);
      const highSpin = spinUp * brake;
      const slowAngle = -Math.PI * 2 * WASHER_SLOW_TUMBLE_ROTATIONS * slowProgress;
      const fastElapsed = Math.max(0, time - 2.2);
      const drumAngle = slowAngle - fastElapsed * (8 + highSpin * 22);
      const drumSpeed = tumble * (Math.PI * 4 / 1.9) + highSpin * 30;
      if (drum) drum.rotation.z = drumAngle;
      if (dial) dial.rotation.z = -Math.PI * 0.82 * controls;
      if (display) {
        display.material.emissive.setHex(0xff8daa);
        display.material.emissiveIntensity = controls * (0.72 + Math.sin(time * 8) * 0.12);
      }
      if (indicator) {
        indicator.material.emissive.setHex(0xff718f);
        indicator.material.emissiveIntensity = controls * 1.25;
      }

      let laundryMode: WasherPerformanceDiagnostics['laundryMode'] = 'bottom';
      laundry.forEach((cloth, index) => {
        const baseAngle = -2.25 + index * 0.56;
        if (tumble > 0.01) {
          laundryMode = 'lift-and-drop';
          const cycle = ((slowProgress * WASHER_SLOW_TUMBLE_ROTATIONS + index * 0.13) % 1 + 1) % 1;
          const carried = Math.min(cycle / 0.68, 1);
          const fall = THREE.MathUtils.smoothstep(cycle, 0.68, 1);
          const angle = baseAngle + carried * Math.PI * 1.36;
          const radius = THREE.MathUtils.lerp(0.43, 0.2, fall);
          cloth.position.x = Math.cos(angle) * radius;
          cloth.position.y = Math.sin(angle) * radius - fall * 0.32;
          cloth.position.z = 0.02 - index * 0.035;
          cloth.rotation.z = angle + fall * 1.5;
        } else if (time >= 4.18) {
          laundryMode = 'falling';
          const fall = ease(time, 4.18 + index * 0.035, 4.72 + index * 0.035);
          cloth.position.x = THREE.MathUtils.lerp(Math.cos(baseAngle) * 0.42, (index - 2) * 0.13, fall);
          cloth.position.y = THREE.MathUtils.lerp(Math.sin(baseAngle) * 0.42, -0.46 + index % 2 * 0.04, fall);
          cloth.position.z = -0.05 - index * 0.035;
          cloth.rotation.z += fall * (index % 2 ? 0.9 : -0.7);
        } else if (highSpin > 0.08) {
          laundryMode = 'centrifuged';
          const angle = baseAngle + drumAngle * 0.98;
          cloth.position.x = Math.cos(angle) * 0.49;
          cloth.position.y = Math.sin(angle) * 0.49;
          cloth.position.z = -0.08 - index * 0.045;
          cloth.rotation.z = angle;
        }
      });

      const imbalance = ease(time, 2.78, 3.05) * (1 - ease(time, 4.05, 4.48)) * p;
      const thud = Math.sin(Math.PI * THREE.MathUtils.clamp((time - 4.48) / 0.18, 0, 1)) * p;
      const sway = Math.sin(time * 34) * 0.075 * imbalance;
      const liftWave = Math.max(0, Math.sin(time * 22 + 0.8)) * 0.075 * imbalance;
      const tilt = Math.sin(time * 19) * 0.028 * imbalance + thud * 0.012;
      root.position.x += sway;
      root.position.y += liftWave + thud * 0.025;
      root.rotation.z += tilt;
      const footLoads: [number, number, number, number] = [0, 0, 0, 0];
      feet.forEach((foot, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const load = THREE.MathUtils.clamp(1 - side * tilt * 8 - liftWave * 2.2, 0.68, 1.18);
        foot.scale.y *= load;
        foot.position.y -= (1 - load) * 0.045;
        footLoads[index] = load;
      });

      suds.forEach((bubble, index) => {
        bubble.visible = time >= 0.75 && time < 4.45 && index < 3 + Math.round(tumble * 3);
        bubble.position.y += Math.sin(time * 3.4 + index) * 0.025;
      });
      droplets.forEach((drop, index) => {
        drop.visible = time >= 1.05 && time < 5.05 && index < 2 + Math.round(highSpin * 3);
        drop.position.y -= ((time * (0.025 + index * 0.004)) % 0.12);
      });
      signal = Math.max(controls, tumble, highSpin, thud);
      root.userData.washerPerformanceDiagnostics = {
        time,
        phase,
        drumAngle,
        drumSpeed,
        slowTumbleRotations: WASHER_SLOW_TUMBLE_ROTATIONS,
        laundryMode,
        cabinetRigidScale: [root.scale.x, root.scale.y, root.scale.z],
        cabinetLift: liftWave + thud * 0.025,
        cabinetSway: sway,
        raisedSide: Math.abs(tilt) < 0.001 ? 'none' : tilt > 0 ? 'left' : 'right',
        footLoads,
        visibleSuds: suds.filter((part) => part.visible).length,
        visibleDroplets: droplets.filter((part) => part.visible).length,
        finalThud: thud,
        timelineOwner: 'AppliancePerformanceSystem',
        modelOwner: 'washer-model-rig',
      } satisfies WasherPerformanceDiagnostics;
    },
    stop() {
      restore();
      signal = 0;
      delete root.userData.washerPerformanceDiagnostics;
    },
    signal: () => signal,
  };
}
