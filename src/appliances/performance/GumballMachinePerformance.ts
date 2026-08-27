import * as THREE from 'three';

export type GumballMachinePerformancePhase =
  | 'crank-turn'
  | 'capsule-frenzy'
  | 'selection-pause'
  | 'capsule-launch'
  | 'first-bounce'
  | 'second-bounce'
  | 'rolling'
  | 'opening'
  | 'prize-drop'
  | 'prize-first-bounce'
  | 'prize-second-bounce'
  | 'settled';

export type GumballMachinePrizeKind = 'star' | 'flower' | 'key' | 'bear';

export type GumballMachinePerformanceDiagnostics = {
  time: number;
  phase: GumballMachinePerformancePhase;
  crankRotationRadians: number;
  crankCompletedFullTurn: boolean;
  crankReboundRadians: number;
  agitatedCapsules: number;
  topImpactCapsules: number;
  selectionPaused: boolean;
  selectedCapsuleIndex: number;
  outputCapsuleVisible: boolean;
  bounceIndex: 0 | 1 | 2;
  shellSeparation: number;
  prizeKind: GumballMachinePrizeKind;
  toyVisible: boolean;
  toyBounceIndex: 0 | 1 | 2;
  toyGrounded: boolean;
  toyWorldY: number;
  visibleSuccessBursts: number;
  timelineOwner: 'AppliancePerformanceSystem';
  effectOwner: 'gumball-machine-model-rig';
  forbiddenPrimitives: readonly ['PlaneGeometry', 'Sprite', 'Line'];
};

export type GumballMachinePerformance = {
  apply(time: number, power: number): void;
  reset(): void;
};

type CapsuleBaseline = {
  pivot: THREE.Group;
  position: THREE.Vector3;
};

const TWO_PI = Math.PI * 2;
const SELECTED_CAPSULE_INDEX = 9;

function pulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function phaseAt(time: number): GumballMachinePerformancePhase {
  if (time < 0.24) return 'crank-turn';
  if (time < 1.6) return 'capsule-frenzy';
  if (time < 1.86) return 'selection-pause';
  if (time < 3.0) return 'capsule-launch';
  if (time < 3.42) return 'first-bounce';
  if (time < 3.73) return 'second-bounce';
  if (time < 4.05) return 'rolling';
  if (time < 4.42) return 'opening';
  if (time < 4.72) return 'prize-drop';
  if (time < 4.98) return 'prize-first-bounce';
  if (time < 5.17) return 'prize-second-bounce';
  return 'settled';
}

function easedBackOut(progress: number): number {
  const p = THREE.MathUtils.clamp(progress, 0, 1) - 1;
  const overshoot = 1.22;
  return 1 + (overshoot + 1) * p ** 3 + overshoot * p ** 2;
}

/**
 * The model owns every visible prop in this performance. This keeps the live
 * game and gallery on the same named rig and prevents the old spectacle pool
 * from substituting an unrelated generic capsule.
 */
