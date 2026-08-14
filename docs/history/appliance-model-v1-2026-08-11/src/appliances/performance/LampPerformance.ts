import * as THREE from 'three';

export const LAMP_PERFORMANCE_DURATION = 5.2;
export const LAMP_BEAM_SOURCE_RADIUS_LOCAL = 0.565;
export const LAMP_BEAM_FAR_TO_NEAR_RATIO = 3.35;

export type LampBeamDiagnostics = {
  timelineTime: number;
  headPhase: LampHeadPhase;
  headPitch: number;
  headRoll: number;
  sourceRadius: number;
  farRadius: number;
  farToNearRatio: number;
  length: number;
  spotAngle: number;
  socket: [number, number, number];
  direction: [number, number, number];
  groundSpot: [number, number, number];
  geometryAxis: '-Y-near/+Y-far';
};

export type LampHeadPhase =
  | 'wake'
  | 'look-left'
  | 'return-from-left'
  | 'look-right'
  | 'return-from-right'
  | 'look-up'
  | 'settle';

export type LampHeadPose = {
  /** Pitch offset from the model-authored rest pose, in radians. */
  pitch: number;
  /** Roll offset from the model-authored rest pose, in radians. */
  roll: number;
  phase: LampHeadPhase;
  segmentProgress: number;
};

type LampHeadKeyframe = {
  time: number;
  pitch: number;
  roll: number;
  phase: LampHeadPhase;
};

/**
 * One non-looping character timeline. Every directional look explicitly comes
 * back through the authored rest pose, so a segment boundary never resets the
 * hinge and the final settle cannot replay an earlier snap.
 */
export const LAMP_HEAD_KEYFRAMES: readonly LampHeadKeyframe[] = [
  { time: 0.00, pitch: 0.00, roll: 0.00, phase: 'wake' },
  { time: 0.34, pitch: 0.00, roll: 0.00, phase: 'wake' },
  { time: 0.70, pitch: 0.00, roll: 0.48, phase: 'look-left' },
  { time: 0.98, pitch: 0.00, roll: 0.48, phase: 'look-left' },
  { time: 1.28, pitch: 0.00, roll: 0.00, phase: 'return-from-left' },
  { time: 1.48, pitch: 0.00, roll: 0.00, phase: 'return-from-left' },
  { time: 1.82, pitch: 0.00, roll: -0.48, phase: 'look-right' },
  { time: 2.10, pitch: 0.00, roll: -0.48, phase: 'look-right' },
  { time: 2.42, pitch: 0.00, roll: 0.00, phase: 'return-from-right' },
  { time: 2.64, pitch: 0.00, roll: 0.00, phase: 'return-from-right' },
  { time: 3.06, pitch: -0.50, roll: 0.00, phase: 'look-up' },
  { time: 3.52, pitch: -0.50, roll: 0.00, phase: 'look-up' },
  { time: 3.94, pitch: -0.08, roll: 0.00, phase: 'settle' },
  { time: 4.72, pitch: -0.08, roll: 0.00, phase: 'settle' },
  { time: LAMP_PERFORMANCE_DURATION, pitch: 0.00, roll: 0.00, phase: 'settle' },
] as const;

export function sampleLampHeadPose(time: number): LampHeadPose {
  const clamped = THREE.MathUtils.clamp(time, 0, LAMP_PERFORMANCE_DURATION);
  for (let index = 1; index < LAMP_HEAD_KEYFRAMES.length; index += 1) {
    const previous = LAMP_HEAD_KEYFRAMES[index - 1];
    const next = LAMP_HEAD_KEYFRAMES[index];
    if (clamped > next.time) continue;
    const duration = Math.max(1e-6, next.time - previous.time);
    const raw = THREE.MathUtils.clamp((clamped - previous.time) / duration, 0, 1);
    const eased = raw * raw * (3 - 2 * raw);
    return {
      pitch: THREE.MathUtils.lerp(previous.pitch, next.pitch, eased),
      roll: THREE.MathUtils.lerp(previous.roll, next.roll, eased),
      phase: next.phase,
      segmentProgress: eased,
    };
  }
  const final = LAMP_HEAD_KEYFRAMES[LAMP_HEAD_KEYFRAMES.length - 1];
  return { pitch: final.pitch, roll: final.roll, phase: final.phase, segmentProgress: 1 };
}
