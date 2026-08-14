import * as THREE from 'three';

export const PHONE_TIMELINE_OWNER = 'AppliancePerformanceSystem';

export type PhonePerformancePhase =
  | 'screen-wake'
  | 'incoming-call'
  | 'urgent-reminder'
  | 'settling';

export type PhonePerformanceDiagnostics = {
  timelineOwner: typeof PHONE_TIMELINE_OWNER;
  modelOwner: 'phone-model-rig';
  sharedSpectacleEffects: 'disabled';
  phase: PhonePerformancePhase;
  timeline: number;
  screenLit: boolean;
  promptVisible: boolean;
  avatarPulse: number;
  answerPulse: number;
  bodyLift: number;
  bodyShakeX: number;
  bodyRoll: number;
  visibleStereoWaveRings: number;
  visibleVibrationPulses: number;
  visibleCallSignalArcs: number;
  visibleSoftLightPoints: number;
  visibleInformationParticles: number;
  forbiddenFlatEffects: readonly ['PlaneGeometry', 'Sprite', 'Line'];
  forbiddenThemes: readonly ['combat-star', 'electric-bolt', 'ultimate-attack'];
};

function pulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function phaseAt(time: number): PhonePerformancePhase {
  if (time < 0.32) return 'screen-wake';
  if (time < 1.35) return 'incoming-call';
  if (time < 4.72) return 'urgent-reminder';
  return 'settling';
}

function glow(target: THREE.Object3D | null, strength: number, color: number): void {
  target?.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      const toon = material as THREE.MeshToonMaterial;
      if (!toon.emissive) return;
      toon.emissive.setHex(strength > 0.01 ? color : 0x000000);
      toon.emissiveIntensity = strength;
    });
  });
}

function named<T extends THREE.Object3D = THREE.Object3D>(root: THREE.Group, name: string): T | null {
  return (root.getObjectByName(name) as T | undefined) ?? null;
}

function prefixed(root: THREE.Group, prefix: string): THREE.Object3D[] {
  const result: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (object.name.startsWith(prefix)) result.push(object);
  });
  return result;
}

/**
 * One deterministic incoming-call performance for game and gallery. The body
 * lift/shake/roll values intentionally match the previous phone branch in
 * ApplianceMechanics; only the screen language and volumetric feedback change.
 * The shared caller restores the authored baseline before each sample.
 */