export function createGumballMachinePerformance(root: THREE.Group): GumballMachinePerformance {
  const node = <T extends THREE.Object3D = THREE.Object3D>(name: string): T | null => (
    root.getObjectByName(name) as T | undefined
  ) ?? null;

  const motion = node<THREE.Group>('gumball-machine-motion-pivot');
  const sideCrank = node<THREE.Group>('gumball-machine-side-crank-pivot');
  const frontCrank = node<THREE.Group>('gumball-machine-front-crank-pivot');
  const releaseButton = node<THREE.Mesh>('gumball-machine-front-round-release-button');
  const output = node<THREE.Group>('gumball-machine-output-capsule-motion-pivot');
  const outputLeft = node<THREE.Group>('gumball-machine-output-capsule-left-shell-pivot');
  const outputRight = node<THREE.Group>('gumball-machine-output-capsule-right-shell-pivot');
  const outputToy = node<THREE.Group>('gumball-machine-output-prize-pivot');
  const prizeKinds: readonly GumballMachinePrizeKind[] = ['star', 'flower', 'key', 'bear'];
  const outputPrizes = new Map<GumballMachinePrizeKind, THREE.Mesh>(
    prizeKinds.flatMap((kind) => {
      const prize = node<THREE.Mesh>(`gumball-machine-output-${kind}-prize`);
      return prize ? [[kind, prize] as const] : [];
    }),
  );
  const successBursts = Array.from({ length: 3 }, (_, index) => (
    node<THREE.Group>(`gumball-machine-success-burst-${index + 1}-pivot`)
  )).filter((entry): entry is THREE.Group => Boolean(entry));

  const capsules: CapsuleBaseline[] = [];
  root.traverse((object) => {
    if (!(object instanceof THREE.Group)) return;
    if (!/^gumball-machine-capsule-\d+-pivot$/.test(object.name)) return;
    capsules.push({ pivot: object, position: object.position.clone() });
  });
  capsules.sort((a, b) => a.pivot.name.localeCompare(b.pivot.name, undefined, { numeric: true }));
  const selected = capsules[SELECTED_CAPSULE_INDEX - 1] ?? capsules[0] ?? null;

  const outputLanding = new THREE.Vector3(-0.28, 0.46, 6.8);
  const toyRelease = new THREE.Vector3(-0.22, 1.18, 6.9);
  const toyLanding = new THREE.Vector3(-0.06, 0.2, 7.12);
  let prizeCycleIndex = -1;
  let prizeCycleActive = false;
  let activePrizeKind: GumballMachinePrizeKind = prizeKinds[0];

  const beginPrizeCycle = (): void => {
    prizeCycleIndex = (prizeCycleIndex + 1) % prizeKinds.length;
    activePrizeKind = prizeKinds[prizeCycleIndex];
    prizeCycleActive = true;
  };

  const writeDiagnostics = (diagnostics: GumballMachinePerformanceDiagnostics): void => {
    root.userData.gumballMachinePerformanceDiagnostics = diagnostics;
  };

  const reset = (): void => {
    writeDiagnostics({
      time: 0,
      phase: 'settled',
      crankRotationRadians: 0,
      crankCompletedFullTurn: false,
      crankReboundRadians: 0,
      agitatedCapsules: 0,
      topImpactCapsules: 0,
      selectionPaused: false,
      selectedCapsuleIndex: SELECTED_CAPSULE_INDEX,
      outputCapsuleVisible: false,
      bounceIndex: 0,
      shellSeparation: 0,
      prizeKind: activePrizeKind,
      toyVisible: false,
      toyBounceIndex: 0,
      toyGrounded: false,
      toyWorldY: toyLanding.y,
      visibleSuccessBursts: 0,
      timelineOwner: 'AppliancePerformanceSystem',
      effectOwner: 'gumball-machine-model-rig',
      forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
    });
    prizeCycleActive = false;
  };

  reset();
  return {
    apply: (time, power) => {
      if (!prizeCycleActive) beginPrizeCycle();
      const p = THREE.MathUtils.clamp(power, 0, 1);
      const crankProgress = THREE.MathUtils.clamp((time - 0.04) / 0.58, 0, 1);
      const crankTurn = easedBackOut(crankProgress) * TWO_PI;
      const crankRebound = pulse(time, 0.58, 0.68, 0.84) * -0.24
        + pulse(time, 0.69, 0.77, 0.91) * 0.095;
      const crankRotation = (crankTurn + crankRebound) * p;
      if (sideCrank) sideCrank.rotation.x += crankRotation;
      // The front dial is geared to the side handle, but stays secondary so
      // the requested right-side full revolution remains the readable action.
      if (frontCrank) frontCrank.rotation.z -= crankTurn * 0.18 * p;

      const crankShake = pulse(time, 0.04, 0.34, 0.92) * p;
      const frenzyGate = THREE.MathUtils.smoothstep(time, 0.19, 0.32)
        * (1 - THREE.MathUtils.smoothstep(time, 1.52, 1.66)) * p;
      if (motion) {
        motion.position.x += Math.sin(time * 42) * (0.026 * crankShake + 0.035 * frenzyGate);
        motion.rotation.z += Math.sin(time * 34 + 0.45) * (0.018 * crankShake + 0.025 * frenzyGate);
      }

      let agitatedCapsules = 0;
      let topImpactCapsules = 0;
      capsules.forEach(({ pivot, position }, index) => {
        if (frenzyGate <= 0.001) return;
        agitatedCapsules += 1;
        const phase = index * 1.713;
        const topRunner = index === 2 || index === 8 || index === 10;
        const lift = topRunner
          ? Math.max(0, Math.sin(time * 8.4 + 0.2)) * (0.76 - position.y)
          : Math.sin(time * (10.1 + index * 0.17) + phase) * 0.31;
        if (topRunner && position.y + lift > 0.68) topImpactCapsules += 1;
        // Opposing phases deliberately cross trajectories so the bed reads as
        // collision-driven chaos rather than eleven synchronized bobbers.
        pivot.position.x += (
          Math.sin(time * (11.4 + index * 0.13) + phase) * 0.2
          + Math.sin(time * 6.1 - phase) * 0.09
        ) * frenzyGate;
        pivot.position.y += lift * frenzyGate;
        pivot.position.z += Math.cos(time * (9.2 + index * 0.11) - phase) * 0.19 * frenzyGate;
        pivot.rotation.x += Math.sin(time * 17 + phase) * 0.6 * frenzyGate;
        pivot.rotation.z += Math.cos(time * 15 - phase) * 0.52 * frenzyGate;
      });

      const selectionPaused = time >= 1.62 && time < 1.86;
      if (selected) {
        const selectedPulse = pulse(time, 1.62, 1.72, 1.84) * p;
        selected.pivot.scale.multiplyScalar(1 + selectedPulse * 0.12);
        if (time >= 1.82) {
          const entryProgress = THREE.MathUtils.smoothstep(time, 1.82, 2.16);
          selected.pivot.position.lerpVectors(
            selected.position,
            new THREE.Vector3(0.12, -0.93, 0.27),
            entryProgress,
          );
          selected.pivot.rotation.z += entryProgress * 1.45;
        }
        selected.pivot.visible = time < 2.16;
      }
      if (releaseButton) {
        const press = pulse(time, 1.86, 1.97, 2.12) * p;
        releaseButton.position.z -= press * 0.075;
      }

      let bounceIndex: 0 | 1 | 2 = 0;
      if (output) {
        output.visible = time >= 2.13;
        output.scale.setScalar(output.visible ? 2 : 1);
        output.position.set(0, 0.82, 1.04);
        output.rotation.set(0, 0, 0);
        if (time >= 2.13 && time < 3.0) {
          const travel = THREE.MathUtils.clamp((time - 2.13) / 0.87, 0, 1);
          output.position.set(
            -0.38 * travel,
            0.82 - travel * 0.36 + Math.sin(travel * Math.PI) * 1.35,
            1.04 + travel * 3.8,
          );
          output.rotation.set(travel * 3.4, travel * 1.25, -travel * 4.6);
        } else if (time < 3.42) {
          bounceIndex = 1;
          const bounce = THREE.MathUtils.clamp((time - 3.0) / 0.42, 0, 1);
          output.position.set(
            -0.38 + bounce * 0.08,
            0.46 + Math.sin(bounce * Math.PI) * 0.82,
            4.84 + bounce * 0.91,
          );
          output.rotation.set(3.4 + bounce * 1.9, 1.25 + bounce * 0.5, -4.6 - bounce * 2.4);
        } else if (time < 3.73) {
          bounceIndex = 2;
          const bounce = THREE.MathUtils.clamp((time - 3.42) / 0.31, 0, 1);
          output.position.set(
            -0.3 + bounce * 0.02,
            0.46 + Math.sin(bounce * Math.PI) * 0.38,
            5.75 + bounce * 0.55,
          );
          output.rotation.set(5.3 + bounce * 1.15, 1.75 + bounce * 0.35, -7 - bounce * 1.38);
        } else if (time < 4.05) {
          const roll = THREE.MathUtils.smoothstep(time, 3.73, 4.05);
          output.position.lerpVectors(new THREE.Vector3(-0.28, 0.46, 6.3), outputLanding, roll);
          output.rotation.set(6.45, 2.1, -8.38 - roll * 2.1);
        } else {
          output.position.copy(outputLanding);
          output.rotation.set(0, 0.18, -10.48);
          const shellShake = pulse(time, 4.05, 4.1, 4.18);
          output.rotation.z += Math.sin(time * 72) * shellShake * 0.085;
        }
      }

      const opening = THREE.MathUtils.clamp((time - 4.14) / 0.28, 0, 1);
      const openingOvershoot = easedBackOut(opening);
      if (outputLeft) {
        // Output shells are upper/lower hemispheres. Lift the clear cap
        // vertically so the blue lower half remains one complete bowl.
        outputLeft.position.y += openingOvershoot * 0.42;
        outputLeft.rotation.z += openingOvershoot * 0.22;
      }
      if (outputRight) {
        outputRight.position.y -= openingOvershoot * 0.34;
        outputRight.rotation.z -= openingOvershoot * 0.16;
      }

      let toyVisible = false;
      let toyBounceIndex: 0 | 1 | 2 = 0;
      let toyGrounded = false;
      if (outputToy) {
        toyVisible = time >= 4.2;
        outputToy.visible = toyVisible;
        outputToy.userData.prizeKind = activePrizeKind;
        outputPrizes.forEach((prize, kind) => {
          prize.visible = kind === activePrizeKind;
        });
        if (toyVisible) {
          if (time < 4.42) {
            const reveal = easedBackOut(THREE.MathUtils.clamp((time - 4.2) / 0.22, 0, 1));
            outputToy.position.lerpVectors(
              new THREE.Vector3(outputLanding.x, outputLanding.y + 0.08, outputLanding.z + 0.02),
              toyRelease,
              reveal,
            );
            outputToy.rotation.set(-0.08 + reveal * 0.12, -0.16 + reveal * 0.42, 0.05 - reveal * 0.18);
          } else if (time < 4.72) {
            const drop = THREE.MathUtils.clamp((time - 4.42) / 0.3, 0, 1);
            const gravity = drop * drop;
            outputToy.position.set(
              THREE.MathUtils.lerp(toyRelease.x, toyLanding.x, drop),
              THREE.MathUtils.lerp(toyRelease.y, toyLanding.y, gravity),
              THREE.MathUtils.lerp(toyRelease.z, toyLanding.z, drop),
            );
            outputToy.rotation.set(0.04 + drop * 0.34, 0.26 + drop * 0.9, -0.13 + drop * 0.31);
          } else if (time < 4.98) {
            toyBounceIndex = 1;
            const bounce = THREE.MathUtils.clamp((time - 4.72) / 0.26, 0, 1);
            outputToy.position.copy(toyLanding);
            outputToy.position.y += Math.sin(bounce * Math.PI) * 0.34;
            outputToy.rotation.set(0.38 - bounce * 0.16, 1.16 + bounce * 0.34, 0.18 - bounce * 0.1);
          } else if (time < 5.17) {
            toyBounceIndex = 2;
            const bounce = THREE.MathUtils.clamp((time - 4.98) / 0.19, 0, 1);
            outputToy.position.copy(toyLanding);
            outputToy.position.y += Math.sin(bounce * Math.PI) * 0.13;
            outputToy.rotation.set(0.22 - bounce * 0.08, 1.5 + bounce * 0.18, 0.08 - bounce * 0.05);
          } else {
            toyGrounded = true;
            outputToy.position.copy(toyLanding);
            outputToy.rotation.set(0.14, 1.68, 0.03);
          }
        }
      }

      let visibleSuccessBursts = 0;
      successBursts.forEach((burst, index) => {
        const start = 4.18 + index * 0.07;
        const age = THREE.MathUtils.clamp((time - start) / 0.72, 0, 1);
        const life = Math.sin(age * Math.PI);
        burst.visible = time >= start && time <= start + 0.72 && life > 0.04;
        if (!burst.visible) return;
        visibleSuccessBursts += 1;
        const side = index === 0 ? -1 : index === 1 ? 1 : 0;
        burst.position.set(
          outputLanding.x + side * (0.42 + age * 0.28),
          outputLanding.y + 0.42 + age * (0.5 + index * 0.09),
          outputLanding.z + 0.05 + (index === 2 ? 0.25 : -0.02),
        );
        burst.rotation.set(age * 1.4, time * (2.2 + index * 0.3), side * age * 0.8);
        burst.scale.setScalar(0.52 + life * 0.68);
      });

      writeDiagnostics({
        time,
        phase: phaseAt(time),
        crankRotationRadians: crankRotation,
        crankCompletedFullTurn: crankProgress >= 1,
        crankReboundRadians: crankRebound,
        agitatedCapsules,
        topImpactCapsules,
        selectionPaused,
        selectedCapsuleIndex: SELECTED_CAPSULE_INDEX,
        outputCapsuleVisible: Boolean(output?.visible),
        bounceIndex,
        shellSeparation: openingOvershoot * 0.84,
        prizeKind: activePrizeKind,
        toyVisible,
        toyBounceIndex,
        toyGrounded,
        toyWorldY: outputToy?.position.y ?? toyLanding.y,
        visibleSuccessBursts,
        timelineOwner: 'AppliancePerformanceSystem',
        effectOwner: 'gumball-machine-model-rig',
        forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
      });
    },
    reset,
  };
}
