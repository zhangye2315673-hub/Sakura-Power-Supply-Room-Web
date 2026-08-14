import * as THREE from 'three';

const TAU = Math.PI * 2;

export const BUBBLE_MACHINE_TIMELINE = Object.freeze({
  startupEnd: 0.42,
  streamStart: 0.22,
  giantLaunch: 3.18,
  giantBurst: 4.62,
  settleStart: 4.84,
  stopEnd: 5.2,
  ordinaryBubbleCount: 48,
  burstFragmentCount: 8,
  previousGenericPoolCapacity: 30,
});

export type BubbleMachinePerformancePhase =
  | 'idle'
  | 'spin-up'
  | 'bubble-stream'
  | 'giant-rise'
  | 'giant-burst'
  | 'settle';

export type BubbleMachinePerformanceDiagnostics = {
  time: number;
  phase: BubbleMachinePerformancePhase;
  motionEnvelope: number;
  ordinaryBubbleCount: number;
  visibleOrdinaryBubbles: number;
  sizeClasses: string[];
  minimumConfiguredTravelDistance: number;
  currentMaximumTravelDistance: number;
  currentLateralSpread: number;
  currentHeightSpread: number;
  minimumFlightDuration: number;
  maximumFlightDuration: number;
  minimumDriftRate: number;
  maximumDriftRate: number;
  giantBubbleVisible: boolean;
  giantBubbleRadius: number;
  giantBubbleTopY: number;
  giantBurstTime: number;
  visibleBurstFragments: number;
  burstFragmentCount: number;
  allEffectsVolumetric: true;
  effectOwner: 'BubbleMachinePerformance';
  timelineOwner: 'ApplianceMechanics/BubbleMachinePerformance';
  sharedSpectacleEffects: 'disabled';
};

export type BubbleMachinePerformanceController = {
  apply(time: number, power: number): void;
  reset(): void;
  signal(): number;
  diagnostics: BubbleMachinePerformanceDiagnostics;
};

type OrdinaryBubbleRig = {
  index: number;
  pivot: THREE.Group;
  baseRadius: number;
  launchTime: number;
  flightDuration: number;
  lateralTravel: number;
  riseTravel: number;
  forwardTravel: number;
  configuredTravelDistance: number;
  driftAmplitude: number;
  driftRate: number;
  driftPhase: number;
  sizeClass: string;
};

type BurstFragmentRig = {
  mesh: THREE.Mesh;
  index: number;
  direction: THREE.Vector3;
  miniBubble: boolean;
};

function suffixIndex(name: string): number {
  return Number(name.match(/(\d+)$/)?.[1] ?? 0);
}

function numberData(object: THREE.Object3D, key: string, fallback = 0): number {
  const value = Number(object.userData[key]);
  return Number.isFinite(value) ? value : fallback;
}

function vectorData(object: THREE.Object3D, key: string): THREE.Vector3 {
  const value = object.userData[key];
  return Array.isArray(value) && value.length >= 3
    ? new THREE.Vector3(Number(value[0]), Number(value[1]), Number(value[2]))
    : new THREE.Vector3();
}

/** Integral of a continuous accelerate / cruise / decelerate velocity curve. */
function integratedSpin(
  time: number,
  start: number,
  accelerationEnd: number,
  decelerationStart: number,
  end: number,
  angularVelocity: number,
): number {
  const localTime = Math.max(0, time - start);
  const accelerationDuration = Math.max(0.0001, accelerationEnd - start);
  const cruiseDuration = Math.max(0, decelerationStart - accelerationEnd);
  const decelerationDuration = Math.max(0.0001, end - decelerationStart);
  if (localTime <= accelerationDuration) {
    return angularVelocity * localTime * localTime / (2 * accelerationDuration);
  }
  const accelerationArea = angularVelocity * accelerationDuration * 0.5;
  if (time <= decelerationStart) {
    return accelerationArea + angularVelocity * (time - accelerationEnd);
  }
  const cruiseArea = angularVelocity * cruiseDuration;
  const decelerationTime = Math.min(decelerationDuration, Math.max(0, time - decelerationStart));
  return accelerationArea + cruiseArea + angularVelocity * (
    decelerationTime - decelerationTime * decelerationTime / (2 * decelerationDuration)
  );
}

