import * as THREE from 'three';

export const ALARM_CLOCK_TIMELINE = {
  engageEnd: 0.28,
  franticStart: 0.72,
  climaxStart: 3.18,
  climaxEnd: 4.42,
  settleStart: 4.62,
  settleEnd: 5.2,
} as const;

export type AlarmClockPerformancePhase = 'idle' | 'engage' | 'frantic-ring' | 'climax' | 'settling';

export type AlarmClockPerformanceDiagnostics = {
  timelineOwner: 'AppliancePerformanceSystem';
  modelOwner: 'alarm-clock-model-rig';
  sharedSpectacleEffects: 'disabled';
  phase: AlarmClockPerformancePhase;
  time: number;
  motionEnvelope: number;
  bodyShakeX: number;
  bodyLift: number;
  bodyRoll: number;
  leftBellOffset: number;
  rightBellOffset: number;
  hourHandRadians: number;
  minuteHandRadians: number;
  visibleStereoWaves: number;
  visibleVibrationArcs: number;
  structureAttached: boolean;
  rigidBodyScale: readonly [1, 1, 1];
  forbiddenFlatEffects: readonly ['PlaneGeometry', 'Sprite', 'Line'];
};

type Baseline = {
  object: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  visible: boolean;
};

function phaseAt(time: number, motion: number): AlarmClockPerformancePhase {
  if (motion <= 0.001) return 'idle';
  if (time < ALARM_CLOCK_TIMELINE.franticStart) return 'engage';
  if (time < ALARM_CLOCK_TIMELINE.climaxStart) return 'frantic-ring';
  if (time < ALARM_CLOCK_TIMELINE.climaxEnd) return 'climax';
  return 'settling';
}

function named(root: THREE.Group, name: string): THREE.Object3D | null {
  return root.getObjectByName(name) ?? null;
}

function prefixed(root: THREE.Group, prefix: string): THREE.Object3D[] {
  const result: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (object.name.startsWith(prefix)) result.push(object);
  });
  return result;
}

