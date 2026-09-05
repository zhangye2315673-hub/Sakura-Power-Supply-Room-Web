import * as THREE from 'three';
import {
  PORTABLE_SPEAKER_ACTIVE_DURATION,
  PORTABLE_SPEAKER_BASS_BEATS,
} from '../appliances/performance/PortableSpeakerPerformance';

export const PORTABLE_SPEAKER_SPACING_MULTIPLIER = 2;
export const PORTABLE_SPEAKER_SPACING_RELEASE_DURATION = 0.72;
export const PORTABLE_SPEAKER_MAX_EXTRA_GAP = 0.52;
export const PORTABLE_SPEAKER_MIN_EXTRA_GAP = 0.08;

export type PortableSpeakerClearanceSegment = Readonly<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
}>;

export type PortableSpeakerSpacingTarget = Readonly<{
  id: string;
  center: Readonly<THREE.Vector3>;
  clearanceSegments: readonly PortableSpeakerClearanceSegment[];
  setOffset: (offset: THREE.Vector3) => void;
}>;

export type PortableSpeakerSpacingDiagnostics = Readonly<{
  phase: 'idle' | 'pulsing' | 'holding' | 'releasing';
  timeline: number;
  multiplier: number;
  targetCount: number;
  maxOffset: number;
  referenceSurfaceGap: number;
  spacingRatio: number;
}>;