export function createBubbleMachinePerformance(
  root: THREE.Group,
): BubbleMachinePerformanceController {
  const outputSocket = root.getObjectByName('bubble-machine-output-socket');
  const control = root.getObjectByName('bubble-machine-control-knob-pivot');
  const wheel = root.getObjectByName('bubble-machine-bubble-wheel-pivot');
  const fan = root.getObjectByName('bubble-machine-rear-fan-rotor-pivot');
  const controlRest = control?.quaternion.clone();
  const wheelRest = wheel?.quaternion.clone();
  const fanRest = fan?.quaternion.clone();
  const giant = root.getObjectByName('bubble-machine-giant-bubble') as THREE.Group | undefined;
  const burstRig = root.getObjectByName('bubble-machine-giant-bubble-burst-rig') as THREE.Group | undefined;
  const ordinary: OrdinaryBubbleRig[] = [];
  const burstFragments: BurstFragmentRig[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.Group && /^bubble-machine-performance-bubble-\d+$/.test(object.name)) {
      ordinary.push({
        index: suffixIndex(object.name),
        pivot: object,
        baseRadius: numberData(object, 'baseRadius', 0.16),
        launchTime: numberData(object, 'launchTime', 0.22),
        flightDuration: numberData(object, 'flightDuration', 3.6),
        lateralTravel: numberData(object, 'lateralTravel', 9.5),
        riseTravel: numberData(object, 'riseTravel', 5.5),
        forwardTravel: numberData(object, 'forwardTravel', 6.4),
        configuredTravelDistance: numberData(object, 'configuredTravelDistance', 12),
        driftAmplitude: numberData(object, 'driftAmplitude', 0.4),
        driftRate: numberData(object, 'driftRate', 1),
        driftPhase: numberData(object, 'driftPhase', 0),
        sizeClass: String(object.userData.sizeClass ?? 'unknown'),
      });
    }
    if (object instanceof THREE.Mesh && /^bubble-machine-burst-(?:mini-bubble|light-point)-\d+$/.test(object.name)) {
      burstFragments.push({
        mesh: object,
        index: numberData(object, 'fragmentIndex', suffixIndex(object.name) - 1),
        direction: vectorData(object, 'fragmentDirection'),
        miniBubble: object.name.includes('mini-bubble'),
      });
    }
  });
  ordinary.sort((first, second) => first.index - second.index);
  burstFragments.sort((first, second) => first.index - second.index);

  const minimumConfiguredTravelDistance = ordinary.length > 0
    ? Math.min(...ordinary.map((bubble) => bubble.configuredTravelDistance))
    : 0;
  const flightDurations = ordinary.map((bubble) => bubble.flightDuration);
  const driftRates = ordinary.map((bubble) => bubble.driftRate);
  const sizeClasses = [...new Set(ordinary.map((bubble) => bubble.sizeClass))];
  const emitterLocal = new THREE.Vector3(-0.76, 1.53, 1.015);
  const sample = new THREE.Vector3();
  const giantBurstOrigin = new THREE.Vector3();
  let signalValue = 0;

  const diagnostics: BubbleMachinePerformanceDiagnostics = {
    time: 0,
    phase: 'idle',
    motionEnvelope: 0,
    ordinaryBubbleCount: ordinary.length,
    visibleOrdinaryBubbles: 0,
    sizeClasses,
    minimumConfiguredTravelDistance,
    currentMaximumTravelDistance: 0,
    currentLateralSpread: 0,
    currentHeightSpread: 0,
    minimumFlightDuration: flightDurations.length > 0 ? Math.min(...flightDurations) : 0,
    maximumFlightDuration: flightDurations.length > 0 ? Math.max(...flightDurations) : 0,
    minimumDriftRate: driftRates.length > 0 ? Math.min(...driftRates) : 0,
    maximumDriftRate: driftRates.length > 0 ? Math.max(...driftRates) : 0,
    giantBubbleVisible: false,
    giantBubbleRadius: giant ? numberData(giant, 'baseRadius', 0) : 0,
    giantBubbleTopY: 0,
    giantBurstTime: giant ? numberData(giant, 'burstTime', BUBBLE_MACHINE_TIMELINE.giantBurst) : 0,
    visibleBurstFragments: 0,
    burstFragmentCount: burstFragments.length,
    allEffectsVolumetric: true,
    effectOwner: 'BubbleMachinePerformance',
    timelineOwner: 'ApplianceMechanics/BubbleMachinePerformance',
    sharedSpectacleEffects: 'disabled',
  };
  root.userData.bubbleMachinePerformanceDiagnostics = diagnostics;

  const readEmitterLocal = (): THREE.Vector3 => {
    if (!outputSocket) return emitterLocal;
    root.updateWorldMatrix(true, true);
    outputSocket.getWorldPosition(emitterLocal);
    root.worldToLocal(emitterLocal);
    return emitterLocal;
  };

  const reset = (): void => {
    readEmitterLocal();
    if (control && controlRest) control.quaternion.copy(controlRest);
    if (wheel && wheelRest) wheel.quaternion.copy(wheelRest);
    if (fan && fanRest) fan.quaternion.copy(fanRest);
    ordinary.forEach(({ pivot }) => {
      pivot.visible = false;
      pivot.position.copy(emitterLocal);
      pivot.rotation.set(0, 0, 0);
      pivot.scale.set(1, 1, 1);
    });
    if (giant) {
      giant.visible = false;
      giant.position.copy(emitterLocal);
      giant.rotation.set(0, 0, 0);
      giant.scale.set(1, 1, 1);
    }
    if (burstRig) {
      burstRig.visible = false;
      burstRig.position.copy(emitterLocal);
      burstRig.rotation.set(0, 0, 0);
      burstRig.scale.set(1, 1, 1);
    }
    burstFragments.forEach(({ mesh }) => {
      mesh.visible = false;
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
    });
    signalValue = 0;
    Object.assign(diagnostics, {
      time: 0,
      phase: 'idle',
      motionEnvelope: 0,
      visibleOrdinaryBubbles: 0,
      currentMaximumTravelDistance: 0,
      currentLateralSpread: 0,
      currentHeightSpread: 0,
      giantBubbleVisible: false,
      giantBubbleTopY: 0,
      visibleBurstFragments: 0,
    });
  };

  const apply = (rawTime: number, rawPower: number): void => {
    const time = Math.max(0, rawTime);
    const power = THREE.MathUtils.clamp(rawPower, 0, 1);
    const startup = THREE.MathUtils.smoothstep(time, 0.04, BUBBLE_MACHINE_TIMELINE.startupEnd);
    const settle = 1 - THREE.MathUtils.smoothstep(
      time,
      BUBBLE_MACHINE_TIMELINE.settleStart,
      BUBBLE_MACHINE_TIMELINE.stopEnd,
    );
    const envelope = startup * settle * power;
    signalValue = envelope;
    readEmitterLocal();

    const controlTurn = THREE.MathUtils.smoothstep(time, 0.04, 0.34)
      * (1 - THREE.MathUtils.smoothstep(time, 4.96, BUBBLE_MACHINE_TIMELINE.stopEnd)) * power;
    if (control && controlRest) {
      control.quaternion.copy(controlRest);
      control.rotateY(Math.PI * 1.45 * controlTurn);
    }
    if (wheel && wheelRest) {
      wheel.quaternion.copy(wheelRest);
      wheel.rotateZ(-integratedSpin(time, 0.12, 0.54, 4.68, 5.18, 8.6) * power);
    }
    if (fan && fanRest) {
      fan.quaternion.copy(fanRest);
      fan.rotateZ(integratedSpin(time, 0.08, 0.46, 4.72, 5.18, 18.4) * power);
    }

    let visibleOrdinaryBubbles = 0;
    let currentMaximumTravelDistance = 0;
    let minimumX = Number.POSITIVE_INFINITY;
    let maximumX = Number.NEGATIVE_INFINITY;
    let minimumY = Number.POSITIVE_INFINITY;
    let maximumY = Number.NEGATIVE_INFINITY;
    ordinary.forEach((bubble) => {
      const age = time - bubble.launchTime;
      const progress = age / bubble.flightDuration;
      const active = age >= 0 && progress < 1 && envelope > 0.003;
      bubble.pivot.visible = active;
      if (!active) return;
      const clamped = THREE.MathUtils.clamp(progress, 0, 1);
      const travelProgress = THREE.MathUtils.smootherstep(clamped, 0, 1);
      const driftGate = 0.18 + travelProgress * 0.82;
      const drift = Math.sin(time * TAU * bubble.driftRate + bubble.driftPhase)
        * bubble.driftAmplitude * driftGate;
      const bob = Math.sin(time * TAU * (0.42 + bubble.index % 5 * 0.055) + bubble.driftPhase * 0.72)
        * (0.08 + travelProgress * 0.18);
      bubble.pivot.position.set(
        emitterLocal.x + bubble.lateralTravel * travelProgress + drift,
        emitterLocal.y + bubble.riseTravel * travelProgress + bob,
        emitterLocal.z + bubble.forwardTravel * travelProgress
          + Math.cos(time * bubble.driftRate + bubble.driftPhase) * 0.16 * driftGate,
      );
      bubble.pivot.rotation.set(
        Math.sin(time * 0.72 + bubble.driftPhase) * 0.24,
        time * (0.18 + bubble.index % 7 * 0.035),
        Math.cos(time * 0.61 + bubble.driftPhase) * 0.18,
      );
      const appear = THREE.MathUtils.smoothstep(clamped, 0, 0.055);
      const depart = 1 - THREE.MathUtils.smoothstep(clamped, 0.91, 1);
      const radius = bubble.baseRadius * Math.max(0.001, appear * depart) * power;
      bubble.pivot.scale.setScalar(radius);
      sample.copy(bubble.pivot.position).sub(emitterLocal);
      currentMaximumTravelDistance = Math.max(currentMaximumTravelDistance, sample.length());
      minimumX = Math.min(minimumX, bubble.pivot.position.x);
      maximumX = Math.max(maximumX, bubble.pivot.position.x);
      minimumY = Math.min(minimumY, bubble.pivot.position.y);
      maximumY = Math.max(maximumY, bubble.pivot.position.y);
      visibleOrdinaryBubbles += 1;
    });

    let giantBubbleTopY = 0;
    const giantLaunch = giant ? numberData(giant, 'launchTime', BUBBLE_MACHINE_TIMELINE.giantLaunch) : 0;
    const giantBurst = giant ? numberData(giant, 'burstTime', BUBBLE_MACHINE_TIMELINE.giantBurst) : 0;
    const giantAge = time - giantLaunch;
    const giantDuration = Math.max(0.001, giantBurst - giantLaunch);
    const giantProgress = THREE.MathUtils.clamp(giantAge / giantDuration, 0, 1);
    const giantActive = Boolean(giant && giantAge >= 0 && time < giantBurst && envelope > 0.003);
    if (giant) {
      giant.visible = giantActive;
      if (giantActive) {
        const rise = THREE.MathUtils.smootherstep(giantProgress, 0, 1);
        const radius = numberData(giant, 'baseRadius', 0.94)
          * (0.16 + THREE.MathUtils.smoothstep(giantProgress, 0, 0.34) * 0.84) * power;
        giant.position.set(
          emitterLocal.x + numberData(giant, 'lateralTravel', 0.95) * rise
            + Math.sin(time * 1.36) * 0.26 * rise,
          emitterLocal.y + numberData(giant, 'riseTravel', 6.2) * rise,
          emitterLocal.z + numberData(giant, 'forwardTravel', 2.15) * rise,
        );
        giant.rotation.set(Math.sin(time * 0.7) * 0.13, time * 0.18, Math.cos(time * 0.56) * 0.11);
        giant.scale.setScalar(radius);
        giantBubbleTopY = giant.position.y + radius;
      }
    }

    giantBurstOrigin.set(
      emitterLocal.x + (giant ? numberData(giant, 'lateralTravel', 0.95) : 0.95),
      emitterLocal.y + (giant ? numberData(giant, 'riseTravel', 6.2) : 6.2),
      emitterLocal.z + (giant ? numberData(giant, 'forwardTravel', 2.15) : 2.15),
    );
    const burstAge = time - giantBurst;
    const burstProgress = THREE.MathUtils.clamp(burstAge / 0.72, 0, 1);
    const burstActive = burstAge >= 0 && burstAge < 0.72 && envelope > 0.003;
    if (burstRig) {
      burstRig.visible = burstActive;
      burstRig.position.copy(giantBurstOrigin);
    }
    let visibleBurstFragments = 0;
    burstFragments.forEach(({ mesh, index, direction, miniBubble }) => {
      mesh.visible = burstActive;
      if (!burstActive) return;
      const distance = (0.2 + burstProgress * (1.25 + index % 3 * 0.18));
      mesh.position.copy(direction).multiplyScalar(distance);
      mesh.position.y -= burstProgress * burstProgress * 0.46;
      mesh.rotation.set(
        burstProgress * (2.2 + index * 0.18),
        burstProgress * (1.7 + index * 0.23),
        burstProgress * (2.8 + index * 0.12),
      );
      const fade = 1 - THREE.MathUtils.smoothstep(burstProgress, 0.58, 1);
      mesh.scale.setScalar((miniBubble ? 0.18 : 0.62) * Math.max(0.001, fade) * power);
      visibleBurstFragments += 1;
    });

    const phase: BubbleMachinePerformancePhase = power <= 0.003
      ? 'idle'
      : time < BUBBLE_MACHINE_TIMELINE.startupEnd
        ? 'spin-up'
        : time < BUBBLE_MACHINE_TIMELINE.giantLaunch
          ? 'bubble-stream'
          : time < BUBBLE_MACHINE_TIMELINE.giantBurst
            ? 'giant-rise'
            : time < BUBBLE_MACHINE_TIMELINE.settleStart
              ? 'giant-burst'
              : 'settle';
    Object.assign(diagnostics, {
      time,
      phase,
      motionEnvelope: envelope,
      visibleOrdinaryBubbles,
      currentMaximumTravelDistance,
      currentLateralSpread: visibleOrdinaryBubbles > 1 ? maximumX - minimumX : 0,
      currentHeightSpread: visibleOrdinaryBubbles > 1 ? maximumY - minimumY : 0,
      giantBubbleVisible: giantActive,
      giantBubbleTopY,
      visibleBurstFragments,
    });
  };

  reset();
  return { apply, reset, signal: () => signalValue, diagnostics };
}
