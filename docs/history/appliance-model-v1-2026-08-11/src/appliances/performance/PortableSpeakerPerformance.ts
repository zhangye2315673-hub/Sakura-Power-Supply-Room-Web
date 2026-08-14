import * as THREE from 'three';

export const PORTABLE_SPEAKER_TIMELINE_OWNER = 'AppliancePerformanceSystem';

type BassBeat = {
  time: number;
  strength: number;
  waveSlot: number;
  section: 'groove' | 'build' | 'climax' | 'final';
};

const BASS_BEATS: readonly BassBeat[] = [
  // Tighter spacing gives the speaker a quicker groove while retaining a
  // longer run of overlapping pulses through the climax.
  { time: 0.38, strength: 0.44, waveSlot: 1, section: 'groove' },
  { time: 0.88, strength: 0.56, waveSlot: 2, section: 'groove' },
  { time: 1.34, strength: 0.69, waveSlot: 3, section: 'build' },
  { time: 1.78, strength: 0.82, waveSlot: 4, section: 'build' },
  { time: 2.20, strength: 0.88, waveSlot: 5, section: 'build' },
  { time: 2.58, strength: 0.94, waveSlot: 6, section: 'climax' },
  { time: 2.90, strength: 1.00, waveSlot: 7, section: 'climax' },
  { time: 3.22, strength: 1.06, waveSlot: 8, section: 'climax' },
  { time: 3.54, strength: 1.12, waveSlot: 1, section: 'climax' },
  { time: 3.86, strength: 1.16, waveSlot: 2, section: 'climax' },
  { time: 4.18, strength: 1.2, waveSlot: 3, section: 'climax' },
  { time: 4.42, strength: 1.24, waveSlot: 4, section: 'final' },
] as const;

export type PortableSpeakerPerformanceDiagnostics = {
  timelineOwner: typeof PORTABLE_SPEAKER_TIMELINE_OWNER;
  phase: 'startup' | 'groove' | 'build' | 'climax' | 'final-impact' | 'airborne' | 'settle';
  timeline: number;
  wholeMachineNode: 'portable-speaker-whole-machine-pivot';
  driverNode: 'portable-speaker-driver-pulse-pivot';
  beatCount: number;
  activeBeatSection: BassBeat['section'] | null;
  bodyCompression: number;
  bodyExpansion: number;
  driverTravel: number;
  finalLift: number;
  grilleMaxOffset: number;
  activeWaveCount: number;
  waveGeometry: 'closed-irregular-tube';
  forbiddenFlatEffects: readonly ['PlaneGeometry', 'Sprite', 'Line'];
};

function pulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function phaseAt(time: number): PortableSpeakerPerformanceDiagnostics['phase'] {
  if (time < 0.3) return 'startup';
  if (time < 1.2) return 'groove';
  if (time < 2.5) return 'build';
  if (time < 4.62) return 'climax';
  if (time < 4.94) return 'final-impact';
  if (time < 5.12) return 'airborne';
  return 'settle';
}

function meshMaterial(mesh: THREE.Mesh): THREE.MeshToonMaterial | null {
  if (Array.isArray(mesh.material)) return null;
  return mesh.material as THREE.MeshToonMaterial;
}

const grilleDummy = new THREE.Object3D();

function poseGrilleInstances(
  grille: THREE.InstancedMesh,
  time: number,
  amplitude: number,
): number {
  const basePositions = grille.userData.basePositions as Array<readonly [number, number, number]> | undefined;
  if (!Array.isArray(basePositions)) return 0;

  let maxOffset = 0;
  basePositions.forEach(([x, y, z], index) => {
    const dx = x + 0.22;
    const dy = y - 1.94;
    const radius = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const delayedPhase = time * 27 - radius * 9.4 + angle * 1.35 + (index % 3) * 0.16;
    const ripple = Math.sin(delayedPhase) * 0.5 + 0.5;
    const counterRipple = Math.sin(delayedPhase + Math.PI * 0.72);
    const zOffset = amplitude * (0.18 + ripple * 0.82);
    const radialOffset = amplitude * 0.055 * counterRipple;
    const inverseRadius = radius > 0.001 ? 1 / radius : 0;

    grilleDummy.position.set(
      x + dx * inverseRadius * radialOffset,
      y + dy * inverseRadius * radialOffset,
      z + zOffset,
    );
    grilleDummy.rotation.set(Math.PI * 0.5, 0, 0);
    grilleDummy.scale.set(1, 1 + ripple * amplitude * 2.1, 1);
    grilleDummy.updateMatrix();
    grille.setMatrixAt(index, grilleDummy.matrix);
    maxOffset = Math.max(maxOffset, Math.abs(zOffset));
  });
  grille.instanceMatrix.needsUpdate = true;
  return maxOffset;
}

