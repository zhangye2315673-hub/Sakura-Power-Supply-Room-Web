import * as THREE from 'three';
import { poweredControlTurn } from '../animation';

const TAU = Math.PI * 2;

export const FAN_TIMELINE = Object.freeze({
  startupDelay: 0.08,
  startupEnd: 0.88,
  cruiseEnd: 4.35,
  stopEnd: 5.2,
  completedRevolutions: 12,
});

const startupDuration = FAN_TIMELINE.startupEnd - FAN_TIMELINE.startupDelay;
const cruiseDuration = FAN_TIMELINE.cruiseEnd - FAN_TIMELINE.startupEnd;
const decelerationDuration = FAN_TIMELINE.stopEnd - FAN_TIMELINE.cruiseEnd;
const integratedFullSpeedSeconds = startupDuration * 0.5
  + cruiseDuration
  + decelerationDuration * 0.5;

/**
 * The maximum speed is derived from an integer final revolution count. This
 * makes the 5.2 s stopped pose exactly equivalent to the authored rest pose,
 * so the gallery's reset/loop seam cannot visibly flip the blades.
 */
export const FAN_MAX_ANGULAR_SPEED = FAN_TIMELINE.completedRevolutions * TAU
  / integratedFullSpeedSeconds;

export type FanRotorPhase = 'idle' | 'accelerating' | 'steady' | 'decelerating' | 'stopped';

export type FanRotorSample = {
  time: number;
  phase: FanRotorPhase;
  angle: number;
  angularSpeed: number;
  normalizedSpeed: number;
};

export type FanPerformanceDiagnostics = FanRotorSample & {
  finalOrientationError: number;
  timelineOwner: 'ApplianceMechanics/FanPerformance';
};

export type FanPerformanceController = {
  apply: (time: number, power: number) => void;
  reset: () => void;
  signal: () => number;
  diagnostics: FanPerformanceDiagnostics;
};

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function smoothstep01(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

/** Integral of smoothstep01 from 0 to u. */
function integratedSmoothstep01(value: number): number {
  const t = clamp01(value);
  return t * t * t - 0.5 * t * t * t * t;
}

/** Integral of (1 - smoothstep01) from 0 to u. */
function integratedReverseSmoothstep01(value: number): number {
  const t = clamp01(value);
  return t - t * t * t + 0.5 * t * t * t * t;
}

/**
 * Analytic angle sampling keeps the result independent of frame rate and of
 * preview seeks. Angle is never computed as `time * variableSpeed`.
 */
export function sampleFanRotorMotion(rawTime: number): FanRotorSample {
  const time = Math.max(0, rawTime);
  let phase: FanRotorPhase = 'idle';
  let normalizedSpeed = 0;
  let integratedSeconds = 0;

  if (time >= FAN_TIMELINE.stopEnd) {
    phase = 'stopped';
    integratedSeconds = integratedFullSpeedSeconds;
  } else if (time >= FAN_TIMELINE.cruiseEnd) {
    phase = 'decelerating';
    const u = (time - FAN_TIMELINE.cruiseEnd) / decelerationDuration;
    normalizedSpeed = 1 - smoothstep01(u);
    integratedSeconds = startupDuration * 0.5
      + cruiseDuration
      + decelerationDuration * integratedReverseSmoothstep01(u);
  } else if (time >= FAN_TIMELINE.startupEnd) {
    phase = 'steady';
    normalizedSpeed = 1;
    integratedSeconds = startupDuration * 0.5 + time - FAN_TIMELINE.startupEnd;
  } else if (time >= FAN_TIMELINE.startupDelay) {
    phase = 'accelerating';
    const u = (time - FAN_TIMELINE.startupDelay) / startupDuration;
    normalizedSpeed = smoothstep01(u);
    integratedSeconds = startupDuration * integratedSmoothstep01(u);
  }

  return {
    time,
    phase,
    angle: -integratedSeconds * FAN_MAX_ANGULAR_SPEED,
    angularSpeed: normalizedSpeed * FAN_MAX_ANGULAR_SPEED,
    normalizedSpeed,
  };
}

export function createFanPerformance(root: THREE.Group): FanPerformanceController {
  const rotor = root.getObjectByName('fan-rotor-pivot');
  const yaw = root.getObjectByName('fan-oscillation-pivot');
  const hinge = root.getObjectByName('fan-head-hinge');
  const dial = root.getObjectByName('fan-speed-dial-pivot');
  const rotorRest = rotor?.rotation.z ?? 0;
  const yawRest = yaw?.rotation.y ?? 0;
  const hingeRest = hinge?.rotation.x ?? 0;
  const dialRest = dial?.rotation.z ?? 0;
  let signalValue = 0;

  const diagnostics: FanPerformanceDiagnostics = {
    ...sampleFanRotorMotion(0),
    finalOrientationError: 0,
    timelineOwner: 'ApplianceMechanics/FanPerformance',
  };
  root.userData.fanPerformanceDiagnostics = diagnostics;

  const apply = (time: number, power: number): void => {
    const sample = sampleFanRotorMotion(time);
    const activity = sample.normalizedSpeed;
    if (rotor) {
      rotor.rotation.z = rotorRest + sample.angle;
      rotor.userData.performancePhase = sample.phase;
      rotor.userData.angularSpeed = sample.angularSpeed;
    }
    if (yaw) yaw.rotation.y = yawRest + Math.sin(time * 1.12) * 0.28 * activity;
    if (hinge) hinge.rotation.x = hingeRest + Math.sin(time * 0.9) * 0.025 * activity;
    if (dial) dial.rotation.z = dialRest + poweredControlTurn(time, power, -Math.PI * 0.7);
    signalValue = activity;
    Object.assign(diagnostics, sample, {
      finalOrientationError: Math.abs(Math.sin(sample.angle * 0.5)),
    });
  };

  const reset = (): void => {
    if (rotor) rotor.rotation.z = rotorRest;
    if (yaw) yaw.rotation.y = yawRest;
    if (hinge) hinge.rotation.x = hingeRest;
    if (dial) dial.rotation.z = dialRest;
    signalValue = 0;
    Object.assign(diagnostics, sampleFanRotorMotion(0), { finalOrientationError: 0 });
  };

  return {
    apply,
    reset,
    signal: () => signalValue,
    diagnostics,
  };
}
