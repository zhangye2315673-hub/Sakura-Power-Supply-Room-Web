import * as THREE from 'three';
import {
  PORTABLE_SPEAKER_ACTIVE_DURATION,
  PORTABLE_SPEAKER_BASS_BEATS,
} from '../appliances/performance/PortableSpeakerPerformance';

export const PORTABLE_SPEAKER_SPACING_MULTIPLIER = 2;
export const PORTABLE_SPEAKER_SPACING_RELEASE_DURATION = 0.72;

export type PortableSpeakerSpacingTarget = Readonly<{
  id: string;
  center: THREE.Vector3;
  setOffset: (offset: THREE.Vector3) => void;
}>;

export type PortableSpeakerSpacingDiagnostics = Readonly<{
  phase: 'idle' | 'pulsing' | 'holding' | 'releasing';
  timeline: number;
  multiplier: number;
  targetCount: number;
  maxOffset: number;
  spacingRatio: number;
}>;

function smooth(progress: number): number {
  const clamped = THREE.MathUtils.clamp(progress, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export function portableSpeakerSpacingMultiplierAt(time: number): number {
  const clampedTime = THREE.MathUtils.clamp(time, 0, PORTABLE_SPEAKER_ACTIVE_DURATION);
  const beatCount = PORTABLE_SPEAKER_BASS_BEATS.length;
  let multiplier = 1;

  for (let index = 0; index < beatCount; index += 1) {
    const beat = PORTABLE_SPEAKER_BASS_BEATS[index];
    const previous = 1 + index / beatCount;
    const next = 1 + (index + 1) / beatCount;
    const compression = 0.075 + beat.strength * 0.035 + (index / beatCount) * 0.045;
    const compressed = Math.max(0.92, previous - compression);
    const overshoot = next + 0.035 + beat.strength * 0.025;
    const localTime = clampedTime - beat.time;

    if (localTime < -0.11) break;
    if (localTime < 0) {
      multiplier = THREE.MathUtils.lerp(previous, compressed, smooth((localTime + 0.11) / 0.11));
      break;
    }
    if (localTime < 0.105) {
      multiplier = THREE.MathUtils.lerp(compressed, overshoot, smooth(localTime / 0.105));
      break;
    }
    if (localTime < 0.24) {
      multiplier = THREE.MathUtils.lerp(overshoot, next, smooth((localTime - 0.105) / 0.135));
      break;
    }
    multiplier = next;
  }

  return THREE.MathUtils.clamp(multiplier, 0.92, PORTABLE_SPEAKER_SPACING_MULTIPLIER + 0.08);
}

export class PortableSpeakerSpacingPresentation {
  private phaseValue: PortableSpeakerSpacingDiagnostics['phase'] = 'idle';
  private timeline = 0;
  private multiplier = 1;
  private releaseStartMultiplier = 1;
  private releaseElapsed = 0;
  private wallStartedAt = 0;
  private releaseWallStartedAt = 0;
  private readonly baseOffsets = new Map<string, THREE.Vector3>();
  private readonly targets = new Map<string, PortableSpeakerSpacingTarget>();
  private readonly workingOffset = new THREE.Vector3();

  get durationMs(): number {
    return PORTABLE_SPEAKER_ACTIVE_DURATION * 1_000;
  }

  get diagnostics(): PortableSpeakerSpacingDiagnostics {
    let maxOffset = 0;
    for (const offset of this.baseOffsets.values()) {
      maxOffset = Math.max(maxOffset, offset.length() * Math.max(0, this.multiplier - 1));
    }
    return {
      phase: this.phaseValue,
      timeline: this.timeline,
      multiplier: this.multiplier,
      targetCount: this.baseOffsets.size,
      maxOffset,
      spacingRatio: this.multiplier,
    };
  }

  start(targets: readonly PortableSpeakerSpacingTarget[]): number {
    this.captureTargets(targets);
    this.phaseValue = 'pulsing';
    this.timeline = 0;
    this.multiplier = 1;
    this.releaseElapsed = 0;
    this.wallStartedAt = performance.now() * 0.001;
    this.applyOffsets();
    return this.durationMs;
  }

  sync(active: boolean, targets: readonly PortableSpeakerSpacingTarget[]): void {
    this.setTargets(targets);
    if (active) {
      if (this.phaseValue === 'idle' || this.phaseValue === 'releasing') {
        this.phaseValue = 'holding';
        this.multiplier = PORTABLE_SPEAKER_SPACING_MULTIPLIER;
      }
      this.applyOffsets();
      return;
    }
    if (this.phaseValue === 'idle' || this.phaseValue === 'releasing') return;
    this.phaseValue = 'releasing';
    this.releaseStartMultiplier = this.multiplier;
    this.releaseElapsed = 0;
    this.releaseWallStartedAt = performance.now() * 0.001;
  }

  update(delta: number, targets?: readonly PortableSpeakerSpacingTarget[]): void {
    if (targets) this.setTargets(targets);
    const safeDelta = Math.max(0, delta);
    if (this.phaseValue === 'pulsing') {
      const wallTimeline = Math.max(0, performance.now() * 0.001 - this.wallStartedAt);
      this.timeline = Math.min(
        PORTABLE_SPEAKER_ACTIVE_DURATION,
        Math.max(this.timeline + safeDelta, wallTimeline),
      );
      this.multiplier = portableSpeakerSpacingMultiplierAt(this.timeline);
      if (this.timeline >= PORTABLE_SPEAKER_ACTIVE_DURATION) {
        this.phaseValue = 'holding';
        this.multiplier = PORTABLE_SPEAKER_SPACING_MULTIPLIER;
      }
    } else if (this.phaseValue === 'holding') {
      this.multiplier = PORTABLE_SPEAKER_SPACING_MULTIPLIER;
    } else if (this.phaseValue === 'releasing') {
      const wallReleaseElapsed = Math.max(0, performance.now() * 0.001 - this.releaseWallStartedAt);
      this.releaseElapsed = Math.min(
        PORTABLE_SPEAKER_SPACING_RELEASE_DURATION,
        Math.max(this.releaseElapsed + safeDelta, wallReleaseElapsed),
      );
      const progress = smooth(this.releaseElapsed / PORTABLE_SPEAKER_SPACING_RELEASE_DURATION);
      this.multiplier = THREE.MathUtils.lerp(this.releaseStartMultiplier, 1, progress);
      if (this.releaseElapsed >= PORTABLE_SPEAKER_SPACING_RELEASE_DURATION) {
        this.phaseValue = 'idle';
        this.timeline = 0;
        this.multiplier = 1;
        this.baseOffsets.clear();
      }
    }
    this.applyOffsets();
  }

  reset(targets?: readonly PortableSpeakerSpacingTarget[]): void {
    if (targets) this.setTargets(targets);
    this.multiplier = 1;
    this.applyOffsets();
    this.phaseValue = 'idle';
    this.timeline = 0;
    this.releaseStartMultiplier = 1;
    this.releaseElapsed = 0;
    this.wallStartedAt = 0;
    this.releaseWallStartedAt = 0;
    this.baseOffsets.clear();
    this.targets.clear();
  }

  private captureTargets(targets: readonly PortableSpeakerSpacingTarget[]): void {
    this.targets.clear();
    this.baseOffsets.clear();
    if (targets.length === 0) return;
    const bundleCenter = targets.reduce(
      (center, target) => center.add(target.center),
      new THREE.Vector3(),
    ).multiplyScalar(1 / targets.length);
    for (const target of targets) {
      this.targets.set(target.id, target);
      this.baseOffsets.set(target.id, target.center.clone().sub(bundleCenter));
    }
  }

  private setTargets(targets: readonly PortableSpeakerSpacingTarget[]): void {
    this.targets.clear();
    for (const target of targets) this.targets.set(target.id, target);
  }

  private applyOffsets(): void {
    const amount = this.multiplier - 1;
    for (const [id, target] of this.targets) {
      const baseOffset = this.baseOffsets.get(id);
      target.setOffset(baseOffset
        ? this.workingOffset.copy(baseOffset).multiplyScalar(amount)
        : this.workingOffset.set(0, 0, 0));
    }
  }
}