/**
 * One clean, whole-object low-frequency performance shared by gameplay and gallery.
 * The caller restores the captured idle pose before every sample, so every transform
 * here is deterministic and stop() can return to the exact authored model state.
 */
export function applyPortableSpeakerPerformance(
  root: THREE.Group,
  time: number,
  power: number,
): void {
  const p = THREE.MathUtils.clamp(power, 0, 1);
  const whole = root.getObjectByName('portable-speaker-whole-machine-pivot');
  const driver = root.getObjectByName('portable-speaker-driver-pulse-pivot');
  const waveRoot = root.getObjectByName('portable-speaker-bass-wave-root');
  const grille = root.getObjectByName('portable-speaker-grille-perforations') as THREE.InstancedMesh | null;
  const indicator = root.getObjectByName('portable-speaker-status-indicator') as THREE.Mesh | null;
  const driverGlow = root.getObjectByName('portable-speaker-powered-diaphragm-glow') as THREE.Mesh | null;

  let compression = 0;
  let expansion = 0;
  let rebound = 0;
  let dominantStrength = 0;
  let activeSection: BassBeat['section'] | null = null;

  BASS_BEATS.forEach((beat) => {
    const squeeze = pulse(time, beat.time - 0.105, beat.time, beat.time + 0.042) * beat.strength;
    const blast = pulse(time, beat.time + 0.018, beat.time + 0.098, beat.time + 0.205) * beat.strength;
    const settleAge = time - (beat.time + 0.13);
    const settle = settleAge > 0 && settleAge < 0.42
      ? Math.sin(settleAge * 27) * Math.exp(-settleAge * 10.5) * beat.strength
      : 0;
    compression += squeeze;
    expansion += blast;
    rebound += settle;
    const weight = Math.max(squeeze, blast, Math.abs(settle) * 0.55);
    if (weight > dominantStrength) {
      dominantStrength = weight;
      activeSection = beat.section;
    }
  });

  compression = THREE.MathUtils.clamp(compression, 0, 1.28) * p;
  expansion = THREE.MathUtils.clamp(expansion, 0, 1.34) * p;
  rebound = THREE.MathUtils.clamp(rebound, -0.55, 0.55) * p;

  const finalLift = pulse(time, 4.82, 4.98, 5.16) * 0.18 * p;
  const landingSquash = pulse(time, 5.14, 5.2, 5.3) * p;
  const landingSettleAge = time - 5.2;
  const landingSettle = landingSettleAge > 0
    ? Math.sin(landingSettleAge * 31) * Math.exp(-landingSettleAge * 17) * p
    : 0;
  const buildGate = THREE.MathUtils.smoothstep(time, 1.55, 3.25)
    * (1 - THREE.MathUtils.smoothstep(time, 4.84, 5.28)) * p;

  if (whole) {
    const contractX = compression * 0.058;
    const contractY = compression * 0.046;
    const contractZ = compression * 0.052;
    const bloomX = expansion * 0.092;
    const bloomY = expansion * 0.071;
    const bloomZ = expansion * 0.086;
    whole.scale.set(
      1 - contractX + bloomX + rebound * 0.018 + landingSquash * 0.055,
      1 - contractY + bloomY - rebound * 0.012 - landingSquash * 0.092 + landingSettle * 0.012,
      1 - contractZ + bloomZ + rebound * 0.016 + landingSquash * 0.05,
    );
    whole.position.y += finalLift + expansion * 0.024 + landingSettle * 0.018;
    whole.position.x += Math.sin(time * 5.4) * 0.018 * buildGate;
    whole.rotation.z += Math.sin(time * 4.7 + 0.35) * 0.012 * buildGate
      + landingSettle * 0.018;
  }

  const driverTravel = (
    expansion * 0.225
    - compression * 0.052
    + rebound * 0.026
    - landingSquash * 0.018
  );
  if (driver) {
    driver.position.z += driverTravel;
    const radialBloom = expansion * 0.045 - compression * 0.018 + rebound * 0.008;
    driver.scale.set(1 + radialBloom, 1 + radialBloom, 1 + expansion * 0.12);
  }

  const grilleAmplitude = THREE.MathUtils.clamp(
    expansion * 0.17 + compression * 0.075 + Math.abs(rebound) * 0.055,
    0,
    0.22,
  );
  const grilleMaxOffset = grille ? poseGrilleInstances(grille, time, grilleAmplitude) : 0;

  if (driverGlow) {
    const material = meshMaterial(driverGlow);
    if (material) {
      const glow = THREE.MathUtils.clamp(
        expansion * 0.9 + compression * 0.25 + Math.max(0, rebound) * 0.3,
        0,
        1.35,
      );
      material.opacity = glow * 0.58;
      material.emissive?.setHex(0xff7fa7);
      material.emissiveIntensity = glow * 1.65;
    }
  }

  const lightStrength = THREE.MathUtils.clamp(
    THREE.MathUtils.smoothstep(time, 0.18, 0.38) * 0.58
      + expansion * 0.68
      + compression * 0.24,
    0,
    1.35,
  ) * p;
  if (indicator) {
    const material = meshMaterial(indicator);
    if (material) {
      material.color.setHex(lightStrength > 0.01 ? 0xcff7e8 : 0x81798f);
      material.emissive?.setHex(lightStrength > 0.01 ? 0x76f0c5 : 0x000000);
      material.emissiveIntensity = lightStrength * 1.8;
    }
  }

  if (waveRoot) waveRoot.position.y += finalLift + landingSettle * 0.018;
  let activeWaveCount = 0;
  BASS_BEATS.forEach((beat) => {
    const wave = root.getObjectByName(`portable-speaker-bass-wave-ring-${beat.waveSlot}`) as THREE.Mesh | null;
    if (!wave) return;
    const age = time - (beat.time + 0.035);
    const life = beat.section === 'climax' || beat.section === 'final' ? 1.02 : 0.72;
    const progress = THREE.MathUtils.clamp(age / life, 0, 1);
    const visible = age >= 0 && age < life && p > 0.01;
    wave.visible = visible;
    if (!visible) return;
    activeWaveCount += 1;
    const appear = THREE.MathUtils.smoothstep(progress, 0, 0.08);
    const fade = 1 - THREE.MathUtils.smoothstep(progress, 0.5, 1);
    const growth = 0.34 + THREE.MathUtils.smoothstep(progress, 0, 0.92)
      * (2.55 + beat.strength * 0.62);
    const wobble = Math.sin(progress * Math.PI * 3 + beat.waveSlot * 0.73)
      * (1 - progress) * 0.045;
    wave.position.z = progress * (0.66 + beat.strength * 0.48);
    wave.rotation.z = (beat.waveSlot % 2 === 0 ? 1 : -1) * progress * 0.12;
    wave.scale.set(
      growth * (1 + wobble),
      growth * (0.91 - wobble * 0.62),
      0.82 + beat.strength * 0.18,
    );
    const material = meshMaterial(wave);
    if (material) {
      material.opacity = appear * fade * (0.26 + beat.strength * 0.28) * p;
      material.emissiveIntensity = (0.28 + beat.strength * 0.42) * fade * p;
    }
  });

  root.userData.portableSpeakerPerformance = {
    timelineOwner: PORTABLE_SPEAKER_TIMELINE_OWNER,
    phase: phaseAt(time),
    timeline: time,
    wholeMachineNode: 'portable-speaker-whole-machine-pivot',
    driverNode: 'portable-speaker-driver-pulse-pivot',
    beatCount: BASS_BEATS.filter((beat) => time >= beat.time).length,
    activeBeatSection: activeSection,
    bodyCompression: compression,
    bodyExpansion: expansion,
    driverTravel,
    finalLift,
    grilleMaxOffset,
    activeWaveCount,
    waveGeometry: 'closed-irregular-tube',
    forbiddenFlatEffects: ['PlaneGeometry', 'Sprite', 'Line'],
  } satisfies PortableSpeakerPerformanceDiagnostics;
}

export function resetPortableSpeakerPerformance(root: THREE.Group): void {
  const grille = root.getObjectByName('portable-speaker-grille-perforations') as THREE.InstancedMesh | null;
  if (grille) poseGrilleInstances(grille, 0, 0);
  delete root.userData.portableSpeakerPerformance;
}
