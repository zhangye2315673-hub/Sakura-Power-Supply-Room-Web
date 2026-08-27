import * as THREE from 'three';
import type { ArrowRuntime } from '../puzzle/types';
import type { PlugCableModel } from '../render/PlugCableModel';

const WASHER_ACTIVE_DURATION = 6.6;
const SPIN_UP_END = 1.2;
const RING_EXPANSION_END = 1.2;
const CRUISE_END = 3.45;
const SLOWDOWN_END = 5.9;
const REBOUND_END = 6.35;
const FIRST_LAUNCH_AT = 1.98;
const SECOND_LAUNCH_AT = 2.82;
const RING_COLLAPSE_START = 3.48;
const MAX_ANGULAR_SPEED = 15.5;
const TARGET_RING_RADIUS = 4.4;
const MIN_RING_EXPANSION = 2.2;
const MAX_TANGENTIAL_DRIFT = 0.56;
const MAX_AXIAL_DRIFT = 0.3;
const MAX_TIMELINE_STEP = 0.05;

export type WasherSpinPhase = 'idle' | 'spin-up' | 'centrifuge' | 'launch' | 'slowdown' | 'rebound' | 'settle' | 'complete';

export type WasherSpinDiagnostics = Readonly<{
  active: boolean;
  elapsed: number;
  duration: number;
  phase: WasherSpinPhase;
  spinAngle: number;
  angularVelocity: number;
  centrifugalAmount: number;
  averageEntryOffset: number;
  maxEntryOffset: number;
  minimumPlanarRadius: number;
  averagePlanarRadius: number;
  launchOrder: string[];
  launchElapsedSeconds: number[];
  targetIds: string[];
  remainingCount: number;
}>;

type Entry = {
  id: string;
  model: PlugCableModel;
  basePosition: THREE.Vector3;
  baseQuaternion: THREE.Quaternion;
  radial: THREE.Vector3;
  tangent: THREE.Vector3;
  basePlanarRadius: number;
  ringExpansion: number;
  phaseOffset: number;
  launched: boolean;
};

type StartOptions = Readonly<{
  cableRoot: THREE.Group;
  camera: THREE.Camera;
  arrows: readonly ArrowRuntime[];
  models: ReadonlyMap<string, PlugCableModel>;
  targetIds: readonly string[];
  onLaunch: (cableId: string, launch: Readonly<{
    directionWorld: THREE.Vector3;
    bundleCenterWorld: THREE.Vector3;
  }>) => boolean;
}>;

const emptyDiagnostics = (): WasherSpinDiagnostics => ({
  active: false,
  elapsed: 0,
  duration: WASHER_ACTIVE_DURATION,
  phase: 'idle',
  spinAngle: 0,
  angularVelocity: 0,
  centrifugalAmount: 0,
  averageEntryOffset: 0,
  maxEntryOffset: 0,
  minimumPlanarRadius: 0,
  averagePlanarRadius: 0,
  launchOrder: [],
  launchElapsedSeconds: [],
  targetIds: [],
  remainingCount: 0,
});

const smooth = (value: number): number => THREE.MathUtils.smoothstep(value, 0, 1);

function phaseAt(elapsed: number): WasherSpinPhase {
  if (elapsed < SPIN_UP_END) return 'spin-up';
  if (elapsed < FIRST_LAUNCH_AT) return 'centrifuge';
  if (elapsed < SECOND_LAUNCH_AT) return 'launch';
  if (elapsed < SLOWDOWN_END) return 'slowdown';
  if (elapsed < REBOUND_END) return 'rebound';
  if (elapsed < WASHER_ACTIVE_DURATION) return 'settle';
  return 'complete';
}

/**
 * Visual-only washer centrifuge. Rule state is committed by the skill engine,
 * while this controller delays model removal until each cable visibly launches.
 */