export function applyPhonePerformance(root: THREE.Group, time: number, power: number): void {
  const p = THREE.MathUtils.clamp(power, 0, 1);
  const startup = THREE.MathUtils.smoothstep(time, 0.02, 0.42);
  const run = startup * p;
  const anticipation = pulse(time, 2.8, 3.42, 3.72) * p;
  const liftEnvelope = pulse(time, 0.35, 3.65, 5.15) * p;
  const bodyLift = liftEnvelope * (0.72 + anticipation * 0.22);
  const bodyShakeX = Math.sin(time * 39) * 0.055 * run;
  const bodyRoll = Math.sin(time * 35) * 0.045 * run;
  const handset = named(root, 'phone-handset-pivot');
  if (handset) {
    handset.position.y += bodyLift;
    handset.position.x += bodyShakeX;
    handset.rotation.z += bodyRoll;
  }

  const wake = THREE.MathUtils.smoothstep(time, 0.035, 0.15) * p;
  const settle = 1 - THREE.MathUtils.smoothstep(time, 4.64, 5.15);
  const reminderGate = THREE.MathUtils.smoothstep(time, 0.42, 0.72) * settle * p;
  const screenLit = wake > 0.05;
  const ui = named(root, 'phone-incoming-call-ui-pivot');
  if (ui) ui.visible = screenLit;
  glow(named(root, 'phone-layered-rounded-display-glass'), wake * (0.24 + reminderGate * 0.2), 0x8f6f94);
  glow(ui, wake * (0.4 + reminderGate * 0.52), 0xff8eae);

  const promptFlash = 0.5 + 0.5 * Math.sin(time * 8.6);
  const promptVisible = screenLit && (time < 0.58 || promptFlash > 0.3);
  const prompt = named(root, 'phone-incoming-label-CALLING');
  if (prompt) prompt.visible = promptVisible;

  const avatarPulse = 1 + reminderGate * (0.035 + (0.5 + 0.5 * Math.sin(time * 6.6)) * 0.075);
  const avatar = named(root, 'phone-incoming-avatar-pivot');
  if (avatar) avatar.scale.setScalar(avatarPulse);
  const answerPulse = 1 + reminderGate * (0.055 + (0.5 + 0.5 * Math.sin(time * 7.8 + 0.4)) * 0.095);
  const answer = named(root, 'phone-call-answer-button-pivot');
  if (answer) answer.scale.setScalar(answerPulse);
  const hangup = named(root, 'phone-call-hangup-button-pivot');
  if (hangup) hangup.scale.setScalar(1 + reminderGate * 0.025);
  glow(named(root, 'phone-call-answer-button'), wake * (0.65 + reminderGate * 0.9), 0x55d69d);
  glow(named(root, 'phone-call-hangup-button'), wake * (0.52 + reminderGate * 0.36), 0xf34b72);

  let visibleStereoWaveRings = 0;
  for (let index = 0; index < 3; index += 1) {
    const wave = named<THREE.Mesh>(root, `phone-stereo-wave-ring-${index + 1}`);
    if (!wave) continue;
    const age = time - 0.24 - index * 0.2;
    const cycle = 1.02;
    const local = ((age % cycle) + cycle) % cycle;
    const progress = local / cycle;
    wave.visible = age >= 0 && progress < 0.82 && reminderGate > 0.02;
    if (!wave.visible) continue;
    visibleStereoWaveRings += 1;
    const growth = 0.82 + progress * 1.35;
    wave.scale.set((0.72 + index * 0.08) * growth, (1.22 + index * 0.1) * growth, 0.8 + progress * 0.45);
    wave.position.z = 0.05 + progress * 0.42;
    wave.rotation.z = (index % 2 === 0 ? -1 : 1) * progress * 0.09;
  }

  let visibleVibrationPulses = 0;
  prefixed(root, 'phone-vibration-pulse-').forEach((arc, index) => {
    const beat = 0.5 + 0.5 * Math.sin(time * 31 + index * 1.43);
    arc.visible = reminderGate > 0.05 && beat > 0.32;
    if (!arc.visible) return;
    visibleVibrationPulses += 1;
    const scale = 0.88 + beat * 0.26;
    arc.scale.set(scale, scale, 0.88 + beat * 0.18);
  });

  let visibleCallSignalArcs = 0;
  prefixed(root, 'phone-call-signal-arc-').forEach((arc, index) => {
    const local = ((time - 0.34 - (index % 3) * 0.11) % 0.76 + 0.76) % 0.76;
    const progress = local / 0.76;
    arc.visible = reminderGate > 0.04 && progress < 0.72;
    if (!arc.visible) return;
    visibleCallSignalArcs += 1;
    arc.scale.setScalar(0.78 + progress * 0.48);
    arc.position.z = 0.052 + progress * 0.18;
  });

  let visibleSoftLightPoints = 0;
  prefixed(root, 'phone-soft-notification-light-').forEach((point, index) => {
    const angle = time * (1.5 + (index % 3) * 0.12) + Number(point.userData.baseAngle ?? index);
    const pulseValue = 0.5 + 0.5 * Math.sin(time * 6.8 + index * 0.8);
    point.visible = reminderGate > 0.08 && pulseValue > 0.22;
    if (!point.visible) return;
    visibleSoftLightPoints += 1;
    point.position.set(
      Math.cos(angle) * (0.7 + (index % 2) * 0.08),
      Math.sin(angle) * (0.91 + (index % 3) * 0.05),
      0.09 + Math.sin(time * 3.2 + index) * 0.07,
    );
    point.scale.setScalar(0.74 + pulseValue * 0.58);
  });

  let visibleInformationParticles = 0;
  for (let index = 0; index < 6; index += 1) {
    const particle = named(root, `phone-information-particle-${index + 1}`);
    if (!particle) continue;
    const age = time - 0.68 - index * 0.14;
    const cycle = 1.46;
    const local = ((age % cycle) + cycle) % cycle;
    const progress = local / cycle;
    particle.visible = age >= 0 && progress < 0.82 && reminderGate > 0.04;
    if (!particle.visible) continue;
    visibleInformationParticles += 1;
    const side = index % 2 === 0 ? -1 : 1;
    particle.position.set(
      side * (0.58 + (index % 3) * 0.07 + Math.sin(time * 3.8 + index) * 0.055),
      -0.5 + progress * 1.38,
      0.1 + progress * 0.28,
    );
    particle.rotation.z = side * (0.14 + Math.sin(time * 4.2 + index) * 0.18);
    particle.scale.setScalar(0.68 + Math.sin(progress * Math.PI) * 0.48);
  }

  glow(named(root, 'phone-call-feedback-rig'), reminderGate * (0.78 + promptFlash * 0.42), 0xff9eb8);
  root.userData.phonePerformance = {
    timelineOwner: PHONE_TIMELINE_OWNER,
    modelOwner: 'phone-model-rig',
    sharedSpectacleEffects: 'disabled',
    phase: phaseAt(time),
    timeline: time,
    screenLit,
    promptVisible,
    avatarPulse,
    answerPulse,
    bodyLift,
    bodyShakeX,
    bodyRoll,
    visibleStereoWaveRings,
    visibleVibrationPulses,
    visibleCallSignalArcs,
    visibleSoftLightPoints,
    visibleInformationParticles,
    forbiddenFlatEffects: ['PlaneGeometry', 'Sprite', 'Line'],
    forbiddenThemes: ['combat-star', 'electric-bolt', 'ultimate-attack'],
  } satisfies PhonePerformanceDiagnostics;
}

export function resetPhonePerformance(root: THREE.Group): void {
  const ui = named(root, 'phone-incoming-call-ui-pivot');
  if (ui) ui.visible = false;
  const feedback = named(root, 'phone-call-feedback-rig');
  feedback?.traverse((object) => {
    if (object.userData.performanceEffect) object.visible = false;
  });
  if (feedback) feedback.visible = true;
  glow(named(root, 'phone-layered-rounded-display-glass'), 0, 0x000000);
  delete root.userData.phonePerformance;
}