export function createAlarmClockPerformance(root: THREE.Group): {
  apply(time: number, power: number): void;
  reset(): void;
  signal(): number;
  readonly diagnostics: AlarmClockPerformanceDiagnostics;
} {
  const controlled = [
    'alarm-clock-body-pivot',
    'alarm-clock-hour-hand-pivot',
    'alarm-clock-minute-hand-pivot',
    'alarm-clock-bell-1-pivot',
    'alarm-clock-bell-2-pivot',
    'alarm-clock-bell-hammer-1-pivot',
    'alarm-clock-bell-hammer-2-pivot',
    'alarm-clock-top-alarm-lever-pivot',
    'alarm-clock-rear-winding-knob-1-pivot',
    'alarm-clock-rear-winding-knob-2-pivot',
  ].map((name) => named(root, name)).filter((object): object is THREE.Object3D => object !== null);
  const effects = [
    ...prefixed(root, 'alarm-clock-stereo-wave-'),
    ...prefixed(root, 'alarm-clock-vibration-arc-'),
  ];
  const baselines = [...controlled, ...effects].map((object): Baseline => ({
    object,
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
    visible: object.visible,
  }));
  const restore = (): void => {
    baselines.forEach((baseline) => {
      baseline.object.position.copy(baseline.position);
      baseline.object.quaternion.copy(baseline.quaternion);
      baseline.object.scale.copy(baseline.scale);
      baseline.object.visible = baseline.visible;
    });
  };
  let signalValue = 0;
  let diagnostics: AlarmClockPerformanceDiagnostics = {
    timelineOwner: 'AppliancePerformanceSystem',
    modelOwner: 'alarm-clock-model-rig',
    sharedSpectacleEffects: 'disabled',
    phase: 'idle',
    time: 0,
    motionEnvelope: 0,
    bodyShakeX: 0,
    bodyLift: 0,
    bodyRoll: 0,
    leftBellOffset: 0,
    rightBellOffset: 0,
    hourHandRadians: 0,
    minuteHandRadians: 0,
    visibleStereoWaves: 0,
    visibleVibrationArcs: 0,
    structureAttached: false,
    rigidBodyScale: [1, 1, 1],
    forbiddenFlatEffects: ['PlaneGeometry', 'Sprite', 'Line'],
  };

  const apply = (time: number, power: number): void => {
    restore();
    const p = THREE.MathUtils.clamp(power, 0, 1);
    const startup = THREE.MathUtils.smoothstep(time, 0.02, ALARM_CLOCK_TIMELINE.engageEnd);
    const settle = 1 - THREE.MathUtils.smoothstep(time, ALARM_CLOCK_TIMELINE.settleStart, ALARM_CLOCK_TIMELINE.settleEnd);
    const climax = THREE.MathUtils.smoothstep(time, ALARM_CLOCK_TIMELINE.climaxStart, 3.48)
      * (1 - THREE.MathUtils.smoothstep(time, 4.12, ALARM_CLOCK_TIMELINE.climaxEnd));
    const motion = startup * settle * p;
    const intensity = motion * (1 + climax * 0.38);
    const bodyShakeX = Math.sin(time * 33) * 0.13 * intensity;
    const bodyLift = Math.abs(Math.sin(time * 29)) * 0.18 * intensity;
    const bodyRoll = Math.sin(time * 31 + 0.35) * 0.105 * intensity;
    const body = named(root, 'alarm-clock-body-pivot');
    if (body) {
      body.position.x += bodyShakeX;
      body.position.y += bodyLift;
      body.rotation.z += bodyRoll;
    }

    const bellOffsets = [-1, 1].map((side, index) => {
      const offset = Math.sin(time * 55 + index * Math.PI) * 0.25 * intensity;
      const bell = named(root, `alarm-clock-bell-${index + 1}-pivot`);
      if (bell) {
        bell.rotation.z += offset;
        bell.position.x += side * Math.abs(Math.sin(time * 61 + index)) * 0.035 * intensity;
      }
      const hammer = named(root, `alarm-clock-bell-hammer-${index + 1}-pivot`);
      if (hammer) hammer.rotation.z += Math.sin(time * 69 + index * Math.PI) * 0.68 * intensity;
      return offset;
    });
    const hourHandRadians = -time * 4.8 * motion;
    const minuteHandRadians = -time * 32 * motion;
    const hourHand = named(root, 'alarm-clock-hour-hand-pivot');
    const minuteHand = named(root, 'alarm-clock-minute-hand-pivot');
    if (hourHand) hourHand.rotation.z += hourHandRadians;
    if (minuteHand) minuteHand.rotation.z += minuteHandRadians;
    const lever = named(root, 'alarm-clock-top-alarm-lever-pivot');
    if (lever) lever.rotation.x += Math.sin(time * 46) * 0.1 * intensity;
    [1, 2].forEach((index) => {
      const knob = named(root, `alarm-clock-rear-winding-knob-${index}-pivot`);
      if (knob) knob.rotation.z += time * (index === 1 ? 14 : -17) * motion;
    });

    let visibleStereoWaves = 0;
    prefixed(root, 'alarm-clock-stereo-wave-').forEach((wave, index) => {
      const local = ((time - 0.18 - (index % 3) * 0.12) % 0.74 + 0.74) % 0.74;
      const progress = local / 0.74;
      wave.visible = motion > 0.08 && progress < 0.76;
      if (!wave.visible) return;
      visibleStereoWaves += 1;
      const side = Number(wave.userData.side ?? 1);
      const growth = 0.82 + progress * 0.92;
      wave.scale.set(growth * 0.72, growth * 1.22, growth * 0.86);
      wave.position.x += side * progress * 0.38;
      wave.position.z += progress * 0.18;
    });
    let visibleVibrationArcs = 0;
    prefixed(root, 'alarm-clock-vibration-arc-').forEach((arc, index) => {
      const beat = 0.5 + 0.5 * Math.sin(time * 48 + index * 1.57);
      arc.visible = motion > 0.08 && beat > 0.28;
      if (!arc.visible) return;
      visibleVibrationArcs += 1;
      const scale = 0.9 + beat * 0.24;
      arc.scale.set(scale, scale, 0.94 + beat * 0.16);
    });

    const structureAttached = [
      'alarm-clock-carry-handle-pivot',
      'alarm-clock-top-alarm-lever-pivot',
      'alarm-clock-bell-1-pivot',
      'alarm-clock-bell-2-pivot',
      'alarm-clock-bell-hammer-1-pivot',
      'alarm-clock-bell-hammer-2-pivot',
    ].every((name) => named(root, name)?.parent === body);
    signalValue = motion;
    diagnostics = {
      timelineOwner: 'AppliancePerformanceSystem',
      modelOwner: 'alarm-clock-model-rig',
      sharedSpectacleEffects: 'disabled',
      phase: phaseAt(time, motion),
      time,
      motionEnvelope: motion,
      bodyShakeX,
      bodyLift,
      bodyRoll,
      leftBellOffset: bellOffsets[0],
      rightBellOffset: bellOffsets[1],
      hourHandRadians,
      minuteHandRadians,
      visibleStereoWaves,
      visibleVibrationArcs,
      structureAttached,
      rigidBodyScale: [1, 1, 1],
      forbiddenFlatEffects: ['PlaneGeometry', 'Sprite', 'Line'],
    };
    root.userData.alarmClockPerformance = diagnostics;
  };

  const reset = (): void => {
    restore();
    signalValue = 0;
    diagnostics = { ...diagnostics, phase: 'idle', time: 0, motionEnvelope: 0, bodyShakeX: 0, bodyLift: 0, bodyRoll: 0, visibleStereoWaves: 0, visibleVibrationArcs: 0 };
    delete root.userData.alarmClockPerformance;
  };

  return {
    apply,
    reset,
    signal: () => signalValue,
    get diagnostics() { return diagnostics; },
  };
}