export class WasherSpinPresentation {
  private cableRoot: THREE.Group | null = null;
  private entries: Entry[] = [];
  private targetIds: string[] = [];
  private launchOrder: string[] = [];
  private launchElapsedSeconds: number[] = [];
  private firstLaunchElapsed = -1;
  private timelineElapsed = 0;
  private baseRootPosition = new THREE.Vector3();
  private baseRootQuaternion = new THREE.Quaternion();
  private baseRootScale = new THREE.Vector3(1, 1, 1);
  /** The drum axis is captured from the player's view so the spin reads as a
   * left/right circle on screen instead of a world-space tumble. */
  private spinAxis = new THREE.Vector3(0, 0, 1);
  private cameraForwardWorld = new THREE.Vector3(0, 0, -1);
  private screenRightWorld = new THREE.Vector3(1, 0, 0);
  private centerOffset = new THREE.Vector3();
  private readonly rotationScratch = new THREE.Quaternion();
  private diagnosticsValue = emptyDiagnostics();

  get diagnostics(): WasherSpinDiagnostics {
    return this.diagnosticsValue;
  }

  start(options: StartOptions): number {
    this.reset();
    this.cableRoot = options.cableRoot;
    this.onLaunch = options.onLaunch;
    this.baseRootPosition.copy(options.cableRoot.position);
    this.baseRootQuaternion.copy(options.cableRoot.quaternion);
    this.baseRootScale.copy(options.cableRoot.scale);
    const worldSpinAxis = options.camera.getWorldDirection(new THREE.Vector3()).normalize();
    this.cameraForwardWorld.copy(worldSpinAxis);
    this.screenRightWorld
      .setFromMatrixColumn(options.camera.matrixWorld, 0)
      .normalize();
    const parentQuaternion = new THREE.Quaternion();
    options.cableRoot.parent?.getWorldQuaternion(parentQuaternion);
    this.spinAxis.copy(worldSpinAxis).applyQuaternion(parentQuaternion.invert()).normalize();
    this.targetIds = options.targetIds.filter((id) => options.models.has(id)).slice(0, 2);
    const activeArrows = options.arrows.filter((arrow) => arrow.state !== 'removed');
    const center = new THREE.Vector3();
    let pointCount = 0;
    activeArrows.forEach((arrow) => arrow.samplePoints.forEach((point) => {
      center.add(point);
      pointCount += 1;
    }));
    if (pointCount > 0) center.multiplyScalar(1 / pointCount);
    this.centerOffset.copy(center);

    activeArrows.forEach((arrow, index) => {
      const model = options.models.get(arrow.definition.id);
      if (!model) return;
      const cableCenter = arrow.samplePoints.reduce(
        (sum, point) => sum.add(point),
        new THREE.Vector3(),
      ).multiplyScalar(1 / Math.max(1, arrow.samplePoints.length));
      const radial = cableCenter.sub(center);
      radial.addScaledVector(this.spinAxis, -radial.dot(this.spinAxis));
      const basePlanarRadius = radial.length();
      if (radial.lengthSq() < 0.02) {
        const fallback = new THREE.Vector3(1, 0, 0);
        if (Math.abs(fallback.dot(this.spinAxis)) > 0.9) fallback.set(0, 1, 0);
        radial.crossVectors(this.spinAxis, fallback).normalize();
        radial.applyAxisAngle(this.spinAxis, index * 2.399963229728653);
      }
      radial.normalize();
      const tangent = new THREE.Vector3().crossVectors(this.spinAxis, radial);
      if (tangent.lengthSq() < 0.01) {
        tangent.set(-radial.y, radial.x, 0);
      }
      tangent.normalize();
      this.entries.push({
        id: arrow.definition.id,
        model,
        basePosition: model.root.position.clone(),
        baseQuaternion: model.root.quaternion.clone(),
        radial,
        tangent,
        basePlanarRadius,
        ringExpansion: Math.max(MIN_RING_EXPANSION, TARGET_RING_RADIUS - basePlanarRadius),
        phaseOffset: index * 2.399963229728653,
        launched: false,
      });
    });

    options.cableRoot.position.copy(this.baseRootPosition).add(center);
    this.entries.forEach((entry) => {
      entry.model.root.position.copy(entry.basePosition).sub(center);
    });
    this.timelineElapsed = 0;
    this.launchOrder = [];
    this.launchElapsedSeconds = [];
    this.diagnosticsValue = {
      ...emptyDiagnostics(),
      active: this.entries.length > 0,
      phase: this.entries.length > 0 ? 'spin-up' : 'complete',
      targetIds: [...this.targetIds],
      remainingCount: this.entries.length,
    };
    return WASHER_ACTIVE_DURATION * 1_000;
  }