function smooth(progress: number): number {
  const clamped = THREE.MathUtils.clamp(progress, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function segmentDistanceSq(a: PortableSpeakerClearanceSegment, b: PortableSpeakerClearanceSegment): number {
  const u = a.end.clone().sub(a.start);
  const v = b.end.clone().sub(b.start);
  const w = a.start.clone().sub(b.start);
  const aa = u.dot(u);
  const bb = u.dot(v);
  const cc = v.dot(v);
  const dd = u.dot(w);
  const ee = v.dot(w);
  const denominator = aa * cc - bb * bb;
  let sNumerator = denominator;
  let sDenominator = denominator;
  let tNumerator = denominator;
  let tDenominator = denominator;

  if (denominator < 1e-9) {
    sNumerator = 0;
    sDenominator = 1;
    tNumerator = ee;
    tDenominator = cc;
  } else {
    sNumerator = bb * ee - cc * dd;
    tNumerator = aa * ee - bb * dd;
    if (sNumerator < 0) {
      sNumerator = 0;
      tNumerator = ee;
      tDenominator = cc;
    } else if (sNumerator > sDenominator) {
      sNumerator = sDenominator;
      tNumerator = ee + bb;
      tDenominator = cc;
    }
  }

  if (tNumerator < 0) {
    tNumerator = 0;
    if (-dd < 0) sNumerator = 0;
    else if (-dd > aa) sNumerator = sDenominator;
    else {
      sNumerator = -dd;
      sDenominator = aa;
    }
  } else if (tNumerator > tDenominator) {
    tNumerator = tDenominator;
    if (-dd + bb < 0) sNumerator = 0;
    else if (-dd + bb > aa) sNumerator = sDenominator;
    else {
      sNumerator = -dd + bb;
      sDenominator = aa;
    }
  }

  const sc = Math.abs(sNumerator) < 1e-9 ? 0 : sNumerator / sDenominator;
  const tc = Math.abs(tNumerator) < 1e-9 ? 0 : tNumerator / tDenominator;
  return w.addScaledVector(u, sc).addScaledVector(v, -tc).lengthSq();
}

function surfaceGap(a: PortableSpeakerSpacingTarget, b: PortableSpeakerSpacingTarget): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (const left of a.clearanceSegments) {
    for (const right of b.clearanceSegments) {
      nearest = Math.min(
        nearest,
        Math.sqrt(segmentDistanceSq(left, right)) - left.radius - right.radius,
      );
    }
  }
  return nearest;
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
  private referenceSurfaceGap = 0;
  private geometryTargets: readonly PortableSpeakerSpacingTarget[] = [];
  private readonly baseOffsets = new Map<string, THREE.Vector3>();
  private readonly targets = new Map<string, PortableSpeakerSpacingTarget>();
  private readonly workingOffset = new THREE.Vector3();

  get durationMs(): number {
    return PORTABLE_SPEAKER_ACTIVE_DURATION * 1_000;
  }

  get phase(): PortableSpeakerSpacingDiagnostics['phase'] {
    return this.phaseValue;
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
      referenceSurfaceGap: this.referenceSurfaceGap,
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
      // Skill state can arrive before the presentation start callback. Start
      // the authored beat timeline instead of jumping straight to the final
      // holding multiplier, otherwise compression/expansion is never seen.
      if (this.phaseValue === 'idle' || this.phaseValue === 'releasing') {
        this.start(targets);
        return;
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
    this.referenceSurfaceGap = 0;
    this.geometryTargets = [];
    this.baseOffsets.clear();
    this.targets.clear();
  }

  private captureTargets(targets: readonly PortableSpeakerSpacingTarget[]): void {
    this.targets.clear();
    this.baseOffsets.clear();
    this.geometryTargets = targets;
    if (targets.length === 0) return;
    const bundleCenter = targets.reduce(
      (center, target) => center.add(target.center),
      new THREE.Vector3(),
    ).multiplyScalar(1 / targets.length);
    const nearestGaps = new Map(targets.map((target) => [target.id, Number.POSITIVE_INFINITY]));
    for (let left = 0; left < targets.length; left += 1) {
      for (let right = left + 1; right < targets.length; right += 1) {
        const gap = surfaceGap(targets[left], targets[right]);
        if (!Number.isFinite(gap) || gap <= 0) continue;
        nearestGaps.set(targets[left].id, Math.min(nearestGaps.get(targets[left].id)!, gap));
        nearestGaps.set(targets[right].id, Math.min(nearestGaps.get(targets[right].id)!, gap));
      }
    }
    const finiteGaps = [...nearestGaps.values()].filter(Number.isFinite).sort((a, b) => a - b);
    const medianGap = finiteGaps.length > 0 ? finiteGaps[Math.floor((finiteGaps.length - 1) / 2)] : 0;
    this.referenceSurfaceGap = THREE.MathUtils.clamp(
      medianGap || PORTABLE_SPEAKER_MIN_EXTRA_GAP,
      PORTABLE_SPEAKER_MIN_EXTRA_GAP,
      PORTABLE_SPEAKER_MAX_EXTRA_GAP,
    );
    for (const target of targets) {
      this.targets.set(target.id, target);
      // Push each cable away from its actual nearby neighbours instead of only
      // using the global bundle-centre vector. On asymmetric layouts the latter
      // can move a plug toward a neighbouring body during expansion.
      const direction = new THREE.Vector3();
      targets.forEach((other) => {
        if (other.id === target.id) return;
        const gap = surfaceGap(target, other);
        if (!Number.isFinite(gap)) return;
        const away = target.center.clone().sub(other.center);
        if (away.lengthSq() < 1e-8) return;
        direction.addScaledVector(away.normalize(), 1 / Math.max(gap, PORTABLE_SPEAKER_MIN_EXTRA_GAP));
      });
      if (direction.lengthSq() < 1e-8) direction.copy(target.center).sub(bundleCenter);
      if (direction.lengthSq() < 1e-8) direction.set(1, 0, 0);
      this.baseOffsets.set(
        target.id,
        direction.normalize().multiplyScalar(this.referenceSurfaceGap * 0.5),
      );
    }
  }

  private setTargets(targets: readonly PortableSpeakerSpacingTarget[]): void {
    if (!this.sameGeometry(targets)) {
      this.captureTargets(targets);
    }
  }

  private sameGeometry(targets: readonly PortableSpeakerSpacingTarget[]): boolean {
    if (targets === this.geometryTargets) return true;
    if (targets.length !== this.geometryTargets.length) return false;
    for (let index = 0; index < targets.length; index += 1) {
      const previous = this.geometryTargets[index];
      const next = targets[index];
      if (!previous
        || previous.id !== next.id
        || previous.center !== next.center
        || previous.clearanceSegments !== next.clearanceSegments) {
        return false;
      }
    }
    return true;
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