  update(deltaSeconds: number): void {
    if (!this.cableRoot || !this.diagnosticsValue.active) return;
    // Drive the visual timeline from the render loop's bounded delta instead
    // of wall-clock time. A slow frame can pause the picture briefly, but it
    // can no longer skip a large section of the regrouping animation when the
    // main thread resumes.
    this.timelineElapsed = Math.min(
      WASHER_ACTIVE_DURATION,
      this.timelineElapsed + THREE.MathUtils.clamp(deltaSeconds, 0, MAX_TIMELINE_STEP),
    );
    const elapsed = this.timelineElapsed;
    const phase = phaseAt(elapsed);
    const spin = this.spinAt(elapsed);
    const centrifugal = this.centrifugalAt(elapsed);
    const rebound = this.reboundAt(elapsed);
    const rotation = this.rotationScratch.setFromAxisAngle(
      this.spinAxis,
      spin.angle + rebound,
    );
    // Apply the view-facing drum rotation before the captured root pose. This
    // keeps the whole bundle turning in the screen plane while preserving its
    // authored orientation.
    this.cableRoot.quaternion.copy(this.baseRootQuaternion).premultiply(rotation);
    this.cableRoot.scale.copy(this.baseRootScale);

    if (elapsed >= FIRST_LAUNCH_AT) this.launchAt(0, elapsed);
    if (
      elapsed >= SECOND_LAUNCH_AT
      && this.firstLaunchElapsed >= 0
      && elapsed - this.firstLaunchElapsed >= SECOND_LAUNCH_AT - FIRST_LAUNCH_AT
    ) this.launchAt(1, elapsed);

    let totalEntryOffset = 0;
    let maxEntryOffset = 0;
    let minimumPlanarRadius = Number.POSITIVE_INFINITY;
    let totalPlanarRadius = 0;
    let visibleEntryCount = 0;
    // Keep a full ring through both launches, then collapse every positional
    // component on one eased curve. This avoids the two visible hitches caused
    // by radial, tangent, and axial offsets reaching zero at different times.
    const ringAmount = this.ringAmountAt(elapsed);
    this.entries.forEach((entry) => {
      if (entry.launched) return;
      const waveMotion = ringAmount;
      const wave = 0.98 + Math.sin(spin.angle * 0.42 + entry.phaseOffset) * 0.08 * waveMotion;
      // Rebound belongs to the drum's angular inertia above. Do not add it to
      // the cable's radial position: that makes the remaining cables jump
      // outward on the final beat instead of returning continuously.
      // Pull inner cables farther than outer cables so the spinning bundle
      // opens into a readable drum ring instead of merely inflating as a ball.
      const radialOffset = ringAmount * entry.ringExpansion * wave;
      const tangentialOffset = ringAmount * MAX_TANGENTIAL_DRIFT
        * Math.sin(spin.angle * 0.77 + entry.phaseOffset * 1.31);
      const axialOffset = ringAmount * MAX_AXIAL_DRIFT
        * Math.sin(spin.angle * 0.53 + entry.phaseOffset * 0.73);
      entry.model.root.position.copy(entry.basePosition)
        .sub(this.centerOffset)
        .addScaledVector(entry.radial, radialOffset)
        .addScaledVector(entry.tangent, tangentialOffset)
        .addScaledVector(this.spinAxis, axialOffset);
      entry.model.root.quaternion.copy(entry.baseQuaternion);
      entry.model.root.rotateY(Math.sin(spin.angle * 0.47 + entry.phaseOffset) * ringAmount * 0.28);
      entry.model.root.rotateZ(Math.sin(spin.angle * 0.73 + entry.phaseOffset * 0.6) * ringAmount * 0.2);
      const entryOffset = Math.sqrt(
        radialOffset * radialOffset
        + tangentialOffset * tangentialOffset
        + axialOffset * axialOffset,
      );
      totalEntryOffset += entryOffset;
      maxEntryOffset = Math.max(maxEntryOffset, entryOffset);
      const planarRadius = Math.sqrt(
        (entry.basePlanarRadius + radialOffset) ** 2
        + tangentialOffset * tangentialOffset,
      );
      minimumPlanarRadius = Math.min(minimumPlanarRadius, planarRadius);
      totalPlanarRadius += planarRadius;
      visibleEntryCount += 1;
    });

    this.diagnosticsValue = {
      ...this.diagnosticsValue,
      elapsed,
      phase,
      spinAngle: spin.angle,
      angularVelocity: spin.velocity,
      centrifugalAmount: centrifugal,
      averageEntryOffset: visibleEntryCount > 0 ? totalEntryOffset / visibleEntryCount : 0,
      maxEntryOffset,
      minimumPlanarRadius: visibleEntryCount > 0 ? minimumPlanarRadius : 0,
      averagePlanarRadius: visibleEntryCount > 0 ? totalPlanarRadius / visibleEntryCount : 0,
    };
    if (elapsed >= WASHER_ACTIVE_DURATION && this.launchOrder.length >= this.targetIds.length) {
      // Keep the inertial stop angle. Only collapse the individual cable offsets
      // back toward the shared drum center; do not rotate the bundle back to
      // its pre-skill viewing angle.
      this.cableRoot.scale.copy(this.baseRootScale);
      this.entries.forEach((entry) => {
        if (entry.launched) return;
        entry.model.root.position.copy(entry.basePosition).sub(this.centerOffset);
        entry.model.root.quaternion.copy(entry.baseQuaternion);
      });
      this.diagnosticsValue = {
        ...this.diagnosticsValue,
        active: false,
        phase: 'complete',
        remainingCount: this.entries.length - this.launchOrder.length,
      };
    }
  }

  reset(): void {
    if (this.cableRoot) {
      this.cableRoot.position.copy(this.baseRootPosition);
      this.cableRoot.quaternion.copy(this.baseRootQuaternion);
      this.cableRoot.scale.copy(this.baseRootScale);
    }
    this.entries.forEach((entry) => {
      entry.model.root.position.copy(entry.basePosition);
      entry.model.root.quaternion.copy(entry.baseQuaternion);
    });
    this.cableRoot = null;
    this.entries = [];
    this.targetIds = [];
    this.launchOrder = [];
    this.launchElapsedSeconds = [];
    this.onLaunch = null;
    this.firstLaunchElapsed = -1;
    this.timelineElapsed = 0;
    this.centerOffset.set(0, 0, 0);
    this.spinAxis.set(0, 0, 1);
    this.cameraForwardWorld.set(0, 0, -1);
    this.screenRightWorld.set(1, 0, 0);
    this.diagnosticsValue = emptyDiagnostics();
  }

  dispose(): void {
    this.reset();
  }

  private launchAt(index: number, elapsed: number): void {
    const id = this.targetIds[index];
    if (!id || this.launchOrder.includes(id) || elapsed < (index === 0 ? FIRST_LAUNCH_AT : SECOND_LAUNCH_AT)) return;
    const entry = this.entries.find((candidate) => candidate.id === id);
    if (!entry || entry.launched) return;
    this.cableRoot?.updateWorldMatrix(true, true);
    // Launch from fixed screen sides so neither cable disappears into the
    // top or bottom of the playfield. A small depth bias keeps the throw
    // feeling like it leaves the drum instead of sliding across its face.
    const side = index === 0 ? -1 : 1;
    const directionWorld = this.screenRightWorld.clone()
      .multiplyScalar(side)
      .addScaledVector(this.cameraForwardWorld, -0.16)
      .normalize();
    const bundleCenterWorld = this.cableRoot?.getWorldPosition(new THREE.Vector3())
      ?? new THREE.Vector3();
    const launched = this.onLaunch?.(id, { directionWorld, bundleCenterWorld }) ?? false;
    if (launched) {
      entry.launched = true;
      this.launchOrder.push(id);
      this.launchElapsedSeconds.push(elapsed);
      if (index === 0) this.firstLaunchElapsed = elapsed;
      this.diagnosticsValue = {
        ...this.diagnosticsValue,
        launchOrder: [...this.launchOrder],
        launchElapsedSeconds: [...this.launchElapsedSeconds],
        remainingCount: this.entries.length - this.launchOrder.length,
      };
    }
  }

  private ringAmountAt(elapsed: number): number {
    if (elapsed <= 0) return 0;
    if (elapsed < RING_EXPANSION_END) return smooth(elapsed / RING_EXPANSION_END);
    if (elapsed <= RING_COLLAPSE_START) return 1;
    if (elapsed >= REBOUND_END) return 0;
    return 1 - smooth(
      (elapsed - RING_COLLAPSE_START)
      / (REBOUND_END - RING_COLLAPSE_START),
    );
  }

  private centrifugalAt(elapsed: number): number {
    if (elapsed < 0.72) return THREE.MathUtils.lerp(0, 0.62, smooth(elapsed / 0.72));
    if (elapsed < CRUISE_END) return 0.62 + 0.38 * smooth((elapsed - 0.72) / (CRUISE_END - 0.72));
    if (elapsed < SLOWDOWN_END) return THREE.MathUtils.lerp(1, 0.12, smooth((elapsed - CRUISE_END) / (SLOWDOWN_END - CRUISE_END)));
    if (elapsed < REBOUND_END) return THREE.MathUtils.lerp(0.12, 0, smooth((elapsed - SLOWDOWN_END) / (REBOUND_END - SLOWDOWN_END)));
    // The ring has already finished regrouping before the final hold. Keeping
    // this exactly at zero removes the last-frame inward snap.
    return 0;
  }

  private reboundAt(elapsed: number): number {
    if (elapsed < SLOWDOWN_END || elapsed >= REBOUND_END) return 0;
    const progress = (elapsed - SLOWDOWN_END) / (REBOUND_END - SLOWDOWN_END);
    // Start and end with zero angular velocity. Easing the phase itself avoids
    // the tiny impulse that previously appeared when slowdown met rebound.
    const eased = smooth(progress);
    return Math.sin(eased * Math.PI * 2) * (1 - eased) * 0.08;
  }

  private spinAt(elapsed: number): { angle: number; velocity: number } {
    const spinUpDistance = MAX_ANGULAR_SPEED * SPIN_UP_END * 0.5;
    const cruiseDistance = MAX_ANGULAR_SPEED * (CRUISE_END - SPIN_UP_END);
    if (elapsed < SPIN_UP_END) {
      const progress = elapsed / SPIN_UP_END;
      return {
        angle: spinUpDistance * progress * progress,
        velocity: MAX_ANGULAR_SPEED * progress,
      };
    }
    if (elapsed < CRUISE_END) {
      return {
        angle: spinUpDistance + MAX_ANGULAR_SPEED * (elapsed - SPIN_UP_END),
        velocity: MAX_ANGULAR_SPEED,
      };
    }
    if (elapsed < SLOWDOWN_END) {
      const progress = (elapsed - CRUISE_END) / (SLOWDOWN_END - CRUISE_END);
      return {
        angle: spinUpDistance + cruiseDistance
          + MAX_ANGULAR_SPEED * (SLOWDOWN_END - CRUISE_END) * (progress - progress * progress * 0.5),
        velocity: MAX_ANGULAR_SPEED * (1 - progress),
      };
    }
    const endAngle = spinUpDistance + cruiseDistance
      + MAX_ANGULAR_SPEED * (SLOWDOWN_END - CRUISE_END) * 0.5;
    return {
      angle: endAngle,
      velocity: 0,
    };
  }

  private onLaunch: ((cableId: string, launch: Readonly<{
    directionWorld: THREE.Vector3;
    bundleCenterWorld: THREE.Vector3;
  }>) => boolean) | null = null;
}
